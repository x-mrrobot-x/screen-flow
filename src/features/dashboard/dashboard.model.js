const DashboardModel = (function() {
  'use strict';
  
  let state = {};

  function getTopOrganizedApp() {
    const folders = AppState.getFolders();
    if (folders.length === 0) return null;

    const foldersWithTotals = folders.map(folder => ({
      ...folder,
      totalFiles: folder.stats.ss + folder.stats.sr
    }));

    return foldersWithTotals.reduce((top, current) =>
      current.totalFiles > top.totalFiles ? current : top
    );
  }

  function getState() {
    const stats = AppState.getStats();
    const topApp = getTopOrganizedApp();

    state = {
      organized: stats.organizedCaptures || 0,
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