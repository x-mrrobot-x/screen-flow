const App = (function() {
  'use strict';
  
  async function init() {
    
    try {
      // 1. Initialize Core Services
      Logger.init();
      EventBus.init();
      await AppState.init();
      // Analyzer.init();
      Navigation.init();
      Icons.init();
      SubfolderMonitor.init();
      
      // 2. Initialize Features
      DashboardController.init();
      ProcessController.init();
      OrganizerController.init();
      StatsController.init();
      SettingsController.init();
      CleanerController.init();
      AppsController.init();
      
      Logger.info('✓ Application initialized successfully');

    } catch (error) {
      Logger.error('❌ Failed to initialize application:', error);
    }
  }
  
  return {
    init,
    updateAppsData: AppsModel.updateAppsData,
    updateFoldersData: Analyzer.updateFoldersData,
    goBack: Modal.goBack
  };
})();

(async () => {
    const startTime = performance.now();
    await App.init();
    const endTime = performance.now();
    Logger.debug(`App initialization took: ${(endTime - startTime).toFixed(2)} ms`);
})();