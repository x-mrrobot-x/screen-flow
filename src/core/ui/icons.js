import DOM from "../../lib/dom.js";
import Logger from "../platform/logger.js";
import ENV from "../platform/env.js";
import IconsLib from "../../lib/icons-library.js";

const {
  ICON_DEFAULT_ATTRS,
  ICON_FONTAWESOME_ATTRS,
  ICON_FONTAWESOME_LIST,
  DEFAULT_ICON_PATH,
  ICON_SVGS
} = IconsLib;

const SPRITE_CONTAINER_ID = "icon-sprites";
const ICON_PREFIX = "icon-";

function buildAttrString(attrs) {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
}

function isFontAwesome(name) {
  return ICON_FONTAWESOME_LIST.has(name);
}

function resolveBaseAttrs(name) {
  return isFontAwesome(name) ? ICON_FONTAWESOME_ATTRS : ICON_DEFAULT_ATTRS;
}

function resolveViewBox(name) {
  return isFontAwesome(name)
    ? ICON_FONTAWESOME_ATTRS.viewBox
    : ICON_DEFAULT_ATTRS.viewBox;
}

function createSymbol(name, content) {
  return `<symbol id="${ICON_PREFIX}${name}" viewBox="${resolveViewBox(
    name
  )}">${content}</symbol>`;
}

function buildSpriteContainer(symbols) {
  const container = document.createElement("div");
  container.id = SPRITE_CONTAINER_ID;
  container.style.display = "none";
  container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`;
  return container;
}

function injectSprites() {
  const symbols = Object.entries(ICON_SVGS)
    .map(([name, content]) => createSymbol(name, content))
    .join("");
  document.body.prepend(buildSpriteContainer(symbols));
}

function getSvg(name, attrs = {}) {
  if (!ICON_SVGS[name]) {
    Logger.warn(`[Icons] Icon "${name}" not found.`);
    return "";
  }
  const attrString = buildAttrString({ ...resolveBaseAttrs(name), ...attrs });
  return `<svg ${attrString}><use href="#${ICON_PREFIX}${name}"/></svg>`;
}

function resolveIconClass(attrs) {
  return attrs.class ? ` ${attrs.class}` : "";
}

function getAppIcon(item, attrs = {}) {
  const className = resolveIconClass(attrs);
  const iconPath = ENV.resolveIconPath(item.pkg);
  return `<img src="${iconPath}" alt="${item.name}" class="app-icon${className}" loading="lazy" decoding="async" />`;
}

function replaceIconElement(el) {
  const name = el.getAttribute("data-icon");
  if (!name) return;
  const icon = getSvg(name, { class: el.className });
  if (icon) el.outerHTML = icon;
}

function replace() {
  DOM.qsa("[data-icon]").forEach(replaceIconElement);
}

function isAppIconImage(target) {
  return target.tagName === "IMG" && target.classList.contains("app-icon");
}

function isAlreadyDefaultIcon(target) {
  return target.src.includes(DEFAULT_ICON_PATH);
}

function handleIconError(event) {
  const { target } = event;
  if (!isAppIconImage(target)) return;
  if (isAlreadyDefaultIcon(target)) return;
  target.src = `${ENV.WORK_DIR}${DEFAULT_ICON_PATH}`;
}

function attachEvents() {
  DOM.qs("#app").addEventListener("error", handleIconError, true);
}

function init() {
  injectSprites();
  replace();
  attachEvents();
}

export default {
  getSvg,
  getAppIcon,
  init
};
