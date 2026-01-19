const ProcessView = (function() {
  'use strict';
  
  const elements = {};

  function init() {
    for (const key in ProcessConfig.SELECTORS) {
      elements[key] = DOM.qs(ProcessConfig.SELECTORS[key]);
    }
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
    elements.completion.style.display = "none";
  }

  function updateProgress(percent) {
    elements.progressBar.style.width = `${percent}%`;
    elements.percent.textContent = `${Math.round(percent)}%`;
  }

  function addStep(step, isCompleted) {
    const stepClass = isCompleted ? "step-item completed" : "step-item";
    const icon = isCompleted ? Icons.get('check') : Icons.get('loader');
    const stepHtml = `
      <div class="${stepClass}">
        <div class="step-icon">${icon}</div>
        <span>${step.label}</span>
      </div>
    `;
    elements.stepsContainer.innerHTML += stepHtml;
  }

  function showCompletion(resultText) {
    elements.completion.style.display = "block";
    elements.resultText.textContent = resultText;
  }

  return {
    init,
    show,
    hide,
    reset,
    updateProgress,
    addStep,
    showCompletion
  };
})();
