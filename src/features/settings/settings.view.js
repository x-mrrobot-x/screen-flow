const SettingsView = (function() {
  'use strict';

  let container = null;
  const elements = {};

  const render = {
    theme: (theme) => {
      const root = document.documentElement;
      root.classList.remove(...SettingsConfig.THEMES);
      let themeToApply = theme;
      if (theme === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        themeToApply = systemPrefersDark ? "dark" : "light";
      }
      root.classList.add(themeToApply);
      if (typeof StatsController !== 'undefined') {
        StatsController.refresh();
      }
    },
    themeSelector: (theme) => {
      elements.themeButtons.forEach(btn => btn.classList.remove("active", "glow"));
      const activeBtn = DOM.qs(`#theme-${theme}`);
      if (activeBtn) activeBtn.classList.add("active", "glow");
    },
    setting: (key, value) => {
      const switchElement = elements[`${key}Switch`] || DOM.qs(`#switch-${key}`);
      if (switchElement) {
        switchElement.classList.toggle("active", value);
      }
      if(key === 'animationsEnabled') {
        document.documentElement.classList.toggle("no-animations", !value);
      }
    },
    allSettings: (settings) => {
      SettingsConfig.SETTINGS_KEYS.forEach(key => {
        render.setting(key, settings[key]);
      });
      render.theme(settings.theme);
      render.themeSelector(settings.theme);
    }
  };

  function init(containerSelector) {
    container = DOM.qs(containerSelector);
    if (!container) throw new Error(`Container ${containerSelector} not found`);

    for (const key in SettingsConfig.SELECTORS) {
      if (key !== "CONTAINER") {
        elements[key] = DOM.qsa(SettingsConfig.SELECTORS[key]);
        if(key !== 'themeButtons') {
          if (elements[key].length === 1) elements[key] = elements[key][0];
        }
      }
    }
    return container;
  }

  return {
    init,
    render
  };
})();
