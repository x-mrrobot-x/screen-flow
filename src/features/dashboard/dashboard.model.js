const DashboardModel = (function() {
  'use strict';
  
  let state = {};

  function getTotalOrganized() {
    const folders = StateManager.getFolders();
    return folders.reduce((sum, folder) => sum + folder.stats.ss + folder.stats.sr, 0);
  }

  function getTopOrganizedApp() {
    const folders = StateManager.getFolders();
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
    const managerState = StateManager.getState();
    const topApp = getTopOrganizedApp();
    
    state = {
      organized: getTotalOrganized(),
      removed: managerState.removedCaptures,
      pending: managerState.pendingFiles,
      lastOrganized: managerState.lastOrganized,
      lastCleanup: managerState.lastCleanup,
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
