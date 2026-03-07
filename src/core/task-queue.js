const TaskQueue = (function () {
  "use strict";

  const WORKER_TASK_PRIORITY = 9;
  const STOPPER_TASK_PRIORITY = 10;
  const TASK_CHECK_INTERVAL = 2000;
  const MAX_CHECKS = 180;
  const MAX_CONCURRENT_TASKS = 6;

  const queue = [];
  const pending = {};
  let activeTasks = 0;
  let taskIdCounter = 0;

  function buildTaskerParams(task) {
    const base = {
      id: task.id,
      action: task.action,
      commandName: task.action,
      params: task.params,
      type: task.type,
      fullCommand: null,
      scene: ENV.SCENE_NAME,
      webview: ENV.WEBVIEW_NAME
    };

    if (task.type === "shell") {
      const scriptPath = `${ENV.WORK_DIR}src/features/dashboard/process/script.sh`;
      const quotedArgs = (Array.isArray(task.params) ? task.params : [])
        .map(Utils.escapeShellArg)
        .join(" ");

      base.fullCommand = `sh "${scriptPath}" ${task.action} ${quotedArgs}`;
      base.action = "run_shell";
    }

    return base;
  }

  function startHeartbeatMonitor(task) {
    let checks = 0;
    const interval = setInterval(() => {
      checks++;

      if (!pending[task.id]) {
        clearInterval(interval);
        return;
      }

      if (!ENV.isTaskRunning(ENV.TASKER.TASKS.QUEUE)) {
        clearInterval(interval);
        resolveTask(task.id, "error", "Worker task disappeared.");
      } else if (checks >= MAX_CHECKS) {
        clearInterval(interval);
        resolveTask(task.id, "error", "Task timed out.");
      }
    }, TASK_CHECK_INTERVAL);

    return interval;
  }

  function resolveTask(id, status, payload) {
    const task = pending[id];
    if (!task) return;

    clearInterval(task.monitorInterval);

    if (status === "success") task.onSuccess(payload);
    else task.onError(payload);

    delete pending[id];
    activeTasks--;
    setTimeout(runNext, 0);
  }

  function runNext() {
    while (activeTasks < MAX_CONCURRENT_TASKS && queue.length > 0) {
      activeTasks++;
      const task = queue.shift();
      task.monitorInterval = startHeartbeatMonitor(task);
      pending[task.id] = task;

      const taskerParams = buildTaskerParams(task);
      ENV.runTask(
        ENV.TASKER.TASKS.QUEUE,
        WORKER_TASK_PRIORITY,
        JSON.stringify(taskerParams)
      );
    }
  }

  function onResult(resultJson) {
    try {
      const { id, status, payload } =
        typeof resultJson === "string" ? JSON.parse(resultJson) : resultJson;

      if (!pending[id]) {
        Logger.error(`[TaskQueue] Task ID ${id} not found in pending.`);
        return;
      }

      resolveTask(id, status, payload);
    } catch (error) {
      Logger.error("[TaskQueue] Failed to process result:", {
        error,
        resultJson
      });
      activeTasks = Math.max(0, activeTasks - 1);
      setTimeout(runNext, 0);
    }
  }

  function add(action, params = [], type = "default") {
    return new Promise((resolve, reject) => {
      const taskId = ++taskIdCounter;
      queue.push({
        id: taskId,
        action,
        params,
        type,
        onSuccess: resolve,
        onError: reject
      });
      runNext();
    });
  }

  function cancelAll() {
    queue.length = 0;

    const runningIds = Object.keys(pending);
    if (runningIds.length === 0) return;
    ENV.runTask(
      ENV.TASKER.TASKS.STOP_QUEUE,
      STOPPER_TASK_PRIORITY,
      ENV.TASKER.TASKS.QUEUE
    );

    for (const id of runningIds) {
      const task = pending[id];
      clearInterval(task.monitorInterval);
      task.onError("Cancelled");
      delete pending[id];
    }

    activeTasks = 0;
  }

  return {
    add,
    onResult,
    cancelAll
  };
})();
