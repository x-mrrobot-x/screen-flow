const AppMonitor = (() => {
  const CONFIG = {
    MEDIA_TYPES: {
      SCREENSHOTS: {
        name: "screenshots",
        path: ENV.ORGANIZED_SCREENSHOTS_PATH,
        timestampKey: "mtime"
      },
      RECORDINGS: {
        name: "screen recordings",
        path: ENV.ORGANIZED_RECORDINGS_PATH,
        timestampKey: "mtime"
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

  function createRenameResult() {
    return { attempted: false, success: false, timestamp: null };
  }

  async function renameFolderAndLog(
    folder,
    oldName,
    newName,
    mediaType,
    basePath,
    timestampKey
  ) {
    const result = createRenameResult();
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

  function hasSuccessfulRename(results) {
    return results.some(result => result.success);
  }

  function hasAttemptedRename(results) {
    return results.some(result => result.attempted);
  }

  function notifyRenameResult(appName, results) {
    if (hasSuccessfulRename(results)) {
      Toast.success(`Pasta(s) do app '${appName}' foram atualizadas.`);
    } else if (hasAttemptedRename(results)) {
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

  function extractFolderName(item) {
    if (typeof item !== "string") {
      return item.name;
    }

    const commaIndex = item.indexOf(",");
    if (commaIndex !== -1) {
      return item.slice(0, commaIndex);
    }

    return item;
  }

  function getUniqueFolderNames({ screenshotFolders, recordingFolders }) {
    const uniqueNames = new Set();

    for (const folder of screenshotFolders) {
      uniqueNames.add(extractFolderName(folder));
    }

    for (const folder of recordingFolders) {
      uniqueNames.add(extractFolderName(folder));
    }

    return Array.from(uniqueNames);
  }

  function createPackageMap(apps) {
    const map = new Map();
    for (const app of apps) {
      map.set(app.pkg, app);
    }
    return map;
  }

  function shouldProcessFolder(folderName, packageMap) {
    return packageMap.has(folderName);
  }

  function updateFolderTimestamps(folder, screenshotResult, recordingResult) {
    const updated = { ...folder };

    if (screenshotResult.timestamp && updated.ss) {
      updated.ss.mtime = screenshotResult.timestamp;
    }

    if (recordingResult.timestamp && updated.sr) {
      updated.sr.mtime = recordingResult.timestamp;
    }

    return updated;
  }

  function updateFoldersState(
    oldName,
    newName,
    screenshotResult,
    recordingResult
  ) {
    const folders = AppState.getFolders();
    const folderIndex = folders.findIndex(folder => folder.name === oldName);

    if (folderIndex === -1) {
      return;
    }

    const updatedFolder = updateFolderTimestamps(
      { ...folders[folderIndex], name: newName },
      screenshotResult,
      recordingResult
    );

    const updatedFolders = [...folders];
    updatedFolders[folderIndex] = updatedFolder;

    AppState.setFolders(updatedFolders);
  }

  async function processFolder(folderName, packageMap) {
    if (!shouldProcessFolder(folderName, packageMap)) {
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

  function createPackageSet(apps) {
    const packages = new Set();
    for (const app of apps) {
      packages.add(app.pkg);
    }
    return packages;
  }

  function filterNewApps(newApps, existingApps) {
    const existingPackages = createPackageSet(existingApps);
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

  function identifyNewPackages(allPackages, existingApps) {
    const existingPackages = createPackageSet(existingApps);
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

  async function loadInstalledApps() {
    Logger.debug("[AppMonitor] Iniciando verificação de novos aplicativos");

    try {
      const appsPath = ENV.getFilePath("APPS");
      const result = await TaskQueue.add(
        "check_installed_apps",
        { appsPath: appsPath },
        "app"
      );

      if (!result?.changed) {
        Logger.debug("[AppMonitor] Nenhum aplicativo novo detectado.");
        return;
      }

      Logger.info(
        "[AppMonitor] Mudanças na lista de aplicativos detectadas. Verificando novos..."
      );

      const existingApps = AppState.getApps();
      await processNewPackages(result.packages, existingApps);
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
