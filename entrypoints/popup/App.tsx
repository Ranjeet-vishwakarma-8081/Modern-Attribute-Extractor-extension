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
    console.log(`${newValue ? "START" : "STOP"} Message Send`);
  };

  return (
    <div className="p-5 space-y-4 text-gray-800 shadow-md w-96">
      <h1 className="text-xl font-bold text-center">Attribute Extractor</h1>
      <p className="text-sm text-gray-500">
        Enable selection mode to extract attributes from any element on the
        page.
      </p>
      <button
        type="button"
        onClick={handleToggleSelector}
        className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-colors duration-200 ${
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
