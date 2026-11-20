/* TuneUp — Account-free local Badges & Milestones (stored in tl:badges, backed up by TuneUpBackup). */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'tl:badges';

  const CATALOG = [
    {
      id: 'sniper',
      name: '0.1s Sniper',
      desc: 'Guess a song right on the first 0.1s clip',
      theme: 'emerald',
      icon: 'bolt'
    },
    {
      id: 'sweep',
      name: 'Perfect Sweep',
      desc: 'Score 5/5 in a Classic or Artist run',
      theme: 'emerald',
      icon: 'crown'
    },
    {
      id: 'streak10',
      name: 'Hot Streak',
      desc: 'Reach a 10-song Classic win streak',
      theme: 'emerald',
      icon: 'flame'
    },
    {
      id: 'daily3',
      name: 'Daily Regular',
      desc: 'Reach a 3-day Daily Challenge streak',
      theme: 'gold',
      icon: 'cal'
    },
    {
      id: 'daily7',
      name: 'Week Warrior',
      desc: 'Reach a 7-day Daily Challenge streak',
      theme: 'gold',
      icon: 'trophy'
    },
    {
      id: 'duel10',
      name: 'Duel Ace',
      desc: 'Score 10+ in a single Music Duel run',
      theme: 'gold',
      icon: 'spark'
    },
    {
      id: 'detective',
      name: 'Sharp Detective',
      desc: 'Solve Artist Detective in 3 tries or less',
      theme: 'purple',
      icon: 'lens'
    },
    {
      id: 'explorer',
      name: 'All-Rounder',
      desc: 'Play Classic, Daily, Duel & Artist Detective',
      theme: 'purple',
      icon: 'grid'
    }
  ];

  const BY_ID = new Map(CATALOG.map((b) => [b.id, b]));

  function load(storage) {
    if (!storage || typeof storage.getItem !== 'function') return {};
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      const clean = {};
      for (const id of Object.keys(parsed)) {
        if (!BY_ID.has(id)) continue;
        const ts = Number(parsed[id]);
        clean[id] = Number.isFinite(ts) && ts > 0 ? ts : 1;
      }
      return clean;
    } catch (e) {
      return {};
    }
  }

  function save(storage, map) {
    if (!storage || typeof storage.setItem !== 'function') return false;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(map));
      return true;
    } catch (e) {
      return false;
    }
  }

  function unlock(storage, ids) {
    const list = Array.isArray(ids) ? ids : [ids];
    const current = load(storage);
    const added = [];
    const now = Date.now();
    for (const id of list) {
      const def = BY_ID.get(id);
      if (!def || current[id]) continue;
      current[id] = now;
      added.push(def);
    }
    if (added.length) save(storage, current);
    return added;
  }

  function syncFromStats(storage, snap) {
    if (!snap || typeof snap !== 'object') return [];
    const earned = [];
    const classic = snap.classic || {};
    const daily = snap.daily || {};
    const duel = snap.duel || {};
    const artist = snap.artist || {};
    const songBest = Number(snap.songStreakBest) || 0;

    if (Array.isArray(classic.dist) && (Number(classic.dist[5]) || 0) > 0) earned.push('sweep');
    if (Array.isArray(daily.dist) && (Number(daily.dist[0]) || 0) > 0) earned.push('sniper');
    if (songBest >= 10) earned.push('streak10');
    if ((Number(daily.best) || 0) >= 3) earned.push('daily3');
    if ((Number(daily.best) || 0) >= 7) earned.push('daily7');
    if ((Number(duel.best) || 0) >= 10) earned.push('duel10');
    if (Array.isArray(artist.dist) && ((Number(artist.dist[0]) || 0) + (Number(artist.dist[1]) || 0) + (Number(artist.dist[2]) || 0)) > 0) {
      earned.push('detective');
    }
    const playedAll =
      (Number(classic.runs) || 0) > 0 &&
      (Number(daily.played) || 0) > 0 &&
      ((Number(duel.runs) || 0) > 0 || (Number(duel.best) || 0) > 0) &&
      (Number(artist.played) || 0) > 0;
    if (playedAll) earned.push('explorer');

    return earned.length ? unlock(storage, earned) : [];
  }

  function summary(storage) {
    const map = load(storage);
    const items = CATALOG.map((def) => ({
      ...def,
      earned: !!map[def.id],
      unlockedAt: map[def.id] || 0
    }));
    return {
      unlocked: items.filter((i) => i.earned).length,
      total: CATALOG.length,
      items
    };
  }

  const api = { STORAGE_KEY, CATALOG, load, unlock, syncFromStats, summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuneUpBadges = api;
})(typeof window !== 'undefined' ? window : globalThis);
