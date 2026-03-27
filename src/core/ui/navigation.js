import DOM from "../../lib/dom.js";
import EventBus from "../platform/event-bus.js";
import Logger from "../platform/logger.js";
import History from "./history.js";

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

function getCurrentTabId() {
  return DOM.qs(".nav-button.active")?.dataset.tab ?? null;
}

function deactivateCurrentButton() {
  DOM.qs(".nav-button.active").classList.remove("active");
}

function deactivateCurrentContent() {
  DOM.qs(".tab-content.active").classList.remove("active");
}

function deactivateCurrent() {
  deactivateCurrentButton();
  deactivateCurrentContent();
}

function activateTabButton(tabId) {
  DOM.qs(`[data-tab="${tabId}"]`).classList.add("active");
}

function activateTabContent(tabId) {
  const targetTab = DOM.qs(`#tab-${tabId}`);
  if (!targetTab) return;
  initLazyController(tabId);
  targetTab.classList.add("active");
  targetTab.style.display = "";
}

function emitNavigationChanged(tabId) {
  EventBus.emit("navigation:changed", { tab: tabId });
}

function activateTab(tabId) {
  activateTabButton(tabId);
  activateTabContent(tabId);
  emitNavigationChanged(tabId);
}

function scrollElementIntoView(el) {
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function triggerHighlightAnimation(el) {
  el.classList.remove("animate-card-highlight");
  void el.offsetWidth;
  el.classList.add("animate-card-highlight");
  setTimeout(() => el.classList.remove("animate-card-highlight"), 3000);
}

function highlightElement(selector) {
  const el = DOM.qs(selector);
  if (!el) return;
  scrollElementIntoView(el);
  triggerHighlightAnimation(el);
}

function pushCurrentTabToHistory(currentTabId) {
  History.pushTab(currentTabId, () => {
    deactivateCurrent();
    activateTab(currentTabId);
    scrollToTop();
  });
}

function navigateTo(tabId) {
  const currentTabId = getCurrentTabId();
  deactivateCurrent();
  if (currentTabId && currentTabId !== tabId) {
    pushCurrentTabToHistory(currentTabId);
  }
  activateTab(tabId);
  scrollToTop();
}

function navigateToAndHighlight(tabId, elementId) {
  navigateTo(tabId);
  setTimeout(() => highlightElement(elementId), 300);
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
  navigateToAndHighlight,
  scrollToTop,
  registerLazy
};
