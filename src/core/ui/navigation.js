import DOM from "../../lib/dom.js";
import EventBus from "../platform/event-bus.js";
import Logger from "../platform/logger.js";

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
  if (lazyControllers[tabId]) lazyControllers[tabId]();
}

function deactivateCurrent() {
  DOM.qs(".nav-button.active").classList.remove("active");
  DOM.qs(".tab-content.active").classList.remove("active", "page-enter");
}

function activateTab(tabId) {
  const targetBtn = DOM.qs(`[data-tab="${tabId}"]`);
  const targetTab = DOM.qs(`#tab-${tabId}`);

  targetBtn.classList.add("active");

  if (!targetTab) return;
  initLazyController(tabId);
  targetTab.classList.add("active", "page-enter");
  targetTab.style.display = "";
  EventBus.emit("navigation:changed", { tab: tabId });
}

function navigateTo(tabId) {
  deactivateCurrent();
  activateTab(tabId);
  scrollToTop();
}

function handleNavClick(e) {
  const btn = e.target.closest("[data-tab]");
  if (btn) navigateTo(btn.dataset.tab);
}

function attachEvents() {
  elements.navContainer.addEventListener("click", handleNavClick);
}

function init() {
  queryElements();
  attachEvents();
}

export default {
  init,
  navigateTo,
  scrollToTop,
  registerLazy
};
