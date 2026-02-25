const ENV = (() => {
  "use strict";

  const isWeb = typeof tk === "undefined";

  const STORAGE_CONFIG = {
    FOLDERS: {
      web: {
        type: "localStorage",
        key: "folders",
        default: []
      },
      tasker: {
        type: "file",
        path: "src/data/folders.json",
        default: []
      }
    },
    SETTINGS: {
      web: {
        type: "localStorage",
        key: "settings",
        default: DEFAULT_SETTINGS
      },
      tasker: {
        type: "file",
        path: "src/data/settings.json",
        default: DEFAULT_SETTINGS
      }
    },
    STATS: {
      web: {
        type: "localStorage",
        key: "stats",
        default: DEFAULT_STATS
      },
      tasker: {
        type: "file",
        path: "src/data/stats.json",
        default: DEFAULT_STATS
      }
    },
    ACTIVITIES: {
      web: {
        type: "localStorage",
        key: "activities",
        default: []
      },
      tasker: {
        type: "file",
        path: "src/data/activities.json",
        default: []
      }
    },
    TRANSLATIONS: {
      web: {
        type: "fetch",
        pathTemplate: "i18n/{lang}.json",
        default: DEFAULT_TRANSLATIONS
      },
      tasker: {
        type: "file",
        pathTemplate: "i18n/{lang}.json",
        default: {}
      }
    },
    APPS: {
      web: {
        type: "localStorage",
        key: "apps",
        default: []
      },
      tasker: {
        type: "file",
        path: "src/data/apps.json",
        default: []
      }
    }
  };

  function resolvePath(pathTemplate, params = {}) {
    return pathTemplate.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? _);
  }

  function getDefault(key) {
    const cfg = STORAGE_CONFIG[key];
    const envCfg = isWeb ? cfg.web : cfg.tasker;
    return JSON.parse(JSON.stringify(envCfg.default));
  }

  function WebEnvironment() {
    const STORAGE_PREFIX = "@screenflow:";

    const PATHS = {
      SOURCE_SCREENSHOTS_PATH: "/storage/emulated/0/DCIM/Screenshots",
      SOURCE_RECORDINGS_PATH: "/storage/emulated/0/DCIM/ScreenRecorder",
      ORGANIZED_SCREENSHOTS_PATH:
        "/storage/emulated/0/OrganizedMedia/Screenshots",
      ORGANIZED_RECORDINGS_PATH:
        "/storage/emulated/0/OrganizedMedia/ScreenRecordings"
    };

    function resolveIconPath(pkg) {
      return `src/assets/icons/${pkg}.png`;
    }

    function getFilePath() {
      return "";
    }

    async function getData(key, params = {}) {
      try {
        const cfg = STORAGE_CONFIG[key].web;

        if (cfg.type === "localStorage") {
          const raw = localStorage.getItem(STORAGE_PREFIX + cfg.key);
          return raw ? JSON.parse(raw) : getDefault(key);
        }

        if (cfg.type === "fetch") {
          const path = resolvePath(cfg.pathTemplate, params);
          const res = await fetch(path);
          if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
          return await res.json();
        }
      } catch (e) {
        Logger.error(`Error getting ${key}:`, e);
        return getDefault(key);
      }
    }

    function setData(key, data) {
      try {
        const cfg = STORAGE_CONFIG[key].web;
        if (cfg.type === "fetch")
          throw new Error(`Cannot write to ${key} (fetch type)`);
        localStorage.setItem(STORAGE_PREFIX + cfg.key, JSON.stringify(data));
        return true;
      } catch (e) {
        Logger.error(`Error saving ${key}:`, e);
        return false;
      }
    }

    async function runTask(taskName, priority, ...params) {
      if (taskName === "SO - FILE QUEUE WORKER") {
        let taskerParams;
        try {
          taskerParams = JSON.parse(params[0]);
        } catch (e) {
          Logger.error("[WEB ENV] Failed to parse taskerParams:", e);
          return;
        }

        const {
          id,
          commandName,
          action,
          params: taskParams,
          type
        } = taskerParams;
        const realCommand = commandName || action;

        (async () => {
          try {
            const payload = await MockEnv.processTask(
              realCommand,
              taskParams,
              type
            );
            App.handleTaskResult(
              JSON.stringify({
                id,
                status: "success",
                payload
              })
            );
          } catch (error) {
            Logger.error(
              `[WEB ENV] Error processing task "${realCommand}":`,
              error
            );
            App.handleTaskResult(
              JSON.stringify({
                id,
                status: "error",
                payload: String(error)
              })
            );
          }
        })();
      }
    }

    function isTaskRunning() {
      return true;
    }

    return {
      WORK_DIR: "",
      isWeb: true,
      resolveIconPath,
      getData,
      getDefault,
      setData,
      runTask,
      isTaskRunning,
      getFilePath,
      ...PATHS
    };
  }

  function TaskerEnvironment() {
    const PATHS = {
      SOURCE_SCREENSHOTS_PATH: "/storage/emulated/0/DCIM/Screenshots",
      SOURCE_RECORDINGS_PATH: "/storage/emulated/0/DCIM/ScreenRecorder",
      ORGANIZED_SCREENSHOTS_PATH:
        "/storage/emulated/0/OrganizedMedia/Screenshots",
      ORGANIZED_RECORDINGS_PATH:
        "/storage/emulated/0/OrganizedMedia/ScreenRecordings"
    };

    const WORK_DIR = `${tk.local("%work_dir")}/`;

    function resolveIconPath(pkg) {
      return `content://net.dinglisch.android.taskerm.iconprovider//app/${pkg}`;
    }

    function getFilePath(key, params = {}) {
      const cfg = STORAGE_CONFIG[key].tasker;
      const relative = cfg.pathTemplate
        ? resolvePath(cfg.pathTemplate, params)
        : cfg.path;
      return `${WORK_DIR}${relative}`;
    }

    async function execute({ command, args = [] }) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const scriptPath = `${WORK_DIR}src/features/dashboard/process/script.sh`;
          const quotedArgs = args
            .map(arg => {
              const str =
                typeof arg === "object" && arg !== null
                  ? JSON.stringify(arg)
                  : String(arg);
              return "'" + str.replace(/'/g, "'\\''") + "'";
            })
            .join(" ");

          try {
            const result = tk.shell(
              `sh "${scriptPath}" ${command} ${quotedArgs}`,
              false,
              5000
            );
            if (!result?.trim())
              throw new Error("Shell returned empty result.");
            const parsed = JSON.parse(result);
            if (parsed.success) resolve(parsed.data);
            else throw new Error(parsed.error || "Unknown shell error.");
          } catch (e) {
            Logger.error(`Error executing '${command}':`, e);
            reject(new Error(`Failed to execute '${command}': ${e.message}`));
          }
        }, 0);
      });
    }

    async function getData(key, params = {}) {
      try {
        return await execute({
          command: "read_file",
          args: [getFilePath(key, params), JSON.stringify(getDefault(key))]
        });
      } catch (e) {
        Logger.error(`Error getting ${key}:`, e);
        return getDefault(key);
      }
    }

    async function setData(key, data, params = {}) {
      try {
        await execute({
          command: "write_file",
          args: [getFilePath(key, params), JSON.stringify(data)]
        });
        return true;
      } catch (e) {
        Logger.error(`Error saving ${key}:`, e);
        return false;
      }
    }

    async function runTask(taskName, priority, ...params) {
      return new Promise((resolve, reject) => {
        try {
          tk.performTask(
            taskName,
            priority,
            params[0] || "",
            params[1] || "",
            "",
            true,
            true,
            "",
            true
          );
          resolve();
        } catch (e) {
          Logger.error(`Error running task '${taskName}':`, e);
          reject(new Error(`Failed: '${taskName}': ${e.message}`));
        }
      });
    }

    function isTaskRunning(taskName) {
      return tk.taskRunning(taskName);
    }

    return {
      WORK_DIR,
      isWeb: false,
      resolveIconPath,
      getData,
      getDefault,
      setData,
      execute,
      runTask,
      isTaskRunning,
      getFilePath,
      ...PATHS
    };
  }

  return isWeb ? WebEnvironment() : TaskerEnvironment();
})();
