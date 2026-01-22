const ProcessController = (function() {
  'use strict';

  let shouldCancel = false;

  function runStep(step, index, totalSteps, processType, onComplete) {
    // Check if process should be cancelled
    if (shouldCancel) {
      onComplete();
      return;
    }

    // Update the step label to current step
    ProcessView.updateStepLabel(step.label);

    // Update the step to running state
    const stepElements = document.querySelectorAll('.step-item');
    if (stepElements[index]) {
      // Mark as running
      setTimeout(() => {
        if (!shouldCancel) {
          stepElements[index].classList.remove('incomplete');
          stepElements[index].classList.add('running');
        }
      }, 100);
    }

    // Wait for the step duration then mark as completed
    setTimeout(() => {
      if (!shouldCancel && stepElements[index]) {
        stepElements[index].classList.remove('running');
        stepElements[index].classList.add('completed');
        stepElements[index].querySelector('.step-icon').innerHTML = Icons.get('check');
      }
      onComplete();
    }, step.duration);
  }

  function start(processType) {
    // Reset the cancel flag for new process
    shouldCancel = false;

    ProcessModel.startProcess(processType);
    ProcessView.reset();
    ProcessView.show();

    const steps = ProcessConfig.PROCESS_TYPES[processType].steps;
    let currentDuration = 0;

    // First, add all steps as incomplete
    const stepsContainer = document.querySelector(ProcessConfig.SELECTORS.stepsContainer);
    stepsContainer.innerHTML = '';

    steps.forEach((s, idx) => {
      const stepElement = document.createElement('div');
      stepElement.className = 'step-item incomplete';
      stepElement.innerHTML = `
        <div class="step-icon">
          ${Icons.get('loader')}
        </div>
        <span class="step-label">${s.label}</span>
      `;
      stepsContainer.appendChild(stepElement);
    });

    function next(index) {
      // Check if process should be cancelled before proceeding
      if (shouldCancel) {
        ProcessView.hide();
        return;
      }

      if (index < steps.length) {
        const step = steps[index];
        runStep(step, index, steps.length, processType, () => {
          if (!shouldCancel) {
            currentDuration += step.duration;
            const progress = (currentDuration / ProcessModel.getTotalDuration()) * 100;
            ProcessView.updateProgress(progress);
          }
          if (!shouldCancel) {
            next(index + 1);
          }
        });
      } else {
        // Generate completion text with statistics
        let completionText = "Processo finalizado com sucesso!";

        // Simulate getting stats - in a real app this would come from the actual process
        if (processType === 'screenshots') {
          completionText = `Organização de capturas concluída! 42 arquivos organizados.`;
        } else if (processType === 'recordings') {
          completionText = `Organização de gravações concluída! 18 arquivos organizados.`;
        } else if (processType === 'cleanup') {
          completionText = `Limpeza concluída! 25 arquivos removidos.`;
        }

        setTimeout(() => {
          if (!shouldCancel) {
            ProcessView.showCompletion(completionText);
            // Hide the modal after showing completion for a few seconds
            setTimeout(() => {
              // The hide function now handles reset internally
              ProcessView.hide();
            }, 3000);
          } else {
            ProcessView.hide();
          }
        }, 500);
      }
    }
    next(0);
  }

  function cancelCurrentProcess() {
    shouldCancel = true;
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
    init,
    cancelCurrentProcess
  };
})();
