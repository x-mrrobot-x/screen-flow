const AppState = (() => {
  "use strict";

  let stats = {};
  let settings = {};
  let activities = [];
  let folders = [];
  let apps = [];

  const MAX_ACTIVITIES = 10;
  const timers = {};

  function debouncedPersist(dataKey, data, delay) {
    clearTimeout(timers[dataKey]);
    timers[dataKey] = setTimeout(() => {
      ENV.writeFile(dataKey, data);
      delete timers[dataKey];
    }, delay);
  }

  const persist = {
    folders: () => debouncedPersist("FOLDERS", folders, 1000),
    settings: () => debouncedPersist("SETTINGS", settings, 500),
    stats: () => debouncedPersist("STATS", stats, 500),
    activities: () => debouncedPersist("ACTIVITIES", activities, 1000),
    apps: () => debouncedPersist("APPS", apps, 1000)
  };

  function persistAll() {
    Object.values(persist).forEach(fn => fn());
  }

  function emitChange(key) {
    EventBus.emit("appstate:changed", { key });
  }

  function emitAllChanges() {
    Object.keys(persist).forEach(emitChange);
  }

  function createActivity(activity) {
    const now = Date.now();
    return { id: String(now), timestamp: now, ...activity };
  }

  function resetAllToDefaults() {
    stats = ENV.getDefault("STATS");
    folders = ENV.getDefault("FOLDERS");
    activities = ENV.getDefault("ACTIVITIES");
    settings = ENV.getDefault("SETTINGS");
    apps = ENV.getDefault("APPS");
  }

  function deleteAll() {
    try {
      resetAllToDefaults();
      persistAll();
      emitAllChanges();
      return true;
    } catch (error) {
      Logger.error("Error deleting all data:", error);
      return false;
    }
  }

  function getTopFoldersByType(type) {
    const key = type === "screenshots" ? "ss" : "sr";
    return folders
      .map(folder => ({ name: folder.name, count: folder[key]?.count ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  function loadStates() {
    settings = ENV.getVariable("settings");
    stats = ENV.getVariable("stats");
    folders = ENV.getVariable("folders");
    activities = ENV.getVariable("activities");
    apps = ENV.getVariable("apps");
  }

  function init() {
    loadStates();
  }

  return {
    init,
    loadStates,

    getFolders: () => [...folders],
    setFolders(newFolders) {
      folders = [...newFolders];
      persist.folders();
      emitChange("folders");
    },

    getActivities: () => ActivityHelper.enrichActivities([...activities]),
    addActivity(activity) {
      const newActivity = createActivity(activity);
      activities = [newActivity, ...activities].slice(0, MAX_ACTIVITIES);
      persist.activities();
      emitChange("activities");
    },

    getApps: () => [...apps],
    setApps(newApps) {
      apps = [...newApps];
      persist.apps();
      emitChange("apps");
    },

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

    getStats: () => ({ ...stats }),
    getStat: key => stats[key],
    setStats(newStats) {
      stats = { ...stats, ...newStats };
      persist.stats();
      emitChange("stats");
    },
    incrementStat(key, amount = 1) {
      stats = {
        ...stats,
        [key]: (stats[key] || 0) + amount
      };
      persist.stats();
      emitChange("stats");
    },

    resetConfig() {
      settings = ENV.getDefault("SETTINGS");
      persist.settings();
      emitChange("settings");
    },

    async flushPersist() {
      Object.keys(timers).forEach(key => {
        clearTimeout(timers[key]);
        delete timers[key];
      });
      await Promise.allSettled([
        ENV.writeFile("FOLDERS", folders),
        ENV.writeFile("SETTINGS", settings),
        ENV.writeFile("STATS", stats),
        ENV.writeFile("ACTIVITIES", activities),
        ENV.writeFile("APPS", apps)
      ]);
    },

    deleteAll,
    getTopFoldersByType
  };
})();
