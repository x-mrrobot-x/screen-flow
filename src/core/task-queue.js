const TaskQueue = (function () {
  const WORKER_TASK_NAME = "SO - FILE QUEUE WORKER";
  const WORKER_TASK_PRIORITY = 9;
  const STOPPER_TASK_NAME = "SO - STOP WORKER TASK";
  const STOPPER_TASK_PRIORITY = 10;
  const TASK_CHECK_INTERVAL = 1000; // 1 segundo
  const MAX_CHECKS = 180; // 3 minutos no total

  const queue = [];
  const pending = {};
  let isRunning = false;
  let taskIdCounter = 0;

  function _runNext() {
    if (isRunning || queue.length === 0) {
      return;
    }
    isRunning = true;

    const task = queue.shift();
    pending[task.id] = task;

    let checks = 0;
    const monitorInterval = setInterval(() => {
      checks++;
      const runningTasks = ENV.getGlobal("TRUN");

      if (
        (!runningTasks || !runningTasks.includes(WORKER_TASK_NAME)) &&
        pending[task.id]
      ) {
        Logger.warn(
          `[TaskQueue] Worker task not running. Cancelling task ${task.id}.`
        );
        clearInterval(monitorInterval);
        onResult(
          JSON.stringify({
            id: task.id,
            status: "error",
            payload: "Worker task disappeared."
          })
        );
      } else if (checks >= MAX_CHECKS) {
        Logger.error(`[TaskQueue] Task ${task.id} timed out.`);
        clearInterval(monitorInterval);
        onResult(
          JSON.stringify({
            id: task.id,
            status: "error",
            payload: "Task timed out"
          })
        );
      }
    }, TASK_CHECK_INTERVAL);

    task.monitorInterval = monitorInterval;

    Logger.debug(
      `[TaskQueue] Running task ${task.id}: ${task.action}`,
      task.params
    );

    const taskerParams = {
      id: task.id,
      action: task.action,
      params: task.params,
      type: task.type,
      fullCommand: null
    };

    if (task.type === "shell") {
      const scriptPath = `${ENV.WORK_DIR}src/features/dashboard/process/script.sh`;
      const command = task.action;
      const args = Array.isArray(task.params) ? task.params : [];

      const quotedArgs = args
        .map(arg => {
          const argStr =
            typeof arg === "object" && arg !== null
              ? JSON.stringify(arg)
              : String(arg);
          return "'" + argStr.replace(/'/g, "'\\''") + "'";
        })
        .join(" ");

      taskerParams.fullCommand = `sh "${scriptPath}" ${command} ${quotedArgs}`;
      taskerParams.action = `run_shell`;
      Logger.debug(
        `[TaskQueue] Generated full command for shell task: ${taskerParams.fullCommand}`
      );
    }

    ENV.runTask(
      WORKER_TASK_NAME,
      WORKER_TASK_PRIORITY,
      JSON.stringify(taskerParams)
    );
  }

  function onResult(resultJson) {
    Logger.debug("[TaskQueue] Received result from Tasker:", resultJson);
    try {
      const { id, status, payload } =
        typeof resultJson === "string" ? JSON.parse(resultJson) : resultJson;

      const task = pending[id];
      if (!task) {
        Logger.error(
          `[TaskQueue] Task with ID ${id} not found in pending list.`
        );
        return;
      }

      clearInterval(task.monitorInterval);

      if (status === "success" && task.onSuccess) {
        task.onSuccess(payload);
      } else if (status === "error" && task.onError) {
        task.onError(payload);
      }

      delete pending[id];
      isRunning = false;

      setTimeout(_runNext, 0);
    } catch (error) {
      Logger.error("[TaskQueue] Failed to parse result from Tasker:", {
        error,
        resultJson
      });
      isRunning = false;
      setTimeout(_runNext, 0);
    }
  }

  function add(action, params = {}, type = "default") {
    return new Promise((resolve, reject) => {
      const taskId = ++taskIdCounter;
      Logger.debug(
        `[TaskQueue] Adding new task ${taskId}: ${action} (type: ${type})`
      );

      queue.push({
        id: taskId,
        action: action,
        params: params,
        type: type,
        onSuccess: resolve,
        onError: reject
      });

      _runNext();
    });
  }

  function init() {
    Logger.info("TaskQueue initialized.");
  }

  function cancelCurrentTask() {
    Logger.warn(`[TaskQueue] Attempting to cancel current task via ${STOPPER_TASK_NAME}.`);
    const pendingTaskId = Object.keys(pending)[0];
    if (!pendingTaskId) {
      Logger.warn("[TaskQueue] No pending task to cancel.");
      return;
    }

    const task = pending[pendingTaskId];

    // Run the dedicated stopper task, passing the worker task's name as a parameter.
    ENV.runTask(STOPPER_TASK_NAME, STOPPER_TASK_PRIORITY, WORKER_TASK_NAME);

    clearInterval(task.monitorInterval);
    task.onError("Cancelled");

    delete pending[pendingTaskId];
    isRunning = false;

    setTimeout(_runNext, 0);
  }

  return {
    init,
    add,
    onResult,
    cancelCurrentTask
  };
})();
