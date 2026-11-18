const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ArtistDetective = require('../artist-game.js');

const root = path.join(__dirname, '..');

test('ArtistDetective buildRoster resolves all 100 iconic artists against songs.js and duel-streams-v1.js', () => {
  const ctx = { window: {} };
  vm.runInContext(fs.readFileSync(path.join(root, 'songs.js'), 'utf8'), vm.createContext(ctx));
  vm.runInContext(fs.readFileSync(path.join(root, 'duel-streams-v1.js'), 'utf8'), ctx);
  const all = ctx.window.SONGS.map((r, i) => ({
    slug: String(i), title: r[0], artist: r[1], tier: r[2], year: r[5], art: r[6], trackId: r[7]
  }));

  const roster = ArtistDetective.buildRoster(all, ctx.window.DUEL_STREAMS_V1);
  assert.equal(roster.length, 100, 'expected all 100 artists in RAW_ROSTER to resolve in songs.js');

  const ids = new Set();
  const ranks = new Set();
  for (const a of roster) {
    assert.ok(a.id && !ids.has(a.id), 'duplicate or empty artist id: ' + a.id);
    ids.add(a.id);
    assert.ok(a.rank >= 1 && a.rank <= 100 && !ranks.has(a.rank), 'invalid or duplicate rank: ' + a.rank);
    ranks.add(a.rank);
    assert.ok(a.art && a.art.startsWith('http'), 'missing cover art for ' + a.name);
    assert.ok(a.topSong && a.topSong.trackId > 0, 'missing topSong trackId for ' + a.name);
    assert.ok(a.hintSong && a.hintSong.trackId > 0, 'missing hintSong trackId for ' + a.name);
  }
  assert.equal(roster[0].name, 'The Weeknd');
  assert.equal(roster[0].topSong.title, 'Blinding Lights');
});

test('ArtistDetective compare evaluates exact, close, miss, and directional arrows across 6 clues', () => {
  const weeknd = {
    id: 'the-weeknd', name: 'The Weeknd', debut: 2011, type: 'Solo', members: 1,
    gender: 'Male', genre: 'R&B', country: 'Canada', continent: 'North America', rank: 1
  };
  const drake = {
    id: 'drake', name: 'Drake', debut: 2009, type: 'Solo', members: 1,
    gender: 'Male', genre: 'Hip-hop', country: 'Canada', continent: 'North America', rank: 4
  };
  const coldplay = {
    id: 'coldplay', name: 'Coldplay', debut: 2000, type: 'Group', members: 4,
    gender: 'Male', genre: 'Rock', country: 'UK', continent: 'Europe', rank: 8
  };
  const twentyOnePilots = {
    id: 'twenty-one-pilots', name: 'Twenty One Pilots', debut: 2009, type: 'Duo', members: 2,
    gender: 'Male', genre: 'Indie', country: 'USA', continent: 'North America', rank: 30
  };

  // Exact match
  const exactTiles = ArtistDetective.compare(weeknd, weeknd);
  assert.equal(exactTiles.length, 6);
  assert.ok(exactTiles.every((t) => t.status === 'exact'));

  // Drake vs The Weeknd:
  // debut: 2009 vs 2011 -> close (diff 2), target > guess so '2009 ▲'
  // members: Solo vs Solo -> exact
  // gender: Male vs Male -> exact
  // genre: Hip-hop vs R&B -> miss
  // country: Canada vs Canada -> exact
  // rank: #4 vs #1 -> close (diff 3), target < guess (#1 is higher rank than #4) so '#4 ▲'
  const drakeVsWeeknd = ArtistDetective.compare(drake, weeknd);
  assert.deepEqual(drakeVsWeeknd.map((t) => [t.key, t.value, t.status]), [
    ['debut', '2009 ▲', 'close'],
    ['members', 'Solo', 'exact'],
    ['gender', 'Male', 'exact'],
    ['genre', 'Hip-hop', 'miss'],
    ['country', 'Canada', 'exact'],
    ['rank', '#4 ▲', 'close']
  ]);

  // Coldplay (Group 4, UK/Europe) vs Twenty One Pilots (Duo 2, USA/North America):
  // members: Group (4) vs Duo (2) -> close (both >1 members)
  const coldplayVsTop = ArtistDetective.compare(coldplay, twentyOnePilots);
  assert.deepEqual(coldplayVsTop.map((t) => [t.key, t.value, t.status]), [
    ['debut', '2000 ▲', 'miss'],
    ['members', 'Group (4)', 'close'],
    ['gender', 'Male', 'exact'],
    ['genre', 'Rock', 'miss'],
    ['country', 'UK', 'miss'],
    ['rank', '#8 ▼', 'miss']
  ]);
});

test('ArtistDetective dailyArtist is deterministic per date string', () => {
  const sample = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const pick1 = ArtistDetective.dailyArtist(sample, '2026-11-18');
  const pick2 = ArtistDetective.dailyArtist(sample, '2026-11-18');
  assert.equal(pick1, pick2);
  assert.equal(ArtistDetective.dailyArtist([], '2026-11-18'), null);
});

test('ArtistDetective createChallenge, parseChallenge, compareChallenge, and shareText round-trip cleanly without spoiling artist name in URL', () => {
  const winUrl = ArtistDetective.createChallenge('https://namethetrack.pages.dev/#daily', {
    id: 'The Weeknd',
    tries: 4,
    won: true
  });
  assert.match(winUrl, /^https:\/\/namethetrack\.pages\.dev\/#artist=1\.[a-z0-9]+\.4$/);
  assert.doesNotMatch(winUrl, /weeknd/i);
  assert.deepEqual(ArtistDetective.parseChallenge(winUrl), {
    version: 1,
    id: 'the-weeknd',
    won: true,
    tries: 4
  });

  const fmUrl = ArtistDetective.createChallenge('https://namethetrack.pages.dev/', {
    id: 'fleetwood-mac',
    tries: 3,
    won: true
  });
  assert.doesNotMatch(fmUrl, /fleetwood|mac/i);
  assert.deepEqual(ArtistDetective.parseChallenge(fmUrl), {
    version: 1,
    id: 'fleetwood-mac',
    won: true,
    tries: 3
  });

  const loseUrl = ArtistDetective.createChallenge('https://namethetrack.pages.dev/', {
    id: 'taylor-swift',
    tries: 10,
    won: false
  });
  assert.doesNotMatch(loseUrl, /taylor|swift/i);
  assert.deepEqual(ArtistDetective.parseChallenge(loseUrl), {
    version: 1,
    id: 'taylor-swift',
    won: false,
    tries: 0
  });
  // Legacy slug link remains backwards-compatible
  assert.deepEqual(ArtistDetective.parseChallenge('#artist=1.taylor-swift.x'), {
    version: 1,
    id: 'taylor-swift',
    won: false,
    tries: 0
  });

  assert.equal(ArtistDetective.parseChallenge('#artist=1.bad.11'), null);
  assert.equal(ArtistDetective.parseChallenge('#artist=1.unknown-artist.3'), null);
  assert.equal(ArtistDetective.parseChallenge('#artist=2.the-weeknd.3'), null);
  assert.equal(ArtistDetective.parseChallenge('#duel=1.s.3.10-20'), null);

  assert.equal(ArtistDetective.compareChallenge(true, 5, true, 3), 'You beat your friend by 2 tries!');
  assert.equal(ArtistDetective.compareChallenge(true, 3, true, 3), 'Tied at 3 tries!');
  assert.equal(ArtistDetective.compareChallenge(false, 0, true, 6), 'You solved it — your friend missed!');
  assert.equal(ArtistDetective.compareChallenge(true, 4, false, 0), 'Your friend solved it in 4 tries.');

  const target = {
    id: 'the-weeknd', name: 'The Weeknd', debut: 2011, type: 'Solo', members: 1,
    gender: 'Male', genre: 'R&B', country: 'Canada', continent: 'North America', rank: 1
  };
  const guess1 = {
    id: 'drake', name: 'Drake', debut: 2009, type: 'Solo', members: 1,
    gender: 'Male', genre: 'Hip-hop', country: 'Canada', continent: 'North America', rank: 4
  };
  const shared = ArtistDetective.shareText({
    mode: 'daily',
    day: '2026-11-18',
    guesses: [guess1, target],
    target,
    won: true,
    url: 'https://namethetrack.pages.dev/#daily'
  });
  assert.equal(
    shared,
    'TuneUp · Daily Artist · 2026-11-18 · 2/10\n🟨🟩🟩⬛🟩🟨\n🟩🟩🟩🟩🟩🟩\nhttps://namethetrack.pages.dev/'
  );
});
