import ENV from "../platform/env.js";
import EventBus from "../platform/event-bus.js";
import Logger from "../platform/logger.js";
import AppState from "../state/app-state.js";
import TaskQueue from "../platform/task-queue.js";
import Toast from "../ui/toast.js";
import I18n from "./i18n.js";
import Utils from "../../lib/utils.js";

function getMediaTypes() {
  return {
    SCREENSHOTS: {
      name: "screenshots",
      path: ENV.PATHS.ORGANIZED_SCREENSHOTS
    },
    RECORDINGS: {
      name: "screen recordings",
      path: ENV.PATHS.ORGANIZED_RECORDINGS
    }
  };
}

function createPackageSet(apps) {
  return new Set(apps.map(app => app.pkg));
}

function createPackageMap(apps) {
  const map = new Map();
  for (const app of apps) map.set(app.pkg, app);
  return map;
}

function extractFolderName(item) {
  if (typeof item !== "string") return item.name;
  const commaIndex = item.indexOf(",");
  return commaIndex !== -1 ? item.slice(0, commaIndex) : item;
}

function getUniqueFolderNames({ screenshotFolders, recordingFolders }) {
  const names = new Set();
  for (const f of screenshotFolders) names.add(extractFolderName(f));
  for (const f of recordingFolders) names.add(extractFolderName(f));
  return Array.from(names);
}

function resolveSettledValue(result) {
  return result.status === "fulfilled" ? result.value || [] : [];
}

function filterNewApps(newApps, existingApps) {
  const existingPkgs = createPackageSet(existingApps);
  return newApps.filter(app => !existingPkgs.has(app.pkg));
}

function filterNewPackages(allPackages, existingApps) {
  const existingPkgs = createPackageSet(existingApps);
  return allPackages.filter(pkg => !existingPkgs.has(pkg));
}

async function renameOnDisk(basePath, oldName, newName) {
  return TaskQueue.add("rename_folder", [basePath, oldName, newName], "shell");
}

async function renameFolderForMediaType(
  oldName,
  newName,
  mediaTypeName,
  basePath
) {
  try {
    Logger.info(
      `[AppMonitor] Renaming ${mediaTypeName} folder: '${oldName}' → '${newName}'.`
    );
    const renameResult = await renameOnDisk(basePath, oldName, newName);
    const renamed = renameResult?.renamed ?? false;
    return {
      attempted: renamed,
      success: renamed,
      timestamp: renameResult?.timestamp ?? null
    };
  } catch (error) {
    Logger.error(
      `[AppMonitor] Failed to rename '${oldName}' (${mediaTypeName}):`,
      error
    );
    return { attempted: true, success: false, timestamp: null };
  }
}

async function renameMediaFolders(oldName, newName) {
  const { SCREENSHOTS, RECORDINGS } = getMediaTypes();
  return Promise.all([
    renameFolderForMediaType(
      oldName,
      newName,
      SCREENSHOTS.name,
      SCREENSHOTS.path
    ),
    renameFolderForMediaType(oldName, newName, RECORDINGS.name, RECORDINGS.path)
  ]);
}

function notifyRenameResult(appName, [ssResult, srResult]) {
  const anySuccess = ssResult.success || srResult.success;
  const anyAttempted = ssResult.attempted || srResult.attempted;
  if (anySuccess)
    Toast.success(I18n.t("monitor.folders_updated", { name: appName }));
  else if (anyAttempted)
    Toast.error(I18n.t("monitor.folders_error", { name: appName }));
}

function applyTimestampToMedia(folder, result, key) {
  if (result.timestamp && folder[key]) {
    return {
      ...folder[key],
      mtime: result.timestamp
    };
  }
  return folder[key];
}

function updateFolderInState(oldName, newName, ssResult, srResult) {
  const folders = AppState.getFolders();
  const idx = folders.findIndex(f => f.name === oldName);
  if (idx === -1) return;

  const folder = {
    ...folders[idx],
    name: newName,
    ss: applyTimestampToMedia(folders[idx], ssResult, "ss"),
    sr: applyTimestampToMedia(folders[idx], srResult, "sr")
  };

  const updated = [...folders];
  updated[idx] = folder;
  AppState.setFolders(updated);
}

async function applyFolderRename(oldName, newName) {
  const results = await renameMediaFolders(oldName, newName);
  const [ssResult, srResult] = results;
  if (ssResult.success || srResult.success)
    updateFolderInState(oldName, newName, ssResult, srResult);
  notifyRenameResult(newName, results);
}

async function processFolder(folderName, packageMap) {
  if (!packageMap.has(folderName)) return;
  const app = packageMap.get(folderName);
  const newName = Utils.sanitizeFolderName(app.name);
  if (folderName === newName) return;
  await applyFolderRename(folderName, newName);
}

async function renameFoldersForNewApps(newApps, mediaFolders) {
  if (!newApps?.length) return;
  Logger.debug(
    `[AppMonitor] Checking renames for ${newApps.length} new app(s).`
  );
  try {
    const diskFolderNames = getUniqueFolderNames(mediaFolders);
    const packageMap = createPackageMap(newApps);
    await Promise.all(
      diskFolderNames.map(name => processFolder(name, packageMap))
    );
    Logger.info("[AppMonitor] Rename check completed.");
  } catch (error) {
    Logger.error("[AppMonitor] Failed during rename check:", error);
  }
}

async function persistNewApps(appsToAdd, mediaFolders) {
  await renameFoldersForNewApps(appsToAdd, mediaFolders);
  Toast.success(I18n.t("monitor.apps_updated"));
  AppState.setApps([...AppState.getApps(), ...appsToAdd]);
}

async function updateAppsData(newApps, mediaFolders) {
  if (!newApps?.length) {
    Logger.info("[AppMonitor] No app details to add.");
    return;
  }
  try {
    const existingApps = AppState.getApps();
    const appsToAdd = filterNewApps(newApps, existingApps);
    if (!appsToAdd.length) {
      Logger.info("[AppMonitor] All new apps already exist in state.");
      return;
    }
    await persistNewApps(appsToAdd, mediaFolders);
  } catch (error) {
    Logger.error("[AppMonitor] Failed to add new apps to state:", error);
  }
}

async function processNewPackages(allPackages, existingApps, mediaFolders) {
  const newPackages = filterNewPackages(allPackages, existingApps);
  if (!newPackages.length) {
    Logger.debug("[AppMonitor] No new packages detected.");
    return;
  }
  Logger.debug(
    `[AppMonitor] Fetching details for ${newPackages.length} new package(s).`
  );
  const appDetails = await TaskQueue.add(
    "get_app_details_batch",
    newPackages,
    "app"
  );
  await updateAppsData(appDetails, mediaFolders);
}

async function fetchAppSyncData() {
  const appsPath = ENV.getFilePath("APPS");
  const [checkResult, screenshotFolders, recordingFolders] =
    await Promise.allSettled([
      TaskQueue.add("check_installed_apps", { appsPath }, "app"),
      TaskQueue.add(
        "get_subfolders",
        [ENV.PATHS.ORGANIZED_SCREENSHOTS],
        "shell"
      ),
      TaskQueue.add("get_subfolders", [ENV.PATHS.ORGANIZED_RECORDINGS], "shell")
    ]);
  return {
    result: checkResult.status === "fulfilled" ? checkResult.value : null,
    mediaFolders: {
      screenshotFolders: resolveSettledValue(screenshotFolders),
      recordingFolders: resolveSettledValue(recordingFolders)
    }
  };
}

async function loadInstalledApps() {
  Logger.debug("[AppMonitor] Checking for newly installed apps.");
  try {
    const { result, mediaFolders } = await fetchAppSyncData();
    if (!result?.changed) {
      Logger.debug("[AppMonitor] No new apps detected.");
      return;
    }
    Logger.info("[AppMonitor] Changes detected. Processing...", result);
    await processNewPackages(result.packages, AppState.getApps(), mediaFolders);
  } catch (error) {
    Logger.error("[AppMonitor] Failed to sync apps:", error);
  } finally {
    EventBus.emit("appmonitor:ready");
  }
}

function init() {
  loadInstalledApps();
}

export default {
  init,
  updateAppsData
};
