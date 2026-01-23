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

    function runProcess() {
      const loop = () => {
        const step = ProcessController.executeNextStep();
        if (step) {
          processState.id = setTimeout(loop, step.duration);
        }
      };
      loop();
    }

    function cancelProcess() {
      if (processState.id) {
        clearTimeout(processState.id);
        processState.id = null;
      }
    }

    return {
      workDir,
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

    function runProcess() {
      const step = ProcessController.executeNextStep();
      if (step) {
        tk.performTask(
          "SO - PROCESS NEXT STEP",
          50,
          "",
          step.duration,
          "",
          true,
          true,
          "",
          true
        );
      }
    }

    function cancelProcess() {
      // tk.stop("SO - PROCESS NEXT STEP");
    }

    return {
      workDir,
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
