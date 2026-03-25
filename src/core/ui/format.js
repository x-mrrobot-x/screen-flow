import I18n from "../services/i18n.js";

function diffComponents(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  return { diffMins, diffHrs, diffDays };
}

function formatHHMM(date) {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calendarDaysDiff(timestamp) {
  const diffMs = toMidnight(new Date()) - toMidnight(new Date(timestamp));
  return Math.round(diffMs / 86_400_000);
}

function formatAbsoluteDate(timestamp) {
  const date = new Date(timestamp);
  const calendarDays = calendarDaysDiff(timestamp);
  const hhmm = formatHHMM(date);

  if (calendarDays === 0) return I18n.t("time.today");
  if (calendarDays === 1) return I18n.t("time.yesterday", { time: hhmm });
  return `${date.getDate()} ${date.toLocaleString(I18n.getLocale(), {
    month: "short"
  })}`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "N/A";

  const { diffMins, diffHrs, diffDays } = diffComponents(timestamp);

  if (diffMins < 1) return I18n.t("time.now");
  if (diffHrs < 1) return I18n.t("time.minutes_ago", { n: diffMins });
  if (diffDays < 1) return I18n.t("time.hours_ago", { n: diffHrs });
  if (diffDays < 7) return I18n.t("time.days_ago", { n: diffDays });

  return formatAbsoluteDate(timestamp);
}

function buildCleanupText(count) {
  return I18n.t("process.cleanup_done", {
    count,
    file: I18n.t("common.files", { n: count }),
    removed: I18n.t("common.removed", { n: count })
  });
}

function buildOrganizerNotification(ssStats, srStats) {
  const ss = ssStats?.moved || 0;
  const sr = srStats?.moved || 0;
  if (ss > 0 && sr === 0)
    return I18n.t("process.notify_screenshots_done", { count: ss });
  if (sr > 0 && ss === 0)
    return I18n.t("process.notify_recordings_done", { count: sr });
  return I18n.t("process.notify_organizer_combined", { ss, sr });
}

function buildCompletionText(processType, stats) {
  if (processType === "organize_screenshots")
    return I18n.t("process.notify_screenshots_done", {
      count: stats.moved || 0
    });
  if (processType === "organize_recordings")
    return I18n.t("process.notify_recordings_done", {
      count: stats.moved || 0
    });
  if (processType === "cleanup_old_files")
    return buildCleanupText(stats.total_removed || 0);
  return I18n.t("process.finished");
}

export default {
  formatTimestamp,
  buildCompletionText,
  buildOrganizerNotification
};
