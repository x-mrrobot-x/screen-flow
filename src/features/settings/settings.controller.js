import SettingsModel from "./settings.model.js";
import SettingsView from "./settings.view.js";
import EventBus from "../../core/platform/event-bus.js";
import I18n from "../../core/services/i18n.js";
import Toast from "../../core/ui/toast.js";
import ConfirmationDialog from "../../core/ui/confirmation-dialog.js";
import Logger from "../../core/platform/logger.js";
import ENV from "../../core/platform/env.js";

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
  },
  onSwitchChange: e => {
    const switchEl = e.target.closest("[data-setting-key]");
    if (!switchEl) return;
    SettingsModel.toggleSetting(switchEl.dataset.settingKey);
  },
  onLanguageChange: e => {
    const lang = e.target.value;
    if (!lang) return;
    SettingsModel.setSetting("language", lang);
    I18n.setLocale(lang).then(() => {
      SettingsView.update.languageLabel(lang);
      EventBus.emit("dashboard:reload-stats");
      EventBus.emit("appstate:changed", { key: "stats" });
      EventBus.emit("appstate:changed", { key: "folders" });
      EventBus.emit("appstate:changed", { key: "activities" });
    });
  },
  onReset: () => {
    SettingsModel.resetAllSettings();
    Toast.success(I18n.t("settings.reset_success"));
  },
  onDelete: () => {
    ConfirmationDialog.open(
      {
        title: I18n.t("settings.delete_all_title"),
        message: I18n.t("settings.delete_message")
      },
      () => {
        const ok = SettingsModel.deleteAllData();
        Toast[ok ? "success" : "error"](
          ok
            ? I18n.t("settings.delete_success")
            : I18n.t("settings.delete_error")
        );
      }
    );
  },
  onStateChange: data => {
    if (data?.key === "settings") renderAll();
  }
};

function attachEvents() {
  const { tabContent, resetBtn, deleteBtn, languageSelect } =
    SettingsView.getElements();
  const events = [
    [tabContent, "click", handlers.onThemeClick],
    [tabContent, "change", handlers.onSwitchChange],
    [languageSelect, "change", handlers.onLanguageChange],
    [resetBtn, "click", handlers.onReset],
    [deleteBtn, "click", handlers.onDelete]
  ];
  events.forEach(([el, event, handler]) => {
    if (el) el.addEventListener(event, handler);
  });
  EventBus.on("appstate:changed", handlers.onStateChange);
}

function init() {
  if (isInitialized) return;
  SettingsView.init();
  renderAll();
  attachEvents();
  isInitialized = true;
}

export default {
  init
};
