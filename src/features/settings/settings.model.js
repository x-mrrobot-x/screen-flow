const SettingsModel = (function() {
  'use strict';
  
  function getSettings() {
    return AppState.getSettings();
  }

  function getSetting(key) {
    return AppState.getSetting(key);
  }

  function setSetting(key, value) {
    AppState.setSetting(key, value);
    if (key === 'theme') {
      localStorage.setItem("screenflow-theme", value);
    }
    logSettingChange(key, value);
  }

  function toggleSetting(key) {
    const newValue = AppState.toggleSetting(key);
    logSettingChange(key, newValue);
    return newValue;
  }

  function logSettingChange(key, value) {
    if (key === "autoOrganizer") {
      AppState.addActivity({
        type: "feature-toggle",
        feature: "auto-organizer",
        enabled: value
      });
    }
  }

  function resetAllSettings() {
    AppState.resetConfig();
  }

  function deleteAllData() {
    return AppState.deleteAll();
  }

  return {
    getSettings,

    getSetting,
    setSetting,
    toggleSetting,
    resetAllSettings,
    deleteAllData
  };
})();
