const AppState = (() => {
  "use strict";

  let stats = {};
  let settings = {};
  let activities = [];
  let folders = [];
  let apps = [];
  let monitor = {};
  let isReady = false;

  const EVENTS = {
    STATE_CHANGED: "appstate:changed"
  };

  let statsTimer = null;
  let settingsTimer = null;

  function clearPersistTimer(timer) {
    if (timer) {
      clearTimeout(timer);
    }
    return null;
  }

  function debouncedPersist(dataKey, data, delay) {
    if (dataKey === "SETTINGS") {
      settingsTimer = clearPersistTimer(settingsTimer);
      settingsTimer = setTimeout(() => ENV.setData(dataKey, data), delay);
    } else if (dataKey === "STATS") {
      statsTimer = clearPersistTimer(statsTimer);
      statsTimer = setTimeout(() => ENV.setData(dataKey, data), delay);
    }
  }

  function persistImmediate(dataKey, data) {
    ENV.setData(dataKey, data);
  }

  const persist = {
    folders: () => persistImmediate("FOLDERS", folders),
    settings: () => debouncedPersist("SETTINGS", settings, 500),
    stats: () => debouncedPersist("STATS", stats, 500),
    activities: () => persistImmediate("ACTIVITIES", activities),
    apps: () => persistImmediate("APPS", apps),
    monitor: () => persistImmediate("MONITOR", monitor)
  };

  function emitChange(key) {
    EventBus.emit(EVENTS.STATE_CHANGED, { key });
  }

  async function loadAllData() {
    return await Promise.all([
      ENV.getData("SETTINGS"),
      ENV.getData("STATS"),
      ENV.getData("FOLDERS"),
      ENV.getData("ACTIVITIES"),
      ENV.getData("APPS"),
      ENV.getData("MONITOR")
    ]);
  }

  function assignLoadedData([
    settingsData,
    statsData,
    foldersData,
    activitiesData,
    appsData,
    monitorData
  ]) {
    settings = settingsData;
    stats = statsData;
    folders = foldersData;
    activities = activitiesData;
    apps = appsData;
    monitor = monitorData;
  }

  function markAsReady() {
    isReady = true;
    EventBus.emit("appstate:ready");
  }

  async function init() {
    const loadedData = await loadAllData();
    assignLoadedData(loadedData);
    markAsReady();
  }

  function createActivity(activity) {
    return {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...activity
    };
  }

  function limitActivities(activitiesList, maxCount = 10) {
    return activitiesList.slice(0, maxCount);
  }

  function getTopFoldersByType(type) {
    const key = type === "screenshots" ? "ss" : "sr";
    const topFolders = [];

    for (const folder of folders) {
      topFolders.push({
        name: folder.name,
        count: folder[key]?.count ?? 0
      });
    }

    topFolders.sort((a, b) => b.count - a.count);
    return topFolders.slice(0, 5);
  }

  function resetAllToDefaults() {
    stats = ENV.getDefault("STATS");
    folders = ENV.getDefault("FOLDERS");
    activities = ENV.getDefault("ACTIVITIES");
    settings = ENV.getDefault("SETTINGS");
    apps = ENV.getDefault("APPS");
    monitor = ENV.getDefault("MONITOR");
  }

  function persistAll() {
    persist.stats();
    persist.folders();
    persist.activities();
    persist.settings();
    persist.apps();
    persist.monitor();
  }

  function emitAllChanges() {
    const keys = [
      "stats",
      "folders",
      "activities",
      "settings",
      "apps",
      "monitor"
    ];
    for (const key of keys) {
      emitChange(key);
    }
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

  return {
    init,
    isReady: () => isReady,

    getFolders: () => [...folders],
    setFolders(newFolders) {
      folders = [...newFolders];
      persist.folders();
      emitChange("folders");
    },

    getActivities: () => ActivityHelper.enrichActivities([...activities]),
    addActivity(activity) {
      const newActivity = createActivity(activity);
      activities = [newActivity, ...limitActivities(activities, 9)];
      persist.activities();
      emitChange("activities");
    },

    getApps: () => [...apps],
    setApps(newApps) {
      apps = [...newApps];
      persist.apps();
      emitChange("apps");
    },

    getMonitorData: () => ({ ...monitor }),
    setMonitorData(newData) {
      monitor = { ...monitor, ...newData };
      persist.monitor();
      emitChange("monitor");
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

    resetConfig() {
      settings = ENV.getDefault("SETTINGS");
      persist.settings();
      emitChange("settings");
    },

    deleteAll,
    getTopFoldersByType
  };
})();
