const App = (function () {
  "use strict";

  function reveal() {
    const app = DOM.qs("#app");
    app.style.visibility = "visible";
  }

  async function init() {
    try {
      Logger.init();
      ScrollManager.init();
      Icons.init();
      await AppState.init();
      await I18n.init();
      SubfolderMonitor.init();
      AppMonitor.init();
      Navigation.init();

      DashboardController.init();
      ProcessController.init();
      OrganizerController.init();
      StatsController.init();
      CleanerController.init();
      SettingsController.init();
      ConfirmationDialog.init();

      reveal();

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
