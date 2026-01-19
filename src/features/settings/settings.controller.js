const SettingsController = (function() {
  let isInitialized = false;

  function render() {
    const settings = SettingsModel.getSettings();
    SettingsView.render.allSettings(settings);
  }

  const handlers = {
    onThemeChange: (e) => {
      const theme = e.target.closest('[data-theme]').dataset.theme;
      SettingsModel.setSetting('theme', theme);
      SettingsView.render.theme(theme);
      SettingsView.render.themeSelector(theme);
    },
    onSettingToggle: (e) => {
      const toggle = e.target.closest("[data-setting-key]");
      const key = e.target.dataset.settingKey;
      const newValue = SettingsModel.toggleSetting(key);
      SettingsView.render.setting(key, newValue);
    },
    onReset: () => {
      SettingsModel.resetAllSettings();
      render();
      EventBus.emit(EVENTS.SHOW_TOAST, { message: "Configurações restauradas com sucesso!", type: 'success' });
    },
    onDelete: () => {
      Modal.confirm(
        "Excluir Todos os Dados",
        "Tem certeza de que deseja excluir todos os dados? Esta ação não pode ser desfeita.",
        () => {
          const success = SettingsModel.deleteAllData();
          if (success) {
            EventBus.emit(EVENTS.SHOW_TOAST, { message: "Todos os dados foram excluídos com sucesso!", type: 'success' });
            setTimeout(() => window.location.reload(), 1000);
          } else {
            EventBus.emit(EVENTS.SHOW_TOAST, { message: "Ocorreu um erro ao excluir os dados.", type: 'error' });
          }
        }
      );
    }
  };
  
  function attachEventListeners() {
    const themeButtons = DOM.qsa(SettingsConfig.SELECTORS.themeButtons);
    themeButtons.forEach(btn => btn.addEventListener('click', handlers.onThemeChange));

    SettingsConfig.SETTINGS_KEYS.forEach(key => {
      const switchElement = DOM.qs(`#switch-${key}`);
      if(switchElement) {
        switchElement.addEventListener('click', handlers.onSettingToggle);
      }
    });

    const resetButton = DOM.qs(SettingsConfig.SELECTORS.resetButton);
    if(resetButton) resetButton.addEventListener('click', handlers.onReset);

    const deleteAllButton = DOM.qs(SettingsConfig.SELECTORS.deleteAllButton);
    if(deleteAllButton) deleteAllButton.addEventListener('click', handlers.onDelete);
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
