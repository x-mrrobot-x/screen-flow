const FoldersController = (function() {
  'use strict';
  
  let isInitialized = false;

  function render() {
    const folders = FoldersModel.getFolders();
    const state = FoldersModel.getState();
    FoldersView.render.folders(folders, state.activeFilter, state.mediaFilter);
    FoldersView.render.mediaCounter(folders, state.activeFilter);
    FoldersView.render.filters(state.activeFilter);
  }

  const handlers = {
    onSearch: (e) => {
      FoldersModel.setSearchTerm(e.target.value);
      render();
    },
    onFilterClick: (e) => {
      const filter = e.target.closest('[data-filter]').dataset.filter;
      FoldersModel.setFilter(filter);
      render();
    },
    onCardClick: (e) => {
      const folderCard = e.target.closest(FoldersConfig.SELECTORS.folderCard);
      if (!folderCard) return;
      
      const folderId = folderCard.dataset.folderId;
      if (!folderId) return;

      const menuDots = e.target.closest(FoldersConfig.SELECTORS.folderMenuDots);
      if (menuDots) {
        e.stopPropagation();
        const menu = FoldersView.showActionsMenu(folderId, folderCard);
        if(menu) {
          menu.addEventListener('click', handlers.onMenuClick);
        }
      }
    },
    onMenuClick: (e) => {
      e.stopPropagation();
      const actionItem = e.target.closest('[data-action]');
      if(!actionItem) return;

      const action = actionItem.dataset.action;
      const popup = actionItem.closest(FoldersConfig.SELECTORS.folderActionsPopup);
      const folderId = popup.dataset.folderId;

      if (action === 'clear') {
        const activeFilter = FoldersModel.getState().activeFilter;
        const type = activeFilter === 'all' ? 'both' : (activeFilter === 'screenshots' ? 'ss' : 'sr');
        const removedCount = FoldersModel.clearFolderStats(folderId, type);
        if (removedCount > 0) {
          EventBus.emit(EVENTS.SHOW_TOAST, { message: `${removedCount} item(ns) removido(s) com sucesso!`, type: 'success' });
        }
        render();
      }
      popup.remove();
    }
  };
  
  function attachEventListeners() {
    const searchInput = DOM.qs(FoldersConfig.SELECTORS.searchInput);
    if(searchInput) searchInput.addEventListener('input', handlers.onSearch);

    const filterButtons = DOM.qsa(FoldersConfig.SELECTORS.filterButtons);
    filterButtons.forEach(btn => btn.addEventListener('click', handlers.onFilterClick));

    const grid = DOM.qs(FoldersConfig.SELECTORS.foldersGrid);
    if(grid) grid.addEventListener('click', handlers.onCardClick);
  }

  function init() {
    if (isInitialized) return;
    FoldersView.init(FoldersConfig.SELECTORS.CONTAINER);
    render();
    attachEventListeners();
    isInitialized = true;
  }
  
  return {
    init
  };
})();
