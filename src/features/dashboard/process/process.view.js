const ProcessView = (function() {
  'use strict';

  const elements = {};

  function init() {
    for (const key in ProcessConfig.SELECTORS) {
      elements[key] = DOM.qs(ProcessConfig.SELECTORS[key]);
    }
    // Add close button event listener
    if (elements.closeBtn) {
      elements.closeBtn.addEventListener('click', () => {
        Modal.hide(elements.modal);
      });
    }

    // Add backdrop click event listener to close modal
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) {
        Modal.hide(elements.modal);
      }
    });
  }

  function show() {
    Modal.show(elements.modal);
  }

  function hide() {
    // Notify controller that the process should be cancelled
    if (typeof ProcessController !== 'undefined' && ProcessController.cancelCurrentProcess) {
      ProcessController.cancelCurrentProcess();
    }
    // Reset the modal to initial state when hiding to prevent interference
    reset();
    Modal.hide(elements.modal);
  }

  function reset() {
    elements.title.textContent = "Processando";
    elements.progressBar.style.width = "0%";
    elements.stepLabel.textContent = "Iniciando...";
    elements.percent.textContent = "0%";
    elements.stepsContainer.innerHTML = "";
    elements.completion.classList.remove("show");
  }

  function updateProgress(percent) {
    elements.progressBar.style.width = `${percent}%`;
    elements.percent.textContent = `${Math.round(percent)}%`;
  }

  function updateStepLabel(label) {
    elements.stepLabel.textContent = label;
  }

  function addStep(step, isCompleted) {
    // This function is kept for compatibility but the actual step creation
    // is handled in the controller to show all steps as incomplete first
  }

  function showCompletion(resultText) {
    elements.completion.classList.add("show");
    elements.resultText.textContent = resultText;
  }

  return {
    init,
    show,
    hide,
    reset,
    updateProgress,
    updateStepLabel,
    addStep,
    showCompletion
  };
})();
