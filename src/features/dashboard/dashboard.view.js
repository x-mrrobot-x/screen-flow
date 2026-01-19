const DashboardView = (function() {
  'use strict';
  
  let container = null;
  const elements = {};

  const templates = {
    stats: (data) => `
      <p id="dash-stat-organized">${data.organized.toLocaleString()}</p>
      <p id="dash-stat-removed">${data.removed.toLocaleString()}</p>
      <p id="dash-stat-pending">${data.pending}</p>
    `,
    lastActivity: (data) => `
      <p id="dash-last-organized">${data.lastOrganized ? Utils.formatTimestamp(data.lastOrganized) : "Nenhum"}</p>
      <p id="dash-last-cleanup">${Utils.formatTimestamp(data.lastCleanup)}</p>
    `,
    topApp: (data) => `
      <p id="dash-top-app-name">${data.topApp.name}</p>
      <p id="dash-top-app-count">${data.topApp.count} arquivos</p>
    `
  };
  
  const render = {
    stats(data) {
      elements.dashStatOrganized.textContent = data.organized.toLocaleString();
      elements.dashStatRemoved.textContent = data.removed.toLocaleString();
      elements.dashStatPending.textContent = data.pending;
    },
    
    lastActivity(data) {
      elements.dashLastOrganized.textContent = data.lastOrganized ? Utils.formatTimestamp(data.lastOrganized) : "Nenhum";
      elements.dashLastCleanup.textContent = Utils.formatTimestamp(data.lastCleanup);
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
    container = DOM.get(containerSelector);
    if (!container) {
      throw new Error(`Container ${containerSelector} not found`);
    }

    for (const key in DashboardConfig.SELECTORS) {
      if(key !== "CONTAINER") {
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
  
  function clear() {
    if (container) container.innerHTML = '';
  }
  
  return {
    init,
    render,
    update,
    clear
  };
})();
