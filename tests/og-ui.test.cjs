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
  assert.match(html, /property="og:image" content="https:\/\/tuneup\.pages\.dev\/og-image\.png"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="twitter:image" content="https:\/\/tuneup\.pages\.dev\/og-image\.png"/);
  assert.doesNotMatch(html, /leaderboardModal|openLeaderboard|dailyLbBox|duelLbBox/);

  const buildScript = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');
  assert.match(buildScript, /'og-image\.png'/);
});

test('1-song summary shelf keeps .run-playbtn inline, modal uses overflow:clip, and mobile layout guards exist', () => {
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  assert.match(css, /\.runlist\.run-shelf\[data-count="1"\] \.run-playbtn\{position:static;grid-column:3;grid-row:1 \/ 3;/);
  assert.match(css, /\.runlist\.run-shelf li\{\s*position:relative;/);
  assert.match(css, /\.modal\{[^}]*overflow:clip/);
  assert.match(css, /#duelModal \.sheet\.run-sheet \.r-actions\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1\.48fr\)\}/);
  assert.match(css, /\.spotle-result-actions\{width:100%;display:flex;flex-direction:column-reverse;/);
  assert.match(css, /\.sheet\.run-sheet \.run-foot-links\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);/);
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
  assert.match(app, /const ROUTE_SLUGS = new Set\(\['daily', 'classic', 'artist', 'spotify', 'duel', 'artist-detective', 'detective'\]\);/);
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
