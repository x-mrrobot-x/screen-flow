const SubfolderCounter = (function () {
  const MAX_CONCURRENT = 5;

  const queue = [];
  let activeJobs = 0;

  let internalFolders = [];
  let isBatchRunning = false;

  function _updateFolderData(directoryPath, subfolder, count) {
    const folderIndex = internalFolders.findIndex(f => f.name === subfolder);
    const timestamp = Date.now();
    const type = directoryPath.includes("Screenshots") ? "ss" : "sr";

    if (folderIndex > -1) {
      internalFolders[folderIndex].stats[type] = count;
      internalFolders[folderIndex].stats.lu = timestamp;
    } else {
      const apps = AppState.getApps();
      const appNameToPkgMap = apps.reduce((map, app) => {
        map[app.name] = app.pkg;
        return map;
      }, {});

      let pkg = appNameToPkgMap[subfolder];
      if (!pkg) {
        console.warn(
          `SubfolderCounter: Package not found for folder: ${subfolder}. Using folder name as package.`
        );
        pkg = subfolder;
      }

      const newEntry = {
        id: timestamp.toString(),
        name: subfolder,
        pkg: pkg,
        stats: {
          ss: type === "ss" ? count : 0,
          sr: type === "sr" ? count : 0,
          lu: timestamp
        },
        cleaner: {
          ss: { on: false, days: 7 },
          sr: { on: false, days: 7 }
        }
      };
      internalFolders.push(newEntry);
    }

    EventBus.emit("subfolder-count-updated", {
      directoryPath,
      subfolder,
      count: count
    });
  }

  async function _executeCount(directoryPath, subfolder) {
    try {
      const fullPath = `${directoryPath}/${subfolder}`;
      const count = await ENV.execute({
        command: "get_item_count",
        args: [fullPath]
      });
      const parsedCount = parseInt(count, 10);

      if (isNaN(parsedCount)) {
        console.warn(
          `Could not parse item count for ${fullPath}. Received:`,
          count
        );
        return;
      }

      _updateFolderData(directoryPath, subfolder, parsedCount);
    } catch (error) {
      console.error(`Failed to count items for ${subfolder}:`, error);
    }
  }

  async function _processNext() {
    if (isBatchRunning && queue.length === 0 && activeJobs === 0) {
      AppState.setFolders(internalFolders);
      isBatchRunning = false;
      console.log(
        "SubfolderCounter: Batch update complete. Folders saved to AppState."
      );
      return;
    }

    if (activeJobs >= MAX_CONCURRENT || queue.length === 0) {
      return;
    }

    activeJobs++;
    const { directoryPath, subfolder } = queue.shift();

    try {
      await _executeCount(directoryPath, subfolder);
    } finally {
      activeJobs--;
      _processNext();
    }
  }

  function enqueue(directoryPath, subfolder) {
    if (!isBatchRunning) {
      internalFolders = JSON.parse(JSON.stringify(AppState.getFolders()));
      isBatchRunning = true;
    }

    if (
      !queue.some(
        item =>
          item.subfolder === subfolder && item.directoryPath === directoryPath
      )
    ) {
      queue.push({ directoryPath, subfolder });
    }
    _processNext();
  }

  return {
    enqueue
  };
})();
