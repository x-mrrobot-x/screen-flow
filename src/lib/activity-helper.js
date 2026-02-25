const ActivityHelper = (() => {
  "use strict";

  const MEDIA_LABEL = {
    ss: "capturas de tela",
    sr: "gravações de tela",
    screenshots: "capturas",
    recordings: "gravações",
  };

  const MEDIA_LABEL_TITLE = {
    screenshots: "Capturas",
    recordings: "Gravações",
  };

  const FEATURE_NAMES = {
    "auto-organizer": "Organização Automática",
    "auto-cleaner": "Limpeza Automática",
  };

  const ACTIVITY_CONFIG = {
    cleaner: {
      icon: "broom",
      class: "icon-purple",
      getTitle: () => "Limpeza",
      getDescription: (data) => `${data.count || 0} arquivos excluídos.`,
    },

    "cleaner-folder": {
      icon: "folder-minus",
      class: "icon-purple",
      getTitle: () => "Limpeza de Pasta",
      getDescription: (data) => {
        const media = MEDIA_LABEL[data.mediaType] ?? "arquivos";
        return `${data.count || 0} ${media} removidos da pasta "${data.folder}".`;
      },
    },

    organizer: {
      icon: "folder-open",
      class: "icon-green",
      getTitle: (data) => {
        const label = MEDIA_LABEL_TITLE[data.mediaType] ?? "Arquivos";
        return `Organização de ${label}`;
      },
      getDescription: (data) => {
        const media = MEDIA_LABEL[data.mediaType] ?? "arquivos";
        return `${data.count || 0} ${media} organizadas.`;
      },
    },

    "feature-toggle": {
      icon: "toggle-right",
      class: "icon-green",
      getTitle: (data) => FEATURE_NAMES[data.feature] ?? data.feature,
      getDescription: (data) =>
        `Recurso ${data.enabled ? "ativado" : "desativado"}.`,
      getIcon: (data) => (data.enabled ? "toggle-right" : "toggle-left"),
      getClass: (data) => {
        if (!data.enabled) return "icon-gray";
        return data.feature.includes("cleaner") ? "icon-purple" : "icon-green";
      },
    },

    "cleaner-folder-toggle": {
      icon: "toggle-right",
      class: "icon-blue",
      getTitle: () => "Limpeza de Pasta",
      getDescription: (data) => {
        const media = data.feature.includes("screenshots")
          ? "capturas de tela"
          : "gravações de tela";
        return `Limpeza de ${media} na pasta "${data.folder}" foi ${data.enabled ? "ativada" : "desativada"}.`;
      },
      getIcon: (data) => (data.enabled ? "toggle-right" : "toggle-left"),
      getClass: (data) => (data.enabled ? "icon-blue" : "icon-gray"),
    },
  };

  const OVERRIDDEN_KEYS = new Set([
    "id",
    "type",
    "title",
    "description",
    "timestamp",
    "icon",
    "class",
  ]);

  function enrichActivity(activity) {
    const config = ACTIVITY_CONFIG[activity.type];
    if (!config) return activity;

    const extra = {};
    for (const [key, value] of Object.entries(activity)) {
      if (!OVERRIDDEN_KEYS.has(key)) extra[key] = value;
    }

    return {
      id: activity.id,
      type: activity.type,
      timestamp: activity.timestamp,
      title: config.getTitle(activity),
      description: config.getDescription(activity),
      icon: config.getIcon ? config.getIcon(activity) : config.icon,
      class: config.getClass ? config.getClass(activity) : config.class,
      ...extra,
    };
  }

  function enrichActivities(activities) {
    return activities.map(enrichActivity);
  }

  return { enrichActivities };
})();
