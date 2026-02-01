const App = (function() {
  'use strict';
  
  async function init() {
    console.log('🚀 Initializing Application...');
    
    try {
      // 1. Initialize Core Services
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
      
      console.log('✓ Application initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
    }
  }
  
  return {
    init,
    updateAppsData: AppsModel.updateAppsData,
    updateFoldersData: Analyzer.updateFoldersData,
    goBack: Modal.goBack
  };
})();

console.time("init")
App.init();
console.timeEnd("init")