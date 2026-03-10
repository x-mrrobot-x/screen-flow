import AppState from "../../core/state/app-state.js";

function getSettings() {
  return AppState.getSettings();
}

function getSetting(key) {
  return AppState.getSetting(key);
}

function setSetting(key, value) {
  AppState.setSetting(key, value);
}

function toggleSetting(key) {
  return AppState.toggleSetting(key);
}

function resetAllSettings() {
  AppState.resetConfig();
}

function deleteAllData() {
  return AppState.deleteAll();
}

export default {
  getSettings,
  getSetting,
  setSetting,
  toggleSetting,
  resetAllSettings,
  deleteAllData
};
