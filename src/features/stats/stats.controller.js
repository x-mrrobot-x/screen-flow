const StatsController = (function () {
  "use strict";

  let isInitialized = false;

  const CHART_CONFIG = {
    LABEL: {
      screenshots: "Capturas de tela",
      recordings: "Gravações de tela"
    },
    COLOR: {
      screenshots: "hsla(213 94% 68% / 0.8)",
      recordings: "hsla(255 92% 76% / 0.8)"
    },
    COLOR_PALETTE: [
      "hsl(210, 60%, 45%)",
      "hsl(160, 60%, 45%)",
      "hsl(260, 60%, 45%)",
      "hsl(320, 60%, 45%)",
      "hsl(40, 60%, 45%)",
      "hsl(280, 60%, 45%)",
      "hsl(120, 60%, 45%)",
      "hsl(20, 60%, 45%)",
      "hsl(190, 60%, 45%)",
      "hsl(300, 60%, 45%)"
    ]
  };

  function loadAndRender() {
    const data = StatsModel.getState();
    StatsView.render.all(data, CHART_CONFIG);
  }

  function refresh() {
    const data = StatsModel.getState();
    StatsView.render.weeklyChart(data, CHART_CONFIG);
    StatsView.render.foldersChart(data, CHART_CONFIG);
  }

  const debouncedRefresh = Utils.debounce(refresh, 100);

  const handlers = {
    onMediaTypeContainerClick: e => {
      const btn = e.target.closest(".stats-media-type-button");
      const mediaType = btn?.dataset.mediaType;
      if (!mediaType) return;
      StatsModel.setMediaType(mediaType);
      StatsView.update.mediaTypeButtons(mediaType);
      refresh();
    },

    onStateChange: data => {
      if (data.key === "activities") {
        StatsView.render.activityList(AppState.getActivities());
      }
      if (data.key === "stats") {
        debouncedRefresh();
      }
    },

    onNavigationChange: data => {
      if (data.tab === "stats") refresh();
    }
  };

  function attachEvents() {
    const { mediaTypeContainer } = StatsView.getElements();

    const events = [
      [mediaTypeContainer, "click", handlers.onMediaTypeContainerClick]
    ];
    events.forEach(([el, event, handler]) =>
      el.addEventListener(event, handler)
    );

    EventBus.on("appstate:changed", handlers.onStateChange);
    EventBus.on("navigation:changed", handlers.onNavigationChange);
  }

  function init() {
    if (isInitialized) return;
    StatsView.init();
    loadAndRender();
    attachEvents();
    isInitialized = true;
  }

  return {
    init,
    refresh
  };
})();
