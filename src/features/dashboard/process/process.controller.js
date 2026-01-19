const ProcessController = (function() {
  'use strict';

  function runStep(step, onComplete) {
    ProcessView.addStep(step, false);
    setTimeout(() => {
      ProcessView.addStep(step, true);
      onComplete();
    }, step.duration);
  }

  function start(processType) {
    ProcessModel.startProcess(processType);
    ProcessView.reset();
    ProcessView.show();

    const steps = ProcessConfig.PROCESS_TYPES[processType].steps;
    let currentDuration = 0;

    function next(index) {
      if (index < steps.length) {
        const step = steps[index];
        runStep(step, () => {
          currentDuration += step.duration;
          const progress = (currentDuration / ProcessModel.getTotalDuration()) * 100;
          ProcessView.updateProgress(progress);
          next(index + 1);
        });
      } else {
        setTimeout(() => {
          ProcessView.showCompletion("Processo finalizado com sucesso!");
          setTimeout(() => {
            ProcessView.hide();
          }, 2000);
        }, 500);
      }
    }
    next(0);
  }

  function init() {
    ProcessView.init();
    const quickActionButtons = DOM.qsa("[data-process-type]");
    quickActionButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const processType = btn.dataset.processType;
        start(processType);
      });
    });
  }

  return {
    init
  };
})();
