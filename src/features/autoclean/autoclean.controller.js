const AutoCleanController = (function() {
  'use strict';
  
  let isInitialized = false;

  function render() {
    const organizeItems = AutoCleanModel.getOrganizeItems();
    const state = AutoCleanModel.getState();
    AutoCleanView.render.autoclean(organizeItems, state.autoCleanup);
  }

  const handlers = {
    handleEvent: (e) => {
      const organizeItemCard = e.target.closest(".organize-item-clean-card");
      if (!organizeItemCard) return;

      const organizeItemId = organizeItemCard.getAttribute("data-organize-item-id");
      if (!organizeItemId) return;

      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;

      e.stopPropagation();
      const action = actionBtn.getAttribute("data-action");
      const mediaType = actionBtn.getAttribute("data-media-type");

      switch (action) {
        case "toggleOrganizeItemClean":
          AutoCleanModel.toggleOrganizeItemClean(organizeItemId, mediaType);
          render();
          break;
        case "setOrganizeItemDays":
          const days = parseInt(actionBtn.getAttribute("data-days"));
          AutoCleanModel.setOrganizeItemDays(organizeItemId, mediaType, days);
          render();
          break;
      }
    },
    toggleAutoCleanup: () => {
      AutoCleanModel.toggleAutoCleanup();
      render();
    }
  };
  
  function attachEventListeners() {
    const autoCleanupSwitch = DOM.qs(AutoCleanConfig.SELECTORS.autoCleanupSwitch);
    if (autoCleanupSwitch) {
      autoCleanupSwitch.addEventListener("click", handlers.toggleAutoCleanup);
    }

    const organizeItemCleanList = DOM.qs(AutoCleanConfig.SELECTORS.folderCleanList);
    if (organizeItemCleanList) {
      organizeItemCleanList.addEventListener("click", handlers.handleEvent);
    }
  }

  function init() {
    if(isInitialized) return;
    AutoCleanView.init(AutoCleanConfig.SELECTORS.CONTAINER);
    render();
    attachEventListeners();
    isInitialized = true;
  }
  
  return {
    init
  };
})();
