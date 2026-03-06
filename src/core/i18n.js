const I18n = (() => {
  "use strict";

  let locale = "en";
  let translations = {};

  const SUPPORTED = ["pt", "en", "es"];

  function interpolate(str, params) {
    if (!params || typeof str !== "string") return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      key in params ? params[key] : `{{${key}}}`
    );
  }

  function t(key, params) {
    const parts = key.split(".");
    let value = translations;
    for (const part of parts) {
      if (value == null || typeof value !== "object") return key;
      value = value[part];
    }

    if (typeof value !== "string") return key;

    if (params && typeof params.n === "number" && params.n !== 1) {
      const pluralParts = key.split(".");
      const lastPart = pluralParts[pluralParts.length - 1];
      pluralParts[pluralParts.length - 1] = lastPart + "_plural";
      let plural = translations;
      for (const part of pluralParts) {
        if (plural == null || typeof plural !== "object") {
          plural = null;
          break;
        }
        plural = plural[part];
      }
      if (typeof plural === "string") value = plural;
    }

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

  function applyDOM() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const translated = t(key);
      if (translated !== key) el.textContent = translated;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const translated = t(key);
      if (translated !== key) el.placeholder = translated;
    });
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

  async function init() {
    const saved = AppState.getSetting("language");
    const detected = ENV.getSystemLanguage();
    const preferred = saved || detected;
    const target = SUPPORTED.includes(preferred) ? preferred : "en";

    const loaded = await loadTranslations(target);
    locale = target;
    translations = Object.keys(loaded).length > 0 ? loaded : {};
    applyDOM();
  }

  return {
    init,
    t,
    setLocale,
    getLocale
  };
})();
