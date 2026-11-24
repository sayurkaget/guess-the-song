/* Anonymous aggregate Daily Community Stats (zero cookies, zero IPs, zero PII).
   Tracks daily plays, wins, and win-try sums per (kind, day) in D1. */
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = new Set(['song', 'artist', 'hub']);

const reply = (status, body, cache = 'no-store') => Response.json(body, {
  status,
  headers: { 'Cache-Control': cache }
});

function isPlausibleDay(day, nowMs = Date.now()) {
  if (!DAY_RE.test(day)) return false;
  const t = Date.parse(day + 'T00:00:00Z');
  if (!Number.isFinite(t)) return false;
  // Allow +/- 2 days from UTC to cover every timezone from UTC-12 to UTC+14 and 07:00 local resets.
  return Math.abs(t - nowMs) <= 3 * 86400 * 1000;
}

function formatHubSummary(day, row) {
  const plays = Number(row?.plays) || 0;
  const scoreSum = Number(row?.score_sum) || 0;
  const avgScore = plays > 0 ? Math.round(scoreSum / plays) : 0;
  const bands = [];
  for (let i = 0; i < 15; i++) bands.push(Number(row?.['b' + i]) || 0);
  return {
    ok: true,
    kind: 'hub',
    day,
    plays,
    avgScore,
    bands
  };
}

function hubBandIndex(score) {
  const s = Math.max(0, Math.min(300, Math.round(Number(score) || 0)));
  return Math.min(14, Math.floor(s / 20));
}

function formatSummary(kind, day, row) {
  if (kind === 'hub') return formatHubSummary(day, row);
  const plays = Number(row?.plays) || 0;
  const wins = Number(row?.wins) || 0;
  const triesSum = Number(row?.tries_sum) || 0;
  const winRate = plays > 0 ? Math.round((wins / plays) * 100) : 0;
  const avgTries = wins > 0 ? Math.round((triesSum / wins) * 10) / 10 : 0;
  return {
    ok: true,
    kind,
    day,
    plays,
    wins,
    winRate,
    avgTries,
    buckets: [
      Number(row?.t1) || 0,
      Number(row?.t2) || 0,
      Number(row?.t3) || 0,
      Number(row?.t4) || 0,
      Number(row?.t5) || 0
    ]
  };
}

function bucketIndex(kind, won, tries) {
  if (!won || tries < 1) return 0;
  if (kind === 'song') return Math.min(5, Math.max(1, tries));
  // Artist Detective has 10 tries -> group into 5 clean pairs (1-2, 3-4, 5-6, 7-8, 9-10).
  return Math.min(5, Math.ceil(tries / 2));
}

const HUB_COLS = 'plays, score_sum, b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14';

export async function onRequest({ request, env }) {
  if (!env.FEEDBACK_DB) return reply(503, { ok: false });

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const kind = (url.searchParams.get('kind') || '').trim();
    const day = (url.searchParams.get('day') || '').trim();
    if (!KINDS.has(kind) || !DAY_RE.test(day)) {
      return reply(400, { ok: false });
    }
    try {
      if (kind === 'hub') {
        const row = await env.FEEDBACK_DB.prepare(
          `SELECT ${HUB_COLS} FROM daily_hub_stats WHERE day = ?`
        ).bind(day).first();
        return reply(200, formatHubSummary(day, row), 'no-store');
      }
      const row = await env.FEEDBACK_DB.prepare(
        'SELECT plays, wins, tries_sum, t1, t2, t3, t4, t5 FROM daily_stats WHERE kind = ? AND day = ?'
      ).bind(kind, day).first();
      return reply(200, formatSummary(kind, day, row), 'no-store');
    } catch {
      return reply(503, { ok: false });
    }
  }

  if (request.method !== 'POST') {
    return reply(405, { ok: false });
  }

  const reqOrigin = new URL(request.url).origin;
  const origin = request.headers.get('Origin');
  const secFetch = request.headers.get('Sec-Fetch-Site');
  if (origin !== reqOrigin && !(!origin && secFetch === 'same-origin')) {
    return reply(403, { ok: false });
  }
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) {
    return reply(415, { ok: false });
  }

  let data;
  try {
    const raw = await request.text();
    if (!raw || raw.length > 512) return reply(400, { ok: false });
    data = JSON.parse(raw);
  } catch {
    return reply(400, { ok: false });
  }

  const kind = typeof data?.kind === 'string' ? data.kind.trim() : '';
  const day = typeof data?.day === 'string' ? data.day.trim() : '';
  if (!KINDS.has(kind) || !isPlausibleDay(day)) return reply(400, { ok: false });

  if (kind === 'hub') {
    const score = Number.isInteger(data?.score) ? data.score : -1;
    if (score < 0 || score > 300) return reply(400, { ok: false });
    const bi = hubBandIndex(score);
    const bandVals = Array.from({ length: 15 }, (_, idx) => (idx === bi ? 1 : 0));
    try {
      const write = await env.FEEDBACK_DB.prepare(
        `INSERT INTO daily_hub_stats (day, plays, score_sum, b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(day) DO UPDATE SET
           plays = plays + 1,
           score_sum = score_sum + excluded.score_sum,
           b0 = b0 + excluded.b0, b1 = b1 + excluded.b1, b2 = b2 + excluded.b2,
           b3 = b3 + excluded.b3, b4 = b4 + excluded.b4, b5 = b5 + excluded.b5,
           b6 = b6 + excluded.b6, b7 = b7 + excluded.b7, b8 = b8 + excluded.b8,
           b9 = b9 + excluded.b9, b10 = b10 + excluded.b10, b11 = b11 + excluded.b11,
           b12 = b12 + excluded.b12, b13 = b13 + excluded.b13, b14 = b14 + excluded.b14`
      ).bind(day, score, ...bandVals).run();
      if (!write.success) throw new Error('Write failed');
      const row = await env.FEEDBACK_DB.prepare(
        `SELECT ${HUB_COLS} FROM daily_hub_stats WHERE day = ?`
      ).bind(day).first();
      return reply(200, formatHubSummary(day, row));
    } catch {
      return reply(503, { ok: false });
    }
  }

  const won = data?.won === true;
  const maxTries = kind === 'artist' ? 10 : 5;
  const tries = Number.isInteger(data?.tries) ? data.tries : -1;

  if (typeof data?.won !== 'boolean') return reply(400, { ok: false });
  if (won && (tries < 1 || tries > maxTries)) return reply(400, { ok: false });
  if (!won && (tries < 0 || tries > maxTries)) return reply(400, { ok: false });

  const b = bucketIndex(kind, won, tries);
  const winInc = won ? 1 : 0;
  const triesInc = won ? tries : 0;
  const b1 = b === 1 ? 1 : 0;
  const b2 = b === 2 ? 1 : 0;
  const b3 = b === 3 ? 1 : 0;
  const b4 = b === 4 ? 1 : 0;
  const b5 = b === 5 ? 1 : 0;

  try {
    const write = await env.FEEDBACK_DB.prepare(
      `INSERT INTO daily_stats (kind, day, plays, wins, tries_sum, t1, t2, t3, t4, t5)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(kind, day) DO UPDATE SET
         plays = plays + 1,
         wins = wins + excluded.wins,
         tries_sum = tries_sum + excluded.tries_sum,
         t1 = t1 + excluded.t1,
         t2 = t2 + excluded.t2,
         t3 = t3 + excluded.t3,
         t4 = t4 + excluded.t4,
         t5 = t5 + excluded.t5`
    ).bind(kind, day, winInc, triesInc, b1, b2, b3, b4, b5).run();
    if (!write.success) throw new Error('Write failed');

    const row = await env.FEEDBACK_DB.prepare(
      'SELECT plays, wins, tries_sum, t1, t2, t3, t4, t5 FROM daily_stats WHERE kind = ? AND day = ?'
    ).bind(kind, day).first();
    return reply(200, formatSummary(kind, day, row));
  } catch {
    return reply(503, { ok: false });
  }
}
