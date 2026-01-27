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
    organizer_screenshots: {
      title: "Organizando Capturas de Tela",
      steps: [
        {
          id: "list",
          label: "Listando capturas de tela",
          type: "shell",
          func: "list_files",
          params: () => ["jpg", "/storage/emulated/0/DCIM/Screenshots"]
        },
        {
          id: "extract",
          label: "Extraindo nomes de pacotes",
          type: "js",
          func: "extractAppNames",
          params: ctx => [ctx.list, "jpg"]
        },
        {
          id: "resolve_names",
          label: "Resolvendo nomes dos aplicativos",
          type: "js",
          func: "mapPackageNamesToAppNames",
          params: ctx => [ctx.extract]
        },
        {
          id: "create_folders",
          label: "Criando pastas dos apps",
          type: "shell",
          func: "create_app_folders",
          params: ctx => [
            JSON.stringify(Object.values(ctx.resolve_names)),
            "/storage/emulated/0/OrganizedMedia/Screenshots"
          ]
        },
        {
          id: "build_move_commands",
          label: "Construindo comandos para mover",
          type: "js",
          func: "buildMoveCommands",
          params: ctx => [
            ctx.resolve_names,
            "/storage/emulated/0/DCIM/Screenshots",
            "/storage/emulated/0/OrganizedMedia/Screenshots",
            "jpg"
          ]
        },
        {
          id: "move",
          label: "Movendo capturas de tela",
          type: "shell",
          func: "execute_move_commands",
          params: ctx => [
            ctx.build_move_commands
          ]
        },
        {
          id: "update_data",
          label: "Finalizando organização",
          type: "js",
          func: "updateProcessData",
          params: ctx => [
            "organizer_screenshots",
            { moved: ctx.move.moved, created: ctx.create_folders.created }
          ]
        }
      ]
    },
    organizer_recordings: {
      title: "Organizando Gravações de Tela",
      steps: [
        {
          id: "list",
          label: "Listando gravações de tela",
          type: "shell",
          func: "list_files",
          params: () => ["mp4", "/storage/emulated/0/DCIM/ScreenRecorder"]
        },
        {
          id: "extract",
          label: "Extraindo nomes de pacotes",
          type: "js",
          func: "extractAppNames",
          params: ctx => [ctx.list, "mp4"]
        },
        {
          id: "resolve_names",
          label: "Resolvendo nomes dos aplicativos",
          type: "js",
          func: "mapPackageNamesToAppNames",
          params: ctx => [ctx.extract]
        },
        {
          id: "create_folders",
          label: "Criando pastas dos apps",
          type: "shell",
          func: "create_app_folders",
          params: ctx => [
            JSON.stringify(Object.values(ctx.resolve_names)),
            "/storage/emulated/0/OrganizedMedia/Recordings"
          ]
        },
        {
          id: "build_move_commands",
          label: "Construindo comandos para mover",
          type: "js",
          func: "buildMoveCommands",
          params: ctx => [
            ctx.resolve_names,
            "/storage/emulated/0/DCIM/ScreenRecorder",
            "/storage/emulated/0/OrganizedMedia/Recordings",
            "mp4"
          ]
        },
        {
          id: "move",
          label: "Movendo gravações de tela",
          type: "shell",
          func: "execute_move_commands",
          params: ctx => [
            ctx.build_move_commands
          ]
        },
        {
          id: "update_data",
          label: "Finalizando organização",
          type: "js",
          func: "updateProcessData",
          params: ctx => [
            "organizer_recordings",
            { moved: ctx.move.moved, created: ctx.create_folders.created }
          ]
        }
      ]
    },
    clean_old_files: {
      title: "Limpando Arquivos Antigos",
      steps: [
        {
          id: "load_config",
          label: "Carregando configurações de limpeza",
          type: "js",
          func: "loadCleanerConfig",
          params: () => []
        },
        {
          id: "list_ss",
          label: "Listando capturas expiradas",
          type: "js",
          func: "listAllExpired",
          params: ctx => [ctx.load_config.screenshots, "jpg"]
        },
        {
          id: "list_sr",
          label: "Listando gravações expiradas",
          type: "js",
          func: "listAllExpired",
          params: ctx => [ctx.load_config?.recordings || [], "mp4"]
        },
        {
          id: "remove_ss",
          label: "Removendo capturas expiradas",
          type: "shell",
          func: "remove_files",
          params: ctx => [JSON.stringify(ctx.list_ss)]
        },
        {
          id: "remove_sr",
          label: "Removendo gravações expiradas",
          type: "shell",
          func: "remove_files",
          params: ctx => [JSON.stringify(ctx.list_sr)]
        },
        {
          id: "update_data",
          label: "Finalizando limpeza",
          type: "js",
          func: "updateProcessData",
          params: ctx => [
            "clean_old_files",
            {
              ss_removed: ctx.remove_ss.removed,
              sr_removed: ctx.remove_sr.removed,
              total_removed: ctx.remove_ss.removed + ctx.remove_sr.removed
            }
          ]
        }
      ]
    }
  }
};
