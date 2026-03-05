const Runner = (function () {
  "use strict";

  async function run() {
    const processType = ENV.getVariable("process_type");
    if (!processType) {
      Logger.error("[Runner] %process_type not defined or empty.");
      ENV.exit();
      return;
    }

    try {
      await AppState.init();

      if (processType === "cleanup_old_files") {
        const hasConfigs = await ProcessModel.hasCleanerConfigs();
        if (!hasConfigs) return;
      }

      await ProcessEngine.run(
        processType,
        {
          onDone: async () => {
            await AppState.flushPersist();
          },
          onError: (error, step) => {
            Logger.error(
              "[Runner] Error in step:",
              step?.id,
              error?.message ?? String(error)
            );
            TaskQueue.cancelAll();
          }
        },
        { execution: "automatic" }
      );
    } catch (err) {
      Logger.error("[Runner] Critical error:", String(err));
    } finally {
      ENV.exit();
    }
  }

  function init() {
    ENV.SCENE_NAME = "SO - AUTO PROCESS";
    ENV.WEBVIEW_NAME = "AUTO PROCESS";

    window.App = {
      handleTaskResult: json => TaskQueue.onResult(json)
    };

    run();
  }

  init();
})();
