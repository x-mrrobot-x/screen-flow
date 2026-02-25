const SubfolderMonitor = (function () {
  "use strict";

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
      if (commaIndex !== -1) {
        map.set(item.slice(0, commaIndex), item.slice(commaIndex + 1));
      }
    }
    return map;
  }

  function buildUpdatedFolder(existing, name, pkg, statsKey, count, timestamp) {
    const mediaEntry = {
      count,
      mtime: timestamp,
      cleaner: existing?.[statsKey]?.cleaner ?? { on: false, days: 7 }
    };

    if (existing) return { ...existing, [statsKey]: mediaEntry };

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
    existingFolders,
    folderTimestamps
  ) {
    if (!scriptOutput?.length) return existingFolders;

    const statsKey = type === "screenshots" ? "ss" : "sr";
    const appNameToPkg = createAppPackageMap(AppState.getApps());
    const folderMap = createFolderMap(existingFolders);

    for (const line of scriptOutput) {
      const parsed = parseFolderLine(line);
      if (!parsed) continue;

      const { name, count } = parsed;
      const timestamp = folderTimestamps.get?.(name) ?? folderTimestamps[name];
      const existing = folderMap.get(name) ?? null;

      if (!existing && !appNameToPkg.has(name)) {
        Logger.warn(
          `[SubfolderMonitor] Package not found for folder '${name}'. Using name as pkg.`
        );
      }

      const pkg = appNameToPkg.get(name) ?? name;
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

    return Array.from(folderMap.values());
  }

  function updateFoldersData(scriptOutput, type, folderTimestamps) {
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
        `[SubfolderMonitor] Failed to process data for type: ${type}`,
        error
      );
    }
  }

  function findFoldersToUpdate(diskFolders, stateFolderMap, statsKey) {
    const toUpdate = [];
    for (const [name, diskTimestamp] of diskFolders) {
      const folder = stateFolderMap.get(name);
      const stale =
        !folder ||
        !folder[statsKey] ||
        String(folder[statsKey].mtime) !== diskTimestamp;
      if (stale) toUpdate.push(name);
    }
    return toUpdate;
  }

  async function processFolderType(type, path) {
    try {
      const subfolderList = await TaskQueue.add(
        "get_subfolders",
        [path],
        "shell"
      );

      if (!subfolderList?.length) return new Map();

      const diskFolders = parseDiskFolders(subfolderList);
      const stateFolderMap = createFolderMap(AppState.getFolders());
      const statsKey = type === "screenshots" ? "ss" : "sr";
      const foldersToUpdate = findFoldersToUpdate(
        diskFolders,
        stateFolderMap,
        statsKey
      );

      if (foldersToUpdate.length > 0) {
        const countsResult = await TaskQueue.add(
          "get_item_counts_batch",
          [path, JSON.stringify(foldersToUpdate)],
          "shell"
        );
        if (countsResult?.length) {
          updateFoldersData(countsResult, type, diskFolders);
        }
      }

      return diskFolders;
    } catch (error) {
      Logger.error(`[SubfolderMonitor] Error processing '${type}':`, error);
      return new Map();
    }
  }

  function syncFolders(foldersInState, ssOnDisk, srOnDisk) {
    let hasChanges = false;
    const finalFolders = [];

    for (const folder of foldersInState) {
      const hasSs = folder.ss && ssOnDisk.has(folder.name);
      const hasSr = folder.sr && srOnDisk.has(folder.name);

      if (hasSs || hasSr) {
        const cleaned = { ...folder };
        if (!hasSs && cleaned.ss) {
          delete cleaned.ss;
          hasChanges = true;
        }
        if (!hasSr && cleaned.sr) {
          delete cleaned.sr;
          hasChanges = true;
        }
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
      const [ssOnDisk, srOnDisk] = await Promise.all([
        processFolderType("screenshots", ENV.ORGANIZED_SCREENSHOTS_PATH),
        processFolderType("screenrecordings", ENV.ORGANIZED_RECORDINGS_PATH)
      ]);

      const foldersInState = AppState.getFolders();
      if (!foldersInState.length) return;

      const { finalFolders, hasChanges } = syncFolders(
        foldersInState,
        ssOnDisk,
        srOnDisk
      );

      if (hasChanges) {
        AppState.setFolders(finalFolders);
      }
    } catch (error) {
      Logger.error("[SubfolderMonitor] Error during scan cycle:", error);
    }
  }

  function init() {
    EventBus.once("appmonitor:ready", loadFoldersData);
  }

  function runScan() {
    loadFoldersData();
  }

  return {
    init,
    runScan
  };
})();
