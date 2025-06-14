const App = () => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["attributeSelectorActive"], (res) => {
      setIsActive(res.attributeSelectorActive || false);
    });
  }, []);

  const handleToggleSelector = () => {
    const newValue = !isActive;
    setIsActive(newValue);

    chrome.storage.local.set({
      attributeSelectorActive: newValue,
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: newValue ? "START" : "STOP",
        });
      }
    });
    // chrome.runtime.sendMessage({
    //   action: newValue ? "START" : "STOP",
    // });
    console.log(`${newValue ? "START" : "STOP"} Message Send`);
  };

  return (
    <div className="p-4 w-96">
      <h1 className="text-base">Attribute Extractor</h1>
      <button
        type="button"
        onClick={handleToggleSelector}
        className={`w-full py-2 px-4 rounded text-white font-semibold ${
          isActive
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {isActive ? "STOP" : "START"} SELECTOR
      </button>
    </div>
  );
};

export default App;
