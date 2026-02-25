const Toast = (() => {
  "use strict";

  const ICON_MAP = {
    success: "circle-check-big",
    error: "shield-alert",
    warning: "circle-alert",
    info: "bell"
  };

  function dismissToast(toast) {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }

  function show(message, type = "success", duration = 3000) {
    DOM.qsa(".toast-notification").forEach(t => t.remove());

    const toast = DOM.create("div", {
      className: `toast-notification toast-${type}`
    });

    toast.innerHTML = `
      ${Icons.getSvg(ICON_MAP[type] ?? "notification-icon")}
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    toast.addEventListener("click", () => dismissToast(toast), { once: true });
    setTimeout(() => dismissToast(toast), duration);
  }

  return {
    show,
    success: (msg, duration) => show(msg, "success", duration),
    error: (msg, duration) => show(msg, "error", duration),
    info: (msg, duration) => show(msg, "info", duration),
    warning: (msg, duration) => show(msg, "warning", duration)
  };
})();
