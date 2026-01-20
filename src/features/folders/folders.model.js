const FoldersModel = (function() {
  'use strict';
  
  let state = {
    folders: [],
    activeFilter: 'all',
    searchTerm: ''
  };

  function getFolders() {
    state.folders = AppState.getFolders();

    let filteredFolders = state.folders;

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
    const folders = AppState.getFolders();
    const updatedFolders = folders.filter(f => f.id !== id);
    AppState.setFolders(updatedFolders);
  }

  function clearFolderStats(folderId, type) {
    const folders = AppState.getFolders();
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
      AppState.setFolders(folders);
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
