const ProcessModel = (function() {
  'use strict';

  // Extrai nomes de aplicativos de uma lista de arquivos com base na extensão.
  async function extractAppNames(fileList, extension) {
    if (!fileList || fileList.length === 0) {
      return [];
    }
    const pattern = new RegExp(`_([^_]+)\.${extension}$`);
    const appNames = fileList.map(file => {
      const match = file.match(pattern);
      return match ? match[1] : null;
    }).filter(Boolean);

    return [...new Set(appNames)];
  }

  // Carrega a configuração de limpeza automática a partir dos dados das pastas.
  async function loadCleanerConfig() {
    const folders = await ENV.getDataAsync('FOLDERS');
    const config = {
      screenshots: [],
      recordings: [],
    };

    folders.forEach(folder => {
      if (folder.cleaner.ss.on) {
        config.screenshots.push({ folder: folder.path, days: folder.cleaner.ss.days });
      }
      if (folder.cleaner.sr.on) {
        config.recordings.push({ folder: folder.path, days: folder.cleaner.sr.days });
      }
    });
    return config;
  }

  // Lista todos os arquivos expirados com base nas configurações e extensão.
  async function listAllExpired(configs, extension) {
    let allExpired = [];
    for (const config of configs) {
      try {
        const expiredInFolder = await ENV.runProcess("list_expired_in_folder", config.folder, config.days, extension);
        if (expiredInFolder && expiredInFolder.length > 0) {
          allExpired = allExpired.concat(expiredInFolder);
        }
      } catch (e) {
        console.error(`Falha ao listar arquivos expirados em ${config.folder}:`, e);
      }
    }
    return allExpired;
  }

  // Atualiza os dados do processo (estatísticas, atividades).
  async function updateProcessData(processType, stats) {
    const isOrganizer = processType.startsWith('organizer');
    const isCleaner = processType.startsWith('clean');

    // 1. Atualiza as estatísticas globais
    const statsPayload = {
      processType: isOrganizer ? 'organizer' : (isCleaner ? 'cleanup' : 'unknown'),
      organizerCount: stats.moved || 0,
      cleanedCount: stats.total_removed || 0,
    };
    AppState.updateStatsFromProcess(statsPayload);

    // 2. Adiciona a atividade correspondente
    let activityPayload = { execution: 'manual' };
    if (isOrganizer) {
      activityPayload = {
        ...activityPayload,
        type: 'organizer',
        count: stats.moved || 0,
        mediaType: processType.includes('recordings') ? 'recordings' : 'screenshots',
      };
    } else if (isCleaner) {
      activityPayload = {
        ...activityPayload,
        type: 'cleaner',
        count: stats.total_removed || 0,
      };
    }
    
    if (activityPayload.type) {
      AppState.addActivity(activityPayload);
    }

    return { success: true, savedStats: stats };
  }

  // Verifica se existem configurações de limpeza automática ativas.
  async function hasCleanerConfigs() {
    const folders = await ENV.getDataAsync('FOLDERS');
    return folders.some(folder => folder.cleaner.ss.on || folder.cleaner.sr.on);
  }

  return {
    extractAppNames,
    loadCleanerConfig,
    listAllExpired,
    updateProcessData,
    hasCleanerConfigs,
  };
})();