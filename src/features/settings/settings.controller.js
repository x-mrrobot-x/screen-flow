const SettingsController = (function () {
  "use strict";

  let isInitialized = false;

  const THEMES = ["light", "dark", "system"];
  const SETTINGS_KEYS = [
    "animationsEnabled",
    "notifyOrganizationResult",
    "notifyCleanupResult",
    "notifyPendingFiles"
  ];

  function renderAll() {
    const settings = SettingsModel.getSettings();
    SettingsView.render.all(settings, THEMES, SETTINGS_KEYS);
  }

  const handlers = {
    onThemeClick: e => {
      const theme = e.target.closest("[data-theme]")?.dataset.theme;
      if (!theme) return;
      SettingsModel.setSetting("theme", theme);
      SettingsView.render.theme(theme, THEMES);
      SettingsView.update.themeSelector(theme);
    },

    onSwitchClick: e => {
      const switchEl = e.target.closest("[data-setting-key]");
      if (!switchEl) return;
      const newValue = SettingsModel.toggleSetting(switchEl.dataset.settingKey);
      SettingsView.update.setting(switchEl.dataset.settingKey, newValue);
    },

    onReset: () => {
      SettingsModel.resetAllSettings();
      Toast.success("Configurações restauradas com sucesso!");
    },

    onDelete: () => {
      ConfirmationDialog.open(
        {
          title: "Apagar Todos os Dados",
          message:
            "Tem certeza de que deseja apagar todos os dados do aplicativo? Esta ação não pode ser desfeita."
        },
        () => {
          const ok = SettingsModel.deleteAllData();
          Toast[ok ? "success" : "error"](
            ok
              ? "Dados apagados com sucesso!"
              : "Ocorreu um erro ao apagar os dados."
          );
        }
      );
    },

    onStateChange: data => {
      if (data?.key === "settings") renderAll();
    }
  };

  function attachEvents() {
    const { tabContent, resetBtn, deleteBtn } = SettingsView.getElements();

    const events = [
      [tabContent, "click", handlers.onThemeClick],
      [tabContent, "click", handlers.onSwitchClick],
      [resetBtn, "click", handlers.onReset],
      [deleteBtn, "click", handlers.onDelete]
    ];
    events.forEach(([el, event, handler]) =>
      el.addEventListener(event, handler)
    );

    EventBus.on("appstate:changed", handlers.onStateChange);
  }

  function init() {
    if (isInitialized) return;
    SettingsView.init();
    renderAll();
    attachEvents();
    isInitialized = true;
  }

  return { init };
})();
