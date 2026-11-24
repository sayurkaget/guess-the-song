/* TuneUp Daily Hub — deterministic 3-game daily planner, scoring, 28-day streak, & 15-band histogram math. */
(function (root) {
  'use strict';

  const GAMES = [
    { id: 'song',   cat: 'audio',  nameEn: 'Song Guess',    nameId: 'Tebak Lagu',    descEn: 'Name the track from 0.1s',      descId: 'Tebak lagu dari klip 0,1 dtk' },
    { id: 'cover',  cat: 'visual', nameEn: 'Cover Pixel',   nameId: 'Cover Pixel',   descEn: 'Guess song from pixel cover',   descId: 'Tebak lagu dari cover piksel' },
    { id: 'hair',   cat: 'visual', nameEn: 'HairSpot',      nameId: 'HairSpot Musik',descEn: 'Guess musician from their hair', descId: 'Tebak musisi dari rambutnya' },
    { id: 'mv',     cat: 'visual', nameEn: 'MV Spot',       nameId: 'MV Spot',       descEn: 'Guess song from 3 MV frames',   descId: 'Tebak lagu dari 3 frame MV' },
    { id: 'fact',   cat: 'trivia', nameEn: 'Fact or Cap',   nameId: 'Fakta / Hoax',  descEn: '5 music facts or myths',        descId: '5 fakta atau mitos musik' },
    { id: 'lyric',  cat: 'word',   nameEn: 'Lyric Guess',   nameId: 'Tebak Lirik',   descEn: 'Name the song from 5 lines',    descId: 'Tebak lagu dari 5 baris lirik' },
    { id: 'artist', cat: 'deduce', nameEn: 'Artist Guess',  nameId: 'Tebak Artis',   descEn: '6 clues to find the artist',    descId: '6 petunjuk cari artis misterius' },
    { id: 'duel',   cat: 'trivia', nameEn: 'Music Duel',    nameId: 'Duel Musik',    descEn: '5 rounds: Streams or Year',     descId: '5 ronde: Streams atau Tahun' }
  ];
  const GAME_MAP = Object.create(null);
  for (let i = 0; i < GAMES.length; i++) GAME_MAP[GAMES[i].id] = GAMES[i];

  const DIFFS = [
    { key: 'easy',   tier: 1, labelEn: 'Easy',   labelId: 'Mudah' },
    { key: 'medium', tier: 2, labelEn: 'Medium', labelId: 'Sedang' },
    { key: 'hard',   tier: 3, labelEn: 'Hard',   labelId: 'Sulit' }
  ];

  function hash(str) {
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickDeterministic(list, seedStr, count = 1) {
    if (!Array.isArray(list) || !list.length) return count === 1 ? null : [];
    const r = rng(hash(seedStr));
    if (count === 1) return list[Math.floor(r() * list.length)];
    const pool = list.slice();
    const out = [];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(r() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }

  /**
   * Deterministically plan today's 3 games for dayStr ("YYYY-MM-DD").
   * Guarantees 3 distinct games across varied categories (at most 1 from 'visual',
   * ensuring a fresh mix of visual + audio/deduction + trivia/lyric each day!).
   */
  function planDay(dayStr) {
    const r = rng(hash('tuneup-daily-hub-v1:' + dayStr));
    const bag = GAMES.slice();
    const picked = [];
    let visualCount = 0;

    // Shuffle bag deterministically
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const tmp = bag[i]; bag[i] = bag[j]; bag[j] = tmp;
    }

    for (let i = 0; i < bag.length && picked.length < 3; i++) {
      const g = bag[i];
      if (g.cat === 'visual' && visualCount >= 1 && picked.length < 2) continue;
      if (g.cat === 'visual' && visualCount >= 2) continue;
      picked.push(g);
      if (g.cat === 'visual') visualCount++;
    }
    while (picked.length < 3 && bag.length >= 3) {
      const next = bag.find((g) => !picked.includes(g));
      if (!next) break;
      picked.push(next);
    }

    // Assign Easy / Medium / Hard deterministically with slight variety (e.g. Easy/Med/Hard or Med/Med/Hard)
    const diffPatterns = [
      [0, 1, 2],
      [0, 1, 2],
      [0, 2, 1],
      [1, 1, 2],
      [0, 0, 1]
    ];
    const pat = diffPatterns[Math.floor(r() * diffPatterns.length)];

    return picked.map((g, slotIdx) => {
      const d = DIFFS[pat[slotIdx]];
      return {
        slot: slotIdx,
        gameId: g.id,
        diffKey: d.key,
        diffTier: d.tier,
        seed: 'tu-daily:' + dayStr + ':' + slotIdx + ':' + g.id
      };
    });
  }

  /* ===== Scoring (0..100 per game, 300 total) ===== */
  function scoreTries(won, tries, maxTries = 5) {
    if (!won) return 0;
    const t = Math.max(1, Math.min(maxTries, Number(tries) || 1));
    if (maxTries === 10) {
      // Artist Detective: 1->100, 2->90, ..., 10->10
      return Math.max(10, 110 - t * 10);
    }
    // 5-try games (Song, Cover Pixel, HairSpot, Lyric Guess): 1->100, 2->80, 3->60, 4->40, 5->20
    return Math.max(20, 120 - t * 20);
  }

  function scorePairs(correct, total = 5) {
    if (total <= 0) return 0;
    const c = Math.max(0, Math.min(total, Number(correct) || 0));
    return Math.round((c / total) * 100);
  }

  /* ===== 28-Day Streak & Activity Overview ===== */
  const MILESTONES = [3, 7, 14, 30, 50, 100, 365];
  function parseDayUtc(dayStr) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayStr || ''));
    if (!m) return NaN;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  function fmtDayUtc(ms) {
    const d = new Date(ms);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }

  function streakOverview(completedDays, todayStr) {
    const set = new Set();
    if (Array.isArray(completedDays)) {
      for (let i = 0; i < completedDays.length; i++) {
        const s = String(completedDays[i] || '');
        if (/^\d{4}-\d{2}-\d{2}$/.test(s) && s <= todayStr) set.add(s);
      }
    }
    const sorted = [...set].sort();
    const todayMs = parseDayUtc(todayStr);
    const DAY_MS = 86400 * 1000;

    // Current streak (counts up to today or yesterday)
    let current = 0;
    let since = '';
    if (Number.isFinite(todayMs)) {
      let cursor = set.has(todayStr) ? todayMs : (set.has(fmtDayUtc(todayMs - DAY_MS)) ? todayMs - DAY_MS : NaN);
      while (Number.isFinite(cursor) && set.has(fmtDayUtc(cursor))) {
        since = fmtDayUtc(cursor);
        current++;
        cursor -= DAY_MS;
      }
    }

    // Longest streak
    let best = 0, run = 0, prevMs = NaN;
    for (let i = 0; i < sorted.length; i++) {
      const ms = parseDayUtc(sorted[i]);
      if (Number.isFinite(prevMs) && ms - prevMs === DAY_MS) run++;
      else run = 1;
      if (run > best) best = run;
      prevMs = ms;
    }

    const nextMilestone = MILESTONES.find((m) => m > current) || (Math.ceil((current + 1) / 50) * 50);

    // Last 28 days (4 rows of 7, ending on today)
    const days28 = [];
    const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    if (Number.isFinite(todayMs)) {
      for (let offset = 27; offset >= 0; offset--) {
        const ms = todayMs - offset * DAY_MS;
        const dObj = new Date(ms);
        const key = fmtDayUtc(ms);
        days28.push({
          day: key,
          wd: WD[dObj.getUTCDay()],
          dom: dObj.getUTCDate(),
          played: set.has(key),
          isToday: offset === 0
        });
      }
    }

    return {
      current,
      best,
      totalDays: set.size,
      since,
      nextMilestone,
      days28
    };
  }

  /* ===== 15-Band D1 Community Histogram Math ===== */
  function summarizeHistogram(apiData, userScore) {
    const score = Math.max(0, Math.min(300, Math.round(Number(userScore) || 0)));
    const userBand = Math.min(14, Math.floor(score / 20));
    const rawBands = Array.isArray(apiData && apiData.bands) && apiData.bands.length === 15
      ? apiData.bands.map((n) => Math.max(0, Number(n) || 0))
      : new Array(15).fill(0);
    let plays = Math.max(0, Number(apiData && apiData.plays) || 0);
    const bandSum = rawBands.reduce((a, b) => a + b, 0);
    if (bandSum > plays) plays = bandSum;

    // Ensure the current player is represented even if offline / API hasn't caught up yet
    const effBands = rawBands.slice();
    if (plays === 0) {
      effBands[userBand] = 1;
      plays = 1;
    }
    const avgScore = apiData && Number.isFinite(Number(apiData.avgScore)) && Number(apiData.plays) > 0
      ? Math.round(Number(apiData.avgScore))
      : score;

    let below = 0, above = 0;
    for (let i = 0; i < 15; i++) {
      if (i < userBand) below += effBands[i];
      else if (i > userBand) above += effBands[i];
    }
    const tiedWith = Math.max(0, effBands[userBand] - 1);
    const others = Math.max(0, plays - 1);
    const beatPct = others > 0 ? Math.round(((below + tiedWith * 0.5) / others) * 100) : 100;
    const rank = above + 1;

    const maxCount = Math.max(1, ...effBands);
    const bands = effBands.map((count, i) => ({
      idx: i,
      count,
      pct: plays > 0 ? Math.round((count / plays) * 100) : 0,
      heightPct: Math.round((count / maxCount) * 100),
      isUser: i === userBand
    }));

    return {
      plays,
      avgScore,
      rank,
      tiedWith,
      beatPct: Math.max(0, Math.min(100, beatPct)),
      userBand,
      bands
    };
  }

  function shareText(run, dayStr, url, lang = 'en') {
    const isId = lang === 'id';
    const results = Array.isArray(run && run.results) ? run.results : [];
    const total = results.reduce((sum, r) => sum + (Number(r && r.score) || 0), 0);
    const lines = results.map((r, i) => {
      const slot = run && run.slots && run.slots[i];
      const g = slot && GAME_MAP[slot.gameId];
      const gName = g ? (isId ? g.nameId : g.nameEn) : ('Game ' + (i + 1));
      const sc = Number(r && r.score) || 0;
      const dot = sc >= 80 ? '🟩' : sc >= 40 ? '🟨' : '🟥';
      return `${dot} ${gName}: ${sc}/100`;
    });
    const head = isId
      ? `TuneUp Harian · ${dayStr} · ${total}/300`
      : `TuneUp Daily · ${dayStr} · ${total}/300`;
    return [head, ...lines, url || 'https://tuneup.my.id/'].join('\n');
  }

  const API = {
    GAMES,
    GAME_MAP,
    DIFFS,
    hash,
    rng,
    pickDeterministic,
    planDay,
    scoreTries,
    scorePairs,
    streakOverview,
    summarizeHistogram,
    shareText
  };

  if (typeof module === 'object' && module.exports) module.exports = API;
  else root.TuneUpDailyHub = API;
})(typeof window !== 'undefined' ? window : globalThis);
