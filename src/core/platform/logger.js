const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

let currentLevel = LEVELS.DEBUG;

const PREFIX_MAP = {
  [LEVELS.DEBUG]: "🐞 DEBUG",
  [LEVELS.INFO]: "ℹ️  INFO",
  [LEVELS.WARN]: "⚠️  WARN",
  [LEVELS.ERROR]: "🔥 ERROR"
};

const METHOD_MAP = {
  [LEVELS.DEBUG]: "log",
  [LEVELS.INFO]: "info",
  [LEVELS.WARN]: "warn",
  [LEVELS.ERROR]: "error"
};

function init({ level } = {}) {
  const levelName = level?.toUpperCase();
  if (levelName && LEVELS[levelName] !== undefined) {
    currentLevel = LEVELS[levelName];
    console.log(`Logger level set to: ${levelName}`);
  }
}

function log(level, message, ...args) {
  if (level < currentLevel) return;

  const methodName = METHOD_MAP[level];
  if (!methodName || !console[methodName]) return;

  const timestamp = `[${new Date().toISOString()}]`;
  console[methodName](`${timestamp} ${PREFIX_MAP[level]}: ${message}`, ...args);
}

function debug(message, ...args) {
  log(LEVELS.DEBUG, message, ...args);
}

function info(message, ...args) {
  log(LEVELS.INFO, message, ...args);
}

function warn(message, ...args) {
  log(LEVELS.WARN, message, ...args);
}

function error(message, ...args) {
  log(LEVELS.ERROR, message, ...args);
}

export default {
  init,
  debug,
  info,
  warn,
  error,
  LEVELS
};
