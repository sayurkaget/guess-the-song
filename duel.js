(function (root) {
  'use strict';

  const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').trim();

  /** Build pool for 'year' (famous hits) or 'streams' (curated Spotify top streams matched by trackId). */
  function buildPool(songs, streamsData, kind = 'year') {
    const list = songs || [];
    if (kind === 'streams') {
      const items = (streamsData && streamsData.items) || [];
      if (!items.length) return [];
      const byTid = new Map();
      for (const s of list) {
        if (s && s.trackId && s.art && !byTid.has(String(s.trackId))) byTid.set(String(s.trackId), s);
      }
      const out = [];
      for (let i = 0; i < items.length; i++) {
        const pair = items[i];
        if (!Array.isArray(pair) || !pair[0] || !(pair[1] > 0)) continue;
        const song = byTid.get(String(pair[0]));
        if (song) out.push({ ...song, slug: song.slug, hay: song.hay, streams: Number(pair[1]), streamRank: out.length });
      }
      return out.sort((a, b) => b.streams - a.streams).map((s, idx) => ({ ...s, streamRank: idx }));
    }

    const valid = list.filter((s) =>
      s && Number.isFinite(s.year) && s.year >= 1920 && s.year <= 2030 && s.art && s.trackId
    );
    const streamTids = new Set();
    if (streamsData && Array.isArray(streamsData.items)) {
      for (let i = 0; i < streamsData.items.length; i++) {
        const pair = streamsData.items[i];
        if (Array.isArray(pair) && pair[0]) streamTids.add(String(pair[0]));
      }
    }
    const iconic = valid.filter((s) => (s.tier || 5) <= 3 || streamTids.has(String(s.trackId)));
    return iconic.length >= 12 ? iconic : valid;
  }

  function pickRandom(list, rng) {
    if (!list.length) return null;
    return list[Math.floor(rng() * list.length)];
  }

  /** Pick the opening anchor track, favoring iconic hits early. */
  function pickFirst(pool, kindOrRng = 'year', maybeRng = Math.random) {
    const kind = typeof kindOrRng === 'string' ? kindOrRng : 'year';
    const rng = typeof kindOrRng === 'function' ? kindOrRng : maybeRng;
    if (!pool.length) return null;
    if (kind === 'streams') {
      const head = pool.slice(0, Math.min(pool.length, 450));
      return pickRandom(head.length ? head : pool, rng);
    }
    const years = new Set(pool.map((s) => s.year));
    if (years.size < 2) return null;
    const featured = pool.filter((s) => (s.tier || 5) <= 2);
    return pickRandom(featured.length ? featured : pool, rng);
  }

  function clearStreamGap(a, b, minRatio) {
    const max = Math.max(a.streams, b.streams);
    return max > 0 && Math.abs(a.streams - b.streams) / max >= minRatio;
  }

  /** Pick a challenger track strictly distinct on the target metric (year or streams). */
  function pickNext(pool, anchor, seenSlugs, score = 0, kindOrRng = 'year', maybeRng = Math.random) {
    const kind = typeof kindOrRng === 'string' ? kindOrRng : 'year';
    const rng = typeof kindOrRng === 'function' ? kindOrRng : maybeRng;
    if (!pool.length || !anchor) return null;
    const seen = seenSlugs || new Set();

    const validPair = (s) => kind === 'streams'
      ? s.streams !== anchor.streams && clearStreamGap(anchor, s, score === 0 ? 0.15 : 0.08)
      : s.year !== anchor.year;

    let fresh = pool.filter((s) => s.slug !== anchor.slug && !seen.has(s.slug) && validPair(s));
    if (!fresh.length) {
      fresh = pool.filter((s) => s.slug !== anchor.slug && (kind === 'streams' ? s.streams !== anchor.streams : s.year !== anchor.year));
    }
    if (!fresh.length) return null;

    let tierBase = fresh;
    if (kind === 'streams') {
      if (score < 4) {
        const topHits = fresh.filter((s) => (s.streamRank ?? 9999) < 450);
        if (topHits.length) tierBase = topHits;
      } else if (score < 9) {
        const midHits = fresh.filter((s) => (s.streamRank ?? 9999) < 1800);
        if (midHits.length) tierBase = midHits;
      }
    } else {
      if (score < 4) {
        const tiered = fresh.filter((s) => (s.tier || 5) <= 2);
        if (tiered.length) tierBase = tiered;
      } else if (score < 9) {
        const tiered = fresh.filter((s) => (s.tier || 5) <= 3);
        if (tiered.length) tierBase = tiered;
      }
    }

    const anchorArtist = norm(anchor.artist);
    const diffArtist = tierBase.filter((s) => norm(s.artist) !== anchorArtist);
    let cands = diffArtist.length ? diffArtist : tierBase;

    if (kind !== 'streams' && score === 0) {
      const clearGap = cands.filter((s) => Math.abs(s.year - anchor.year) >= 3);
      if (clearGap.length) cands = clearGap;
    }
    return pickRandom(cands, rng);
  }

  /** Evaluate 'higher'/'lower' (streams) or 'later'/'earlier' (year). */
  function evaluate(anchor, challenger, choice, kind = 'year') {
    if (kind === 'streams') {
      const delta = challenger.streams - anchor.streams;
      const answer = delta >= 0 ? 'higher' : 'lower';
      return { won: choice === answer, answer, delta };
    }
    const delta = challenger.year - anchor.year;
    const answer = delta > 0 ? 'later' : 'earlier';
    return { won: choice === answer, answer, delta };
  }

  /** Format display metric ({ main, sub }) for either streams or year. */
  function formatMetric(song, kind = 'year') {
    if (!song) return { main: '', sub: '' };
    if (kind === 'streams') {
      const n = Number(song.streams) || 0;
      const main = n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : Math.round(n / 1e6) + 'M';
      return { main, sub: n.toLocaleString('en-US') + ' streams' };
    }
    return { main: String(song.year || ''), sub: '' };
  }

  /** Build shareable #duel challenge URL encoding mode, friend score, and ordered trackIds. */
  function createChallenge(baseUrl, { kind = 'year', score = 0, ids = [] } = {}) {
    const cleanUrl = String(baseUrl || '').split('#')[0];
    const modeCode = kind === 'streams' ? 's' : 'y';
    const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
    const cleanIds = [];
    const seen = new Set();
    for (const rawId of (Array.isArray(ids) ? ids : [])) {
      const id = Number(rawId);
      if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) continue;
      seen.add(id);
      cleanIds.push(id);
      if (cleanIds.length >= 25) break;
    }
    if (!cleanUrl || cleanIds.length < 2) return '';
    return cleanUrl + '#duel=1.' + modeCode + '.' + cleanScore + '.' + cleanIds.join('-');
  }

  /** Parse and validate #duel=1.<mode>.<score>.<id0>-<id1>-... challenge token or URL. */
  function parseChallenge(raw) {
    let token = String(raw || '').trim();
    const hashIdx = token.indexOf('#duel=');
    if (hashIdx >= 0) token = token.slice(hashIdx + 6);
    else if (token.startsWith('duel=')) token = token.slice(5);
    else return null;
    const parts = token.split('.');
    if (parts.length !== 4 || parts[0] !== '1') return null;
    const modeCode = parts[1];
    if (modeCode !== 's' && modeCode !== 'y') return null;
    if (!/^\d+$/.test(parts[2])) return null;
    const score = Number(parts[2]);
    const rawIds = parts[3].split('-');
    if (rawIds.length < 2 || rawIds.length > 25) return null;
    const ids = [];
    const seen = new Set();
    for (let i = 0; i < rawIds.length; i++) {
      if (!/^\d+$/.test(rawIds[i])) return null;
      const id = Number(rawIds[i]);
      if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) return null;
      seen.add(id);
      ids.push(id);
    }
    return {
      version: 1,
      kind: modeCode === 's' ? 'streams' : 'year',
      score,
      ids
    };
  }

  /** Compare challenged player's score against the friend's target score. */
  function compareChallenge(friendScore, yourScore) {
    const fs = Math.max(0, Math.floor(Number(friendScore) || 0));
    const ys = Math.max(0, Math.floor(Number(yourScore) || 0));
    const diff = ys - fs;
    if (diff > 0) return 'You beat your friend by ' + diff + (diff === 1 ? ' point!' : ' points!');
    if (diff < 0) return 'Short by ' + Math.abs(diff) + (Math.abs(diff) === 1 ? ' point.' : ' points.');
    return 'Tied with your friend!';
  }

  /** Build plain-text score share message (no image). */
  function shareText({ score = 0, best = 0, history = [], url = '', kind = 'year', challengeUrl = '' } = {}) {
    const trail = (history || []).slice(-20).map((h) => (h && h.won ? '🟩' : '🟥')).join('');
    const targetUrl = String(challengeUrl || '').trim() || String(url || '').split('#')[0];
    const modeLabel = kind === 'streams' ? 'Spotify Streams Duel' : 'Release Duel';
    return [
      'TuneUp · ' + modeLabel + ' · Score ' + score + ' (Best ' + Math.max(score, best) + ')',
      trail || '🟥',
      targetUrl
    ].filter(Boolean).join('\n');
  }

  const api = {
    buildPool,
    pickFirst,
    pickNext,
    evaluate,
    formatMetric,
    shareText,
    createChallenge,
    parseChallenge,
    compareChallenge
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ReleaseDuel = api;
})(typeof window === 'object' ? window : globalThis);
