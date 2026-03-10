import AppState from "../../../core/state/app-state.js";
import TaskQueue from "../../../core/platform/task-queue.js";
import Logger from "../../../core/platform/logger.js";
import Utils from "../../../lib/utils.js";

async function resolveAppNames(packageNames) {
  const apps = AppState.getApps();
  const identifierToAppNameMap = {};
  apps.forEach(app => {
    identifierToAppNameMap[app.pkg] = app.name;
    identifierToAppNameMap[app.name] = app.name;
  });
  const resolvedMap = {};
  for (const identifier of packageNames) {
    const appName = identifierToAppNameMap[identifier] || identifier;
    resolvedMap[identifier] = Utils.sanitizeFolderName(appName);
  }
  return resolvedMap;
}

function buildMoveCommands(resolvedNames, sourcePath, destPath, extension) {
  const commands = [`cd "${sourcePath}"`];
  const patterns = [];
  for (const [pkgName, appName] of Object.entries(resolvedNames)) {
    patterns.push(`*"_${pkgName}.${extension}"`);
    commands.push(
      `mv *"_${pkgName}.${extension}" "${destPath}/${appName.trim()}/"`
    );
  }
  if (patterns.length === 0)
    return {
      countCommand: "echo 0",
      moveCommand: "echo 'No files to move'"
    };
  return {
    countCommand: `cd "${sourcePath}" && ls -1 ${patterns.join(
      " "
    )} 2>/dev/null | wc -l`,
    moveCommand: commands.join(" ; ")
  };
}

async function prepareMediaOrganization(
  resolvedNames,
  sourcePath,
  destPath,
  extension
) {
  return buildMoveCommands(resolvedNames, sourcePath, destPath, extension);
}

async function loadCleanupRules() {
  const folders = AppState.getFolders();
  const rules = { screenshots: [], recordings: [] };
  folders.forEach(folder => {
    if (folder.ss?.cleaner?.on)
      rules.screenshots.push({
        folder: folder.name,
        days: folder.ss.cleaner.days
      });
    if (folder.sr?.cleaner?.on)
      rules.recordings.push({
        folder: folder.name,
        days: folder.sr.cleaner.days
      });
  });
  return rules;
}

async function findExpired(configs, rootDir, extension) {
  const results = await Promise.allSettled(
    configs.map(async config => {
      const folderPath = `${rootDir}/${config.folder}`;
      const expired = await TaskQueue.add(
        "find_expired_files",
        [folderPath, config.days, extension],
        "shell"
      );
      return expired || [];
    })
  );
  return results.flatMap(r =>
    r.status === "fulfilled"
      ? r.value
      : (Logger.error("Failed to list expired files:", r.reason), [])
  );
}

async function findAllExpiredMedia(rules, screenshotsPath, recordingsPath) {
  const [expiredScreenshots, expiredRecordings] = await Promise.all([
    findExpired(rules.screenshots, screenshotsPath, "jpg"),
    findExpired(rules.recordings, recordingsPath, "mp4")
  ]);
  return {
    screenshots: expiredScreenshots,
    recordings: expiredRecordings,
    all: [...expiredScreenshots, ...expiredRecordings]
  };
}

function updateStats({ processType, organizedCount = 0, cleanedCount = 0 }) {
  const stats = AppState.getStats();
  const now = Date.now();
  if (processType.includes("organize")) {
    const mediaType = processType.includes("screenshots")
      ? "screenshots"
      : "recordings";
    AppState.setStats({
      organizedFiles: (stats.organizedFiles || 0) + organizedCount,
      lastOrganization: { ...stats.lastOrganization, [mediaType]: now }
    });
  } else if (processType.includes("cleanup")) {
    AppState.setStats({
      cleanedFiles: (stats.cleanedFiles || 0) + cleanedCount,
      lastClean: { screenshots: now, recordings: now }
    });
  }
}

async function saveSummary(
  processType,
  stats,
  activityType,
  mediaType,
  execution = "manual"
) {
  updateStats({
    processType,
    organizedCount: stats.moved || 0,
    cleanedCount: stats.total_removed || 0
  });
  AppState.addActivity({
    execution,
    type: activityType,
    count: stats.moved || stats.total_removed || 0,
    ...(mediaType && { mediaType })
  });
  return {
    success: true,
    savedStats: stats
  };
}

async function saveScreenshotSummary(processType, stats, execution) {
  return saveSummary(processType, stats, "organizer", "screenshots", execution);
}

async function saveRecordingSummary(processType, stats, execution) {
  return saveSummary(processType, stats, "organizer", "recordings", execution);
}

async function saveCleanupSummary(processType, stats, execution) {
  return saveSummary(processType, stats, "cleaner", undefined, execution);
}

async function hasCleanerConfigs() {
  return AppState.getFolders().some(
    folder => folder.ss?.cleaner?.on || folder.sr?.cleaner?.on
  );
}

export default {
  resolveAppNames,
  prepareMediaOrganization,
  loadCleanupRules,
  findAllExpiredMedia,
  saveScreenshotSummary,
  saveRecordingSummary,
  saveCleanupSummary,
  hasCleanerConfigs
};
