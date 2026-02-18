const StatsController = (function () {
  "use strict";

  let isInitialized = false;

  function init() {
    if (isInitialized) {
      Logger.warn("Stats already initialized");
      return;
    }

    try {
      StatsView.init(StatsConfig.SELECTORS.CONTAINER);
      loadAndRender();
      attachEventListeners();
      isInitialized = true;
    } catch (error) {
      Logger.error("Failed to initialize stats:", error);
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

  const debouncedRefresh = Utils.debounce(refresh, 100);

  const handlers = {
    onMediaTypeChange: e => {
      const button = e.target.closest(".media-type-button");
      const mediaType = button?.dataset.mediaType;
      if (mediaType) {
        StatsModel.setMediaType(mediaType);
        const data = StatsModel.getState();
        StatsView.render.mediaTypeUI(data.activeMediaType);
        refresh();
      }
    },
    onStateChange: data => {
      if (!data || !data.key) return;

      switch (data.key) {
        case "activities": {
          const activities = AppState.getActivities();
          StatsView.render.activityCard(activities);
          break;
        }
        case "stats": {
          debouncedRefresh();
          break;
        }
      }
    },
    onNavigationChange: data => {
      if (data.tab === "stats") {
        refresh();
      }
    }
  };

  function attachEventListeners() {
    const mediaButtons = document.querySelectorAll(
      StatsConfig.SELECTORS.mediaTypeButtons
    );
    mediaButtons.forEach(btn => {
      btn.addEventListener("click", handlers.onMediaTypeChange);
    });
    EventBus.on("appstate:changed", handlers.onStateChange);
    EventBus.on("navigation:changed", handlers.onNavigationChange);
  }

  return {
    init,
    refresh
  };
})();
