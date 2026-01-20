const FoldersModel = (function() {
  'use strict';
  
  let state = {
    folders: [],
    activeFilter: 'all',
    searchTerm: ''
  };

  function getFolders() {
    state.folders = StateManager.getFolders();

    let filteredFolders = state.folders;

    // Apply active filter
    if (state.activeFilter && state.activeFilter !== 'all') {
      if (state.activeFilter === 'screenshots') {
        filteredFolders = filteredFolders.filter(folder =>
          (folder.stats.ss || 0) > 0
        );
      } else if (state.activeFilter === 'recordings') {
        filteredFolders = filteredFolders.filter(folder =>
          (folder.stats.sr || 0) > 0
        );
      }
    }

    if (state.searchTerm) {
      filteredFolders = filteredFolders.filter(folder =>
        folder.name.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    return filteredFolders;
  }

  function setFilter(filter) {
    state.activeFilter = filter;
  }

  function setSearchTerm(term) {
    state.searchTerm = term;
  }

  function deleteFolder(id) {
    const folders = StateManager.getFolders();
    const updatedFolders = folders.filter(f => f.id !== id);
    StateManager.setFolders(updatedFolders);
  }

  function clearFolderStats(folderId, type) {
    const folders = StateManager.getFolders();
    const folderIndex = folders.findIndex(f => f.id === folderId);

    if (folderIndex !== -1) {
      const folder = folders[folderIndex];
      let removedCount = 0;
      if (type === 'ss') {
        removedCount = folder.stats.ss;
        folder.stats.ss = 0;
      } else if (type === 'sr') {
        removedCount = folder.stats.sr;
        folder.stats.sr = 0;
      } else if (type === 'both') {
        removedCount = folder.stats.ss + folder.stats.sr;
        folder.stats.ss = 0;
        folder.stats.sr = 0;
      }
      folder.stats.lu = Date.now();
      StateManager.setFolders(folders);
      return removedCount;
    }
    return 0;
  }

  return {
    getFolders,
    setFilter,
    setSearchTerm,
    deleteFolder,
    clearFolderStats,
    getState: () => ({...state})
  };
})();
