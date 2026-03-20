import ENV from "../platform/env.js";
import EventBus from "../platform/event-bus.js";
import Logger from "../platform/logger.js";
import AppState from "../state/app-state.js";
import TaskQueue from "../platform/task-queue.js";
import Utils from "../../lib/utils.js";

function createAppPackageMap(apps) {
  const map = new Map();
  for (const app of apps ?? []) {
    const sanitizedName = Utils.sanitizeFolderName(app.name);
    if (!map.has(sanitizedName)) map.set(sanitizedName, app.pkg);
  }
  return map;
}

function createFolderMap(folders) {
  return new Map(folders.map(f => [f.name, f]));
}

function parseFolderLine(line) {
  const commaIndex = line.indexOf(",");
  if (commaIndex === -1) return null;
  return {
    name: line.slice(0, commaIndex).trim(),
    count: parseInt(line.slice(commaIndex + 1).trim(), 10) || 0
  };
}

function parseDiskFolders(subfolderList) {
  const map = new Map();
  for (const item of subfolderList) {
    const commaIndex = item.indexOf(",");
    if (commaIndex !== -1)
      map.set(item.slice(0, commaIndex), item.slice(commaIndex + 1));
  }
  return map;
}

function getStatsKey(type) {
  return type === "screenshots" ? "ss" : "sr";
}

function resolveTimestamp(folderTimestamps, name) {
  return folderTimestamps.get?.(name) ?? folderTimestamps[name];
}

function resolvePackage(appNameToPkg, name) {
  if (!appNameToPkg.has(name)) {
    Logger.warn(
      `[SubfolderMonitor] Package not found for folder '${name}'. Using name as pkg.`
    );
  }
  return appNameToPkg.get(name) ?? name;
}

function buildUpdatedFolder(existing, name, pkg, statsKey, count, timestamp) {
  const mediaEntry = {
    count,
    mtime: timestamp,
    cleaner: existing?.[statsKey]?.cleaner ?? {
      on: false,
      days: 7
    }
  };
  if (existing)
    return {
      ...existing,
      [statsKey]: mediaEntry
    };
  return {
    id: Math.random().toString(36).substring(2),
    name,
    pkg,
    [statsKey]: mediaEntry
  };
}

function updateFoldersFromScan(
  scriptOutput,
  type,
  folderMap,
  folderTimestamps,
  appNameToPkg
) {
  if (!scriptOutput?.length) return false;
  const statsKey = getStatsKey(type);

  for (const line of scriptOutput) {
    const parsed = parseFolderLine(line);
    if (!parsed) continue;
    const { name, count } = parsed;
    const timestamp = resolveTimestamp(folderTimestamps, name);
    const existing = folderMap.get(name) ?? null;
    const pkg = resolvePackage(appNameToPkg, name);
    const updated = buildUpdatedFolder(
      existing,
      name,
      pkg,
      statsKey,
      count,
      timestamp
    );
    folderMap.set(name, updated);
  }

  return true;
}

function isFolderStale(folder, statsKey, diskTimestamp) {
  return (
    !folder ||
    !folder[statsKey] ||
    String(folder[statsKey].mtime) !== diskTimestamp
  );
}

function findFoldersToUpdate(diskFolders, stateFolderMap, statsKey) {
  const toUpdate = [];
  for (const [name, diskTimestamp] of diskFolders) {
    const folder = stateFolderMap.get(name);
    if (isFolderStale(folder, statsKey, diskTimestamp)) toUpdate.push(name);
  }
  return toUpdate;
}

async function fetchFolderCounts(path, foldersToUpdate) {
  return TaskQueue.add(
    "get_item_counts_batch",
    [path, JSON.stringify(foldersToUpdate)],
    "shell"
  );
}

async function processFolderType(type, path, stateFolderMap, statsKey) {
  try {
    const subfolderList = await TaskQueue.add(
      "get_subfolders",
      [path],
      "shell"
    );
    if (!subfolderList?.length)
      return { diskFolders: new Map(), countsResult: [] };

    const diskFolders = parseDiskFolders(subfolderList);
    const foldersToUpdate = findFoldersToUpdate(
      diskFolders,
      stateFolderMap,
      statsKey
    );

    let countsResult = [];
    if (foldersToUpdate.length > 0) {
      countsResult = (await fetchFolderCounts(path, foldersToUpdate)) ?? [];
    }

    return { diskFolders, countsResult };
  } catch (error) {
    Logger.error(`[SubfolderMonitor] Error processing '${type}':`, error);
    return { diskFolders: new Map(), countsResult: [] };
  }
}

function cleanStaleMediaKeys(folder, hasSs, hasSr) {
  const cleaned = { ...folder };
  let changed = false;
  if (!hasSs && cleaned.ss) {
    delete cleaned.ss;
    changed = true;
  }
  if (!hasSr && cleaned.sr) {
    delete cleaned.sr;
    changed = true;
  }
  return { cleaned, changed };
}

function syncFolders(foldersInState, ssOnDisk, srOnDisk) {
  let hasChanges = false;
  const finalFolders = [];

  for (const folder of foldersInState) {
    const hasSs = folder.ss && ssOnDisk.has(folder.name);
    const hasSr = folder.sr && srOnDisk.has(folder.name);

    if (hasSs || hasSr) {
      const { cleaned, changed } = cleanStaleMediaKeys(folder, hasSs, hasSr);
      if (changed) hasChanges = true;
      finalFolders.push(cleaned);
    } else {
      hasChanges = true;
    }
  }

  return {
    finalFolders,
    hasChanges: hasChanges || finalFolders.length !== foldersInState.length
  };
}

async function loadFoldersData() {
  try {
    const existingFolders = AppState.getFolders();
    const stateFolderMap = createFolderMap(existingFolders);
    const appNameToPkg = createAppPackageMap(AppState.getApps());

    const [ssResult, srResult] = await Promise.all([
      processFolderType(
        "screenshots",
        ENV.PATHS.ORGANIZED_SCREENSHOTS,
        stateFolderMap,
        "ss"
      ),
      processFolderType(
        "screenrecordings",
        ENV.PATHS.ORGANIZED_RECORDINGS,
        stateFolderMap,
        "sr"
      )
    ]);

    const folderMap = createFolderMap(existingFolders);
    const ssUpdated = updateFoldersFromScan(
      ssResult.countsResult,
      "screenshots",
      folderMap,
      ssResult.diskFolders,
      appNameToPkg
    );
    const srUpdated = updateFoldersFromScan(
      srResult.countsResult,
      "screenrecordings",
      folderMap,
      srResult.diskFolders,
      appNameToPkg
    );

    const mergedFolders = Array.from(folderMap.values());
    const { finalFolders, hasChanges } = syncFolders(
      mergedFolders,
      ssResult.diskFolders,
      srResult.diskFolders
    );

    if (ssUpdated || srUpdated || hasChanges) AppState.setFolders(finalFolders);
  } catch (error) {
    Logger.error("[SubfolderMonitor] Error during scan cycle:", error);
  }
}

function runScan() {
  loadFoldersData();
}

function init() {
  EventBus.once("appmonitor:ready", loadFoldersData);
}

export default {
  init,
  runScan
};
