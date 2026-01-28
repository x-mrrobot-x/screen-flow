const ProcessConfig = {
  SELECTORS: {
    modal: "#process-modal",
    title: "#modal-title",
    progressBar: "#modal-progress-bar",
    stepLabel: "#modal-step-label",
    percent: "#modal-percent",
    stepsContainer: "#modal-steps-container",
    completion: "#modal-completion",
    resultText: "#modal-result-text",
    closeBtn: "#process-modal-close"
  },

  PROCESS_TYPES: {
    organize_screenshots: {
      title: "Organizar Capturas de Tela",
      steps: [
        {
          id: "scan_screenshots",
          label: "Analisando capturas de tela",
          type: "shell",
          func: "scan_media_app_packages",
          params: () => ["jpg", ENV.SOURCE_SCREENSHOTS_PATH]
        },
        {
          id: "resolve_app_names",
          label: "Identificando aplicativos",
          type: "js",
          func: "resolveAppNames",
          params: ctx => [ctx.scan_screenshots]
        },
        {
          id: "create_app_folders",
          label: "Criando pastas dos aplicativos",
          type: "shell",
          func: "create_app_media_folders",
          params: ctx => [
            JSON.stringify([...new Set(Object.values(ctx.resolve_app_names))]),
            ENV.ORGANIZED_SCREENSHOTS_PATH
          ]
        },
        {
          id: "prepare_file_moves",
          label: "Preparando arquivos para organização",
          type: "js",
          func: "prepareScreenshotOrganization",
          params: ctx => [
            ctx.resolve_app_names,
            ENV.SOURCE_SCREENSHOTS_PATH,
            ENV.ORGANIZED_SCREENSHOTS_PATH,
            "jpg"
          ]
        },
        {
          id: "move_and_count",
          label: "Organizando capturas de tela",
          type: "shell",
          func: "run_batch_command",
          params: ctx => [
            ctx.prepare_file_moves.countCommand,
            ctx.prepare_file_moves.moveCommand
          ]
        },
        {
          id: "save_summary",
          label: "Salvando resumo da organização",
          type: "js",
          func: "saveScreenshotSummary",
          params: ctx => [
            "organize_screenshots",
            {
              moved: ctx.move_and_count.moved || 0,
              created: ctx.create_app_folders.created
            }
          ]
        }
      ]
    },

    organize_recordings: {
      title: "Organizar Gravações de Tela",
      steps: [
        {
          id: "scan_recordings",
          label: "Analisando gravações de tela",
          type: "shell",
          func: "scan_media_app_packages",
          params: () => ["mp4", ENV.SOURCE_RECORDINGS_PATH]
        },
        {
          id: "resolve_app_names",
          label: "Identificando aplicativos",
          type: "js",
          func: "resolveAppNames",
          params: ctx => [ctx.scan_recordings]
        },
        {
          id: "create_app_folders",
          label: "Criando pastas dos aplicativos",
          type: "shell",
          func: "create_app_media_folders",
          params: ctx => [
            JSON.stringify(Object.values(ctx.resolve_app_names)),
            ENV.ORGANIZED_RECORDINGS_PATH
          ]
        },
        {
          id: "prepare_file_moves",
          label: "Preparando arquivos para organização",
          type: "js",
          func: "prepareRecordingOrganization",
          params: ctx => [
            ctx.resolve_app_names,
            ENV.SOURCE_RECORDINGS_PATH,
            ENV.ORGANIZED_RECORDINGS_PATH,
            "mp4"
          ]
        },
        {
          id: "move_and_count",
          label: "Organizando gravações de tela",
          type: "shell",
          func: "run_batch_command",
          params: ctx => [
            ctx.prepare_file_moves.countCommand,
            ctx.prepare_file_moves.moveCommand
          ]
        },
        {
          id: "save_summary",
          label: "Salvando resumo da organização",
          type: "js",
          func: "saveRecordingSummary",
          params: ctx => [
            "organize_recordings",
            {
              moved: ctx.move_and_count.moved || 0,
              created: ctx.create_app_folders.created
            }
          ]
        }
      ]
    },

    cleanup_old_files: {
      title: "Limpeza de Arquivos Antigos",
      steps: [
        {
          id: "load_cleanup_rules",
          label: "Carregando regras de limpeza",
          type: "js",
          func: "loadCleanupRules",
          params: () => []
        },
        {
          id: "find_all_expired",
          label: "Localizando arquivos antigos",
          type: "js",
          func: "findAllExpiredMedia",
          params: ctx => [
            ctx.load_cleanup_rules,
            ENV.ORGANIZED_SCREENSHOTS_PATH,
            ENV.ORGANIZED_RECORDINGS_PATH
          ]
        },
        {
          id: "delete_all_expired",
          label: "Removendo arquivos antigos",
          type: "shell",
          func: "delete_files_batch",
          params: ctx => [JSON.stringify(ctx.find_all_expired.all)]
        },
        {
          id: "save_cleanup_summary",
          label: "Salvando resumo da limpeza",
          type: "js",
          func: "saveCleanupSummary",
          params: ctx => [
            "cleanup_old_files",
            {
              ss_removed: ctx.find_all_expired.screenshots.length,
              sr_removed: ctx.find_all_expired.recordings.length,
              total_removed: ctx.find_all_expired.all.length
            }
          ]
        }
      ]
    }
  }
};
