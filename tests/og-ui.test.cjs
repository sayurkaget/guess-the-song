const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('og-image.png is a valid 1200x630 PNG wired into index.html and build script', () => {
  const imgPath = path.join(ROOT, 'og-image.png');
  const buf = fs.readFileSync(imgPath);
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /property="og:image" content="https:\/\/tuneup\.my\.id\/og-image\.png"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="twitter:image" content="https:\/\/tuneup\.my\.id\/og-image\.png"/);
  assert.doesNotMatch(html, /leaderboardModal|openLeaderboard|dailyLbBox|duelLbBox/);

  const buildScript = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');
  assert.match(buildScript, /'og-image\.png'/);
});

test('1-song summary shelf keeps .run-playbtn inline, modal uses overflow:clip, and mobile layout guards exist', () => {
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  assert.match(css, /\.runlist\.run-shelf\[data-count="1"\] \.run-playbtn\{position:static;grid-column:3;grid-row:1 \/ 3;/);
  assert.match(css, /\.runlist\.run-shelf li\{\s*position:relative;/);
  assert.match(css, /\.modal\{[^}]*overflow:clip/);
  assert.match(css, /#duelModal \.sheet\.run-sheet \.r-actions\{display:grid;grid-template-columns:minmax\(0,\.88fr\) minmax\(0,1\.35fr\);/);
  assert.match(css, /\.spotle-result-actions\{width:100%;display:flex;flex-direction:column-reverse;/);
  assert.match(css, /\.sheet\.run-sheet \.run-foot-links\{display:grid;grid-template-columns:1fr;/);
});

test('Wave 49 audio, retry, artist detective, score card, and Spotify focus fixes stay intact', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.doesNotMatch(app, /function seekOnceReady\(/);
  assert.match(app, /const failedSlugs = new Set\(\);/);
  assert.match(app, /saveRun\(\);\s*playSfx\(won \? \(\(S\.daily \|\| \(S\.runDone && score\(\) >= stageCount\(\)\)\) \? 'fanfare' : 'win'\) : 'wrong'\);/);
  assert.match(app, /function moveAgSel\(dir\)[\s\S]*?!items\[idx\]\.disabled/);
  assert.match(app, /function giveUpArtist\(\)[\s\S]*?#agQ'\)\.blur\(\)/);
  assert.match(app, /summaryAudio\.addEventListener\('loadedmetadata', applyResume, \{ once: true \}\)/);

  const guide = fs.readFileSync(path.join(ROOT, 'site-guide.js'), 'utf8');
  assert.match(guide, /#classicSpotifyPanel:not\(\[hidden\]\) #spotifyUrl/);

  const card = fs.readFileSync(path.join(ROOT, 'score-card.js'), 'utf8');
  assert.match(card, /const startY = Math\.round\(825 - \(\(n - 1\) \* step\) \/ 2\);/);

  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.webmanifest'), 'utf8'));
  assert.match(manifest.description, /Spotify Playlist/i);
});

test('Wave 50 clean per-mode URL routing & popstate Back navigation are wired', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.match(app, /const ROUTE_SLUGS = new Set\(\[\s*'daily', 'classic', 'artist', 'spotify', 'duel', 'artist-detective', 'detective', 'id'[\s\S]*'cover-pixel', 'mv-spot', 'album-color', 'hairspot', 'fact-or-cap', 'lyric-guess'/);
  assert.match(app, /function syncRoute\(/);
  assert.match(app, /syncRoute\('daily'/);
  assert.match(app, /syncRoute\('classic'/);
  assert.match(app, /syncRoute\('spotify'/);
  assert.match(app, /syncRoute\('artist'/);
  assert.match(app, /syncRoute\('duel'/);
  assert.match(app, /syncRoute\('artist-detective'/);
  assert.match(app, /addEventListener\('popstate'/);
  assert.match(app, /function siteUrl\(\) \{ return \(\(locObj\(\) && locObj\(\)\.origin\) \|\| ''\) \+ ROOT_PATH; \}/);
});

test('Wave 51 Music Duel Hover Play switch is wired in HTML, CSS, and persisted in app.js', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /id="duelHoverToggle"[^>]*role="switch"/);

  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  assert.match(css, /\.duel-hover-toggle\[aria-checked="true"\]/);
  assert.match(css, /@media\(hover:none\),\(pointer:coarse\)\{\s*\.duel-hover-toggle\{display:none\}/);

  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.match(app, /hover:\s*'tl:duel:hoverPlay'/);
  assert.match(app, /if \(!hoverPlayEnabled \|\| manualPausedSlot === slot\) return;/);
  assert.match(app, /if \(hoverPlayEnabled && activeSlot === slot\)/);
});

test('Wave 53 fuzzy search handles typos & missing spaces accurately on full songs.js catalog', () => {
  const vm = require('node:vm');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const normMatch = app.match(/const norm = \(s\) => \{[\s\S]*?\n  \};\n/);
  const fuzzyMatch = app.match(/const ED_R0 = new Uint8Array\(64\);[\s\S]*?function searchIndex\(q\) \{[\s\S]*?\n  \}/);
  assert.ok(normMatch && fuzzyMatch, 'norm & fuzzy searchIndex helpers must exist in app.js');

  const songCtx = { window: {} };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'songs.js'), 'utf8'), vm.createContext(songCtx));
  const ctx = vm.createContext({
    Uint8Array,
    Math,
    Set,
    Map,
    S: { custom: null, daily: null },
    ALL: []
  });
  vm.runInContext(normMatch[0] + '\n' + fuzzyMatch[0] + '\nthis.norm = norm; this.searchIndex = searchIndex;', ctx);
  ctx.ALL = songCtx.window.SONGS.map((s, i) => ({
    i, title: s[0], artist: s[1], tier: s[2], slug: String(i), hay: ctx.norm(s[0] + ' ' + s[1])
  }));

  const t0 = Date.now();
  const cases = [
    ['bohemain rhapsody', (r) => r.title.toLowerCase().includes('bohemian rhapsody') && r.artist === 'Queen'],
    ['the weekend', (r) => r.artist === 'The Weeknd'],
    ['taylr swift', (r) => r.artist === 'Taylor Swift'],
    ['taylorswift', (r) => r.artist === 'Taylor Swift'],
    ['billie elish', (r) => r.artist === 'Billie Eilish'],
    ['ariana granda', (r) => r.artist === 'Ariana Grande'],
    ['kendrik lmar', (r) => r.artist === 'Kendrick Lamar']
  ];
  for (const [query, pred] of cases) {
    const hits = ctx.searchIndex(query);
    assert.ok(hits.length > 0, `expected fuzzy hits for "${query}"`);
    assert.ok(hits.slice(0, 15).some(pred), `expected top results for "${query}" to include intended match`);
  }
  assert.equal(ctx.searchIndex('xyzqqqvvv').length, 0, 'gibberish should return no matches');
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 1500, `fuzzy search suite should remain fast (took ${elapsed}ms)`);
});

test('Wave 53/54 Artist Detective Clue + Name Hints and SEO sitemap/JSON-LD are wired cleanly', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /id="agHintBtn"/);
  assert.match(html, /id="agHintLbl"/);
  assert.match(html, /id="agHintBox"/);
  assert.doesNotMatch(html, /id="agPlaySongBtn"|id="agAudioHint"/);
  const ldJson = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ldJson, 'JSON-LD script must exist');
  assert.match(ldJson[1], /Spotify Playlist/);

  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  for (const route of ['/', '/daily', '/classic', '/artist', '/spotify', '/duel', '/artist-detective']) {
    assert.ok(sitemap.includes(`https://tuneup.my.id${route}</loc>`), `sitemap.xml missing ${route}`);
  }

  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.match(app, /const AG_HINT1_AFTER = AD\.HINT1_AFTER \|\| 5;/);
  assert.match(app, /const AG_HINT2_AFTER = AD\.HINT2_AFTER \|\| 7;/);
  assert.match(app, /function revealAgHint\(\)/);
  assert.match(app, /AD\.pickClueHint\(ag\.guesses, ag\.target\)/);
  assert.match(app, /AD\.nameHint\(ag\.target\)/);
  assert.match(app, /function openAgDD\(query\)[\s\S]*?fuzzyMatchScore\(toks, qCompact, a\)/);

  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  assert.match(css, /\.spotle-hint-box\{/);
  assert.match(css, /\.spotle-hint-chip\{/);
});

test('Wave 58 summary modal footer aligns Daily in 2x2 grid and wide sheets in 1 row', () => {
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  assert.match(css, /\.run-foot\{[\s\S]*?justify-content:space-between;[\s\S]*?flex-wrap:nowrap;/);
  assert.match(css, /\.sheet\.run-sheet\[data-mode="daily"\] \.run-foot\{[\s\S]*?flex-direction:column;/);
  assert.match(css, /\.sheet\.run-sheet\[data-mode="daily"\] \.r-actions\{[\s\S]*?grid-template-columns:minmax\(0,\.92fr\) minmax\(0,1\.28fr\);/);
  assert.match(css, /\.sheet\.run-sheet\[data-mode="daily"\] \.run-foot-links\{[\s\S]*?grid-template-columns:1fr;/);
  assert.match(css, /\.sheet\.run-sheet #backToMenu,\s*\.sheet\.run-sheet #duelMenu\{[\s\S]*?color:var\(--dim\);/);
  assert.doesNotMatch(css, /\.run-foot-links\{\s*gap:1\.15rem;/);
});

test('Wave 63 search dropdowns and modals reset scrollTop to 0 whenever opened or closed', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.match(app, /this\.dd\.hidden = false;\s*this\.dd\.scrollTop = 0;/);
  assert.match(app, /closeDD\(\) \{[\s\S]*?this\.dd\.scrollTop = 0;\s*this\.dd\.hidden = true;/);
  assert.match(app, /dd\.hidden = false;\s*dd\.scrollTop = 0;\s*\$\('#agQ'\)/);
  assert.match(app, /closeAgDD\(\) \{[\s\S]*?dd\.scrollTop = 0;\s*dd\.hidden = true;/);
  assert.match(app, /box\.hidden = false;\s*box\.scrollTop = 0;/);
  assert.match(app, /function open\(m\) \{[\s\S]*?m\.hidden = false;\s*m\.scrollTop = 0;/);
  assert.match(app, /UI\.q\.addEventListener\('focus'/);
  assert.match(app, /UI\.q\.addEventListener\('click'/);
  assert.match(app, /\$\('#agQ'\)\.addEventListener\('focus', reopenAgDD\)/);
  assert.match(app, /\$\('#agQ'\)\.addEventListener\('click', reopenAgDD\)/);
});

test('Wave 64 compacts songs.js, caches search buckets, widens sparse Stage 5 fallback, and localizes gameplay', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const songsStat = fs.statSync(path.join(ROOT, 'songs.js'));
  assert.ok(songsStat.size < 5 * 1024 * 1024, 'expected compacted songs.js under 5 MB raw, got ' + songsStat.size);
  assert.match(app, /get nt\(\)/);
  assert.match(app, /get na\(\)/);
  assert.match(app, /const buckets = new Array\(35\)/);
  assert.match(app, /requestIdleCallback/);
  assert.match(app, /const srcStreamed = streamedTids\.size/);
  assert.match(app, /tr\('triedBadge'\)/);
  assert.match(app, /tr\('guessedIn'/);
  assert.match(app, /tr\('toastCopiedFriend'\)/);
  assert.match(sw, /url\.pathname\.startsWith\('\/fonts\/'\)/);
});

test('Wave 65 wires zero-wait next-stage preload and persistent recent playlists across HTML, CSS, i18n, and app.js', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
  const Backup = require('../backup.js');

  assert.match(html, /id="recentPlaylists" hidden/);
  assert.match(css, /\.recent-playlists\{/);
  assert.match(css, /\.recent-pl-chip\[data-src="apple"\]/);
  assert.match(css, /\.recent-pl-chip\[data-src="youtube"\]/);
  assert.match(i18n, /recentPlaylists:\s*'Recent playlists'/);
  assert.match(i18n, /recentPlaylists:\s*'Playlist terakhir'/);

  assert.match(app, /function computePoolForStage\(stageIdx\)/);
  assert.match(app, /function preloadNextStage\(\)/);
  assert.match(app, /async function takePreloadedStage\(stageIdx, expectedEpoch\)/);
  assert.match(app, /function clearNextPreload\(\)/);
  assert.match(app, /UI\.autoplay\(\);\s*preloadNextStage\(\);/);
  assert.match(app, /const RECENT_PL_KEY = 'tl:recentPlaylists';/);
  assert.match(app, /function renderRecentPlaylists\(\)/);

  // Confirm tl:recentPlaylists is automatically included in TuneUpBackup collect/restore
  const mem = new Map([
    ['tl:recentPlaylists', JSON.stringify([{ id: 'p1', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', label: 'Top Hits', source: 'spotify', count: 50 }])]
  ]);
  const storage = {
    get length() { return mem.size; },
    key: (i) => [...mem.keys()][i] ?? null,
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k)
  };
  const collected = Backup.collect(storage);
  assert.ok(collected['tl:recentPlaylists'], 'tl:recentPlaylists must be preserved by TuneUpBackup');
  const decoded = Backup.decode(Backup.encode(collected));
  assert.equal(decoded.ok, true);
  assert.equal(JSON.parse(decoded.entries['tl:recentPlaylists'])[0].label, 'Top Hits');
});

test('Wave 66 mobile UI polish and remaining ID localization leaks are wired cleanly', () => {
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const fb = fs.readFileSync(path.join(ROOT, 'feedback.js'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');

  assert.match(css, /Wave 66: Comprehensive Mobile UI Polish/);
  assert.match(css, /#statsModal \.badge-grid\{grid-template-columns:1fr;/);
  assert.match(css, /\.sp-tile small\{font-size:\.57rem;letter-spacing:\.035em;white-space:nowrap\}/);
  assert.match(css, /\.spotle-result-actions #agNextBtn\{order:-1\}/);
  assert.match(css, /#customModal \.custom-quick-head\{flex-wrap:nowrap;/);
  assert.doesNotMatch(css, /\.vinyl-card \.spot-play-wrap\{flex-direction:column/);
  assert.match(css, /\.sheet\.run-sheet \.run-head\{display:contents\}/);
  assert.match(css, /#duelModal \.sheet\.run-sheet \.r-actions\{\s*grid-template-columns:minmax\(0,\.84fr\) minmax\(0,1\.42fr\)/);
  assert.match(app, /if \(topCard\) topCard\.hidden = ag\.done;/);
  assert.match(app, /tr\('backupRestore'\)/);
  assert.match(app, /tr\('playAgain'\)/);
  assert.match(fb, /window\.TuneUpI18n/);
  assert.match(i18n, /setText\(\$\('\.classic-title-group \.mode-pill'\), 'stages5'\)/);
});

test('Wave 69 compacts songs.js with dictionary tables under 2.6 MB and wires Daily Artist Detective end-to-end', () => {
  const songsStat = fs.statSync(path.join(ROOT, 'songs.js'));
  assert.ok(songsStat.size < 2.6 * 1024 * 1024, 'expected dictionary-compacted songs.js under 2.6 MB, got ' + songsStat.size);

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
  const TuneUpCard = require('../score-card.js');
  const Backup = require('../backup.js');

  assert.doesNotMatch(html, /id="agTabs"|id="agModeBar"/);
  assert.match(html, /class="daily-game-pill is-purple" id="agDailyMeta"/);
  assert.match(css, /\.daily-game-pill\.is-purple\{/);
  assert.match(app, /tl:artist:daily:v1:/);
  assert.match(app, /tl:artist:daily:completed/);
  assert.match(app, /AD\.dailyArtist\(list, today\)/);
  assert.match(app, /function saveDailyArtistState\(\)/);
  assert.match(i18n, /agTabDaily:\s*'Daily Artist'/);
  assert.match(i18n, /agTabDaily:\s*'Artis Harian'/);

  // Daily Artist score card produces DAILY ARTIST kicker & dated filename
  const dailyCard = TuneUpCard.buildCardData({
    kind: 'artist',
    mode: 'daily',
    day: '2026-11-22',
    dailyStreak: 4,
    won: true,
    tries: 3,
    maxTries: 10,
    rows: [['exact', 'exact', 'exact', 'exact', 'exact', 'exact']],
    url: 'https://tuneup.my.id/'
  });
  assert.equal(dailyCard.kicker, 'DAILY ARTIST');
  assert.equal(dailyCard.filename, 'tuneup-daily-artist-2026-11-22.png');
  assert.match(dailyCard.subtitle, /2026-11-22 · 4-day streak/);

  // Daily Artist storage keys persist automatically through TuneUpBackup
  const mem = new Map([
    ['tl:artist:daily:completed', JSON.stringify(['2026-11-21', '2026-11-22'])],
    ['tl:artist:daily:v1:2026-11-22', JSON.stringify({ day: '2026-11-22', targetId: 'taylor-swift', guessIds: ['taylor-swift'], hints: [], done: true, won: true })]
  ]);
  const storage = {
    get length() { return mem.size; },
    key: (i) => [...mem.keys()][i] ?? null,
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k)
  };
  const collected = Backup.collect(storage);
  assert.ok(collected['tl:artist:daily:completed']);
  assert.ok(collected['tl:artist:daily:v1:2026-11-22']);
});

test('Wave 70/99 promotes Daily Hub onto the homepage alongside Daily Artist Endless mode with full EN/ID parity', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
  const build = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');

  assert.match(html, /id="dailyHubCard"[\s\S]*id="openDailyHub"[\s\S]*id="moreGamesCard"/);
  assert.match(html, /id="streakPillBtn"[\s\S]*id="dailyHubBadge"/);
  assert.match(css, /#lobby \.daily-hub-card\{/);
  assert.match(css, /#lobby \.more-games-card\{/);
  assert.match(app, /function refreshDailyArtist\(\)/);
  assert.match(app, /\$\('#openArtistGame'\)\.onclick\s*=\s*\(\)\s*=>\s*(?:ensureSongsLoaded\(\)\.then\(\(\)\s*=>\s*)?startArtistGame\(null,\s*'free'\)\)?/);
  assert.match(i18n, /dailyHubHeading:\s*'Daily Challenge'/);
  assert.match(i18n, /dailyHubHeading:\s*'Tantangan Harian'/);
  assert.match(i18n, /dailyArtistHeading:\s*'Daily Artist'/);
  assert.match(i18n, /dailyArtistHeading:\s*'Artis Harian'/);
  assert.match(build, /<h2 id="dailyHubHeading">Tantangan Harian<\/h2>/);
});

test('Wave 71 removes Save score card in favor of link-only share buttons, hides mid-Classic shareStage, and redesigns Feedback modal', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const fb = fs.readFileSync(path.join(ROOT, 'feedback.js'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');

  assert.doesNotMatch(html, /id="saveRunCard"|id="saveDuelCard"|id="saveArtistCard"/);
  assert.match(html, /class="btn ghostbtn share-btn" id="share"[\s\S]*<svg[\s\S]*Challenge your friend/);
  assert.match(html, /class="btn ghostbtn share-btn" id="duelShare"[\s\S]*<svg[\s\S]*Challenge your friend/);
  assert.match(html, /class="btn ghostbtn share-btn" id="agShareBtn"[\s\S]*<svg[\s\S]*Challenge your friend/);
  assert.match(app, /if \(shareStageBtn\) shareStageBtn\.hidden = !S\.challenge;/);
  assert.match(app, /function challengeUrlForRun\(\)/);
  assert.match(app, /\$\('#share'\)\.onclick = \(\) => salin\(challengeUrlForRun\(\), 'result_copy'\);/);
  assert.match(app, /salin\(challengeUrl, 'duel_copy', 'duel'\)/);
  assert.match(app, /salin\(challengeUrl, 'artist_copy', 'artist'\)/);
  assert.match(app, /function parseDailyChallengeHash\(hash\)/);
  assert.match(app, /function parsePlaylistChallengeSearch\(search\)/);
  assert.match(i18n, /setBtnLabelKeepSvg\(\$\('#share'\), 'challengeFriend'\)/);
  assert.match(i18n, /setBtnLabelKeepSvg\(\$\('#duelShare'\), 'challengeFriend'\)/);
  assert.match(i18n, /setBtnLabelKeepSvg\(\$\('#agShareBtn'\), 'challengeFriend'\)/);

  // Redesigned original TuneUp feedback modal
  assert.match(html, /id="feedbackCategoryPills"[\s\S]*data-cat="bug"[\s\S]*data-cat="song"[\s\S]*data-cat="other"/);
  assert.match(html, /id="feedbackCharCount"/);
  assert.match(html, /id="fbEmailToggle"/);
  assert.match(html, /id="fbSongChip"/);
  assert.match(css, /\.share-btn\{/);
  assert.match(css, /#feedbackModal \.fb-pills\{/);
  assert.match(fb, /function syncCharCount\(\)/);
  assert.match(fb, /function syncPills\(\)/);
});

test('Wave 73 keeps #resultModal .reveal-foot on a single mobile row and adds cohesive inline icons across modes & modals', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');

  assert.doesNotMatch(css, /#resultModal #reportSong\{display:block;width:100%/);
  assert.match(css, /#resultModal \.reveal-foot\{gap:\.6rem;justify-content:space-between;flex-wrap:nowrap\}/);
  assert.match(css, /\.title-with-ico\{/);
  assert.match(css, /\.btn-ico\{/);
  assert.match(html, /class="title-ico is-green"[\s\S]*id="dailyHubHeading"/);
  assert.match(html, /class="title-ico is-purple"[\s\S]*<h2>Artist Detective<\/h2>/);
  assert.match(html, /class="title-ico is-gold"[\s\S]*<h2>Music Duel<\/h2>/);
  assert.match(html, /id="openStats"[^>]*><svg class="btn-ico"/);
  assert.match(html, /id="listen"[^>]*><svg class="btn-ico"/);
  assert.match(html, /id="reportSong"[^>]*><svg class="btn-ico"/);
  assert.match(html, /id="againRun"[^>]*><svg class="btn-ico"/);
  assert.match(html, /id="backToMenu"[^>]*><svg class="btn-ico"/);
  assert.match(html, /id="sendFeedback"[^>]*><svg class="btn-ico"/);
  assert.match(i18n, /el\.querySelector\('\.lbl'\)/);
});

test('Wave 75 upgrades Badges to 16 Steam-style Achievements with SFX, adds in-app Animations toggle independent of OS, and fixes Daily Play Classic CTA', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const styles = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
  const Badges = require('../badges.js');

  assert.equal(Badges.CATALOG.length, 24);
  assert.match(html, /data-tab="badges"[^>]*>[\s\S]*Achievements/);
  assert.match(html, /id="achToast"[\s\S]*id="achToastTitle"[\s\S]*id="achToastDesc"/);
  assert.match(html, /id="setAnim"[^>]*role="switch"/);
  assert.match(css, /\.ach-toast\{/);
  assert.match(css, /\.badge-card\.is-earned\[data-theme="blue"\]\{/);
  assert.match(css, /\.badge-card\.is-earned\[data-theme="orange"\]\{/);
  assert.doesNotMatch(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(styles, /body\[data-anim="off"\]/);
  assert.match(app, /kind === 'achievement'/);
  assert.match(app, /playSfx\('achievement'\)/);
  assert.match(app, /if \(mode === 'lose' \|\| \(typeof settings !== 'undefined' && !settings\.anim\)\) return;/);
  assert.match(app, /tr\('playClassic'\)/);
  assert.match(i18n, /tabBadges:\s*'Achievements'/);
  assert.match(i18n, /tabBadges:\s*'Pencapaian'/);
  assert.match(i18n, /playClassic:\s*'Play Classic'/);
  assert.match(i18n, /playClassic:\s*'Main Classic'/);
});

test('Wave 76 polishes mobile toast, unifies PC/mobile reveal modal, adds mobile search auto-scroll, and removes This filter tab with icons on all stats tabs', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const styles = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  // 1. Mobile top-floating frosted glass toast
  assert.match(styles, /\.toast::before\{/);
  assert.match(styles, /@keyframes toasttop/);
  assert.match(styles, /top:max\(10px,env\(safe-area-inset-top\)\);bottom:auto/);

  // 2. Unified compact #resultModal on desktop & mobile
  assert.match(css, /#resultModal \.reveal\{\s*width:min\(468px,100%\)/);
  assert.match(css, /\.reveal-info\{display:contents\}/);
  assert.match(css, /\.reveal-body\{grid-column:1 \/ -1/);

  // 3. Mobile search auto-scroll runway + JS helper
  assert.match(css, /body\.is-searching \.wrap/);
  assert.match(css, /max-height:min\(42dvh,256px\)/);
  assert.match(app, /function scrollSearchIntoView\(/);
  assert.match(app, /window\.visualViewport\.addEventListener\('resize'/);

  // 4. Stats tabs: This filter removed + all 5 remaining tabs have inline vector icons
  assert.doesNotMatch(html, /data-tab="filter"/);
  for (const tab of ['overall', 'daily', 'duel', 'artist', 'badges']) {
    assert.match(html, new RegExp('data-tab="' + tab + '"[^>]*><svg class="btn-ico"'));
  }
  assert.match(app, /let statsTab = 'overall';/);
});

test('Wave 77 adds multi-select Genre & Era filters and unifies PC result modals with mobile across all modes', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');

  // 1. Multi-select Genre & Era controls with backward-compatible hidden <select>
  assert.match(html, /id="genreDrop"[\s\S]*id="genre"[\s\S]*id="genreBtn"[\s\S]*id="genreMenu"/);
  assert.match(html, /id="eraDrop"[\s\S]*id="era"[\s\S]*id="eraBtn"[\s\S]*id="eraMenu"/);
  assert.match(css, /#lobby \.multi-btn\{/);
  assert.match(css, /#lobby \.multi-menu\{/);
  assert.match(css, /#lobby #eraDrop \.multi-menu\{left:auto;right:0\}/);
  assert.match(app, /function normalizeMulti\(/);
  assert.match(app, /function toggleMulti\(/);
  assert.match(app, /function formatMulti\(/);
  assert.match(app, /function closeFilterMenus\(/);
  assert.match(i18n, /multiDone:\s*'Done'/);
  assert.match(i18n, /multiDone:\s*'Selesai'/);

  // 2. Unified compact PC/mobile result modals across Run, Daily, Duel, and Artist Detective
  assert.match(css, /\.sheet\.run-sheet\{\s*width:min\(440px,100%\)/);
  assert.match(css, /\.sheet\.run-sheet\[data-mode="daily"\]\{width:min\(468px,100%\)\}/);
  assert.match(css, /\.runlist\.run-shelf\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.run-foot\{[\s\S]*flex-direction:column;align-items:stretch/);
  assert.match(css, /\.spotle-result-banner\{[\s\S]*flex-direction:column;align-items:stretch/);
  assert.match(css, /\.spotle-result-actions\{\s*display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('Wave 78 restores spinning vinyl disc on #resultModal across PC & mobile with dedicated 3-row mobile-friendly typography', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');

  assert.match(html, /class="reveal-tags"[\s\S]*class="reveal-copy"[\s\S]*id="rTitle"[\s\S]*id="rArtist"/);
  assert.match(css, /\.reveal-disc\{\s*display:block;/);
  assert.match(css, /\.reveal-head\{display:contents\}/);
  assert.match(css, /\.reveal-tags\{\s*grid-column:1 \/ -1;grid-row:1;/);
  assert.match(css, /\.reveal-copy\{\s*grid-column:2;grid-row:2;/);
});

test('Wave 79 removes Achievement unlocked kicker and scales down mobile toast & achievement notifications', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const styles = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  assert.doesNotMatch(html, /id="achToastKicker"|Achievement unlocked/);
  assert.doesNotMatch(app, /#achToastKicker|Achievement unlocked/);
  assert.match(css, /@media\(max-width:560px\)\{\s*\.ach-toast\{[\s\S]*max-width:min\(274px/);
  assert.match(styles, /@media \(max-width:600px\)\{\s*\.toast\{[\s\S]*font-size:\.72rem;border-radius:999px/);
});

test('Wave 80 normalizes stroke style, viewBox centering, and optical sizing across all lobby, tab, footer, stats, and feedback icons', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  // All lobby title-ico SVGs use unified outline stroke-width="1.9" (no solid music blob)
  assert.doesNotMatch(html, /class="title-ico[^"]*"[^>]*><path[^>]*fill="currentColor"/);
  assert.match(html, /class="title-ico is-green"[^>]*><rect x="3" y="5" width="18" height="14" rx="3" fill="none"/);
  assert.match(html, /class="title-ico is-purple"[^>]*><circle cx="10\.5" cy="10\.5" r="7\.2"/);
  // Broken zero-length dot on Genre & Era and open-arc playlist / gapped trophy stems are fixed
  assert.doesNotMatch(html, /m4 0h0/);
  assert.doesNotMatch(html, /a2\.5 2\.5 0 1 1-1\.5-2\.3V8\.2/);
  assert.doesNotMatch(html, /m-5 9v4m-4 2h8/);
  assert.doesNotMatch(app, /a2\.5 2\.5 0 1 1-1\.5-2\.3V8\.2/);
  assert.doesNotMatch(app, /m-5 9v4m-4 2h8/);
  assert.match(css, /\.title-ico\{width:20px;height:20px;flex:none;display:block;opacity:\.95\}/);
  assert.match(css, /\.btn-ico\{width:14px;height:14px;flex:none;display:block;opacity:\.88\}/);
});

test('Wave 81 fixes ID localization in custom/result/run modals & /id SSR, removes unused score-card.js load, syncs site-guide anim, and standardizes search icons', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
  const guide = fs.readFileSync(path.join(ROOT, 'site-guide.js'), 'utf8');
  const build = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');

  assert.doesNotMatch(html, /Play regular game/);
  assert.doesNotMatch(app, /Play regular game/);
  assert.doesNotMatch(i18n, /Play regular game|Main mode biasa|#cTitle/);
  assert.match(i18n, /setText\(\$\('#customTitle'\), 'customTitle'\)/);
  assert.match(i18n, /setText\(\$\('#customModal \.custom-lbl'\), 'customSub'\)/);
  assert.match(i18n, /setText\(\$\('#customHint'\), 'customHint'\)/);
  assert.match(app, /tr\('dailyBadgePill'\)/);
  assert.match(app, /tr\('verdictDailyWon'\)/);
  assert.match(app, /tr\('notPlayed'\)/);
  assert.doesNotMatch(html, /src="score-card\.js"/);
  assert.doesNotMatch(build, /'score-card\.js'/);
  assert.match(build, /<span class="multi-lbl">Semua genre<\/span>/);
  assert.match(build, /<span class="lbl">Pencapaian<\/span>/);
  assert.match(guide, /document\.body\.dataset\.anim === 'off'/);
  assert.doesNotMatch(html, /class="search-ico"[^>]*><circle cx="11" cy="11" r="6\.5"/);
});

test('Wave 82 completes ID localization across Duel summary, challenge intros, audio status, and removes stale score-card/badges SEO copy', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
  const build = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');

  assert.match(app, /tr\('browserPausedAudio'\)/);
  assert.match(app, /tr\('loadingSong'\)/);
  assert.match(app, /tr\('dailyResultStreak'/);
  assert.match(app, /tr\('duelVerdictBest'\)/);
  assert.match(app, /'duelSummaryMore'/);
  assert.match(app, /tr\('chArtistTitle'\)/);
  assert.match(app, /tr\('chDuelMsg'/);
  assert.doesNotMatch(build, /save score cards|save purple score cards|save your custom score card|earn badges|lencana/);
  assert.doesNotMatch(i18n, /lencana/);
  assert.match(sitemap, /<lastmod>2026-11-2[3-9]<\/lastmod>/);
});
