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
        const menu = OrganizeView.showActionsMenu(folderId, folderCard);
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
      const popup = actionItem.closest(OrganizeConfig.SELECTORS.folderActionsPopup);
      const folderId = popup.dataset.folderId;

      if (action === 'clear') {
        const activeFilter = OrganizeModel.getState().activeFilter;
        const type = activeFilter === 'all' ? 'both' : (activeFilter === 'screenshots' ? 'ss' : 'sr');
        const removedCount = OrganizeModel.clearFolderStats(folderId, type);
        if (removedCount > 0) {
          Toast.success(`${removedCount} item(ns) removido(s) com sucesso!`);
        }
        render();
      }
      popup.remove();
    }
  };

  function attachEventListeners() {
    const searchInput = DOM.qs(OrganizeConfig.SELECTORS.searchInput);
    if(searchInput) searchInput.addEventListener('input', handlers.onSearch);

    const filterButtons = DOM.qsa(OrganizeConfig.SELECTORS.filterButtons);
    filterButtons.forEach(btn => btn.addEventListener('click', handlers.onFilterClick));

    const grid = DOM.qs(OrganizeConfig.SELECTORS.foldersGrid);
    if(grid) grid.addEventListener('click', handlers.onCardClick);
  }

  function init() {
    if (isInitialized) return;
    OrganizeView.init(OrganizeConfig.SELECTORS.CONTAINER);
    render();
    attachEventListeners();
    isInitialized = true;
  }

  return {
    init
  };
})();
