export default defineContentScript({
  matches: ["*://*.google.com/*"],
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
        id: el.id || null,
        className: el.className || null,
        name: el.getAttribute("name") || null,
        tagName: tag || null,
        linkText: (tag === "a" && eleText) || null,
        partialLinkText: tag === "a" ? eleText.split(" ")[0] : null,
        cssSelector,
        XPath,
      };

      const attributesList = Object.entries(seleniumLocators)
        .filter(([_, value]) => !!value)
        .map(
          ([
            key,
            value,
          ]) => `<li style="overflow-wrap: break-word; word-break: break-word;"><strong>${key}:</strong> ${value}</li>
`
        )
        .join("");

      el.style.cssText += highlightStyle;
      if (floatingEl) floatingEl.remove();

      floatingEl = document.createElement("div");
      floatingEl.id = "floating-popup";
      floatingEl.style.cssText = `
    position: fixed;
    top: ${e.clientY + 10}px;
    left: ${e.clientX + 10}px;
    background: #fff;
    border: 1px solid #ccc;
    padding: 10px;
    font-size: 14px;
    z-index: 999999;
    max-width: 300px;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
  `;

      floatingEl.innerHTML = `
    <strong>Selenium locators :</strong><br>
    <ul>${attributesList || "<li>No usefull locators found!!</li>"}
      </ul>
  `;

      const closeBtn = document.createElement("button");
      closeBtn.innerText = "×";
      closeBtn.style.cssText = `
      position: absolute; 
      top: 5px; 
      right: 5px; 
      border: none; 
      background: transparent; 
      font-size: 18px; 
      cursor: pointer
      `;
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        floatingEl?.remove();
      };
      floatingEl.appendChild(closeBtn);
      document.body.appendChild(floatingEl);
    }
  },
});
