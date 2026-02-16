const Icons = (function () {
  const elements = {
    app: DOM.qs("#app"),
    toReplace: DOM.qsa("[data-icon]")
  };

  const buildAttrs = attrs =>
    Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");

  const buildSvg = (content, attrs = {}) => {
    const attrString = buildAttrs(attrs);
    return `<svg ${attrString}>${content}</svg>`;
  };

  const getIcon = (name, attrs = {}) => {
    const content = ICON_SVGS[name];

    if (!content) {
      Logger.warn(`[Icons]: Icon "${name}" not found`);
      return "";
    }

    const baseAttrs = ICON_FONTAWESOME_LIST.has(name)
      ? ICON_FONTAWESOME_ATTRS
      : ICON_DEFAULT_ATTRS;

    const mergedAttrs = { ...baseAttrs, ...attrs };

    return buildSvg(content, mergedAttrs);
  };

  const getFolderIcon = (item, attrs = {}) => {
    const className = attrs.class ? ` ${attrs.class}` : "";
    const iconPath = ENV.resolveIconPath(item.pkg);

    return `<img src="${iconPath}" alt="${item.name}" class="folder-icon${className}" />`;
  };

  const replace = () => {
    elements.toReplace.forEach(el => {
      const name = el.getAttribute("data-icon");
      if (!name) return;

      const icon = getIcon(name, { class: el.className });
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
    replace();
    attachErrorHandler();
    elements.app.classList.remove("loading");
  };

  return {
    get: getIcon,
    getFolderIcon,
    init
  };
})();
