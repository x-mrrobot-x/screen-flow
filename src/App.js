const App = (function() {
  'use strict';
  
  function init() {
    console.log('🚀 Initializing Application...');
    
    try {
      // 1. Initialize Core Services
      EventBus.init();
      AppState.init();
      Icons.init();
      Navigation.init();
      
      // 2. Initialize Features
      DashboardController.init();
      ProcessController.init();
      OrganizerController.init();
      StatsController.init();
      SettingsController.init();
      CleanerController.init();
      
      console.log('✓ Application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
    }
  }
  
  return {
    init,
    goBack: Modal.goBack
  };
})();

App.init();