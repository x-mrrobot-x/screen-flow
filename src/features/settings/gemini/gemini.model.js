import AppState from "../../../core/state/app-state.js";

function getSetting() {
  return AppState.getSetting("gemini") || {};
}

function saveSetting(model, apiKeys) {
  AppState.setSetting("gemini", {
    model,
    apiKeys,
    activeKeyIndex: 0
  });
}

export default {
  getSetting,
  saveSetting
};
