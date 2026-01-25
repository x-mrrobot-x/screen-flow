const DEFAULT_STATS = {
  lastOrganizer: Date.now(),
  lastCleanup: Date.now() - 2 * 60 * 60 * 1000,
  pendingFiles: 89,
  organizerCaptures: 450,
  removedCaptures: 389
};

const DEFAULT_SETTINGS = {
  theme: "system",
  autoOrganizer: true,
  autoCleaner: false,
  notifications: true,
  animationsEnabled: true
};

const DEFAULT_TRANSLATIONS = {};

const DEFAULT_ACTIVITIES = [
  {
    id: "1",
    type: "clean",
    count: 156,
    execution: "auto",
    timestamp: Date.now() - 2 * 60 * 60 * 1000
  },
  {
    id: "2",
    type: "organizer",
    count: 34,
    execution: "manual",
    mediaType: "screenshots",
    timestamp: Date.now() - 5 * 60 * 60 * 1000
  },
  {
    id: "3",
    type: "organizer",
    count: 245,
    execution: "auto",
    mediaType: "recordings",
    timestamp: Date.now() - 8 * 60 * 60 * 1000
  },
  {
    id: "4",
    type: "clean",
    count: 12,
    execution: "auto",
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
  },
  {
    id: "5",
    type: "clean",
    count: 67,
    execution: "manual",
    timestamp: Date.now() - 1.5 * 24 * 60 * 60 * 1000
  },
  {
    id: "6",
    type: "feature-toggle",
    feature: "auto-organizer",
    enabled: true,
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
  },
  {
    id: "7",
    type: "feature-toggle",
    feature: "auto-cleaner",
    enabled: false,
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000
  }
];

const DEFAULT_FOLDERS = [
  {
    id: "1",
    name: "YouTube",
    pkg: "com.gold.android.youtube",
    stats: {
      ss: 45,
      sr: 32,
      lu: Date.now()
    },
    cleaner: {
      ss: { on: false, days: 30 },
      sr: { on: true, days: 30 }
    }
  },
  {
    id: "2",
    name: "Spotify",
    pkg: "com.spotify.music",
    stats: {
      ss: 12,
      sr: 0,
      lu: Date.now() - 3 * 24 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: false, days: 30 },
      sr: { on: false, days: 30 }
    }
  },
  {
    id: "3",
    name: "Google",
    pkg: "com.google.android.googlequicksearchbox",
    stats: {
      ss: 8,
      sr: 2,
      lu: Date.now() - 1 * 24 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: false, days: 14 },
      sr: { on: false, days: 14 }
    }
  },
  {
    id: "4",
    name: "Claude",
    pkg: "com.anthropic.claude",
    stats: {
      ss: 67,
      sr: 5,
      lu: Date.now() - 2 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: true, days: 7 },
      sr: { on: false, days: 7 }
    }
  },
  {
    id: "5",
    name: "Instagram",
    pkg: "com.instagram.android",
    stats: {
      ss: 124,
      sr: 15,
      lu: Date.now()
    },
    cleaner: {
      ss: { on: true, days: 30 },
      sr: { on: false, days: 30 }
    }
  },
  {
    id: "6",
    name: "Netflix",
    pkg: "com.netflix.mediaclient",
    stats: {
      ss: 7,
      sr: 15,
      lu: Date.now() - 5 * 24 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: false, days: 14 },
      sr: { on: true, days: 14 }
    }
  },
  {
    id: "7",
    name: "Clash Royale",
    pkg: "com.supercell.clashroyale",
    stats: {
      ss: 234,
      sr: 89,
      lu: Date.now() - 4 * 24 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: true, days: 14 },
      sr: { on: true, days: 14 }
    }
  },
  {
    id: "8",
    name: "X",
    pkg: "com.twitter.android",
    stats: {
      ss: 43,
      sr: 0,
      lu: Date.now() - 24 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: true, days: 14 },
      sr: { on: false, days: 14 }
    }
  },
  {
    id: "9",
    name: "WhatsApp",
    pkg: "com.whatsapp",
    stats: {
      ss: 156,
      sr: 12,
      lu: Date.now() - 2 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: false, days: 7 },
      sr: { on: false, days: 7 }
    }
  },
  {
    id: "10",
    name: "TikTok",
    pkg: "com.zhiliaoapp.musically",
    stats: {
      ss: 89,
      sr: 45,
      lu: Date.now() - 2 * 24 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: true, days: 7 },
      sr: { on: true, days: 7 }
    }
  },
  {
    id: "11",
    name: "AI Studio",
    pkg: "org.chromium.webapk.a6aab478f37ca7758_v2",
    stats: {
      ss: 54,
      sr: 8,
      lu: Date.now() - 6 * 24 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: true, days: 14 },
      sr: { on: false, days: 14 }
    }
  },
  {
    id: "12",
    name: "Telegram",
    pkg: "org.telegram.messenger",
    stats: {
      ss: 31,
      sr: 3,
      lu: Date.now() - 7 * 24 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: true, days: 7 },
      sr: { on: false, days: 7 }
    }
  }
];