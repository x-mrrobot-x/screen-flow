import Logger from "./core/platform/logger.js";
import ScrollManager from "./core/ui/scroll.js";
import Icons from "./core/ui/icons.js";
import AppState from "./core/state/app-state.js";
import I18n from "./core/services/i18n.js";
import SubfolderMonitor from "./core/services/subfolder-monitor.js";
import AppMonitor from "./core/services/app-monitor.js";
import Navigation from "./core/ui/navigation.js";
import TaskQueue from "./core/platform/task-queue.js";
import DialogStack from "./core/ui/dialog-stack.js";
import DOM from "./lib/dom.js";
import SettingsView from "./features/settings/settings.view.js";
import DashboardController from "./features/dashboard/dashboard.controller.js";
import ProcessController from "./features/dashboard/process/process.controller.js";
import ConfirmationDialog from "./core/ui/confirmation-dialog.js";
import OrganizerController from "./features/organizer/organizer.controller.js";
import StatsController from "./features/stats/stats.controller.js";
import CleanerController from "./features/cleaner/cleaner.controller.js";
import SettingsController from "./features/settings/settings.controller.js";

function reveal() {
  const app = DOM.qs("#app");
  app.style.visibility = "visible";
}

function applyBootSettings() {
  const THEMES = ["light", "dark", "system"];
  const { theme, animationsEnabled } = AppState.getSettings();
  SettingsView.render.theme(theme, THEMES);
  if (animationsEnabled === false) {
    document.documentElement.classList.add("no-animations");
  }
}

function handleTaskResult(resultJson) {
  TaskQueue.onResult(resultJson);
}

function goBack() {
  return DialogStack.goBack();
}

async function init() {
  try {
    Logger.init();
    ScrollManager.init();
    Icons.init();
    AppState.init();
    await I18n.init();
    applyBootSettings();
    reveal();
    SubfolderMonitor.init();
    AppMonitor.init();
    Navigation.init();

    DashboardController.init();
    ProcessController.init();
    ConfirmationDialog.setup();

    Navigation.registerLazy("organizer", () => OrganizerController.init());
    Navigation.registerLazy("stats", () => StatsController.init());
    Navigation.registerLazy("cleaner", () => CleanerController.init());
    Navigation.registerLazy("settings", () => SettingsController.init());

    Logger.info("✓ Application initialized successfully");
  } catch (error) {
    Logger.error("❌ Failed to initialize application:", error);
    reveal();
  }
}

export default {
  init,
  handleTaskResult,
  goBack
};
