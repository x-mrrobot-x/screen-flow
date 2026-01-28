const Analyzer = (function () {
  "use strict";

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

  async function init() {
      
        const apps = AppState.getApps();
        let folders = AppState.getFolders();

        try {
          const screenshotsOutput = await ENV.runProcess(
            "get_folder_stats",
            ENV.ORGANIZED_SCREENSHOTS_PATH
          );
          if (screenshotsOutput) {
            folders = updateFoldersFromScan(
              screenshotsOutput,
              "screenshots",
              apps,
              folders
            );
          }
        } catch (error) {
          console.error(
            "Erro ao processar estatísticas de screenshots:",
            error
          );
        }

        try {
          const screenrecordingsOutput = await ENV.runProcess(
            "get_folder_stats",
            ENV.ORGANIZED_RECORDINGS_PATH
          );
          if (screenrecordingsOutput) {
            folders = updateFoldersFromScan(
              screenrecordingsOutput,
              "screenrecordings",
              apps,
              folders
            );
          }
        } catch (error) {
          console.error(
            "Erro ao processar estatísticas de screenrecordings:",
            error
          );
        }

        console.log("fim");
        AppState.setFolders(folders);
  }

  return {
    init
  };
})();
