const ProcessController = (function() {
  'use strict';

  const state = {
    isRunning: false,
    processType: null,
    currentStepIndex: 0,
    accumulatedDuration: 0,
  };

  function executeNextStep() {
    if (!state.isRunning) return null;

    // Mark previous step as completed
    if (state.currentStepIndex > 0) {
      const prevStep = ProcessModel.getSteps()[state.currentStepIndex - 1];
      ProcessView.updateStepStatus(state.currentStepIndex - 1, 'completed');
      state.accumulatedDuration += prevStep.duration;
      const progress = (state.accumulatedDuration / ProcessModel.getTotalDuration()) * 100;
      ProcessView.updateProgress(progress);
    }

    const steps = ProcessModel.getSteps();
    if (state.currentStepIndex >= steps.length) {
      finishProcess();
      return null;
    }

    const step = steps[state.currentStepIndex];

    ProcessView.updateStepLabel(step.label);
    ProcessView.updateStepStatus(state.currentStepIndex, 'running');

    state.currentStepIndex++;
    return step;
  }

  function finishProcess() {
    if (!state.isRunning) return;

    if (state.currentStepIndex > 0 && state.currentStepIndex <= ProcessModel.getSteps().length) {
      ProcessView.updateStepStatus(state.currentStepIndex - 1, 'completed');
    }
    ProcessView.updateProgress(100);

    let completionText = "Processo finalizado com sucesso!";
    const processType = state.processType;
    let organizedCount = 0;
    let cleanedCount = 0;
    const pendingFiles = Math.floor(Math.random() * 50);

    if (processType === 'screenshots' || processType === 'recordings') {
      organizedCount = Math.floor(Math.random() * 50) + 10;
      completionText = `Organização concluída! ${organizedCount} arquivos organizados.`;
      AppState.updateStatsFromProcess({ organizedCount, pendingFiles, processType: 'organize' });
      AppState.addActivity({ type: "organize", count: organizedCount, execution: "manual", mediaType: processType, timestamp: Date.now() });
    } else if (processType === 'cleanup') {
      cleanedCount = Math.floor(Math.random() * 30) + 5;
      completionText = `Limpeza concluída! ${cleanedCount} arquivos removidos.`;
      AppState.updateStatsFromProcess({ cleanedCount, pendingFiles, processType: 'cleanup' });
      AppState.addActivity({ type: "clean", count: cleanedCount, execution: "manual", timestamp: Date.now() });
    }

    ProcessView.showCompletion(completionText);
    ProcessView.updateStepLabel("Processo concluído!");

    state.isRunning = false;
  }

  function start(processType) {
    if (state.isRunning) return;

    state.isRunning = true;
    state.processType = processType;
    state.currentStepIndex = 0;
    state.accumulatedDuration = 0;
    ProcessModel.setup(processType);

    const processData = ProcessConfig.PROCESS_TYPES[processType];
    const steps = ProcessModel.getSteps();

    ProcessView.reset();
    ProcessView.updateTitle(processData.title);
    ProcessView.renderInitialSteps(steps);
    ProcessView.show();

    ENV.runProcess();
  }

  function cancelCurrentProcess() {
    ENV.cancelProcess();

    state.isRunning = false;
    state.processType = null;
    state.currentStepIndex = 0;
    state.accumulatedDuration = 0;

    ProcessModel.reset();
    ProcessView.hide();
    ProcessView.reset();
  }

  function init() {
    ProcessView.init({ onCancel: cancelCurrentProcess });
    const quickActionButtons = DOM.qsa("[data-process-type]");
    quickActionButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const processType = btn.dataset.processType;
        start(processType);
      });
    });
  }

  return {
    init,
    start,
    cancelCurrentProcess,
    executeNextStep,
    finishProcess,
  };
})();
