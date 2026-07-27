import RuleDialogModel from "./rule-dialog.model.js";
import RuleDialogView from "./rule-dialog.view.js";
import History from "../../../core/ui/history.js";
import TaskQueue from "../../../core/platform/task-queue.js";
import I18n from "../../../core/services/i18n.js";
import Toast from "../../../core/ui/toast.js";
import Logger from "../../../core/platform/logger.js";

let onSaveCallback = null;

function setOnSave(fn) {
  onSaveCallback = fn;
}

function close() {
  History.goBack();
}

function handleClose() {
  close();
  RuleDialogModel.clear();
}

function open(rule = null) {
  const draft = rule
    ? RuleDialogModel.openForEdit(rule)
    : RuleDialogModel.openForCreate();
  RuleDialogView.open(draft, RuleDialogModel.isEditing());
  History.pushDialog(RuleDialogView.getElements().dialog, () =>
    RuleDialogModel.clear()
  );
}

function addChipFromInput(listKey) {
  const input = RuleDialogView.getChipInput(listKey);
  if (!input) return;
  const added = RuleDialogModel.addListItem(listKey, input.value);
  if (!added) return;
  input.value = "";
  RuleDialogView.update.chipList(listKey, RuleDialogModel.getDraft()[listKey]);
}

function removeChip(listKey, index) {
  RuleDialogModel.removeListItem(listKey, index);
  RuleDialogView.update.chipList(listKey, RuleDialogModel.getDraft()[listKey]);
}

const handlers = {
  onClose: handleClose,
  onCancel: handleClose,

  onNameInput: e => RuleDialogModel.setField("name", e.target.value),
  onSourceInput: e => RuleDialogModel.setField("sourcePath", e.target.value),
  onDestinationInput: e =>
    RuleDialogModel.setField("destinationPath", e.target.value),

  onSourcePick: async () => {
    try {
      const result = await TaskQueue.add("select_directory", [], "default");
      const path = result?.path ?? null;
      if (!path) return;
      RuleDialogModel.setField("sourcePath", path);
      RuleDialogView.getElements().sourceInput.value = path;
    } catch (error) {
      Logger.error("[RuleDialog] Failed to select source directory:", error);
      Toast.error(I18n.t("rules.pick_folder_error"));
    }
  },

  onDestinationPick: async () => {
    try {
      const result = await TaskQueue.add("select_directory", [], "default");
      const path = result?.path ?? null;
      if (!path) return;
      RuleDialogModel.setField("destinationPath", path);
      RuleDialogView.getElements().destinationInput.value = path;
    } catch (error) {
      Logger.error(
        "[RuleDialog] Failed to select destination directory:",
        error
      );
      Toast.error(I18n.t("rules.pick_folder_error"));
    }
  },

  onModeGridClick: e => {
    const card = e.target.closest("[data-mode]");
    if (!card) return;
    RuleDialogModel.setMode(card.dataset.mode);
    RuleDialogView.update.mode(card.dataset.mode);
  },

  onBodyClick: e => {
    const addBtn = e.target.closest("[data-action='addChip']");
    if (addBtn) {
      addChipFromInput(addBtn.dataset.list);
      return;
    }
    const removeBtn = e.target.closest("[data-action='removeChip']");
    if (removeBtn) {
      removeChip(removeBtn.dataset.list, parseInt(removeBtn.dataset.index, 10));
    }
  },

  onBodyKeydown: e => {
    const input = e.target.closest("[data-chip-input]");
    if (!input || e.key !== "Enter") return;
    e.preventDefault();
    addChipFromInput(input.dataset.chipInput);
  },

  onSave: () => {
    const { valid } = RuleDialogModel.validate();
    if (!valid) {
      Toast.error(I18n.t("rules.validation_error"));
      return;
    }
    const rule = RuleDialogModel.buildRuleFromDraft();
    onSaveCallback?.(rule);
    handleClose();
  }
};

function attachEvents() {
  const {
    closeBtn,
    cancelBtn,
    saveBtn,
    nameInput,
    sourceInput,
    destinationInput,
    sourcePickBtn,
    destinationPickBtn,
    modeGrid,
    body
  } = RuleDialogView.getElements();

  const events = [
    [closeBtn, "click", handlers.onClose],
    [cancelBtn, "click", handlers.onCancel],
    [saveBtn, "click", handlers.onSave],
    [nameInput, "input", handlers.onNameInput],
    [sourceInput, "input", handlers.onSourceInput],
    [destinationInput, "input", handlers.onDestinationInput],
    [sourcePickBtn, "click", handlers.onSourcePick],
    [destinationPickBtn, "click", handlers.onDestinationPick],
    [modeGrid, "click", handlers.onModeGridClick],
    [body, "click", handlers.onBodyClick],
    [body, "keydown", handlers.onBodyKeydown]
  ];
  events.forEach(([el, event, handler]) => {
    if (el) el.addEventListener(event, handler);
  });
}

function init() {
  RuleDialogView.init();
  attachEvents();
}

export default {
  init,
  open,
  setOnSave
};
