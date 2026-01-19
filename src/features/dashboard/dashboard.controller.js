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
      EventBus.emit(EVENTS.DASHBOARD_LOADED);
      
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    }
  }
  
  function loadAndRender() {
    const data = DashboardModel.getState();
    DashboardView.render.complete(data);
  }
  
  function refresh() {
    DashboardModel.refresh();
    loadAndRender();
  }
  
  const handlers = {
    onStateChange(data) {
      if(data.key === 'activities' || data.key === 'folders') {
        refresh();
      }
    }
  };
  
  function attachEventListeners() {
    EventBus.on(EVENTS.STATE_CHANGED, handlers.onStateChange);
  }
  
  function detachEventListeners() {
    EventBus.off(EVENTS.STATE_CHANGED, handlers.onStateChange);
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
