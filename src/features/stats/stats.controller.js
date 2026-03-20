import StatsModel from "./stats.model.js";
import StatsView from "./stats.view.js";
import EventBus from "../../core/platform/event-bus.js";
import AppState from "../../core/state/app-state.js";
import Utils from "../../lib/utils.js";

let isInitialized = false;

function loadAndRender() {
  const data = StatsModel.getState();
  StatsView.render.all(data, AppState.getActivities());
}

function refresh() {
  const data = StatsModel.getState();
  StatsView.render.weeklyChart(data);
  StatsView.render.foldersChart(data);
}

const debouncedRefresh = Utils.debounce(refresh, 100);

const handlers = {
  onMediaTypeContainerClick: e => {
    const btn = e.target.closest(".stats-media-type-button");
    const mediaType = btn?.dataset.mediaType;
    if (!mediaType) return;
    StatsModel.setMediaType(mediaType);
    StatsView.update.mediaTypeButtons(mediaType);
    refresh();
  },
  onStateChange: data => {
    if (data.key === "activities")
      StatsView.render.activityList(AppState.getActivities());
    if (data.key === "stats") debouncedRefresh();
  },
  onNavigationChange: data => {
    if (data.tab === "stats") refresh();
  }
};

function attachEvents() {
  const { mediaTypeContainer } = StatsView.getElements();
  const events = [
    [mediaTypeContainer, "click", handlers.onMediaTypeContainerClick]
  ];
  events.forEach(([el, event, handler]) => el.addEventListener(event, handler));

  EventBus.on("appstate:changed", handlers.onStateChange);
  EventBus.on("navigation:changed", handlers.onNavigationChange);
}

function init() {
  if (isInitialized) return;
  StatsView.init();
  loadAndRender();
  attachEvents();
  isInitialized = true;
}

export default {
  init,
  refresh
};
