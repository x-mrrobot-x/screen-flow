const CleanerController = (function () {
  "use strict";

  let isInitialized = false;

  function renderUI() {
    const folders = CleanerModel.getFolders();
    const state = CleanerModel.getState();
    CleanerView.render.cleaner(folders, state.autoCleaner);
  }

  const debouncedRender = Utils.debounce(renderUI, 100);

  const handlers = {
    handleEvent: e => {
      const folderCard = e.target.closest(".folder-clean-card");
      if (!folderCard) return;

      const folderId = folderCard.getAttribute("data-folder-id");
      if (!folderId) return;

      const actionBtn = e.target.closest("[data-action]");
      if (!actionBtn) return;

      e.stopPropagation();
      const action = actionBtn.getAttribute("data-action");
      const mediaType = actionBtn.getAttribute("data-media-type");

      switch (action) {
        case "toggleFolderClean":
          CleanerModel.toggleFolderClean(folderId, mediaType);
          renderUI();
          break;
        case "setFolderDays":
          const days = parseInt(actionBtn.getAttribute("data-days"));
          CleanerModel.setFolderDays(folderId, mediaType, days);
          renderUI();
          break;
      }
    },
    toggleAutoCleaner: () => {
      CleanerModel.toggleAutoCleaner();
      renderUI();
    },
    onStateChange: data => {
      const relevantKeys = ["settings", "folders"];
      if (relevantKeys.includes(data.key)) {
        debouncedRender();
      }
    }
  };

  function attachEventListeners() {
    const autoCleanerSwitch = DOM.qs(CleanerConfig.SELECTORS.autoCleanerSwitch);
    if (autoCleanerSwitch) {
      autoCleanerSwitch.addEventListener("click", handlers.toggleAutoCleaner);
    }

    const organizerItemCleanList = DOM.qs(
      CleanerConfig.SELECTORS.folderCleanList
    );
    if (organizerItemCleanList) {
      organizerItemCleanList.addEventListener("click", handlers.handleEvent);
    }

    EventBus.on("appstate:changed", handlers.onStateChange);
  }

  function init() {
    if (isInitialized) return;
    CleanerView.init(CleanerConfig.SELECTORS.CONTAINER);
    renderUI();
    updateSwitchState();
    attachEventListeners();
    isInitialized = true;
  }

  function updateSwitchState() {
    const state = CleanerModel.getState();
    const autoCleanerSwitch = DOM.qs(CleanerConfig.SELECTORS.autoCleanerSwitch);
    autoCleanerSwitch.classList.toggle("active", state.autoCleaner);
  }

  return {
    init
  };
})();
