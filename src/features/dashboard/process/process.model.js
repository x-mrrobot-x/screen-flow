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
      const sanitizedName = sanitizeFolderName(appName);
      resolvedMap[identifier] = sanitizedName;
    }

    return resolvedMap;
  }

  function sanitizeFolderName(name) {
    return name
      .trim()
      .replace(/:/g, "-")
      .replace(/"/g, "")
      .replace(/\$/g, "")
      .replace(/`/g, "")
      .replace(/\\/g, "-");
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
    const folders = await ENV.getDataAsync("FOLDERS");
    const rules = {
      screenshots: [],
      recordings: []
    };

    folders.forEach(folder => {
      if (folder.cleaner.ss.on) {
        rules.screenshots.push({
          folder: folder.name,
          days: folder.cleaner.ss.days
        });
      }
      if (folder.cleaner.sr.on) {
        rules.recordings.push({
          folder: folder.name,
          days: folder.cleaner.sr.days
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
        // Re-utiliza a lógica de busca do script, mas poderia ser uma função JS pura se o ambiente permitir
        const folderPath = `${rootDir}/${config.folder}`;

        const expiredInFolder = await ENV.execute({
          command: "find_expired_files",
          args: [folderPath, config.days, extension]
        });
        if (expiredInFolder && expiredInFolder.length > 0) {
          allExpired = allExpired.concat(expiredInFolder);
        }
      } catch (e) {
        console.error(
          `Falha ao listar arquivos expirados em ${config.folder}:`,
          e
        );
      }
    }
    return allExpired;
  }

  async function saveSummary(processType, stats, activityType, mediaType) {
    // 1. Atualiza as estatísticas globais
    const isOrganizer = processType.startsWith("organize");
    const isCleaner = processType.startsWith("cleanup");

    const statsPayload = {
      processType: isOrganizer
        ? "organizer"
        : isCleaner
        ? "cleanup"
        : "unknown",
      organizerCount: stats.moved || 0,
      cleanedCount: stats.total_removed || 0
    };
    AppState.updateStatsFromProcess(statsPayload);

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
    const folders = await ENV.getDataAsync("FOLDERS");
    return folders.some(folder => folder.cleaner.ss.on || folder.cleaner.sr.on);
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
