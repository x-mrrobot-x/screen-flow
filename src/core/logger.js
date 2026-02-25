const Logger = (function () {
  "use strict";

  const LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  };

  let currentLevel = LEVELS.DEBUG;

  const CONSOLE_MAP = {
    [LEVELS.DEBUG]: console.log,
    [LEVELS.INFO]: console.info,
    [LEVELS.WARN]: console.warn,
    [LEVELS.ERROR]: console.error
  };

  const PREFIX_MAP = {
    [LEVELS.DEBUG]: "🐞 DEBUG",
    [LEVELS.INFO]: "ℹ️  INFO",
    [LEVELS.WARN]: "⚠️  WARN",
    [LEVELS.ERROR]: "🔥 ERROR"
  };

  function init(options = {}) {
    const levelName = options.level?.toUpperCase();
    if (levelName && LEVELS[levelName] !== undefined) {
      currentLevel = LEVELS[levelName];
      console.log(`Logger level set to: ${levelName}`);
    }
  }

  function log(level, message, ...args) {
    if (level < currentLevel) return;
    const consoleMethod = CONSOLE_MAP[level];
    if (!consoleMethod) return;
    const timestamp = `[${new Date().toISOString()}]`;
    const prefix = PREFIX_MAP[level];
    consoleMethod(`${timestamp} ${prefix}: ${message}`, ...args);
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

  return {
    init,
    debug,
    info,
    warn,
    error,
    LEVELS
  };
})();
