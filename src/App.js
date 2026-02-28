const App = (function () {
  "use strict";

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

  async function init() {
    try {
      Logger.init();
      ScrollManager.init();
      Icons.init();
      await AppState.init();
      await I18n.init();
      applyBootSettings();
      reveal();
      SubfolderMonitor.init();
      AppMonitor.init();
      Navigation.init();

      DashboardController.init();
      ProcessController.init();
      ConfirmationDialog.init();

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

  function handleTaskResult(resultJson) {
    TaskQueue.onResult(resultJson);
  }

  function goBack(resultJson) {
    return DialogStack.goBack();
  }

  return {
    init,
    handleTaskResult,
    goBack
  };
})();

(async () => {
  const t0 = performance.now();
  await App.init();
  Logger.warn(`App initialized in ${(performance.now() - t0).toFixed(2)} ms`);
})();
