const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function makeNode(selector = '') {
  const attrs = {};
  const classes = new Set();
  const listeners = new Map();
  const el = {
    selector,
    hidden: false,
    disabled: false,
    value: '',
    textContent: '',
    innerHTML: '',
    options: [],
    selectedIndex: 0,
    children: [],
    style: {},
    dataset: {},
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      toggle: (c, f) => {
        if (f === undefined) classes.has(c) ? classes.delete(c) : classes.add(c);
        else f ? classes.add(c) : classes.delete(c);
      },
      contains: (c) => classes.has(c)
    },
    get className() { return [...classes].join(' '); },
    set className(v) { classes.clear(); String(v || '').split(/\s+/).filter(Boolean).forEach((x) => classes.add(x)); },
    setAttribute: (k, v) => { attrs[k] = String(v); },
    getAttribute: (k) => attrs[k] || '',
    hasAttribute: (k) => k in attrs,
    appendChild: (child) => { el.children.push(child); return child; },
    addEventListener: (ev, fn) => {
      if (!listeners.has(ev)) listeners.set(ev, []);
      listeners.get(ev).push(fn);
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    focus: () => {},
    click: () => { if (typeof el.onclick === 'function') el.onclick(); }
  };
  return el;
}

function setupGame(options = {}) {
  const storage = new Map(options.storage || []);
  const nodes = new Map();
  const nodeFor = (sel) => {
    if (!nodes.has(sel)) nodes.set(sel, makeNode(sel));
    return nodes.get(sel);
  };
  // Pre-seed tab nodes on #statsTabs
  const tabNodes = ['overall', 'daily', 'duel', 'artist', 'badges'].map((t) => {
    const b = makeNode(t);
    b.dataset.tab = t;
    return b;
  });
  const statsTabs = nodeFor('#statsTabs');
  statsTabs.querySelectorAll = () => tabNodes;

  const songs = options.songs || [
    ['R U Mine?', 'Arctic Monkeys', 2, 'gl', 'rock', 2012, 'https://img/rumine', 1001],
    ['Do I Wanna Know?', 'Arctic Monkeys', 1, 'gl', 'rock', 2013, 'https://img/do', 1002],
    ['505', 'Arctic Monkeys', 1, 'gl', 'rock', 2007, 'https://img/505', 1003],
    ['Mr. Brightside', 'The Killers', 2, 'gl', 'rock', 2003, 'https://img/bright', 1004],
    ['Yellow', 'Coldplay', 1, 'gl', 'rock', 2000, 'https://img/yellow', 1005],
    ['Crying Lightning', 'Arctic Monkeys', 3, 'gl', 'indie', 2009, 'https://img/cl', 1006],
    ['Fluorescent Adolescent', 'Arctic Monkeys', 3, 'gl', 'rock', 2007, 'https://img/fa', 1007]
  ];

  const ctx = vm.createContext({
    window: { SONGS: songs },
    console, Map, Set, Array, Math, Date, AbortSignal,
    setTimeout: () => 0,
    clearTimeout: () => {},
    cancelAnimationFrame: () => {},
    requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: true }),
    history: { replaceState: () => {} },
    location: { origin: 'https://tuneup.my.id', pathname: '/', search: '', hash: '' },
    Audio: class extends EventTarget { pause() {} load() {} },
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k)
    },
    document: {
      createElement: (tag) => makeNode(tag),
      querySelector: (s) => nodeFor(s),
      querySelectorAll: () => [],
      addEventListener: () => {},
      body: { dataset: {}, removeAttribute: () => {} }
    },
    fetch: options.fetch || (async () => ({ ok: false, status: 500, text: async () => '{}' }))
  });

  vm.runInContext(fs.readFileSync(path.join(root, 'recordings.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'daily-pool-v1.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'daily.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'challenge.js'), 'utf8'), ctx);
  const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8')
    .split('  /* ================= event ================= */')[0];
  vm.runInContext(src + '\nglobalThis.test={S,ALL,UI,slug,submitGuess,skip,searchIndex,startCustom,openCustom,clearRecentArtists,refreshPopularArtists,surprisePopularArtist,POPULAR_ARTISTS,localArtistMatches,dailyStats,allClassicStats,songStreak,finish,pickSong,showIncomingChallenge,filtered,normalizeMulti,toggleMulti,formatMulti,GENRE_KEYS,ERA_KEYS,genreLabel,eraLabel};})();', ctx);
  return { t: ctx.test, nodes, storage, ctx, tabNodes };
}

test('guess history renders compact dynamic rows and prevents duplicate guesses in stage & dropdown', () => {
  const { t, nodes } = setupGame();
  const secret = t.ALL[0]; // R U Mine? - Arctic Monkeys
  const wrong = t.ALL[3];  // Mr. Brightside - The Killers
  const near = t.ALL[1];   // Do I Wanna Know? - Arctic Monkeys

  t.S.song = secret;
  t.S.meta = secret;
  t.S.guesses = [];
  t.UI.render();
  assert.equal(nodes.get('#guesses').hidden, true);
  assert.equal(nodes.get('#guesses').innerHTML, '');

  // Attempt 1: wrong guess
  t.submitGuess(wrong);
  assert.equal(t.S.guesses.length, 1);
  assert.equal(nodes.get('#guesses').hidden, false);
  assert.match(nodes.get('#guesses').innerHTML, /Mr\. Brightside/);
  assert.match(nodes.get('#guesses').innerHTML, /0\.1s/);

  // Duplicate attempt 1 does NOT burn try 2!
  t.submitGuess(wrong);
  assert.equal(t.S.guesses.length, 1);
  assert.match(nodes.get('#status').textContent, /Already tried/);

  // Attempt 2: skip
  t.skip();
  assert.equal(t.S.guesses.length, 2);
  assert.match(nodes.get('#guesses').innerHTML, /Skipped/);
  assert.match(nodes.get('#guesses').innerHTML, /0\.5s/);

  // Attempt 3: right artist (near)
  t.submitGuess(near);
  assert.equal(t.S.guesses.length, 3);
  assert.match(nodes.get('#guesses').innerHTML, /Right artist/);
  assert.match(nodes.get('#guesses').innerHTML, /2s/);

  // Dropdown marks tried entries disabled with Tried badge and UI.move skips them
  t.UI.openDD([near, wrong, secret]);
  const ddItems = nodes.get('#dd').children;
  assert.equal(ddItems[0].disabled, true);
  assert.equal(ddItems[1].disabled, true);
  assert.equal(ddItems[2].disabled, false);
  assert.match(ddItems[0].innerHTML, /Tried/);

  t.UI.move(1);
  assert.equal(t.UI.sel, 2); // skips indices 0 & 1!

  // Choosing disabled row does nothing
  t.UI.choose(0);
  assert.equal(t.S.guesses.length, 3);

  // Attempt 4: winning guess
  t.submitGuess(secret);
  assert.equal(t.S.won, true);
  assert.equal(t.S.guesses.length, 4);
  assert.match(nodes.get('#guesses').innerHTML, /8s/);
});

test('searchIndex returns more than 60 tracks for prolific artists', () => {
  const many = Array.from({ length: 85 }, (_, i) => [`Track ${i + 1}`, 'Taylor Swift', 4, 'gl', 'pop', 2020, 'https://img', 5000 + i]);
  const { t } = setupGame({ songs: many });
  const results = t.searchIndex('Taylor Swift');
  assert.equal(results.length, 85);
});

test('custom game shows recent/popular chips, falls back to local catalog when offline, and drops stale races', async () => {
  let resolveSlow;
  let calls = 0;
  const fetchMock = async (url) => {
    calls++;
    if (calls === 1) {
      return await new Promise((resolve) => { resolveSlow = resolve; });
    }
    throw new Error('offline');
  };
  const { t, nodes, storage } = setupGame({ fetch: fetchMock });

  t.openCustom();
  assert.equal(nodes.get('#customQuick').hidden, false);
  assert.match(nodes.get('#customQuick').innerHTML, /Popular artists/);
  assert.equal([...nodes.get('#customQuick').innerHTML.matchAll(/class="artist-chip"/g)].length, 8);

  // Local artist match works cleanly
  const localHits = t.localArtistMatches('arctic');
  assert.equal(localHits.length, 1);
  assert.equal(localHits[0].name, 'Arctic Monkeys');
  assert.match(localHits[0].genre, /5 tracks/);

  // Start slow first artist (stale), then immediately click second artist (local fallback succeeds!)
  nodes.get('#customModal').hidden = false;
  const pSlow = t.startCustom('999', 'Slow Artist');
  const pFast = t.startCustom('62820413', 'Arctic Monkeys');
  await pFast;

  // Fallback loaded Arctic Monkeys' 5 local songs and recorded recent artist
  assert.equal(t.S.custom.label, 'Arctic Monkeys');
  assert.equal(t.S.custom.songs.length, 5);
  const recent = JSON.parse(storage.get('tl:custom:recent'));
  assert.equal(recent[0].name, 'Arctic Monkeys');

  // Late completion of slow request must NOT overwrite active Arctic Monkeys session
  resolveSlow({
    ok: true,
    text: async () => JSON.stringify({
      results: Array.from({ length: 6 }, (_, i) => ({
        wrapperType: 'track', kind: 'song', trackId: 90 + i, trackName: `S${i}`, artistName: 'Slow Artist', previewUrl: 'https://p'
      }))
    })
  });
  await pSlow;
  assert.equal(t.S.custom.label, 'Arctic Monkeys');

  // Recent artists section now appears first when reopening #customModal, with a Clear button
  t.openCustom();
  assert.match(nodes.get('#customQuick').innerHTML, /Recent artists/);
  assert.match(nodes.get('#customQuick').innerHTML, /id="clearRecentArtists"/);

  // Clearing recent artists removes history and shows popular artists cleanly with Refresh button
  t.clearRecentArtists();
  assert.deepEqual(JSON.parse(storage.get('tl:custom:recent')), []);
  assert.doesNotMatch(nodes.get('#customQuick').innerHTML, /Recent artists/);
  assert.match(nodes.get('#customQuick').innerHTML, /Popular artists/);
  assert.match(nodes.get('#customQuick').innerHTML, /id="refreshPopularArtists"/);

  // Refreshing rotates through distinct non-overlapping batches across the 148-artist pool
  const readBatch = () => [...nodes.get('#customQuick').innerHTML.matchAll(/data-name="([^"]+)"/g)].map((m) => m[1]);
  const seenArtists = new Set(readBatch());
  assert.equal(seenArtists.size, 8);
  let prevBatch = [...seenArtists];
  for (let i = 0; i < 17; i++) {
    t.refreshPopularArtists();
    const batch = readBatch();
    assert.equal(batch.length, 8);
    for (const name of batch) {
      assert.equal(seenArtists.has(name), false, `unexpected repeat before full deck: ${name}`);
      seenArtists.add(name);
    }
    prevBatch = batch;
  }
  assert.equal(seenArtists.size, 144);
  // Crossing deck wrap-around still avoids repeating any artist from the just-replaced batch
  for (let i = 0; i < 3; i++) {
    t.refreshPopularArtists();
    const batch = readBatch();
    assert.equal(batch.length, 8);
    for (const name of batch) {
      assert.equal(prevBatch.includes(name), false, `back-to-back repeat on wrap: ${name}`);
    }
    prevBatch = batch;
  }
});

test('stats modal summarizes active filter, all Classic filters combined, and Daily history', () => {
  const storage = new Map();
  storage.set('tl:stats:gl:all:all', JSON.stringify({ runs: 2, total: 8, best: 5, perfect: 1, dist: [0, 0, 0, 1, 0, 1] }));
  storage.set('tl:stats:gl:rock:y10', JSON.stringify({ runs: 1, total: 3, best: 3, perfect: 0, dist: [0, 0, 0, 1, 0, 0] }));

  const { t, nodes, storage: store, ctx, tabNodes } = setupGame({ storage });
  const day2 = ctx.window.DailyGame.day();
  const day1 = ctx.window.DailyGame.previous(day2);
  const s1 = ctx.window.DailyGame.plan(ctx.window.DAILY_POOL_V1, day1)[0];
  const s2 = ctx.window.DailyGame.plan(ctx.window.DAILY_POOL_V1, day2)[0];

  store.set('tl:daily:completed', JSON.stringify([day1, day2]));
  store.set('tl:daily:v2:' + day1, JSON.stringify({
    stage: 0, runDone: true, stages: [{ slug: t.slug(s1), guesses: [{ t: 'wrong' }, { t: 'right' }], done: true, won: true }]
  }));
  store.set('tl:daily:v2:' + day2, JSON.stringify({
    stage: 0, runDone: true, stages: [{ slug: t.slug(s2), guesses: [{ t: 'right' }], done: true, won: true }]
  }));

  // Tab 1 (default): overall Classic (This filter tab removed in Wave 76)
  t.UI.stats();
  assert.equal(tabNodes[0].getAttribute('aria-pressed'), 'true');
  assert.match(nodes.get('#statScope').textContent, /2 presets/);
  assert.match(nodes.get('#statgrid').innerHTML, />3<\/b><small>runs<\/small>/);
  assert.equal(nodes.get('#reset').hidden, true);

  // Tab 2: Daily
  t.UI.stats('daily');
  assert.equal(tabNodes[1].getAttribute('aria-pressed'), 'true');
  assert.match(nodes.get('#statgrid').innerHTML, />2<\/b><small>played<\/small>/);
  assert.match(nodes.get('#statgrid').innerHTML, />2<\/b><small>wins<\/small>/);
  assert.match(nodes.get('#statgrid').innerHTML, />2<\/b><small>streak<\/small>/);
  assert.match(nodes.get('#dist').innerHTML, /0\.1s/);
  assert.equal(nodes.get('#reset').hidden, true);
});

test('lobby keeps Continue without a New game reset button to prevent mid-run stat cherry-picking', () => {
  const { t, nodes } = setupGame();
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /id="newGameBtn"/);

  t.S.stages = [];
  t.S.guesses = [];
  t.S.runDone = false;
  t.UI.refreshLobby();
  assert.equal(nodes.get('#start').textContent, 'Start');

  t.S.stages = [{ slug: 'x', guesses: [{ t: 'right' }], done: true, won: true }];
  t.UI.refreshLobby();
  assert.equal(nodes.get('#start').textContent, 'Continue');

  t.S.runDone = true;
  t.UI.refreshLobby();
  assert.equal(nodes.get('#start').textContent, 'See result');
});

test('song win streak increments on wins, shows in game/result/stats, and resets cleanly on loss', () => {
  const storage = new Map();
  storage.set('tl:stats:gl:all:all', JSON.stringify({ runs: 1, total: 3, best: 3, perfect: 0, dist: [0, 0, 0, 1, 0, 0] }));
  const { t, nodes } = setupGame({ storage });

  t.UI.streak();
  assert.equal(nodes.get('#songStreak').hidden, true);

  for (let i = 1; i <= 3; i++) {
    t.S.song = t.ALL[i - 1];
    t.S.meta = t.ALL[i - 1];
    t.S.guesses = [{ t: 'right', title: t.ALL[i - 1].title, artist: t.ALL[i - 1].artist, slug: t.ALL[i - 1].slug }];
    t.finish(true);
    t.UI.result();
    assert.equal(nodes.get('#songStreak').hidden, false);
    assert.match(nodes.get('#songStreak').textContent, new RegExp(String(i)));
    assert.equal(nodes.get('#streakNote').hidden, false);
    assert.match(nodes.get('#streakNote').textContent, new RegExp(i + ' song streak'));
  }
  assert.equal(nodes.get('#songStreak').classList.contains('hot'), true);
  assert.match(nodes.get('#streakNote').textContent, /New best!/);

  t.UI.stats('overall');
  assert.match(nodes.get('#statScope').textContent, /Best song streak 3/);

  // Losing resets current streak cleanly while preserving best
  t.S.song = t.ALL[3];
  t.S.meta = t.ALL[3];
  t.S.guesses = [{ t: 'skip' }, { t: 'skip' }, { t: 'skip' }, { t: 'skip' }, { t: 'skip' }];
  t.finish(false);
  t.UI.result();
  assert.equal(nodes.get('#songStreak').hidden, true);
  assert.equal(nodes.get('#streakNote').hidden, true);
  assert.deepEqual({ ...t.songStreak() }, { current: 0, best: 3 });

  // Custom Game uses its own separate streak (tl:custom:streak), isolated from Classic
  t.S.custom = { id: '278873078', label: 'Bruno Mars', songs: t.ALL.slice(0, 5) };
  t.UI.streak();
  assert.equal(nodes.get('#songStreak').hidden, true);
  t.S.song = t.ALL[0];
  t.S.meta = t.ALL[0];
  t.S.guesses = [{ t: 'right', title: t.ALL[0].title, artist: t.ALL[0].artist, slug: t.ALL[0].slug }];
  t.finish(true);
  t.UI.result();
  assert.equal(nodes.get('#songStreak').hidden, false);
  assert.match(nodes.get('#songStreak').textContent, /1/);
  assert.match(nodes.get('#streakNote').textContent, /1 custom streak/);
  assert.deepEqual({ ...t.songStreak('classic') }, { current: 0, best: 3 });
  assert.deepEqual({ ...t.songStreak('custom') }, { current: 1, best: 1 });

  // Daily keeps per-song streak separate too (Daily uses its own calendar streak)
  t.S.custom = null;
  t.S.daily = { day: '2026-11-17', songs: [t.ALL[0]] };
  t.UI.streak();
  assert.equal(nodes.get('#songStreak').hidden, true);
  t.S.daily = null;

  // Multi-tier Classic pool (e.g. Expert [3,4]) samples fairly across tiers instead of flooding by bucket size
  t.S.custom = null; t.S.daily = null; t.S.challenge = null;
  const heavyT4 = [
    { slug: 't3', title: 'Hit', artist: 'A', tier: 3 },
    ...Array.from({ length: 40 }, (_, i) => ({ slug: 't4-' + i, title: 'Cut ' + i, artist: 'A', tier: 4 }))
  ];
  t.S.pool = heavyT4;
  t.S.stages = [];
  let t3Count = 0;
  for (let i = 0; i < 200; i++) {
    if (t.pickSong(0).tier === 3) t3Count++;
  }
  assert.ok(t3Count >= 28, 'expected stratified Tier 3 picks >= 28 out of 200, got ' + t3Count);
});

test('Wave 12 polish: Other genre button, artistClear, Surprise me, and text-only Challenge share work cleanly', async () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /data-guide-genre="lain"/);
  assert.match(html, /id="artistClear"/);
  assert.doesNotMatch(html, /id="trackBars"/);
  assert.match(html, /id="share"[^>]*>[\s\S]*?Challenge your friend\s*<\/button>/);
  assert.doesNotMatch(html, /src="result-image\.js"/);
  const appCode = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.doesNotMatch(appCode, /ResultImage|prepareResultImage/);
  assert.match(appCode, /\$\('#share'\)\.onclick\s*=\s*\(\)\s*=>\s*salin\(challengeUrlForRun\(\),\s*'result_copy'\)/);

  const fetched = [];
  const sampleTracks = Array.from({ length: 6 }, (_, i) => ({
    wrapperType: 'track',
    kind: 'song',
    trackId: 8000 + i,
    artistId: 136975,
    artistName: 'Taylor Swift',
    trackName: 'Song ' + (i + 1),
    collectionName: 'Studio Album',
    previewUrl: 'https://example.com/' + i + '.m4a',
    releaseDate: '2020-01-01',
    trackTimeMillis: 210000
  }));

  const storage = new Map();
  storage.set('tl:custom:recent', JSON.stringify([{ id: '136975', name: 'Taylor Swift' }]));

  const { t, nodes, ctx } = setupGame({
    storage,
    fetch: async (url) => {
      fetched.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          results: [{ wrapperType: 'artist', artistId: 999999, artistName: 'Mock Artist' }, ...sampleTracks.map((x, idx) => ({ ...x, artistId: 999999, artistName: 'Mock Artist', trackName: 'Hit ' + idx }))]
        }),
        text: async () => '{}'
      };
    }
  });

  t.UI.buildControls();
  ctx.document.querySelector('#artistQ').value = 'taylor';
  t.openCustom();
  assert.equal(nodes.get('#artistQ').value, '');
  assert.equal(nodes.get('#artistClear').hidden, true);
  const quickHtml = nodes.get('#customQuick').innerHTML;
  assert.match(quickHtml, /custom-quick-actions/);
  assert.match(quickHtml, /id="surprisePopularArtist"/);
  assert.match(quickHtml, /id="refreshPopularArtists"/);

  await t.surprisePopularArtist();
  assert.equal(fetched.length, 1);
  assert.doesNotMatch(fetched[0], /id=136975\b/);

  assert.match(html, /class="classic-section"[\s\S]*id="classicTabs"[\s\S]*id="classicFiltersPanel"[\s\S]*id="classicArtistPanel"[\s\S]*id="openCustom"/);
  assert.match(html, /class="duel-card-wide"[^>]*id="openDuel"/);
  assert.match(html, /class="arena-grid"[\s\S]*class="track spot-track"[\s\S]*id="trackLimitPin"[\s\S]*id="trackLimitTag"[\s\S]*class="spot-play-wrap"[\s\S]*id="trySlots"/);
  assert.match(html, /class="reveal-grid"[\s\S]*class="reveal-disc"[\s\S]*class="reveal-foot"/);
  assert.match(html, /id="runFan"[\s\S]*class="runlist run-shelf"[\s\S]*id="duelFan"[\s\S]*class="runlist duel-runlist run-shelf"/);
  assert.match(html, /id="customModal"[\s\S]*class="search-ico"[\s\S]*id="artistQ"/);
  assert.match(html, /id="challengeIntro"[\s\S]*class="challenge-card"[\s\S]*id="acceptChallenge"/);
  assert.match(fs.readFileSync(path.join(root, 'layout.css'), 'utf8'), /color-scheme:dark[\s\S]*::-webkit-scrollbar[\s\S]*#duel \.duel-metric[\s\S]*\.sheet:not\(\.run-sheet\)[\s\S]*\.run-playbtn/);
  assert.match(fs.readFileSync(path.join(root, 'layout.css'), 'utf8'), /\.reveal-disc::before[\s\S]*animation:spin[\s\S]*\.reveal-sleeve:has\(\[data-playing="1"\]\) \.reveal-disc::before\{animation-play-state:running\}/);
  assert.match(html, /<h1 class="logo">Tune<span>Up<\/span><\/h1>/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /fonts\/Unbounded-Bold\.woff2/);
});

test('Play button centering CSS, viewport cleanup, and #duel challenge intro work cleanly', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'layout.css'), 'utf8');
  const appCode = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const swCode = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

  assert.doesNotMatch(html, /user-scalable=no/i);
  assert.match(html, /id="challengeKicker"/);
  assert.match(html, /id="challengeTitle"/);
  assert.equal(fs.existsSync(path.join(root, 'arcade.css')), false);
  assert.doesNotMatch(appCode, /Guess The Song/);
  assert.doesNotMatch(swCode, /Guess The Song/);

  assert.match(css, /\.spot-track \.track-rail\{[\s\S]*height:20px;border-radius:999px/);
  assert.match(css, /\.track-caret\{[\s\S]*border-bottom:5\.5px solid var\(--acc\)/);
  assert.match(css, /\.vinyl-card \.playbtn\{[\s\S]*width:112px;height:112px/);
  assert.match(css, /@media\(max-width:680px\)[\s\S]*\.vinyl-card\{[^}]*flex-direction:column;align-items:center/);
  assert.match(css, /@media\(max-width:680px\)[\s\S]*\.vinyl-card \.playbtn\{width:84px;height:84px\}/);
  assert.match(css, /\.challenge-kicker\[data-mode="duel"\]/);

  const duelHarness = setupGame();
  duelHarness.ctx.window.ReleaseDuel = require('../duel.js');
  duelHarness.ctx.location.hash = '#duel=1.y.2.1001-1002-1003';
  const shown = duelHarness.t.showIncomingChallenge();
  assert.equal(shown, true);
  assert.equal(duelHarness.nodes.get('#challengeIntro').hidden, false);
  assert.equal(duelHarness.nodes.get('#challengeKicker').dataset.mode, 'duel');
  assert.equal(duelHarness.nodes.get('#challengeKicker').textContent, 'Music Duel · Release Year');
  assert.equal(duelHarness.nodes.get('#challengeTitle').textContent, 'Friend duel');
  assert.equal(duelHarness.nodes.get('#acceptChallenge').textContent, 'Accept duel');
  assert.match(duelHarness.nodes.get('#challengeMessage').textContent, /scored 2 in Release Year Duel/);

  duelHarness.ctx.location.hash = '#duel=1.s.1.99999';
  assert.equal(duelHarness.t.showIncomingChallenge(), true);
  assert.equal(duelHarness.nodes.get('#acceptChallenge').hidden, true);
  assert.match(duelHarness.nodes.get('#challengeMessage').textContent, /invalid or uses an unsupported version/i);
});

test('Duel target pill, Duel stats tab, Space preview key, and duel summary score spacing work cleanly', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'layout.css'), 'utf8');
  const appCode = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

  assert.match(html, /id="duelTarget" hidden/);
  assert.match(html, /data-tab="duel"/);
  assert.match(html, /id="duelLobbySub"/);
  assert.match(html, /id="artBgDuel"/);
  assert.match(html, /id="duelShare"[^>]*>[\s\S]*?Challenge your friend\s*<\/button>/);
  assert.match(html, /<summary>Can I challenge a friend\?<\/summary>/);
  assert.match(css, /#duelModal \.runscore\{gap:\.5rem\}/);
  assert.match(css, /#duelTarget\[data-passed="1"\]/);
  assert.match(css, /\.sheet\.run-sheet:has\(li\.is-playing\) \.fan-disc::before\{animation-play-state:running\}/);
  assert.match(appCode, /if \(inDuel\(\)\)[\s\S]*e\.code === 'Space'/);
  assert.match(appCode, /inDuelMode \? 'Mode: Music Duel'/);

  const storage = new Map([
    ['tl:duel:streams:best', '9'],
    ['tl:duel:best', '5'],
    ['tl:duel:stats', JSON.stringify({ runs: 4, streamsBest: 7, yearBest: 5 })]
  ]);
  const { t, nodes, tabNodes } = setupGame({ storage });
  t.UI.refreshLobby();
  assert.equal(nodes.get('#duelLobbySub').textContent, 'Spotify streams & release year · Best 9');
  t.UI.stats('duel');
  assert.equal(tabNodes[2].getAttribute('aria-pressed'), 'true');
  assert.match(nodes.get('#statScope').textContent, /Spotify Streams & Release Year/);
  assert.match(nodes.get('#statgrid').innerHTML, /<b>9<\/b><small>streams best<\/small>/);
  assert.match(nodes.get('#statgrid').innerHTML, /<b>5<\/b><small>year best<\/small>/);
  assert.match(nodes.get('#statgrid').innerHTML, /<b>9<\/b><small>best streak<\/small>/);
  assert.match(nodes.get('#statgrid').innerHTML, /<b>4<\/b><small>duels<\/small>/);
  assert.match(nodes.get('#dist').innerHTML, /Streams[\s\S]*9[\s\S]*Year[\s\S]*5/);
  assert.equal(nodes.get('#reset').hidden, true);
});

test('Artist Detective lobby card, arena DOM, and #artist= challenge intro work cleanly', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'layout.css'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

  assert.match(html, /class="arcade-row"[\s\S]*id="openDuel"[\s\S]*id="openArtistGame"/);
  assert.match(html, /id="artistGame"[\s\S]*id="agQ"[\s\S]*id="agGiveUp"[\s\S]*id="agResultBanner"[\s\S]*id="agBoard"/);
  assert.match(html, /data-tab="artist"/);
  assert.match(html, /About the game[\s\S]*Artist Detective/);
  assert.doesNotMatch(html, /id="agTabs"|id="agAudioHint"/);
  assert.match(html, /id="agDailyMeta"/);
  assert.match(html, /src="artist-game\.js"/);
  assert.match(sw, /'\.\/artist-game\.js'/);
  assert.match(sw, /cache:\s*'no-cache'/);
  assert.doesNotMatch(sw, /c\.put|caches\.match/);
  assert.match(css, /#lobby \.arcade-row/);
  assert.match(css, /\.challenge-kicker\[data-mode="artist"\]/);
  assert.match(appCode, /preloadTargetHit\(ag\.target\)/);
  assert.match(appCode, /playArtistTrack\(ag\.target\.topSong,\s*'hit',\s*true\)/);
  assert.match(appCode, /ag\.pausedAt\s*=\s*agAudio\.currentTime/);
  assert.match(appCode, /summaryPos\.set\(prevKey,\s*summaryAudio\.currentTime\)/);
  assert.match(appCode, /if \(inArtist\(\)\)/);
  assert.match(appCode, /\$\('#agDD'\)\.addEventListener\('mousedown'/);

  const storage = new Map([
    ['tl:artist:stats', JSON.stringify({ played: 8, won: 6, current: 2, best: 4, dist: [1, 2, 1, 1, 1, 0, 0, 0, 0, 0, 2] })]
  ]);
  const harness = setupGame({ storage });
  harness.ctx.window.ArtistDetective = require('../artist-game.js');
  harness.t.UI.refreshLobby();
  assert.equal(harness.nodes.get('#artistLobbySub').textContent, '6 clues · Best streak 4');

  harness.t.UI.stats('artist');
  assert.equal(harness.tabNodes[3].getAttribute('aria-pressed'), 'true');
  assert.match(harness.nodes.get('#statScope').textContent, /Artist Detective · Top 530 roster/);
  assert.match(harness.nodes.get('#statgrid').innerHTML, /<b>8<\/b><small>played<\/small>/);
  assert.match(harness.nodes.get('#statgrid').innerHTML, /<b>6<\/b><small>solved<\/small>/);
  assert.match(harness.nodes.get('#statgrid').innerHTML, /<b>2<\/b><small>streak<\/small>/);
  assert.match(harness.nodes.get('#statgrid').innerHTML, /<b>4<\/b><small>best<\/small>/);
  assert.match(harness.nodes.get('#dist').innerHTML, /1–2[\s\S]*3[\s\S]*Miss[\s\S]*2/);
  assert.equal(harness.nodes.get('#reset').hidden, true);

  harness.ctx.location.hash = '#artist=1.the-weeknd.3';
  assert.equal(harness.t.showIncomingChallenge(), true);
  assert.equal(harness.nodes.get('#challengeIntro').hidden, false);
  assert.equal(harness.nodes.get('#challengeKicker').dataset.mode, 'artist');
  assert.equal(harness.nodes.get('#challengeTitle').textContent, 'Mystery artist challenge');
  assert.match(harness.nodes.get('#challengeMessage').textContent, /solved this Mystery Artist in 3 tries/);
});


test('Wave 35: #agPlaySongBtn removed, Auto-Play on Skip + SFX, TuneUpCard score card, and deep-link routing work cleanly', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const appCode = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const swCode = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const TuneUpCard = require('../score-card.js');

  assert.doesNotMatch(html, /id="agPlaySongBtn"/);
  assert.match(html, /id="share"/);
  assert.match(html, /id="duelShare"/);
  assert.doesNotMatch(html, /src="score-card\.js"/);
  assert.doesNotMatch(swCode, /'\.\/score-card\.js'/);
  assert.match(appCode, /function playSfx\(kind\)/);
  assert.match(appCode, /function applyDeepLink\(\)/);
  assert.match(appCode, /if \(!playing && !playPending && S\.meta && S\.meta\.preview && typeof audio\.play === 'function'\)[\s\S]*playClip\(\)/);
  const stylesCss = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const layoutCss = fs.readFileSync(path.join(root, 'layout.css'), 'utf8');
  assert.match(stylesCss, /html,body\{[^}]*overflow-x:clip/);
  assert.match(stylesCss, /\.modal\{[^}]*overflow:hidden/);
  assert.match(stylesCss, /\.artbg\{[^}]*position:absolute/);
  assert.match(layoutCss, /\.track-bar-row\{[^}]*overflow:hidden/);
  assert.match(layoutCss, /#game #q,#agQ,#artistQ\{font-size:16px\}/);

  const runModel = TuneUpCard.buildCardData({
    kind: 'run',
    mode: 'regular',
    stages: [
      { done: true, won: true, guesses: [{ t: 'right', title: 'Secret Song' }] },
      { done: true, won: false, guesses: [{ t: 'skip' }, { t: 'wrong' }, { t: 'near' }, { t: 'wrong' }, { t: 'skip' }] }
    ],
    ladder: [0.1, 0.5, 2, 8, 15],
    subtitle: 'Pop · 2010s',
    url: 'https://tuneup.my.id/'
  });
  assert.equal(runModel.kicker, 'CLASSIC RUN');
  assert.equal(runModel.scoreMain, '1');
  assert.equal(runModel.scoreSub, '/ 5');
  assert.equal(runModel.rows[0].result, '0.1s');
  assert.equal(runModel.rows[1].result, 'Missed');
  assert.ok(!JSON.stringify(runModel).includes('Secret Song'));

  const duelModel = TuneUpCard.buildCardData({
    kind: 'duel',
    deck: 'streams',
    score: 7,
    best: 9,
    history: [{ won: true }, { won: true }, { won: false }],
    url: 'https://tuneup.my.id/'
  });
  assert.equal(duelModel.kicker, 'MUSIC DUEL · SPOTIFY STREAMS');
  assert.equal(duelModel.scoreMain, '7');
  assert.deepEqual(duelModel.history, [true, true, false]);
  assert.equal(duelModel.host, 'tuneup.my.id');
});

test('Wave 77 multi-select genre & era filters combine pools, format labels, collapse to all, and aggregate into All Classic stats', () => {
  const songs = [
    ['Track Pop 00s', 'A1', 1, 'gl', 'pop', 2005, '', 2001],
    ['Track Rock 10s', 'A2', 1, 'gl', 'rock', 2014, '', 2002],
    ['Track Indie 20s', 'A3', 1, 'gl', 'indie', 2022, '', 2003],
    ['Track HipHop 90s', 'A4', 1, 'gl', 'hiphop', 1996, '', 2004],
    ['Track Pop 20s', 'A5', 1, 'gl', 'pop', 2023, '', 2005]
  ];
  const storage = new Map([
    ['tl:stats:gl:pop,rock:y00,y10', JSON.stringify({ runs: 2, total: 9, best: 5, perfect: 1, dist: [0, 0, 0, 0, 1, 1] })]
  ]);
  const { t } = setupGame({ songs, storage });

  assert.equal(t.toggleMulti('all', 'rock', t.GENRE_KEYS), 'rock');
  assert.equal(t.toggleMulti('rock', 'pop', t.GENRE_KEYS), 'pop,rock');
  assert.equal(t.toggleMulti('pop,rock', 'indie', t.GENRE_KEYS), 'pop,rock,indie');
  assert.equal(t.toggleMulti('pop', 'pop', t.GENRE_KEYS), 'all');
  assert.equal(t.normalizeMulti(t.GENRE_KEYS, t.GENRE_KEYS), 'all');
  assert.equal(t.formatMulti('pop,rock,indie', t.GENRE_KEYS, t.genreLabel, 2), 'Pop, Rock +1');

  t.S.genre = 'pop,rock';
  t.S.era = 'y00,y10';
  const matched = Array.from(t.filtered(), (s) => s.title);
  assert.deepEqual(matched, ['Track Pop 00s', 'Track Rock 10s']);

  const agg = t.allClassicStats();
  assert.equal(agg.runs, 2);
  assert.equal(agg.perfect, 1);
});

test('Wave 132 Classic mode hydrates lazy DUEL_STREAMS_V1, filters holiday tracks, and enforces smooth Stage 1-5 stream bands', () => {
  const songs = [
    ['Mistletoe and Holly', 'Frank Sinatra', 4, 'gl', 'pop', 1957, '', 9001],
    ['Santa Baby', 'Ariana Grande', 4, 'gl', 'pop', 2013, '', 9002],
    ...Array.from({ length: 14 }, (_, i) => [`Mega Hit ${i}`, `Star ${i}`, 1, 'gl', 'pop', 2020, '', 1000 + i]),
    ...Array.from({ length: 14 }, (_, i) => [`Mid Tier1 ${i}`, `Mid ${i}`, 1, 'gl', 'pop', 2015, '', 2000 + i]),
    ...Array.from({ length: 14 }, (_, i) => [`Deep Cut ${i}`, `Deep ${i}`, 4, 'gl', 'pop', 2018, '', 4000 + i]),
    ...Array.from({ length: 14 }, (_, i) => [`Obscure ${i}`, `Obs ${i}`, 4, 'gl', 'pop', 2012, '', 5000 + i])
  ];
  const { t, ctx } = setupGame({ songs });
  t.S.genre = 'all';
  t.S.era = 'all';
  const filtTitles = Array.from(t.filtered(), (s) => s.title);
  assert.ok(!filtTitles.includes('Mistletoe and Holly'), 'default Classic should filter seasonal Christmas songs');
  assert.ok(!filtTitles.includes('Santa Baby'), 'default Classic should filter Santa Baby');

  // Call pickSong BEFORE DUEL_STREAMS_V1 arrives (must NOT permanently cache empty streamMap!)
  t.S.stage = 0;
  t.S.pool = Array.from(t.filtered()).filter((s) => s.tier === 1);
  t.S.stages = [];
  assert.ok(t.pickSong(0));

  // Now simulate lazy-loaded DUEL_STREAMS_V1 arriving
  ctx.window.DUEL_STREAMS_V1 = {
    items: [
      ...Array.from({ length: 14 }, (_, i) => [1000 + i, 2600000000]), // >= 1.5B (Easy)
      ...Array.from({ length: 14 }, (_, i) => [2000 + i, 1100000000]), // < 1.5B (Medium)
      ...Array.from({ length: 14 }, (_, i) => [4000 + i, 300000000]),  // 200M..450M (Impossible)
      ...Array.from({ length: 14 }, (_, i) => [5000 + i, 90000000])    // < 200M (excluded from Impossible band)
    ]
  };
  for (let i = 0; i < 40; i++) {
    const p = t.pickSong(0);
    assert.match(p.title, /^Mega Hit /, `Stage 1 Easy should pick >=1.5B mega-hits, got ${p.title}`);
  }
  t.S.stage = 4;
  t.S.pool = Array.from(t.filtered()).filter((s) => s.tier === 4);
  for (let i = 0; i < 40; i++) {
    const p = t.pickSong(0);
    assert.match(p.title, /^Deep Cut /, `Stage 5 Impossible should stay within 200M..450M recognizable band, got ${p.title}`);
  }
});
