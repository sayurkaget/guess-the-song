const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Duel = require('../duel.js');

const root = path.join(__dirname, '..');

test('ReleaseDuel buildPool keeps studio songs with valid years and covers for year deck', () => {
  const sample = [
    ...Array.from({ length: 14 }, (_, i) => ({
      slug: 'hit-' + i, title: 'Hit ' + i, artist: 'Artist ' + i,
      tier: (i % 3) + 1, year: 1990 + i * 2, art: 'https://img/' + i, trackId: 1000 + i
    })),
    { slug: 'deep', title: 'Deep Cut', artist: 'B', tier: 5, year: 2010, art: 'https://img/d', trackId: 2001 },
    { slug: 'no-art', title: 'No Art', artist: 'C', tier: 1, year: 2012, art: '', trackId: 2002 },
    { slug: 'no-tid', title: 'No Tid', artist: 'D', tier: 1, year: 2015, art: 'https://img/x', trackId: null },
  ];
  const pool = Duel.buildPool(sample, null, 'year');
  assert.equal(pool.length, 14);
  assert.equal(pool.some((s) => s.slug === 'deep'), false);
  assert.equal(pool.some((s) => s.slug === 'no-art'), false);
  assert.equal(pool.some((s) => s.slug === 'no-tid'), false);
});

test('ReleaseDuel year deck never pairs identical years and avoids seen songs / repeated artists cleanly', () => {
  const songs = [
    { slug: 'a', title: 'Song A', artist: 'Same Star', tier: 1, year: 2005, art: 'x', trackId: 1 },
    { slug: 'b', title: 'Song B', artist: 'Same Star', tier: 1, year: 2005, art: 'x', trackId: 2 },
    { slug: 'c', title: 'Song C', artist: 'Other Star', tier: 2, year: 2018, art: 'x', trackId: 3 },
    { slug: 'd', title: 'Song D', artist: 'Deep Star', tier: 3, year: 1995, art: 'x', trackId: 4 },
  ];
  const pool = Duel.buildPool(songs);
  const first = Duel.pickFirst(pool, () => 0);
  assert.equal(first.slug, 'a');

  const seen = new Set(['a']);
  const next0 = Duel.pickNext(pool, first, seen, 0, () => 0);
  assert.equal(next0.slug, 'c');

  seen.add('b');
  seen.add('c');
  const next4 = Duel.pickNext(pool, next0, seen, 4, () => 0);
  assert.equal(next4.slug, 'd');

  seen.add('d');
  const endlessNext = Duel.pickNext(pool, next4, seen, 10, () => 0);
  assert.ok(endlessNext && endlessNext.year !== next4.year);
});

test('ReleaseDuel streams deck joins DUEL_STREAMS_V1, enforces clear stream gaps, formats B/M, and evaluates higher/lower', () => {
  const sample = [
    { slug: 'blinding', title: 'Blinding Lights', artist: 'The Weeknd', tier: 1, year: 2019, art: 'x', trackId: 10 },
    { slug: 'close', title: 'Near Twin', artist: 'Other A', tier: 1, year: 2020, art: 'x', trackId: 11 },
    { slug: 'lower', title: 'Mid Hit', artist: 'Other B', tier: 2, year: 2015, art: 'x', trackId: 12 },
  ];
  const streamsData = { items: [[10, 5684569283], [11, 5500000000], [12, 842100000]] };
  const pool = Duel.buildPool(sample, streamsData, 'streams');
  assert.equal(pool.length, 3);
  assert.equal(pool[0].trackId, 10);
  assert.equal(pool[0].streamRank, 0);

  const first = Duel.pickFirst(pool, 'streams', () => 0);
  assert.equal(first.slug, 'blinding');
  // Round 0 gap >= 15% skips trackId 11 (5.5B vs 5.68B is ~3.2%) and picks 12 (842M)!
  const next0 = Duel.pickNext(pool, first, new Set(['blinding']), 0, 'streams', () => 0);
  assert.equal(next0.slug, 'lower');

  assert.deepEqual(Duel.evaluate(first, next0, 'lower', 'streams'), { won: true, answer: 'lower', delta: 842100000 - 5684569283 });
  assert.deepEqual(Duel.evaluate(first, next0, 'higher', 'streams'), { won: false, answer: 'lower', delta: 842100000 - 5684569283 });
  assert.deepEqual(Duel.formatMetric(first, 'streams'), { main: '5.68B', sub: '5,684,569,283 streams' });
  assert.deepEqual(Duel.formatMetric(next0, 'streams'), { main: '842M', sub: '842,100,000 streams' });
});

test('ReleaseDuel formats plain-text shares for both year and streams modes', () => {
  assert.equal(
    Duel.shareText({
      score: 2, best: 5, history: [{ won: true }, { won: true }, { won: false }],
      url: 'https://tuneup.pages.dev/#daily', kind: 'year'
    }),
    'TuneUp · Release Duel · Score 2 (Best 5)\n🟩🟩🟥\nhttps://tuneup.pages.dev/'
  );
  assert.equal(
    Duel.shareText({
      score: 4, best: 4, history: [{ won: true }, { won: true }, { won: true }, { won: true }, { won: false }],
      url: 'https://tuneup.pages.dev/', kind: 'streams'
    }),
    'TuneUp · Spotify Streams Duel · Score 4 (Best 4)\n🟩🟩🟩🟩🟥\nhttps://tuneup.pages.dev/'
  );
});

test('actual songs.js and duel-streams-v1.js produce rich valid pools with zero missing artwork or unlinked trackIds', () => {
  const ctx = { window: {} };
  vm.runInContext(fs.readFileSync(path.join(root, 'songs.js'), 'utf8'), vm.createContext(ctx));
  vm.runInContext(fs.readFileSync(path.join(root, 'duel-streams-v1.js'), 'utf8'), ctx);
  const all = ctx.window.SONGS.map((r, i) => ({
    slug: String(i), title: r[0], artist: r[1], tier: r[2], year: r[5], art: r[6], trackId: r[7]
  }));

  const yearPool = Duel.buildPool(all, ctx.window.DUEL_STREAMS_V1, 'year');
  assert.ok(yearPool.length >= 6000, 'expected >= 6000 iconic & streamed songs for Year deck, got ' + yearPool.length);

  const streamsPool = Duel.buildPool(all, ctx.window.DUEL_STREAMS_V1, 'streams');
  assert.ok(streamsPool.length >= 5000, 'expected >= 5000 tracks for Spotify Streams deck, got ' + streamsPool.length);
  assert.equal(streamsPool.length, ctx.window.DUEL_STREAMS_V1.items.length, 'all trackIds in duel-streams-v1.js must exist in songs.js');
  for (const s of streamsPool) {
    assert.ok(s.art && s.trackId && s.streams >= 100_000_000, 'bad streams entry ' + s.title);
  }
});

test('HTML and SW register Music Duel decks cleanly', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(html, /id="openDuel"/);
  assert.match(html, /id="duelTabs"/);
  assert.match(html, /data-duel="streams"/);
  assert.match(html, /data-duel="year"/);
  assert.match(html, /id="duelSubA"/);
  assert.match(html, /id="duelSubB"/);
  assert.match(html, /src="duel-streams-v1\.js"/);
  assert.match(html, /src="duel\.js"/);
  assert.match(sw, /'\.\/duel-streams-v1\.js'/);
  assert.match(sw, /'\.\/duel\.js'/);
  assert.match(app, /pointerenter/);
  assert.match(app, /pointerleave/);
  assert.match(app, /pointerType !== 'mouse'/);
  assert.match(app, /duelPos\.set/);
  assert.doesNotMatch(html, /id="duelNote"/);
  assert.doesNotMatch(app, /duelNote/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'styles.css'), 'utf8'), /\.duel-note/);
});

(() => {
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const DuelApi = require('../duel.js');

  test('createChallenge & parseChallenge round-trip streams and year #duel= links', () => {
    const url = DuelApi.createChallenge('https://tuneup.pages.dev/', {
      kind: 'streams',
      score: 4,
      ids: [1001, 1002, 1003, 1002]
    });
    assert.equal(url, 'https://tuneup.pages.dev/#duel=1.s.4.1001-1002-1003');
    assert.deepEqual(DuelApi.parseChallenge(url), {
      version: 1,
      kind: 'streams',
      score: 4,
      ids: [1001, 1002, 1003]
    });

    const yearUrl = DuelApi.createChallenge('https://tuneup.pages.dev/#ignored', {
      kind: 'year',
      score: 0,
      ids: [201, 202]
    });
    assert.equal(yearUrl, 'https://tuneup.pages.dev/#duel=1.y.0.201-202');
    assert.deepEqual(DuelApi.parseChallenge('#duel=1.y.0.201-202'), {
      version: 1,
      kind: 'year',
      score: 0,
      ids: [201, 202]
    });
  });

  test('parseChallenge rejects malformed, duplicate, or short #duel= payloads', () => {
    assert.equal(DuelApi.parseChallenge(''), null);
    assert.equal(DuelApi.parseChallenge('#challenge=1.2.3'), null);
    assert.equal(DuelApi.parseChallenge('#duel=2.s.1.10-20'), null);
    assert.equal(DuelApi.parseChallenge('#duel=1.x.1.10-20'), null);
    assert.equal(DuelApi.parseChallenge('#duel=1.s.-1.10-20'), null);
    assert.equal(DuelApi.parseChallenge('#duel=1.s.1.10'), null);
    assert.equal(DuelApi.parseChallenge('#duel=1.s.1.10-10'), null);
    assert.equal(DuelApi.parseChallenge('#duel=1.s.1.10-abc'), null);
    assert.equal(DuelApi.createChallenge('https://tuneup.pages.dev/', { kind: 'year', score: 1, ids: [1001] }), '');
  });

  test('compareChallenge & shareText with challengeUrl format friend comparison cleanly', () => {
    assert.equal(DuelApi.compareChallenge(3, 5), 'You beat your friend by 2 points!');
    assert.equal(DuelApi.compareChallenge(3, 4), 'You beat your friend by 1 point!');
    assert.equal(DuelApi.compareChallenge(3, 3), 'Tied with your friend!');
    assert.equal(DuelApi.compareChallenge(3, 2), 'Short by 1 point.');
    assert.equal(DuelApi.compareChallenge(5, 2), 'Short by 3 points.');

    const text = DuelApi.shareText({
      score: 2,
      best: 5,
      history: [{ won: true }, { won: true }, { won: false }],
      url: 'https://tuneup.pages.dev/',
      kind: 'streams',
      challengeUrl: 'https://tuneup.pages.dev/#duel=1.s.2.11-22-33'
    });
    assert.equal(
      text,
      'TuneUp · Spotify Streams Duel · Score 2 (Best 5)\n🟩🟩🟥\nhttps://tuneup.pages.dev/#duel=1.s.2.11-22-33'
    );
  });
})();
