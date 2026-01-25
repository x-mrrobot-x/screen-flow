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
        default: {}
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
    const storagePrefix = "@screenflow:";
    const processState = { id: null };
    const workDir = "";

    function resolveIconPath(pkg) {
      return `src/assets/icons/${pkg}.png`;
    }

    function getData(key, params = {}) {
      try {
        const cfg = STORAGE_CONFIG[key].web;
        if (cfg.type === "fetch") {
          throw new Error(`Use getDataAsync para ${key}`);
        }
        const content = localStorage.getItem(storagePrefix + cfg.key);
        return content ? JSON.parse(content) : getDefault(key);
      } catch (e) {
        console.error(`Erro ao obter ${key}:`, e);
        return getDefault(key);
      }
    }

    async function getDataAsync(key, params = {}) {
      try {
        const cfg = STORAGE_CONFIG[key].web;

        if (cfg.type === "localStorage") {
          const content = localStorage.getItem(storagePrefix + cfg.key);
          return content ? JSON.parse(content) : getDefault(key);
        }

        if (cfg.type === "fetch") {
          const path = resolvePath(cfg.pathTemplate, params);
          const res = await fetch(path);
          if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
          return await res.json();
        }
      } catch (e) {
        console.error(`Erro ao obter ${key}:`, e);
        return getDefault(key);
      }
    }

    function setData(key, data) {
      try {
        const cfg = STORAGE_CONFIG[key].web;
        if (cfg.type === "fetch") {
          throw new Error(`Não é possível escrever em ${key} (tipo fetch)`);
        }

        localStorage.setItem(storagePrefix + cfg.key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error(`Erro ao salvar ${key}:`, e);
        return false;
      }
    }

    async function runProcess(command, ...args) {
      // Mocked web environment for testing
      console.log(`[WEB MOCK] ENV.runProcess: ${command}`, args);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      const MOCK_FILES = {
        jpg: ["/storage/emulated/0/DCIM/Screenshots/_com.app1.jpg", "/storage/emulated/0/DCIM/Screenshots/_com.app2.jpg"],
        mp4: ["/storage/emulated/0/DCIM/ScreenRecorder/_com.app3.mp4"]
      };

      switch (command) {
        case "list_files":
          return MOCK_FILES[args[0]] || [];
        case "create_app_folders":
          return { created: JSON.parse(args[0]).length };
        case "move_files":
          return { moved: JSON.parse(args[0]).length };
        case "list_expired_in_folder":
          return []; // Assume no expired files in web mock
        case "remove_files":
          const numFiles = JSON.parse(args[0]).length;
          return { removed: numFiles };
        default:
          throw new Error(`Unknown mock command: ${command}`);
      }
    }

    function cancelProcess() {
      // No process to cancel in web mock, but keep the function for API consistency
    }

    return {
      workDir,
      isWeb: true,
      resolveIconPath,
      getData,
      getDataAsync,
      setData,
      runProcess,
      cancelProcess
    };
  }

  // ===== TASKER ENVIRONMENT CONFIG =====
  function TaskerEnvironment() {
    // The 'tk' object is a global provided by the Tasker environment.
    // It offers access to Tasker's functionalities like running shell commands
    // and accessing local variables.
    const workDir = `${tk.local("%work_dir")}/`;

    function resolveIconPath(pkg) {
      return `content://net.dinglisch.android.taskerm.iconprovider//app/${pkg}`;
    }

    function getPath(key, params = {}) {
      const cfg = STORAGE_CONFIG[key].tasker;
      const relative = cfg.pathTemplate
        ? resolvePath(cfg.pathTemplate, params)
        : cfg.path;
      return `${workDir}${relative}`;
    }

    function getData(key, params = {}) {
      try {
        const content = tk.shell(`cat '${getPath(key, params)}'`, false, 0);
        return content ? JSON.parse(content) : getDefault(key);
      } catch (e) {
        console.error(`Erro ao obter ${key}:`, e);
        return getDefault(key);
      }
    }

    async function getDataAsync(key, params = {}) {
      return getData(key, params);
    }

    function setData(key, data, params = {}) {
      try {
        tk.shell(
          `echo '${JSON.stringify(data)}' > '${getPath(key, params)}'`,
          false,
          0
        );
        return true;
      } catch (e) {
        console.error(`Erro ao salvar ${key}:`, e);
        return false;
      }
    }

    async function runProcess(command, ...args) {
      const scriptPath = `${workDir}src/features/dashboard/process/script.sh`;
      const quotedArgs = args.map(arg => `'${arg}'`).join(' ');
      const fullCommand = `${scriptPath} ${command} ${quotedArgs}`;

      try {
        const result = tk.shell(fullCommand, false, 5000);
        if (!result) {
          throw new Error("Comando shell retornou resultado vazio.");
        }
        
        const parsed = JSON.parse(result);
        if (parsed.success) {
          return parsed.data;
        } else {
          throw new Error(parsed.error || "Erro desconhecido no script shell.");
        }
      } catch (e) {
        console.error(`Erro ao executar comando de processo: ${command}`, e);
        throw new Error(`Falha ao executar '${command}': ${e.message}`);
      }
    }

    function cancelProcess() {
      // Tasker process is synchronous per-step, but we can have a global flag
      // For now, cancellation will be handled in the controller between steps
      // tk.stop(...) could be used if we had a long-running task name
    }

    return {
      workDir,
      isWeb: false,
      resolveIconPath,
      getPath,
      getData,
      getDataAsync,
      setData,
      runProcess,
      cancelProcess
    };
  }

  return isWeb ? WebEnvironment() : TaskerEnvironment();
})();
