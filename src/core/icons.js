const Icons = (function () {
  "use strict";

  const SPRITE_CONTAINER_ID = "icon-sprites";
  const ICON_PREFIX = "icon-";

  function buildAttrString(attrs) {
    return Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
  }

  function createSymbol(name, content) {
    const isFa = ICON_FONTAWESOME_LIST.has(name);
    const viewBox = isFa
      ? ICON_FONTAWESOME_ATTRS.viewBox
      : ICON_DEFAULT_ATTRS.viewBox;
    return `<symbol id="${ICON_PREFIX}${name}" viewBox="${viewBox}">${content}</symbol>`;
  }

  function injectSprites() {
    const symbols = Object.entries(ICON_SVGS)
      .map(([name, content]) => createSymbol(name, content))
      .join("");

    const container = document.createElement("div");
    container.id = SPRITE_CONTAINER_ID;
    container.style.display = "none";
    container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`;
    document.body.prepend(container);
  }

  function getSvg(name, attrs = {}) {
    if (!ICON_SVGS[name]) {
      Logger.warn(`[Icons] Icon "${name}" not found.`);
      return "";
    }
    const isFa = ICON_FONTAWESOME_LIST.has(name);
    const baseAttrs = isFa ? ICON_FONTAWESOME_ATTRS : ICON_DEFAULT_ATTRS;
    const attrString = buildAttrString({ ...baseAttrs, ...attrs });
    return `<svg ${attrString}><use href="#${ICON_PREFIX}${name}"/></svg>`;
  }

  function getAppIcon(item, attrs = {}) {
    const className = attrs.class ? ` ${attrs.class}` : "";
    const iconPath = ENV.resolveIconPath(item.pkg);
    return `<img src="${iconPath}" alt="${item.name}" class="app-icon${className}" loading="lazy" decoding="async" />`;
  }

  function replace() {
    DOM.qsa("[data-icon]").forEach(el => {
      const name = el.getAttribute("data-icon");
      if (!name) return;
      const icon = getSvg(name, { class: el.className });
      if (icon) el.outerHTML = icon;
    });
  }

  function handleIconError(event) {
    const { target } = event;
    const isIconImage =
      target.tagName === "IMG" && target.classList.contains("app-icon");

    if (!isIconImage) return;

    const defaultPath = `${ENV.WORK_DIR}${DEFAULT_ICON_PATH}`;
    if (target.src.includes(DEFAULT_ICON_PATH)) return;

    target.src = defaultPath;
  }

  function attachEvents() {
    const app = DOM.qs("#app");
    app.addEventListener("error", handleIconError, true);
  }

  function init() {
    injectSprites();
    replace();
    attachEvents();
  }

  return {
    getSvg,
    getAppIcon,
    init
  };
})();
