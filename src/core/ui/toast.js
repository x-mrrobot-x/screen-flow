import DOM from "../../lib/dom.js";
import Icons from "./icons.js";

const ICON_MAP = {
  success: "circle-check-big",
  error: "shield-alert",
  warning: "circle-alert",
  info: "bell"
};

function resolveIcon(type) {
  return Icons.getSvg(ICON_MAP[type] ?? "bell");
}

function buildToastHTML(message, type) {
  return `
    ${resolveIcon(type)}
    <span>${message}</span>
  `;
}

function dismissToast(toast) {
  toast.classList.remove("show");
  setTimeout(() => toast.remove(), 300);
}

function clearToasts() {
  DOM.qsa(".toast-notification").forEach(t => t.remove());
}

function createToastElement(message, type) {
  const toast = DOM.create("div", {
    className: `toast-notification toast-${type}`
  });
  toast.innerHTML = buildToastHTML(message, type);
  return toast;
}

function animateIn(toast) {
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
}

function scheduleAutoDismiss(toast, duration) {
  setTimeout(() => dismissToast(toast), duration);
}

function mountToast(toast, duration) {
  animateIn(toast);
  toast.addEventListener("click", () => dismissToast(toast), { once: true });
  scheduleAutoDismiss(toast, duration);
}

function show(message, type = "success", duration = 3000) {
  clearToasts();
  const toast = createToastElement(message, type);
  mountToast(toast, duration);
}

function success(msg, duration) {
  return show(msg, "success", duration);
}

function error(msg, duration) {
  return show(msg, "error", duration);
}

function info(msg, duration) {
  return show(msg, "info", duration);
}

function warning(msg, duration) {
  return show(msg, "warning", duration);
}

export default {
  show,
  success,
  error,
  info,
  warning
};
