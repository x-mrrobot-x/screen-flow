import DOM from "../../lib/dom.js";

const SCROLL_IDLE_MS = 800;
const TAB_RENDER_DELAY = 50;
const THUMB_MIN_HEIGHT = 30;

let elements = null;
let scrollTimer = null;
let tabObserver = null;
let ticking = false;

function setCssVar(name, px) {
  document.documentElement.style.setProperty(name, `${px}px`);
}

function getCssVar(name) {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(name)
    ) || 0
  );
}

function getHeight(el) {
  return el?.getBoundingClientRect().height ?? 0;
}

function queryElements() {
  elements = {
    app: DOM.qs("#app"),
    tabContents: DOM.qsa(".tab-content"),
    footer: DOM.qs(".app-footer"),
    track: null,
    thumb: null
  };
}

function updateHeaderHeight() {
  const activeTab = DOM.qs(".tab-content.active");
  const header = activeTab && DOM.qs(".page-header", activeTab);
  if (header) setCssVar("--header-height", getHeight(header));
}

function updateFooterHeight() {
  const isSidebar = window.matchMedia("(min-width: 1024px)").matches;
  if (isSidebar) {
    setCssVar("--footer-height", 0);
  } else if (elements.footer) {
    setCssVar("--footer-height", getHeight(elements.footer));
  }
}

function updateMetrics() {
  updateHeaderHeight();
  updateFooterHeight();
  updateScrollPos();
}

function computeThumbLayout(scrollHeight, clientHeight, scrollTop) {
  const trackHeight =
    clientHeight - getCssVar("--header-height") - getCssVar("--footer-height");
  const thumbHeight = Math.max(
    trackHeight * (clientHeight / scrollHeight),
    THUMB_MIN_HEIGHT
  );
  const thumbTop =
    (scrollTop / (scrollHeight - clientHeight)) * (trackHeight - thumbHeight);
  return { thumbHeight, thumbTop };
}

function applyThumbLayout(thumb, thumbHeight, thumbTop) {
  thumb.style.height = `${thumbHeight}px`;
  thumb.style.transform = `translate3d(0, ${thumbTop}px, 0)`;
}

function updateScrollPos() {
  const { app, thumb } = elements;
  if (!app || !thumb) return;
  const { scrollHeight, clientHeight, scrollTop } = app;

  if (scrollHeight <= clientHeight) {
    thumb.style.display = "none";
    return;
  }

  thumb.style.display = "block";
  const { thumbHeight, thumbTop } = computeThumbLayout(
    scrollHeight,
    clientHeight,
    scrollTop
  );
  applyThumbLayout(thumb, thumbHeight, thumbTop);
}

function scheduleScrollPosUpdate() {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateScrollPos();
      ticking = false;
    });
    ticking = true;
  }
}

function scheduleScrollHide() {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(
    () => elements.track?.classList.remove("is-visible"),
    SCROLL_IDLE_MS
  );
}

function onScroll() {
  elements.track?.classList.add("is-visible");
  scheduleScrollPosUpdate();
  scheduleScrollHide();
}

function onTabClassChange(mutation) {
  if (mutation.target.classList.contains("active")) {
    setTimeout(updateMetrics, TAB_RENDER_DELAY);
  }
}

function createScrollbarElements() {
  elements.track = DOM.create("div", { className: "custom-scrollbar" });
  elements.thumb = DOM.create("div", { className: "custom-scrollbar-thumb" });
  elements.track.appendChild(elements.thumb);
  document.body.appendChild(elements.track);
}

function createDOM() {
  if (DOM.qs(".custom-scrollbar")) return;
  createScrollbarElements();
}

function setupTabObserver() {
  tabObserver = new MutationObserver(mutations =>
    mutations.forEach(onTabClassChange)
  );
  elements.tabContents.forEach(tab => {
    tabObserver.observe(tab, { attributes: true, attributeFilter: ["class"] });
  });
}

function attachEvents() {
  const events = [
    [elements.app, "scroll", onScroll, { passive: true }],
    [window, "resize", updateMetrics]
  ];
  events.forEach(([el, event, handler, options]) =>
    el.addEventListener(event, handler, options)
  );
}

function init() {
  queryElements();
  createDOM();
  attachEvents();
  setupTabObserver();
  updateMetrics();
}

export default {
  init
};
