const ProcessModel = (function () {
  "use strict";

  // Carrega a configuração de limpeza automática a partir dos dados das pastas.
  async function loadCleanerConfig() {
    const folders = await ENV.getDataAsync("FOLDERS");
    const config = {
      screenshots: [],
      recordings: []
    };

    folders.forEach(folder => {
      if (folder.cleaner.ss.on) {
        config.screenshots.push({
          folder: folder.path,
          days: folder.cleaner.ss.days
        });
      }
      if (folder.cleaner.sr.on) {
        config.recordings.push({
          folder: folder.path,
          days: folder.cleaner.sr.days
        });
      }
    });
    return config;
  }

  // Lista todos os arquivos expirados com base nas configurações e extensão.
  async function listAllExpired(configs, extension) {
    let allExpired = [];
    for (const config of configs) {
      try {
        const expiredInFolder = await ENV.runProcess(
          "list_expired_in_folder",
          config.folder,
          config.days,
          extension
        );
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

  // Atualiza os dados do processo (estatísticas, atividades).
  async function updateProcessData(processType, stats) {
    const isOrganizer = processType.startsWith("organizer");
    const isCleaner = processType.startsWith("clean");

    // 1. Atualiza as estatísticas globais
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
    let activityPayload = { execution: "manual" };
    if (isOrganizer) {
      activityPayload = {
        ...activityPayload,
        type: "organizer",
        count: stats.moved || 0,
        mediaType: processType.includes("recordings")
          ? "recordings"
          : "screenshots"
      };
    } else if (isCleaner) {
      activityPayload = {
        ...activityPayload,
        type: "cleaner",
        count: stats.total_removed || 0
      };
    }

    if (activityPayload.type) {
      AppState.addActivity(activityPayload);
    }

    return { success: true, savedStats: stats };
  }

  // Verifica se existem configurações de limpeza automática ativas.
  async function hasCleanerConfigs() {
    const folders = await ENV.getDataAsync("FOLDERS");
    return folders.some(folder => folder.cleaner.ss.on || folder.cleaner.sr.on);
  }

  async function mapPackageNamesToAppNames(packageNames) {
    const folders = await ENV.getDataAsync("FOLDERS");
    const packageToAppNameMap = folders.reduce((map, folder) => {
      map[folder.pkg] = folder.name;
      return map;
    }, {});

    const resolvedMap = {};
    for (const pkgName of packageNames) {
      // Usa o nome do app encontrado ou o próprio nome do pacote como fallback
      resolvedMap[pkgName] = packageToAppNameMap[pkgName] || pkgName;
    }
    
    return resolvedMap;
  }

  async function buildMoveCommands(resolvedNames, sourcePath, destPath, extension) {
  const commands = [`cd "${sourcePath}"`];
  const patterns = [];
  
  for (const pkgName in resolvedNames) {
    const appName = resolvedNames[pkgName];
    const safeAppName = appName.replace(/[^\w\s.-]/g, "").trim();
    
    patterns.push(`*_${pkgName}.${extension}`);
    commands.push(`mv *_${pkgName}.${extension} "${destPath}/${safeAppName}" 2>/dev/null`);
  }
  
  if (patterns.length === 0) {
    return {
      countCommand: "echo 0",
      moveCommand: `cd "${sourcePath}"`,
      expectedCount: 0
    };
  }
  
  // MAIS RÁPIDO com ls
  const countCommand = `cd "${sourcePath}" && ls -1 ${patterns.join(' ')} 2>/dev/null | wc -l`;
  
  return {
    countCommand: countCommand,
    moveCommand: commands.join(' && '),
    expectedCount: patterns.length
  };
}

  return {
    mapPackageNamesToAppNames,
    loadCleanerConfig,
    listAllExpired,
    updateProcessData,
    hasCleanerConfigs,
    buildMoveCommands
  };
})();
