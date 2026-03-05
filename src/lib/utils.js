const Utils = (function () {
  "use strict";

  function formatTimestamp(timestamp) {
    if (!timestamp) return "N/A";

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return I18n.t("time.now");
    if (diffHrs < 1) return I18n.t("time.minutes_ago", { n: diffMins });
    if (diffDays < 1) return I18n.t("time.hours_ago", { n: diffHrs });
    if (diffDays < 7) return I18n.t("time.days_ago", { n: diffDays });

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

    if (diffCalendarDays === 0) return I18n.t("time.today");
    if (diffCalendarDays === 1) return I18n.t("time.yesterday", { time: hhmm });

    return `${date.getDate()} ${date.toLocaleString(I18n.getLocale(), {
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

  function capitalizeFirstLetter(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function escapeShellArg(arg) {
    const str =
      typeof arg === "object" && arg !== null
        ? JSON.stringify(arg)
        : String(arg);
    return "'" + str.replace(/'/g, "'\\''") + "'";
  }

  return {
    formatTimestamp,
    sanitizeFolderName,
    capitalizeFirstLetter,
    debounce,
    escapeShellArg
  };
})();
