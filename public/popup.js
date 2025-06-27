document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.local.get("allSeleniumLocators");
  const allSeleniumLocators = result.allSeleniumLocators;
  console.log("All selenium locators loaded -", allSeleniumLocators);

  if (allSeleniumLocators) {
    const tableRows = allSeleniumLocators
      .map((locator, index) => {
        const { value = "-", eventName, ...restLocators } = locator;

        const locatorString = Object.entries(restLocators)
          .map(([key, val]) => {
            if (val) return `<div><strong>${key}</strong>: ${val}</div>`;
          })
          .join("");
        return `
      <tr>
        <td>${String(index + 1).padStart(2, "0")}</td>
        <td>${eventName || "-"}</td>
        <td>${locatorString || "-"}</td>
        <td>${value || "-"}</td>
      </tr>`;
      })
      .join("");

    const tableHTML = `
    <table style="width:100%; border-collapse: collapse; font-size: 16px;" border="1">
      <thead>
        <tr>
          <th>Sr. No.</th>
          <th>Command</th>
          <th>Locators</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    `;

    const targetEle = document.getElementById("seleniumList");
    targetEle.innerHTML = tableHTML;
    console.log("all attribute list -", attributesList);
    console.log(targetEle);
  }
});
