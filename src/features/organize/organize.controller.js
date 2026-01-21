const OrganizeController = (function() {
  'use strict';

  let isInitialized = false;

  function render() {
    const organizeItems = OrganizeModel.getOrganizeItems();
    const state = OrganizeModel.getState();
    OrganizeView.render.organizeItems(organizeItems, state.activeFilter);
    OrganizeView.render.mediaCounter(organizeItems, state.activeFilter);
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
      const organizeCard = e.target.closest(OrganizeConfig.SELECTORS.organizeCard);
      if (!organizeCard) return;

      const organizeId = organizeCard.dataset.organizeId;
      if (!organizeId) return;

      const menuDots = e.target.closest(OrganizeConfig.SELECTORS.organizeMenuDots);
      if (menuDots) {
        e.stopPropagation();
        const menu = OrganizeView.showActionsMenu(organizeId, organizeCard);
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
      const popup = actionItem.closest(OrganizeConfig.SELECTORS.organizeActionsPopup);
      const organizeId = popup.dataset.organizeId;

      if (action === 'clear') {
        const activeFilter = OrganizeModel.getState().activeFilter;
        const type = activeFilter === 'all' ? 'both' : (activeFilter === 'screenshots' ? 'ss' : 'sr');
        const removedCount = OrganizeModel.clearOrganizeStats(organizeId, type);
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

    const grid = DOM.qs(OrganizeConfig.SELECTORS.organizeGrid);
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
