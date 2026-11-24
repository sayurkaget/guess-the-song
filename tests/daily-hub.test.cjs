const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const Hub = require('../daily-hub.js');
const ArtistDetective = require('../artist-game.js');

function loadBrowserGlobal(relPath, key) {
  const code = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const ctx = { window: {}, globalThis: {} };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.runInNewContext(code, ctx);
  return ctx[key];
}

test('TuneUpDailyHub.planDay is deterministic, picks 3 distinct games from 8, and varies across days', () => {
  assert.equal(Hub.GAMES.length, 8);
  const a1 = Hub.planDay('2026-11-24');
  const a2 = Hub.planDay('2026-11-24');
  assert.deepEqual(a1, a2);
  assert.equal(a1.length, 3);
  assert.equal(new Set(a1.map((s) => s.gameId)).size, 3);
  assert.deepEqual([...a1.map((s) => s.diffKey)].sort(), ['easy', 'hard', 'medium']);
  assert.deepEqual([...a1.map((s) => s.diffTier)].sort((x, y) => x - y), [1, 2, 3]);

  const seenGames = new Set();
  const seenCombos = new Set();
  for (let d = 1; d <= 30; d++) {
    const dayStr = `2026-12-${String(d).padStart(2, '0')}`;
    const plan = Hub.planDay(dayStr);
    assert.equal(plan.length, 3);
    assert.equal(new Set(plan.map((s) => s.gameId)).size, 3);
    plan.forEach((s) => seenGames.add(s.gameId));
    seenCombos.add(plan.map((s) => s.gameId).join(','));
  }
  assert.equal(seenGames.size, 8, 'All 8 music games should rotate into the Daily spin pool');
  assert.ok(seenCombos.size >= 15, 'Daily combinations should stay varied across a month');
});

test('TuneUpDailyHub scoring helpers calculate exact 0..100 points across tries, pairs, and HSL color match', () => {
  assert.equal(Hub.scoreTries(true, 1, 5), 100);
  assert.equal(Hub.scoreTries(true, 2, 5), 80);
  assert.equal(Hub.scoreTries(true, 5, 5), 20);
  assert.equal(Hub.scoreTries(false, 5, 5), 0);
  assert.equal(Hub.scoreTries(true, 1, 10), 100);
  assert.equal(Hub.scoreTries(true, 10, 10), 10);

  assert.equal(Hub.scorePairs(0, 5), 0);
  assert.equal(Hub.scorePairs(3, 5), 60);
  assert.equal(Hub.scorePairs(5, 5), 100);

  assert.equal(Hub.scoreColorMatch([200, 80, 50], [200, 80, 50]), 100);
  assert.ok(Hub.scoreColorMatch([358, 80, 50], [2, 80, 50]) >= 95, 'Hue wrap-around near 0/360 must stay accurate');
  assert.ok(Hub.scoreColorMatch([20, 80, 50], [200, 80, 50]) < 45, 'Opposite hue should score low');
});

test('TuneUpDailyHub.streakOverview computes 28-day grid, current/best streak, and next milestone', () => {
  const ov = Hub.streakOverview(['2026-11-20', '2026-11-22', '2026-11-23', '2026-11-24'], '2026-11-24');
  assert.equal(ov.days28.length, 28);
  assert.equal(ov.days28[27].day, '2026-11-24');
  assert.equal(ov.days28[27].isToday, true);
  assert.equal(ov.days28[27].played, true);
  assert.equal(ov.current, 3);
  assert.equal(ov.best, 3);
  assert.equal(ov.totalDays, 4);
  assert.equal(ov.nextMilestone, 7);

  const emptyOv = Hub.streakOverview([], '2026-11-24');
  assert.equal(emptyOv.current, 0);
  assert.equal(emptyOv.best, 0);
  assert.equal(emptyOv.nextMilestone, 3);
});

test('TuneUpDailyHub.summarizeHistogram builds 15 bands, beatPct, rank, and handles empty fallback', () => {
  const bands = new Array(15).fill(0);
  bands[5] = 4;  // 100-119
  bands[10] = 6; // 200-219
  bands[12] = 2; // 240-259 (user band)
  bands[14] = 1; // 280-300
  const s = Hub.summarizeHistogram({ plays: 13, avgScore: 188, bands }, 245);
  assert.equal(s.bands.length, 15);
  assert.equal(s.bands[12].isUser, true);
  assert.equal(s.plays, 13);
  assert.equal(s.rank, 2); // 1 player strictly above band 12 -> rank #2
  assert.ok(s.beatPct >= 70 && s.beatPct <= 95);

  const solo = Hub.summarizeHistogram(null, 260);
  assert.equal(solo.plays, 1);
  assert.equal(solo.bands.length, 15);
  assert.equal(solo.bands[13].isUser, true);
});

test('TUNEUP_DAILY_HUB_DATA banks are verified against songs.js and ArtistDetective top 530 roster', () => {
  const Data = loadBrowserGlobal('daily-hub-data.js', 'TUNEUP_DAILY_HUB_DATA');
  const songs = loadBrowserGlobal('songs.js', 'SONGS');
  const duelStreams = loadBrowserGlobal('duel-streams-v1.js', 'DUEL_STREAMS_V1');

  assert.ok(Data && Array.isArray(Data.albumColors) && Data.albumColors.length >= 40);
  assert.ok(Array.isArray(Data.hairBank) && Data.hairBank.length >= 100);
  assert.ok(Array.isArray(Data.lyricBank) && Data.lyricBank.length >= 70);
  assert.ok(Array.isArray(Data.factBank) && Data.factBank.length >= 75);

  const trackIds = new Set(songs.map((s) => String(s[7] || '')));
  for (const row of Data.albumColors) {
    const [album, artist, artUrl, hsl, diff, trackId] = row;
    assert.ok(album && artist, 'albumColor must have album and artist');
    assert.match(artUrl, /^https:\/\//);
    assert.equal(hsl.length, 3);
    assert.ok(hsl[0] >= 0 && hsl[0] <= 360 && hsl[1] >= 0 && hsl[1] <= 100 && hsl[2] >= 0 && hsl[2] <= 100);
    assert.ok(diff >= 1 && diff <= 3);
    assert.ok(trackIds.has(String(trackId)), `albumColor trackId ${trackId} (${album}) must exist in songs.js`);
  }

  for (const row of Data.lyricBank) {
    const [trackId, title, artist, art, , , lines] = row;
    assert.ok(trackIds.has(String(trackId)), `lyricBank trackId ${trackId} (${title}) must exist in songs.js`);
    assert.ok(title && artist && /^https:\/\//.test(art));
    assert.equal(lines.length, 5);
    lines.forEach((ln) => assert.ok(typeof ln === 'string' && ln.trim().length >= 5));
  }

  const roster = ArtistDetective.buildRoster(songs, duelStreams);
  const artistIds = new Set(roster.map((a) => a.id));
  for (const row of Data.hairBank) {
    const [artistId, name, imgUrl, diff] = row;
    assert.ok(artistIds.has(artistId), `hairBank artistId ${artistId} (${name}) must exist in ArtistDetective roster`);
    assert.match(imgUrl, /^https:\/\//);
    assert.ok(diff >= 1 && diff <= 3);
  }

  let facts = 0, caps = 0;
  for (const row of Data.factBank) {
    const [isFact, diff, claimEn, claimId, expEn, expId] = row;
    assert.ok(isFact === 0 || isFact === 1);
    if (isFact === 1) facts++; else caps++;
    assert.ok(diff >= 1 && diff <= 3);
    assert.ok(claimEn.length > 10 && claimId.length > 10);
    assert.ok(expEn.length > 10 && expId.length > 10);
  }
  assert.ok(facts >= 30 && caps >= 30, `factBank must stay balanced (facts=${facts}, caps=${caps})`);
});

test('/api/daily-stats supports kind=hub with 15-band D1 aggregation and strict 0..300 validation', async () => {
  const { onRequest } = await import(
    'file://' + path.join(ROOT, 'functions/api/daily-stats.js').replace(/\\/g, '/')
  );

  // Minimal in-memory D1 mock for daily_hub_stats
  const hubTable = new Map();
  const mockDb = {
    prepare(sql) {
      let bound = [];
      return {
        bind(...args) { bound = args; return this; },
        async run() {
          if (/INSERT INTO daily_hub_stats/i.test(sql)) {
            const [day, score, ...bands] = bound;
            const cur = hubTable.get(day) || { day, plays: 0, score_sum: 0, bands: new Array(15).fill(0) };
            cur.plays += 1;
            cur.score_sum += Number(score);
            for (let i = 0; i < 15; i++) cur.bands[i] += Number(bands[i] || 0);
            hubTable.set(day, cur);
          }
          return { success: true };
        },
        async first() {
          if (/FROM daily_hub_stats/i.test(sql)) {
            const day = bound[0];
            const cur = hubTable.get(day);
            if (!cur) return null;
            const out = { plays: cur.plays, score_sum: cur.score_sum };
            for (let i = 0; i < 15; i++) out['b' + i] = cur.bands[i];
            return out;
          }
          return null;
        }
      };
    }
  };
  const env = { FEEDBACK_DB: mockDb };
  const makePost = (body) => onRequest({
    request: new Request('https://tuneup.my.id/api/daily-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://tuneup.my.id' },
      body: JSON.stringify(body)
    }),
    env
  });

  // Invalid scores rejected
  const badLow = await makePost({ kind: 'hub', day: '2026-11-24', score: -5 });
  assert.equal(badLow.status, 400);
  const badHigh = await makePost({ kind: 'hub', day: '2026-11-24', score: 305 });
  assert.equal(badHigh.status, 400);

  // Valid POST #1: score 245 -> band 12
  const r1 = await makePost({ kind: 'hub', day: '2026-11-24', score: 245 });
  assert.equal(r1.status, 200);
  const j1 = await r1.json();
  assert.equal(j1.ok, true);
  assert.equal(j1.kind, 'hub');
  assert.equal(j1.plays, 1);
  assert.equal(j1.avgScore, 245);
  assert.equal(j1.bands.length, 15);
  assert.equal(j1.bands[12], 1);

  // Valid POST #2: score 300 -> band 14
  const r2 = await makePost({ kind: 'hub', day: '2026-11-24', score: 300 });
  assert.equal(r2.status, 200);
  const j2 = await r2.json();
  assert.equal(j2.plays, 2);
  assert.equal(j2.avgScore, 273);
  assert.equal(j2.bands[12], 1);
  assert.equal(j2.bands[14], 1);

  // Valid GET
  const g1 = await onRequest({
    request: new Request('https://tuneup.my.id/api/daily-stats?kind=hub&day=2026-11-24'),
    env
  });
  assert.equal(g1.status, 200);
  const gj = await g1.json();
  assert.equal(gj.plays, 2);
  assert.equal(gj.avgScore, 273);
  assert.deepEqual(gj.bands, j2.bands);
});

test('Wave 99 files are wired in index.html, sw.js, and tools/build-cloudflare.cjs', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const build = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');

  for (const script of ['daily-hub-data.js', 'daily-hub.js', 'mini-games.js']) {
    assert.match(html, new RegExp(`src="${script}"`));
    assert.match(sw, new RegExp(`'\\./${script}'`));
    assert.match(build, new RegExp(`'${script}'`));
  }
  const mg = fs.readFileSync(path.join(ROOT, 'mini-games.js'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.match(html, /id="dailyHub"[\s\S]*id="dhSpinPanel"[\s\S]*class="dh-reel-payline"[\s\S]*id="dhScorePanel"/);
  assert.match(html, /id="dhShareBtn"[^>]*><svg class="btn-ico"[\s\S]*<span class="lbl">Share result<\/span>/);
  assert.match(html, /id="dhMenuBtn"[^>]*><svg class="btn-ico"[\s\S]*<span class="lbl">Back to menu<\/span>/);
  assert.match(html, /id="miniGame"[\s\S]*id="mgArena"[\s\S]*id="dhStepModal"/);
  assert.match(mg, /function playSpinTick\(/);
  assert.match(mg, /function playSpinLock\(/);
  assert.match(mg, /function renderAttemptSlots\(/);
  assert.match(mg, /function hslToHex\(/);
  assert.doesNotMatch(mg, /mg-album-tint/);
  assert.doesNotMatch(mg, /mgPlayPreview/);
  assert.match(mg, /id="mgRevArt"/);
  assert.match(mg, /id="mgVolSlot"/);
  assert.match(app, /dockMiniVolume/);
  assert.match(app, /undockMiniVolume/);
  for (const slug of ['cover-pixel', 'album-color', 'hairspot', 'fact-or-cap', 'lyric-guess']) {
    assert.match(app, new RegExp(`'${slug}'`));
    assert.match(mg, new RegExp(`'${slug}'`));
    assert.match(build, new RegExp(`slug:\\s*'${slug}'`));
    assert.match(sitemap, new RegExp(`/${slug}<`));
  }
  assert.match(sw, /gts-v14\d-wave/);
  assert.match(build, /gts-cf-v12\d-wave/);
});
