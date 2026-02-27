const ProcessConfig = {
  PROCESS_TYPES: {
    organize_screenshots: {
      titleKey: "process.organize_screenshots_title",
      steps: [
        {
          id: "scan_screenshots",
          labelKey: "process.step_scan_screenshots",
          type: "shell",
          func: "scan_media_app_packages",
          params: () => ["jpg", ENV.SOURCE_SCREENSHOTS_PATH]
        },
        {
          id: "resolve_app_names",
          labelKey: "process.step_resolve_apps",
          type: "js",
          func: "resolveAppNames",
          params: ctx => [ctx.scan_screenshots]
        },
        {
          id: "create_app_folders",
          labelKey: "process.step_create_folders",
          type: "shell",
          func: "create_app_media_folders",
          params: ctx => [
            JSON.stringify([...new Set(Object.values(ctx.resolve_app_names))]),
            ENV.ORGANIZED_SCREENSHOTS_PATH
          ]
        },
        {
          id: "prepare_file_moves",
          labelKey: "process.step_prepare_moves",
          type: "js",
          func: "prepareMediaOrganization",
          params: ctx => [
            ctx.resolve_app_names,
            ENV.SOURCE_SCREENSHOTS_PATH,
            ENV.ORGANIZED_SCREENSHOTS_PATH,
            "jpg"
          ]
        },
        {
          id: "move_and_count",
          labelKey: "process.step_move_screenshots",
          type: "shell",
          func: "run_batch_command",
          params: ctx => [
            ctx.prepare_file_moves.countCommand,
            ctx.prepare_file_moves.moveCommand
          ]
        },
        {
          id: "save_summary",
          labelKey: "process.step_save_summary",
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
      titleKey: "process.organize_recordings_title",
      steps: [
        {
          id: "scan_recordings",
          labelKey: "process.step_scan_recordings",
          type: "shell",
          func: "scan_media_app_packages",
          params: () => ["mp4", ENV.SOURCE_RECORDINGS_PATH]
        },
        {
          id: "resolve_app_names",
          labelKey: "process.step_resolve_apps",
          type: "js",
          func: "resolveAppNames",
          params: ctx => [ctx.scan_recordings]
        },
        {
          id: "create_app_folders",
          labelKey: "process.step_create_folders",
          type: "shell",
          func: "create_app_media_folders",
          params: ctx => [
            JSON.stringify(Object.values(ctx.resolve_app_names)),
            ENV.ORGANIZED_RECORDINGS_PATH
          ]
        },
        {
          id: "prepare_file_moves",
          labelKey: "process.step_prepare_moves",
          type: "js",
          func: "prepareMediaOrganization",
          params: ctx => [
            ctx.resolve_app_names,
            ENV.SOURCE_RECORDINGS_PATH,
            ENV.ORGANIZED_RECORDINGS_PATH,
            "mp4"
          ]
        },
        {
          id: "move_and_count",
          labelKey: "process.step_move_recordings",
          type: "shell",
          func: "run_batch_command",
          params: ctx => [
            ctx.prepare_file_moves.countCommand,
            ctx.prepare_file_moves.moveCommand
          ]
        },
        {
          id: "save_summary",
          labelKey: "process.step_save_summary",
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
      titleKey: "process.cleanup_title",
      steps: [
        {
          id: "load_cleanup_rules",
          labelKey: "process.step_load_rules",
          type: "js",
          func: "loadCleanupRules",
          params: () => []
        },
        {
          id: "find_all_expired",
          labelKey: "process.step_find_expired",
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
          labelKey: "process.step_delete_expired",
          type: "shell",
          func: "delete_files_batch",
          params: ctx => [JSON.stringify(ctx.find_all_expired.all)]
        },
        {
          id: "save_cleanup_summary",
          labelKey: "process.step_save_cleanup",
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
