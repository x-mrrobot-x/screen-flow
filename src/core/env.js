const ENV = (function () {
  "use strict";

  const isWeb = typeof tk === "undefined";

  const SCENE_NAME = "SO - SCREENSHOTS ORGANIZER";
  const WEBVIEW_NAME = "APP";

  const PATHS = {
    SOURCE_SCREENSHOTS_PATH: "/storage/emulated/0/DCIM/Screenshots",
    SOURCE_RECORDINGS_PATH: "/storage/emulated/0/DCIM/ScreenRecorder",
    ORGANIZED_SCREENSHOTS_PATH:
      "/storage/emulated/0/OrganizedMedia/Screenshots",
    ORGANIZED_RECORDINGS_PATH:
      "/storage/emulated/0/OrganizedMedia/ScreenRecordings"
  };

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
        path: "src/i18n/{lang}.json",
        default: {}
      },
      tasker: {
        type: "file",
        path: "src/i18n/{lang}.json",
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

  function resolvePath(path, params = {}) {
    return path.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? _);
  }

  function getDefault(key) {
    const cfg = STORAGE_CONFIG[key];
    if (!cfg) return null;
    const envCfg = isWeb ? cfg.web : cfg.tasker;
    return JSON.parse(JSON.stringify(envCfg.default));
  }

  function WebEnvironment() {
    const STORAGE_PREFIX = "@screenflow:";

    function resolveIconPath(pkg) {
      return `src/assets/icons/${pkg}.png`;
    }

    function getFilePath() {
      return "";
    }

    function getVariable(name) {
      if (typeof MockEnv !== "undefined" && MockEnv.getVariable) {
        return MockEnv.getVariable(name);
      }
      return null;
    }

    async function getData(key, params = {}) {
      try {
        const cfg = STORAGE_CONFIG[key].web;

        if (cfg.type === "localStorage") {
          const raw = localStorage.getItem(STORAGE_PREFIX + cfg.key);
          return raw ? JSON.parse(raw) : getDefault(key);
        }

        if (cfg.type === "fetch") {
          const path = resolvePath(cfg.path, params);
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

    function runTask(taskName, priority, ...params) {
      if (taskName === "SO - FILE QUEUE WORKER") {
        try {
          const taskerParams = JSON.parse(params[0]);
          const {
            id,
            commandName,
            action,
            params: taskParams,
            type
          } = taskerParams;
          const realCommand = commandName || action;

          (async function processMockTask() {
            try {
              const payload = await MockEnv.processTask(
                realCommand,
                taskParams,
                type
              );
              App.handleTaskResult(
                JSON.stringify({ id, status: "success", payload })
              );
            } catch (error) {
              Logger.error(
                `[WEB ENV] Error processing task "${realCommand}":`,
                error
              );
              App.handleTaskResult(
                JSON.stringify({ id, status: "error", payload: String(error) })
              );
            }
          })();
        } catch (e) {
          Logger.error("[WEB ENV] Failed to parse taskerParams:", e);
        }
      }
    }

    function isTaskRunning() {
      return true;
    }

    function getSystemLanguage() {
      return (navigator.language || navigator.userLanguage || "en").split(
        "-"
      )[0];
    }

    function exit() {
      Logger.debug("Closing the application...");
    }

    function sendNotification(title, content) {
      console.log("[NOTIFY]", title, "→", content);
    }

    return {
      WORK_DIR: "",
      isWeb: true,
      SCENE_NAME,
      WEBVIEW_NAME,
      getSystemLanguage,
      resolveIconPath,
      getVariable,
      getData,
      getDefault,
      setData,
      runTask,
      isTaskRunning,
      sendNotification,
      exit,
      getFilePath,
      ...PATHS
    };
  }

  function TaskerEnvironment() {
    const WORK_DIR = `${tk.local("%work_dir")}/`;
    const NOTIFY_TASK_NAME = "SO - NOTIFY";

    function resolveIconPath(pkg) {
      return `content://net.dinglisch.android.taskerm.iconprovider//app/${pkg}`;
    }

    function getFilePath(key, params = {}) {
      const cfg = STORAGE_CONFIG[key].tasker;
      const relative = cfg.path ? resolvePath(cfg.path, params) : cfg.path;
      return `${WORK_DIR}${relative}`;
    }

    async function execute({ command, args = [] }) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          const scriptPath = `${WORK_DIR}src/features/dashboard/process/script.sh`;
          const quotedArgs = args.map(Utils.escapeShellArg).join(" ");

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

    function getVariable(name) {
      return tk.local(name);
    }

    async function getData(key, params = {}) {
      try {
        const raw = tk.local(key.toLowerCase());
        return raw ? JSON.parse(raw) : getDefault(key);
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

    function runTask(taskName, priority, ...params) {
      return new Promise(function (resolve, reject) {
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

    function getSystemLanguage() {
      return (tk.local("%system_language") || "en").split("-")[0];
    }

    function exit() {
      tk.destroyScene(this.SCENE_NAME || SCENE_NAME);
    }

    function sendNotification(title, content) {
      runTask(NOTIFY_TASK_NAME, 10, title, content);
    }

    return {
      WORK_DIR,
      isWeb: false,
      SCENE_NAME,
      WEBVIEW_NAME,
      getSystemLanguage,
      resolveIconPath,
      getVariable,
      getData,
      getDefault,
      setData,
      execute,
      runTask,
      isTaskRunning,
      sendNotification,
      getFilePath,
      exit,
      ...PATHS
    };
  }

  return isWeb ? WebEnvironment() : TaskerEnvironment();
})();
