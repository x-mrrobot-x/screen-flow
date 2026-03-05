const OrganizerController = (function () {
  "use strict";

  let isInitialized = false;
  let suppressNextRender = false;
  let currentPopupMenu = null;
  let paginator = null;

  function renderUI() {
    const folders = OrganizerModel.getFolders();
    const state = OrganizerModel.getState();
    const { grid } = OrganizerView.getElements();
    const filtered = OrganizerView.render.getFiltered(
      folders,
      state.activeFilter
    );

    if (!paginator) {
      paginator = PaginationManager.create({
        container: grid,
        renderItem: (folder, i) =>
          OrganizerView.render.folderNode(folder, i, state.activeFilter),
        emptyState: () => OrganizerView.templates.emptyState(state.activeFilter)
      });
    }

    paginator.reset(filtered);
    OrganizerView.render.mediaCounter(folders, state.activeFilter);
    OrganizerView.render.filters(state.activeFilter);
    OrganizerView.update.autoOrganizer(
      OrganizerModel.getAutoOrganizerSetting()
    );
  }

  function updatePartial(folderId) {
    const folders = OrganizerModel.getFolders();
    const state = OrganizerModel.getState();
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    OrganizerView.update.card(folder, state.activeFilter);
    OrganizerView.render.mediaCounter(folders, state.activeFilter);
  }

  const debouncedRender = Utils.debounce(renderUI, 100);
  const debouncedSearch = Utils.debounce(value => {
    OrganizerModel.setSearchTerm(value);
    Navigation.scrollToTop();
    renderUI();
  }, 300);

  function closePopupMenu() {
    if (currentPopupMenu) {
      currentPopupMenu.remove();
      currentPopupMenu = null;
    }
  }

  async function handleClearAction(folderId) {
    const folders = OrganizerModel.getFolders();
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      Toast.error(I18n.t("organizer.folder_not_found"));
      return;
    }

    const { activeFilter } = OrganizerModel.getState();
    const type =
      activeFilter === "all"
        ? "both"
        : activeFilter === "screenshots"
        ? "ss"
        : "sr";

    const { grid } = OrganizerView.getElements();
    const folderCard = DOM.qs(`[data-folder-id="${folderId}"]`, grid);
    if (folderCard) {
      folderCard.style.opacity = "0.2";
      folderCard.style.pointerEvents = "none";
    }

    suppressNextRender = true;
    try {
      const removedCount = await OrganizerModel.clearFolderContents(
        folderId,
        type
      );

      if (removedCount > 0) {
        AppState.addActivity({
          type: "cleaner-folder",
          count: removedCount,
          execution: "manual",
          folder: folder.name,
          mediaType: type,
          timestamp: Date.now()
        });
        AppState.incrementStat("cleanedFiles", removedCount);
        Toast.success(
          I18n.t("organizer.clear_success", {
            count: removedCount,
            item:
              removedCount === 1
                ? I18n.t("common.items")
                : I18n.t("common.items_plural"),
            removed:
              removedCount === 1
                ? I18n.t("common.removed")
                : I18n.t("common.removed_plural")
          })
        );
      } else {
        Toast.info(I18n.t("organizer.clear_empty"));
      }

      updatePartial(folderId);
    } catch (error) {
      Logger.error("Error clearing folder:", error);
      Toast.error(I18n.t("organizer.clear_error"));
    } finally {
      suppressNextRender = false;
      if (folderCard) {
        folderCard.style.opacity = "1";
        folderCard.style.pointerEvents = "auto";
      }
    }
  }

  const handlers = {
    onSearch: e => debouncedSearch(e.target.value),

    onFilterClick: e => {
      const filter = e.target.closest("[data-filter]")?.dataset.filter;
      if (!filter) return;
      OrganizerModel.setFilter(filter);
      renderUI();
    },

    onSwitchChange: e => {
      const switchEl = e.target.closest("[data-setting-key]");
      if (!switchEl) return;
      const newValue = OrganizerModel.toggleAutoOrganizer();
      OrganizerView.update.autoOrganizer(newValue);
    },

    onGridClick: e => {
      const card = e.target.closest(".organizer-folder-card");
      if (!card || !e.target.closest(".organizer-folder-menu-dots")) return;
      e.stopPropagation();
      closePopupMenu();
      const popup = OrganizerView.update.actionsMenu(
        card.dataset.folderId,
        card
      );
      if (popup) {
        currentPopupMenu = popup;
        popup.addEventListener("click", handlers.onMenuClick);
      }
    },

    onMenuClick: async e => {
      e.stopPropagation();
      const actionItem = e.target.closest("[data-action]");
      const folderId = actionItem?.closest(".organizer-folder-actions-popup")
        ?.dataset.folderId;
      if (!folderId) return;
      closePopupMenu();
      if (actionItem.dataset.action === "clear")
        await handleClearAction(folderId);
    },

    onDocumentClick: e => {
      if (currentPopupMenu && !currentPopupMenu.contains(e.target))
        closePopupMenu();
    },

    onStateChange: data => {
      if (data.key === "settings") {
        OrganizerView.update.autoOrganizer(
          OrganizerModel.getAutoOrganizerSetting()
        );
      }
      if (data.key === "folders" && !suppressNextRender) {
        debouncedRender();
      }
    }
  };

  function attachEvents() {
    const { grid, search, tabContent, filterContainer } =
      OrganizerView.getElements();

    const events = [
      [search, "input", handlers.onSearch],
      [grid, "click", handlers.onGridClick],
      [filterContainer, "click", handlers.onFilterClick],
      [tabContent, "change", handlers.onSwitchChange],
      [document, "click", handlers.onDocumentClick]
    ];
    events.forEach(([el, event, handler]) =>
      el.addEventListener(event, handler)
    );

    EventBus.on("appstate:changed", handlers.onStateChange);
  }

  function init() {
    if (isInitialized) return;
    OrganizerView.init();
    renderUI();
    attachEvents();
    isInitialized = true;
  }

  return { init };
})();
