import AppState from "../../core/state/app-state.js";

const BACKUP_VERSION = "1";
const BACKUP_REQUIRED_KEYS = [
  "settings",
  "folders",
  "activities",
  "stats",
  "apps"
];

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

function buildBackup() {
  const settings = { ...AppState.getSettings() };

  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    data: {
      settings,
      folders: AppState.getFolders(),
      activities: AppState.getActivities(),
      stats: AppState.getStats(),
      apps: AppState.getApps()
    }
  };
}

function validateBackup(backup) {
  if (!backup || typeof backup !== "object") return false;
  if (backup.version !== BACKUP_VERSION) return false;
  if (!backup.data || typeof backup.data !== "object") return false;
  return BACKUP_REQUIRED_KEYS.every(key => key in backup.data);
}

function restoreBackup(backup) {
  if (!validateBackup(backup)) return false;

  const { settings, folders, activities, stats, apps } = backup.data;

  AppState.setSettings(settings);
  AppState.setFolders(folders);
  AppState.setStats(stats);
  AppState.setApps(apps);

  if (Array.isArray(activities)) {
    activities.forEach(activity => AppState.addActivity(activity));
  }

  return true;
}

export default {
  getSettings,
  getSetting,
  setSetting,
  toggleSetting,
  resetAllSettings,
  deleteAllData,
  buildBackup,
  validateBackup,
  restoreBackup
};
