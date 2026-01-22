const ActivityHelper = (() => {
  "use strict";

  const ACTIVITY_CONFIG = {
    clean: {
      icon: "sparkles",
      color: "yellow",
      getTitle: data => {
        if (data.execution === "manual") return "Limpeza manual";
        return "Limpeza automática";
      },
      getDescription: data =>
        `${data.count || 0} arquivos ${
          data.execution === "manual" ? "removidos por usuário" : "removidos"
        }`
    },
    organize: {
      icon: "folder",
      color: "orange",
      getTitle: data =>
        data.execution === "auto"
          ? "Organização automática"
          : "Organização manual",
      getDescription: data => {
        const base = `${data.count || 0} arquivos`;
        return data.execution === "auto"
          ? `${base} organizados automaticamente`
          : base;
      }
    },
    "feature-toggle": {
      icon: "toggle-right",
      color: "green",
      getTitle: data =>
        data.enabled ? "Recursos ativados" : "Recursos desativados",
      getDescription: data => {
        const featureNames = {
          "auto-organize": "Organização Automática",
          "auto-clean": "Limpeza Automática"
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
