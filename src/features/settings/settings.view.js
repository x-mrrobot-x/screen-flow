const SettingsView = (function () {
  "use strict";

  let elements = null;

  function queryElements() {
    elements = {
      tabContent: DOM.qs("#tab-settings"),
      themeBtns: DOM.qsa(".settings-theme-button"),
      resetBtn: DOM.qs("#reset-settings-btn"),
      deleteBtn: DOM.qs("#delete-all-btn")
    };
  }

  function getElements() {
    return elements;
  }

  const render = {
    theme: (theme, themes) => {
      const root = document.documentElement;
      root.classList.remove(...themes);
      const themeToApply =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      root.classList.add(themeToApply);
      if (typeof StatsController !== "undefined") StatsController.refresh();
    },

    all: (settings, themes, settingsKeys) => {
      settingsKeys.forEach(key => update.setting(key, settings[key]));
      render.theme(settings.theme, themes);
      update.themeSelector(settings.theme);
    }
  };

  const update = {
    themeSelector: theme => {
      elements.themeBtns.forEach(btn => btn.classList.remove("active"));
      DOM.qs(`#theme-${theme}`)?.classList.add("active");
    },

    setting: (key, value) => {
      const switchEl = DOM.qs(
        `#switch-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
      );
      if (switchEl) switchEl.checked = !!value;
      if (key === "animationsEnabled") {
        document.documentElement.classList.toggle("no-animations", !value);
      }
    }
  };

  function init() {
    queryElements();
  }

  return {
    init,
    getElements,
    render,
    update
  };
})();
