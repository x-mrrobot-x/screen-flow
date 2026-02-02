const SubfolderMonitor = (function () {
  "use strict";

  const STORAGE_KEY_PREFIX = "analyzer:";

  function updateFoldersFromScan(scriptOutput, type, existingFolders) {
    if (!scriptOutput || scriptOutput.length === 0) {
      return existingFolders;
    }
    
    const statsKey = type === "screenshots" ? "ss" : "sr";
    const folderData = scriptOutput.map(line => {
      const [name, count] = line.split(",");
      return {
        name: name.trim(),
        count: parseInt(count.trim(), 10) || 0
      };
    });

    let currentData = [...existingFolders];
    const apps = AppState.getApps();
    const appNameToPkgMap = apps.reduce((map, app) => {
      map[app.name] = app.pkg;
      return map;
    }, {});

    folderData.forEach(({ name, count }) => {
      const existingIndex = currentData.findIndex(f => f.name === name);
      const timestamp = Date.now();

      if (existingIndex !== -1) {
        currentData[existingIndex].stats[statsKey] = count;
        currentData[existingIndex].stats.lu = timestamp;
      } else {
        const pkg = appNameToPkgMap[name] || name;
        if (!appNameToPkgMap[name]) {
            Logger.warn(`Package não encontrado para a pasta: ${name}, usando o nome da pasta como pkg.`);
        }
        // Corrigido: Cria o objeto diretamente
        const newEntry = {
            id: String(Date.now()),
            name: name,
            pkg: pkg,
            stats: {
                ss: type === "screenshots" ? count : 0,
                sr: type === "screenrecordings" ? count : 0,
                lu: Date.now()
            },
            cleaner: {
                ss: { on: false, days: 7 },
                sr: { on: false, days: 7 }
            }
        };
        currentData.push(newEntry);
      }
    });

    Logger.debug(`[SubfolderMonitor] Dados de pastas atualizados para o tipo '${type}'.`);
    return currentData;
  }

  function updateFoldersData(scriptOutput, type) {
    Logger.info(`[SubfolderMonitor] Recebendo dados de contagem para o tipo: ${type}.`);
    try {
      const existingFolders = AppState.getFolders();
      const updatedFolders = updateFoldersFromScan(
        scriptOutput,
        type,
        existingFolders
      );
      AppState.setFolders(updatedFolders);
    } catch (error) {
      Logger.error(`[SubfolderMonitor] Falha ao processar dados para o tipo: ${type}`, error);
    }
  }

  async function processFolderType(type, path) {
    Logger.debug(`[SubfolderMonitor] Iniciando verificação para o tipo: ${type}`);
    const FOLDER_MAP_KEY = `${STORAGE_KEY_PREFIX}${type}_map`;
    const HASH_KEY = `${STORAGE_KEY_PREFIX}${type}_hash`;

    try {
      const subfolderList = await TaskQueue.add('get_subfolders', [path], 'shell');
      if (!subfolderList || subfolderList.length === 0) {
        Logger.debug(`[SubfolderMonitor] Nenhuma subpasta encontrada para ${type}.`);
        return;
      }
      
      const listAsString = subfolderList.join('|');
      const currentHash = await Utils.generateHash(listAsString);
      const lastHash = Utils.getStoredData(HASH_KEY);

      if (currentHash === lastHash) {
        Logger.debug(`[SubfolderMonitor] Sem alterações detectadas para ${type} (hash correspondente).`);
        return;
      }
      Logger.info(`[SubfolderMonitor] Alterações detectadas para ${type}.`);
      Utils.setStoredData(HASH_KEY, currentHash);

      const oldFolderMap = Utils.getStoredData(FOLDER_MAP_KEY) || {};
      const newFolderMap = subfolderList.reduce((acc, item) => {
        const [name, ts] = item.split(',');
        acc[name] = ts;
        return acc;
      }, {});
      
      const foldersToUpdate = Object.keys(newFolderMap).filter(name => {
          return newFolderMap[name] !== oldFolderMap[name];
      });

      if (foldersToUpdate.length === 0 && Object.keys(newFolderMap).length === Object.keys(oldFolderMap).length) {
        Logger.debug(`[SubfolderMonitor] Hashes diferentes, mas nenhum timestamp de pasta foi alterado para ${type}.`);
        Utils.setStoredData(FOLDER_MAP_KEY, newFolderMap);
        return;
      }

      Logger.info(`[SubfolderMonitor] As seguintes pastas precisam de atualização para ${type}:`, foldersToUpdate);
      
      const countsResult = await TaskQueue.add(
        'get_item_counts_batch',
        [path, JSON.stringify(foldersToUpdate)],
        'shell'
      );

      if (countsResult && countsResult.length > 0) {
        updateFoldersData(countsResult, type);
      }
      
      Utils.setStoredData(FOLDER_MAP_KEY, newFolderMap);

    } catch (error) {
      Logger.error(`[SubfolderMonitor] Erro ao processar o tipo de pasta '${type}':`, error);
    }
  }

  async function loadFoldersData() {
    await processFolderType("screenshots", ENV.ORGANIZED_SCREENSHOTS_PATH);
    await processFolderType("screenrecordings", ENV.ORGANIZED_RECORDINGS_PATH);
  }

  function init() {
    setTimeout(loadFoldersData, 1000);
  }
  
  function runScan(){
    loadFoldersData()
  }

  return {
    runScan,
    init
  };
})();
