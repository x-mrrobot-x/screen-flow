const Analyzer = (function () {
  "use strict";

  const TASK_NAME = "SO - HANDLE ACTIONS";
  const TASK_PRIORITY = 10;
  const ACTION_LOAD_SS = "load_ss_folder";
  const ACTION_LOAD_SR = "load_sr_folder";

  // A nova função baseada na lógica do usuário
  function updateFoldersFromScan(
    scriptOutput,
    type,
    appsArray,
    existingFolders
  ) {
    const statsKey = type === "screenshots" ? "ss" : "sr";

    const lines = scriptOutput.map(line => line.trim());
    if (lines.length === 0) {
      return existingFolders;
    }

    const folderData = lines.map(line => {
      const [name, count] = line.split(",");
      return {
        name: name.trim(),
        count: parseInt(count.trim(), 10) || 0
      };
    });

    let currentData = [...existingFolders];

    const apps = AppState.getApps();
    const currentFolders = currentData.map(folder => folder.name);

    const appNameToPkgMap = apps.reduce((map, app) => {
      map[app.name] = app.pkg;
      return map;
    }, {});

    folderData.forEach(({ name, count }) => {
      const existingIndex = currentFolders.indexOf(name);
      const timestamp = Date.now();

      if (existingIndex !== -1) {
        currentData[existingIndex].stats[statsKey] = count;
        currentData[existingIndex].stats.lu = timestamp;
      } else {
        let pkg = appNameToPkgMap[name];
        if (!pkg) {
          console.warn(
            `Package não encontrado para a pasta: ${name}, pulando.`
          );
          pkg = name;
        }

        const newEntry = {
          id: timestamp.toString(),
          name: name,
          pkg: pkg,
          stats: {
            ss: type === "screenshots" ? count : 0,
            sr: type === "screenrecordings" ? count : 0,
            lu: timestamp
          },
          cleaner: {
            ss: { on: false, days: 7 },
            sr: { on: false, days: 7 }
          }
        };
        currentData.push(newEntry);
      }
    });
    console.log(currentData);
    return currentData;
  }

  function updateFoldersData(scriptOutput, type) {
    console.log(`Received folders data from Tasker for type: ${type}.`);
    try {
      const apps = AppState.getApps();
      const existingFolders = AppState.getFolders();
      const updatedFolders = updateFoldersFromScan(
        scriptOutput,
        type,
        apps,
        existingFolders
      );
      AppState.setFolders(updatedFolders);
    } catch (error) {
      console.error(
        `Failed to parse or set folders data for type: ${type}`,
        error
      );
    }
  }

  function loadFoldersData() {
    try {
      const ssConfig = {
        file_path: ENV.WORK_DIR + "src/data/screenshots_subfolders.json",
        folder_path: ENV.ORGANIZED_SCREENSHOTS_PATH,
        type: "screenshots",
        onload: `App.updateFoldersData(%data, "%config.type")`
      };
      ENV.runTask(
        TASK_NAME,
        TASK_PRIORITY,
        ACTION_LOAD_SS,
        JSON.stringify(ssConfig)
      );

      const srConfig = {
        file_path: ENV.WORK_DIR + "src/data/screenrecordings_subfolders.json",
        folder_path: ENV.ORGANIZED_RECORDINGS_PATH,
        type: "screenrecordings",
        onload: `App.updateFoldersData(%data, "%config.type")`
      };
      ENV.runTask(
        TASK_NAME,
        TASK_PRIORITY,
        ACTION_LOAD_SR,
        JSON.stringify(srConfig)
      );
    } catch (error) {
      console.error("Failed to trigger folder data loading:", error);
    }
  }

  function init() {
    loadFoldersData();
  }

  return {
    init,
    loadFoldersData,
    updateFoldersData
  };
})();
