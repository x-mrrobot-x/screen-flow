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
  async function loadAutoCleanConfig() {
    const folders = await ENV.getDataAsync('FOLDERS');
    const config = {
      screenshots: [],
      recordings: [],
    };

    folders.forEach(folder => {
      if (folder.autoClean.ss.on) {
        config.screenshots.push({ folder: folder.path, days: folder.autoClean.ss.days });
      }
      if (folder.autoClean.sr.on) {
        config.recordings.push({ folder: folder.path, days: folder.autoClean.sr.days });
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
    console.log("Atualizando dados do processo:", processType, stats);
    // Aqui é onde o estado global seria atualizado e salvo.
    // AppState.updateStats(stats);
    // AppState.addActivity({ type: processType, ...stats });
    return { success: true, savedStats: stats };
  }

  // Verifica se existem configurações de limpeza automática ativas.
  async function hasAutoCleanConfigs() {
    const folders = await ENV.getDataAsync('FOLDERS');
    return folders.some(folder => folder.autoClean.ss.on || folder.autoClean.sr.on);
  }

  return {
    extractAppNames,
    loadAutoCleanConfig,
    listAllExpired,
    updateProcessData,
    hasAutoCleanConfigs,
  };
})();
