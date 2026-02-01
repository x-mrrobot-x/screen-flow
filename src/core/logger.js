const Logger = (function() {
    'use strict';

    const LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        USER: 4, // User-facing messages
        NONE: 5
    };

    const config = {
        level: LEVELS.DEBUG, // Default level
    };

    const consoleMap = {
        [LEVELS.DEBUG]: console.log,
        [LEVELS.INFO]: console.info,
        [LEVELS.WARN]: console.warn,
        [LEVELS.ERROR]: console.error,
    };
    
    const prefixMap = {
        [LEVELS.DEBUG]: '🐞 DEBUG',
        [LEVELS.INFO]: 'ℹ️ INFO',
        [LEVELS.WARN]: '⚠️ WARN',
        [LEVELS.ERROR]: '🔥 ERROR',
    };

    function init(options = {}) {
        const newLevel = options.level;
        if (newLevel !== undefined && LEVELS[newLevel.toUpperCase()] !== undefined) {
            config.level = LEVELS[newLevel.toUpperCase()];
            console.log(`Logger level set to: ${newLevel.toUpperCase()}`);
        }
    }

    function log(level, message, typeOrArgs, ...args) {
        if (level < config.level) {
            return;
        }

        if (level === LEVELS.USER) {
            const type = typeof typeOrArgs === 'string' ? typeOrArgs : 'info';
            Toast.show(message, type);
            return;
        }

        const consoleMethod = consoleMap[level];
        if (consoleMethod) {
            const prefix = prefixMap[level];
            const timestamp = `[${new Date().toISOString()}]`;
            
            // If typeOrArgs was passed and it's not the toast type
            const allArgs = typeOrArgs ? [typeOrArgs, ...args] : args;
            consoleMethod(`${timestamp} ${prefix}: ${message}`, ...allArgs);
        }
    }

    function debug(message, ...args) {
        log(LEVELS.DEBUG, message, null, ...args);
    }

    function info(message, ...args) {
        log(LEVELS.INFO, message, null, ...args);
    }

    function warn(message, ...args) {
        log(LEVELS.WARN, message, null, ...args);
    }

    function error(message, ...args) {
        log(LEVELS.ERROR, message, null, ...args);
    }

    function user(message, type = 'info') {
        // We pass the type in the 'typeOrArgs' position
        log(LEVELS.USER, message, type);
    }

    return {
        init,
        debug,
        info,
        warn,
        error,
        user,
        LEVELS
    };
})();
