const SettingsModel = (function() {
  'use strict';
  
  function getSettings() {
    return StateManager.getSettings();
  }

  function getSetting(key) {
    return StateManager.getSetting(key);
  }

  function setSetting(key, value) {
    StateManager.setSetting(key, value);
    if (key === 'theme') {
      localStorage.setItem("screenflow-theme", value);
    }
    logSettingChange(key, value);
  }

  function toggleSetting(key) {
    const newValue = StateManager.toggleSetting(key);
    logSettingChange(key, newValue);
    return newValue;
  }

  function logSettingChange(key, value) {
    if (key === "autoOrganize") {
      StateManager.addActivity({
        type: "feature-toggle",
        feature: "auto-organize",
        enabled: value
      });
    } else {
      StateManager.addActivity({
        type: "settings",
        setting: key,
        value: value
      });
    }
  }

  function resetAllSettings() {
    StateManager.resetConfig();
  }

  function deleteAllData() {
    return StateManager.deleteAll();
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
