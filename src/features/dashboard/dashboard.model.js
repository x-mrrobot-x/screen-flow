const DashboardModel = (function () {
  "use strict";

  function getTopOrganizerApp() {
    const folders = AppState.getFolders();
    if (!folders || folders.length === 0) {
      return null;
    }

    let topApp = null;
    let maxCount = -1;

    for (const folder of folders) {
      const totalFiles = (folder.ss?.count || 0) + (folder.sr?.count || 0);
      if (totalFiles > maxCount) {
        maxCount = totalFiles;
        topApp = folder;
      }
    }

    if (!topApp || maxCount <= 0) {
      return null;
    }

    return {
      name: topApp.name,
      count: maxCount,
      pkg: topApp.pkg
    };
  }

  async function getToOrganizeFileCounts() {
    try {
      const [imagesResult, videosResult] = await Promise.all([
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

      const imagesCount = Number(imagesResult) || 0;
      const videosCount = Number(videosResult) || 0;

      const toOrganize = {
        images: imagesCount,
        videos: videosCount
      };

      return toOrganize;
    } catch (error) {
      Logger.error("Failed to update pending files count:", error);
      return {
        images: 0,
        videos: 0
      };
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

      const screenshotsCount = Number(screenshotsFolderCount) || 0;
      const recordingsCount = Number(recordingsFolderCount) || 0;

      const foldersCreated = {
        images: screenshotsCount,
        videos: recordingsCount
      };

      return foldersCreated;
    } catch (error) {
      Logger.error("Failed to update folders created count:", error);
      return {
        images: 0,
        videos: 0
      };
    }
  }

  function getState() {
    const stats = AppState.getStats();
    const mostCapturedApp = getTopOrganizerApp() || {
      name: "Nenhum",
      count: 0,
      pkg: "default.png"
    };

    const currentState = {
      organizedFiles: stats.organizedFiles || 0,
      removedFiles: stats.cleanedFiles || 0,
      toOrganize: stats.toOrganize,
      foldersCreated: stats.foldersCreated,
      lastOrganization: {
        images: Utils.formatTimestamp(stats.lastOrganization?.images),
        videos: Utils.formatTimestamp(stats.lastOrganization?.videos)
      },
      lastClean: {
        images: Utils.formatTimestamp(stats.lastClean?.images),
        videos: Utils.formatTimestamp(stats.lastClean?.videos)
      },
      mostCapturedApp: mostCapturedApp
    };
    return currentState;
  }

  function refresh() {
    return getState();
  }

  return {
    getState,
    refresh,
    getToOrganizeFileCounts,
    getOrganizedFolderCounts
  };
})();
