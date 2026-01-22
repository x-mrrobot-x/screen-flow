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
    "clean-folder": {
      icon: "folder-minus",
      color: "orange",
      getTitle: data => {
        const mediaType = data.mediaType === "ss" ? "capturas" :
                         data.mediaType === "sr" ? "gravações" : "arquivos";
        return `Limpeza de Pasta (${mediaType})`;
      },
      getDescription: data => {
        const mediaType = data.mediaType === "ss" ? "capturas de tela" :
                         data.mediaType === "sr" ? "gravações de tela" : "arquivos";
        return `${data.count || 0} ${mediaType} removidos da pasta "${data.folder}"`;
      }
    },
    organize: {
      icon: "folder",
      color: "orange",
      getTitle: data => {
        const mediaType = data.mediaType === "recordings" ? "gravações" : "capturas";
        return data.execution === "auto"
          ? `Organização automática de ${mediaType}`
          : `Organização manual de ${mediaType}`;
      },
      getDescription: data => {
        const mediaType = data.mediaType === "recordings" ? "gravações" : "capturas";
        const base = `${data.count || 0} ${mediaType} organizadas`;
        return data.execution === "auto"
          ? `${base} organizadas automaticamente`
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
    },
    "auto-clean-folder-toggle": {
      icon: "toggle-right",
      color: "blue",
      getTitle: data =>
        data.enabled ? "Limpeza automática ativada" : "Limpeza automática desativada",
      getDescription: data => {
        const mediaType = data.feature.includes("screenshots") ? "capturas de tela" : "gravações de tela";
        return `Limpeza automática de ${mediaType} ${data.enabled ? "ativada" : "desativada"} na pasta "${data.folder}"`;
      },
      getIcon: data => (data.enabled ? "toggle-right" : "toggle-left"),
      getColor: data => (data.enabled ? "blue" : "gray")
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
