/* Build a separate Pages bundle; the Netlify/GitHub source remains usable. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const output = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(root, 'dist');
const site = new URL(process.env.SITE_URL || 'https://tuneup.my.id');
if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash) {
  throw new Error('SITE_URL must be an HTTPS site origin');
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const files = ['index.html', 'styles.css', 'layout.css', 'site-guide.css', 'site-guide.js', 'app.js', 'songs.js', 'recordings.js',
  'daily.js', 'daily-pool-v1.js', 'presets.js', 'challenge.js', 'duel-streams-v1.js', 'duel.js', 'artist-game.js', 'daily-hub-data.js', 'daily-hub.js', 'mini-games.js', 'backup.js', 'badges.js', 'i18n.js', 'feedback.js', 'analytics.js',
  'app.webmanifest', 'sw.js', 'robots.txt', 'sitemap.xml', '_headers',
  'googlebc29a838b567dfc0.html',
  '7b4e9c2a1f8d4e60b3c5a9d1e2f48076.txt',
  'og-image.png',
  'favicon.ico', 'icon-32.png', 'icon-96.png', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

let esbuild = null;
try { esbuild = require(path.join(root, '.cloudflare-tools/node_modules/esbuild')); } catch {}
const MINIFY_CSS = new Set(['styles.css', 'layout.css', 'site-guide.css']);
const MINIFY_JS = new Set([
  'app.js', 'mini-games.js', 'daily-hub-data.js', 'daily-hub.js',
  'duel-streams-v1.js', 'duel.js', 'artist-game.js', 'i18n.js',
  'presets.js', 'badges.js', 'backup.js', 'feedback.js',
  'recordings.js', 'challenge.js', 'daily.js', 'site-guide.js'
]);

let builtIndexHtml = '';
for (const file of files) {
  let contents = fs.readFileSync(path.join(root, file));
  if (/\.(html|xml|txt|js|css)$/.test(file)) {
    contents = contents.toString()
      .replaceAll('https://namethetrack.netlify.app', site.origin)
      .replaceAll('https://namethetrack.pages.dev', site.origin)
      .replaceAll('https://tuneup.pages.dev', site.origin)
      .replaceAll('https://tuneup.my.id', site.origin);
    if (file === 'index.html') {
      contents = contents
        .replace('action="/feedback-received.html" data-netlify="true"', 'action="/api/feedback" data-feedback-api="true"');
      builtIndexHtml = contents;
    }
    if (file === 'analytics.js') contents = contents
      .replace(/location\.hostname === '[^']+'/, 'location.hostname === ' + JSON.stringify(site.hostname));
    if (file === 'sw.js') contents = contents.replace(/const CACHE = '[^']+'/, "const CACHE = 'gts-cf-v156-wave129-lyric-timestamps-audio-sync'");
    if (esbuild && MINIFY_CSS.has(file)) {
      contents = esbuild.transformSync(contents, { loader: 'css', minify: true, legalComments: 'none' }).code;
    } else if (esbuild && MINIFY_JS.has(file)) {
      contents = esbuild.transformSync(contents, { loader: 'js', minify: true, target: 'es2020', legalComments: 'none' }).code;
    }
  }
  fs.writeFileSync(path.join(output, file), contents);
}

/* Generate dedicated static SEO landing pages so Cloudflare Pages Pretty URLs
   serves /daily, /classic, /artist, /spotify, /duel, /artist-detective, and /id
   with HTTP 200, unique titles/descriptions, self-referencing canonicals,
   unique body copy, and mode/language-specific JSON-LD structured data. */
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => escHtml(s).replace(/"/g, '&quot;');

const EN_FAQS = [
  ['Do I need an account?', 'No sign-up is needed. Open the game on your phone or computer and pick a mode, or paste any public Spotify, Apple Music, or YouTube playlist or album link to play your own tracks.'],
  ['What can I replay?', 'Classic, Custom Artist, Spotify, Apple Music & YouTube Playlists, Music Duel, Artist Detective Endless, and all 5 mini-games (Cover Pixel, MV Spot, HairSpot, Fact or Cap, Lyric Guess) can be played as often as you like. The Daily Challenge resets once per day.'],
  ['When is the next Daily?', "At 7:00 AM in your device's local time. Consecutive Daily wins build your streak; a missed day or a loss resets it."],
  ['Can I challenge a friend?', 'Yes. After any song, 5-stage run, Music Duel, or Artist Detective round, tap Challenge your friend to copy a spoiler-free link with the exact same tracks or mystery artist.'],
  ['Where is my progress saved?', 'Your Daily progress, streaks, stats, and settings are saved in this browser. Open Settings -> Backup & transfer to copy a backup code and restore your progress on another browser or device.']
];

const ES_FAQS = [
  ['¿Necesito una cuenta?', 'No hace falta registrarse. Abre el juego en tu celular o computadora y elige un modo, o pega el enlace de cualquier playlist o álbum público de Spotify, Apple Music o YouTube para jugar con tus canciones.'],
  ['¿Qué puedo volver a jugar?', 'Clásico, Por Artista, Playlists de Spotify/Apple/YouTube, Duelo Musical, Detective de Artistas Sin fin y los 5 minijuegos (Cover Pixel, MV Spot, HairSpot, Dato o Mito, Adivina la Letra) se pueden jugar todas las veces que quieras. El Desafío Diario (3 juegos /300 puntos) se renueva una vez al día.'],
  ['¿Cuándo sale el próximo Diario?', 'A las 7:00 a. m. en la hora local de tu dispositivo. Las victorias diarias seguidas aumentan tu racha; un día perdido o una derrota la reinicia.'],
  ['¿Puedo retar a un amigo?', 'Sí. Al terminar cualquier canción, partida de 5 rondas, Duelo Musical, Detective de Artistas o minijuego, pulsa Retar a un amigo para copiar un enlace sin spoilers con exactamente las mismas canciones o artista.'],
  ['¿Dónde se guarda mi progreso?', 'Tu progreso diario, rachas, estadísticas, logros y ajustes se guardan en este navegador. Abre Ajustes -> Respaldo y transferencia para copiar un código y restaurarlo en otro navegador o dispositivo.']
];

function buildLdJson(origin, page) {
  const pageUrl = `${origin}/${page.slug}`;
  const isEs = page.lang === 'es';
  const faqs = isEs ? ES_FAQS : EN_FAQS;
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      name: 'TuneUp',
      alternateName: ['Tune Up', 'TuneUp Guess the Song', 'TuneUp Adivina la Canción'],
      url: `${origin}/`,
      inLanguage: ['en', 'es'],
      publisher: { '@id': `${origin}/#publisher` }
    },
    {
      '@type': 'Organization',
      '@id': `${origin}/#publisher`,
      name: 'TuneUp',
      url: `${origin}/`,
      logo: { '@type': 'ImageObject', url: `${origin}/icon-512.png`, width: 512, height: 512 }
    },
    {
      '@type': ['WebApplication', 'VideoGame'],
      name: page.title,
      url: pageUrl,
      applicationCategory: 'GameApplication',
      genre: isEs ? ['Juego Musical', 'Adivina la Canción', 'Trivia Musical'] : ['Music Game', 'Music Trivia', 'Guess the Song'],
      playMode: 'SinglePlayer',
      operatingSystem: 'Any (web browser)',
      inLanguage: isEs ? 'es' : 'en',
      offers: { '@type': 'Offer', price: '0', priceCurrency: isEs ? 'EUR' : 'USD' },
      description: page.description,
      isPartOf: { '@id': `${origin}/#website` }
    },
    {
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: faqs.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    }
  ];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

const SEO_PAGES = [
  {
    slug: 'daily',
    lang: 'en',
    keepHreflang: false,
    title: 'Daily Guess the Song Challenge (Heardle Alternative) — TuneUp',
    description: "Play today's free Daily Guess the Song challenge in your browser. Identify the daily hit from 0.1s–15s clips in 5 tries, build streaks & share spoiler-free.",
    imageAlt: 'TuneUp Daily Challenge — Free daily guess the song game from 0.1s clips',
    aboutHeading: 'About Daily Challenge',
    aboutP1: 'TuneUp Daily Challenge gives every player the same hand-picked hit song each day — a free Heardle alternative in your browser with no sign-up. Start with a 0.1-second audio clip and unlock longer previews (0.5s, 2s, 8s, 15s) across 5 tries.',
    aboutP2: 'Resets daily at 7:00 AM local time. Build streaks, unlock achievements, and challenge friends with spoiler-free links.'
  },
  {
    slug: 'classic',
    lang: 'en',
    keepHreflang: false,
    title: 'Classic Guess the Song Game — 33,500+ Songs (0.1s Clips) | TuneUp',
    description: 'Guess 5 songs from Easy to Impossible using 0.1s–15s clips across 33,500+ tracks. Filter by Pop, Rock, Hip-hop, R&B, Indie, Electronic & any era — free online.',
    imageAlt: 'TuneUp Classic — Free 5-stage guess the song game across 33,500+ tracks',
    aboutHeading: 'About Classic Mode',
    aboutP1: 'TuneUp Classic is a 5-stage guess the song gauntlet spanning over 33,500 tracks from before 2000 to the 2020s. Each run escalates from Easy global hits to Impossible deep cuts, starting with a 0.1s clip on every stage.',
    aboutP2: 'Filter by genre (Pop, Rock, Hip-hop, R&B/Soul, Electronic, Indie) and era, track win streaks, and challenge friends to play your exact 5-song run.'
  },
  {
    slug: 'artist',
    lang: 'en',
    keepHreflang: false,
    title: 'Guess Songs by Artist — Custom Artist Music Quiz | TuneUp',
    description: 'Pick any artist and guess 5 of their tracks from 0.1s audio clips. Free custom artist song quiz with instant search and spoiler-free friend challenges.',
    imageAlt: 'TuneUp By Artist — Custom artist music guessing game',
    aboutHeading: 'About By Artist Mode',
    aboutP1: 'Test how well you really know your favorite singer or band. Search any artist in TuneUp to generate an instant 5-song discography quiz with 0.1s–15s clips and smart fuzzy title search.',
    aboutP2: 'Play unlimited rounds for free with no account, unlock achievements, or send a spoiler-free challenge link with the exact same 5 tracks.'
  },
  {
    slug: 'spotify',
    lang: 'en',
    keepHreflang: false,
    title: 'Spotify, Apple Music & YouTube Playlist Guessing Game — TuneUp',
    description: 'Turn any public Spotify, Apple Music, or YouTube playlist into a free guess the song quiz. Paste a link, pick 5–500 rounds & challenge friends — no login.',
    imageAlt: 'TuneUp Playlist Quiz — Guess songs from Spotify, Apple Music & YouTube playlists',
    aboutHeading: 'About Playlist Quiz',
    aboutP1: 'Paste any public Spotify playlist, Spotify album, Apple Music playlist, or YouTube playlist link (or merge multiple links at once) to turn your own music into a 0.1s–15s guess the song game.',
    aboutP2: 'Choose 5, 10, 20, 50, All, or a custom round count, replay recent playlists in one tap, and share spoiler-free challenges — completely free with no login required.'
  },
  {
    slug: 'duel',
    lang: 'en',
    keepHreflang: false,
    title: 'Music Duel — Higher or Lower Spotify Streams & Release Year | TuneUp',
    description: 'Play free Music Duel online: guess which hit song has more Spotify streams or was released later. Listen to live audio previews, chase streaks & challenge friends.',
    imageAlt: 'TuneUp Music Duel — Higher or lower Spotify streams and release year game',
    aboutHeading: 'About Music Duel',
    aboutP1: 'Music Duel puts two iconic songs head to head in two endless decks: guess which track has Higher or Lower Spotify streams, or decide which song was released Earlier or Later.',
    aboutP2: 'Preview live audio on either card, push your high-score streak as far as you can, and copy a challenge link so friends face the exact same sequence of matchups.'
  },
  {
    slug: 'artist-detective',
    lang: 'en',
    keepHreflang: false,
    title: 'Artist Detective — Guess the Mystery Artist (Spotle Alternative) | TuneUp',
    description: 'Deduce the mystery artist in 10 guesses using 6 clues: debut year, type, gender, genre, country & global rank across 530 artists. Free Spotle alternative.',
    imageAlt: 'TuneUp Artist Detective — Guess the mystery artist from 6 clues across Top 530 roster',
    aboutHeading: 'About Artist Detective',
    aboutP1: 'Artist Detective is a free Spotle-style music deduction game spanning 530 global artists. Each guess reveals 6 color-coded clues: Debut Year, Solo/Group Type, Gender, Primary Genre, Country, and Global Rank (#1–#530).',
    aboutP2: 'Unlock clue and name hints when stuck, play Daily Artist or endless rounds, unlock achievements, and challenge friends to solve your exact mystery artist.'
  },
  {
    slug: 'cover-pixel',
    lang: 'en',
    keepHreflang: false,
    title: 'Cover Pixel — Guess the Album from Pixelated Cover Art | TuneUp',
    description: 'Guess 260+ iconic albums from pixelated cover art that sharpens across 5 tries (6×6 to 46×46 px). Free online browser music game with instant audio previews.',
    imageAlt: 'TuneUp Cover Pixel — Guess the album from pixelated album cover art',
    aboutHeading: 'About Cover Pixel',
    aboutP1: 'Cover Pixel tests your visual music memory by starting with a 6×6 pixelated album cover and revealing sharper detail with every attempt across 5 tries.',
    aboutP2: 'Play unlimited free rounds anytime or spin Cover Pixel in the Daily Challenge.'
  },
  {
    slug: 'mv-spot',
    lang: 'en',
    keepHreflang: false,
    title: 'MV Spot — Guess the Song from Music Video Frames | TuneUp',
    description: 'Guess 210+ iconic songs from music video scenes across 5 tries, with release year & artist clues and instant audio previews. Free browser music game.',
    imageAlt: 'TuneUp MV Spot — Guess the song from music video frames',
    aboutHeading: 'About MV Spot',
    aboutP1: 'MV Spot shows 3 real music video frames one scene at a time with artist faces masked during guessing, followed by Release Year, Genre, and Artist clues across 5 attempts.',
    aboutP2: 'Play unlimited free rounds anytime or spin MV Spot in the Daily Challenge.'
  },
  {
    slug: 'hairspot',
    lang: 'en',
    keepHreflang: false,
    title: 'HairSpot Music — Guess the Musician from Their Hairstyle | TuneUp',
    description: 'Identify 100+ global musicians starting from just their hairstyle. Skip to lower the curtain step by step across 5 tries — free online music game.',
    imageAlt: 'TuneUp HairSpot Music — Guess famous musicians from their hairstyle',
    aboutHeading: 'About HairSpot Music',
    aboutP1: 'HairSpot Music starts with only the musician’s hair visible above the curtain and reveals more of the portrait with each skip across 5 attempts.',
    aboutP2: 'Features 100+ global music icons — play free rounds anytime or spin it in Daily Challenge.'
  },
  {
    slug: 'fact-or-cap',
    lang: 'en',
    keepHreflang: false,
    title: 'Music Fact or Cap — Music Trivia True or False Game | TuneUp',
    description: 'Test your music history knowledge with quick Fact or Cap trivia claims. Survive 3 lives in Endless mode or beat 5 daily claims — free in your browser.',
    imageAlt: 'TuneUp Music Fact or Cap — Music trivia game',
    aboutHeading: 'About Music Fact or Cap',
    aboutP1: 'Decide whether surprising music claims are real facts or total cap, with crisp explanations after every answer.',
    aboutP2: 'Chase high scores with 3 lives in Endless free play or earn up to 100 points in the Daily Challenge.'
  },
  {
    slug: 'lyric-guess',
    lang: 'en',
    keepHreflang: false,
    title: 'Lyric Guess — Guess the Song from 5 Lyric Lines | TuneUp',
    description: 'Identify hit songs starting from a single lyric line. Unlock up to 5 progressive lyric clues and listen to the track preview on reveal — free online.',
    imageAlt: 'TuneUp Lyric Guess — Guess songs from progressive lyric clues',
    aboutHeading: 'About Lyric Guess',
    aboutP1: 'Lyric Guess gives you one famous lyric line at a time across 5 attempts — solve on line 1 or unlock more lyrics before listening to the audio preview on reveal.',
    aboutP2: 'Play unlimited free rounds or spin Lyric Guess in TuneUp’s Daily Challenge.'
  },
  {
    slug: 'es',
    lang: 'es',
    keepHreflang: true,
    title: 'TuneUp — Juego Gratis de Adivinar Canciones (Spotify, Diario y Duelo)',
    description: 'Juega gratis a adivinar canciones online sin cuenta. Escucha clips de 0,1 s en Desafío Diario, Clásico, Por Artista, Playlists de Spotify/Apple/YouTube, Duelo Musical y Detective de Artistas.',
    imageAlt: 'TuneUp — Juego gratis de adivinar canciones con clips de 0,1 s, Quiz de Spotify, Duelo Musical y Detective de Artistas',
    aboutHeading: 'Sobre TuneUp — Juego Gratis de Adivinar Canciones',
    aboutP1: 'TuneUp es un juego musical gratis directo en el navegador de tu celular o computadora sin registro. Pon a prueba tu oído adivinando canciones con clips de 0,1 s a 15 s en el Desafío Diario, modo Clásico (33.500+ canciones), Por Artista y quizzes de playlists de Spotify, Apple Music y YouTube.',
    aboutP2: 'Juega también Duelo Musical (compara streams de Spotify y año de lanzamiento), Detective de Artistas (descubre 530 artistas con 6 pistas) y 5 minijuegos: Cover Pixel, MV Spot, HairSpot, Dato o Mito y Adivina la Letra.'
  }
];

function localizeEsStaticHtml(html) {
  let out = html
    .replace('<h2 id="dailyHubHeading">Daily Challenge</h2>', '<h2 id="dailyHubHeading">Desafío Diario</h2>')
    .replace('<span class="daily-done-badge" id="dailyHubBadge">3 games · /300</span>', '<span class="daily-done-badge" id="dailyHubBadge">3 juegos · /300</span>')
    .replace('<span class="daily-meta" id="dailyHubMeta">Spin 3 random music games · 300 pts max</span>', '<span class="daily-meta" id="dailyHubMeta">Gira 3 juegos musicales al azar · máx. 300 pts</span>')
    .replace('id="openDailyHub" type="button">Spin Daily</button>', 'id="openDailyHub" type="button">Girar Diario</button>')
    .replace('<span class="dh-kicker" id="dhKicker">DAILY CHALLENGE</span>', '<span class="dh-kicker" id="dhKicker">DESAFÍO DIARIO</span>')
    .replace('<h2 class="dh-title" id="dhTitle">Today\'s 3 Music Games</h2>', '<h2 class="dh-title" id="dhTitle">3 Juegos Musicales de Hoy</h2>')
    .replace('<p class="dh-sub" id="dhSub">Spin to reveal today\'s lineup — same 3 games for everyone.</p>', '<p class="dh-sub" id="dhSub">Gira para revelar los 3 juegos de hoy — iguales para todos.</p>')
    .replace('<span class="lbl">Spin Today\'s Games</span>', '<span class="lbl">Girar Juegos de Hoy</span>')
    .replace('<span id="dhNextLbl">Next daily in</span>', '<span id="dhNextLbl">Próximo diario en</span>')
    .replace('<span class="dh-kicker" id="dhDoneKicker">DAILY COMPLETE</span>', '<span class="dh-kicker" id="dhDoneKicker">DIARIO COMPLETADO</span>')
    .replace('<span class="lbl">Share result</span>', '<span class="lbl">Compartir resultado</span>')
    .replace('<span class="lbl">Back to menu</span>', '<span class="lbl">Volver al menú</span>')
    .replace('<span id="dhBackLbl">Change mode</span>', '<span id="dhBackLbl">Cambiar modo</span>')
    .replace('<span id="mgBackLbl">Change mode</span>', '<span id="mgBackLbl">Cambiar modo</span>')
    .replace('<h2 id="moreGamesHeading">More Music Games</h2>', '<h2 id="moreGamesHeading">Más Juegos Musicales</h2>')
    .replace('<span class="more-games-sub" id="moreGamesSub">Free play anytime</span>', '<span class="more-games-sub" id="moreGamesSub">Juego libre siempre</span>')
    .replace('<b id="mgLblMv">MV Spot</b>', '<b id="mgLblMv">MV Spot</b>')
    .replace('<span id="mgSubMv">Music video</span>', '<span id="mgSubMv">Videoclip</span>')
    .replace('<b id="mgLblFact">Fact or Cap</b>', '<b id="mgLblFact">Dato o Mito</b>')
    .replace('<b id="mgLblLyric">Lyric Guess</b>', '<b id="mgLblLyric">Adivina la Letra</b>')
    .replace('<h2 id="dailyHeading">Daily Song</h2>', '<h2 id="dailyHeading">Canción del Día</h2>')
    .replace('<span class="daily-meta" id="dailySub">1 song · 5 tries</span>', '<span class="daily-meta" id="dailySub">1 canción · 5 intentos</span>')
    .replace('<h2 id="dailyArtistHeading">Daily Artist</h2>', '<h2 id="dailyArtistHeading">Artista del Día</h2>')
    .replace('<span class="daily-meta" id="dailyArtistSub">1 artist · 10 tries</span>', '<span class="daily-meta" id="dailyArtistSub">1 artista · 10 intentos</span>')
    .replaceAll('>Play daily</button>', '>Jugar diario</button>')
    .replace('<span class="mode-pill">5 stages</span>', '<span class="mode-pill">5 rondas</span>')
    .replace('<span class="lbl">By Artist</span>', '<span class="lbl">Por Artista</span>')
    .replace('<span class="lbl">Playlists</span>', '<span class="lbl">Playlists</span>')
    .replace('<span class="multi-lbl">All genres</span>', '<span class="multi-lbl">Todos los géneros</span>')
    .replace('<span class="multi-lbl">All eras</span>', '<span class="multi-lbl">Todas las épocas</span>')
    .replace('id="start">Start</button>', 'id="start">Empezar</button>')
    .replace('<b>Play your favorite artist</b>', '<b>Juega con tu artista favorito</b>')
    .replace('<span>Pick any artist &mdash; guess 5 of their tracks from 0.1s clips</span>', '<span>Elige cualquier artista &mdash; adivina 5 canciones con clips de 0,1 s</span>')
    .replace('Choose artist\n', 'Elegir artista\n')
    .replace('placeholder="Spotify, Apple, or YT link&hellip;"', 'placeholder="Enlace de Spotify, Apple o YT&hellip;"')
    .replace('id="loadSpotifyBtn" type="button">Play</button>', 'id="loadSpotifyBtn" type="button">Jugar</button>')
    .replace('<span class="spotify-rounds-lbl">Songs</span>', '<span class="spotify-rounds-lbl">Canciones</span>')
    .replace('>All</button>', '>Todas</button>')
    .replace('placeholder="Custom"', 'placeholder="Otro"')
    .replace('Paste Spotify, Apple Music, or YouTube playlist links (or Ctrl+A Spotify tracks)', 'Pega enlaces de playlists de Spotify, Apple Music o YouTube (o Ctrl+A de pistas de Spotify)')
    .replace('<span class="mode-pill is-gold">Higher or lower</span>', '<span class="mode-pill is-gold">Mayor o menor</span>')
    .replace('<p id="duelLobbySub">Spotify streams &amp; release year</p>', '<p id="duelLobbySub">Streams de Spotify y año de lanzamiento</p>')
    .replace('Play duel\n', 'Jugar duelo\n')
    .replace('<span class="mode-pill is-purple">Endless</span>', '<span class="mode-pill is-purple">Sin fin</span>')
    .replace('<p id="artistLobbySub">Deduce the mystery artist from 6 clues</p>', '<p id="artistLobbySub">Descubre al artista misterioso con 6 pistas</p>')
    .replace('Play artist\n', 'Jugar artista\n')
    .replace('id="leaveChallenge" type="button">Play Classic</button>', 'id="leaveChallenge" type="button">Jugar Clásico</button>')
    .replace('<span class="lbl">Stats</span>', '<span class="lbl">Estadísticas</span>')
    .replace('<span class="lbl">Settings</span>', '<span class="lbl">Ajustes</span>')
    .replace('<span class="lbl">Feedback</span>', '<span class="lbl">Comentarios</span>')
    .replace('<span class="lbl">All Classic</span>', '<span class="lbl">Todo Clásico</span>')
    .replace('<span class="lbl">Daily</span>', '<span class="lbl">Diario</span>')
    .replace('<span class="lbl">Artist</span>', '<span class="lbl">Artista</span>')
    .replace('<span class="lbl">Mini-Games</span>', '<span class="lbl">Minijuegos</span>')
    .replace('<span class="lbl">Achievements</span>', '<span class="lbl">Logros</span>')
    .replace('<h2 class="custom-h" id="customTitle">&#10022; Custom Game</h2>', '<h2 class="custom-h" id="customTitle">Elegir artista</h2>')
    .replace('<p class="custom-lbl">Play an artist</p>', '<p class="custom-lbl">Jugar con un artista</p>')
    .replace('<p class="custom-hint" id="customHint">Pick an artist &mdash; we pick 5 of their songs.</p>', '<p class="custom-hint" id="customHint">Elige un artista &mdash; seleccionamos 5 de sus canciones.</p>')
    .replace('<h2 id="musicBrowserTitle">Choose your music</h2>', '<h2 id="musicBrowserTitle">Elige tu música</h2>')
    .replace('<p class="browser-intro">A few shortcuts for your next Classic run.</p>', '<p class="browser-intro">Algunos accesos rápidos para tu próxima partida Clásica.</p>')
    .replace('<h3>Genres</h3>', '<h3>Géneros</h3>')
    .replace('<h3>Eras</h3>', '<h3>Épocas</h3>')
    .replace('data-guide-genre="lain">Other</button>', 'data-guide-genre="lain">Otros</button>')
    .replace('data-guide-era="old">Before 2000</button>', 'data-guide-era="old">Antes del 2000</button>')
    .replace('<p class="browser-note">Genre shortcuts include every era; era shortcuts include every genre. Combine both using the filters above.</p>', '<p class="browser-note">Los accesos de género incluyen todas las épocas; los de época incluyen todos los géneros. Combina ambos con los filtros de arriba.</p>')
    .replace('<h2 id="faqTitle">Good to know</h2>', '<h2 id="faqTitle">Información útil</h2>')
    .replace('>Daily Challenge</a>', '>Desafío Diario</a>')
    .replace('>By Artist</a>', '>Por Artista</a>')
    .replace('>Playlist Quiz</a>', '>Quiz de Playlist</a>')
    .replace('<a href="/" hreflang="en" lang="en" data-mode-link="lang-en" aria-current="page">EN</a>', '<a href="/" hreflang="en" lang="en" data-mode-link="lang-en">EN</a>')
    .replace('<a href="/es" hreflang="es" lang="es" data-mode-link="lang-es">ES</a>', '<a href="/es" hreflang="es" lang="es" data-mode-link="lang-es" aria-current="page">ES</a>')
    .replace('Back to top <svg', 'Volver arriba <svg');

  const esFaqMarkup = ES_FAQS.map(([q, a]) => `      <details><summary>${escHtml(q)}</summary><p>${escHtml(a)}</p></details>`).join('\n');
  out = out.replace(
    /(<section class="guide-faq" aria-labelledby="faqTitle">\s*<h2 id="faqTitle">[^<]+<\/h2>\s*)([\s\S]*?)(\s*<\/section>)/,
    `$1${esFaqMarkup}$3`
  );
  return out;
}

for (const page of SEO_PAGES) {
  const pageUrl = `${site.origin}/${page.slug}`;
  let html = builtIndexHtml
    .replace('<html lang="en">', `<html lang="${page.lang}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escHtml(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escAttr(page.description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`)
    .replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${page.lang === 'es' ? 'es_ES' : 'en_US'}">`)
    .replace(/<meta property="og:locale:alternate" content="[^"]*">/, `<meta property="og:locale:alternate" content="${page.lang === 'es' ? 'en_US' : 'es_ES'}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escAttr(page.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escAttr(page.description)}">`)
    .replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${escAttr(page.imageAlt)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escAttr(page.title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escAttr(page.description)}">`)
    .replace(/<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${escAttr(page.imageAlt)}">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${buildLdJson(site.origin, page)}</script>`)
    .replace(
      /<section class="guide-about" aria-labelledby="aboutTitle">[\s\S]*?<\/section>/,
      `<section class="guide-about" aria-labelledby="aboutTitle">\n      <h2 id="aboutTitle">${escHtml(page.aboutHeading)}</h2>\n      <p>${escHtml(page.aboutP1)}</p>\n      <p>${escHtml(page.aboutP2)}</p>\n    </section>`
    );

  if (!page.keepHreflang) {
    html = html.replace(/\r?\n?<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g, '');
  }
  if (page.lang === 'es') {
    html = localizeEsStaticHtml(html);
  }
  // Ensure static assets load from origin root on subpages regardless of trailing slash.
  html = html
    .replace(/(\s(?:href|src))="(?!https?:|\/\/|\/|#|data:|mailto:)([^"]+)"/g, '$1="/$2"')
    .replace('register("sw.js"', 'register("/sw.js"');

  fs.writeFileSync(path.join(output, `${page.slug}.html`), html);
}

fs.mkdirSync(path.join(output, 'fonts'), { recursive: true });
for (const font of ['CabinetGrotesk-Variable.woff2', 'GeneralSans-Variable.woff2', 'Unbounded-Bold.woff2']) {
  fs.copyFileSync(path.join(root, 'fonts', font), path.join(output, 'fonts', font));
}
if (fs.existsSync(path.join(root, 'mv-frames'))) {
  fs.cpSync(path.join(root, 'mv-frames'), path.join(output, 'mv-frames'), { recursive: true });
}
const staticAssetExcludes = [
  '/fonts/*',
  '/mv-frames/*',
  ...files
    .filter((f) => /\.(css|js|png|ico|webmanifest)$/.test(f))
    .map((f) => `/${f}`)
];
fs.writeFileSync(path.join(output, '_routes.json'), JSON.stringify({
  version: 1,
  include: ['/*'],
  exclude: staticAssetExcludes
}));
console.log(`Built Cloudflare Pages assets + ${SEO_PAGES.length} SEO landing pages for ${site.origin}`);
