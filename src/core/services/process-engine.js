import TaskQueue from "../platform/task-queue.js";
import Logger from "../platform/logger.js";

function executeShellStep(step, context) {
  return TaskQueue.add(step.func, step.params(context), "shell");
}

function executeJsStep(step, context, jsExecutor) {
  return jsExecutor(step.func, step.params(context));
}

async function executeStep(step, context, jsExecutor) {
  if (step.type === "shell") return executeShellStep(step, context);
  if (step.type === "js") return executeJsStep(step, context, jsExecutor);
  throw new Error(`[ProcessEngine] Unknown step type: "${step.type}"`);
}

function isEmptyResult(step, result) {
  if (step.id === "scan_screenshots") return result.length === 0;
  if (step.id === "scan_recordings") return result.length === 0;
  if (step.id === "find_all_expired") return result.all.length === 0;
  return false;
}

function resolveSummary(context) {
  return context.save_summary || context.save_cleanup_summary || {};
}

function extractCallbacks(callbacks) {
  const { isCancelled, onStepStart, onStepComplete, onEmpty, onDone, onError } =
    callbacks;
  return { isCancelled, onStepStart, onStepComplete, onEmpty, onDone, onError };
}

async function handleStepResult(step, index, result, callbacks) {
  if (isEmptyResult(step, result)) {
    await callbacks.onEmpty?.(step.id);
    return false;
  }
  await callbacks.onStepComplete?.(index, step);
  return true;
}

async function runStep(step, index, context, callbacks, jsExecutor) {
  await callbacks.onStepStart?.(index, step);

  try {
    const result = await executeStep(step, context, jsExecutor);
    context[step.id] = result;
    Logger.debug("[ProcessEngine] step result", step.id, result);
    return handleStepResult(step, index, result, callbacks);
  } catch (error) {
    if (callbacks.isCancelled?.()) return false;
    await callbacks.onError?.(error, step, index);
    return false;
  }
}

async function runSteps(steps, context, callbacks, jsExecutor) {
  for (let i = 0; i < steps.length; i++) {
    if (callbacks.isCancelled?.()) return false;
    const completed = await runStep(
      steps[i],
      i,
      context,
      callbacks,
      jsExecutor
    );
    if (!completed) return false;
  }
  return true;
}

async function run(steps, callbacks = {}, options = {}, jsExecutor = () => {}) {
  const { execution = "manual" } = options;
  const cb = extractCallbacks(callbacks);
  const context = { executionMode: execution };

  const completed = await runSteps(steps, context, cb, jsExecutor);
  if (!completed) return;

  const summary = resolveSummary(context);
  await cb.onDone?.(summary.savedStats || {}, context);
}

export default {
  run
};
