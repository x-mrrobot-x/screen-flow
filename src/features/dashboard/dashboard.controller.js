const DashboardController = (function () {
  "use strict";

  let isInitialized = false;

  function updateUI() {
    const data = DashboardModel.getState();
    DashboardView.update(data);
  }

  const debouncedUpdateUI = Utils.debounce(updateUI, 100);

  function refresh(data) {
    const keysToRefresh = ["stats", "folders"];
    if (keysToRefresh.includes(data.key)) {
      debouncedUpdateUI();
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
    updateUI();
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
