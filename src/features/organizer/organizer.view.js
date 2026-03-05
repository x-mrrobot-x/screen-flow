const OrganizerView = (function () {
  "use strict";

  let elements = null;

  function queryElements() {
    elements = {
      tabContent: DOM.qs("#tab-organizer"),
      grid: DOM.qs("#folders-grid"),
      counter: DOM.qs("#media-counter"),
      filterContainer: DOM.qs(".organizer-filters-row"),
      filterBtns: DOM.qsa(".organizer-filter-button"),
      search: DOM.qs(".organizer-search-input"),
      autoSwitch: DOM.qs("#switch-auto-organizer")
    };
  }

  function getElements() {
    return elements;
  }

  const templates = {
    badges: (folder, activeFilter) => {
      const ssCount = folder.ss?.count ?? 0;
      const srCount = folder.sr?.count ?? 0;

      if (activeFilter === "all") {
        return `
          <div class="organizer-folder-badge">${Icons.getSvg(
            "image"
          )} ${ssCount}</div>
          <div class="organizer-folder-badge">${Icons.getSvg(
            "video"
          )} ${srCount}</div>`;
      }

      const isRecordings = activeFilter === "recordings";
      const count = isRecordings ? srCount : ssCount;
      const icon = Icons.getSvg(isRecordings ? "video" : "image");
      const label = isRecordings
        ? I18n.t("common.recordings_label")
        : I18n.t("common.screenshots_label");
      return `<div class="organizer-folder-badge">${icon} <span>${count}</span> <span>${label}</span></div>`;
    },

    folderCard: (folder, index, activeFilter) => `
      <div class="organizer-folder-card card animate-scale-in"
           style="animation-delay: ${0.3 + index * 0.05}s"
           data-folder-id="${folder.id}">
        <div class="organizer-folder-top">
          <div class="organizer-folder-badges">
            ${templates.badges(folder, activeFilter)}
          </div>
          <div class="organizer-folder-app-icon">
            ${Icons.getAppIcon(folder)}
          </div>
        </div>
        <div class="organizer-folder-bottom">
          <div class="organizer-folder-info-row">
            <span class="organizer-folder-name truncate-text">
              ${folder.name}
            </span>
            <div class="organizer-folder-menu-dots">
              <svg viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>`,

    emptyState: activeFilter => {
      const copy = {
        screenshots: {
          title: I18n.t("organizer.empty_screenshots_title"),
          subtitle: I18n.t("organizer.empty_screenshots_subtitle")
        },
        recordings: {
          title: I18n.t("organizer.empty_recordings_title"),
          subtitle: I18n.t("organizer.empty_recordings_subtitle")
        },
        all: {
          title: I18n.t("organizer.empty_all_title"),
          subtitle: I18n.t("organizer.empty_all_subtitle")
        }
      };
      const { title, subtitle } = copy[activeFilter] ?? copy.all;

      return `
        <div class="organizer-empty-state animate-fade-in" style="animation-delay: 0.3s">
          <div class="organizer-empty-icon-wrapper">${Icons.getSvg(
            "folder-open"
          )}</div>
          <p class="organizer-empty-title">${title}</p>
          <p class="organizer-empty-subtitle">${subtitle}</p>
        </div>`;
    },

    actionsMenu: folderId => `
      <div class="organizer-folder-actions-popup" data-folder-id="${folderId}">
        <div class="organizer-folder-action-item" data-action="clear">
          ${Icons.getSvg("trash")}
          <span>${I18n.t("organizer.folder_action_clear")}</span>
        </div>
      </div>`
  };

  const render = {
    getFiltered: (folders, activeFilter) => {
      if (activeFilter === "screenshots") return folders.filter(f => f.ss);
      if (activeFilter === "recordings") return folders.filter(f => f.sr);
      return folders.filter(f => f.ss || f.sr);
    },

    folderNode: (folder, index, activeFilter) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = templates
        .folderCard(folder, index, activeFilter)
        .trim();
      return wrapper.firstChild;
    },

    mediaCounter: (folders, activeFilter) => {
      const filtered = render.getFiltered(folders, activeFilter);

      if (activeFilter === "all") {
        const totalSs = filtered.reduce((s, f) => s + (f.ss?.count ?? 0), 0);
        const totalSr = filtered.reduce((s, f) => s + (f.sr?.count ?? 0), 0);
        elements.counter.innerHTML = `
          <span>${Icons.getSvg("folder")} ${filtered.length}</span>
          <span>${Icons.getSvg("file")} ${totalSs + totalSr}</span>`;
      } else {
        const isRec = activeFilter === "recordings";
        const total = filtered.reduce(
          (s, f) => s + ((isRec ? f.sr : f.ss)?.count ?? 0),
          0
        );
        elements.counter.innerHTML = `
          <span>${Icons.getSvg("folder")} ${filtered.length}</span>
          <span>${Icons.getSvg(isRec ? "video" : "image")} ${total}</span>`;
      }
    },

    filters: activeFilter => {
      elements.filterBtns.forEach(btn => btn.classList.remove("active"));
      DOM.qs(`#filter-${activeFilter}`)?.classList.add("active");
    }
  };

  const update = {
    autoOrganizer: value => {
      elements.autoSwitch.checked = !!value;
    },

    card: (folder, activeFilter) => {
      const card = DOM.qs(
        `.organizer-folder-card[data-folder-id="${folder.id}"]`,
        elements.grid
      );
      if (!card) return;
      const badgesContainer = DOM.qs(".organizer-folder-badges", card);
      if (badgesContainer) {
        badgesContainer.innerHTML = templates.badges(folder, activeFilter);
      }
    },

    actionsMenu: (folderId, folderCard) => {
      const existingMenu = DOM.qs(
        `.organizer-folder-actions-popup[data-folder-id="${folderId}"]`
      );
      if (existingMenu) {
        existingMenu.remove();
        return null;
      }

      const wrapper = document.createElement("div");
      wrapper.innerHTML = templates.actionsMenu(folderId).trim();
      const popup = wrapper.firstChild;

      const menuDots = DOM.qs(".organizer-folder-menu-dots", folderCard);
      if (!menuDots) return null;

      if (getComputedStyle(folderCard).position === "static") {
        folderCard.style.position = "relative";
      }
      folderCard.appendChild(popup);

      const dotsRect = menuDots.getBoundingClientRect();
      const cardRect = folderCard.getBoundingClientRect();
      popup.style.top = `${
        dotsRect.top - cardRect.top - popup.offsetHeight - 20
      }px`;
      popup.style.display = "block";

      return popup;
    }
  };

  function init() {
    queryElements();
  }

  return {
    init,
    getElements,
    templates,
    render,
    update
  };
})();
