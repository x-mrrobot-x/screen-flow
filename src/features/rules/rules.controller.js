import RulesModel from "./rules.model.js";
import RulesView from "./rules.view.js";
import RuleDialogController from "./rule-dialog/rule-dialog.controller.js";
import EventBus from "../../core/platform/event-bus.js";
import ConfirmationDialog from "../../core/ui/confirmation-dialog.js";
import Toast from "../../core/ui/toast.js";
import I18n from "../../core/services/i18n.js";

let isInitialized = false;
let expandedId = null;
let suppressNextRender = false;

function renderUI() {
  const rules = RulesModel.getRules();
  RulesView.render.list(rules, expandedId);
  RulesView.update.counts(RulesModel.getCounts());
}

function handleToggleExpand(ruleId) {
  const wasExpanded = expandedId === ruleId;
  if (expandedId && expandedId !== ruleId) {
    RulesView.update.cardExpanded(expandedId, false);
  }
  expandedId = wasExpanded ? null : ruleId;
  RulesView.update.cardExpanded(ruleId, !wasExpanded);
}

function handleToggleEnabled(ruleId) {
  suppressNextRender = true;
  try {
    RulesModel.toggleRule(ruleId);
    const rule = RulesModel.getRuleById(ruleId);
    if (rule) RulesView.update.cardEnabled(rule);
    RulesView.update.counts(RulesModel.getCounts());
  } finally {
    suppressNextRender = false;
  }
}

function handleTest(rule) {
  Toast.info(I18n.t("rules.test_not_implemented", { name: rule.name }));
}

function handleEdit(rule) {
  RuleDialogController.open(rule);
}

function handleDelete(rule) {
  ConfirmationDialog.open(
    {
      title: I18n.t("rules.delete_title"),
      message: I18n.t("rules.delete_message", { name: rule.name })
    },
    () => {
      if (expandedId === rule.id) expandedId = null;
      RulesModel.deleteRule(rule.id);
      Toast.success(I18n.t("rules.delete_success"));
    }
  );
}

function handleSave(rule) {
  const isNew = !RulesModel.getRuleById(rule.id);
  RulesModel.upsertRule(rule);
  Toast.success(
    I18n.t(isNew ? "rules.create_success" : "rules.update_success")
  );
}

const handlers = {
  onAddClick: () => RuleDialogController.open(),

  onListClick: e => {
    const card = e.target.closest(".rule-card");
    if (!card) return;
    const ruleId = card.dataset.ruleId;
    const rule = RulesModel.getRuleById(ruleId);
    if (!rule) return;

    const toggleEl = e.target.closest("[data-action='toggleEnabled']");
    if (toggleEl) {
      e.stopPropagation();
      handleToggleEnabled(ruleId);
      return;
    }
    const testBtn = e.target.closest("[data-action='test']");
    if (testBtn) {
      handleTest(rule);
      return;
    }
    const editBtn = e.target.closest("[data-action='edit']");
    if (editBtn) {
      handleEdit(rule);
      return;
    }
    const deleteBtn = e.target.closest("[data-action='delete']");
    if (deleteBtn) {
      handleDelete(rule);
      return;
    }
    const main = e.target.closest("[data-action='toggleExpand']");
    if (main) handleToggleExpand(ruleId);
  },

  onStateChange: data => {
    if (data?.key === "rules" && !suppressNextRender) renderUI();
  }
};

function attachEvents() {
  const { addBtn, list } = RulesView.getElements();
  const events = [
    [addBtn, "click", handlers.onAddClick],
    [list, "click", handlers.onListClick]
  ];
  events.forEach(([el, event, handler]) => el.addEventListener(event, handler));

  EventBus.on("appstate:changed", handlers.onStateChange);
}

function setupRuleDialog() {
  RuleDialogController.setOnSave(handleSave);
  RuleDialogController.init();
}

function init() {
  if (isInitialized) return;
  RulesView.init();
  renderUI();
  attachEvents();
  setupRuleDialog();
  isInitialized = true;
}

export default {
  init
};
