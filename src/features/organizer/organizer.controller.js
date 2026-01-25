const OrganizerController = (function() {
  'use strict';

  let isInitialized = false;

  function render() {
    const folders = OrganizerModel.getFolders();
    const state = OrganizerModel.getState();
    OrganizerView.render.folders(folders, state.activeFilter);
    OrganizerView.render.mediaCounter(folders, state.activeFilter);
    OrganizerView.render.filters(state.activeFilter);
  }

  let currentPopupMenu = null;

  const handlers = {
    onSearch: (e) => {
      OrganizerModel.setSearchTerm(e.target.value);
      render();
    },
    onFilterClick: (e) => {
      const filter = e.target.closest('[data-filter]').dataset.filter;
      OrganizerModel.setFilter(filter);
      render();
    },
    onCardClick: (e) => {
      const folderCard = e.target.closest(OrganizerConfig.SELECTORS.folderCard);
      if (!folderCard) return;

      const folderId = folderCard.dataset.folderId;
      if (!folderId) return;

      const menuDots = e.target.closest(OrganizerConfig.SELECTORS.folderMenuDots);
      if (menuDots) {
        e.stopPropagation();

        // Close any existing popup menu
        if (currentPopupMenu) {
          currentPopupMenu.remove();
          currentPopupMenu = null;
        }

        const menu = OrganizerView.showActionsMenu(folderId, folderCard);
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
      const popup = actionItem.closest(OrganizerConfig.SELECTORS.folderActionsPopup);
      const folderId = popup.dataset.folderId;

      if (action === 'clear') {
        const activeFilter = OrganizerModel.getState().activeFilter;
        const type = activeFilter === 'all' ? 'both' : (activeFilter === 'screenshots' ? 'ss' : 'sr');
        const removedCount = OrganizerModel.clearFolderStats(folderId, type);

        // Get folder name for the activity
        const folders = OrganizerModel.getFolders();
        const folder = folders.find(f => f.id === folderId);
        const folderName = folder ? folder.name : 'Unknown';

        if (removedCount > 0) {
          AppState.addActivity({
            type: "cleaner-folder",
            count: removedCount,
            execution: "manual",
            folder: folderName,
            mediaType: type,
            timestamp: Date.now()
          });

          Toast.success(`${removedCount} ${removedCount > 1 ? 'itens removidos' : 'item removido'} com sucesso!`);
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
    const searchInput = DOM.qs(OrganizerConfig.SELECTORS.searchInput);
    if(searchInput) searchInput.addEventListener('input', handlers.onSearch);

    const filterButtons = DOM.qsa(OrganizerConfig.SELECTORS.filterButtons);
    filterButtons.forEach(btn => btn.addEventListener('click', handlers.onFilterClick));

    const grid = DOM.qs(OrganizerConfig.SELECTORS.foldersGrid);
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
    OrganizerView.init(OrganizerConfig.SELECTORS.CONTAINER);
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
