const SubfolderMonitor = (function () {
  "use strict";

  function updateFoldersFromScan(
    scriptOutput,
    type,
    existingFolders,
    folderTimestamps
  ) {
    if (!scriptOutput || scriptOutput.length === 0) {
      return existingFolders;
    }

    const statsKey = type === "screenshots" ? "ss" : "sr";
    const timestampKey = `disk_ts_${statsKey}`;
    const folderData = scriptOutput.map(line => {
      const [name, count] = line.split(",");
      return {
        name: name.trim(),
        count: parseInt(count.trim(), 10) || 0
      };
    });

    let currentData = [...existingFolders];
    const apps = AppState.getApps();
    const appNameToPkgMap = apps.reduce((map, app) => {
      map[app.name] = app.pkg;
      return map;
    }, {});

    folderData.forEach(({ name, count }) => {
      const existingIndex = currentData.findIndex(f => f.name === name);
      const diskTimestamp = folderTimestamps[name];

      if (existingIndex !== -1) {
        const folder = currentData[existingIndex];
        folder.stats[statsKey] = count;
        folder[timestampKey] = diskTimestamp;
        if (folder.disk_ts) {
          delete folder.disk_ts;
        }
      } else {
        const pkg = appNameToPkgMap[name] || name;
        if (!appNameToPkgMap[name]) {
            Logger.warn(`Package não encontrado para a pasta: ${name}, usando o nome da pasta como pkg.`);
        }
        const newEntry = {
          id: String(Date.now()),
          name: name,
          pkg: pkg,
          stats: {
            ss: 0,
            sr: 0
          },
          cleaner: {
            ss: { on: false, days: 7 },
            sr: { on: false, days: 7 }
          }
        };
        newEntry.stats[statsKey] = count;
        newEntry[timestampKey] = diskTimestamp;
        currentData.push(newEntry);
      }
    });

    Logger.debug(
      `[SubfolderMonitor] Dados de pastas atualizados para o tipo '${type}'.`
    );
    return currentData;
  }

  function updateFoldersData(scriptOutput, type, folderTimestamps) {
    Logger.info(
      `[SubfolderMonitor] Recebendo dados de contagem para o tipo: ${type}.`
    );
    try {
      const existingFolders = AppState.getFolders();
      const updatedFolders = updateFoldersFromScan(
        scriptOutput,
        type,
        existingFolders,
        folderTimestamps
      );
      AppState.setFolders(updatedFolders);
    } catch (error) {
      Logger.error(
        `[SubfolderMonitor] Falha ao processar dados para o tipo: ${type}`,
        error
      );
    }
  }

  async function processFolderType(type, path) {
    Logger.debug(`[SubfolderMonitor] Iniciando verificação para o tipo: ${type}`);
    try {
      const subfolderList = await TaskQueue.add("get_subfolders", [path], "shell");

      if (!subfolderList || subfolderList.length === 0) {
        Logger.debug(`[SubfolderMonitor] Nenhuma subpasta encontrada para ${type}.`);
        return {};
      }

      const currentDiskFolders = subfolderList.reduce((acc, item) => {
        const [name, ts] = item.split(",");
        acc[name] = ts;
        return acc;
      }, {});

      const existingFolders = AppState.getFolders();
      const stateFolderMap = existingFolders.reduce((map, folder) => {
        map[folder.name] = folder;
        return map;
      }, {});

      const timestampKey = `disk_ts_${type === "screenshots" ? "ss" : "sr"}`;

      const foldersToUpdate = Object.keys(currentDiskFolders).filter(name => {
        const folderInState = stateFolderMap[name];
        return (
          !folderInState ||
          folderInState[timestampKey] !== currentDiskFolders[name]
        );
      });

      if (foldersToUpdate.length > 0) {
        Logger.info(
          `[SubfolderMonitor] As seguintes pastas precisam de atualização para ${type}:`,
          foldersToUpdate
        );
        const countsResult = await TaskQueue.add(
          "get_item_counts_batch",
          [path, JSON.stringify(foldersToUpdate)],
          "shell"
        );

        if (countsResult && countsResult.length > 0) {
          updateFoldersData(countsResult, type, currentDiskFolders);
        }
      } else {
        Logger.debug(
          `[SubfolderMonitor] Sem alterações de timestamp detectadas para ${type}.`
        );
      }

      return currentDiskFolders;
    } catch (error) {
      Logger.error(
        `[SubfolderMonitor] Erro ao processar o tipo de pasta '${type}':`,
        error
      );
      return {};
    }
  }

  async function loadFoldersData() {
    try {
      const [screenshotFolders, screenrecordingFolders] = await Promise.all([
        processFolderType("screenshots", ENV.ORGANIZED_SCREENSHOTS_PATH),
        processFolderType("screenrecordings", ENV.ORGANIZED_RECORDINGS_PATH)
      ]);

      Logger.debug(
        "[SubfolderMonitor] Verificações concluídas. Executando a limpeza do estado."
      );

      const foldersOnDisk = new Set([
        ...Object.keys(screenshotFolders || {}),
        ...Object.keys(screenrecordingFolders || {})
      ]);

      const foldersInState = AppState.getFolders();
      const foldersToKeep = foldersInState.filter(f =>
        foldersOnDisk.has(f.name)
      );

      if (foldersToKeep.length < foldersInState.length) {
        const deletedNames = foldersInState
          .filter(f => !foldersOnDisk.has(f.name))
          .map(f => f.name);
        Logger.info(
          "[SubfolderMonitor] Removendo pastas do estado que não existem mais no disco:",
          deletedNames
        );
        AppState.setFolders(foldersToKeep);
      } else {
        Logger.debug("[SubfolderMonitor] Nenhuma pasta obsoleta encontrada no estado.");
      }
    } catch (error) {
      Logger.error(
        "[SubfolderMonitor] Erro durante o ciclo de verificação e limpeza:",
        error
      );
    }
  }

  function init() {
    EventBus.on('appmonitor:ready', loadFoldersData);
    Logger.debug("[SubfolderMonitor] Aguardando o evento 'appmonitor:ready'.");
  }
  
  function runScan(){
    loadFoldersData()
  }

  return {
    runScan,
    init
  };
})();
