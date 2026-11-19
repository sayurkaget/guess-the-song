const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');

async function loadLeaderboardModule() {
  return import(pathToFileURL(path.join(ROOT, 'functions/api/leaderboard.js')).href);
}

// Lightweight in-memory D1 mock supporting the SQL queries used by functions/api/leaderboard.js
function createMockD1() {
  const rows = [];
  function runQuery(sql, params) {
    const q = sql.replace(/\s+/g, ' ').trim();
    if (/^CREATE /i.test(q)) return { results: [] };

    if (/^SELECT player_id, nickname, score, meta, updated_at FROM leaderboard_scores/i.test(q)) {
      const [board, dayKey] = params;
      const asc = /ORDER BY score ASC/i.test(q);
      const filtered = rows
        .filter((r) => r.board === board && r.day_key === dayKey)
        .sort((a, b) => (asc ? a.score - b.score : b.score - a.score) || (a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0))
        .slice(0, 20);
      return { results: filtered.map((r) => ({ ...r })) };
    }

    if (/^SELECT COUNT\(\*\) AS cnt FROM leaderboard_scores WHERE board = \? AND day_key = \? AND \(score ([<>]) \?/i.test(q)) {
      const m = q.match(/\(score ([<>]) \?/i);
      const op = m[1];
      const [board, dayKey, score1, score2, updatedAt] = params;
      const cnt = rows.filter((r) => {
        if (r.board !== board || r.day_key !== dayKey) return false;
        if (op === '<') return r.score < score1 || (r.score === score2 && r.updated_at < updatedAt);
        return r.score > score1 || (r.score === score2 && r.updated_at < updatedAt);
      }).length;
      return { first: { cnt } };
    }

    if (/^SELECT COUNT\(\*\) AS cnt FROM leaderboard_scores WHERE board = \? AND day_key = \?$/i.test(q)) {
      const [board, dayKey] = params;
      const cnt = rows.filter((r) => r.board === board && r.day_key === dayKey).length;
      return { first: { cnt } };
    }

    if (/^SELECT (id, score, updated_at|nickname, score, meta, updated_at) FROM leaderboard_scores WHERE board = \? AND day_key = \? AND player_id = \?/i.test(q)) {
      const [board, dayKey, playerId] = params;
      const hit = rows.find((r) => r.board === board && r.day_key === dayKey && r.player_id === playerId) || null;
      return { first: hit ? { ...hit } : null };
    }

    if (/^INSERT INTO leaderboard_scores/i.test(q)) {
      const [id, board, day_key, player_id, nickname, score, meta, created_at, updated_at] = params;
      rows.push({ id, board, day_key, player_id, nickname, score, meta, created_at, updated_at });
      return { success: true };
    }

    if (/^UPDATE leaderboard_scores SET nickname = \?, score = \?, meta = \?, updated_at = \? WHERE id = \?/i.test(q)) {
      const [nickname, score, meta, updated_at, id] = params;
      const hit = rows.find((r) => r.id === id);
      if (hit) Object.assign(hit, { nickname, score, meta, updated_at });
      return { success: true };
    }

    if (/^UPDATE leaderboard_scores SET nickname = \? WHERE id = \?/i.test(q)) {
      const [nickname, id] = params;
      const hit = rows.find((r) => r.id === id);
      if (hit) hit.nickname = nickname;
      return { success: true };
    }

    throw new Error('Unhandled SQL in mock D1: ' + q);
  }

  return {
    rows,
    prepare(sql) {
      const stmt = {
        sql,
        params: [],
        bind(...args) { this.params = args; return this; },
        async all() { return { results: runQuery(this.sql, this.params).results || [] }; },
        async first() { return runQuery(this.sql, this.params).first ?? null; },
        async run() { return runQuery(this.sql, this.params); }
      };
      return stmt;
    },
    async batch(stmts) {
      return Promise.all(stmts.map((s) => s.run()));
    }
  };
}

test('cleanNickname normalizes whitespace and blocks unsafe or invalid names', async () => {
  const { cleanNickname } = await loadLeaderboardModule();
  assert.equal(cleanNickname('  Kha  lil  '), 'Kha lil');
  assert.equal(cleanNickname('DJ_Nova99'), 'DJ_Nova99');
  assert.equal(cleanNickname('A'), '');
  assert.equal(cleanNickname('ThisNameIsWayTooLongForLeaderboard'), '');
  assert.equal(cleanNickname('visit evil.com'), '');
  assert.equal(cleanNickname('https://spam.io'), '');
  assert.equal(cleanNickname('<b>xss</b>'), '');
});

test('validateSubmission validates daily and duel boards strictly', async () => {
  const { validateSubmission } = await loadLeaderboardModule();
  const now = new Date('2026-11-20T00:00:00Z');

  const okDaily = validateSubmission({
    board: 'daily',
    day: '2026-11-19',
    score: 1,
    nickname: 'TuneFan',
    playerId: 'player_12345678'
  }, now);
  assert.equal(okDaily.ok, true);
  assert.equal(okDaily.meta, '0.1s');

  const staleDaily = validateSubmission({
    board: 'daily',
    day: '2026-11-10',
    score: 1,
    nickname: 'TuneFan',
    playerId: 'player_12345678'
  }, now);
  assert.equal(staleDaily.ok, undefined);
  assert.match(staleDaily.error, /today/i);

  const badTries = validateSubmission({
    board: 'daily',
    day: '2026-11-20',
    score: 6,
    nickname: 'TuneFan',
    playerId: 'player_12345678'
  }, now);
  assert.match(badTries.error, /1 and 5/i);

  const okDuel = validateSubmission({
    board: 'duel_streams',
    score: 14,
    nickname: 'StreamKing',
    playerId: 'player_87654321'
  }, now);
  assert.equal(okDuel.ok, true);
  assert.equal(okDuel.dayKey, 'all');
  assert.equal(okDuel.meta, '14 streak');
});

test('leaderboard API handles GET/POST, ranking order, better-score upsert, and rank outside top 20', async () => {
  const { onRequest } = await loadLeaderboardModule();
  const db = createMockD1();
  const env = { FEEDBACK_DB: db };
  const origin = 'https://tuneup.pages.dev';
  const today = new Date().toISOString().slice(0, 10);

  const post = (payload, extraHeaders = {}) => onRequest({
    request: new Request(origin + '/api/leaderboard', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify(payload)
    }),
    env
  });

  // Cross-origin rejected
  const badOrigin = await onRequest({
    request: new Request(origin + '/api/leaderboard', {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
      body: '{}'
    }),
    env
  });
  assert.equal(badOrigin.status, 403);

  // Daily submissions sorted ASC (fastest first)
  let r1 = await post({ board: 'daily', day: today, score: 3, nickname: 'SlowEar', playerId: 'pid_player_0001' });
  assert.equal(r1.status, 200);
  let r2 = await post({ board: 'daily', day: today, score: 1, nickname: 'FastEar', playerId: 'pid_player_0002' });
  assert.equal(r2.status, 200);
  let r3 = await post({ board: 'daily', day: today, score: 2, nickname: 'MidEar', playerId: 'pid_player_0003' });
  assert.equal(r3.status, 200);

  const getDaily = await onRequest({
    request: new Request(origin + '/api/leaderboard?board=daily&day=' + today + '&pid=pid_player_0003'),
    env
  });
  const dailyData = await getDaily.json();
  assert.equal(dailyData.ok, true);
  assert.equal(dailyData.total, 3);
  assert.deepEqual(dailyData.entries.map((e) => [e.rank, e.nickname, e.meta]), [
    [1, 'FastEar', '0.1s'],
    [2, 'MidEar', '0.5s'],
    [3, 'SlowEar', '2s']
  ]);
  assert.equal(dailyData.you.rank, 2);

  // Worse Daily score keeps best score (1) while updating nickname
  const worse = await post({ board: 'daily', day: today, score: 4, nickname: 'FastEarPro', playerId: 'pid_player_0002' });
  const worseJson = await worse.json();
  assert.equal(worseJson.entries[0].nickname, 'FastEarPro');
  assert.equal(worseJson.entries[0].meta, '0.1s');

  // Duel submissions sorted DESC and rank outside top 20 computed accurately
  for (let i = 1; i <= 21; i++) {
    const res = await post({
      board: 'duel_streams',
      score: i === 21 ? 1 : i + 5,
      nickname: 'Dueler' + i,
      playerId: 'duel_player_' + String(i).padStart(4, '0')
    });
    assert.equal(res.status, 200);
  }
  const getDuel = await onRequest({
    request: new Request(origin + '/api/leaderboard?board=duel_streams&pid=duel_player_0021'),
    env
  });
  const duelData = await getDuel.json();
  assert.equal(duelData.total, 21);
  assert.equal(duelData.entries.length, 20);
  assert.equal(duelData.entries[0].score, 25);
  assert.equal(duelData.you.rank, 21);
  assert.equal(duelData.you.nickname, 'Dueler21');
});

test('og-image.png is a valid 1200x630 PNG wired into index.html and build script', () => {
  const imgPath = path.join(ROOT, 'og-image.png');
  const buf = fs.readFileSync(imgPath);
  // PNG signature + IHDR width/height bytes 16..24
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /property="og:image" content="https:\/\/tuneup\.pages\.dev\/og-image\.png"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="twitter:image" content="https:\/\/tuneup\.pages\.dev\/og-image\.png"/);

  const buildScript = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');
  assert.match(buildScript, /'og-image\.png'/);
});

test('1-song summary shelf keeps .run-playbtn inline instead of floating to sheet corner', () => {
  const css = fs.readFileSync(path.join(ROOT, 'layout.css'), 'utf8');
  assert.match(css, /\.runlist\.run-shelf\[data-count="1"\] \.run-playbtn\{position:static;grid-column:3;grid-row:1 \/ 3;/);
  assert.match(css, /\.runlist\.run-shelf li\{\s*position:relative;/);
});
