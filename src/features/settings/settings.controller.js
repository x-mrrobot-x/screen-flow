const SettingsController = (function () {
  let isInitialized = false;

  function render() {
    const settings = SettingsModel.getSettings();
    SettingsView.render.allSettings(settings);
  }

  const handlers = {
    onThemeChange: e => {
      const theme = e.target.closest("[data-theme]").dataset.theme;
      SettingsModel.setSetting("theme", theme);
      SettingsView.render.theme(theme);
      SettingsView.render.themeSelector(theme);
    },
    onSettingToggle: e => {
      const toggle = e.target.closest("[data-setting-key]");
      const key = e.target.dataset.settingKey;
      const newValue = SettingsModel.toggleSetting(key);
      SettingsView.render.setting(key, newValue);
    },
    onReset: () => {
      SettingsModel.resetAllSettings();
      Toast.success("Configurações restauradas com sucesso!");
    },
    onDelete: () => {
      ConfirmationModal.open(
        {
          title: "Apagar Todos os Dados",
          message:
            "Tem certeza de que deseja apagar todos os dados do aplicativo? Esta ação não pode ser desfeita."
        },
        () => {
          const success = SettingsModel.deleteAllData();
          if (success) {
            Toast.success("Dados apagados com sucesso!");
          } else {
            Toast.error("Ocorreu um erro ao apagar os dados.");
          }
        }
      );
    },
    onStateChange: data => {
      if (data && data.key === "settings") {
        render();
      }
    }
  };

  function attachEventListeners() {
    const themeButtons = DOM.qsa(SettingsConfig.SELECTORS.themeButtons);
    themeButtons.forEach(btn =>
      btn.addEventListener("click", handlers.onThemeChange)
    );

    SettingsConfig.SETTINGS_KEYS.forEach(key => {
      const switchElement = DOM.qs(`#switch-${key}`);
      if (switchElement) {
        switchElement.addEventListener("click", handlers.onSettingToggle);
      }
    });

    const resetButton = DOM.qs(SettingsConfig.SELECTORS.resetButton);
    if (resetButton) resetButton.addEventListener("click", handlers.onReset);

    const deleteAllButton = DOM.qs(SettingsConfig.SELECTORS.deleteAllButton);
    if (deleteAllButton)
      deleteAllButton.addEventListener("click", handlers.onDelete);
    
    EventBus.on("appstate:changed", handlers.onStateChange);
  }

  function init() {
    if (isInitialized) return;
    SettingsView.init(SettingsConfig.SELECTORS.CONTAINER);
    render();
    attachEventListeners();
    isInitialized = true;
  }

  return {
    init
  };
})();
