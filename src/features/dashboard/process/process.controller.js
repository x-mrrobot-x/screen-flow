const ProcessController = (function () {
  "use strict";

  const state = {
    isRunning: false,
    processType: null,
    context: {}
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function executeStep(step) {
    const params = step.params(state.context);
    if (step.type === "shell") return TaskQueue.add(step.func, params, "shell");
    if (step.type === "js") return ProcessModel[step.func](...params);
  }

  function activateStep(i, step, steps) {
    ProcessView.update.stepStatus(i, "running");
    ProcessView.update.scrollToStep(i);
    ProcessView.update.stepLabel(I18n.t(step.labelKey));
    ProcessView.update.progress((i / steps.length) * 100);
  }

  function checkEmptyResult(step, result) {
    const messageKeys = {
      scan_screenshots: "process.empty_screenshots",
      scan_recordings: "process.empty_recordings",
      find_all_expired: "process.empty_expired"
    };

    const isEmpty =
      (step.id === "scan_screenshots" && result.length === 0) ||
      (step.id === "scan_recordings" && result.length === 0) ||
      (step.id === "find_all_expired" && result.all.length === 0);

    if (!isEmpty) return false;

    state.isRunning = false;
    Toast.info(I18n.t(messageKeys[step.id]));
    close();
    return true;
  }

  async function advanceToNextStep(i, steps) {
    if (i >= steps.length - 1 || !state.isRunning) return;
    activateStep(i + 1, steps[i + 1], steps);
    await sleep(1000);
  }

  function handleStepError(error, step, index) {
    if (error === "Cancelled") {
      Logger.warn(`Processo '${state.processType}' cancelado pelo usuário.`);
    } else {
      Logger.error(`Erro na etapa ${step.id}:`, error);
      ProcessView.update.stepStatus(index, "failed");
      ProcessView.update.completion(
        I18n.t("process.step_error", { label: I18n.t(step.labelKey) }),
        false
      );
    }
    state.isRunning = false;
  }

  async function run() {
    const steps = ProcessConfig.PROCESS_TYPES[state.processType].steps;

    for (let i = 0; i < steps.length; i++) {
      if (!state.isRunning) {
        Toast.info(I18n.t("process.cancelled"));
        return;
      }

      const step = steps[i];
      activateStep(i, step, steps);

      try {
        const result = await executeStep(step);

        Logger.debug("[STEP RESULT]", step.id, result);
        state.context[step.id] = result;

        if (checkEmptyResult(step, result)) return;

        ProcessView.update.stepStatus(i, "completed");
        await advanceToNextStep(i, steps);
      } catch (error) {
        handleStepError(error, step, i);
        return;
      }
    }

    finishProcess();
  }

  function buildCompletionText(processType, stats) {
    if (
      processType === "organize_screenshots" ||
      processType === "organize_recordings"
    ) {
      const count = stats.moved || 0;
      return I18n.t("process.organize_done", {
        count,
        file:
          count === 1 ? I18n.t("common.files") : I18n.t("common.files_plural"),
        moved:
          count === 1 ? I18n.t("common.moved") : I18n.t("common.moved_plural")
      });
    }
    if (processType === "cleanup_old_files") {
      const count = stats.total_removed || 0;
      return I18n.t("process.cleanup_done", {
        count,
        file:
          count === 1 ? I18n.t("common.files") : I18n.t("common.files_plural"),
        removed:
          count === 1
            ? I18n.t("common.removed")
            : I18n.t("common.removed_plural")
      });
    }
    return I18n.t("process.finished");
  }

  function notifyChanges(stats) {
    if (stats.moved > 0 || stats.total_removed > 0) {
      SubfolderMonitor.runScan();
      DashboardController.loadStats();
    }
  }

  function finishProcess() {
    if (!state.isRunning) return;

    ProcessView.update.progress(100);
    ProcessView.update.stepLabel(I18n.t("process.step_done"));

    const finalSummary =
      state.context.save_summary || state.context.save_cleanup_summary || {};
    const stats = finalSummary.savedStats || {};

    ProcessView.update.completion(
      buildCompletionText(state.processType, stats)
    );
    state.isRunning = false;

    notifyChanges(stats);
  }

  function cancelCurrentProcess() {
    if (state.isRunning) {
      Toast.info(I18n.t("process.cancelling"));
      state.isRunning = false;
      TaskQueue.cancelAll();
    }
    ProcessView.reset();
  }

  function open() {
    const { dialog } = ProcessView.getElements();
    DialogStack.push(dialog, cancelCurrentProcess);
  }

  function close() {
    DialogStack.goBack();
  }

  async function start(processType) {
    if (state.isRunning) return;

    if (processType === "cleanup_old_files") {
      const hasConfigs = await ProcessModel.hasCleanerConfigs();
      if (!hasConfigs) {
        Toast.info(I18n.t("process.no_cleaner_folders"));
        Navigation.navigateTo("cleaner");
        return;
      }
    }

    const processData = ProcessConfig.PROCESS_TYPES[processType];
    if (!processData) {
      Logger.error(`Tipo de processo "${processType}" não encontrado.`);
      return;
    }

    state.isRunning = true;
    state.processType = processType;
    state.context = {};

    ProcessView.reset();
    ProcessView.update.title(I18n.t(processData.titleKey));
    ProcessView.render(processData.steps);
    open();

    setTimeout(run, 500);
  }

  const handlers = {
    onProcessBtn: e => {
      const processType = e.target.closest("[data-process-type]")?.dataset
        .processType;
      if (processType) start(processType);
    },

    onClose: () => close(),

    onBackdropClick: e => {
      if (e.target === ProcessView.getElements().dialog) close();
    }
  };

  function attachEvents() {
    const { dialog, closeBtn } = ProcessView.getElements();

    const events = [
      [document, "click", handlers.onProcessBtn],
      [closeBtn, "click", handlers.onClose],
      [dialog, "click", handlers.onBackdropClick]
    ];
    events.forEach(([el, event, handler]) =>
      el.addEventListener(event, handler)
    );
  }

  function init() {
    ProcessView.init();
    attachEvents();
  }

  return {
    init
  };
})();
