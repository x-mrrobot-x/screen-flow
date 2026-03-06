const ProcessController = (function () {
  "use strict";

  const state = {
    isRunning: false,
    processType: null
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function notifyChanges(stats) {
    if ((stats.moved ?? 0) > 0 || (stats.total_removed ?? 0) > 0) {
      SubfolderMonitor.runScan();
      DashboardController.loadStats();
    }
  }

  function buildCallbacks(steps) {
    return {
      isCancelled: () => !state.isRunning,

      onStepStart: (i, step) => {
        ProcessView.update.stepStatus(i, "running");
        ProcessView.update.scrollToStep(i);
        ProcessView.update.stepLabel(I18n.t(step.labelKey));
        ProcessView.update.progress((i / steps.length) * 100);
      },

      onStepComplete: async i => {
        ProcessView.update.stepStatus(i, "completed");

        const hasNext = i < steps.length - 1;
        if (!hasNext || !state.isRunning) return;

        const next = steps[i + 1];
        ProcessView.update.stepStatus(i + 1, "running");
        ProcessView.update.scrollToStep(i + 1);
        ProcessView.update.stepLabel(I18n.t(next.labelKey));
        ProcessView.update.progress(((i + 1) / steps.length) * 100);
        await sleep(1000);
      },

      onEmpty: stepId => {
        const messageKeys = {
          scan_screenshots: "process.empty_screenshots",
          scan_recordings: "process.empty_recordings",
          find_all_expired: "process.empty_expired"
        };
        state.isRunning = false;
        Toast.info(I18n.t(messageKeys[stepId]));
        close();
      },

      onDone: (processType, stats) => {
        const processData = ProcessConfig.PROCESS_TYPES[processType];
        const doneLabel = I18n.t(processData?.doneLabelKey ?? "process.step_done");
        ProcessView.update.progress(100);
        ProcessView.update.stepLabel(doneLabel);
        ProcessView.update.completion(Utils.buildCompletionText(processType, stats), doneLabel);
        state.isRunning = false;
        notifyChanges(stats);

        const notifKey = processData?.notificationKey;
        if (notifKey && SettingsModel.getSetting(notifKey)) {
          const title = I18n.t(processData.notificationTitleKey);
          const content = Utils.buildCompletionText(processType, stats);
          ENV.sendNotification(title, content);
        }
      },

      onError: (error, step, index) => {
        if (error === "Cancelled") {
          Logger.warn(
            `Processo '${state.processType}' cancelado pelo usuário.`
          );
          return;
        }
        Logger.error(`Erro na etapa ${step?.id}:`, error);
        ProcessView.update.stepStatus(index, "failed");
        ProcessView.update.completion(
          I18n.t("process.step_error", { label: I18n.t(step.labelKey) }),
          undefined,
          false
        );
        state.isRunning = false;
      }
    };
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

    ProcessView.reset();
    ProcessView.update.title(I18n.t(processData.titleKey));
    ProcessView.render(processData.steps);
    open();

    setTimeout(
      () =>
        ProcessEngine.run(processType, buildCallbacks(processData.steps), {
          execution: "manual"
        }),
      500
    );
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
