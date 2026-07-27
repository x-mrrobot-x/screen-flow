import DOM from "../../../lib/dom.js";
import Icons from "../../../core/ui/icons.js";
import I18n from "../../../core/services/i18n.js";

const MODES = ["app", "ai", "regex", "extension"];
const LIST_KEYS = {
  ai: "aiCategories",
  regex: "regexPatterns",
  extension: "extensions"
};

let elements = null;

function queryElements() {
  elements = {
    dialog: DOM.qs("#dialog-rule"),
    title: DOM.qs("#dialog-rule-title"),
    closeBtn: DOM.qs("#dialog-rule-close"),
    body: DOM.qs("#rule-dialog-body"),
    nameInput: DOM.qs("#rule-name-input"),
    sourceInput: DOM.qs("#rule-source-input"),
    destinationInput: DOM.qs("#rule-destination-input"),
    sourcePickBtn: DOM.qs("#rule-source-pick-btn"),
    destinationPickBtn: DOM.qs("#rule-destination-pick-btn"),
    modeGrid: DOM.qs("#rule-mode-grid"),
    cancelBtn: DOM.qs("#dialog-rule-cancel"),
    saveBtn: DOM.qs("#dialog-rule-save")
  };
}

function getElements() {
  return elements;
}

function getModeSection(mode) {
  return DOM.qs(`[data-mode-section="${mode}"]`, elements.body);
}

function getChipList(listKey) {
  return DOM.qs(`[data-chip-list="${listKey}"]`, elements.body);
}

function getChipInput(listKey) {
  return DOM.qs(`[data-chip-input="${listKey}"]`, elements.body);
}

const templates = {
  chip: (value, listKey, index) => `
    <span class="rule-chip">
      <span class="rule-chip-text">${value}</span>
      <button type="button" class="rule-chip-remove" data-action="removeChip" data-list="${listKey}" data-index="${index}" aria-label="Remover">
        ${Icons.getSvg("x")}
      </button>
    </span>`,

  chipList: (values, listKey) => {
    if (!values.length)
      return `<p class="rule-chip-empty">${I18n.t("rules.chip_list_empty")}</p>`;
    return values.map((v, i) => templates.chip(v, listKey, i)).join("");
  }
};

function setActiveMode(mode) {
  DOM.qsa("[data-mode]", elements.modeGrid).forEach(card => {
    card.classList.toggle("active", card.dataset.mode === mode);
  });
  MODES.forEach(m => {
    const section = getModeSection(m);
    if (section) section.style.display = m === mode ? "" : "none";
  });
}

function renderChipList(listKey, values) {
  const list = getChipList(listKey);
  if (list) list.innerHTML = templates.chipList(values, listKey);
}

function renderAllChipLists(draft) {
  Object.values(LIST_KEYS).forEach(listKey => {
    renderChipList(listKey, draft[listKey] ?? []);
  });
}

function setDialogMeta(isEditing) {
  elements.title.textContent = I18n.t(
    isEditing ? "rules.dialog_title_edit" : "rules.dialog_title_create"
  );
}

function open(draft, isEditing) {
  setDialogMeta(isEditing);
  elements.nameInput.value = draft.name;
  elements.sourceInput.value = draft.sourcePath;
  elements.destinationInput.value = draft.destinationPath;
  setActiveMode(draft.mode);
  renderAllChipLists(draft);
  Object.values(LIST_KEYS).forEach(listKey => {
    const input = getChipInput(listKey);
    if (input) input.value = "";
  });
}

const update = {
  mode: setActiveMode,
  chipList: renderChipList
};

function init() {
  queryElements();
}

export default {
  init,
  getElements,
  getChipInput,
  open,
  update,
  templates,
  LIST_KEYS
};
