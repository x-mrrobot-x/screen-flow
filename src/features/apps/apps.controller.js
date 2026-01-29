const AppsController = (() => {
  function init() {
    AppsModel.loadInstalledApps();
  }

  return {
    init
  };
})();
