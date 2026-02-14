const DashboardController = (function () {
  "use strict";

  let isInitialized = false;

  function refreshUI() {
    const data = DashboardModel.getState();
    DashboardView.update(data);
  }

  function refresh(data) {
    if (data && data.key === "stats") {
      refreshUI();
    }
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

  function attachEventListeners() {
    EventBus.on("appstate:changed", refresh);
  }

  async function init() {
    if (isInitialized) {
      Logger.warn("Dashboard already initialized");
      return;
    }

    DashboardView.init();
    refreshUI();
    loadStats();
    attachEventListeners();
    isInitialized = true;
  }

  return {
    init,
    loadStats,
    refresh
  };
})();
