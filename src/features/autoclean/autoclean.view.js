const AutoCleanView = (function() {
  'use strict';
  
  let container = null;
  const elements = {};

  const templates = {
    folderOptions: (folder, mediaType) => {
      const config = AutoCleanConfig;
      const isActive = mediaType === "screenshots" ? folder.autoClean.ss.on : folder.autoClean.sr.on;
      if (!isActive) return "";

      const optionId = `option-group-${folder.id}-${mediaType}`;
      const label = mediaType === "screenshots" ? "Capturas" : "Gravações";
      const currentDays = mediaType === "screenshots" ? folder.autoClean.ss.days : folder.autoClean.sr.days;

      let optionsHtml = config.DAY_OPTIONS.map(days => {
        const activeClass = currentDays === days ? "active" : "";
        return `<button class="day-button tap-scale ${activeClass}" data-action="setFolderDays" data-media-type="${mediaType}" data-days="${days}">${days} dias</button>`;
      }).join('');

      return `
        <div class="clean-option-group" id="${optionId}">
          <p>${label} - Remover após:</p>
          <div class="days-options">${optionsHtml}</div>
        </div>
      `;
    },
    folderCard: (folder, index) => {
      const isEnabled = folder.autoClean.ss.on || folder.autoClean.sr.on;
      const enabledClass = isEnabled ? "enabled" : "";

      return `
        <div class="folder-clean-card ${enabledClass} animate-fade-in-left delay-${index % 10}" data-folder-id="${folder.id}">
          <div class="folder-clean-header">
            <div class="folder-clean-info">
              ${Icons.getOrganizeIcon(folder)}
              <span>${folder.name}</span>
            </div>
            <div class="folder-clean-switches">
              <div class="clean-switch-container" data-action="toggleDayConfigVisibility" data-media-type="screenshots">
                <span class="switch-label">Capturas</span>
                <button class="switch ${folder.autoClean.ss.on ? "active" : ""}" data-action="toggleFolderClean" data-media-type="screenshots"></button>
              </div>
              <div class="clean-switch-container" data-action="toggleDayConfigVisibility" data-media-type="recordings">
                <span class="switch-label">Gravações</span>
                <button class="switch ${folder.autoClean.sr.on ? "active" : ""}" data-action="toggleFolderClean" data-media-type="recordings"></button>
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
    counts: (organizeItems, autoCleanup) => {
      const screenshotsCount = organizeItems.filter(f => f.autoClean.ss.on).length;
      const recordingsCount = organizeItems.filter(f => f.autoClean.sr.on).length;

      if (autoCleanup) {
        elements.autocleanCountText.innerHTML = `<span class="subtitle-item"><span class="dot dot-screenshot"></span>${screenshotsCount} pastas com limpeza de capturas</span>, <span class="subtitle-item"><span class="dot dot-recording"></span>${recordingsCount} com limpeza de gravações</span>`;
      } else {
        elements.autocleanCountText.textContent = "Limpe pastas automaticamente";
      }
    },
    folderList: (folders) => {
      elements.folderCleanList.innerHTML = folders.map((folder, index) => templates.folderCard(folder, index)).join("");
    },
    autoclean: (folders, autoCleanup) => {
      render.counts(folders, autoCleanup);
      render.folderList(folders);
      elements.autoCleanupSwitch.classList.toggle("active", autoCleanup);
      elements.folderCleanList.style.display = autoCleanup ? "flex" : "none";
    }
  };

  function init(containerSelector) {
    container = DOM.get(containerSelector);
    if (!container) throw new Error(`Container ${containerSelector} not found`);

    for (const key in AutoCleanConfig.SELECTORS) {
      if (key !== "CONTAINER") {
        if (key === "folderCleanList") {
          elements.folderCleanList = DOM.qs(AutoCleanConfig.SELECTORS[key]);
        } else {
          elements[key] = DOM.qs(AutoCleanConfig.SELECTORS[key]);
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
