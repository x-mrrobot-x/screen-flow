const ACTIVITY_CONFIG = {
  clean: {
    icon: "sparkles",
    color: "yellow"
  },
  organize: {
    icon: "folder",
    color: "orange"
  },
  settings: {
    icon: "settings",
    color: "blue"
  },
  "feature-toggle": {
    icon: "toggle-right",
    color: "green"
  }
};

const EVENTS = {
  DASHBOARD_LOADED: "dashboard:loaded",
  STATE_CHANGED: "state:changed",
  SHOW_TOAST: "toast:show"
};

const STORAGE_KEYS = {
  PREFIX: "screenflow.v1",
  FOLDERS: "screenflow.v1.folders",
  STATE: "screenflow.v1.state",
  ACTIVITIES: "screenflow.v1.activities"
};

const CSS_CLASSES = {
  ACTIVE: "active",
  OPEN: "open",
  VISIBLE: "visible",
  HIDDEN: "hidden"
};