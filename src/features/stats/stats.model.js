import AppState from "../../core/state/app-state.js";
import I18n from "../../core/services/i18n.js";

const MEDIA_TYPES = ["screenshots", "recordings"];

let state = {
  activeMediaType: "screenshots",
  weeklyData: [],
  topFolders: []
};

function formatDayLabel(ts) {
  return new Date(ts).toLocaleDateString(I18n.getLocale(), {
    day: "2-digit",
    month: "2-digit"
  });
}

function getWeeklyData(mediaType = "screenshots") {
  const daily = AppState.getStats().dailyOrganized?.[mediaType] ?? [];
  return daily.map(({ ts, count }) => ({
    day: formatDayLabel(ts),
    value: count
  }));
}

function getMediaTypeOptions() {
  return MEDIA_TYPES;
}

function getTopFolders(mediaType) {
  return AppState.getTopFoldersByType(mediaType);
}

function getState() {
  state.weeklyData = getWeeklyData(state.activeMediaType);
  state.topFolders = getTopFolders(state.activeMediaType);
  return { ...state };
}

function setMediaType(mediaType) {
  if (MEDIA_TYPES.includes(mediaType)) state.activeMediaType = mediaType;
}

export default {
  getState,
  setMediaType,
  getMediaTypeOptions
};
