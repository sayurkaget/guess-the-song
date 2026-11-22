const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Badges = require('../badges.js');
const Backup = require('../backup.js');
const TuneUpCard = require('../score-card.js');

const ROOT = path.join(__dirname, '..');

function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key(i) { return [...map.keys()][i] ?? null; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(String(k), String(v)); },
    removeItem(k) { map.delete(k); }
  };
}

test('TuneUpBadges unlocks idempotently, backfills from stats, and round-trips through TuneUpBackup', () => {
  const st = makeStorage();
  assert.equal(Badges.CATALOG.length, 8);
  assert.equal(Badges.summary(st).unlocked, 0);

  const first = Badges.unlock(st, ['sniper', 'unknown-id']);
  assert.equal(first.length, 1);
  assert.equal(first[0].id, 'sniper');
  const ts1 = Badges.load(st).sniper;
  assert.ok(ts1 > 0);

  // Unlocking again is a no-op and preserves original timestamp
  assert.equal(Badges.unlock(st, ['sniper']).length, 0);
  assert.equal(Badges.load(st).sniper, ts1);

  // Backfill remaining milestones from existing stats snapshot
  const backfilled = Badges.syncFromStats(st, {
    classic: { runs: 4, dist: [0, 0, 1, 1, 1, 1] },
    songStreakBest: 12,
    daily: { played: 7, best: 7, dist: [1, 2, 2, 1, 1, 0] },
    duel: { runs: 2, best: 11 },
    artist: { played: 3, dist: [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0] }
  });
  assert.equal(backfilled.length, 7);
  assert.equal(Badges.summary(st).unlocked, 8);

  // tl:badges is automatically included in TuneUpBackup transfer & cleared on reset
  const code = Backup.encode(Backup.collect(st));
  const decoded = Backup.decode(code);
  assert.equal(decoded.ok, true);
  assert.ok(decoded.entries[Badges.STORAGE_KEY], 'tl:badges must be exported in backup code');

  const st2 = makeStorage();
  Backup.restore(st2, decoded.entries);
  assert.equal(Badges.summary(st2).unlocked, 8);

  Backup.clear(st2);
  assert.equal(Badges.summary(st2).unlocked, 0);
});

test('TuneUpCard builds spoiler-free purple score card model for Artist Detective', () => {
  const winCard = TuneUpCard.buildCardData({
    kind: 'artist',
    won: true,
    tries: 4,
    maxTries: 10,
    hintsUsed: 1,
    best: 5,
    rows: [
      ['miss', 'exact', 'exact', 'miss', 'close', 'miss'],
      ['close', 'exact', 'exact', 'exact', 'exact', 'close'],
      ['exact', 'exact', 'exact', 'exact', 'exact', 'exact']
    ],
    verdict: 'Solved in 4 tries · 1 hint',
    url: 'https://tuneup.pages.dev/'
  });
  assert.equal(winCard.kind, 'artist');
  assert.equal(winCard.theme, 'purple');
  assert.equal(winCard.kicker, 'ARTIST DETECTIVE');
  assert.equal(winCard.scoreMain, '4');
  assert.equal(winCard.scoreSub, '/ 10');
  assert.match(winCard.subtitle, /Best streak 5/);
  assert.match(winCard.verdict, /1 hint/);
  assert.equal(winCard.rows.length, 3);
  assert.equal(winCard.filename, 'tuneup-artist-detective-score.png');

  const loseCard = TuneUpCard.buildCardData({
    kind: 'artist',
    won: false,
    tries: 10,
    rows: [],
    url: 'https://tuneup.pages.dev/'
  });
  assert.equal(loseCard.scoreMain, 'X');
  assert.equal(loseCard.scoreSub, '/ 10');
});

test('Wave 55 artist score card, boot optimization, and badges tab are wired across files', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /id="agShareBtn"/);
  assert.match(html, /data-tab="badges"/);
  assert.match(html, /id="badgeGrid"/);
  assert.match(html, /src="badges\.js"/);

  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /'\.\/badges\.js'/);

  const build = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');
  assert.match(build, /'badges\.js'/);

  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.match(app, /class SongEntry \{/);
  assert.match(app, /const getDuelPool = \(kind\) =>/);
  assert.match(app, /function ensureRoster\(\)/);
  assert.match(app, /AD\.createChallenge\(siteUrl\(\)/);
  assert.match(app, /window\.TuneUpBadges/);

  const rec = fs.readFileSync(path.join(ROOT, 'recordings.js'), 'utf8');
  assert.match(rec, /typeof track === 'string'/);
});
