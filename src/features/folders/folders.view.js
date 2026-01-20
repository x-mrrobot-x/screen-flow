const FoldersView = (function () {
  "use strict";

  let container = null;
  const elements = {};

  const templates = {
    folderBadges: (folder, activeFilter) => {
      if (activeFilter === "all") {
        return `
          <div class="folder-badge">
            ${Icons.get("image")} ${folder.stats.ss}
          </div>
          <div class="folder-badge">
            ${Icons.get("video")} ${folder.stats.sr}
          </div>
        `;
      }
      const mediaCount =
        activeFilter === "recordings" ? folder.stats.sr : folder.stats.ss;
      const mediaIcon = Icons.get(
        activeFilter === "recordings" ? "video" : "image"
      );
      const mediaType =
        activeFilter === "recordings" ? "Gravações" : "Screenshots";
      return `
        <div class="folder-badge">
          ${mediaIcon} ${mediaCount} ${mediaType}
        </div>
      `;
    },
    folderCard: (folder, index, activeFilter) => `
      <div class="folder-card card-glow animate-scale-in delay-${
        index % 10
      }" data-folder-id="${folder.id}">
        <div class="folder-top">
          <div class="folder-badges">
            ${templates.folderBadges(folder, activeFilter)}
          </div>
          <div class="folder-app-icon">
            ${Icons.getFolderIcon(folder)}
          </div>
        </div>
        <div class="folder-bottom">
          <div class="folder-info-row">
            <span class="folder-name">${folder.name}</span>
            <span class="folder-menu-dots">
              <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
            </span>
          </div>
        </div>
      </div>`,
    emptyState: mediaFilter => {
      const emptyMediaText =
        mediaFilter === "screenshots" ? "capturas" : "gravações";
      return `
        <div class="empty-state animate-fade-in delay-3">
            <div class="empty-icon-wrapper">${Icons.get("folder")}</div>
            <p class="empty-title">Nenhuma pasta encontrada</p>
            <p class="empty-subtitle">Nenhuma pasta com ${emptyMediaText} para exibir. Tente ajustar os filtros.</p>
        </div>`;
    },
    actionsMenu: folderId => `
      <div class="folder-actions-popup" data-folder-id="${folderId}">
        <div class="folder-action-item" data-action="clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <polyline points="3 6,5 6,21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Limpar pasta</span>
        </div>
      </div>
    `
  };

  const render = {
    folders: (folders, activeFilter, mediaFilter) => {
      if (folders.length > 0) {
        elements.foldersGrid.innerHTML = folders
          .map((f, i) => templates.folderCard(f, i, activeFilter))
          .join("");
      } else {
        elements.foldersGrid.innerHTML = templates.emptyState(mediaFilter);
      }
    },
    mediaCounter: (folders, activeFilter) => {
      let totalMedia = 0;
      let mediaIcon = "";
      if (activeFilter === "all") {
        const totalScreenshots = folders.reduce(
          (sum, f) => sum + f.stats.ss,
          0
        );
        const totalRecordings = folders.reduce((sum, f) => sum + f.stats.sr, 0);
        elements.mediaCounter.innerHTML = `
          <span style="display: flex; align-items: center; gap: 0.25rem;">${Icons.get(
            "folder"
          )} ${folders.length}</span>
          <span style="display: flex; align-items: center; gap: 0.25rem;">${Icons.get(
            "file"
          )} ${totalScreenshots + totalRecordings}</span>
        `;
      } else {
        if (activeFilter === "recordings") {
          totalMedia = folders.reduce((sum, f) => sum + f.stats.sr, 0);
          mediaIcon = Icons.get("video");
        } else {
          totalMedia = folders.reduce((sum, f) => sum + f.stats.ss, 0);
          mediaIcon = Icons.get("image");
        }
        elements.mediaCounter.innerHTML = `
          <span style="display: flex; align-items: center; gap: 0.25rem;">${Icons.get(
            "folder"
          )} ${folders.length}</span>
          <span style="display: flex; align-items: center; gap: 0.25rem;">${mediaIcon} ${totalMedia}</span>
        `;
      }
    },
    filters: activeFilter => {
      elements.filterButtons.forEach(btn =>
        btn.classList.remove("active", "glow")
      );
      DOM.qs(`#filter-${activeFilter}`).classList.add("active", "glow");
    }
  };

  function showActionsMenu(folderId, folderCard) {
    const existingMenu = DOM.qs(
      `.folder-actions-popup[data-folder-id="${folderId}"]`
    );
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const menu = document.createElement("div");
    menu.innerHTML = templates.actionsMenu(folderId).trim();
    const popupElement = menu.firstChild;

    const menuDots = folderCard.querySelector(".folder-menu-dots");
    if (menuDots) {
      if (getComputedStyle(folderCard).position === "static") {
        folderCard.style.position = "relative";
      }
      folderCard.appendChild(popupElement);
      const dotsRect = menuDots.getBoundingClientRect();
      const cardRect = folderCard.getBoundingClientRect();
      const topPos =
        dotsRect.top - cardRect.top - popupElement.offsetHeight - 5;
      popupElement.style.top = `${topPos}px`;
      popupElement.style.display = "block";
    }
    return popupElement;
  }

  function init(containerSelector) {
    container = DOM.get(containerSelector);
    if (!container) throw new Error(`Container ${containerSelector} not found`);

    for (const key in FoldersConfig.SELECTORS) {
      if (key !== "CONTAINER") {
        elements[key] = DOM.qsa(FoldersConfig.SELECTORS[key]);
        if (elements[key].length === 1) elements[key] = elements[key][0];
      }
    }
    return container;
  }

  return {
    init,
    render,
    showActionsMenu
  };
})();
