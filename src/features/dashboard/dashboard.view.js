const DashboardView = (function () {
  "use strict";

  let container = null;
  const elements = {};

  const render = {
    stats(data) {
      elements.dashStatOrganizer.textContent = data.organizer.toLocaleString();
      elements.dashStatRemoved.textContent = data.removed.toLocaleString();
      elements.dashStatPending.textContent = data.pending;
    },

    lastActivity(data) {
      elements.dashLastOrganizer.textContent = data.lastOrganizer
        ? Utils.formatTimestamp(data.lastOrganizer)
        : "Nenhum";
      elements.dashLastCleanup.textContent = Utils.formatTimestamp(
        data.lastCleanup
      );
    },

    topApp(data) {
      elements.dashTopAppName.textContent = data.topApp.name;
      elements.dashTopAppCount.textContent = `${data.topApp.count} arquivos`;
    },

    complete(data) {
      render.stats(data);
      render.lastActivity(data);
      render.topApp(data);
    }
  };

  function init(containerSelector) {
    container = DOM.qs(containerSelector);
    if (!container) {
      throw new Error(`Container ${containerSelector} not found`);
    }

    for (const key in DashboardConfig.SELECTORS) {
      if (key !== "CONTAINER") {
        elements[key] = DOM.qs(DashboardConfig.SELECTORS[key]);
      }
    }

    return container;
  }

  function update(section, data) {
    if (render[section]) {
      render[section](data);
    }
  }

  function showScanLoading() {
    elements.statsGrid.classList.add("loading");
  }

  function hideScanLoading() {
    elements.statsGrid.classList.remove("loading");
  }

  function clear() {
    if (container) container.innerHTML = "";
  }

  return {
    init,
    render,
    update,
    clear,
    showScanLoading,
    hideScanLoading
  };
})();
