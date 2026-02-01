const Navigation = (function () {
  "use strict";

  const elements = {
    navButtons: DOM.qsa(".nav-button"),
    tabContents: DOM.qsa(".tab-content")
  };

  function navigateTo(tabId) {
    const activeBtn = document.querySelector(".nav-button.active");
    const activeTab = document.querySelector(".tab-content.active");

    if (activeBtn) activeBtn.classList.remove("active");
    if (activeTab) activeTab.classList.remove("active", "page-enter");

    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const targetTab = document.getElementById(`tab-${tabId}`);

    if (targetBtn) targetBtn.classList.add("active");
    if (targetTab) {
      targetTab.classList.add("active", "page-enter");
      targetTab.style.display = "";
    }

    window.scrollTo({ top: 0 });
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
