const STORAGE_CONFIG = {
  FOLDERS: {
    web: {
      type: "localStorage",
      key: "folders",
      default: DEFAULT_FOLDERS
    },
    tasker: {
      type: "file",
      path: "data/folders.json",
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
      path: "data/settings.json",
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
      path: "data/stats.json",
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
      path: "data/activities.json",
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

const ENV = (() => {
  const isWeb = typeof tk === "undefined";
  const storagePrefix = "@screenflow:";
  const processState = { id: null };

  function resolvePath(pathTemplate, params = {}) {
    return pathTemplate.replace(/\{(\w+)\}/g, (_, key) => params[key] || _);
  }

  function getDefault(key) {
    const config = STORAGE_CONFIG[key];
    const envConfig = isWeb ? config.web : config.tasker;
    return JSON.parse(JSON.stringify(envConfig.default));
  }

  // ===== AMBIENTE WEB =====
  const web = {
    getWorkDir: () => "",
    get(key, params = {}) {
      try {
        const cfg = STORAGE_CONFIG[key].web;
        if (cfg.type === "fetch") {
          throw new Error(`Use getAsync para ${key}`);
        }
        const content = localStorage.getItem(storagePrefix + cfg.key);
        return content ? JSON.parse(content) : getDefault(key);
      } catch (e) {
        console.error(`Erro ao obter ${key}:`, e);
        return getDefault(key);
      }
    },

    async getAsync(key, params = {}) {
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
    },

    set(key, data) {
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
    },

    runProcess() {
      const loop = () => {
        const step = ProcessController.executeNextStep();
        if (step) {
          processState.id = setTimeout(loop, step.duration);
        }
      };
      loop();
    },

    cancelProcess() {
      if (processState.id) {
        clearTimeout(processState.id);
        processState.id = null;
      }
    }
  };

  // ===== AMBIENTE TASKER =====
  const tasker = {
    getWorkDir: () => tk.local("%work_dir") + "/",

    getPath(key, params = {}) {
      const cfg = STORAGE_CONFIG[key].tasker;
      const relative = cfg.pathTemplate
        ? resolvePath(cfg.pathTemplate, params)
        : cfg.path;
      return this.getWorkDir() + relative;
    },

    get(key, params = {}) {
      try {
        const content = tk.readFile(this.getPath(key, params));
        return content ? JSON.parse(content) : getDefault(key);
      } catch (e) {
        console.error(`Erro ao obter ${key}:`, e);
        return getDefault(key);
      }
    },

    async getAsync(key, params = {}) {
      return this.get(key, params);
    },

    set(key, data, params = {}) {
      try {
        tk.writeFile(this.getPath(key, params), JSON.stringify(data));
        return true;
      } catch (e) {
        console.error(`Erro ao salvar ${key}:`, e);
        return false;
      }
    },

    runProcess() {
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
    },

    cancelProcess() {
      // Assuming the Tasker task can be stopped by name.
      tk.stop("SO - PROCESS NEXT STEP");
    }
  };

  const env = isWeb ? web : tasker;

  return {
    isWeb,
    get: (key, params) => env.get(key, params),
    getAsync: (key, params) => env.getAsync(key, params),
    set: (key, data, params) => env.set(key, data, params),
    getWorkDir: env.getWorkDir,
    runProcess: env.runProcess,
    cancelProcess: env.cancelProcess
  };
})();
