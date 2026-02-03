const ENV = (() => {
  const STORAGE_CONFIG = {
    FOLDERS: {
      web: {
        type: "localStorage",
        key: "folders",
        default: DEFAULT_FOLDERS
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
        default: {}
      }
    },
    ACTIVITIES: {
      web: {
        type: "localStorage",
        key: "activities",
        default: DEFAULT_ACTIVITIES
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
        default: DEFAULT_APPS
      },
      tasker: {
        type: "file",
        path: "src/data/apps.json",
        default: []
      }
    },
    MONITOR: {
      web: {
        type: "localStorage",
        key: "monitor",
        default: {}
      },
      tasker: {
        type: "file",
        path: "src/data/monitor.json",
        default: {}
      }
    }
  };

  const isWeb = typeof tk === "undefined";

  function resolvePath(pathTemplate, params = {}) {
    return pathTemplate.replace(/\{(\w+)\}/g, (_, key) => params[key] || _);
  }

  function getDefault(key) {
    const isWeb = typeof tk === "undefined";
    const config = STORAGE_CONFIG[key];
    const envConfig = isWeb ? config.web : config.tasker;
    return JSON.parse(JSON.stringify(envConfig.default));
  }

  // ===== WEB ENVIRONMENT =====
  function WebEnvironment() {
    const STORAGE_PREFIX = "@screenflow:";
    const SOURCE_SCREENSHOTS_PATH = "/storage/emulated/0/DCIM/Screenshots";
    const SOURCE_RECORDINGS_PATH = "/storage/emulated/0/DCIM/ScreenRecorder";
    const ORGANIZED_SCREENSHOTS_PATH =
      "/storage/emulated/0/OrganizedMedia/Screenshots";
    const ORGANIZED_RECORDINGS_PATH =
      "/storage/emulated/0/OrganizedMedia/ScreenRecordings";
    const WORK_DIR = "";

    const WEB_MOCK_DATA = {
      get_subfolders: () => [
        "Test Folder 1,1675280000",
        "Test Folder 2,1675281000"
      ],
      get_item_count: () => Math.floor(Math.random() * 100),
      scan_media_app_packages: args => {
        if (args[0] === "jpg") {
          return ["com.spotify.music", "com.whatsapp"];
        } else {
          return ["com.netflix.mediaclient"];
        }
      },
      create_app_media_folders: args => {
        try {
          const apps = JSON.parse(args[0]);
          return { created: apps.length };
        } catch (e) {
          return { created: 0 };
        }
      },
      run_batch_command: () => ({ moved: 5 }),
      delete_files_batch: () => null,
      find_expired_files: () => []
    };

    function resolveIconPath(pkg) {
      return `src/assets/icons/${pkg}.png`;
    }

    async function getData(key, params = {}) {
      try {
        const cfg = STORAGE_CONFIG[key].web;

        if (cfg.type === "localStorage") {
          const content = localStorage.getItem(STORAGE_PREFIX + cfg.key);
          return content ? JSON.parse(content) : getDefault(key);
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
        if (cfg.type === "fetch") {
          throw new Error(`Cannot write to ${key} (fetch type)`);
        }

        localStorage.setItem(STORAGE_PREFIX + cfg.key, JSON.stringify(data));
        return true;
      } catch (e) {
        Logger.error(`Error saving ${key}:`, e);
        return false;
      }
    }

    async function execute({ command, args = [] }) {
      // Logger.debug(`[WEB MOCK] ENV.execute: ${command}`, args);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (typeof WEB_MOCK_DATA[command] === "function") {
        return WEB_MOCK_DATA[command](args);
      }

      Logger.warn(`[WEB MOCK] No mock data for command: ${command}`);
      return null;
    }

    function cancelProcess() {
      // No process to cancel in web mock, but keep the function for API consistency
    }

    async function runTask(taskName, priority, ...params) {
      Logger.debug(`[WEB MOCK] ENV.runTask: ${taskName}`, { priority, params });

      if (taskName === "SO - HANDLE ACTIONS" && params[0] === "load_apps") {
        setTimeout(() => {
          Logger.debug(
            "[WEB MOCK][LOAD APPS] Simulating app data callback with default apps."
          );
          App.updateAppsData(JSON.stringify(DEFAULT_APPS));
        }, 500);
      }
    }

    return {
      WORK_DIR,
      isWeb: true,
      resolveIconPath,
      getData,
      getDefault,
      setData,
      execute,
      runTask,
      cancelProcess,
      SOURCE_SCREENSHOTS_PATH,
      SOURCE_RECORDINGS_PATH,
      ORGANIZED_SCREENSHOTS_PATH,
      ORGANIZED_RECORDINGS_PATH
    };
  }

  // ===== TASKER ENVIRONMENT CONFIG =====
  function TaskerEnvironment() {
    const SOURCE_SCREENSHOTS_PATH = "/storage/emulated/0/DCIM/Screenshots";
    const SOURCE_RECORDINGS_PATH = "/storage/emulated/0/DCIM/ScreenRecorder";
    const ORGANIZED_SCREENSHOTS_PATH =
      "/storage/emulated/0/OrganizedMedia/Screenshots";
    const ORGANIZED_RECORDINGS_PATH =
      "/storage/emulated/0/OrganizedMedia/ScreenRecordings";

    const WORK_DIR = `${tk.local("%work_dir")}/`;

    function resolveIconPath(pkg) {
      return `content://net.dinglisch.android.taskerm.iconprovider//app/${pkg}`;
    }

    function getPath(key, params = {}) {
      const cfg = STORAGE_CONFIG[key].tasker;
      const relative = cfg.pathTemplate
        ? resolvePath(cfg.pathTemplate, params)
        : cfg.path;
      return `${WORK_DIR}${relative}`;
    }

    async function getData(key, params = {}) {
      try {
        const result = await execute({
          command: 'read_file',
          args: [getPath(key, params), JSON.stringify(getDefault(key))]
        });
        return result;
      } catch (e) {
        Logger.error(`Error getting async ${key}:`, e);
        return getDefault(key);
      }
    }

    async function setData(key, data, params = {}) {
      try {
        await execute({
          command: 'write_file',
          args: [getPath(key, params), JSON.stringify(data)]
        });
        return true;
      } catch (e) {
        Logger.error(`Error saving ${key}:`, e);
        return false;
      }
    }

    async function execute({ command, args = [] }) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const scriptPath = `${WORK_DIR}src/features/dashboard/process/script.sh`;

          const quotedArgs = args
            .map(arg => {
              const argStr =
                typeof arg === "object" && arg !== null
                  ? JSON.stringify(arg)
                  : String(arg);
              return "'" + argStr.replace(/'/g, "'\\''") + "'";
            })
            .join(" ");

          const fullCommand = `sh "${scriptPath}" ${command} ${quotedArgs}`;

          try {
            // Logger.debug(`[FULL COMMAND] ${fullCommand}`);
            const result = tk.shell(fullCommand, false, 5000);
            // Logger.debug(`[RESULT] ${result}`);

            if (!result || result.trim() === "") {
              throw new Error("Shell command returned empty result.");
            }

            const parsed = JSON.parse(result);
            if (parsed.success) {
              resolve(parsed.data);
            } else {
              throw new Error(parsed.error || "Unknown shell script error.");
            }
          } catch (e) {
            Logger.error(`Error executing process command: ${command}`, e);
            reject(new Error(`Failed to execute '${command}': ${e.message}`));
          }
        }, 0);
      });
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
          Logger.error(`Error executing task '${taskName}':`, e);
          reject(
            new Error(`Failed to execute task '${taskName}': ${e.message}`)
          );
        }
      });
    }

    function getGlobal(varName) {
      try {
        const value = tk.global(varName);
        return value !== `%${varName}` ? value : undefined;
      } catch (e) {
        Logger.error(`Error getting global variable '${varName}':`, e);
        return undefined;
      }
    }

    function cancelProcess() {}

    return {
      WORK_DIR,
      isWeb: false,
      resolveIconPath,
      getData,
      getDefault,
      setData,
      execute,
      runTask,
      getGlobal,
      cancelProcess,
      SOURCE_SCREENSHOTS_PATH,
      SOURCE_RECORDINGS_PATH,
      ORGANIZED_SCREENSHOTS_PATH,
      ORGANIZED_RECORDINGS_PATH
    };
  }

  return isWeb ? WebEnvironment() : TaskerEnvironment();
})();
