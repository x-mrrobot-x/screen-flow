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
    typeof arg === "object" && arg !== null ? JSON.stringify(arg) : String(arg);
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

export default {
  sanitizeFolderName,
  capitalizeFirstLetter,
  debounce,
  escapeShellArg
};
