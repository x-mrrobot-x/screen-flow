const TaskQueue = (function () {
  const queue = [];
  const pending = {};
  let isRunning = false;
  let taskIdCounter = 0;

  // A Task do Tasker que vai executar tudo
  const WORKER_TASK_NAME = "JS_WORKER_TASK";
  const WORKER_TASK_PRIORITY = 9; // Prioridade um pouco menor que a principal

  function _runNext() {
    if (isRunning || queue.length === 0) {
      return;
    }
    isRunning = true;

    const task = queue.shift();
    pending[task.id] = task;

    Logger.debug(
      `[TaskQueue] Running task ${task.id}: ${task.action}`,
      task.params
    );

    // Estrutura de dados enviada para a Task Worker
    const taskerParams = {
      id: task.id,
      action: task.action,
      params: task.params,
      type: task.type, // Envia o tipo da tarefa para o Tasker
      fullCommand: null // Valor padrão
    };

    if (task.type === "shell") {
      const scriptPath = `${ENV.WORK_DIR}src/features/dashboard/process/script.sh`;
      const command = task.action;
      // Garante que os argumentos sejam sempre um array para o .map funcionar
      const args = Array.isArray(task.params) ? task.params : [];

      const quotedArgs = args
        .map(arg => {
          const argStr =
            typeof arg === "object" && arg !== null
              ? JSON.stringify(arg)
              : String(arg);
          // Escapa aspas simples para o shell
          return "'" + argStr.replace(/'/g, "'\\''") + "'";
        })
        .join(" ");

      taskerParams.fullCommand = `sh "${scriptPath}" ${command} ${quotedArgs}`;
      Logger.debug(
        `[TaskQueue] Generated full command for shell task: ${taskerParams.fullCommand}`
      );
    }

    // O ponto central que chama o Tasker
    ENV.runTask(
      WORKER_TASK_NAME,
      WORKER_TASK_PRIORITY,
      JSON.stringify(taskerParams) // Passamos tudo como um único JSON
    );
  }

  /**
   * Ponto de entrada que o Tasker chamará com o resultado.
   * Esta função deve ser acessível globalmente.
   * @param {string} resultJson - Um JSON string contendo { id, status, payload }
   */
  function onResult(resultJson) {
    Logger.debug("[TaskQueue] Received result from Tasker:", resultJson);
    try {
      const { id, status, payload } = resultJson;

      const task = pending[id];
      if (!task) {
        Logger.error(
          `[TaskQueue] Task with ID ${id} not found in pending list.`
        );
        return;
      }

      if (status === "success" && task.onSuccess) {
        task.onSuccess(payload);
      } else if (status === "error" && task.onError) {
        task.onError(payload);
      }

      delete pending[id];
      isRunning = false;

      // Tenta executar a próxima tarefa da fila
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

  /**
   * Adiciona uma nova tarefa à fila.
   * @param {string} action - A ação que o worker deve executar (ex: 'load_apps').
   * @param {object} params - Parâmetros para a ação.
   * @param {string} type - O tipo de tarefa ('default', 'shell').
   * @returns {Promise<any>} - Uma promessa que resolve ou rejeita quando a tarefa é concluída.
   */
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
        type: type, // Armazena o tipo da tarefa
        onSuccess: resolve,
        onError: reject
      });

      _runNext();
    });
  }

  function init() {
    Logger.info("TaskQueue initialized.");
  }

  return {
    init,
    add,
    onResult // Exposto para ser chamado globalmente
  };
})();
