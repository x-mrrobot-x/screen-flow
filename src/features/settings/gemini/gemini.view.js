import DOM from "../../../lib/dom.js";
import Icons from "../../../core/ui/icons.js";
import I18n from "../../../core/services/i18n.js";
import { FALLBACK_MODELS } from "../../../lib/gemini.js";

let elements = null;

function queryElements() {
  elements = {
    dialog: DOM.qs("#dialog-gemini-config"),
    modelSelect: DOM.qs("#gemini-model-input"),
    keysList: DOM.qs("#gemini-apikeys-list"),
    addKeyBtn: DOM.qs("#gemini-add-key-btn"),
    addKeyRow: DOM.qs("#gemini-add-key-row"),
    newKeyInput: DOM.qs("#gemini-new-key-input"),
    confirmKeyBtn: DOM.qs("#gemini-add-key-confirm"),
    saveBtn: DOM.qs("#dialog-gemini-save"),
    cancelBtn: DOM.qs("#dialog-gemini-cancel"),
    closeBtn: DOM.qs("#dialog-gemini-close")
  };
}

function getElements() {
  return elements;
}

function getNewKeyValue() {
  return elements.newKeyInput.value.trim() || "";
}

function getSelectedModel() {
  return elements.modelSelect.value || FALLBACK_MODELS[0];
}

const helpers = {
  maskKey(key) {
    if (key.length <= 8) return "•".repeat(key.length);
    return key.slice(0, 4) + "•".repeat(8) + key.slice(-4);
  }
};

const templates = {
  keyItem: (key, i) => `
    <div class="gemini-key-item" data-index="${i}">
      <span class="gemini-key-value">${helpers.maskKey(key)}</span>
      <button class="gemini-key-remove tap-scale" data-index="${i}" aria-label="Remover">
        ${Icons.getSvg("x")}
      </button>
    </div>
  `,

  noKeys: () => `<p class="gemini-no-keys">${I18n.t("gemini.no_keys")}</p>`,

  modelOption: (model, currentModel) =>
    `<option value="${model}"${
      model === currentModel ? " selected" : ""
    }>${model}</option>`
};

const render = {
  keysList(keys) {
    elements.keysList.innerHTML = keys.length
      ? keys.map((key, i) => templates.keyItem(key, i)).join("")
      : templates.noKeys();
  },

  modelSelect(currentModel) {
    elements.modelSelect.innerHTML = FALLBACK_MODELS.map(m =>
      templates.modelOption(m, currentModel)
    ).join("");
  }
};

const update = {
  showAddKeyRow() {
    elements.addKeyRow.style.display = "flex";
    elements.addKeyBtn.style.display = "none";
    elements.newKeyInput.focus();
  },

  hideAddKeyRow() {
    elements.addKeyRow.style.display = "none";
    elements.addKeyBtn.style.display = "";
    elements.newKeyInput.value = "";
  }
};

function init() {
  queryElements();
}

export default {
  init,
  getElements,
  getNewKeyValue,
  getSelectedModel,
  render,
  update
};
