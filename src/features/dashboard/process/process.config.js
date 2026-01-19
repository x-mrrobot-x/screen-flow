const ProcessConfig = {
  SELECTORS: {
    modal: "#process-modal",
    title: "#modal-title",
    progressBar: "#modal-progress-bar",
    stepLabel: "#modal-step-label",
    percent: "#modal-percent",
    stepsContainer: "#modal-steps-container",
    completion: "#modal-completion",
    resultText: "#modal-result-text"
  },
  PROCESS_TYPES: {
    screenshots: {
      title: "Organizando Capturas",
      steps: [
        { label: "Analisando capturas...", duration: 1000 },
        { label: "Identificando apps...", duration: 1500 },
        { label: "Movendo arquivos...", duration: 2000 },
        { label: "Atualizando database...", duration: 500 }
      ]
    },
    recordings: {
      title: "Organizando Gravações",
      steps: [
        { label: "Analisando gravações...", duration: 1000 },
        { label: "Identificando apps...", duration: 1500 },
        { label: "Movendo arquivos...", duration: 2000 },
        { label: "Atualizando database...", duration: 500 }
      ]
    },
    cleanup: {
      title: "Executando Limpeza",
      steps: [
        { label: "Verificando regras...", duration: 1000 },
        { label: "Buscando arquivos antigos...", duration: 2000 },
        { label: "Removendo arquivos...", duration: 1500 },
        { label: "Finalizando...", duration: 500 }
      ]
    }
  }
};
