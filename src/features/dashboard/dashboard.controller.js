import DashboardModel from "./dashboard.model.js";
import DashboardView from "./dashboard.view.js";
import EventBus from "../../core/platform/event-bus.js";
import Navigation from "../../core/ui/navigation.js";
import AppState from "../../core/state/app-state.js";
import Logger from "../../core/platform/logger.js";
import Utils from "../../lib/utils.js";

let isInitialized = false;

function updateUI() {
  const data = DashboardModel.getState();
  DashboardView.update.all(data);
}

const debouncedUpdateUI = Utils.debounce(updateUI, 100);

async function loadStats() {
  try {
    const [toOrganize, foldersCreated] = await Promise.all([
      DashboardModel.getToOrganizeFileCounts(),
      DashboardModel.getOrganizedFolderCounts()
    ]);
    AppState.setStats({ toOrganize, foldersCreated });
  } catch (error) {
    Logger.error("Failed to load dashboard stats:", error);
  }
}

const handlers = {
  onStateChange: data => {
    if (["stats", "folders", "settings"].includes(data.key))
      debouncedUpdateUI();
  },
  onAutomationsClick: e => {
    const card = e.target.closest("[data-navigate]");
    if (!card) return;
    Navigation.navigateTo(card.dataset.navigate);
  }
};

function attachEvents() {
  const { automations } = DashboardView.getElements();
  const events = [[automations.section, "click", handlers.onAutomationsClick]];
  events.forEach(([el, event, handler]) => el.addEventListener(event, handler));

  EventBus.on("appstate:changed", handlers.onStateChange);
  EventBus.on("dashboard:reload-stats", loadStats);
}

async function init() {
  if (isInitialized) return;
  DashboardView.init();
  updateUI();
  loadStats();
  attachEvents();
  isInitialized = true;
}

export default {
  init,
  loadStats
};
