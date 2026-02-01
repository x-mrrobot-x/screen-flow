const AppsModel = (() => {
  const TASK_NAME = "SO - HANDLE ACTIONS";
  const TASK_PRIORITY = 10;
  const ACTION_LOAD_APPS = "load_apps";

  function loadInstalledApps() {
    const appsConfig = {
      file_path: ENV.WORK_DIR + "src/data/apps.json",
      onload: "App.updateAppsData(%data)"
    };

    return ENV.runTask(
      TASK_NAME,
      TASK_PRIORITY,
      ACTION_LOAD_APPS,
      JSON.stringify(appsConfig)
    );
  }

  function updateAppsData(newApps) {
    Logger.debug("Received new apps data:", newApps);
    Logger.info("Received app data from Tasker.");
    try {
      const existingApps = AppState.getApps();
      const existingAppKeys = new Set(
        existingApps.map(app => `${app.pkg}-${app.name}`)
      );

      const appsToAdd = newApps.filter(app => {
        const appKey = `${app.pkg}-${app.name}`;
        return !existingAppKeys.has(appKey);
      });

      if (appsToAdd.length === 0) {
        Logger.user("Nenhum aplicativo novo para adicionar.", "info");
        return;
      }

      Logger.user(`Adicionando ${appsToAdd.length} novo(s) aplicativo(s).`, "success");
      const updatedApps = [...existingApps, ...appsToAdd];
      AppState.setApps(updatedApps);
    } catch (error) {
      Logger.error("Failed to parse or set app data:", error);
    }
  }

  return {
    loadInstalledApps,
    updateAppsData
  };
})();
