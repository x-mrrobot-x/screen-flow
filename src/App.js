const App = (function () {
  "use strict";

  async function init() {
    try {
      Logger.init();
      ScrollManager.init();
      Icons.init();
      await AppState.init();
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

      Logger.info("✓ Application initialized successfully");
    } catch (error) {
      Logger.error("❌ Failed to initialize application:", error);
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
