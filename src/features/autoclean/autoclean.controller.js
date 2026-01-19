const AutoCleanController = (function() {
  'use strict';
  
  let isInitialized = false;

  function render() {
    const folders = AutoCleanModel.getFolders();
    const state = AutoCleanModel.getState();
    AutoCleanView.render.autoclean(folders, state.autoCleanup);
  }

  const handlers = {
    handleEvent: (e) => {
      const folderCard = e.target.closest(".folder-clean-card");
      if (!folderCard) return;

      const folderId = folderCard.getAttribute("data-folder-id");
      if (!folderId) return;

      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;

      e.stopPropagation();
      const action = actionBtn.getAttribute("data-action");
      const mediaType = actionBtn.getAttribute("data-media-type");

      switch (action) {
        case "toggleFolderClean":
          AutoCleanModel.toggleFolderClean(folderId, mediaType);
          render();
          break;
        case "setFolderDays":
          const days = parseInt(actionBtn.getAttribute("data-days"));
          AutoCleanModel.setFolderDays(folderId, mediaType, days);
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

    const folderCleanList = DOM.qs(AutoCleanConfig.SELECTORS.folderCleanList);
    if (folderCleanList) {
      folderCleanList.addEventListener("click", handlers.handleEvent);
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
