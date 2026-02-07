const AppMonitor = (() => {
  const CONFIG = {
    HASH_KEY: "apps_hash",
    MEDIA_TYPES: {
      SCREENSHOTS: {
        name: "screenshots",
        path: ENV.ORGANIZED_SCREENSHOTS_PATH,
        timestampKey: "disk_ts_ss"
      },
      RECORDINGS: {
        name: "screen recordings",
        path: ENV.ORGANIZED_RECORDINGS_PATH,
        timestampKey: "disk_ts_sr"
      }
    }
  };

  const isEmpty = array => !array || array.length === 0;

  const shouldSkipRename = (oldName, newName) => oldName === newName;

  async function pathExists(fullPath) {
    try {
      return await TaskQueue.add("path_exists", [fullPath], "shell");
    } catch (error) {
      Logger.error(
        `[AppMonitor] Erro ao verificar existência do caminho '${fullPath}':`,
        error
      );
      return false;
    }
  }

  async function executeRename(basePath, oldName, newName) {
    return await TaskQueue.add(
      "rename_folder",
      [basePath, oldName, newName],
      "shell"
    );
  }

  async function renameFolderAndLog(
    folder,
    oldName,
    newName,
    mediaType,
    basePath,
    timestampKey
  ) {
    const result = { attempted: false, success: false, timestamp: null };
    const fullPath = `${basePath}/${oldName}`;

    if (!(await pathExists(fullPath))) {
      return result;
    }

    result.attempted = true;

    try {
      Logger.info(
        `[AppMonitor] Tentando renomear pasta de ${mediaType}: '${oldName}' para '${newName}'.`
      );

      const renameResult = await executeRename(basePath, oldName, newName);

      if (renameResult?.renamed) {
        result.success = true;
        if (renameResult.timestamp) {
          result.timestamp = renameResult.timestamp;
          Logger.debug(
            `[AppMonitor] Timestamp da pasta de ${mediaType} '${newName}' atualizado para ${renameResult.timestamp} após renomear.`
          );
        }
      }
    } catch (error) {
      Logger.error(
        `[AppMonitor] Falha ao renomear a pasta de ${mediaType} '${oldName}':`,
        error
      );
    }

    return result;
  }

  async function renameMediaFolders(oldName, newName) {
    const { SCREENSHOTS, RECORDINGS } = CONFIG.MEDIA_TYPES;

    return await Promise.all([
      renameFolderAndLog(
        {},
        oldName,
        newName,
        SCREENSHOTS.name,
        SCREENSHOTS.path,
        SCREENSHOTS.timestampKey
      ),
      renameFolderAndLog(
        {},
        oldName,
        newName,
        RECORDINGS.name,
        RECORDINGS.path,
        RECORDINGS.timestampKey
      )
    ]);
  }

  function notifyRenameResult(appName, results) {
    const [screenshotResult, recordingResult] = results;
    const successfullyRenamed =
      screenshotResult.success || recordingResult.success;
    const attemptedRename =
      screenshotResult.attempted || recordingResult.attempted;

    if (successfullyRenamed) {
      Toast.success(`Pasta(s) do app '${appName}' foram atualizadas.`);
    } else if (attemptedRename) {
      Toast.error(`Falha ao renomear pasta(s) para '${appName}'.`);
    }
  }

  async function fetchMediaFolders() {
    const [screenshotFolders, recordingFolders] = await Promise.all([
      TaskQueue.add(
        "get_subfolders",
        [ENV.ORGANIZED_SCREENSHOTS_PATH],
        "shell"
      ).catch(() => []),
      TaskQueue.add(
        "get_subfolders",
        [ENV.ORGANIZED_RECORDINGS_PATH],
        "shell"
      ).catch(() => [])
    ]);

    return {
      screenshotFolders: screenshotFolders || [],
      recordingFolders: recordingFolders || []
    };
  }

  function getUniqueFolderNames({ screenshotFolders, recordingFolders }) {
    const extractFolderName = item => {
      if (typeof item === "string" && item.includes(",")) {
        return item.split(",")[0];
      }
      return typeof item === "string" ? item : item.name;
    };
    const allFolders = [...screenshotFolders, ...recordingFolders];
    const folderNames = allFolders.map(extractFolderName);
    return [...new Set(folderNames)];
  }

  function createPackageMap(apps) {
    return new Map(apps.map(app => [app.pkg, app]));
  }

  async function processFolder(folderName, packageMap) {
    if (!packageMap.has(folderName)) {
      return;
    }

    const app = packageMap.get(folderName);
    const oldName = folderName;
    const newName = Utils.sanitizeFolderName(app.name);

    if (shouldSkipRename(oldName, newName)) {
      return;
    }

    const results = await renameMediaFolders(oldName, newName);

    const [screenshotResult, recordingResult] = results;

    if (screenshotResult.success || recordingResult.success) {
      updateFoldersState(oldName, newName, screenshotResult, recordingResult);
    }

    notifyRenameResult(newName, results);
  }

  function updateFoldersState(
    oldName,
    newName,
    screenshotResult,
    recordingResult
  ) {
    const folders = AppState.getFolders();

    const updatedFolders = folders.map(folder => {
      if (folder.name === oldName) {
        const updatedFolder = { ...folder, name: newName };

        if (screenshotResult.timestamp) {
          updatedFolder.disk_ts_ss = screenshotResult.timestamp;
        }

        if (recordingResult.timestamp) {
          updatedFolder.disk_ts_sr = recordingResult.timestamp;
        }

        return updatedFolder;
      }
      return folder;
    });

    AppState.setFolders(updatedFolders);
  }

  async function renameFoldersForNewApps(newApps) {
    Logger.debug(
      `[AppMonitor] Verificando em disco se pastas precisam ser renomeadas para ${newApps.length} novo(s) app(s).`
    );

    if (isEmpty(newApps)) {
      return;
    }

    try {
      const mediaFolders = await fetchMediaFolders();

      const diskFolderNames = getUniqueFolderNames(mediaFolders);

      const packageMap = createPackageMap(newApps);

      await Promise.all(
        diskFolderNames.map(folderName => processFolder(folderName, packageMap))
      );

      Logger.info(
        "[AppMonitor] Verificação de renomeação de pastas concluída."
      );
    } catch (error) {
      Logger.error(
        "[AppMonitor] Falha durante a verificação e renomeação de pastas:",
        error
      );
    }
  }

  function filterNewApps(newApps, existingApps) {
    const existingPackages = new Set(existingApps.map(app => app.pkg));
    return newApps.filter(app => !existingPackages.has(app.pkg));
  }

  async function updateAppsData(newApps) {
    if (isEmpty(newApps)) {
      Logger.info(
        "[AppMonitor] Nenhum detalhe de novo aplicativo para adicionar."
      );
      return;
    }

    Logger.debug(
      "[AppMonitor] Recebidos detalhes de novos aplicativos:",
      newApps
    );

    try {
      const existingApps = AppState.getApps();
      const appsToAdd = filterNewApps(newApps, existingApps);

      if (isEmpty(appsToAdd)) {
        Logger.info(
          "[AppMonitor] Todos os novos aplicativos já existiam no estado."
        );
        return;
      }

      await renameFoldersForNewApps(appsToAdd);

      Logger.user("Lista de aplicativos atualizada.", "success");
      const updatedApps = [...existingApps, ...appsToAdd];
      AppState.setApps(updatedApps);
    } catch (error) {
      Logger.error(
        "[AppMonitor] Falha ao adicionar novos aplicativos ao estado:",
        error
      );
    }
  }

  async function fetchAllPackages() {
    const packages = await TaskQueue.add("get_all_app_packages", {}, "app");

    if (!packages) {
      throw new Error("A lista de pacotes retornada pelo Tasker é nula.");
    }

    return packages;
  }

  async function generatePackagesHash(packages) {
    const listAsString = packages.sort().join(",");
    return await Utils.generateHash(listAsString);
  }

  function hasChanges(currentHash, lastHash) {
    return currentHash !== lastHash;
  }

  function identifyNewPackages(allPackages, existingApps) {
    const existingPackages = new Set(existingApps.map(app => app.pkg));
    return allPackages.filter(pkg => !existingPackages.has(pkg));
  }

  async function fetchPackageDetails(packages) {
    return await TaskQueue.add("get_app_details_batch", packages, "app");
  }

  async function processNewPackages(allPackages, existingApps) {
    const newPackages = identifyNewPackages(allPackages, existingApps);

    if (isEmpty(newPackages)) {
      Logger.debug(
        "[AppMonitor] Nenhum aplicativo novo para adicionar, apenas remoções foram detectadas."
      );
      return;
    }

    Logger.debug(
      `[AppMonitor] Buscando detalhes para ${newPackages.length} novo(s) pacote(s).`
    );

    const appDetails = await fetchPackageDetails(newPackages);
    await updateAppsData(appDetails);
  }

  function saveCurrentHash(hash) {
    AppState.setMonitorData({ [CONFIG.HASH_KEY]: hash });
  }

  async function loadInstalledApps() {
    Logger.debug(
      "[AppMonitor] Iniciando verificação de novos aplicativos instalados."
    );

    try {
      const allPackages = await fetchAllPackages();

      const currentHash = await generatePackagesHash(allPackages);

      const monitorData = AppState.getMonitorData();
      const lastHash = monitorData[CONFIG.HASH_KEY];

      if (!hasChanges(currentHash, lastHash)) {
        Logger.debug(
          "[AppMonitor] Nenhum aplicativo novo detectado (hash correspondente)."
        );
        return;
      }

      Logger.info(
        "[AppMonitor] Mudanças na lista de aplicativos detectadas. Verificando novos..."
      );

      const existingApps = AppState.getApps();
      await processNewPackages(allPackages, existingApps);

      saveCurrentHash(currentHash);
    } catch (error) {
      Logger.error(
        "[AppMonitor] Falha ao sincronizar a lista de aplicativos:",
        error
      );
    } finally {
      EventBus.emit("appmonitor:ready");
      Logger.debug("[AppMonitor] Evento 'appmonitor:ready' emitido.");
    }
  }

  function init() {
    if (AppState.isReady()) {
      loadInstalledApps();
    } else {
      EventBus.on("appstate:ready", loadInstalledApps);
    }
    Logger.debug("[AppMonitor] Initialized.");
  }

  return {
    init
  };
})();
