const DashboardModel = (function() {
  'use strict';
  
  let state = {};

  function getTotalOrganized() {
    const organizeItems = AppState.getOrganizeItems();
    return organizeItems.reduce((sum, item) => sum + item.stats.ss + item.stats.sr, 0);
  }

  function getTopOrganizedApp() {
    const organizeItems = AppState.getOrganizeItems();
    if (organizeItems.length === 0) return null;

    const organizeItemsWithTotals = organizeItems.map(item => ({
      ...item,
      totalFiles: item.stats.ss + item.stats.sr
    }));

    return organizeItemsWithTotals.reduce((top, current) =>
      current.totalFiles > top.totalFiles ? current : top
    );
  }

  function getState() {
    const stats = AppState.getStats();
    const topApp = getTopOrganizedApp();

    state = {
      organized: getTotalOrganized(),
      removed: stats.removedCaptures || 0,
      pending: stats.pendingFiles || 0,
      lastOrganized: stats.lastOrganized,
      lastCleanup: stats.lastCleanup,
      topApp: topApp ? {
        name: topApp.name,
        count: topApp.totalFiles
      } : {
        name: "Nenhum",
        count: 0
      }
    };
    return state;
  }
  
  function refresh() {
    return getState();
  }
  
  return {
    getState,
    refresh
  };
})();
