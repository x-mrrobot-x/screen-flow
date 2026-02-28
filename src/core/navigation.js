const Navigation = (function () {
  "use strict";

  let elements = null;
  const lazyControllers = {};

  function queryElements() {
    elements = {
      app: DOM.qs("#app"),
      tabContents: DOM.qsa(".tab-content"),
      navContainer: DOM.qs(".nav-container")
    };
  }

  function scrollToTop() {
    elements.app.scrollTo({ top: 0 });
  }

  function registerLazy(tabId, initFn) {
    lazyControllers[tabId] = initFn;
  }

  function initLazyController(tabId) {
    if (lazyControllers[tabId]) {
      lazyControllers[tabId]();
    }
  }

  function navigateTo(tabId) {
    DOM.qs(".nav-button.active").classList.remove("active");
    DOM.qs(".tab-content.active").classList.remove("active", "page-enter");

    const targetBtn = DOM.qs(`[data-tab="${tabId}"]`);
    const targetTab = DOM.qs(`#tab-${tabId}`);

    targetBtn.classList.add("active");

    if (targetTab) {
      initLazyController(tabId);
      targetTab.classList.add("active", "page-enter");
      targetTab.style.display = "";
      EventBus.emit("navigation:changed", { tab: tabId });
    }

    scrollToTop();
  }

  function attachEvents() {
    elements.navContainer.addEventListener("click", e => {
      const btn = e.target.closest("[data-tab]");
      if (btn) navigateTo(btn.dataset.tab);
    });
  }

  function init() {
    queryElements();
    attachEvents();
  }

  return {
    init,
    navigateTo,
    scrollToTop,
    registerLazy
  };
})();
