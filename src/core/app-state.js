const AppState = (() => {
  "use strict";

  let stats = {};
  let settings = {};
  let activities = [];
  let folders = [];
  let apps = [];

  async function init() {
    const [settingsData, statsData, foldersData, activitiesData, appsData] =
      await Promise.all([
        ENV.getData("SETTINGS"),
        ENV.getData("STATS"),
        ENV.getData("FOLDERS"),
        ENV.getData("ACTIVITIES"),
        ENV.getData("APPS")
      ]);

    Logger.debug("Initial data loaded:", {
      settingsData,
      statsData,
      foldersData,
      activitiesData,
      appsData
    });

    settings = settingsData;
    stats = statsData;
    folders = foldersData;
    activities = activitiesData;
    apps = appsData;
  }

  // Auto-save com debounce
  let statsTimer = null;
  let settingsTimer = null;

  const persist = {
    folders: () => ENV.setData("FOLDERS", folders),

    settings: () => {
      clearTimeout(settingsTimer);
      settingsTimer = setTimeout(() => ENV.setData("SETTINGS", settings), 500);
    },

    stats: () => {
      clearTimeout(statsTimer);
      statsTimer = setTimeout(() => ENV.setData("STATS", stats), 500);
    },

    activities: () => ENV.setData("ACTIVITIES", activities),

    apps: () => ENV.setData("APPS", apps)
  };

  const EVENTS = {
    STATE_CHANGED: "appstate:changed"
  };

  function emitChange(key) {
    EventBus.emit(EVENTS.STATE_CHANGED, { key });
  }

  return {
    init,

    // Folders
    getFolders: () => [...folders],
    setFolders(newFolders) {
      folders = [...newFolders];
      persist.folders();
      emitChange("folders");
    },

    // Activities
    getActivities: () => ActivityHelper.enrichActivities([...activities]),
    addActivity(activity) {
      activities = [
        {
          id: Date.now().toString(),
          timestamp: Date.now(),
          ...activity
        },
        ...activities.slice(0, 9)
      ];
      persist.activities();
      emitChange("activities");
    },

    // Apps
    getApps: () => [...apps],
    setApps(newApps) {
      apps = [...newApps];
      persist.apps();
      emitChange("apps");
    },

    // Settings (configurações do usuário)
    getSettings: () => ({ ...settings }),
    getSetting: key => settings[key],
    setSetting(key, value) {
      settings = { ...settings, [key]: value };
      persist.settings();
      emitChange("settings");
    },
    setSettings(newSettings) {
      settings = { ...settings, ...newSettings };
      persist.settings();
      emitChange("settings");
    },
    toggleSetting(key) {
      settings = { ...settings, [key]: !settings[key] };
      persist.settings();
      emitChange("settings");
      return settings[key];
    },

    // Stats (estatísticas e métricas)
    getStats: () => ({ ...stats }),
    getStat: key => stats[key],
    setStat(key, value) {
      stats = { ...stats, [key]: value };
      persist.stats();
      emitChange("stats");
    },
    incrementStat(key, amount = 1) {
      stats = { ...stats, [key]: (stats[key] || 0) + amount };
      persist.stats();
      emitChange("stats");
    },
    updateLastOrganizer() {
      stats = { ...stats, lastOrganizer: Date.now() };
      persist.stats();
      emitChange("stats");
    },
    updateLastCleanup() {
      stats = { ...stats, lastCleanup: Date.now() };
      persist.stats();
      emitChange("stats");
    },

    updateStatsFromProcess(result) {
      const {
        organizerCount = 0,
        cleanedCount = 0,
        pendingFiles,
        processType
      } = result;

      let newStats = { ...stats };

      if (processType === "organizer") {
        newStats = {
          ...newStats,
          lastOrganizer: Date.now(),
          organizerCaptures: (newStats.organizerCaptures || 0) + organizerCount
        };
      } else if (processType === "cleanup") {
        newStats = {
          ...newStats,
          lastCleanup: Date.now(),
          removedCaptures: (newStats.removedCaptures || 0) + cleanedCount
        };
      }

      if (pendingFiles !== undefined) {
        newStats.pendingFiles = pendingFiles;
      }

      stats = newStats;
      persist.stats();
      emitChange("stats");
    },

    // Reset & Delete
    resetConfig() {
      settings = ENV.getDefault("SETTINGS");
      persist.settings();
      emitChange("settings");
    },

    deleteAll() {
      try {
        stats = ENV.getDefault("STATS");
        folders = ENV.getDefault("FOLDERS");
        activities = ENV.getDefault("ACTIVITIES");
        settings = ENV.getDefault("SETTINGS");
        apps = ENV.getDefault("APPS");

        persist.stats();
        persist.folders();
        persist.activities();
        persist.settings();
        persist.apps();

        emitChange("stats");
        emitChange("folders");
        emitChange("activities");
        emitChange("settings");
        emitChange("apps");

        return true;
      } catch (error) {
        Logger.error("Error deleting all data:", error);
        return false;
      }
    },

    // Utils
    getTopFoldersByType(type) {
      const key = type === "screenshots" ? "ss" : "sr";
      return [...folders]
        .sort((a, b) => b.stats[key] - a.stats[key])
        .slice(0, 5)
        .map(f => ({ name: f.name, count: f.stats[key] }));
    }
  };
})();
