const App = (function() {
  'use strict';
  
  async function init() {
    
    try {
      // 1. Initialize Core Services
      Logger.init();
      Icons.init();
      EventBus.init();
      TaskQueue.init();
      await AppState.init();
      SubfolderMonitor.init();
      AppMonitor.init();
      Navigation.init();

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
    Logger.warn(`App initialization took: ${(endTime - startTime).toFixed(2)} ms`);
})();