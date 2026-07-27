import AppState from "../../core/state/app-state.js";

function getRules() {
  return AppState.getRules();
}

function getRuleById(id) {
  return AppState.getRules().find(rule => rule.id === id) ?? null;
}

function upsertRule(rule) {
  const rules = AppState.getRules();
  const index = rules.findIndex(r => r.id === rule.id);
  const updated =
    index === -1
      ? [...rules, rule]
      : rules.map((r, i) => (i === index ? rule : r));
  AppState.setRules(updated);
}

function deleteRule(id) {
  const rules = AppState.getRules().filter(rule => rule.id !== id);
  AppState.setRules(rules);
}

function toggleRule(id) {
  const rules = AppState.getRules();
  const updated = rules.map(rule =>
    rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
  );
  AppState.setRules(updated);
  return updated.find(rule => rule.id === id)?.enabled ?? false;
}

function getCounts() {
  const rules = AppState.getRules();
  return {
    total: rules.length,
    active: rules.filter(rule => rule.enabled).length
  };
}

export default {
  getRules,
  getRuleById,
  upsertRule,
  deleteRule,
  toggleRule,
  getCounts
};
