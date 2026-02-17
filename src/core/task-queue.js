const TaskQueue = (function () {
  const WORKER_TASK_NAME = "SO - FILE QUEUE WORKER";
  const WORKER_TASK_PRIORITY = 9;
  const STOPPER_TASK_NAME = "SO - STOP WORKER TASK";
  const STOPPER_TASK_PRIORITY = 10;
  const TASK_CHECK_INTERVAL = 2000; // 1 segundo
  const MAX_CHECKS = 180; // 3 minutos no total
  const MAX_CONCURRENT_TASKS = 6; // Limite de tarefas paralelas

  const queue = [];
  const pending = {};
  let activeTasks = 0;
  let taskIdCounter = 0;

  function _runNext() {
    while (activeTasks < MAX_CONCURRENT_TASKS && queue.length > 0) {
      activeTasks++;
      const task = queue.shift();
      pending[task.id] = task;

      let checks = 0;
      const monitorInterval = setInterval(() => {
        checks++;
        const isWorkerRunning = ENV.isTaskRunning(WORKER_TASK_NAME);
        if (!isWorkerRunning && pending[task.id]) {
          Logger.warn(
            `[TaskQueue] Worker task not running for task ${task.id}. Cancelling.`
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
        // Logger.debug(
        //   `[TaskQueue] Generated full command for shell task: ${taskerParams.fullCommand}`
        // );
      }

      ENV.runTask(
        WORKER_TASK_NAME,
        WORKER_TASK_PRIORITY,
        JSON.stringify(taskerParams)
      );
    }
  }

  function onResult(resultJson) {
    // Logger.debug(
    //   `[TaskQueue] Received result from ${resultJson?.id} from Tasker:`,
    //   resultJson
    // );
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
      activeTasks--;

      setTimeout(_runNext, 0);
    } catch (error) {
      Logger.error("[TaskQueue] Failed to parse result from Tasker:", {
        error,
        resultJson
      });
      if (pending[error?.id]) {
        delete pending[error.id];
        activeTasks--;
      }
      setTimeout(_runNext, 0);
    }
  }

  function add(action, params = {}, type = "default") {
    return new Promise((resolve, reject) => {
      const taskId = ++taskIdCounter;
      // Logger.debug(
      //   `[TaskQueue] Adding new task ${taskId}: ${action} (type: ${type})`
      // );

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

  function cancelAll() {
    Logger.warn(`[TaskQueue] Cancelling all tasks.`);

    // Cancela tarefas que estão na fila de espera
    queue.length = 0;

    // Cancela tarefas que estão em execução
    const runningTaskIds = Object.keys(pending);
    if (runningTaskIds.length === 0) {
      Logger.warn("[TaskQueue] No pending tasks to cancel.");
      return;
    }

    runningTaskIds.forEach(id => {
      const task = pending[id];
      ENV.runTask(STOPPER_TASK_NAME, STOPPER_TASK_PRIORITY, WORKER_TASK_NAME);
      clearInterval(task.monitorInterval);
      task.onError("Cancelled");
      delete pending[id];
    });

    activeTasks = 0;
    setTimeout(_runNext, 0);
  }

  return {
    init,
    add,
    onResult,
    cancelAll
  };
})();
