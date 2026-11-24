const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { isStudio } = require(path.join(ROOT, 'recordings.js'));
const PRESETS = require(path.join(ROOT, 'presets.js'));

const apiSource = fs.readFileSync(path.join(ROOT, 'functions/api/daily-stats.js'), 'utf8');
const apiHandler = import('data:text/javascript;base64,' + Buffer.from(apiSource).toString('base64'));

function createMockDb() {
  const rows = new Map();
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              const [kind, day] = args;
              return rows.get(`${kind}:${day}`) || null;
            },
            async run() {
              if (/INSERT INTO daily_stats/i.test(sql)) {
                const [kind, day, winInc, triesInc, b1, b2, b3, b4, b5] = args;
                const key = `${kind}:${day}`;
                const prev = rows.get(key) || { plays: 0, wins: 0, tries_sum: 0, t1: 0, t2: 0, t3: 0, t4: 0, t5: 0 };
                rows.set(key, {
                  plays: prev.plays + 1,
                  wins: prev.wins + winInc,
                  tries_sum: prev.tries_sum + triesInc,
                  t1: prev.t1 + b1,
                  t2: prev.t2 + b2,
                  t3: prev.t3 + b3,
                  t4: prev.t4 + b4,
                  t5: prev.t5 + b5
                });
                return { success: true };
              }
              return { success: false };
            }
          };
        }
      };
    }
  };
}

test('Wave 85 /api/daily-stats validates requests and aggregates anonymous Daily Song & Artist stats', async () => {
  const { onRequest } = await apiHandler;
  const db = createMockDb();
  const today = new Date().toISOString().slice(0, 10);

  const post = (body, headers = {}) => onRequest({
    request: new Request('https://tuneup.my.id/api/daily-stats', {
      method: 'POST',
      headers: { Origin: 'https://tuneup.my.id', 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    }),
    env: { FEEDBACK_DB: db }
  });

  // Empty GET (must be no-store so newly submitted solves appear immediately)
  const g0 = await onRequest({
    request: new Request(`https://tuneup.my.id/api/daily-stats?kind=song&day=${today}`),
    env: { FEEDBACK_DB: db }
  });
  assert.equal(g0.status, 200);
  assert.equal(g0.headers.get('Cache-Control'), 'no-store');
  const g0Body = await g0.json();
  assert.equal(g0Body.plays, 0);
  assert.equal(g0Body.winRate, 0);

  // Rejections
  assert.equal((await post({ kind: 'song', day: today, won: true, tries: 2 }, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post({ kind: 'bad', day: today, won: true, tries: 2 })).status, 400);
  assert.equal((await post({ kind: 'song', day: '2020-01-01', won: true, tries: 2 })).status, 400);
  assert.equal((await post({ kind: 'song', day: today, won: true, tries: 6 })).status, 400);
  assert.equal((await post({ kind: 'artist', day: today, won: true, tries: 11 })).status, 400);

  // Valid Daily Song submissions: win in 1, win in 3, loss
  const p1 = await (await post({ kind: 'song', day: today, won: true, tries: 1 })).json();
  assert.equal(p1.plays, 1);
  assert.equal(p1.wins, 1);
  assert.equal(p1.winRate, 100);
  assert.equal(p1.avgTries, 1);

  await post({ kind: 'song', day: today, won: true, tries: 3 });
  const p3 = await (await post({ kind: 'song', day: today, won: false, tries: 0 })).json();
  assert.equal(p3.plays, 3);
  assert.equal(p3.wins, 2);
  assert.equal(p3.winRate, 67);
  assert.equal(p3.avgTries, 2);
  assert.deepEqual(p3.buckets, [1, 0, 1, 0, 0]);

  // Valid Daily Artist submission: win in 4 tries -> bucket 2 (3-4 tries)
  const a1 = await (await post({ kind: 'artist', day: today, won: true, tries: 4 })).json();
  assert.equal(a1.plays, 1);
  assert.equal(a1.wins, 1);
  assert.equal(a1.avgTries, 4);
  assert.deepEqual(a1.buckets, [0, 1, 0, 0, 0]);
});

test('Wave 85/86 Quick Preset Playlists (12 curated & dynamic) and foreground confetti are wired cleanly', () => {
  assert.ok(Array.isArray(PRESETS) && PRESETS.length === 12, 'expected 12 presets across 3 refresh pages');
  const ids = PRESETS.map((p) => p.id);
  assert.deepEqual(ids, ['indo', 'kpop', 'anime', 'throwback', 'y10s', 'y90s', 'y20s', 'rock', 'hiphop', 'rnb', 'indie', 'edm']);
  for (const p of PRESETS) {
    assert.ok(p.cover && /^https:\/\//.test(p.cover), `${p.id} must have HTTPS cover`);
    if (Array.isArray(p.tracks)) {
      assert.ok(p.tracks.length >= 35, `${p.id} must have >= 35 pinned tracks (got ${p.tracks.length})`);
      const seen = new Set();
      for (const row of p.tracks) {
        const [title, artist, year, trackId] = row;
        assert.ok(title && artist, `${p.id} track missing title/artist`);
        assert.ok(Number.isInteger(trackId) && trackId > 0, `${p.id} invalid trackId for ${title}`);
        assert.ok(!seen.has(trackId), `${p.id} duplicate trackId ${trackId}`);
        seen.add(trackId);
        assert.ok(isStudio({ trackName: title, artistName: artist }), `${p.id} non-studio track leaked: ${title} — ${artist}`);
      }
    } else {
      assert.ok(p.filter && p.filter.limit === 50, `${p.id} dynamic preset must define filter with limit 50`);
    }
  }

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /id="presetPlaylists"/);
  assert.match(html, /id="dailyCommunity"/);
  assert.match(html, /id="agDailyCommunity"/);
  assert.match(html, /<script src="presets\.js"><\/script>/);

  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.match(css, /\.confetti\{[\s\S]*?z-index:5;/, 'confetti must render above modal windows');

  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /'\.\/presets\.js'/);

  const build = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');
  assert.match(build, /'presets\.js'/);
  assert.match(build, /'favicon\.ico'/);

  // Wave 90: real multi-resolution favicon.ico (48x48, 32x32, 16x16), spoiler-free mid-round Track ID in feedback, and broken-preview blocklist
  const ico = fs.readFileSync(path.join(ROOT, 'favicon.ico'));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  assert.equal(ico.readUInt8(6), 48);
  assert.equal(ico.readUInt8(7), 48);
  assert.match(html, /<link rel="icon" href="favicon\.ico" sizes="48x48">/);
  assert.match(sw, /'\.\/favicon\.ico'/);

  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.match(app, /activeTrackId \? 'Track ID: ' \+ activeTrackId : ''/);
  const { resolvePreviewUrl } = require('../recordings.js');
  assert.equal(isStudio({ trackName: 'Passionfruit', artistName: 'Drake', trackId: 1440892167 }), true);
  assert.equal(
    resolvePreviewUrl({ trackId: 1440892167, previewUrl: 'https://audio-ssl.itunes.apple.com/broken.m4a' }),
    'https://p.scdn.co/mp3-preview/f54450b33a17422d771eb9c70f171cb015273dc9'
  );
  assert.equal(
    resolvePreviewUrl({ trackId: 1440891494, previewUrl: 'https://audio-ssl.itunes.apple.com/broken-explicit.m4a' }),
    'https://p.scdn.co/mp3-preview/f54450b33a17422d771eb9c70f171cb015273dc9'
  );
  // Wave 92 & 93: mobile search animates scroll back to top (260ms cubic ease) when text is cleared, keyboard closes, or guess is chosen
  assert.match(app, /function animateMobileScrollTo\(targetY, durationMs, onDone\)/);
  assert.match(app, /animateMobileScrollTo\(0, 260, removeRunwayClass\)/);
  assert.match(app, /searchKeyboardOpen && fullH - curH < 60/);

  // Wave 94: Option B 2-line Daily Community Comparison Card (.dc-row, .dc-head, .dc-badge, .dc-sub)
  assert.match(app, /function formatDailyCommunity\(data, kind = 'song', userWon = true, userTries = 1\)/);
  assert.match(app, /dcFasterThan/);
  assert.match(app, /dcFastestFirst/);
  assert.match(app, /dcBadgeWin/);
  assert.match(app, /dcSubSongWin/);
  const layoutCss = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  assert.match(layoutCss, /\.daily-community \.dc-badge\{/);
  assert.match(layoutCss, /\.daily-community \.dc-sub\{/);

  // Wave 97: modal volume slots (#resultVolSlot, #runVolSlot, #duelModalVolSlot) & Daily Artist bucket pair labels
  assert.match(html, /id="resultVolSlot"/);
  assert.match(html, /id="runVolSlot"/);
  assert.match(html, /id="duelModalVolSlot"/);
  assert.match(app, /function restoreActiveVolSlot\(\)/);
  assert.match(app, /\['1–2 tries', '3–4 tries', '5–6 tries', '7–8 tries', '9–10 tries'\]/);
});
