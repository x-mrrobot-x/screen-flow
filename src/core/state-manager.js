const StateManager = (function() {
  'use strict';
  
  let state = {};

  function getDefaultState() {
    return {
      activeFilter: DEFAULT_STATE.activeFilter,
      mediaFilter: DEFAULT_STATE.mediaFilter,
      lastOrganized: DEFAULT_STATE.lastOrganized,
      lastCleanup: DEFAULT_STATE.lastCleanup,
      pendingFiles: DEFAULT_STATE.pendingFiles,
      organizedCaptures: DEFAULT_STATE.organizedCaptures,
      removedCaptures: DEFAULT_STATE.removedCaptures,
      folders: JSON.parse(JSON.stringify(DEFAULT_FOLDERS)),
      activities: JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES)),
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
    };
  }
  
  function init() {
    state = Storage.get(STORAGE_KEYS.STATE) || getDefaultState();
  }
  
  function getState() {
    return { ...state };
  }
  
  let saveTimer = null;
  function autoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      Storage.set(STORAGE_KEYS.STATE, state);
    }, 500);
  }

  function setState(newState) {
    state = { ...state, ...newState };
    autoSave();
  }

  function getActiveFilter() {
    return state.activeFilter;
  }

  function setActiveFilter(filter) {
    state.activeFilter = filter;
    autoSave();
  }

  function getMediaFilter() {
    return state.mediaFilter;
  }

  function setMediaFilter(filter) {
    state.mediaFilter = filter;
    autoSave();
  }

  function getFolders() {
    return state.folders || [];
  }

  function setFolders(newFolders) {
    state.folders = [...newFolders];
    autoSave();
  }

  function getActivities() {
    return ActivityHelper.enrichActivities([...state.activities]);
  }
  
  function addActivity(activity) {
    const newActivity = {
      id: Date.now().toString(),
      ...activity,
      timestamp: activity.timestamp || Date.now()
    };

    state.activities = [newActivity, ...state.activities];
    if (state.activities.length > 10) {
      state.activities = state.activities.slice(0, 10);
    }
    autoSave();
  }

  function getSettings() {
    return state.settings;
  }

  function getSetting(key) {
    return state.settings[key];
  }

  function setSetting(key, value) {
    state.settings = { ...state.settings, [key]: value };
    autoSave();
  }

  function setSettings(newSettings) {
    state.settings = { ...state.settings, ...newSettings };
    autoSave();
  }

  function toggleSetting(key) {
    const newValue = !state.settings[key];
    state.settings = { ...state.settings, [key]: newValue };
    autoSave();
    return newValue;
  }

  function resetConfig() {
    state = getDefaultState();
    autoSave();
  }

  function deleteAll() {
    try {
      Storage.clear();
      state = getDefaultState();
      autoSave();
      return true;
    } catch (error) {
      console.error("Error deleting all data:", error);
      return false;
    }
  }

  function getTopFoldersByType(type) {
    const foldersCopy = [...state.folders];
    const sortedFolders = foldersCopy.sort((a, b) => {
      if (type === "screenshots") {
        return b.stats.ss - a.stats.ss;
      } else if (type === "recordings") {
        return b.stats.sr - a.stats.sr;
      }
      return 0;
    });

    const topFolders = sortedFolders.slice(0, 5);
    return topFolders.map(folder => ({
      name: folder.name,
      count: type === "screenshots" ? folder.stats.ss : folder.stats.sr
    }));
  }
  
  return {
    init,
    getState,
    setState,
    getActiveFilter,
    setActiveFilter,
    getMediaFilter,
    setMediaFilter,
    getFolders,
    setFolders,
    getActivities,
    addActivity,
    getSettings,
    getSetting,
    setSetting,
    setSettings,
    toggleSetting,
    resetConfig,
    deleteAll,
    getTopFoldersByType
  };
})();
