const Toast = (() => {
  'use strict';
  function showToast(message, type = "success", duration = 3000) {
    const existingToasts = DOM.qsa(".toast-notification");
    existingToasts.forEach(toast => toast.remove());

    const toast = DOM.create("div", {
      className: `toast-notification toast-${type}`
    });

    toast.innerHTML = `
      ${Icons.getIcon(
        type === "success"
          ? "check-icon"
          : type === "error"
          ? "warning-icon"
          : type === "warning"
          ? "warning-icon"
          : "notification-icon"
      )}
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    toast.addEventListener('click', () => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toast.remove();
        }
      }, 300);
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toast.remove();
        }
      }, 300);
    }, duration);
  }

  function showSuccess(message, duration) {
    showToast(message, "success", duration);
  }

  function showError(message, duration) {
    showToast(message, "error", duration);
  }

  function showInfo(message, duration) {
    showToast(message, "info", duration);
  }

  function showWarning(message, duration) {
    showToast(message, "warning", duration);
  }

  return {
    show: showToast,
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning
  };
})();