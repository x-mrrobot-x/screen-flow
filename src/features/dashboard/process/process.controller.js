const ProcessController = (function() {
  'use strict';

  const state = {
    isRunning: false,
    processType: null,
    context: {},
  };

  //======= MOTOR DE EXECUÇÃO DE PROCESSOS =======//

  async function run() {
    const processData = ProcessConfig.PROCESS_TYPES[state.processType];
    const steps = processData.steps;

    for (let i = 0; i < steps.length; i++) {
      if (!state.isRunning) {
        console.log("Processo cancelado.");
        return;
      }

      const step = steps[i];
      const progress = (i / steps.length) * 100;

      ProcessView.updateStepStatus(i, 'running');
      ProcessView.updateStepLabel(step.label);
      ProcessView.updateProgress(progress);
      
      try {
        const params = step.params(state.context);
        let result;

        if (step.type === 'shell') {
          result = await ENV.runProcess(step.func, ...params);
        } else if (step.type === 'js') {
          // Chama a função JS diretamente do Model
          result = await ProcessModel[step.func](...params);
        }
        
        state.context[step.id] = result;
        ProcessView.updateStepStatus(i, 'completed');

      } catch (error) {
        console.error(`Erro na etapa ${step.id}:`, error);
        ProcessView.updateStepStatus(i, 'failed');
        ProcessView.showCompletion(`Erro em: ${step.label}`);
        state.isRunning = false;
        return;
      }
    }
    
    finishProcess();
  }

  function finishProcess() {
    if (!state.isRunning) return;

    ProcessView.updateProgress(100);
    ProcessView.updateStepLabel("Processo concluído!");
    
    const stats = state.context.update_data?.savedStats || {};
    let completionText = "Processo finalizado com sucesso!";

    if (state.processType === 'organizer_screenshots' || state.processType === 'organizer_recordings') {
      completionText = `Organização concluída! ${stats.moved || 0} arquivos movidos.`;
    } else if (state.processType === 'clean_old_files') {
      completionText = `Limpeza concluída! ${stats.total_removed || 0} arquivos removidos.`;
    }

    ProcessView.showCompletion(completionText);
    state.isRunning = false;
  }

  async function start(processType) {
    if (state.isRunning) return;

    if (processType === 'clean_old_files') {
      const hasConfigs = await ProcessModel.hasCleanerConfigs();
      if (!hasConfigs) {
        Toast.info("Nenhuma pasta configurada para limpeza automática.");
        return;
      }
    }

    const processData = ProcessConfig.PROCESS_TYPES[processType];
    if (!processData) {
      console.error(`Tipo de processo "${processType}" não encontrado.`);
      return;
    }

    state.isRunning = true;
    state.processType = processType;
    state.context = {};

    ProcessView.reset();
    ProcessView.updateTitle(processData.title);
    ProcessView.renderInitialSteps(processData.steps);
    ProcessView.show();

    run();
  }

  function cancelCurrentProcess() {
    if (!state.isRunning) return;
    
    state.isRunning = false;
    ProcessView.hide();
    ProcessView.reset();
  }

  function init() {
    ProcessView.init({ onCancel: cancelCurrentProcess });
    const quickActionButtons = DOM.qsa("[data-process-type]");
    quickActionButtons.forEach(btn => {
      const processType = btn.dataset.processType;
      btn.addEventListener("click", () => start(processType));
    });
  }

  return {
    init,
    start,
  };
})();