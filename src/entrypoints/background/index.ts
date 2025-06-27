export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
      attributeSelectorActive: false,
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, allSeleniumLocators } = message;

    if (action === "OPEN_LOCATOR_POPUP") {
      console.log("OPEN_LOCATOR_POPUP block executed!");
      console.log("All selenium locators - ", allSeleniumLocators);

      // Save allSeleniumLocators Temporarily
      chrome.storage.local.set({ allSeleniumLocators });
      chrome.windows.create(
        {
          url: chrome.runtime.getURL("index.html"),
          type: "popup",
          width: 800,
          height: 800,
        },
        () => {
          console.log("Popup opened");
        }
      );
    }
  });
});
