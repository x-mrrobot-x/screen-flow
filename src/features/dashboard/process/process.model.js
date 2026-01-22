const ProcessModel = (function() {
  'use strict';

  const state = {
    processType: null,
    totalDuration: 0,
    steps: [],
  };

  function setup(processType) {
    const processConfig = ProcessConfig.PROCESS_TYPES[processType];
    if (!processConfig) {
      console.error(`Process type "${processType}" not found.`);
      state.steps = [];
      state.totalDuration = 0;
      return;
    }

    state.processType = processType;
    state.steps = processConfig.steps;
    state.totalDuration = state.steps.reduce((acc, step) => acc + step.duration, 0);
  }

  function reset() {
    state.processType = null;
    state.totalDuration = 0;
    state.steps = [];
  }

  function getSteps() {
    return state.steps;
  }

  function getTotalDuration() {
    return state.totalDuration;
  }

  return {
    setup,
    reset,
    getSteps,
    getTotalDuration,
  };
})();
