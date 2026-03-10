import TaskQueue from "../platform/task-queue.js";
import Logger from "../platform/logger.js";

let ProcessConfig;
let ProcessModel;

function executeShellStep(step, context) {
  return TaskQueue.add(step.func, step.params(context), "shell");
}

function executeJsStep(step, context) {
  return ProcessModel[step.func](...step.params(context));
}

async function executeStep(step, context) {
  if (step.type === "shell") return executeShellStep(step, context);
  if (step.type === "js") return executeJsStep(step, context);
  throw new Error(`[ProcessEngine] Unknown step type: "${step.type}"`);
}

function isEmptyResult(step, result) {
  if (step.id === "scan_screenshots") return result.length === 0;
  if (step.id === "scan_recordings") return result.length === 0;
  if (step.id === "find_all_expired") return result.all.length === 0;
  return false;
}

function resolveProcessData(processType) {
  return ProcessConfig.PROCESS_TYPES[processType] ?? null;
}

function resolveSummary(context) {
  return context.save_summary || context.save_cleanup_summary || {};
}

function extractCallbacks(callbacks) {
  const { isCancelled, onStepStart, onStepComplete, onEmpty, onDone, onError } =
    callbacks;
  return { isCancelled, onStepStart, onStepComplete, onEmpty, onDone, onError };
}

async function runStep(step, index, steps, context, callbacks) {
  const { isCancelled, onStepStart, onStepComplete, onEmpty, onError } =
    callbacks;

  await onStepStart?.(index, step, steps.length);

  try {
    const result = await executeStep(step, context);
    context[step.id] = result;
    Logger.debug("[ProcessEngine] step result", step.id, result);

    if (isEmptyResult(step, result)) {
      await onEmpty?.(step.id);
      return false;
    }

    await onStepComplete?.(index, step, steps.length);
    return true;
  } catch (error) {
    if (isCancelled?.()) return false;
    await onError?.(error, step, index);
    return false;
  }
}

async function run(processType, callbacks = {}, options = {}) {
  const { execution = "manual" } = options;
  const cb = extractCallbacks(callbacks);

  const processData = resolveProcessData(processType);
  if (!processData) {
    await cb.onError?.(
      new Error(`Unknown process type: "${processType}"`),
      null,
      -1
    );
    return;
  }

  const steps = processData.steps;
  const context = { _execution: execution };

  for (let i = 0; i < steps.length; i++) {
    if (cb.isCancelled?.()) return;
    const completed = await runStep(steps[i], i, steps, context, cb);
    if (!completed) return;
  }

  const summary = resolveSummary(context);
  await cb.onDone?.(processType, summary.savedStats || {}, context);
}

function init(deps) {
  ProcessConfig = deps.ProcessConfig;
  ProcessModel = deps.ProcessModel;
}

export default {
  init,
  run
};
