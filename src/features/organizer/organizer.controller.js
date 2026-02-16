const OrganizerController = (function () {
  "use strict";

  let isInitialized = false;

  function renderUI() {
    const folders = OrganizerModel.getFolders();
    const state = OrganizerModel.getState();
    OrganizerView.render.folders(folders, state.activeFilter);
    OrganizerView.render.mediaCounter(folders, state.activeFilter);
    OrganizerView.render.filters(state.activeFilter);
  }

  const debouncedRender = Utils.debounce(renderUI, 100);

  const debouncedSearch = Utils.debounce((value) => {
    OrganizerModel.setSearchTerm(value);
    renderUI();
  }, 300);

  let currentPopupMenu = null;

  const handlers = {
    onSearch: e => {
      debouncedSearch(e.target.value);
    },
    onFilterClick: e => {
      const filter = e.target.closest("[data-filter]").dataset.filter;
      OrganizerModel.setFilter(filter);
      renderUI();
    },
    onCardClick: e => {
      const folderCard = e.target.closest(OrganizerConfig.SELECTORS.folderCard);
      if (!folderCard) return;

      const folderId = folderCard.dataset.folderId;
      if (!folderId) return;

      const menuDots = e.target.closest(
        OrganizerConfig.SELECTORS.folderMenuDots
      );
      if (menuDots) {
        e.stopPropagation();

        if (currentPopupMenu) {
          currentPopupMenu.remove();
          currentPopupMenu = null;
        }

        const menu = OrganizerView.showActionsMenu(folderId, folderCard);
        if (menu) {
          currentPopupMenu = menu;
          menu.addEventListener("click", handlers.onMenuClick);
        }
      }
    },
    onMenuClick: async e => {
      e.stopPropagation();
      const actionItem = e.target.closest("[data-action]");
      if (!actionItem) return;

      const action = actionItem.dataset.action;
      const popup = actionItem.closest(
        OrganizerConfig.SELECTORS.folderActionsPopup
      );
      const folderId = popup.dataset.folderId;

      if (action === "clear") {
        const folders = OrganizerModel.getFolders();
        const folder = folders.find(f => f.id === folderId);

        if (!folder) {
          Toast.error("Pasta não encontrada.");
          popup.remove();
          currentPopupMenu = null;
          return;
        }

        const activeFilter = OrganizerModel.getState().activeFilter;
        const type =
          activeFilter === "all"
            ? "both"
            : activeFilter === "screenshots"
            ? "ss"
            : "sr";

        const folderCard = document.querySelector(
          `[data-folder-id="${folderId}"]`
        );

        if (folderCard) {
          folderCard.style.opacity = "0.2";
          folderCard.style.pointerEvents = "none";
        }

        try {
          const removedCount = await OrganizerModel.clearFolderContents(
            folderId,
            type
          );
          const folderName = folder ? folder.name : "Unknown";

          if (removedCount > 0) {
            AppState.addActivity({
              type: "cleaner-folder",
              count: removedCount,
              execution: "manual",
              folder: folderName,
              mediaType: type,
              timestamp: Date.now()
            });

            AppState.incrementStat("cleanedFiles", removedCount);
            
            Toast.success(
              `${removedCount} ${
                removedCount > 1 ? "itens removidos" : "item removido"
              } com sucesso!`
            );
          } else {
            Toast.info(
              "Nenhum arquivo foi removido ou a pasta já estava vazia."
            );
          }

          renderUI();
        } catch (error) {
          Logger.error("Error clearing folder:", error);
          Toast.error("Erro ao limpar a pasta. Tente novamente.");
        } finally {
          if (folderCard) {
            folderCard.style.opacity = "1";
            folderCard.style.pointerEvents = "auto";
          }
        }
      }
      popup.remove();
      currentPopupMenu = null;
    },
    onDocumentClick: e => {
      if (currentPopupMenu && !currentPopupMenu.contains(e.target)) {
        currentPopupMenu.remove();
        currentPopupMenu = null;
      }
    },
    onStateChange: data => {
      if (data && data.key === "folders") {
        Logger.info("Organizer: Folders updated, re-rendering...");
        debouncedRender();
      }
    }
  };

  function attachEventListeners() {
    const searchInput = DOM.qs(OrganizerConfig.SELECTORS.searchInput);
    if (searchInput) searchInput.addEventListener("input", handlers.onSearch);

    const filterButtons = DOM.qsa(OrganizerConfig.SELECTORS.filterButtons);
    filterButtons.forEach(btn =>
      btn.addEventListener("click", handlers.onFilterClick)
    );

    const grid = DOM.qs(OrganizerConfig.SELECTORS.foldersGrid);
    if (grid) grid.addEventListener("click", handlers.onCardClick);

    document.addEventListener("click", handlers.onDocumentClick);
    EventBus.on("appstate:changed", handlers.onStateChange);
  }

  function init() {
    if (isInitialized) return;
    OrganizerView.init(OrganizerConfig.SELECTORS.CONTAINER);
    renderUI();
    attachEventListeners();
    isInitialized = true;
  }

  return {
    init
  };
})();
