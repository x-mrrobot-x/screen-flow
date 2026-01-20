const StateManager = (() => {
  "use strict";

  let stats = {};
  let settings = {};
  let activities = [];
  let folders = [];

  function init() {
    settings = ENV.get("SETTINGS");
    stats = ENV.get("STATS");
    folders = ENV.get("FOLDERS");
    activities = ENV.get("ACTIVITIES");
  }

  // Auto-save com debounce
  let statsTimer = null;
  let settingsTimer = null;

  const persist = {
    folders: () => ENV.set("FOLDERS", folders),

    settings: () => {
      clearTimeout(settingsTimer);
      settingsTimer = setTimeout(() => ENV.set("SETTINGS", settings), 500);
    },

    stats: () => {
      clearTimeout(statsTimer);
      statsTimer = setTimeout(() => ENV.set("STATS", stats), 500);
    },

    activities: () => ENV.set("ACTIVITIES", activities)
  };

  return {
    init,

    // Folders
    getFolders: () => [...folders],
    setFolders(newFolders) {
      folders = [...newFolders];
      persist.folders();
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
    },

    // Settings (configurações do usuário)
    getSettings: () => ({ ...settings }),
    getSetting: key => settings[key],
    setSetting(key, value) {
      settings = { ...settings, [key]: value };
      persist.settings();
    },
    setSettings(newSettings) {
      Object.assign(settings, newSettings);
      persist.settings();
    },
    toggleSetting(key) {
      settings[key] = !settings[key];
      persist.settings();
      return settings[key];
    },

    // Stats (estatísticas e métricas)
    getStats: () => ({ ...stats }),
    getStat: key => stats[key],
    setStat(key, value) {
      stats = { ...stats, [key]: value };
      persist.stats();
    },
    incrementStat(key, amount = 1) {
      stats[key] = (stats[key] || 0) + amount;
      persist.stats();
    },
    updateLastOrganized() {
      stats.lastOrganized = Date.now();
      persist.stats();
    },
    updateLastCleanup() {
      stats.lastCleanup = Date.now();
      persist.stats();
    },

    // Reset & Delete
    resetConfig() {
      settings = DEFAULT_SETTINGS;
      stats = JSON.parse(JSON.stringify(DEFAULT_STATS));
      folders = JSON.parse(JSON.stringify(DEFAULT_FOLDERS));
      activities = JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES));

      persist.settings();
      persist.stats();
      persist.folders();
      persist.activities();
    },

    deleteAll() {
      try {
        settings = DEFAULT_SETTINGS;
        stats = JSON.parse(JSON.stringify(DEFAULT_STATS));
        folders = JSON.parse(JSON.stringify(DEFAULT_FOLDERS));
        activities = JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES));

        persist.settings();
        persist.stats();
        persist.folders();
        persist.activities();
        return true;
      } catch (error) {
        console.error("Error deleting all data:", error);
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
