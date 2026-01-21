const OrganizeView = (function () {
  "use strict";

  let container = null;
  const elements = {};

  const templates = {
    organizeBadges: (item, activeFilter) => {
      if (activeFilter === "all") {
        return `
          <div class="organize-badge">
            ${Icons.get("image")} ${item.stats.ss}
          </div>
          <div class="organize-badge">
            ${Icons.get("video")} ${item.stats.sr}
          </div>
        `;
      }
      const mediaCount =
        activeFilter === "recordings" ? item.stats.sr : item.stats.ss;
      const mediaIcon = Icons.get(
        activeFilter === "recordings" ? "video" : "image"
      );
      const mediaType =
        activeFilter === "recordings" ? "Gravações" : "Screenshots";
      return `
        <div class="organize-badge">
          ${mediaIcon} ${mediaCount} ${mediaType}
        </div>
      `;
    },
    organizeCard: (item, index, activeFilter) => `
      <div class="organize-card card-glow animate-scale-in delay-${
        index % 10
      }" data-organize-id="${item.id}">
        <div class="organize-top">
          <div class="organize-badges">
            ${templates.organizeBadges(item, activeFilter)}
          </div>
          <div class="organize-app-icon">
            ${Icons.getOrganizeIcon(item)}
          </div>
        </div>
        <div class="organize-bottom">
          <div class="organize-info-row">
            <span class="organize-name">${item.name}</span>
            <span class="organize-menu-dots">
              <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
            </span>
          </div>
        </div>
      </div>`,
    emptyState: activeFilter => {
      const emptyMediaText =
        activeFilter === "screenshots" ? "capturas" : "gravações";
      return `
        <div class="empty-state animate-fade-in delay-3">
            <div class="empty-icon-wrapper">${Icons.get("folder")}</div>
            <p class="empty-title">Nenhum item encontrado</p>
            <p class="empty-subtitle">Nenhum item com ${emptyMediaText} para exibir. Tente ajustar os filtros.</p>
        </div>`;
    },
    actionsMenu: organizeId => `
      <div class="organize-actions-popup" data-organize-id="${organizeId}">
        <div class="organize-action-item" data-action="clear">
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
    organizeItems: (organizeItems, activeFilter) => {
      if (organizeItems.length > 0) {
        elements.organizeGrid.innerHTML = organizeItems
          .map((f, i) => templates.organizeCard(f, i, activeFilter))
          .join("");
      } else {
        elements.organizeGrid.innerHTML = templates.emptyState(activeFilter);
      }
    },
    mediaCounter: (organizeItems, activeFilter) => {
      let totalMedia = 0;
      let mediaIcon = "";
      if (activeFilter === "all") {
        const totalScreenshots = organizeItems.reduce(
          (sum, f) => sum + f.stats.ss,
          0
        );
        const totalRecordings = organizeItems.reduce((sum, f) => sum + f.stats.sr, 0);
        elements.mediaCounter.innerHTML = `
          <span style="display: flex; align-items: center; gap: 0.25rem;">${Icons.get(
            "folder"
          )} ${organizeItems.length}</span>
          <span style="display: flex; align-items: center; gap: 0.25rem;">${Icons.get(
            "file"
          )} ${totalScreenshots + totalRecordings}</span>
        `;
      } else {
        if (activeFilter === "recordings") {
          totalMedia = organizeItems.reduce((sum, f) => sum + f.stats.sr, 0);
          mediaIcon = Icons.get("video");
        } else {
          totalMedia = organizeItems.reduce((sum, f) => sum + f.stats.ss, 0);
          mediaIcon = Icons.get("image");
        }
        elements.mediaCounter.innerHTML = `
          <span style="display: flex; align-items: center; gap: 0.25rem;">${Icons.get(
            "folder"
          )} ${organizeItems.length}</span>
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

  function showActionsMenu(organizeId, organizeCard) {
    const existingMenu = DOM.qs(
      `.organize-actions-popup[data-organize-id="${organizeId}"]`
    );
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const menu = document.createElement("div");
    menu.innerHTML = templates.actionsMenu(organizeId).trim();
    const popupElement = menu.firstChild;

    const menuDots = organizeCard.querySelector(".organize-menu-dots");
    if (menuDots) {
      if (getComputedStyle(organizeCard).position === "static") {
        organizeCard.style.position = "relative";
      }
      organizeCard.appendChild(popupElement);
      const dotsRect = menuDots.getBoundingClientRect();
      const cardRect = organizeCard.getBoundingClientRect();
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

    for (const key in OrganizeConfig.SELECTORS) {
      if (key !== "CONTAINER") {
        elements[key] = DOM.qsa(OrganizeConfig.SELECTORS[key]);
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
