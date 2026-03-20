import EventBus from "../platform/event-bus.js";
import ENV from "../platform/env.js";
import Logger from "../platform/logger.js";
import ActivityHelper from "./activity-helper.js";

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
  folders: () => debouncedPersist("FOLDERS", folders, 300),
  settings: () => debouncedPersist("SETTINGS", settings, 300),
  stats: () => debouncedPersist("STATS", stats, 300),
  activities: () => debouncedPersist("ACTIVITIES", activities, 300),
  apps: () => debouncedPersist("APPS", apps, 300)
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

function clearAllTimers() {
  Object.keys(timers).forEach(key => {
    clearTimeout(timers[key]);
    delete timers[key];
  });
}

function writeAllFiles() {
  return Promise.allSettled([
    ENV.writeFile("FOLDERS", folders),
    ENV.writeFile("SETTINGS", settings),
    ENV.writeFile("STATS", stats),
    ENV.writeFile("ACTIVITIES", activities),
    ENV.writeFile("APPS", apps)
  ]);
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

async function flushPersist() {
  clearAllTimers();
  await writeAllFiles();
}

function getFolders() {
  return [...folders];
}

function setFolders(newFolders) {
  folders = [...newFolders];
  persist.folders();
  emitChange("folders");
}

function getActivities() {
  return ActivityHelper.enrichActivities([...activities]);
}

function addActivity(activity) {
  const newActivity = createActivity(activity);
  activities = [newActivity, ...activities].slice(0, MAX_ACTIVITIES);
  persist.activities();
  emitChange("activities");
}

function getApps() {
  return [...apps];
}

function setApps(newApps) {
  apps = [...newApps];
  persist.apps();
  emitChange("apps");
}

function getSettings() {
  return { ...settings };
}

function getSetting(key) {
  return settings[key];
}

function setSetting(key, value) {
  settings = { ...settings, [key]: value };
  persist.settings();
  emitChange("settings");
}

function setSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  persist.settings();
  emitChange("settings");
}

function toggleSetting(key) {
  settings = { ...settings, [key]: !settings[key] };
  persist.settings();
  emitChange("settings");
  return settings[key];
}

function getStats() {
  return { ...stats };
}

function getStat(key) {
  return stats[key];
}

function setStats(newStats) {
  stats = { ...stats, ...newStats };
  persist.stats();
  emitChange("stats");
}

function incrementStat(key, amount = 1) {
  stats = { ...stats, [key]: (stats[key] || 0) + amount };
  persist.stats();
  emitChange("stats");
}

function resetConfig() {
  settings = ENV.getDefault("SETTINGS");
  persist.settings();
  emitChange("settings");
}

export default {
  init,
  loadStates,
  getFolders,
  setFolders,
  getActivities,
  addActivity,
  getApps,
  setApps,
  getSettings,
  getSetting,
  setSetting,
  setSettings,
  toggleSetting,
  getStats,
  getStat,
  setStats,
  incrementStat,
  resetConfig,
  flushPersist,
  deleteAll,
  getTopFoldersByType
};
