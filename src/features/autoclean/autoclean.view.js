const AutoCleanView = (function() {
  'use strict';
  
  let container = null;
  const elements = {};

  const templates = {
    organizeOptions: (item, mediaType) => {
      const config = AutoCleanConfig;
      const isActive = mediaType === "screenshots" ? item.autoClean.ss.on : item.autoClean.sr.on;
      if (!isActive) return "";

      const optionId = `option-group-${item.id}-${mediaType}`;
      const label = mediaType === "screenshots" ? "Capturas" : "Gravações";
      const currentDays = mediaType === "screenshots" ? item.autoClean.ss.days : item.autoClean.sr.days;

      let optionsHtml = config.DAY_OPTIONS.map(days => {
        const activeClass = currentDays === days ? "active" : "";
        return `<button class="day-button tap-scale ${activeClass}" data-action="setOrganizeItemDays" data-media-type="${mediaType}" data-days="${days}">${days} dias</button>`;
      }).join('');

      return `
        <div class="clean-option-group" id="${optionId}">
          <p>${label} - Remover após:</p>
          <div class="days-options">${optionsHtml}</div>
        </div>
      `;
    },
    organizeCard: (item, index) => {
      const isEnabled = item.autoClean.ss.on || item.autoClean.sr.on;
      const enabledClass = isEnabled ? "enabled" : "";

      return `
        <div class="organize-item-clean-card ${enabledClass} animate-fade-in-left delay-${index % 10}" data-organize-item-id="${item.id}">
          <div class="organize-item-clean-header">
            <div class="organize-item-clean-info">
              ${Icons.getOrganizeIcon(item)}
              <span>${item.name}</span>
            </div>
            <div class="organize-item-clean-switches">
              <div class="clean-switch-container" data-action="toggleDayConfigVisibility" data-media-type="screenshots">
                <span class="switch-label">Capturas</span>
                <button class="switch ${item.autoClean.ss.on ? "active" : ""}" data-action="toggleOrganizeItemClean" data-media-type="screenshots"></button>
              </div>
              <div class="clean-switch-container" data-action="toggleDayConfigVisibility" data-media-type="recordings">
                <span class="switch-label">Gravações</span>
                <button class="switch ${item.autoClean.sr.on ? "active" : ""}" data-action="toggleOrganizeItemClean" data-media-type="recordings"></button>
              </div>
            </div>
          </div>
          ${isEnabled ? `<div class="organize-item-clean-options">
            ${templates.organizeOptions(item, "screenshots")}
            ${templates.organizeOptions(item, "recordings")}
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
    organizeList: (organizeItems) => {
      elements.organizeItemCleanList.innerHTML = organizeItems.map((item, index) => templates.organizeCard(item, index)).join("");
    },
    autoclean: (organizeItems, autoCleanup) => {
      render.counts(organizeItems, autoCleanup);
      render.organizeList(organizeItems);
      elements.autoCleanupSwitch.classList.toggle("active", autoCleanup);
      elements.organizeItemCleanList.style.display = autoCleanup ? "flex" : "none";
    }
  };

  function init(containerSelector) {
    container = DOM.get(containerSelector);
    if (!container) throw new Error(`Container ${containerSelector} not found`);

    for (const key in AutoCleanConfig.SELECTORS) {
      if (key !== "CONTAINER") {
        if (key === "folderCleanList") {
          elements.organizeItemCleanList = DOM.qs(AutoCleanConfig.SELECTORS[key]);
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
