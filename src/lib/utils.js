const Utils = (function () {
  "use strict";

  function formatTimestamp(timestamp) {
    if (!timestamp) return "N/A";

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      if (diffMins < 1) return "Agora";
      return `${diffMins} min`;
    } else if (diffDays < 1) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays} dia${diffDays > 1 ? "s" : ""}`;
    } else {
      const date = new Date(timestamp);
      const today = new Date();

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        return `Hoje, ${date.getHours()}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      } else if (date.getDate() === today.getDate() - 1) {
        return `Ontem, ${date.getHours()}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      } else {
        return `${date.getDate()} ${date.toLocaleString("pt-BR", {
          month: "short"
        })}`;
      }
    }
  }

  function sanitizeFolderName(name) {
    if (typeof name !== "string") return "";
    return name
      .trim()
      .replace(/:/g, "-")
      .replace(/"/g, "")
      .replace(/\$/g, "")
      .replace(/`/g, "")
      .replace(/\\/g, "-");
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  return {
    formatTimestamp,
    sanitizeFolderName,
    debounce
  };
})();
