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
    ProcessView.update.stepLabel(step.label);
    ProcessView.update.progress((i / steps.length) * 100);
  }

  function checkEmptyResult(step, result) {
    const messages = {
      scan_screenshots: "Nenhuma captura de tela encontrada para organizar.",
      scan_recordings: "Nenhuma gravação de tela encontrada para organizar.",
      find_all_expired: "Nenhum arquivo antigo encontrado para limpar."
    };

    const isEmpty =
      (step.id === "scan_screenshots" && result.length === 0) ||
      (step.id === "scan_recordings" && result.length === 0) ||
      (step.id === "find_all_expired" && result.all.length === 0);

    if (!isEmpty) return false;

    state.isRunning = false;
    Toast.info(messages[step.id]);
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
      ProcessView.update.completion(`Erro em: ${step.label}`, false);
    }
    state.isRunning = false;
  }

  async function run() {
    const steps = ProcessConfig.PROCESS_TYPES[state.processType].steps;

    for (let i = 0; i < steps.length; i++) {
      if (!state.isRunning) {
        Toast.info("Processo cancelado.");
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
      return `Organização concluída! ${Utils.pluralize(
        stats.moved || 0,
        "arquivo"
      )}
      ${Utils.pluralize(stats.moved, "movido", false)}.`;
    }
    if (processType === "cleanup_old_files") {
      return `Limpeza concluída! ${Utils.pluralize(
        stats.total_removed || 0,
        "arquivo"
      )}
      ${Utils.pluralize(stats.total_removed || 0, "removido", false)}.`;
    }
    return "Processo finalizado com sucesso!";
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
    ProcessView.update.stepLabel("Processo concluído!");

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
      Toast.info("Cancelando processo...");
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
        Toast.info("Nenhuma pasta configurada para limpeza.");
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
    ProcessView.update.title(processData.title);
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
