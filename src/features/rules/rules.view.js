import DOM from "../../lib/dom.js";
import Icons from "../../core/ui/icons.js";
import I18n from "../../core/services/i18n.js";

const MODE_META = {
  app: { icon: "layer-group", color: "icon-blue", labelKey: "rules.mode_app" },
  ai: { icon: "wand-magic-sparkles", color: "icon-ai", labelKey: "rules.mode_ai" },
  regex: { icon: "braces", color: "icon-violet", labelKey: "rules.mode_regex" },
  extension: { icon: "file", color: "icon-teal", labelKey: "rules.mode_extension" }
};

let elements = null;

function queryElements() {
  elements = {
    tabContent: DOM.qs("#tab-rules"),
    overview: DOM.qs("#rules-overview"),
    statTotal: DOM.qs("#rules-stat-total"),
    statActive: DOM.qs("#rules-stat-active"),
    addBtn: DOM.qs("#rules-add-btn"),
    list: DOM.qs("#rules-list")
  };
}

function getElements() {
  return elements;
}

function getModeMeta(mode) {
  return MODE_META[mode] ?? MODE_META.app;
}

const templates = {
  modeChip: mode => {
    const meta = getModeMeta(mode);
    return `<span class="rule-mode-chip ${meta.color}">${Icons.getSvg(
      meta.icon
    )}<span>${I18n.t(meta.labelKey)}</span></span>`;
  },

  detailRow: (icon, label, valueHtml) => `
    <div class="rule-detail-row">
      <div class="rule-detail-icon">${Icons.getSvg(icon)}</div>
      <div class="rule-detail-content">
        <span class="rule-detail-label">${label}</span>
        ${valueHtml}
      </div>
    </div>`,

  chipGroup: values =>
    values.length
      ? `<div class="rule-chip-list">${values
          .map(v => `<span class="rule-chip rule-chip--readonly">${v}</span>`)
          .join("")}</div>`
      : `<p class="rule-detail-empty">${I18n.t("rules.no_params")}</p>`,

  modeParamsRow: rule => {
    if (rule.mode === "ai")
      return templates.detailRow(
        "wand-magic-sparkles",
        I18n.t("rules.field_ai_categories"),
        templates.chipGroup(rule.aiCategories ?? [])
      );
    if (rule.mode === "regex")
      return templates.detailRow(
        "braces",
        I18n.t("rules.field_regex"),
        templates.chipGroup(rule.regexPatterns ?? [])
      );
    if (rule.mode === "extension")
      return templates.detailRow(
        "file-type",
        I18n.t("rules.field_extension"),
        templates.chipGroup(rule.extensions ?? [])
      );
    return templates.detailRow(
      "layer-group",
      I18n.t("rules.field_mode"),
      `<p class="rule-detail-value rule-detail-value--plain">${I18n.t(
        "rules.mode_app"
      )}</p>`
    );
  },

  ruleCard: (rule, index, isExpanded) => {
    const meta = getModeMeta(rule.mode);
    const disabledClass = rule.enabled ? "" : "is-disabled";
    const expandedClass = isExpanded ? "is-expanded" : "";
    const toggleLabel = rule.enabled
      ? I18n.t("rules.action_disable")
      : I18n.t("rules.action_enable");

    return `<article class="rule-card card animate-scale-in ${disabledClass} ${expandedClass}" style="animation-delay: ${
      0.05 + index * 0.04
    }s" data-rule-id="${rule.id}">
      <div class="rule-card-main" data-action="toggleExpand">
        <div class="rule-mode-icon ${meta.color}">${Icons.getSvg(meta.icon)}</div>
        <div class="rule-card-info">
          <div class="rule-card-title-row">
            <h3 class="rule-card-name truncate-text">${rule.name}</h3>
            ${templates.modeChip(rule.mode)}
          </div>
          <div class="rule-card-path-row">
            <span class="rule-path truncate-text">${rule.sourcePath}</span>
            <span class="rule-path-arrow">${Icons.getSvg("arrow-right")}</span>
            <span class="rule-path truncate-text">${rule.destinationPath}</span>
          </div>
        </div>
        <div class="rule-card-controls">
          <input type="checkbox" class="switch-md" data-action="toggleEnabled" ${
            rule.enabled ? "checked" : ""
          } aria-label="${I18n.t("rules.toggle_aria_label")}" />
          <span class="rule-card-chevron">${Icons.getSvg("chevron-down")}</span>
        </div>
      </div>
      <div class="rule-card-details">
        <div class="rule-card-details-inner">
          <div class="rule-card-details-content">
            ${templates.detailRow(
              "folder-open",
              I18n.t("rules.field_source"),
              `<p class="rule-detail-value">${rule.sourcePath}</p>`
            )}
            ${templates.detailRow(
              "folder-output",
              I18n.t("rules.field_destination"),
              `<p class="rule-detail-value">${rule.destinationPath}</p>`
            )}
            ${templates.modeParamsRow(rule)}
            <div class="rule-card-actions">
              <button type="button" class="rule-action-btn" data-action="test">
                ${Icons.getSvg("play")}<span>${I18n.t("rules.action_test")}</span>
              </button>
              <button type="button" class="rule-action-btn" data-action="edit">
                ${Icons.getSvg("pencil")}<span>${I18n.t("rules.action_edit")}</span>
              </button>
              <button type="button" class="rule-action-btn rule-action-btn--danger" data-action="delete">
                ${Icons.getSvg("trash")}<span>${I18n.t("rules.action_delete")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>`;
  },

  emptyState: () => `
    <div class="folder-empty-state animate-fade-in" style="animation-delay: 0.1s">
      <div class="folder-empty-icon-wrapper">${Icons.getSvg("braces")}</div>
      <p class="folder-empty-title">${I18n.t("rules.empty_title")}</p>
      <p class="folder-empty-subtitle">${I18n.t("rules.empty_subtitle")}</p>
    </div>`
};

const render = {
  list: (rules, expandedId) => {
    if (!rules.length) {
      elements.list.innerHTML = templates.emptyState();
      return;
    }
    elements.list.innerHTML = rules
      .map((rule, i) => templates.ruleCard(rule, i, rule.id === expandedId))
      .join("");
  }
};

const update = {
  counts: ({ total, active }) => {
    elements.statTotal.textContent = total;
    elements.statActive.textContent = active;
  },

  cardExpanded: (ruleId, isExpanded) => {
    const card = DOM.qs(`[data-rule-id="${ruleId}"]`, elements.list);
    if (card) card.classList.toggle("is-expanded", isExpanded);
  },

  cardEnabled: rule => {
    const card = DOM.qs(`[data-rule-id="${rule.id}"]`, elements.list);
    if (!card) return;
    card.classList.toggle("is-disabled", !rule.enabled);

    const checkbox = DOM.qs('input[data-action="toggleEnabled"]', card);
    if (checkbox) checkbox.checked = rule.enabled;

    const toggleBtn = DOM.qs('button[data-action="toggleEnabled"] span', card);
    if (toggleBtn) {
      toggleBtn.textContent = I18n.t(
        rule.enabled ? "rules.action_disable" : "rules.action_enable"
      );
    }
  }
};

function init() {
  queryElements();
}

export default {
  init,
  getElements,
  templates,
  render,
  update
};
