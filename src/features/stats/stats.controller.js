const StatsController = (function() {
  'use strict';
  
  let isInitialized = false;
  
  function init() {
    if (isInitialized) {
      console.warn('Stats already initialized');
      return;
    }
    
    try {
      StatsView.init(StatsConfig.SELECTORS.CONTAINER);
      loadAndRender();
      attachEventListeners();
      isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize stats:', error);
    }
  }
  
  function loadAndRender() {
    const data = StatsModel.getState();
    StatsView.render.complete(data);
  }
  
  function refresh() {
    const data = StatsModel.getState();
    StatsView.render.weeklyChart(data);
    StatsView.render.foldersChart(data);
  }

  const handlers = {
    onMediaTypeChange: (e) => {
      const button = e.target.closest('.media-type-button');
      const mediaType = button?.dataset.mediaType;
      if (mediaType) {
        StatsModel.setMediaType(mediaType);
        const data = StatsModel.getState();
        StatsView.render.mediaTypeUI(data.activeMediaType);
        refresh();
      }
    },
    onStateChange: (data) => {
      console.log(data)
      if(data.key === 'activities') {
        const activities = AppState.getActivities();
        StatsView.render.activityCard(activities);
      }
    }
  };
  
  function attachEventListeners() {
    const mediaButtons = document.querySelectorAll(StatsConfig.SELECTORS.mediaTypeButtons);
    mediaButtons.forEach(btn => {
      btn.addEventListener('click', handlers.onMediaTypeChange);
    });
  }
  
  function detachEventListeners() {
    const mediaButtons = document.querySelectorAll(StatsConfig.SELECTORS.mediaTypeButtons);
    mediaButtons.forEach(btn => {
      btn.removeEventListener('click', handlers.onMediaTypeChange);
    });
  }
  
  function destroy() {
    if (!isInitialized) return;
    detachEventListeners();
    StatsView.clear();
    isInitialized = false;
  }
  
  return {
    init,
    destroy,
    refresh
  };
})();
