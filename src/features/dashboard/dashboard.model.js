const DashboardModel = (function () {
  "use strict";

  function getTopOrganizerApp() {
    const folders = AppState.getFolders();
    if (!folders || folders.length === 0) return null;

    const topApp = folders.reduce((best, folder) => {
      const count = (folder.ss?.count || 0) + (folder.sr?.count || 0);
      return count > (best?.count || 0) ? { ...folder, count } : best;
    }, null);

    if (!topApp || topApp.count <= 0) return null;

    return { name: topApp.name, count: topApp.count, pkg: topApp.pkg };
  }

  async function getToOrganizeFileCounts() {
    try {
      const [screenshotsResult, recordingsResult] = await Promise.all([
        TaskQueue.add(
          "count_media_items",
          ["jpg", ENV.SOURCE_SCREENSHOTS_PATH],
          "shell"
        ),
        TaskQueue.add(
          "count_media_items",
          ["mp4", ENV.SOURCE_RECORDINGS_PATH],
          "shell"
        )
      ]);

      return {
        screenshots: Number(screenshotsResult) || 0,
        recordings: Number(recordingsResult) || 0
      };
    } catch (error) {
      Logger.error("Failed to update pending files count:", error);
      return { screenshots: 0, recordings: 0 };
    }
  }

  async function getOrganizedFolderCounts() {
    try {
      const [screenshotsFolderCount, recordingsFolderCount] = await Promise.all(
        [
          TaskQueue.add(
            "count_subfolders",
            [ENV.ORGANIZED_SCREENSHOTS_PATH],
            "shell"
          ),
          TaskQueue.add(
            "count_subfolders",
            [ENV.ORGANIZED_RECORDINGS_PATH],
            "shell"
          )
        ]
      );

      return {
        screenshots: Number(screenshotsFolderCount) || 0,
        recordings: Number(recordingsFolderCount) || 0
      };
    } catch (error) {
      Logger.error("Failed to update folders created count:", error);
      return { screenshots: 0, recordings: 0 };
    }
  }

  function getState() {
    const stats = AppState.getStats();
    const mostCapturedApp = getTopOrganizerApp() || {
      name: I18n.t("common.none"),
      count: 0,
      pkg: "default.png"
    };

    return {
      organizedFiles: stats.organizedFiles || 0,
      removedFiles: stats.cleanedFiles || 0,
      toOrganize: stats.toOrganize || { screenshots: 0, recordings: 0 },
      foldersCreated: stats.foldersCreated || { screenshots: 0, recordings: 0 },
      lastOrganization: {
        screenshots: Utils.formatTimestamp(stats.lastOrganization?.screenshots),
        recordings: Utils.formatTimestamp(stats.lastOrganization?.recordings)
      },
      lastClean: {
        screenshots: Utils.formatTimestamp(stats.lastClean?.screenshots),
        recordings: Utils.formatTimestamp(stats.lastClean?.recordings)
      },
      mostCapturedApp,
      settings: {
        autoOrganizer: AppState.getSetting("autoOrganizer") ?? false,
        autoCleaner: AppState.getSetting("autoCleaner") ?? false
      }
    };
  }

  return {
    getState,
    getToOrganizeFileCounts,
    getOrganizedFolderCounts
  };
})();
