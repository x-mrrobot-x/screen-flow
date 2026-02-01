const SubfolderMonitor = (function () {
  const SCRIPT_PATH = ENV.WORK_DIR + "src/features/dashboard/process/script.sh";
  const CACHE_KEY = "subfolder_last_modified_cache";

  let lastModifiedCache = {};

  function _loadCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        lastModifiedCache = JSON.parse(cached);
      }
    } catch (e) {
      Logger.error("Failed to load subfolder modification cache.", e);
      lastModifiedCache = {};
    }
  }

  function _saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(lastModifiedCache));
    } catch (e) {
      Logger.error("Failed to save subfolder modification cache.", e);
    }
  }

  async function _scanDirectory(directoryPath) {
    try {
      const output = await ENV.execute({
        command: "get_subfolders",
        args: [directoryPath]
      });
      
      const newSubfolders = new Map();
      if (output && output.length > 0) {
        output.forEach(line => {
          if (!line) return;
          const parts = line.split(",");
          if (parts.length < 2) return;
          const subfolder = parts[0];
          const lastModified = parseInt(parts[1], 10);
          if (!isNaN(lastModified)) {
            newSubfolders.set(subfolder, lastModified);
          }
        });
      }

      if (!lastModifiedCache[directoryPath]) {
        lastModifiedCache[directoryPath] = {};
      }
      const directoryCache = lastModifiedCache[directoryPath];

      // Check for deleted folders
      for (const cachedSubfolder in directoryCache) {
        if (!newSubfolders.has(cachedSubfolder)) {
            Logger.info(`Subfolder ${cachedSubfolder} appears to be deleted. Removing from cache.`);
            delete directoryCache[cachedSubfolder];
        }
      }

      // Check for new or modified folders
      for (const [subfolder, lastModified] of newSubfolders.entries()) {
        const cachedLastModified = directoryCache[subfolder];
        
        if (cachedLastModified !== lastModified) {
          Logger.info(`Subfolder ${subfolder} has been modified or is new. Enqueuing for count.`);
          SubfolderCounter.enqueue(directoryPath, subfolder);
          directoryCache[subfolder] = lastModified;
        }
      }

    } catch (e) {
      Logger.error(`Error scanning directory ${directoryPath}:`, e);
    }
  }

  async function runScan() {
    EventBus.emit('subfolder-scan:started');
    _loadCache();

    const directoriesToScan = [
      ENV.ORGANIZED_SCREENSHOTS_PATH,
      ENV.ORGANIZED_RECORDINGS_PATH
    ];

    // The new implementation uses async/await, making the calls sequential.
    for (const path of directoriesToScan) {
      if (path) {
        await _scanDirectory(path);
      }
    }

    _saveCache();
    EventBus.emit('subfolder-scan:completed');
    Logger.user("Análise de pastas concluída.", "success");
  }

  function init() {
    runScan();
  }

  return {
    init,
    runScan
  };
})();
