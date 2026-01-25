const DashboardController = (function() {
  'use strict';
  
  let isInitialized = false;
  
  function init() {
    if (isInitialized) {
      console.warn('Dashboard already initialized');
      return;
    }
    
    try {
      DashboardView.init(DashboardConfig.SELECTORS.CONTAINER);
      loadAndRender();
      attachEventListeners();
      isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    }
  }
  
  function loadAndRender() {
    const data = DashboardModel.getState();
    DashboardView.render.complete(data);
  }
  
  function refresh(event) {
    const relevantKeys = ["stats", "folders", "activities"];
    if (event && relevantKeys.includes(event.key)) {
      loadAndRender();
    }
  }
  
  function attachEventListeners() {
    EventBus.on("appstate:changed", refresh);
  }

  function detachEventListeners() {
    EventBus.off("appstate:changed", refresh);
  }
  
  function destroy() {
    if (!isInitialized) return;
    detachEventListeners();
    DashboardView.clear();
    isInitialized = false;
  }
  
  return {
    init,
    destroy,
    refresh
  };
})();
