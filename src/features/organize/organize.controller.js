const OrganizeController = (function() {
  'use strict';

  let isInitialized = false;

  function render() {
    const folders = OrganizeModel.getFolders();
    const state = OrganizeModel.getState();
    OrganizeView.render.folders(folders, state.activeFilter);
    OrganizeView.render.mediaCounter(folders, state.activeFilter);
    OrganizeView.render.filters(state.activeFilter);
  }

  let currentPopupMenu = null;

  const handlers = {
    onSearch: (e) => {
      OrganizeModel.setSearchTerm(e.target.value);
      render();
    },
    onFilterClick: (e) => {
      const filter = e.target.closest('[data-filter]').dataset.filter;
      OrganizeModel.setFilter(filter);
      render();
    },
    onCardClick: (e) => {
      const folderCard = e.target.closest(OrganizeConfig.SELECTORS.folderCard);
      if (!folderCard) return;

      const folderId = folderCard.dataset.folderId;
      if (!folderId) return;

      const menuDots = e.target.closest(OrganizeConfig.SELECTORS.folderMenuDots);
      if (menuDots) {
        e.stopPropagation();

        // Close any existing popup menu
        if (currentPopupMenu) {
          currentPopupMenu.remove();
          currentPopupMenu = null;
        }

        const menu = OrganizeView.showActionsMenu(folderId, folderCard);
        if(menu) {
          currentPopupMenu = menu;
          menu.addEventListener('click', handlers.onMenuClick);
        }
      }
    },
    onMenuClick: (e) => {
      e.stopPropagation();
      const actionItem = e.target.closest('[data-action]');
      if(!actionItem) return;

      const action = actionItem.dataset.action;
      const popup = actionItem.closest(OrganizeConfig.SELECTORS.folderActionsPopup);
      const folderId = popup.dataset.folderId;

      if (action === 'clear') {
        const activeFilter = OrganizeModel.getState().activeFilter;
        const type = activeFilter === 'all' ? 'both' : (activeFilter === 'screenshots' ? 'ss' : 'sr');
        const removedCount = OrganizeModel.clearFolderStats(folderId, type);

        // Get folder name for the activity
        const folders = OrganizeModel.getFolders();
        const folder = folders.find(f => f.id === folderId);
        const folderName = folder ? folder.name : 'Unknown';

        if (removedCount > 0) {
          AppState.addActivity({
            type: "clean-folder",
            count: removedCount,
            execution: "manual",
            folder: folderName,
            mediaType: type,
            timestamp: Date.now()
          });

          Toast.success(`${removedCount} item(ns) removido(s) com sucesso!`);
        }
        render();
      }
      popup.remove();
      currentPopupMenu = null;
    },
    onDocumentClick: (e) => {
      // Close popup if clicked outside
      if (currentPopupMenu && !currentPopupMenu.contains(e.target)) {
        currentPopupMenu.remove();
        currentPopupMenu = null;
      }
    }
  };

  function attachEventListeners() {
    const searchInput = DOM.qs(OrganizeConfig.SELECTORS.searchInput);
    if(searchInput) searchInput.addEventListener('input', handlers.onSearch);

    const filterButtons = DOM.qsa(OrganizeConfig.SELECTORS.filterButtons);
    filterButtons.forEach(btn => btn.addEventListener('click', handlers.onFilterClick));

    const grid = DOM.qs(OrganizeConfig.SELECTORS.foldersGrid);
    if(grid) grid.addEventListener('click', handlers.onCardClick);

    // Add document click listener to close popup when clicking outside
    document.addEventListener('click', handlers.onDocumentClick);
  }

  function cleanupEventListeners() {
    // Remove document click listener when cleaning up
    document.removeEventListener('click', handlers.onDocumentClick);
  }

  function init() {
    if (isInitialized) return;
    OrganizeView.init(OrganizeConfig.SELECTORS.CONTAINER);
    render();
    attachEventListeners();
    isInitialized = true;
  }

  function destroy() {
    if (!isInitialized) return;
    cleanupEventListeners();
    currentPopupMenu = null;
    isInitialized = false;
  }

  return {
    init,
    destroy
  };
})();
