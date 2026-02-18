const Icons = (function () {
  const elements = {
    app: DOM.qs("#app"),
    toReplace: DOM.qsa("[data-icon]")
  };

  const SPRITE_CONTAINER_ID = "icon-sprites";
  const ICON_PREFIX = "icon-";

  const buildAttrString = attrs =>
    Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");

  const createSymbol = (name, content) => {
    const isFontAwesome = ICON_FONTAWESOME_LIST.has(name);
    const viewBox = isFontAwesome
      ? ICON_FONTAWESOME_ATTRS.viewBox
      : ICON_DEFAULT_ATTRS.viewBox;

    return `<symbol id="${ICON_PREFIX}${name}" viewBox="${viewBox}">${content}</symbol>`;
  };

  const injectSprites = () => {
    const symbols = Object.entries(ICON_SVGS)
      .map(([name, content]) => createSymbol(name, content))
      .join("");

    const spriteContainer = document.createElement("div");
    spriteContainer.id = SPRITE_CONTAINER_ID;
    spriteContainer.style.display = "none";
    spriteContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`;

    document.body.prepend(spriteContainer);
  };

  const getSvg = (name, attrs = {}) => {
    if (!ICON_SVGS[name]) {
      Logger.warn(`[Icons]: Icon "${name}" not found`);
      return "";
    }

    const isFontAwesome = ICON_FONTAWESOME_LIST.has(name);
    const baseAttrs = isFontAwesome
      ? ICON_FONTAWESOME_ATTRS
      : ICON_DEFAULT_ATTRS;

    const mergedAttrs = { ...baseAttrs, ...attrs };
    const attrString = buildAttrString(mergedAttrs);

    return `<svg ${attrString}><use href="#${ICON_PREFIX}${name}"/></svg>`;
  };

  const getAppIcon = (item, attrs = {}) => {
    const className = attrs.class ? ` ${attrs.class}` : "";
    const iconPath = ENV.resolveIconPath(item.pkg);

    return `<img src="${iconPath}" alt="${item.name}" class="folder-icon${className}" loading="lazy" decoding="async" />`;
  };

  const replace = () => {
    const nodes = DOM.qsa("[data-icon]");

    nodes.forEach(el => {
      const name = el.getAttribute("data-icon");
      if (!name) return;

      const icon = getSvg(name, { class: el.className });
      if (icon) el.outerHTML = icon;
    });
  };

  const handleError = event => {
    const { target } = event;
    const isIconImage =
      target.tagName === "IMG" &&
      (target.classList.contains("folder-icon") ||
        target.classList.contains("app-icon"));

    if (!isIconImage) return;

    const defaultIconPath = `${ENV.WORK_DIR}${DEFAULT_ICON_PATH}`;

    if (target.src.includes(DEFAULT_ICON_PATH)) return;

    target.src = defaultIconPath;
  };

  const attachErrorHandler = () => {
    window.addEventListener("error", handleError, true);
  };

  const init = () => {
    injectSprites();
    replace();
    attachErrorHandler();
    elements.app.classList.remove("loading");
  };

  return {
    getSvg,
    getAppIcon,
    init
  };
})();
