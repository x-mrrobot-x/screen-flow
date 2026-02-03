const AppMonitor = (() => {
  const HASH_KEY = "apps_hash";

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

            // Lógica de renomeação desacoplada
            let successfullyRenamed = false;
            let attemptedRename = false;
            
            const screenshotsPath = `${ENV.ORGANIZED_SCREENSHOTS_PATH}/${oldName}`;
            const recordingsPath = `${ENV.ORGANIZED_RECORDINGS_PATH}/${oldName}`;

            // Verifica e renomeia a pasta de screenshots
            if (await TaskQueue.add("path_exists", [screenshotsPath], 'shell')) {
                attemptedRename = true;
                try {
                    Logger.info(`[AppMonitor] Tentando renomear pasta de screenshots: '${oldName}' para '${newName}'.`);
                    await TaskQueue.add("rename_folder", [ENV.ORGANIZED_SCREENSHOTS_PATH, oldName, newName], 'shell');
                    successfullyRenamed = true;
                } catch (error) {
                    Logger.error(`[AppMonitor] Falha ao renomear a pasta de screenshots '${oldName}':`, error);
                }
            }

            // Verifica e renomeia a pasta de screen recordings
            if (await TaskQueue.add("path_exists", [recordingsPath], 'shell')) {
                attemptedRename = true;
                try {
                    Logger.info(`[AppMonitor] Tentando renomear pasta de screen recordings: '${oldName}' para '${newName}'.`);
                    await TaskQueue.add("rename_folder", [ENV.ORGANIZED_RECORDINGS_PATH, oldName, newName], 'shell');
                    successfullyRenamed = true;
                } catch (error) {
                    Logger.error(`[AppMonitor] Falha ao renomear a pasta de screen recordings '${oldName}':`, error);
                }
            }


            if (successfullyRenamed) {
                folder.name = newName;
                folder.pkg = app.pkg;
                foldersStateUpdated = true;
                Toast.success(`Pasta(s) do app '${newName}' foram atualizadas.`);
            } else if (attemptedRename) {
                Toast.error(`Falha ao renomear pasta(s) para '${newName}'.`);
            }

            continue;
        }

        // Cenário 2: O PKG da pasta está incorreto. Corrigir apenas no estado.
        if (nameToNewAppMap.has(folder.name)) {
            const app = nameToNewAppMap.get(folder.name);
            if (folder.pkg !== app.pkg) {
                Logger.info(`[AppMonitor] Corrigindo PKG para a pasta '${folder.name}'. Antigo: '${folder.pkg}', Novo: '${app.pkg}'.`);
                
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

  async function updateAppsData(newApps) {
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
      
      // Aguarda a conclusão do processo de renomeação antes de continuar
      await renameFoldersForNewApps(appsToAdd);
      
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
      const monitorData = AppState.getMonitorData();
      const lastHash = monitorData[HASH_KEY];

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
        await updateAppsData(appDetails);
      } else {
        Logger.debug(
          "[AppMonitor] Nenhuma aplicativo novo para adicionar, apenas remoções foram detectadas."
        );
      }

      AppState.setMonitorData({ [HASH_KEY]: currentHash });
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
    if (AppState.isReady()) {
      loadInstalledApps();
    } else {
      EventBus.on('appstate:ready', loadInstalledApps);
    }
    Logger.debug("[AppMonitor] Initialized.");
  }

  return {
    init
  };
})();
