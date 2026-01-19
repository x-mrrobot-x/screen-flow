const FoldersModel = (function() {
  'use strict';
  
  let state = {
    folders: [],
    activeFilter: 'all',
    mediaFilter: 'screenshots',
    searchTerm: ''
  };

  function getFolders() {
    state.folders = StateManager.getFolders();
    state.activeFilter = StateManager.getActiveFilter() || 'all';
    state.mediaFilter = StateManager.getMediaFilter() || 'screenshots';
    
    let filteredFolders = state.folders;
    if (state.searchTerm) {
      filteredFolders = filteredFolders.filter(folder => 
        folder.name.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }
    
    return filteredFolders;
  }

  function setFilter(filter) {
    StateManager.setActiveFilter(filter);
    state.activeFilter = filter;
  }

  function setMediaFilter(filter) {
    StateManager.setMediaFilter(filter);
    state.mediaFilter = filter;
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
    setMediaFilter,
    setSearchTerm,
    deleteFolder,
    clearFolderStats,
    getState: () => ({...state})
  };
})();
