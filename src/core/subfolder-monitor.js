const SubfolderMonitor = (function () {
  "use strict";

  function createAppPackageMap(apps) {
    const map = new Map();
    if (apps?.length) {
      for (const app of apps) {
        map.set(app.name, app.pkg);
      }
    }
    return map;
  }

  function createFolderMap(folders) {
    const map = new Map();
    for (const folder of folders) {
      map.set(folder.name, folder);
    }
    return map;
  }

  function parseFolderLine(line) {
    const commaIndex = line.indexOf(",");
    if (commaIndex === -1) return null;

    return {
      name: line.slice(0, commaIndex).trim(),
      count: parseInt(line.slice(commaIndex + 1).trim(), 10) || 0
    };
  }

  function updateExistingFolder(folder, statsKey, count, timestamp) {
    if (!folder[statsKey]) {
      folder[statsKey] = { cleaner: { on: false, days: 7 } };
    }
    folder[statsKey].count = count;
    folder[statsKey].mtime = timestamp;
  }

  function createNewFolder(name, pkg, statsKey, count, timestamp) {
    return {
      id: Math.random().toString(36).substring(2),
      name: name,
      pkg: pkg,
      [statsKey]: {
        count: count,
        cleaner: { on: false, days: 7 },
        mtime: timestamp
      }
    };
  }

  function updateFoldersFromScan(
    scriptOutput,
    type,
    existingFolders,
    folderTimestamps
  ) {
    if (!scriptOutput?.length) {
      return existingFolders;
    }

    const statsKey = type === "screenshots" ? "ss" : "sr";
    const appNameToPkgMap = createAppPackageMap(AppState.getApps());
    const folderMap = createFolderMap(existingFolders);

    for (const line of scriptOutput) {
      const parsed = parseFolderLine(line);
      if (!parsed) continue;

      const { name, count } = parsed;
      const diskTimestamp =
        folderTimestamps.get?.(name) || folderTimestamps[name];
      let folder = folderMap.get(name);

      if (folder) {
        updateExistingFolder(folder, statsKey, count, diskTimestamp);
      } else {
        const pkg = appNameToPkgMap.get(name) || name;

        if (!appNameToPkgMap.has(name)) {
          Logger.warn(
            `Package não encontrado para a pasta: ${name}, usando o nome da pasta como pkg.`
          );
        }

        folder = createNewFolder(name, pkg, statsKey, count, diskTimestamp);
        folderMap.set(name, folder);
      }
    }

    Logger.debug(
      `[SubfolderMonitor] Dados de pastas atualizados para o tipo '${type}'.`
    );
    return Array.from(folderMap.values());
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

  function parseDiskFolders(subfolderList) {
    const diskFolders = new Map();

    for (const item of subfolderList) {
      const commaIndex = item.indexOf(",");
      if (commaIndex !== -1) {
        const name = item.slice(0, commaIndex);
        const timestamp = item.slice(commaIndex + 1);
        diskFolders.set(name, timestamp);
      }
    }

    return diskFolders;
  }

  function needsFolderUpdate(folderInState, statsKey, diskTimestamp) {
    return (
      !folderInState ||
      !folderInState[statsKey] ||
      String(folderInState[statsKey].mtime) !== diskTimestamp
    );
  }

  function findFoldersToUpdate(diskFolders, stateFolderMap, statsKey) {
    const foldersToUpdate = [];

    for (const [name, diskTimestamp] of diskFolders) {
      const folderInState = stateFolderMap.get(name);

      if (needsFolderUpdate(folderInState, statsKey, diskTimestamp)) {
        foldersToUpdate.push(name);
      }
    }

    return foldersToUpdate;
  }

  async function processFolderType(type, path) {
    Logger.debug(
      `[SubfolderMonitor] Iniciando verificação para o tipo: ${type}`
    );

    try {
      const subfolderList = await TaskQueue.add(
        "get_subfolders",
        [path],
        "shell"
      );

      if (!subfolderList?.length) {
        Logger.debug(
          `[SubfolderMonitor] Nenhuma subpasta encontrada para ${type}.`
        );
        return new Map();
      }

      const diskFolders = parseDiskFolders(subfolderList);
      const stateFolderMap = createFolderMap(AppState.getFolders());
      const statsKey = type === "screenshots" ? "ss" : "sr";
      const foldersToUpdate = findFoldersToUpdate(
        diskFolders,
        stateFolderMap,
        statsKey
      );

      if (foldersToUpdate.length > 0) {
        Logger.info(
          `[SubfolderMonitor] ${foldersToUpdate.length} pasta(s) precisam de atualização para ${type}:`,
          foldersToUpdate
        );

        const countsResult = await TaskQueue.add(
          "get_item_counts_batch",
          [path, JSON.stringify(foldersToUpdate)],
          "shell"
        );

        if (countsResult?.length) {
          updateFoldersData(countsResult, type, diskFolders);
        }
      } else {
        Logger.debug(
          `[SubfolderMonitor] Sem alterações de timestamp detectadas para ${type}.`
        );
      }

      return diskFolders;
    } catch (error) {
      Logger.error(
        `[SubfolderMonitor] Erro ao processar o tipo de pasta '${type}':`,
        error
      );
      return new Map();
    }
  }

  function reconcileFolders(
    foldersInState,
    screenshotFolders,
    screenrecordingFolders
  ) {
    const ssNamesOnDisk = new Set(screenshotFolders.keys());
    const srNamesOnDisk = new Set(screenrecordingFolders.keys());
    const finalFolders = [];
    let removedCount = 0;

    for (const folder of foldersInState) {
      let modified = false;

      if (folder.ss && !ssNamesOnDisk.has(folder.name)) {
        delete folder.ss;
        modified = true;
      }

      if (folder.sr && !srNamesOnDisk.has(folder.name)) {
        delete folder.sr;
        modified = true;
      }

      if (folder.ss || folder.sr) {
        finalFolders.push(folder);
      } else {
        removedCount++;
      }

      if (modified) removedCount++;
    }

    return {
      finalFolders,
      removedCount,
      hasChanges:
        removedCount > 0 || finalFolders.length !== foldersInState.length
    };
  }

  async function loadFoldersData() {
    try {
      const [screenshotFolders, screenrecordingFolders] = await Promise.all([
        processFolderType("screenshots", ENV.ORGANIZED_SCREENSHOTS_PATH),
        processFolderType("screenrecordings", ENV.ORGANIZED_RECORDINGS_PATH)
      ]);

      Logger.debug(
        "[SubfolderMonitor] Verificações concluídas. Executando a reconciliação de estado."
      );

      const foldersInState = AppState.getFolders();

      if (!foldersInState?.length) {
        Logger.debug(
          "[SubfolderMonitor] Nenhuma pasta no estado para reconciliar."
        );
        return;
      }

      const { finalFolders, hasChanges } = reconcileFolders(
        foldersInState,
        screenshotFolders,
        screenrecordingFolders
      );

      if (hasChanges) {
        Logger.info(
          `[SubfolderMonitor] Reconciliação concluída. Pastas no estado: ${foldersInState.length} -> ${finalFolders.length}. Atualizando AppState.`
        );
        AppState.setFolders(finalFolders);
      } else {
        Logger.debug(
          "[SubfolderMonitor] Nenhuma alteração de estado detectada na reconciliação."
        );
      }
    } catch (error) {
      Logger.error(
        "[SubfolderMonitor] Erro durante o ciclo de verificação e limpeza:",
        error
      );
    }
  }

  function init() {
    EventBus.on("appmonitor:ready", loadFoldersData);
  }

  function runScan() {
    loadFoldersData();
  }

  return {
    runScan,
    init
  };
})();
