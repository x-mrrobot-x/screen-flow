const AppMonitor = (() => {
  const HASH_KEY = "apps_hash";

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
