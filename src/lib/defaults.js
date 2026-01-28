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
    type: "cleaner",
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
    type: "cleaner",
    count: 12,
    execution: "auto",
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
  },
  {
    id: "5",
    type: "cleaner",
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

const DEFAULT_APPS = [
  {
    name: "Câmera",
    package: "com.android.camera"
  },
  {
    name: "Chrome",
    package: "com.android.chrome"
  },
  {
    name: "Relógio",
    package: "com.android.deskclock"
  },
  {
    name: "Configurações",
    package: "com.android.settings"
  },
  {
    name: "Gravador",
    package: "com.android.soundrecorder"
  },
  {
    name: "Temas",
    package: "com.android.thememanager"
  },
  {
    name: "Google Play Store",
    package: "com.android.vending"
  },
  {
    name: "Maps",
    package: "com.google.android.apps.maps"
  },
  {
    name: "Mensagens",
    package: "com.google.android.apps.messaging"
  },
  {
    name: "Agenda",
    package: "com.google.android.calendar"
  },
  {
    name: "Contatos",
    package: "com.google.android.contacts"
  },
  {
    name: "Telefone",
    package: "com.google.android.dialer"
  },
  {
    name: "Gmail",
    package: "com.google.android.gm"
  },
  {
    name: "Gerenciador de Arquivos",
    package: "com.mi.android.globalFileexplorer"
  },
  {
    name: "Calculadora",
    package: "com.miui.calculator"
  },
  {
    name: "Galeria",
    package: "com.miui.gallery"
  },
  {
    name: "Serviços e Feedback",
    package: "com.miui.miservice"
  },
  {
    name: "Anotações",
    package: "com.miui.notes"
  },
  {
    name: "Clima",
    package: "com.miui.weather2"
  },
  {
    name: "Centro de Jogos",
    package: "com.xiaomi.glgm"
  },
  {
    name: "Digitalizador",
    package: "com.xiaomi.scanner"
  },
  {
    name: "Retro Music",
    package: "code.name.monkey.retromusic"
  },
  {
    name: "App Usage",
    package: "com.a0soft.gphone.uninstaller"
  },
  {
    name: "Brave",
    package: "com.brave.browser"
  },
  {
    name: "Lera",
    package: "com.changdu.portugalreader"
  },
  {
    name: "YouTube Pro",
    package: "com.gold.android.youtube"
  },
  {
    name: "Drive",
    package: "com.google.android.apps.docs"
  },
  {
    name: "Meet",
    package: "com.google.android.apps.tachyon"
  },
  {
    name: "Google Play Games",
    package: "com.google.android.play.games"
  },
  {
    name: "Outlook",
    package: "com.microsoft.office.outlook"
  },
  {
    name: "MiXplorer",
    package: "com.mixplorer.silver"
  },
  {
    name: "PayPal",
    package: "com.paypal.android.p2pmobile"
  },
  {
    name: "PicPay",
    package: "com.picpay"
  },
  {
    name: "Pinterest",
    package: "com.pinterest"
  },
  {
    name: "Shazam",
    package: "com.shazam.android"
  },
  {
    name: "Spotify",
    package: "com.spotify.music"
  },
  {
    name: "Tasker",
    package: "net.dinglisch.android.taskerm"
  },
  {
    name: "Downloads",
    package: "com.android.providers.downloads.ui"
  },
  {
    name: "SIM Claro",
    package: "com.android.stk"
  },
  {
    name: "Assistente",
    package: "com.google.android.apps.googleassistant"
  },
  {
    name: "Emergência pessoal",
    package: "com.google.android.apps.safetyhub"
  },
  {
    name: "Google One",
    package: "com.google.android.apps.subscriptions.red"
  },
  {
    name: "Google",
    package: "com.google.android.googlequicksearchbox"
  },
  {
    name: "App vault",
    package: "com.mi.globalminusscreen"
  },
  {
    name: "Bússola",
    package: "com.miui.compass"
  },
  {
    name: "Rádio FM",
    package: "com.miui.fm"
  },
  {
    name: "Música",
    package: "com.miui.player"
  },
  {
    name: "Gravador de Tela",
    package: "com.miui.screenrecorder"
  },
  {
    name: "Segurança",
    package: "com.miui.securitycenter"
  },
  {
    name: "Mi Vídeo",
    package: "com.miui.videoplayer"
  },
  {
    name: "ShareMe",
    package: "com.xiaomi.midrop"
  },
  {
    name: "GetApps",
    package: "com.xiaomi.mipicks"
  },
  {
    name: "Perplexity",
    package: "ai.perplexity.app.android"
  },
  {
    name: "Grok",
    package: "ai.x.grok"
  },
  {
    name: "ChatLLM",
    package: "com.abacusai.chatllm"
  },
  {
    name: "Galeria",
    package: "com.alensw.PicFolder"
  },
  {
    name: "Claude",
    package: "com.anthropic.claude"
  },
  {
    name: "Color Picker AR",
    package: "com.appsvek.color_picker.rgb_color_detector.eyedropper"
  },
  {
    name: "Zangi",
    package: "com.beint.zangi"
  },
  {
    name: "Cópia Universal",
    package: "com.camel.corp.universalcopy"
  },
  {
    name: "Xadrez",
    package: "com.chess"
  },
  {
    name: "Speechify",
    package: "com.cliffweitzman.speechify2"
  },
  {
    name: "IP Tools",
    package: "com.ddm.iptools"
  },
  {
    name: "DeepL",
    package: "com.deepl.mobiletranslator"
  },
  {
    name: "DeepSeek",
    package: "com.deepseek.chat"
  },
  {
    name: "Flud",
    package: "com.delphicoder.flud"
  },
  {
    name: "Discord",
    package: "com.discord"
  },
  {
    name: "Dolby On",
    package: "com.dolby.dolby234"
  },
  {
    name: "Figurinhas Personalizadas para WhatsApp",
    package: "com.dstukalov.walocalstoragestickers"
  },
  {
    name: "Duolingo",
    package: "com.duolingo"
  },
  {
    name: "Facebook",
    package: "com.facebook.katana"
  },
  {
    name: "Fonts",
    package: "com.fontskeyboard.fonts"
  },
  {
    name: "fooView",
    package: "com.fooview.android.fooview"
  },
  {
    name: "Acode",
    package: "com.foxdebug.acode"
  },
  {
    name: "Serviços MicroG",
    package: "com.gold.android.gms"
  },
  {
    name: "Ampere",
    package: "com.gombosdev.ampere"
  },
  {
    name: "Gemini",
    package: "com.google.android.apps.bard"
  },
  {
    name: "NotebookLM",
    package: "com.google.android.apps.labs.language.tailwind"
  },
  {
    name: "Tradutor",
    package: "com.google.android.apps.translate"
  },
  {
    name: "Rock Hero 2",
    package: "com.grillgames.guitarrockhero2"
  },
  {
    name: "Background Eraser",
    package: "com.handycloset.android.eraser"
  },
  {
    name: "AnkiDroid",
    package: "com.ichi2.anki"
  },
  {
    name: "Imgur",
    package: "com.imgur.mobile"
  },
  {
    name: "Instagram",
    package: "com.instagram.android"
  },
  {
    name: "Database Designer",
    package: "com.klim.dbdesigner"
  },
  {
    name: "Clicker automático",
    package: "com.ksxkq.autoclick"
  },
  {
    name: "Kwai",
    package: "com.kwai.video"
  },
  {
    name: "LinkedIn",
    package: "com.linkedin.android"
  },
  {
    name: "Ola Party",
    package: "com.live.party"
  },
  {
    name: "X-plore",
    package: "com.lonelycatgames.Xplore"
  },
  {
    name: "Memento",
    package: "com.luckydroid.droidbase"
  },
  {
    name: "Lumosity",
    package: "com.lumoslabs.lumosity"
  },
  {
    name: "Jogos de Memória",
    package: "com.memory.brain.training.games"
  },
  {
    name: "Mercado Livre",
    package: "com.mercadolibre"
  },
  {
    name: "Mercado Pago",
    package: "com.mercadopago.wallet"
  },
  {
    name: "Copilot",
    package: "com.microsoft.copilot"
  },
  {
    name: "RecordPlus",
    package: "com.mobilus.recordplay"
  },
  {
    name: "Cute CUT",
    package: "com.mobivio.android.cutecut"
  },
  {
    name: "Netflix",
    package: "com.netflix.mediaclient"
  },
  {
    name: "ASR",
    package: "com.nll.asr"
  },
  {
    name: "Minha Claro",
    package: "com.nvt.cs"
  },
  {
    name: "ChatGPT",
    package: "com.openai.chatgpt"
  },
  {
    name: "Opera GX",
    package: "com.opera.gx"
  },
  {
    name: "TNotes",
    package: "com.quyetsama.tnotes"
  },
  {
    name: "Reddit",
    package: "com.reddit.frontpage"
  },
  {
    name: "Reqable",
    package: "com.reqable.android"
  },
  {
    name: "Shopee",
    package: "com.shopee.br"
  },
  {
    name: "Sticker.ly",
    package: "com.snowcorp.stickerly.android"
  },
  {
    name: "ColorNote",
    package: "com.socialnmobile.dictapps.notepad.color.note"
  },
  {
    name: "Clash Royale",
    package: "com.supercell.clashroyale"
  },
  {
    name: "Temp Mail",
    package: "com.tempmail"
  },
  {
    name: "Termux",
    package: "com.termux"
  },
  {
    name: "Termux:Tasker",
    package: "com.termux.tasker"
  },
  {
    name: "TickTick",
    package: "com.ticktick.task"
  },
  {
    name: "SQLite Editor",
    package: "com.tomminosoftware.sqliteeditor"
  },
  {
    name: "Trello",
    package: "com.trello"
  },
  {
    name: "X",
    package: "com.twitter.android"
  },
  {
    name: "Udemy",
    package: "com.udemy.android"
  },
  {
    name: "Rave",
    package: "com.wemesh.android"
  },
  {
    name: "WhatsApp",
    package: "com.whatsapp"
  },
  {
    name: "XML Viewer",
    package: "com.xmlviewer.json.html.java.kotlin.fileviewer"
  },
  {
    name: "Hago",
    package: "com.yy.hiyo"
  },
  {
    name: "TikTok",
    package: "com.zhiliaoapp.musically"
  },
  {
    name: "Quick Brain",
    package: "de.softan.brainstorm"
  },
  {
    name: "Timelog",
    package: "dev.giall.timelog"
  },
  {
    name: "Turbo VPN",
    package: "free.vpn.unblock.proxy.turbovpn"
  },
  {
    name: "Treino em Casa",
    package: "homeworkout.homeworkouts.noequipment"
  },
  {
    name: "App Manager",
    package: "it.sourcenetitalia.appmanager"
  },
  {
    name: "Shizuku",
    package: "moe.shizuku.privileged.api"
  },
  {
    name: "Xmind",
    package: "net.xmind.doughnut"
  },
  {
    name: "Notion",
    package: "notion.id"
  },
  {
    name: "Readdy: Build websites that stand out | AI Website Builder",
    package: "org.chromium.webapk.a09a553ca303efd03_v2"
  },
  {
    name: "Base44",
    package: "org.chromium.webapk.a156046ce7d635068_v2"
  },
  {
    name: "regex101",
    package: "org.chromium.webapk.a38c91abe3bbd812f_v2"
  },
  {
    name: "UX Pilot",
    package: "org.chromium.webapk.a472d2ed2aacaaedf_v2"
  },
  {
    name: "Lovable",
    package: "org.chromium.webapk.a4cceaa02db571d93_v2"
  },
  {
    name: "Tasker Share",
    package: "org.chromium.webapk.a5a2c1d79c78d4baf_v2"
  },
  {
    name: "AI Studio",
    package: "org.chromium.webapk.a6aab478f37ca7758_v2"
  },
  {
    name: "Stitch - Design with AI",
    package: "org.chromium.webapk.ac8f23cc1de513752_v2"
  },
  {
    name: "Keyboard Hacker LLC",
    package: "org.khr.llc"
  },
  {
    name: "Telegram",
    package: "org.telegram.messenger"
  },
  {
    name: "VLC",
    package: "org.videolan.vlc"
  },
  {
    name: "Colagem de Fotos - GridArt",
    package: "photoeditor.layout.collagemaker"
  },
  {
    name: "Solid Explorer",
    package: "pl.solidexplorer2"
  },
  {
    name: "Pydroid 3",
    package: "ru.iiec.pydroid3"
  },
  {
    name: "Manus",
    package: "tech.butterfly.app"
  },
  {
    name: "Type Sprint",
    package: "typing.fast.texting.practice.keybord.type.games"
  },
  {
    name: "PingTools",
    package: "ua.com.streamsoft.pingtools"
  },
  {
    name: "Vidma",
    package: "vidma.video.editor.videomaker"
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
      sr: { on: false, days: 30 }
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
      ss: { on: false, days: 7 },
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
      ss: { on: false, days: 30 },
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
      sr: { on: false, days: 14 }
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
      ss: { on: false, days: 14 },
      sr: { on: false, days: 14 }
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
      ss: { on: false, days: 14 },
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
      ss: { on: false, days: 7 },
      sr: { on: false, days: 7 }
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
      ss: { on: false, days: 14 },
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
      ss: { on: false, days: 7 },
      sr: { on: false, days: 7 }
    }
  },
  {
    id: "13",
    name: "Tasker",
    pkg: "net.dinglisch.android.taskerm",
    stats: {
      ss: 31,
      sr: 3,
      lu: Date.now() - 7 * 24 * 60 * 60 * 1000
    },
    cleaner: {
      ss: { on: false, days: 7 },
      sr: { on: false, days: 7 }
    }
  }
];
