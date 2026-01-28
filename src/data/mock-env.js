const WEB_MOCK_DATA = {
  scan_media_app_packages: args => {
    if (args[0] === "jpg") {
      return ["com.spotify.music", "com.whatsapp"];
    } else {
      return ["com.netflix.mediaclient"];
    }
  },
  create_app_media_folders: args => {
    try {
      const apps = JSON.parse(args[0]);
      return { created: apps.length };
    } catch (e) {
      return { created: 0 };
    }
  },
  run_batch_command: () => ({ moved: 5 }),
  delete_files_batch: () => null,
  find_expired_files: () => [],
  get_folder_stats: () =>
    `
    Câmera,137
    Chrome,42
    Relógio,98
    Configurações,211
    Gravador,67
    Temas,154
    Google Play Store,89
    Maps,173
    Mensagens,64
    Agenda,120
    Contatos,51
    Telefone,93
    Gmail,188
    Gerenciador de Arquivos,76
    Calculadora,34
    Galeria,205
    Serviços e Feedback,17
    Anotações,142
    Clima,59
    Centro de Jogos,81
    Digitalizador,26
    Retro Music,112
    App Usage,47
    Brave,134
    Lera,63
    YouTube Pro,199
    Drive,58
    Meet,41
    Google Play Games,77
    Outlook,146
    MiXplorer,123
    PayPal,32
    PicPay,91
    Pinterest,54
    Shazam,69
    Spotify,184
    Tasker,227
    Downloads,38
    SIM Claro,14
    Assistente,73
    Emergência pessoal,19
    Google One,66
    Google,158
    App vault,44
    Bússola,21
    Rádio FM,57
    Música,102
    Gravador de Tela,86
    Segurança,171
    Mi Vídeo,49
    ShareMe,95
    GetApps,61
    Perplexity,128
    Grok,33
    ChatLLM,52
    Galeria,74
    Claude,109
    Color Picker AR,27
    Zangi,18
    Cópia Universal,46
    Xadrez,24
    Speechify,88
    IP Tools,31
    DeepL,79
    DeepSeek,56
    Flud,22
    Discord,144
    Dolby On,36
    Figurinhas Personalizadas para WhatsApp,68
    Duolingo,157
    Facebook,203
    Fonts,29
    fooView,43
    Acode,123
    Serviços MicroG,16
    Ampere,48
    Gemini,94
    NotebookLM,72
    Tradutor,53
    Rock Hero 2,11
    Background Eraser,62
    AnkiDroid,139
    Imgur,28
    Instagram,214
    Database Designer,37
    Clicker automático,23
    Kwai,97
    LinkedIn,121
    Ola Party,13
    X-plore,108
    Memento,41
    Lumosity,83
    Jogos de Memória,26
    Mercado Livre,176
    Mercado Pago,67
    Copilot,104
    RecordPlus,19
    Cute CUT,58
    Netflix,231
    ASR,34
    Minha Claro,52
    ChatGPT,165
    Opera GX,92
    TNotes,21
    Reddit,147
    Reqable,39
    Shopee,189
    Sticker.ly,61
    ColorNote,73
    Clash Royale,201
    Temp Mail,44
    Termux,156
    Termux:Tasker,87
    TickTick,118
    SQLite Editor,32
    Trello,96
    X,141
    Udemy,77
    Rave,28
    WhatsApp,312
    XML Viewer,36
    Hago,17
    TikTok,298
    Quick Brain,24
    Timelog,19
    Turbo VPN,84
    Treino em Casa,57
    App Manager,33
    Shizuku,64
    Xmind,71
    Notion,129
    Readdy: Build websites that stand out | AI Website Builder,22
    Base44,14
    regex101,18
    UX Pilot,27
    Lovable,31
    Tasker Share,16
    AI Studio,23
    Stitch - Design with AI,19
    Keyboard Hacker LLC,11
    Telegram,206
    VLC,143
    Colagem de Fotos - GridArt,38
    Solid Explorer,112
    Pydroid 3,67
    Manus,21
    Type Sprint,29
    PingTools,34
    Vidma,76
  `.trim()
};
