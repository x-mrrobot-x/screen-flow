const AppMonitor = (() => {
  const HASH_KEY = "apps_hash";

  // NOVA FUNÇÃO para renomear pastas
  async function renameFoldersForNewApps(newApps) {
    Logger.debug(`[AppMonitor] Verificando se pastas precisam ser renomeadas ou corrigidas para ${newApps.length} novo(s) app(s).`);

    const folders = AppState.getFolders();
    const pkgToNewAppMap = new Map(newApps.map(app => [app.pkg, app]));
    const nameToNewAppMap = new Map(newApps.map(app => [app.name, app]));
    let foldersStateUpdated = false;

    for (const folder of folders) {
        // Cenário 1: O NOME da pasta é um pacote. Renomear a pasta.
        if (pkgToNewAppMap.has(folder.name)) {
            const app = pkgToNewAppMap.get(folder.name);
            const oldName = folder.name;
            const newName = Utils.sanitizeFolderName(app.name);

            if (oldName === newName) continue;

            const basePath = folder.type === 'ss' 
              ? ENV.ORGANIZED_SCREENSHOTS_PATH 
              : ENV.ORGANIZED_RECORDINGS_PATH;
            
            try {
                Logger.info(`[AppMonitor] Renomeando pasta '${oldName}' para '${newName}'.`);
                await TaskQueue.add("rename_folder", [basePath, oldName, newName], 'shell');
                
                // Atualiza NOME e PKG no estado
                folder.name = newName;
                folder.pkg = app.pkg;
                foldersStateUpdated = true;
                
                Toast.success(`Pasta '${oldName}' atualizada para '${newName}'!`);

            } catch (error) {
                Logger.error(`[AppMonitor] Falha ao renomear a pasta '${oldName}':`, error);
            }
            // Pula para a próxima pasta, pois esta já foi tratada
            continue; 
        }

        // Cenário 2: O PKG da pasta está incorreto. Corrigir apenas no estado.
        if (nameToNewAppMap.has(folder.name)) {
            const app = nameToNewAppMap.get(folder.name);
            if (folder.pkg !== app.pkg) {
                Logger.info(`[AppMonitor] Corrigindo PKG para a pasta '${folder.name}'. Antigo: '${folder.pkg}', Novo: '${app.pkg}'.`);
                
                // Atualiza apenas o PKG no estado
                folder.pkg = app.pkg;
                foldersStateUpdated = true;
                Toast.info(`Metadados da pasta '${folder.name}' atualizados.`);
            }
        }
    }

    if (foldersStateUpdated) {
        AppState.setFolders(folders);
        Logger.info("[AppMonitor] Estado das pastas foi atualizado com novos nomes e/ou pacotes corrigidos.");
    }
  }

  function updateAppsData(newApps) {
    if (!newApps || newApps.length === 0) {
      Logger.info(
        "[AppMonitor] Nenhum detalhe de novo aplicativo para adicionar."
      );
      return;
    }

    Logger.debug(
      "[AppMonitor] Recebidos detalhes de novos aplicativos:",
      newApps
    );
    try {
      const existingApps = AppState.getApps();
      const existingAppKeys = new Set(existingApps.map(app => app.pkg));

      const appsToAdd = newApps.filter(app => !existingAppKeys.has(app.pkg));

      if (appsToAdd.length === 0) {
        Logger.info(
          "[AppMonitor] Todos os novos aplicativos já existiam no estado."
        );
        return;
      }

      // >>>>>>>>>> PONTO DE INJEÇÃO DA NOVA LÓGICA <<<<<<<<<<
      // Antes de atualizar o estado dos apps, verificamos se podemos renomear pastas
      // Usamos 'setTimeout' para não bloquear o fluxo principal de atualização
      setTimeout(() => renameFoldersForNewApps(appsToAdd), 500);
      
      Logger.user("Lista de aplicativos atualizada.", "success");
      const updatedApps = [...existingApps, ...appsToAdd];
      AppState.setApps(updatedApps);
    } catch (error) {
      Logger.error(
        "[AppMonitor] Falha ao adicionar novos aplicativos ao estado:",
        error
      );
    }
  }

  async function loadInstalledApps() {
    Logger.debug(
      "[AppMonitor] Iniciando verificação de novos aplicativos instalados."
    );
    try {
      const allPkgs = await TaskQueue.add("get_all_app_packages", {}, "app");
      if (!allPkgs) {
        throw new Error("A lista de pacotes retornada pelo Tasker é nula.");
      }

      const listAsString = allPkgs.sort().join(",");
      const currentHash = await Utils.generateHash(listAsString);
      const lastHash = Utils.getStoredData(HASH_KEY);

      if (currentHash === lastHash) {
        Logger.debug(
          "[AppMonitor] Nenhum aplicativo novo detectado (hash correspondente)."
        );
        return;
      }
      Logger.info(
        "[AppMonitor] Mudanças na lista de aplicativos detectadas. Verificando novos..."
      );

      const existingApps = AppState.getApps();
      const existingPkgs = new Set(existingApps.map(app => app.pkg));
      const newPkgs = allPkgs.filter(pkg => !existingPkgs.has(pkg));

      if (newPkgs.length > 0) {
        Logger.debug(
          `[AppMonitor] Buscando detalhes para ${newPkgs.length} novo(s) pacote(s).`
        );
        const appDetails = await TaskQueue.add(
          "get_app_details_batch",
          newPkgs,
          "app"
        );
        updateAppsData(appDetails);
      } else {
        Logger.debug(
          "[AppMonitor] Nenhuma aplicativo novo para adicionar, apenas remoções foram detectadas."
        );
      }

      Utils.setStoredData(HASH_KEY, currentHash);
    } catch (error) {
      Logger.error(
        "[AppMonitor] Falha ao sincronizar a lista de aplicativos:",
        error
      );
    } finally {
      EventBus.emit('appmonitor:ready');
      Logger.debug("[AppMonitor] Evento 'appmonitor:ready' emitido.");
    }
  }

  function init() {
    // Leve atraso para garantir que dependências como o AppState estejam prontas
    setTimeout(loadInstalledApps, 1500);
  }

  return {
    init
  };
})();
