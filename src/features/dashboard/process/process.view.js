const ProcessView = (function() {
  'use strict';

  const elements = {};
  let handleCancel = () => {};

  function init(options) {
    for (const key in ProcessConfig.SELECTORS) {
      elements[key] = DOM.qs(ProcessConfig.SELECTORS[key]);
    }
    handleCancel = options.onCancel;

    if (elements.closeBtn) {
      elements.closeBtn.addEventListener('click', handleCancel);
    }
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) {
        handleCancel();
      }
    });
  }

  function show() {
    Modal.show(elements.modal);
  }

  function hide() {
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

  function updateTitle(title) {
    elements.title.textContent = title;
  }

  function renderInitialSteps(steps) {
    elements.stepsContainer.innerHTML = '';
    steps.forEach((step) => {
      const stepElement = document.createElement('div');
      stepElement.className = 'step-item incomplete';
      stepElement.innerHTML = `
        <div class="step-icon">${Icons.get('loader')}</div>
        <span class="step-label">${step.label}</span>
      `;
      elements.stepsContainer.appendChild(stepElement);
    });
  }

  function updateStepStatus(index, status) {
    const stepElements = elements.stepsContainer.children;
    if (!stepElements[index]) return;

    stepElements[index].classList.remove('incomplete', 'running', 'completed');
    stepElements[index].classList.add(status);

    if (status === 'completed') {
      stepElements[index].querySelector('.step-icon').innerHTML = Icons.get('check');
    } else {
      stepElements[index].querySelector('.step-icon').innerHTML = Icons.get('loader');
    }
  }

  function updateProgress(percent) {
    elements.progressBar.style.width = `${percent}%`;
    elements.percent.textContent = `${Math.round(percent)}%`;
  }

  function updateStepLabel(label) {
    elements.stepLabel.textContent = label;
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
    updateTitle,
    renderInitialSteps,
    updateStepStatus,
    updateProgress,
    updateStepLabel,
    showCompletion
  };
})();
