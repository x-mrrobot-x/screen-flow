import EventBus from "../platform/event-bus.js";
import ENV from "../platform/env.js";
import Logger from "../platform/logger.js";
import AppState from "../state/app-state.js";

let locale = "en";
let translations = {};

const SUPPORTED = ["pt", "en", "es"];

function interpolate(str, params) {
  if (!params || typeof str !== "string") return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in params ? params[key] : `{{${key}}}`
  );
}

function resolvePath(obj, parts) {
  let value = obj;
  for (const part of parts) {
    if (value == null || typeof value !== "object") return null;
    value = value[part];
  }
  return value;
}

function resolvePluralKey(key) {
  const parts = key.split(".");
  parts[parts.length - 1] += "_plural";
  return parts;
}

function shouldUsePlural(params) {
  return params && typeof params.n === "number" && params.n !== 1;
}

function resolveValue(key, params) {
  const value = resolvePath(translations, key.split("."));
  if (typeof value !== "string") return null;

  if (shouldUsePlural(params)) {
    const plural = resolvePath(translations, resolvePluralKey(key));
    if (typeof plural === "string") return plural;
  }

  return value;
}

function t(key, params) {
  const value = resolveValue(key, params);
  if (value === null) return key;
  return interpolate(value, params);
}

async function loadTranslations(lang) {
  try {
    const data = await ENV.readFile("TRANSLATIONS", { lang });
    if (!data || Object.keys(data).length === 0)
      throw new Error("Empty translation data");
    return data;
  } catch (err) {
    Logger.error(`[I18n] Failed to load translations for "${lang}":`, err);
    return {};
  }
}

function applyI18nText() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const translated = t(el.dataset.i18n);
    if (translated !== el.dataset.i18n) el.textContent = translated;
  });
}

function applyI18nPlaceholders() {
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const translated = t(el.dataset.i18nPlaceholder);
    if (translated !== el.dataset.i18nPlaceholder) el.placeholder = translated;
  });
}

function applyDOM() {
  applyI18nText();
  applyI18nPlaceholders();
}

function getLocale() {
  return locale;
}

async function setLocale(lang) {
  if (!SUPPORTED.includes(lang)) return;
  const loaded = await loadTranslations(lang);
  if (Object.keys(loaded).length === 0) return;
  locale = lang;
  translations = loaded;
  applyDOM();
  EventBus.emit("i18n:changed", { locale: lang });
}

function resolveTargetLocale(saved, detected) {
  const preferred = saved || detected;
  return SUPPORTED.includes(preferred) ? preferred : "en";
}

async function init() {
  const target = resolveTargetLocale(
    AppState.getSetting("language"),
    ENV.getSystemLanguage()
  );

  const loaded = await loadTranslations(target);
  locale = target;
  translations = Object.keys(loaded).length > 0 ? loaded : {};
  applyDOM();

  if (!AppState.getSetting("language")) AppState.setSetting("language", target);
}

export default {
  init,
  t,
  setLocale,
  getLocale
};
