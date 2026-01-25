const CleanerView = (function() {
  'use strict';
  
  let container = null;
  const elements = {};

  const templates = {
    folderOptions: (folder, mediaType) => {
      const config = CleanerConfig;
      const isActive = mediaType === "screenshots" ? folder.cleaner.ss.on : folder.cleaner.sr.on;
      if (!isActive) return "";

      const optionId = `option-group-${folder.id}-${mediaType}`;
      const label = mediaType === "screenshots" ? "Capturas" : "Gravações";
      const currentDays = mediaType === "screenshots" ? folder.cleaner.ss.days : folder.cleaner.sr.days;

      let optionsHtml = config.DAY_OPTIONS.map(days => {
        const activeClass = currentDays === days ? "active" : "";
        return `<button class="clean-day-button tap-scale ${activeClass}" data-action="setFolderDays" data-media-type="${mediaType}" data-days="${days}">${days} dias</button>`;
      }).join('');

      return `
        <div class="folder-clean-group" id="${optionId}">
          <p>${label} - Remover após:</p>
          <div class="clean-days-options">${optionsHtml}</div>
        </div>
      `;
    },
    folderCard: (folder, index) => {
      const isEnabled = folder.cleaner.ss.on || folder.cleaner.sr.on;
      const enabledClass = isEnabled ? "enabled" : "";

      return `
        <div class="folder-clean-card ${enabledClass} animate-fade-in-left delay-${index % 10}" data-folder-id="${folder.id}">
          <div class="folder-clean-header">
            <div class="folder-clean-info">
              ${Icons.getFolderIcon(folder)}
              <span>${folder.name}</span>
            </div>
            <div class="folder-clean-switches">
              <div class="clean-switch-container" data-action="toggleDayConfigVisibility" data-media-type="screenshots">
                <span class="switch-label">Capturas</span>
                <button class="switch ${folder.cleaner.ss.on ? "active" : ""}" data-action="toggleFolderClean" data-media-type="screenshots"></button>
              </div>
              <div class="clean-switch-container" data-action="toggleDayConfigVisibility" data-media-type="recordings">
                <span class="switch-label">Gravações</span>
                <button class="switch ${folder.cleaner.sr.on ? "active" : ""}" data-action="toggleFolderClean" data-media-type="recordings"></button>
              </div>
            </div>
          </div>
          ${isEnabled ? `<div class="folder-clean-options">
            ${templates.folderOptions(folder, "screenshots")}
            ${templates.folderOptions(folder, "recordings")}
          </div>` : ""}
        </div>
      `;
    }
  };

  const render = {
    counts: (folders, autoCleaner) => {
      const screenshotsCount = folders.filter(f => f.cleaner.ss.on).length;
      const recordingsCount = folders.filter(f => f.cleaner.sr.on).length;

      if (autoCleaner) {
        elements.cleanerCountText.innerHTML = `<span class="subtitle-item"><span class="dot dot-screenshot"></span>${screenshotsCount} pastas com limpeza de capturas</span>, <span class="subtitle-item"><span class="dot dot-recording"></span>${recordingsCount} com limpeza de gravações</span>`;
      } else {
        elements.cleanerCountText.textContent = "Limpe pastas automaticamente";
      }
    },
    folderList: (folders) => {
      elements.folderCleanList.innerHTML = folders.map((folder, index) => templates.folderCard(folder, index)).join("");
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