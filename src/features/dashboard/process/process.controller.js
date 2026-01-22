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

    let organizedCount = 0;
    let cleanedCount = 0;

    const pendingFiles = Math.floor(Math.random() * 50);

    if (processType === 'screenshots' || processType === 'recordings') {
      organizedCount = Math.floor(Math.random() * 50) + 10;
      completionText = `Organização concluída! ${organizedCount} arquivos organizados.`;

      AppState.updateStatsFromProcess({
        organizedCount,
        pendingFiles,
        processType: 'organize',
      });

      // Add activity for organization
      AppState.addActivity({
        type: "organize",
        count: organizedCount,
        execution: "manual", // Since these are quick actions initiated by user
        mediaType: processType, // screenshots or recordings
        timestamp: Date.now()
      });

    } else if (processType === 'cleanup') {
      cleanedCount = Math.floor(Math.random() * 30) + 5;
      completionText = `Limpeza concluída! ${cleanedCount} arquivos removidos.`;

      AppState.updateStatsFromProcess({
        cleanedCount,
        pendingFiles,
        processType: 'cleanup'
      });

      // Add activity for cleanup
      AppState.addActivity({
        type: "clean",
        count: cleanedCount,
        execution: "manual", // Since these are quick actions initiated by user
        timestamp: Date.now()
      });
    }

    ProcessView.showCompletion(completionText);
    ProcessView.updateStepLabel("Processo concluído!");

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
