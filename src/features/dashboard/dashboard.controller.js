const DashboardController = (function () {
  "use strict";

  let isInitialized = false;

  function updateUI() {
    const data = DashboardModel.getState();
    DashboardView.update.all(data);
  }

  const debouncedUpdateUI = Utils.debounce(updateUI, 100);

  const handlers = {
    onStateChange: data => {
      if (["stats", "folders", "settings"].includes(data.key)) {
        debouncedUpdateUI();
      }
    },

    onAutomationsClick: e => {
      const card = e.target.closest("[data-navigate]");
      if (!card) return;
      Navigation.navigateTo(card.dataset.navigate);
    }
  };

  function attachEvents() {
    const { automations } = DashboardView.getElements();

    const events = [
      [automations.section, "click", handlers.onAutomationsClick]
    ];
    events.forEach(([el, event, handler]) =>
      el.addEventListener(event, handler)
    );

    EventBus.on("appstate:changed", handlers.onStateChange);
  }

  async function loadStats() {
    try {
      const [toOrganize, foldersCreated] = await Promise.all([
        DashboardModel.getToOrganizeFileCounts(),
        DashboardModel.getOrganizedFolderCounts()
      ]);
      AppState.setStats({
        toOrganize,
        foldersCreated
      });
    } catch (error) {
      Logger.error("Failed to load dashboard stats:", error);
    }
  }

  async function init() {
    if (isInitialized) return;
    DashboardView.init();
    updateUI();
    loadStats();
    attachEvents();
    isInitialized = true;
  }

  return {
    init,
    loadStats
  };
})();
