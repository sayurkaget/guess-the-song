/* Public Global Leaderboard API backed by Cloudflare D1 (FEEDBACK_DB).
   Supports Today's Daily Challenge (fastest guess 1..5 ASC) and all-time
   Music Duel high scores (duel_streams & duel_year, streak DESC). */

const BOARDS = new Set(['daily', 'duel_streams', 'duel_year']);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const PID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const DAILY_LABELS = ['0.1s', '0.5s', '2s', '8s', '15s'];
const BLOCKED_NAME_RE = /(https?:\/\/|www\.|\.[a-z]{2,4}\b|<|>)/i;

const reply = (status, body) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' }
});

export function cleanNickname(raw) {
  const s = String(raw || '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length < 2 || s.length > 16) return '';
  if (BLOCKED_NAME_RE.test(s)) return '';
  return s;
}

export function validateSubmission(body, nowDate = new Date()) {
  if (!body || typeof body !== 'object') return { error: 'Invalid payload.' };
  const board = String(body.board || '');
  if (!BOARDS.has(board)) return { error: 'Unknown leaderboard.' };

  const nickname = cleanNickname(body.nickname);
  if (!nickname) return { error: 'Nickname must be 2–16 characters (no links).' };

  const playerId = String(body.playerId || '').trim();
  if (!PID_RE.test(playerId)) return { error: 'Invalid player session.' };

  const score = Number(body.score);
  if (!Number.isInteger(score)) return { error: 'Invalid score.' };

  let dayKey = 'all';
  let meta = '';
  if (board === 'daily') {
    const day = String(body.day || '').trim();
    if (!DAY_RE.test(day)) return { error: 'Invalid daily date.' };
    // Allow +/- 1 day from UTC to account for player timezones (UTC-12..UTC+14)
    const parsedMs = Date.parse(day + 'T00:00:00Z');
    const nowDayMs = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate());
    if (!Number.isFinite(parsedMs) || Math.abs(parsedMs - nowDayMs) > 2 * 86400000) {
      return { error: 'Only today\'s Daily score can be submitted.' };
    }
    if (score < 1 || score > 5) return { error: 'Daily score must be between 1 and 5 tries.' };
    dayKey = day;
    meta = DAILY_LABELS[score - 1];
  } else {
    if (score < 1 || score > 500) return { error: 'Duel score must be between 1 and 500.' };
    meta = score + ' streak';
  }

  return { ok: true, board, dayKey, playerId, nickname, score, meta };
}

async function ensureSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS leaderboard_scores (
      id TEXT PRIMARY KEY,
      board TEXT NOT NULL,
      day_key TEXT NOT NULL,
      player_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      score INTEGER NOT NULL,
      meta TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_lb_player ON leaderboard_scores (board, day_key, player_id)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_lb_rank ON leaderboard_scores (board, day_key, score, updated_at)')
  ]);
}

async function fetchBoard(db, board, dayKey, playerId) {
  const orderSql = board === 'daily'
    ? 'ORDER BY score ASC, updated_at ASC'
    : 'ORDER BY score DESC, updated_at ASC';

  const topRes = await db.prepare(
    `SELECT player_id, nickname, score, meta, updated_at
     FROM leaderboard_scores
     WHERE board = ? AND day_key = ?
     ${orderSql}
     LIMIT 20`
  ).bind(board, dayKey).all();

  const totalRow = await db.prepare(
    'SELECT COUNT(*) AS cnt FROM leaderboard_scores WHERE board = ? AND day_key = ?'
  ).bind(board, dayKey).first();
  const total = Number(totalRow?.cnt) || 0;

  const entries = (topRes.results || []).map((r, i) => ({
    rank: i + 1,
    nickname: r.nickname,
    score: Number(r.score),
    meta: r.meta || (board === 'daily' ? DAILY_LABELS[Math.max(0, Math.min(4, Number(r.score) - 1))] : (r.score + ' streak')),
    isYou: !!(playerId && r.player_id === playerId),
    updatedAt: r.updated_at
  }));

  let you = entries.find((e) => e.isYou) || null;
  if (!you && playerId && PID_RE.test(playerId)) {
    const mine = await db.prepare(
      'SELECT nickname, score, meta, updated_at FROM leaderboard_scores WHERE board = ? AND day_key = ? AND player_id = ?'
    ).bind(board, dayKey, playerId).first();
    if (mine) {
      const cmpSql = board === 'daily'
        ? '(score < ? OR (score = ? AND updated_at < ?))'
        : '(score > ? OR (score = ? AND updated_at < ?))';
      const ahead = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM leaderboard_scores WHERE board = ? AND day_key = ? AND ${cmpSql}`
      ).bind(board, dayKey, mine.score, mine.score, mine.updated_at).first();
      you = {
        rank: (Number(ahead?.cnt) || 0) + 1,
        nickname: mine.nickname,
        score: Number(mine.score),
        meta: mine.meta,
        isYou: true,
        updatedAt: mine.updated_at
      };
    }
  }

  return { ok: true, board, day: dayKey, total, entries, you };
}

export async function onRequest({ request, env }) {
  if (!env || !env.FEEDBACK_DB) {
    return reply(503, { ok: false, error: 'Leaderboard is temporarily unavailable.' });
  }
  const db = env.FEEDBACK_DB;

  if (request.method === 'GET') {
    const reqUrl = new URL(request.url);
    const board = String(reqUrl.searchParams.get('board') || 'daily');
    if (!BOARDS.has(board)) return reply(400, { ok: false, error: 'Unknown leaderboard.' });
    const rawDay = String(reqUrl.searchParams.get('day') || '').trim();
    const todayUtc = new Date().toISOString().slice(0, 10);
    const dayKey = board === 'daily' ? (DAY_RE.test(rawDay) ? rawDay : todayUtc) : 'all';
    const pid = String(reqUrl.searchParams.get('pid') || '').trim();
    try {
      await ensureSchema(db);
      return reply(200, await fetchBoard(db, board, dayKey, PID_RE.test(pid) ? pid : ''));
    } catch {
      return reply(503, { ok: false, error: 'Could not load leaderboard.' });
    }
  }

  if (request.method === 'POST') {
    const origin = request.headers.get('Origin');
    if (origin !== new URL(request.url).origin) return reply(403, { ok: false, error: 'Forbidden origin.' });
    if (!(request.headers.get('Content-Type') || '').toLowerCase().includes('application/json')) {
      return reply(415, { ok: false, error: 'JSON required.' });
    }
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { ok: false, error: 'Missing body.' });
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); return reply(413, { ok: false, error: 'Payload too large.' }); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const c of chunks) { bytes.set(c, offset); offset += c.byteLength; }
    let parsed;
    try { parsed = JSON.parse(new TextDecoder().decode(bytes)); } catch {
      return reply(400, { ok: false, error: 'Invalid JSON.' });
    }

    const v = validateSubmission(parsed);
    if (!v.ok) return reply(400, { ok: false, error: v.error });

    try {
      await ensureSchema(db);
      const nowIso = new Date().toISOString();
      const existing = await db.prepare(
        'SELECT id, score, updated_at FROM leaderboard_scores WHERE board = ? AND day_key = ? AND player_id = ?'
      ).bind(v.board, v.dayKey, v.playerId).first();

      if (!existing) {
        await db.prepare(
          'INSERT INTO leaderboard_scores (id, board, day_key, player_id, nickname, score, meta, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), v.board, v.dayKey, v.playerId, v.nickname, v.score, v.meta, nowIso, nowIso).run();
      } else {
        const isBetter = v.board === 'daily'
          ? v.score < Number(existing.score)
          : v.score > Number(existing.score);
        if (isBetter) {
          await db.prepare(
            'UPDATE leaderboard_scores SET nickname = ?, score = ?, meta = ?, updated_at = ? WHERE id = ?'
          ).bind(v.nickname, v.score, v.meta, nowIso, existing.id).run();
        } else {
          // Keep their best score & timestamp, only refresh nickname if they renamed
          await db.prepare(
            'UPDATE leaderboard_scores SET nickname = ? WHERE id = ?'
          ).bind(v.nickname, existing.id).run();
        }
      }

      const boardData = await fetchBoard(db, v.board, v.dayKey, v.playerId);
      return reply(200, { ...boardData, submitted: true });
    } catch {
      return reply(503, { ok: false, error: 'Could not save score right now.' });
    }
  }

  return reply(405, { ok: false, error: 'Method not allowed.' });
}
