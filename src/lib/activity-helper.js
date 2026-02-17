const ActivityHelper = (() => {
  "use strict";

  const ACTIVITY_CONFIG = {
    cleaner: {
      icon: "broom",
      class: "icon-purple",
      getTitle: () => "Limpeza",
      getDescription: data => `${data.count || 0} arquivos excluídos.`
    },
    "cleaner-folder": {
      icon: "folder-minus",
      class: "icon-purple",
      getTitle: data => {
        const mediaType =
          data.mediaType === "ss"
            ? "Capturas"
            : data.mediaType === "sr"
            ? "Gravações"
            : "Arquivos";
        return `Limpeza de Pasta`;
      },
      getDescription: data => {
        const mediaType =
          data.mediaType === "ss"
            ? "capturas de tela"
            : data.mediaType === "sr"
            ? "gravações de tela"
            : "arquivos";
        return `${data.count || 0} ${mediaType} removidos da pasta "${
          data.folder
        }".`;
      }
    },
    organizer: {
      icon: "folder-open",
      class: "icon-green",
      getTitle: data => {
        const mediaType =
          data.mediaType === "recordings" ? "Gravações" : "Capturas";
        return `Organização de ${mediaType}`;
      },
      getDescription: data => {
        const mediaType =
          data.mediaType === "recordings" ? "gravações" : "capturas";
        return `${data.count || 0} ${mediaType} organizadas.`;
      }
    },
    "feature-toggle": {
      icon: "toggle-right",
      class: "icon-green",
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
      getClass: data => {
        if (!data.enabled) return "icon-gray";
        return data.feature.includes("cleaner") ? "icon-purple" : "icon-green";
      }
    },
    "cleaner-folder-toggle": {
      icon: "toggle-right",
      class: "icon-blue",
      getTitle: data =>
        data.enabled ? "Limpeza de Pasta" : "Limpeza de Pasta",
      getDescription: data => {
        const mediaType = data.feature.includes("screenshots")
          ? "capturas de tela"
          : "gravações de tela";
        return `Limpeza de ${mediaType} na pasta "${
          data.folder
        }" foi ${data.enabled ? "ativada" : "desativada"}.`;
      },
      getIcon: data => (data.enabled ? "toggle-right" : "toggle-left"),
      getClass: data => (data.enabled ? "icon-blue" : "icon-gray")
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
      class: config.getClass ? config.getClass(activity) : config.class,
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
              "class"
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
