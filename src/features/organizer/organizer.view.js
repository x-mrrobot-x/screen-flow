const OrganizerView = (function () {
  "use strict";

  let container = null;
  const elements = {};

  const templates = {
    organizerBadges: (item, activeFilter) => {
      const ssCount = item.ss ? item.ss.count : 0;
      const srCount = item.sr ? item.sr.count : 0;

      if (activeFilter === "all") {
        return `
          <div class="folder-badge">
            ${Icons.getSvg("image")} ${ssCount}
          </div>
          <div class="folder-badge">
            ${Icons.getSvg("video")} ${srCount}
          </div>
        `;
      }
      const mediaCount =
        activeFilter === "recordings" ? srCount : ssCount;
      const mediaIcon = Icons.getSvg(
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
      <div class="folder-card animate-scale-in delay-${
        index % 10
      }" data-folder-id="${folder.id}">
        <div class="folder-top">
          <div class="folder-badges">
            ${templates.organizerBadges(folder, activeFilter)}
          </div>
          <div class="folder-app-icon">
            ${Icons.getAppIcon(folder)}
          </div>
        </div>
        <div class="folder-bottom">
          <div class="folder-info-row">
            <span class="folder-name truncate-text">${folder.name}</span>
            <span class="folder-menu-dots">
              <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
            </span>
          </div>
        </div>
      </div>`,
    emptyState: activeFilter => {
      let title, subtitle;
      
      switch(activeFilter) {
        case "screenshots":
          title = "Nenhuma pasta de capturas";
          subtitle = "Não há pastas com capturas de tela para exibir.";
          break;
        case "recordings":
          title = "Nenhuma pasta de gravações";
          subtitle = "Não há pastas com gravações de tela para exibir.";
          break;
        case "all":
        default:
          title = "Nenhuma pasta organizada";
          subtitle = "Não há pastas organizadas para exibir. Os arquivos serão organizados automaticamente por aplicativo.";
          break;
      }
      
      return `
        <div class="empty-state animate-fade-in delay-3">
            <div class="empty-icon-wrapper">${Icons.getSvg("folder")}</div>
            <p class="empty-title">${title}</p>
            <p class="empty-subtitle">${subtitle}</p>
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

  function getFilteredFolders(folders, activeFilter) {
    if (activeFilter === "all") {
      return folders.filter(folder => folder.ss || folder.sr);
    } else if (activeFilter === "screenshots") {
      return folders.filter(folder => folder.ss);
    } else if (activeFilter === "recordings") {
      return folders.filter(folder => folder.sr);
    } else {
      return folders; // fallback to all folders
    }
  }

  const render = {
    folders: (folders, activeFilter) => {
      const filteredFolders = getFilteredFolders(folders, activeFilter);
      
      if (filteredFolders.length > 0) {
        elements.foldersGrid.innerHTML = filteredFolders
          .map((f, i) => templates.folderCard(f, i, activeFilter))
          .join("");
      } else {
        elements.foldersGrid.innerHTML = templates.emptyState(activeFilter);
      }
    },
    mediaCounter: (folders, activeFilter) => {
      const filteredFolders = getFilteredFolders(folders, activeFilter);
      
      let totalMedia = 0;
      let mediaIcon = "";
      if (activeFilter === "all") {
        const totalScreenshots = filteredFolders.reduce(
          (sum, f) => sum + (f.ss ? f.ss.count : 0),
          0
        );
        const totalRecordings = filteredFolders.reduce((sum, f) => sum + (f.sr ? f.sr.count : 0), 0);
        elements.mediaCounter.innerHTML = `
          <span style="display: flex; align-items: center; gap: 0.25rem;">${Icons.getSvg(
            "folder"
          )} ${filteredFolders.length}</span>
          <span style="display: flex; align-items: center; gap: 0.25rem;">${Icons.getSvg(
            "file"
          )} ${totalScreenshots + totalRecordings}</span>
        `;
      } else {
        if (activeFilter === "recordings") {
          totalMedia = filteredFolders.reduce((sum, f) => sum + (f.sr ? f.sr.count : 0), 0);
          mediaIcon = Icons.getSvg("video");
        } else {
          totalMedia = filteredFolders.reduce((sum, f) => sum + (f.ss ? f.ss.count : 0), 0);
          mediaIcon = Icons.getSvg("image");
        }
        elements.mediaCounter.innerHTML = `
          <span style="display: flex; align-items: center; gap: 0.25rem;">${Icons.getSvg(
            "folder"
          )} ${filteredFolders.length}</span>
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

  function queryElements() {
    const S = OrganizerConfig.SELECTORS;
    elements.foldersGrid = DOM.qs(S.foldersGrid);
    elements.mediaCounter = DOM.qs(S.mediaCounter);
    elements.filterButtons = DOM.qsa(S.filterButtons);
  }

  function init(containerSelector) {
    container = DOM.qs(containerSelector);
    if (!container) throw new Error(`Container ${containerSelector} not found`);

    queryElements();
    return container;
  }

  return {
    init,
    render,
    showActionsMenu
  };
})();
