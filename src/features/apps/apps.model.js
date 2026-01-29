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
    console.log(newApps);
    return
    console.log("Received app data from Tasker.");
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
        console.log("No new apps to add.");
        return;
      }

      console.log(`Adding ${appsToAdd.length} new app(s).`);
      const updatedApps = [...existingApps, ...appsToAdd];
      AppState.setApps(updatedApps);
    } catch (error) {
      console.error("Failed to parse or set app data:", error);
    }
  }

  return {
    loadInstalledApps,
    updateAppsData
  };
})();
