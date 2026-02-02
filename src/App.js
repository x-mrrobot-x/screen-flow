const App = (function() {
  'use strict';
  
  async function init() {
    
    try {
      // 1. Initialize Core Services
      Logger.init();
      EventBus.init();
      TaskQueue.init();
      await AppState.init();
      AppMonitor.init();
      SubfolderMonitor.init();
      Navigation.init();
      Icons.init();

      // 2. Initialize Features
      DashboardController.init();
      ProcessController.init();
      OrganizerController.init();
      StatsController.init();
      SettingsController.init();
      CleanerController.init();
      
      Logger.info('✓ Application initialized successfully');

    } catch (error) {
      Logger.error('❌ Failed to initialize application:', error);
    }
  }
  
  return {
    init,
    onTaskerResult: TaskQueue.onResult,
    goBack: Modal.goBack
  };
})();

(async () => {
    const startTime = performance.now();
    await App.init();
    const endTime = performance.now();
    Logger.debug(`App initialization took: ${(endTime - startTime).toFixed(2)} ms`);
})();