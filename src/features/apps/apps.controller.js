const AppsController = (() => {
  /**
   * Initializes the apps feature by triggering the process to load installed apps.
   */
  function init() {
    try {
      AppsModel.loadInstalledApps();
    } catch (error) {
      console.error("Failed to trigger installed apps loading:", error);
    }
  }

  return {
    init,
  };
})();