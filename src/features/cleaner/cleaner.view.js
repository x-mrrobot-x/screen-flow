const CleanerView = (function () {
  "use strict";

  let container = null;
  const elements = {};

  function createDayButton(mediaType, days, isActive) {
    const activeClass = isActive ? "active" : "";
    return `<button class="clean-day-button tap-scale ${activeClass}" data-action="setFolderDays" data-media-type="${mediaType}" data-days="${days}">${days} dias</button>`;
  }

  function createCleanGroup(folder, mediaType, key, label) {
    if (!folder[key] || !folder[key].cleaner.on) {
      return "";
    }

    const optionId = `option-group-${folder.id}-${mediaType}`;
    const currentDays = folder[key].cleaner.days;

    const optionsHtml = CleanerConfig.DAY_OPTIONS.map(days =>
      createDayButton(mediaType, days, currentDays === days)
    ).join("");

    return `
      <div class="folder-clean-group" id="${optionId}">
        <p>${label} - Remover após:</p>
        <div class="clean-days-options">${optionsHtml}</div>
      </div>
    `;
  }

  function createSwitchContainer(folder, mediaType, key, label) {
    if (!folder[key]) return "";

    const cleanerOn = folder[key].cleaner.on;
    return `
      <div class="clean-switch-container" data-action="toggleDayConfigVisibility" data-media-type="${mediaType}">
        <span class="switch-label">${label}</span>
        <button class="switch ${
          cleanerOn ? "active" : ""
        }" data-action="toggleFolderClean" data-media-type="${mediaType}"></button>
      </div>
    `;
  }

  const templates = {
    folderOptions: (folder, mediaType) => {
      const key = mediaType === "screenshots" ? "ss" : "sr";
      const label = mediaType === "screenshots" ? "Capturas" : "Gravações";
      return createCleanGroup(folder, mediaType, key, label);
    },

    folderCard: (folder, index) => {
      if (!folder.ss && !folder.sr) return "";

      const screenshotsSwitch = createSwitchContainer(
        folder,
        "screenshots",
        "ss",
        "Capturas"
      );
      const recordingsSwitch = createSwitchContainer(
        folder,
        "screenrecordings",
        "sr",
        "Gravações"
      );

      if (!screenshotsSwitch && !recordingsSwitch) return "";

      const ssCleanerOn = folder.ss && folder.ss.cleaner.on;
      const srCleanerOn = folder.sr && folder.sr.cleaner.on;
      const isEnabled = ssCleanerOn || srCleanerOn;

      return `
        <div class="folder-clean-card ${
          isEnabled ? "enabled" : ""
        } animate-fade-in-left delay-${index % 10}" data-folder-id="${
          folder.id
        }">
          <div class="folder-clean-header">
            ${Icons.getFolderIcon(folder)}
            <span class="folder-clean-name truncate-text">${folder.name}</span>
            <div class="folder-clean-switches">
              ${screenshotsSwitch}
              ${recordingsSwitch}
            </div>
          </div>
          ${
            isEnabled
              ? `
            <div class="folder-clean-options">
              ${createCleanGroup(folder, "screenshots", "ss", "Capturas")}
              ${createCleanGroup(folder, "screenrecordings", "sr", "Gravações")}
            </div>
          `
              : ""
          }
        </div>
      `;
    }
  };

  const render = {
    counts: (folders, autoCleaner) => {
      const screenshotsCount = folders.filter(
        f => f.ss && f.ss.cleaner.on
      ).length;
      const recordingsCount = folders.filter(
        f => f.sr && f.sr.cleaner.on
      ).length;

      if (autoCleaner) {
        elements.cleanerCountText.innerHTML = `<span class="subtitle-item"><span class="dot dot-screenshot"></span>${screenshotsCount} pastas com limpeza de capturas</span>, <span class="subtitle-item"><span class="dot dot-recording"></span>${recordingsCount} com limpeza de gravações</span>`;
      } else {
        elements.cleanerCountText.textContent = "Limpe pastas automaticamente";
      }
    },

    folderList: folders => {
      elements.folderCleanList.innerHTML = folders
        .map((folder, index) => templates.folderCard(folder, index))
        .join("");
    },

    cleaner: (folders, autoCleaner) => {
      render.counts(folders, autoCleaner);
      render.folderList(folders);
      elements.autoCleanerSwitch.classList.toggle("active", autoCleaner);
      elements.folderCleanList.style.display = autoCleaner ? "flex" : "none";
    }
  };

  function init(containerSelector) {
    container = DOM.qs(containerSelector);
    if (!container) throw new Error(`Container ${containerSelector} not found`);

    for (const key in CleanerConfig.SELECTORS) {
      if (key !== "CONTAINER") {
        if (key === "folderCleanList") {
          elements.folderCleanList = DOM.qs(CleanerConfig.SELECTORS[key]);
        } else {
          elements[key] = DOM.qs(CleanerConfig.SELECTORS[key]);
        }
      }
    }
    return container;
  }

  return {
    init,
    render
  };
})();
