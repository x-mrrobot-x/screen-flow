const Navigation = (function () {
  "use strict";

  const elements = {
    navButtons: DOM.qsa(".nav-button"),
    tabContents: DOM.qsa(".tab-content"),
    app: DOM.qs("#app")
  };

  function navigateTo(tabId) {
    const activeBtn = DOM.qs(".nav-button.active");
    const activeTab = DOM.qs(".tab-content.active");

    if (activeBtn) activeBtn.classList.remove("active");
    if (activeTab) activeTab.classList.remove("active", "page-enter");

    const targetBtn = DOM.qs(`[data-tab="${tabId}"]`);
    const targetTab = DOM.qs(`#tab-${tabId}`);

    if (targetBtn) targetBtn.classList.add("active");
    if (targetTab) {
      targetTab.classList.add("active", "page-enter");
      targetTab.style.display = "";
      EventBus.emit("navigation:changed", { tab: tabId });
    }

    elements.app.scrollTo({ top: 0 });
  }

  function attachListeners(callback) {
    elements.navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;
        navigateTo(tabId);
        if (typeof callback === "function") callback(tabId);
      });
    });
  }

  function init() {
    attachListeners();
  }

  return {
    init,
    navigateTo
  };
})();
