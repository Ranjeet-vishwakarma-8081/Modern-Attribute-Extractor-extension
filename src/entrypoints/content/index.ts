export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("Hello content.");

    let isActive = false;
    let floatingEl: HTMLElement | null = null;

    const highlightStyle = `
  outline: 2px solid red;
  cursor: crosshair;
`;

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "START") {
        console.log("START Event received!!");
        activateSelector();
      } else if (message.action === "STOP") {
        console.log("STOP Event received!!");
        deactivateSelector();
      }
    });

    function getElementXPath(el: HTMLElement): string {
      const parts = [];
      while (el && el.nodeType === Node.ELEMENT_NODE) {
        let index = 1;
        let sibling = el.previousElementSibling;

        while (sibling) {
          if (sibling.nodeName === el.nodeName) {
            index++;
          }
          sibling = sibling.previousElementSibling;
        }

        const tagName = el.nodeName.toLowerCase();
        const part = `${tagName}[${index}]`;
        parts.unshift(part);

        el = el.parentElement!;
      }

      return `/${parts.join("/")}`;
    }

    function getSmartXPath(el: HTMLElement): string {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";

      const tag = el.tagName.toLowerCase();
      const preferredAttrs = [
        "id",
        "name",
        "type",
        "placeholder",
        "aria-label",
        "role",
        "title",
        "alt",
        "data-testid",
        "data-test",
        "class",
      ];

      for (const attr of preferredAttrs) {
        const val = el.getAttribute(attr);
        if (val) {
          if (
            [
              "id",
              "name",
              "type",
              "placeholder",
              "aria-label",
              "role",
              "title",
              "alt",
              "data-testid",
              "data-test",
            ].includes(attr)
          ) {
            return `//${tag}[@${attr}="${val}"]`;
          }
          if (attr === "class") {
            const firstClass = val.trim().split(/\s+/)[0];
            return `//${tag}[contains(@class, "${firstClass}")]`;
          }
        }
      }
      return getElementXPath(el);
    }

    function getCSSSelector(el: Element): string {
      if (!(el instanceof Element)) return "";

      const path = [];

      while (el.nodeType === Node.ELEMENT_NODE && el !== document.body) {
        let selector = el.nodeName.toLowerCase();

        // Add ID if available and unique
        if (el.id) {
          selector += `#${el.id}`;
          path.unshift(selector);
          break; // ID is unique, stop here
        }

        // Add class names
        if (el.className) {
          const classNames = Array.from(el.classList).filter((cls) => !!cls);
          if (classNames.length) {
            selector += "." + classNames[0]; // You can use more classes if needed
          }
        }

        // Handle sibling index
        const sibling = el.parentNode?.children;
        if (sibling) {
          const sameTagSiblings = Array.from(sibling).filter(
            (sib) => sib.nodeName === el.nodeName
          );

          if (sameTagSiblings.length > 1) {
            const index = sameTagSiblings.indexOf(el) + 1;
            selector += `:nth-of-type(${index})`;
          }
        }

        path.unshift(selector);
        el = el.parentElement!;
      }

      return path.join(" > ");
    }

    function activateSelector() {
      isActive = true;
      document.addEventListener("click", onClick, true);
    }

    function deactivateSelector() {
      isActive = false;
      document.removeEventListener("click", onClick, true);
      if (floatingEl) floatingEl.remove();
    }

    function onClick(e: MouseEvent) {
      if (!isActive) return;
      const el = e.target as HTMLElement;

      if (floatingEl && floatingEl.contains(el)) return;

      e.preventDefault();
      e.stopPropagation();

      const tag = el.tagName.toLowerCase();
      const eleText = el.textContent?.trim() || "";
      const XPath = getSmartXPath(el);
      const cssSelector = getCSSSelector(el);

      const seleniumLocators = {
        tagName: tag || null,
        id: el.id || null,
        className: el.className || null,
        name: el.getAttribute("name") || null,
        linkText: (tag === "a" && eleText) || null,
        partialLinkText: tag === "a" ? eleText.split(" ")[0] : null,
        cssSelector,
        XPath,
      };

      const attributesList = Object.entries(seleniumLocators)
        .filter(([_, value]) => !!value)
        .map(
          ([key, value]) => `<li><strong>${key}:</strong> ${value}</li>
`
        )
        .join("");

      el.style.cssText += highlightStyle;
      if (floatingEl) floatingEl.remove();

      floatingEl = document.createElement("div");
      floatingEl.id = "floating-popup";

      floatingEl.innerHTML = `
      <div class="popup">
        <div class="header">
          <span>Selenium Locators</span>
          <button id="close-btn" class="close">&times;</button>
        </div>
        <ul class="locator-list">${
          attributesList || "<li>No useful locators found.</li>"
        }</ul>
      </div>
      `;

      // Inject style via CSS classes
      const popupStyle = document.createElement("style");
      popupStyle.textContent = `
      .popup {
        position: fixed;
        top: ${Math.min(e.clientY + 10, window.innerHeight - 300)}px;
        left: ${Math.min(e.clientX + 10, window.innerWidth - 340)}px;
        background: #fefefe;
        border-radius: 14px;
        border: 1px solid #ddd;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
        width: 320px;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        color: #1f2937;
        overflow: hidden;
        z-index: 999999;
        animation: popupFade 0.3s ease-in-out;
      }

      .header {
        background-color:  #22c55e;
        padding: 10px 14px;
        font-weight: 600;
        font-size: 15px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .close{
        background: transparent;
        border: none;
        color: #f3f4f6;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        transition: color 0.2s ease;
      }

      .close:hover {
        color: #fff;
      }

      .locator-list {
        padding: 12px 16px;
        list-style: none;
        max-height: 260px;
        overflow-y: auto;
      }

      .locator-list li {
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px dashed #e5e7eb;
        word-break: break-word;
        overflow-wrap: break-word;
      }

      @keyframes popupFade {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }`;

      document.head.appendChild(popupStyle);

      floatingEl.querySelector("#close-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        floatingEl?.remove();
      });
      document.body.appendChild(floatingEl);
    }
  },
});
