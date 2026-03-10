import ENV from "../src/core/platform/env.js";
import AppState from "../src/core/state/app-state.js";
import I18n from "../src/core/services/i18n.js";
import TaskQueue from "../src/core/platform/task-queue.js";
import ProcessConfig from "../src/features/dashboard/process/process.config.js";
import ProcessModel from "../src/features/dashboard/process/process.model.js";
import ProcessEngine from "../src/core/services/process-engine.js";
import Logger from "../src/core/platform/logger.js";
import Format from "../src/core/ui/format.js";

function sendCompletionNotification(processType, stats) {
  const processData = ProcessConfig.PROCESS_TYPES[processType];
  const notifKey = processData?.notificationKey;
  if (!notifKey || !AppState.getSetting(notifKey)) return;
  const title = I18n.t(processData.notificationTitleKey);
  const content = Format.buildCompletionText(processType, stats);
  ENV.sendNotification(title, content);
}

async function onDone(processType, stats) {
  await AppState.flushPersist();
  sendCompletionNotification(processType, stats);
}

function onError(error, step) {
  Logger.error(
    "[Runner] Error in step:",
    step?.id,
    error?.message ?? String(error)
  );
  TaskQueue.cancelAll();
}

async function checkCleanupPreConditions(processType) {
  if (processType !== "cleanup_old_files") return true;
  return ProcessModel.hasCleanerConfigs();
}

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
    ProcessEngine.init({ ProcessConfig, ProcessModel });

    const canProceed = await checkCleanupPreConditions(processType);
    if (!canProceed) return;

    await ProcessEngine.run(
      processType,
      { onDone, onError },
      { execution: "automatic" }
    );
  } catch (err) {
    Logger.error("[Runner] Critical error:", String(err));
  } finally {
    ENV.exit();
  }
}

function setupEnvironment() {
  ENV.SCENE_NAME = ENV.TASKER.SCENES.AUTO_PROCESS;
  ENV.WEBVIEW_NAME = ENV.TASKER.WEBVIEWS.AUTO_PROCESS;
}

function setupGlobalHandlers() {
  window.App = {
    handleTaskResult: json => TaskQueue.onResult(json)
  };
}

function init() {
  setupEnvironment();
  setupGlobalHandlers();
  run();
}

init();
