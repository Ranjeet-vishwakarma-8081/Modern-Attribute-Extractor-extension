export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("Hello content.");

    let isActive = false;
    let stopRecorderEle: HTMLElement | null = null;
    let seleniumLocators: Object;

    let allSeleniumLocators: Object[] = [];

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
      if (document.getElementById("stop-recorder-btn")) return;

      stopRecorderEle = document.createElement("div");
      stopRecorderEle.id = "stop-recorder-btn";
      stopRecorderEle.innerHTML = `<div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 20px;
      background-color: #ef4444;
      color: white;
      font-weight: 600;
      font-family: sans-serif;
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      cursor: pointer;
      transition: background-color 0.3s ease;">
      ⛔ Stop Recording
    </div>
  `;

      // ⛔ Add click to deactivate
      stopRecorderEle.addEventListener("click", (e) => {
        e.stopPropagation();
        deactivateSelector();
        chrome.runtime.sendMessage({
          action: "OPEN_LOCATOR_POPUP",
          allSeleniumLocators,
        });
        stopRecorderEle?.remove();
        console.log("Stopped recording");
      });

      document.body.appendChild(stopRecorderEle);
    }

    function deactivateSelector() {
      isActive = false;
      document.removeEventListener("click", onClick, true);
      if (stopRecorderEle) stopRecorderEle.remove();
    }

    function onClick(e: MouseEvent) {
      if (!isActive) return;

      console.log("onclick event - ", e);
      const el = e.target as HTMLElement;
      if (!el || !(el instanceof HTMLElement)) return;

      console.log("target element -", el);
      if (stopRecorderEle && stopRecorderEle.contains(el)) return;

      e.preventDefault();
      e.stopPropagation();

      const tag = el.tagName.toLowerCase();
      const eleText = el.textContent?.trim() || "";

      seleniumLocators = {
        tagName: tag || null,
        id: el.id || null,
        className: el.className || null,
        name: el.getAttribute("name") || null,
        linkText: (tag === "a" && eleText) || null,
        partialLinkText: tag === "a" ? eleText.split(" ")[0] : null,
        cssSelector: getCSSSelector(el),
        xPath: getSmartXPath(el),

        eventName: e.type || null,
        value: null,
      };

      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        const inputEl = el;

        const inputHandler = () => {
          seleniumLocators = {
            ...seleniumLocators,
            value: inputEl.value,
          };
          console.log("Updated Input value -", inputEl.value);
          allSeleniumLocators.push({
            ...seleniumLocators,
          });

          inputEl.removeEventListener("change", inputHandler);
        };

        inputEl.addEventListener("change", inputHandler);
      } else {
        allSeleniumLocators.push({ ...seleniumLocators });
      }
      console.log("All seleniumLocators -", allSeleniumLocators);
    }
  },
});
