const ProcessModel = (function() {
  'use strict';
  
  let processType = null;
  let currentStep = 0;
  let totalDuration = 0;

  function startProcess(type) {
    processType = type;
    currentStep = 0;
    totalDuration = ProcessConfig.PROCESS_TYPES[type].steps.reduce((acc, step) => acc + step.duration, 0);
  }

  function getNextStep() {
    const steps = ProcessConfig.PROCESS_TYPES[processType].steps;
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      currentStep++;
      return step;
    }
    return null;
  }

  function getProcessType() {
    return processType;
  }

  function getTotalDuration() {
    return totalDuration;
  }

  return {
    startProcess,
    getNextStep,
    getProcessType,
    getTotalDuration
  };
})();
