const ActivityHelper = (() => {
  "use strict";

  const ACTIVITY_CONFIG = {
    clean: {
      icon: "sparkles",
      color: "yellow",
      getTitle: data => {
        if (data.scheduled) return "Limpeza agendada";
        if (data.manual) return "Limpeza manual";
        return "Limpeza automática";
      },
      getDescription: data =>
        `${data.count || 0} arquivos ${
          data.manual
            ? "removidos por usuário"
            : data.scheduled
            ? "antigos removidos"
            : "removidos"
        }`
    },
    organize: {
      icon: "folder",
      color: "orange",
      getTitle: data => (data.auto ? "Organização em massa" : "Organização"),
      getDescription: data => {
        const base = `${data.count || 0} ${data.category || "arquivos"}`;
        return data.auto ? `${base} organizados automaticamente` : base;
      }
    },
    settings: {
      icon: "settings",
      color: "blue",
      getTitle: () => "Alteração de configurações",
      getDescription: data => {
        const settingNames = {
          "dark-mode": "Modo escuro",
          notifications: "Notificações",
          "auto-backup": "Backup automático",
          "auto-organize": "Auto-organização",
          "auto-cleanup": "Auto-limpeza",
          "animations-enabled": "Animações"
        };
        const name = settingNames[data.setting] || data.setting;
        return `${name} ${data.value ? "ativado" : "desativado"}`;
      }
    },
    "feature-toggle": {
      icon: "toggle-right",
      color: "green",
      getTitle: data =>
        data.enabled ? "Recursos ativados" : "Recursos desativados",
      getDescription: data => {
        const featureNames = {
          "auto-organize": "Auto-organização",
          "auto-clean": "Auto-limpeza",
          "smart-sort": "Ordenação inteligente",
          notifications: "Notificações",
          animations: "Animações"
        };
        const name = featureNames[data.feature] || data.feature;
        return `${name} ${data.enabled ? "ativada" : "desativada"}`;
      },
      getIcon: data => (data.enabled ? "toggle-right" : "toggle-left"),
      getColor: data => (data.enabled ? "green" : "gray")
    }
  };

  function enrichActivity(activity) {
    const config = ACTIVITY_CONFIG[activity.type];
    if (!config) {
      return activity;
    }
    return {
      id: activity.id,
      type: activity.type,
      title: config.getTitle(activity),
      description: config.getDescription(activity),
      timestamp: activity.timestamp,
      icon: config.getIcon ? config.getIcon(activity) : config.icon,
      color: config.getColor ? config.getColor(activity) : config.color,
      ...Object.fromEntries(
        Object.entries(activity).filter(
          ([key]) =>
            ![
              "id",
              "type",
              "title",
              "description",
              "timestamp",
              "icon",
              "color"
            ].includes(key)
        )
      )
    };
  }

  function enrichActivities(activities) {
    return activities.map(enrichActivity);
  }

  return {
    enrichActivities
  };
})();
