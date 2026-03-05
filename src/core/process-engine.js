const ProcessEngine = (function () {
  "use strict";

  async function executeStep(step, context) {
    const params = step.params(context);
    if (step.type === "shell") return TaskQueue.add(step.func, params, "shell");
    if (step.type === "js") return ProcessModel[step.func](...params);
    throw new Error(`[ProcessEngine] Unknown step type: "${step.type}"`);
  }

  function isEmptyResult(step, result) {
    if (step.id === "scan_screenshots") return result.length === 0;
    if (step.id === "scan_recordings") return result.length === 0;
    if (step.id === "find_all_expired") return result.all.length === 0;
    return false;
  }

  async function run(processType, callbacks = {}, options = {}) {
    const {
      isCancelled,
      onStepStart,
      onStepComplete,
      onEmpty,
      onDone,
      onError
    } = callbacks;
    const { execution = "manual" } = options;

    const processData = ProcessConfig.PROCESS_TYPES[processType];
    if (!processData) {
      await onError?.(
        new Error(`Unknown process type: "${processType}"`),
        null,
        -1
      );
      return;
    }

    const steps = processData.steps;
    const context = { _execution: execution };

    for (let i = 0; i < steps.length; i++) {
      if (isCancelled?.()) return;

      const step = steps[i];
      await onStepStart?.(i, step, steps.length);

      try {
        const result = await executeStep(step, context);
        context[step.id] = result;

        Logger.debug("[ProcessEngine] step result", step.id, result);

        if (isEmptyResult(step, result)) {
          await onEmpty?.(step.id);
          return;
        }

        await onStepComplete?.(i, step, steps.length);
      } catch (error) {
        if (isCancelled?.()) return;
        await onError?.(error, step, i);
        return;
      }
    }

    const summary = context.save_summary || context.save_cleanup_summary || {};
    await onDone?.(processType, summary.savedStats || {}, context);
  }

  return {
    run
  };
})();
