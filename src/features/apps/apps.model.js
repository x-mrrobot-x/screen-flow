const AppsModel = (() => {
  const TASK_NAME = "SO - HANDLE ACTIONS";
  const TASK_PRIORITY = 10;
  const ACTION_LOAD_APPS = "load_apps";

  function loadInstalledApps() {
    return ENV.runTask(TASK_NAME, TASK_PRIORITY, ACTION_LOAD_APPS);
  }

  function updateAppsData(appsJson) {
    console.log("Received app data from Tasker.");
    try {
      const apps = appsJson;
      AppState.setApps(apps);
    } catch (error) {
      console.error("Failed to parse or set app data:", error);
    }
  }

  return {
    loadInstalledApps,
    updateAppsData
  };
})();
