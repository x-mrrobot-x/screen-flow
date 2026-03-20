import GeminiModel from "./gemini.model.js";
import GeminiView from "./gemini.view.js";
import DialogStack from "../../../core/ui/dialog-stack.js";
import Toast from "../../../core/ui/toast.js";
import I18n from "../../../core/services/i18n.js";
import { FALLBACK_MODELS } from "../../../lib/gemini.js";

let geminiKeys = [];

function loadState() {
  const gemini = GeminiModel.getSetting();
  geminiKeys = [...(gemini.apiKeys || [])];
  return gemini;
}

function setupView(gemini) {
  const currentModel = gemini.model || FALLBACK_MODELS[0];
  GeminiView.render.modelSelect(currentModel);
  GeminiView.render.keysList(geminiKeys);
  GeminiView.update.hideAddKeyRow();
}

function open() {
  const gemini = loadState();
  setupView(gemini);
  const { dialog } = GeminiView.getElements();
  DialogStack.push(dialog);
}

function save() {
  const model = GeminiView.getSelectedModel();
  GeminiModel.saveSetting(model, geminiKeys);
  DialogStack.goBack();
  Toast.success(I18n.t("gemini.saved"));
}

function showAddKeyRow() {
  GeminiView.update.showAddKeyRow();
}

function confirmAddKey() {
  const key = GeminiView.getNewKeyValue();
  if (!key) return;
  geminiKeys.push(key);
  GeminiView.render.keysList(geminiKeys);
  GeminiView.update.hideAddKeyRow();
}

function removeKey(index) {
  geminiKeys.splice(index, 1);
  GeminiView.render.keysList(geminiKeys);
}

const handlers = {
  onSave: () => save(),
  onCancel: () => DialogStack.goBack(),
  onAddKeyClick: () => showAddKeyRow(),
  onConfirmAddKey: () => confirmAddKey(),
  onNewKeyEnter: e => {
    if (e.key === "Enter") confirmAddKey();
  },
  onKeysListClick: e => {
    const btn = e.target.closest(".gemini-key-remove");
    if (btn) removeKey(parseInt(btn.dataset.index, 10));
  }
};

function attachEvents() {
  const {
    saveBtn,
    cancelBtn,
    closeBtn,
    addKeyBtn,
    confirmKeyBtn,
    newKeyInput,
    keysList
  } = GeminiView.getElements();

  const events = [
    [saveBtn, "click", handlers.onSave],
    [cancelBtn, "click", handlers.onCancel],
    [closeBtn, "click", handlers.onCancel],
    [addKeyBtn, "click", handlers.onAddKeyClick],
    [confirmKeyBtn, "click", handlers.onConfirmAddKey],
    [newKeyInput, "keydown", handlers.onNewKeyEnter],
    [keysList, "click", handlers.onKeysListClick]
  ];
  events.forEach(([el, event, handler]) => el.addEventListener(event, handler));
}

function init() {
  GeminiView.init();
  attachEvents();
}

export default {
  init,
  open
};
