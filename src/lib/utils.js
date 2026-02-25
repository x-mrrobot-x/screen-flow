const Utils = (function () {
  "use strict";

  function formatTimestamp(timestamp) {
    if (!timestamp) return "N/A";

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return "Agora";
    if (diffHrs < 1) return `${diffMins} min`;
    if (diffDays < 1) return `${diffHrs}h`;
    if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? "s" : ""}`;

    const date = new Date(timestamp);
    const today = new Date();
    const hhmm = `${date.getHours()}:${String(date.getMinutes()).padStart(
      2,
      "0"
    )}`;

    const dateDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const diffCalendarDays = Math.round((todayDay - dateDay) / 86_400_000);

    if (diffCalendarDays === 0) return `Hoje, ${hhmm}`;
    if (diffCalendarDays === 1) return `Ontem, ${hhmm}`;

    return `${date.getDate()} ${date.toLocaleString("pt-BR", {
      month: "short"
    })}`;
  }

  const UNSAFE_FOLDER_CHARS = /[:"$`\\]/g;

  function sanitizeFolderName(name) {
    if (typeof name !== "string") return "";
    return name
      .trim()
      .replace(UNSAFE_FOLDER_CHARS, match =>
        match === ":" || match === "\\" ? "-" : ""
      );
  }

  function pluralize(n, word, returnCount = true) {
    if (returnCount) {
      return `${n} ${word}${n === 1 ? "" : "s"}`;
    }
    return `${word}${n === 1 ? "" : "s"}`;
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  return {
    formatTimestamp,
    sanitizeFolderName,
    pluralize,
    debounce
  };
})();
