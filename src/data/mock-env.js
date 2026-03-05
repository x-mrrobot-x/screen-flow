const MockEnv = (() => {
  "use strict";

  const MOCK_APPS = [
    { name: "WhatsApp", pkg: "com.whatsapp" },
    { name: "Telegram", pkg: "org.telegram.messenger" },
    { name: "Chrome", pkg: "com.android.chrome" },
    { name: "YouTube", pkg: "com.gold.android.youtube" },
    { name: "Instagram", pkg: "com.instagram.android" },
    { name: "Netflix", pkg: "com.netflix.mediaclient" },
    { name: "Spotify", pkg: "com.spotify.music" },
    { name: "Termux", pkg: "com.termux" },
    { name: "Tasker", pkg: "net.dinglisch.android.taskerm" },
    { name: "Claude", pkg: "com.anthropic.claude" }
  ];

  const MOCK_MEDIA_FILES = {
    screenshots: {
      WhatsApp: 15,
      Telegram: 8,
      Chrome: 25,
      Instagram: 30,
      Termux: 5
    },
    recordings: {
      WhatsApp: 5,
      Telegram: 2,
      YouTube: 12,
      Netflix: 3
    }
  };

  const MOCK_FOLDER_TIMESTAMPS = {
    screenshots: {
      WhatsApp: 1771360442,
      Telegram: 1771359365,
      Chrome: 1771412925,
      Instagram: 1771279880,
      Termux: 1771417649
    },
    recordings: {
      WhatsApp: 1771200625,
      Telegram: 1771074740,
      YouTube: 1771279874,
      Netflix: 1771072772
    }
  };

  const MOCK_SOURCE_PACKAGES = {
    screenshots: [
      "com.whatsapp",
      "org.telegram.messenger",
      "com.android.chrome"
    ],
    recordings: ["com.whatsapp", "com.gold.android.youtube"]
  };

  const MOCK_STATS = {
    organizedFiles: 150,
    cleanedFiles: 45,
    toOrganize: {
      screenshots: 25,
      recordings: 10
    },
    foldersCreated: {
      screenshots: 15,
      recordings: 8
    },
    lastOrganization: {
      screenshots: Date.now() - 86_400_000,
      recordings: Date.now() - 172_800_000
    },
    lastClean: {
      screenshots: Date.now() - 259_200_000,
      recordings: Date.now() - 345_600_000
    }
  };

  const MOCK_VARIABLES = {
    process_type: "organize_screenshots"
  };

  function getVariable(name) {
    return MOCK_VARIABLES[name] || null;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function mediaTypeFromPath(path) {
    return path?.includes("Screenshots") ? "screenshots" : "recordings";
  }

  function mediaTypeFromExtension(ext) {
    return ext === "jpg" ? "screenshots" : "recordings";
  }

  const MOCK_COMMANDS = {
    scan_media_app_packages(args) {
      const [extension] = args;
      const mediaType = mediaTypeFromExtension(extension);
      // Logger.debug("[MOCK] scan_media_app_packages", { extension });
      return MOCK_SOURCE_PACKAGES[mediaType] ?? [];
    },

    create_app_media_folders(args) {
      const [appNamesJson, destPath] = args;
      // Logger.debug("[MOCK] create_app_media_folders", { destPath });
      try {
        const appNames = JSON.parse(appNamesJson);
        return { created: appNames.length };
      } catch {
        return { created: 0 };
      }
    },

    run_batch_command(args) {
      const [countCommand] = args;
      // Logger.debug("[MOCK] run_batch_command");
      let moved = 0;
      if (countCommand?.includes("jpg")) {
        moved = Object.values(MOCK_MEDIA_FILES.screenshots).reduce(
          (a, b) => a + b,
          0
        );
      } else if (countCommand?.includes("mp4")) {
        moved = Object.values(MOCK_MEDIA_FILES.recordings).reduce(
          (a, b) => a + b,
          0
        );
      } else {
        moved = randomInt(5, 50);
      }
      return { moved };
    },

    delete_files_batch(args) {
      const [expiredFilesJson] = args;
      // Logger.debug("[MOCK] delete_files_batch");
      try {
        const files = JSON.parse(expiredFilesJson);
        return { removed: Array.isArray(files) ? files.length : 0 };
      } catch {
        return { removed: 0 };
      }
    },

    find_expired_files(args) {
      const [folderPath, , extension] = args;
      // Logger.debug("[MOCK] find_expired_files", { folderPath });
      return Array.from(
        { length: randomInt(0, 4) },
        (_, i) => `${folderPath}/expired_${i}.${extension ?? "jpg"}`
      );
    },

    count_media_items(args) {
      const [extension] = args;
      const mediaType = mediaTypeFromExtension(extension);
      // Logger.debug("[MOCK] count_media_items", { extension });
      return Object.values(MOCK_MEDIA_FILES[mediaType] ?? {}).reduce(
        (a, b) => a + b,
        0
      );
    },

    count_subfolders(args) {
      const [path] = args;
      // Logger.debug("[MOCK] count_subfolders", { path });
      const mediaType = mediaTypeFromPath(path);
      return Object.keys(MOCK_MEDIA_FILES[mediaType] ?? {}).length;
    },

    get_subfolders(args) {
      const [path] = args;
      // Logger.debug("[MOCK] get_subfolders", { path });
      const mediaType = mediaTypeFromPath(path);
      const mediaData = MOCK_MEDIA_FILES[mediaType] ?? {};
      const timestamps = MOCK_FOLDER_TIMESTAMPS[mediaType] ?? {};
      return Object.keys(mediaData).map(
        name => `${name},${timestamps[name] ?? 1771000000}`
      );
    },

    path_exists(args) {
      const [fullPath] = args;
      // Logger.debug("[MOCK] path_exists", { fullPath });
      return true;
    },

    rename_folder(args) {
      const [, oldName, newName] = args;
      // Logger.debug("[MOCK] rename_folder", { oldName, "→": newName });
      return { renamed: true, timestamp: Math.floor(Date.now() / 1000) };
    },

    get_item_counts_batch(args) {
      const [path, foldersJson] = args;
      // Logger.debug("[MOCK] get_item_counts_batch", { path });
      const mediaType = mediaTypeFromPath(path);
      const mediaData = MOCK_MEDIA_FILES[mediaType] ?? {};

      try {
        const requestedFolders = JSON.parse(foldersJson);
        return requestedFolders.map(name => `${name},${mediaData[name] ?? 0}`);
      } catch {
        Logger.error(
          "[MOCK] get_item_counts_batch: invalid foldersJson",
          foldersJson
        );
        return [];
      }
    },

    get_app_details_batch(args) {
      const packages = Array.isArray(args) ? args : [];
      // Logger.debug("[MOCK] get_app_details_batch", { packages });
      return MOCK_APPS.filter(app => packages.includes(app.pkg));
    },

    check_installed_apps(args) {
      // Logger.debug("[MOCK] check_installed_apps", args);
      return {
        changed: true,
        packages: MOCK_APPS.map(a => a.pkg)
      };
    },

    delete_folder_contents(args) {
      const [folderPath] = args;
      // Logger.debug("[MOCK] delete_folder_contents", { folderPath });
      const mediaType = mediaTypeFromPath(folderPath);
      const folderName = folderPath.split("/").pop();
      const deleted = MOCK_MEDIA_FILES[mediaType][folderName];
      const modifiedTime = MOCK_FOLDER_TIMESTAMPS[mediaType][folderName];
      return { deleted, mtime: modifiedTime };
    }
  };

  async function executeCommand(command, args = []) {
    // Logger.debug(`[MOCK ENV] executeCommand: "${command}"`, args);
    await new Promise(resolve => setTimeout(resolve, randomInt(150, 600)));

    const handler = MOCK_COMMANDS[command];
    if (typeof handler !== "function") {
      Logger.warn(`[MOCK ENV] Command not implemented: "${command}"`);
      return null;
    }

    try {
      const result = handler(args);
      // Logger.debug(`[MOCK ENV] Result of "${command}":`, result);
      return result;
    } catch (error) {
      Logger.error(`[MOCK ENV] Error in "${command}":`, error);
      return null;
    }
  }

  async function processTask(commandName, params, type) {
    // Logger.info(`[MOCK QUEUE] processTask: "${commandName}" (type: ${type})`);
    const args =
      type === "shell" ? (Array.isArray(params) ? params : [params]) : params;
    return executeCommand(commandName, args);
  }

  function init() {
    const STORAGE_PREFIX = "@screenflow:";
    const seeds = {
      stats: MOCK_STATS,
      settings: DEFAULT_SETTINGS
    };

    for (const [key, value] of Object.entries(seeds)) {
      if (!localStorage.getItem(STORAGE_PREFIX + key)) {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      }
    }
  }

  init();

  return {
    executeCommand,
    processTask,
    getVariable
  };
})();
