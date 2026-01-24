const CleanerController = (function() {
  'use strict';
  
  let isInitialized = false;

  function render() {
    const folders = CleanerModel.getFolders();
    const state = CleanerModel.getState();
    CleanerView.render.cleaner(folders, state.autoCleaning);
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
          CleanerModel.toggleFolderClean(folderId, mediaType);
          render();
          break;
        case "setFolderDays":
          const days = parseInt(actionBtn.getAttribute("data-days"));
          CleanerModel.setFolderDays(folderId, mediaType, days);
          render();
          break;
      }
    },
    toggleAutoCleaning: () => {
      CleanerModel.toggleAutoCleaning();
      render();
    }
  };
  
  function attachEventListeners() {
    const autoCleaningSwitch = DOM.qs(CleanerConfig.SELECTORS.autoCleaningSwitch);
    if (autoCleaningSwitch) {
      autoCleaningSwitch.addEventListener("click", handlers.toggleAutoCleaning);
    }

    const organizeItemCleanList = DOM.qs(CleanerConfig.SELECTORS.folderCleanList);
    if (organizeItemCleanList) {
      organizeItemCleanList.addEventListener("click", handlers.handleEvent);
    }
  }

  function init() {
    if(isInitialized) return;
    CleanerView.init(CleanerConfig.SELECTORS.CONTAINER);
    render();
    attachEventListeners();
    isInitialized = true;
  }
  
  return {
    init
  };
})();