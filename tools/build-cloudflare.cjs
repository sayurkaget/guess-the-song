/* Build a separate Pages bundle; the Netlify/GitHub source remains usable. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const output = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(root, 'dist');
const site = new URL(process.env.SITE_URL || 'https://tuneup.pages.dev');
if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash) {
  throw new Error('SITE_URL must be an HTTPS site origin');
}
fs.mkdirSync(output, { recursive: true });
const files = ['index.html', 'styles.css', 'layout.css', 'site-guide.css', 'site-guide.js', 'app.js', 'songs.js', 'recordings.js',
  'daily.js', 'daily-pool-v1.js', 'challenge.js', 'duel-streams-v1.js', 'duel.js', 'artist-game.js', 'score-card.js', 'backup.js', 'badges.js', 'i18n.js', 'feedback.js', 'analytics.js',
  'app.webmanifest', 'sw.js', 'robots.txt', 'sitemap.xml',
  'googlebc29a838b567dfc0.html',
  '7b4e9c2a1f8d4e60b3c5a9d1e2f48076.txt',
  'og-image.png',
  'icon-32.png', 'icon-96.png', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

let builtIndexHtml = '';
for (const file of files) {
  let contents = fs.readFileSync(path.join(root, file));
  if (/\.(html|xml|txt|js)$/.test(file)) {
    contents = contents.toString()
      .replaceAll('https://namethetrack.netlify.app', site.origin)
      .replaceAll('https://namethetrack.pages.dev', site.origin)
      .replaceAll('https://tuneup.pages.dev', site.origin);
    if (file === 'index.html') {
      contents = contents
        .replace('action="/feedback-received.html" data-netlify="true"', 'action="/api/feedback" data-feedback-api="true"');
      builtIndexHtml = contents;
    }
    if (file === 'analytics.js') contents = contents
      .replace(/location\.hostname === '[^']+'/, 'location.hostname === ' + JSON.stringify(site.hostname));
    if (file === 'sw.js') contents = contents.replace(/const CACHE = '[^']+'/, "const CACHE = 'gts-cf-v100-wave74-footer-lang-switcher'");
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
  ['What can I replay?', 'Classic, Custom Artist, Spotify, Apple Music & YouTube Playlists, Music Duel, and Artist Detective can be played as often as you like. The Daily song is available once per day, with five attempts.'],
  ['When is the next Daily?', "At 7:00 AM in your device's local time. Consecutive Daily wins build your streak; a missed day or a loss resets it."],
  ['Can I challenge a friend?', 'Yes. After any song, 5-stage run, Music Duel, or Artist Detective round, tap Challenge your friend to copy a spoiler-free link with the exact same tracks or mystery artist.'],
  ['Where is my progress saved?', 'Your Daily progress, streaks, stats, and settings are saved in this browser. Open Settings -> Backup & transfer to copy a backup code and restore your progress on another browser or device.']
];

const ID_FAQS = [
  ['Apakah perlu bikin akun?', 'Tidak perlu daftar. Buka game di HP atau laptop lalu pilih mode, atau tempel link playlist publik Spotify, Apple Music, maupun YouTube untuk main pakai lagumu sendiri.'],
  ['Mode apa saja yang bisa dimainkan berulang kali?', 'Classic, Per Artis, Playlist Spotify/Apple/YouTube, Music Duel, dan Artist Detective bisa dimainkan sepuasnya. Tantangan Harian tersedia satu lagu per hari dengan lima kesempatan.'],
  ['Kapan Tantangan Harian berikutnya dibuka?', 'Setiap pukul 07.00 waktu perangkatmu. Menang berturut-turut menambah streak; terlewat sehari atau kalah akan mereset streak.'],
  ['Bisa menantang teman?', 'Bisa. Setelah menyelesaikan lagu, sesi 5 tahap, Music Duel, atau Artist Detective, klik Tantang teman untuk menyalin link bebas spoiler dengan lagu atau artis yang persis sama.'],
  ['Di mana progres saya disimpan?', 'Progres Harian, streak, statistik, lencana, dan pengaturan tersimpan di browser ini. Buka Pengaturan -> Cadangkan & pindah data untuk menyalin kode backup dan memulihkannya di browser atau perangkat lain.']
];

function buildLdJson(origin, page) {
  const pageUrl = `${origin}/${page.slug}`;
  const isId = page.lang === 'id';
  const faqs = isId ? ID_FAQS : EN_FAQS;
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      name: 'TuneUp',
      alternateName: ['Tune Up', 'TuneUp Guess the Song', 'TuneUp Tebak Lagu'],
      url: `${origin}/`,
      inLanguage: ['en', 'id'],
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
      genre: isId ? ['Game Musik', 'Tebak Lagu', 'Kuis Musik'] : ['Music Game', 'Music Trivia', 'Guess the Song'],
      playMode: 'SinglePlayer',
      operatingSystem: 'Any (web browser)',
      inLanguage: isId ? 'id' : 'en',
      offers: { '@type': 'Offer', price: '0', priceCurrency: isId ? 'IDR' : 'USD' },
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
    aboutP2: 'Resets daily at 7:00 AM local time. Build streaks, earn badges, save score cards, and share spoiler-free results with friends.'
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
    aboutP2: 'Play unlimited rounds for free with no account, save your custom score card, or send a spoiler-free challenge link with the exact same 5 tracks.'
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
    aboutP2: 'Unlock clue and name hints when stuck, play endless rounds without waiting, save purple score cards, or challenge friends to solve your exact mystery artist.'
  },
  {
    slug: 'id',
    lang: 'id',
    keepHreflang: true,
    title: 'TuneUp — Game Tebak Lagu Online Gratis (Spotify, Harian & Duel)',
    description: 'Main game tebak lagu online gratis di browser tanpa akun. Tebak lagu dari klip 0,1 detik di mode Harian, Classic, Artis, Playlist Spotify/Apple/YouTube, Music Duel & Tebak Artis.',
    imageAlt: 'TuneUp — Game tebak lagu online gratis dari klip 0,1 detik, Playlist Spotify, Music Duel & Artist Detective',
    aboutHeading: 'Tentang TuneUp — Game Tebak Lagu Gratis',
    aboutP1: 'TuneUp adalah game tebak lagu online gratis langsung di browser HP dan laptop tanpa login. Uji telingamu menebak judul lagu dari klip 0,1–15 detik di Tantangan Harian, mode Classic (33.500+ lagu), Per Artis, serta kuis Playlist Spotify, Apple Music, dan YouTube.',
    aboutP2: 'Mainkan juga Music Duel (tebak Spotify streams lebih tinggi/rendah & tahun rilis) dan Artist Detective (tebak 530 artis dunia dari 6 petunjuk). Gratis selamanya dan bisa langsung menantang teman.'
  }
];

function localizeIdStaticHtml(html) {
  let out = html
    .replace('<h2 id="dailyHeading">Daily Song</h2>', '<h2 id="dailyHeading">Lagu Harian</h2>')
    .replace('<span class="daily-meta" id="dailySub">1 song · 5 tries</span>', '<span class="daily-meta" id="dailySub">1 lagu · 5 percobaan</span>')
    .replace('<h2 id="dailyArtistHeading">Daily Artist</h2>', '<h2 id="dailyArtistHeading">Artis Harian</h2>')
    .replace('<span class="daily-meta" id="dailyArtistSub">1 artist · 10 tries</span>', '<span class="daily-meta" id="dailyArtistSub">1 artis · 10 tebakan</span>')
    .replaceAll('>Play daily</button>', '>Main harian</button>')
    .replace('<span class="mode-pill">5 stages</span>', '<span class="mode-pill">5 tahap</span>')
    .replace('<span class="lbl">By Artist</span>', '<span class="lbl">Per Artis</span>')
    .replace('<span class="lbl">Playlists</span>', '<span class="lbl">Playlist</span>')
    .replace('id="start">Start</button>', 'id="start">Mulai</button>')
    .replace('<b>Play your favorite artist</b>', '<b>Mainkan artis favoritmu</b>')
    .replace('<span>Pick any artist &mdash; guess 5 of their tracks from 0.1s clips</span>', '<span>Pilih artis bebas &mdash; tebak 5 lagunya dari klip 0,1 detik</span>')
    .replace('Choose artist\n', 'Pilih artis\n')
    .replace('placeholder="Spotify, Apple, or YT link&hellip;"', 'placeholder="Link Spotify, Apple, atau YT&hellip;"')
    .replace('id="loadSpotifyBtn" type="button">Play</button>', 'id="loadSpotifyBtn" type="button">Main</button>')
    .replace('<span class="spotify-rounds-lbl">Songs</span>', '<span class="spotify-rounds-lbl">Lagu</span>')
    .replace('>All</button>', '>Semua</button>')
    .replace('placeholder="Custom"', 'placeholder="Kustom"')
    .replace('Paste Spotify, Apple Music, or YouTube playlist links (or Ctrl+A Spotify tracks)', 'Tempel link playlist Spotify, Apple Music, atau YouTube (atau Ctrl+A lagu Spotify)')
    .replace('<span class="mode-pill is-gold">Higher or lower</span>', '<span class="mode-pill is-gold">Tinggi / rendah</span>')
    .replace('<p id="duelLobbySub">Spotify streams &amp; release year</p>', '<p id="duelLobbySub">Spotify streams &amp; tahun rilis</p>')
    .replace('Play duel\n', 'Main duel\n')
    .replace('<span class="mode-pill is-purple">Endless</span>', '<span class="mode-pill is-purple">Tanpa batas</span>')
    .replace('<p id="artistLobbySub">Deduce the mystery artist from 6 clues</p>', '<p id="artistLobbySub">Tebak artis misterius dari 6 petunjuk</p>')
    .replace('Play artist\n', 'Main artis\n')
    .replace('<span class="lbl">Stats</span>', '<span class="lbl">Statistik</span>')
    .replace('<span class="lbl">Settings</span>', '<span class="lbl">Pengaturan</span>')
    .replace('<span class="lbl">Feedback</span>', '<span class="lbl">Masukan</span>')
    .replace('<h2 id="musicBrowserTitle">Choose your music</h2>', '<h2 id="musicBrowserTitle">Pilih musikmu</h2>')
    .replace('<p class="browser-intro">A few shortcuts for your next Classic run.</p>', '<p class="browser-intro">Pintasan cepat untuk sesi Classic berikutnya.</p>')
    .replace('<h3>Genres</h3>', '<h3>Genre</h3>')
    .replace('<h3>Eras</h3>', '<h3>Era</h3>')
    .replace('data-guide-genre="lain">Other</button>', 'data-guide-genre="lain">Lainnya</button>')
    .replace('data-guide-era="old">Before 2000</button>', 'data-guide-era="old">Sebelum 2000</button>')
    .replace('<p class="browser-note">Genre shortcuts include every era; era shortcuts include every genre. Combine both using the filters above.</p>', '<p class="browser-note">Pintasan genre mencakup semua era; pintasan era mencakup semua genre. Gabungkan keduanya lewat filter di atas.</p>')
    .replace('<h2 id="faqTitle">Good to know</h2>', '<h2 id="faqTitle">Perlu diketahui</h2>')
    .replace('>Daily Challenge</a>', '>Tantangan Harian</a>')
    .replace('>By Artist</a>', '>Per Artis</a>')
    .replace('>Playlist Quiz</a>', '>Kuis Playlist</a>')
    .replace('<a href="/" hreflang="en" lang="en" data-mode-link="lang-en" aria-current="page">EN</a>', '<a href="/" hreflang="en" lang="en" data-mode-link="lang-en">EN</a>')
    .replace('<a href="/id" hreflang="id" lang="id" data-mode-link="lang-id">ID</a>', '<a href="/id" hreflang="id" lang="id" data-mode-link="lang-id" aria-current="page">ID</a>')
    .replace('Back to top <svg', 'Kembali ke atas <svg');

  const idFaqMarkup = ID_FAQS.map(([q, a]) => `      <details><summary>${escHtml(q)}</summary><p>${escHtml(a)}</p></details>`).join('\n');
  out = out.replace(
    /(<section class="guide-faq" aria-labelledby="faqTitle">\s*<h2 id="faqTitle">[^<]+<\/h2>\s*)([\s\S]*?)(\s*<\/section>)/,
    `$1${idFaqMarkup}$3`
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
    .replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${page.lang === 'id' ? 'id_ID' : 'en_US'}">`)
    .replace(/<meta property="og:locale:alternate" content="[^"]*">/, `<meta property="og:locale:alternate" content="${page.lang === 'id' ? 'en_US' : 'id_ID'}">`)
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
  if (page.lang === 'id') {
    html = localizeIdStaticHtml(html);
  }
  // Ensure static assets load from origin root on subpages regardless of trailing slash.
  html = html
    .replace(/(\s(?:href|src))="(?!https?:|\/\/|\/|#|data:|mailto:)([^"]+)"/g, '$1="/$2"')
    .replace('register("sw.js"', 'register("/sw.js"');

  fs.writeFileSync(path.join(output, `${page.slug}.html`), html);
}

fs.cpSync(path.join(root, 'fonts'), path.join(output, 'fonts'), { recursive: true });
fs.writeFileSync(path.join(output, '_routes.json'), JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }));
console.log(`Built Cloudflare Pages assets + ${SEO_PAGES.length} SEO landing pages for ${site.origin}`);
