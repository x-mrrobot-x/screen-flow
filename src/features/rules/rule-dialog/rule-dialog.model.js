const LIST_FIELDS = ["aiCategories", "regexPatterns", "extensions"];

let draft = null;
let editingId = null;
let editingCreatedAt = null;

function generateId() {
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyDraft() {
  return {
    name: "",
    sourcePath: "",
    destinationPath: "",
    mode: "app",
    enabled: true,
    aiCategories: [],
    regexPatterns: [],
    extensions: []
  };
}

function cloneRule(rule) {
  return {
    name: rule.name ?? "",
    sourcePath: rule.sourcePath ?? "",
    destinationPath: rule.destinationPath ?? "",
    mode: rule.mode ?? "app",
    enabled: rule.enabled ?? true,
    aiCategories: [...(rule.aiCategories ?? [])],
    regexPatterns: [...(rule.regexPatterns ?? [])],
    extensions: [...(rule.extensions ?? [])]
  };
}

function openForCreate() {
  draft = createEmptyDraft();
  editingId = null;
  editingCreatedAt = null;
  return draft;
}

function openForEdit(rule) {
  draft = cloneRule(rule);
  editingId = rule.id;
  editingCreatedAt = rule.createdAt ?? null;
  return draft;
}

function getDraft() {
  return draft;
}

function isEditing() {
  return editingId !== null;
}

function setField(key, value) {
  if (!draft) return;
  draft[key] = value;
}

function setMode(mode) {
  if (!draft) return;
  draft.mode = mode;
}

function addListItem(listKey, rawValue) {
  if (!draft || !LIST_FIELDS.includes(listKey)) return false;
  const value = rawValue.trim();
  if (!value) return false;
  if (draft[listKey].some(item => item.toLowerCase() === value.toLowerCase()))
    return false;
  draft[listKey] = [...draft[listKey], value];
  return true;
}

function removeListItem(listKey, index) {
  if (!draft || !LIST_FIELDS.includes(listKey)) return;
  draft[listKey] = draft[listKey].filter((_, i) => i !== index);
}

function validate() {
  const errors = [];
  if (!draft?.name?.trim()) errors.push("name");
  if (!draft?.sourcePath?.trim()) errors.push("sourcePath");
  if (!draft?.destinationPath?.trim()) errors.push("destinationPath");
  return { valid: errors.length === 0, errors };
}

function buildRuleFromDraft() {
  return {
    id: editingId ?? generateId(),
    name: draft.name.trim(),
    sourcePath: draft.sourcePath.trim(),
    destinationPath: draft.destinationPath.trim(),
    mode: draft.mode,
    enabled: draft.enabled,
    aiCategories: [...draft.aiCategories],
    regexPatterns: [...draft.regexPatterns],
    extensions: [...draft.extensions],
    createdAt: editingId ? editingCreatedAt ?? Date.now() : Date.now()
  };
}

function clear() {
  draft = null;
  editingId = null;
  editingCreatedAt = null;
}

export default {
  openForCreate,
  openForEdit,
  getDraft,
  isEditing,
  setField,
  setMode,
  addListItem,
  removeListItem,
  validate,
  buildRuleFromDraft,
  clear
};
