const ProcessModel = (function () {
  "use strict";

  async function resolveAppNames(packageNames) {
    const apps = AppState.getApps();

    const identifierToAppNameMap = {};

    apps.forEach(app => {
      identifierToAppNameMap[app.pkg] = app.name;
      identifierToAppNameMap[app.name] = app.name;
    });

    const resolvedMap = {};

    for (const identifier of packageNames) {
      const appName = identifierToAppNameMap[identifier] || identifier;
      const sanitizedName = Utils.sanitizeFolderName(appName);
      resolvedMap[identifier] = sanitizedName;
    }

    return resolvedMap;
  }

  async function buildMoveCommands(
    resolvedNames,
    sourcePath,
    destPath,
    extension
  ) {
    const commands = [`cd "${sourcePath}"`];
    const patterns = [];

    for (const pkgName in resolvedNames) {
      const appName = resolvedNames[pkgName].trim();

      patterns.push(`*"_${pkgName}.${extension}"`);
      commands.push(`mv *"_${pkgName}.${extension}" "${destPath}/${appName}/"`);
    }

    if (patterns.length === 0) {
      return {
        countCommand: "echo 0",
        moveCommand: "echo 'Nenhum arquivo para mover'"
      };
    }

    const countCommand = `cd "${sourcePath}" && ls -1 ${patterns.join(
      " "
    )} 2>/dev/null | wc -l`;

    return {
      countCommand: countCommand,
      moveCommand: commands.join(" ; ")
    };
  }

  async function prepareScreenshotOrganization(
    resolvedNames,
    sourcePath,
    destPath,
    extension
  ) {
    return buildMoveCommands(resolvedNames, sourcePath, destPath, extension);
  }

  async function prepareRecordingOrganization(
    resolvedNames,
    sourcePath,
    destPath,
    extension
  ) {
    return buildMoveCommands(resolvedNames, sourcePath, destPath, extension);
  }

  async function loadCleanupRules() {
    const folders = AppState.getFolders();
    const rules = {
      screenshots: [],
      recordings: []
    };

    folders.forEach(folder => {
      if (folder.ss?.cleaner?.on) {
        rules.screenshots.push({
          folder: folder.name,
          days: folder.ss?.cleaner?.days
        });
      }
      if (folder.sr?.cleaner?.on) {
        rules.recordings.push({
          folder: folder.name,
          days: folder.sr?.cleaner?.days
        });
      }
    });
    return rules;
  }

  async function findAllExpiredMedia(rules, screenshotsPath, recordingsPath) {
    const expiredScreenshots = await findExpired(
      rules.screenshots,
      screenshotsPath,
      "jpg"
    );
    const expiredRecordings = await findExpired(
      rules.recordings,
      recordingsPath,
      "mp4"
    );

    return {
      screenshots: expiredScreenshots,
      recordings: expiredRecordings,
      all: [...expiredScreenshots, ...expiredRecordings]
    };
  }

  async function findExpired(configs, rootDir, extension) {
    let allExpired = [];
    for (const config of configs) {
      try {
        const folderPath = `${rootDir}/${config.folder}`;

        const expiredInFolder = await ENV.execute({
          command: "find_expired_files",
          args: [folderPath, config.days, extension]
        });
        if (expiredInFolder && expiredInFolder.length > 0) {
          allExpired = allExpired.concat(expiredInFolder);
        }
      } catch (e) {
        Logger.error(
          `Falha ao listar arquivos expirados em ${config.folder}:`,
          e
        );
      }
    }
    return allExpired;
  }

  function updateStats(result) {
    const { processType, organizedCount = 0, cleanedCount = 0 } = result;

    let newStats = AppState.getStats();
    const now = Date.now();

    if (processType.includes("organize")) {
      const mediaType = processType.includes("screenshots")
        ? "images"
        : "videos";
      newStats.organizedFiles = (newStats.organizedFiles || 0) + organizedCount;
      newStats.lastOrganization = {
        ...newStats.lastOrganization,
        [mediaType]: now
      };
    } else if (processType.includes("cleanup")) {
      newStats.cleanedFiles = (newStats.cleanedFiles || 0) + cleanedCount;

      newStats.lastClean = {
        images: now,
        videos: now
      };
    }

    AppState.setStats(newStats);
  }

  async function saveSummary(processType, stats, activityType, mediaType) {
    // 1. Atualiza as estatísticas globais
    const statsPayload = {
      processType: processType,
      organizedCount: stats.moved || 0,
      cleanedCount: stats.total_removed || 0
    };

    updateStats(statsPayload);

    // 2. Adiciona a atividade correspondente
    const activityPayload = {
      execution: "manual",
      type: activityType,
      count: stats.moved || stats.total_removed || 0
    };

    if (mediaType) {
      activityPayload.mediaType = mediaType;
    }

    AppState.addActivity(activityPayload);

    return { success: true, savedStats: stats };
  }

  async function saveScreenshotSummary(processType, stats) {
    return saveSummary(processType, stats, "organizer", "screenshots");
  }

  async function saveRecordingSummary(processType, stats) {
    return saveSummary(processType, stats, "organizer", "recordings");
  }

  async function saveCleanupSummary(processType, stats) {
    return saveSummary(processType, stats, "cleaner");
  }

  async function hasCleanerConfigs() {
    const folders = AppState.getFolders();
    return folders.some(folder => folder.ss?.cleaner?.on || folder.sr?.cleaner?.on);
  }

  return {
    resolveAppNames,
    prepareScreenshotOrganization,
    prepareRecordingOrganization,
    loadCleanupRules,
    findAllExpiredMedia,
    saveScreenshotSummary,
    saveRecordingSummary,
    saveCleanupSummary,
    hasCleanerConfigs
  };
})();
