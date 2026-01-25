const ActivityHelper = (() => {
  "use strict";

  const ACTIVITY_CONFIG = {
    cleaner: {
      icon: "sparkles",
      color: "yellow",
      getTitle: data =>
        data.execution === "manual" ? "Limpeza Manual" : "Limpeza Automática",
      getDescription: data => `${data.count || 0} arquivos excluídos.`
    },
    "cleaner-folder": {
      icon: "folder-minus",
      color: "orange",
      getTitle: data => {
        const mediaType = data.mediaType === "ss" ? "Capturas" :
                         data.mediaType === "sr" ? "Gravações" : "Arquivos";
        return `Limpeza de Pasta (${mediaType})`;
      },
      getDescription: data => {
        const mediaType = data.mediaType === "ss" ? "capturas de tela" :
                         data.mediaType === "sr" ? "gravações de tela" : "arquivos";
        return `${data.count || 0} ${mediaType} removidos da pasta "${data.folder}".`;
      }
    },
    organizer: {
      icon: "folder",
      color: "orange",
      getTitle: data => {
        const mediaType = data.mediaType === "recordings" ? "Gravações" : "Capturas";
        return data.execution === "auto"
          ? `Organização Automática de ${mediaType}`
          : `Organização Manual de ${mediaType}`;
      },
      getDescription: data => {
        const mediaType = data.mediaType === "recordings" ? "gravações" : "capturas";
        return `${data.count || 0} ${mediaType} organizadas.`;
      }
    },
    "feature-toggle": {
      icon: "toggle-right",
      color: "green",
      getTitle: data => {
        const featureNames = {
          "auto-organizer": "Organização Automática",
          "auto-cleaner": "Limpeza Automática"
        };
        return featureNames[data.feature] || data.feature;
      },
      getDescription: data =>
        `Recurso ${data.enabled ? "ativado" : "desativado"}.`,
      getIcon: data => (data.enabled ? "toggle-right" : "toggle-left"),
      getColor: data => (data.enabled ? "green" : "gray")
    },
    "auto-cleaner-folder-toggle": {
      icon: "toggle-right",
      color: "blue",
      getTitle: data =>
        data.enabled
          ? "Limpeza de Pasta Ativada"
          : "Limpeza de Pasta Desativada",
      getDescription: data => {
        const mediaType = data.feature.includes("screenshots") ? "capturas de tela" : "gravações de tela";
        return `Limpeza automática de ${mediaType} na pasta "${data.folder}" foi ${data.enabled ? "ativada" : "desativada"}.`;
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
