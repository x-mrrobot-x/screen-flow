const ProcessController = (function() {
  'use strict';

  const state = {
    isRunning: false,
    timeoutId: null,
    processType: null,
    currentStepIndex: 0,
    accumulatedDuration: 0,
  };

  function executeNextStep() {
    if (!state.isRunning) return;

    const steps = ProcessModel.getSteps();
    if (state.currentStepIndex >= steps.length) {
      finishProcess();
      return;
    }

    const step = steps[state.currentStepIndex];

    // Update view for the current step
    ProcessView.updateStepLabel(step.label);
    ProcessView.updateStepStatus(state.currentStepIndex, 'running');

    // Set timeout for step completion
    state.timeoutId = setTimeout(() => {
      if (!state.isRunning) return;
      
      // Mark step as complete
      ProcessView.updateStepStatus(state.currentStepIndex, 'completed');
      state.accumulatedDuration += step.duration;
      const progress = (state.accumulatedDuration / ProcessModel.getTotalDuration()) * 100;
      ProcessView.updateProgress(progress);

      // Move to next step
      state.currentStepIndex++;
      executeNextStep();
    }, step.duration);
  }

  function finishProcess() {
    let completionText = "Processo finalizado com sucesso!";
    const processType = state.processType;

    if (processType === 'screenshots') {
      completionText = `Organização de capturas concluída! 42 arquivos organizados.`;
    } else if (processType === 'recordings') {
      completionText = `Organização de gravações concluída! 18 arquivos organizados.`;
    } else if (processType === 'cleanup') {
      completionText = `Limpeza concluída! 25 arquivos removidos.`;
    }

    ProcessView.showCompletion(completionText);
    ProcessView.updateStepLabel("Processo concluído!");

    // Mark process as not running, but don't close the modal
    state.isRunning = false;
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }

  function start(processType) {
    if (state.isRunning) return;

    // 1. Setup state and model
    state.isRunning = true;
    state.processType = processType;
    ProcessModel.setup(processType);

    const processData = ProcessConfig.PROCESS_TYPES[processType];
    const steps = ProcessModel.getSteps();

    // 2. Reset and prepare view
    ProcessView.reset();
    ProcessView.updateTitle(processData.title);
    ProcessView.renderInitialSteps(steps);
    ProcessView.show();

    // 3. Start execution
    executeNextStep();
  }

  function cancelCurrentProcess() {
    // Stop any pending operations
    clearTimeout(state.timeoutId);

    // Reset all states
    state.isRunning = false;
    state.timeoutId = null;
    state.processType = null;
    state.currentStepIndex = 0;
    state.accumulatedDuration = 0;

    ProcessModel.reset();

    // Hide and reset the view
    ProcessView.hide();
    ProcessView.reset();
  }

  function init() {
    ProcessView.init({
      onCancel: cancelCurrentProcess
    });
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
    cancelCurrentProcess
  };
})();
