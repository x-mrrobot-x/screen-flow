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
      AppState.init();
      await I18n.init();

      if (processType === "cleanup_old_files") {
        const hasConfigs = await ProcessModel.hasCleanerConfigs();
        if (!hasConfigs) return;
      }

      await ProcessEngine.run(
        processType,
        {
          onDone: async (processType, stats) => {
            await AppState.flushPersist();

            const processData = ProcessConfig.PROCESS_TYPES[processType];
            const notifKey = processData?.notificationKey;
            if (notifKey && AppState.getSetting(notifKey)) {
              const title = I18n.t(processData.notificationTitleKey);
              const content = Utils.buildCompletionText(processType, stats);
              ENV.sendNotification(title, content);
            }
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
    ENV.SCENE_NAME = ENV.TASKER.SCENES.AUTO_PROCESS;
    ENV.WEBVIEW_NAME = ENV.TASKER.WEBVIEWS.AUTO_PROCESS;

    window.App = {
      handleTaskResult: json => TaskQueue.onResult(json)
    };

    run();
  }

  init();
})();
