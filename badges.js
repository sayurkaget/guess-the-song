/* TuneUp — Account-free local Achievements (stored in tl:badges, backed up by TuneUpBackup). */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'tl:badges';

  const CATALOG = [
    {
      id: 'firstwin',
      name: 'First Note',
      desc: 'Guess your first song right in any mode',
      theme: 'emerald',
      icon: 'note'
    },
    {
      id: 'sniper',
      name: '0.1s Sniper',
      desc: 'Guess a song right on the first 0.1s clip',
      theme: 'emerald',
      icon: 'bolt'
    },
    {
      id: 'clutch',
      name: 'Last Second',
      desc: 'Nail a song on the 5th and final 15s clip',
      theme: 'blue',
      icon: 'heart'
    },
    {
      id: 'impossible',
      name: 'Ear of Steel',
      desc: 'Beat Stage 5 (Impossible) in a Classic run',
      theme: 'emerald',
      icon: 'shield'
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
      id: 'veteran',
      name: 'Crate Digger',
      desc: 'Complete 10 Classic runs',
      theme: 'blue',
      icon: 'disc'
    },
    {
      id: 'playlist',
      name: 'DJ Mode',
      desc: 'Finish a Spotify, Apple Music, or YouTube playlist quiz',
      theme: 'blue',
      icon: 'list'
    },
    {
      id: 'daily3',
      name: 'Daily Regular',
      desc: 'Reach a 3-day Daily streak',
      theme: 'gold',
      icon: 'cal'
    },
    {
      id: 'daily7',
      name: 'Week Warrior',
      desc: 'Reach a 7-day Daily streak',
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
      id: 'duel20',
      name: 'Chart Legend',
      desc: 'Score 20+ in a single Music Duel run',
      theme: 'gold',
      icon: 'medal'
    },
    {
      id: 'detective',
      name: 'Sharp Detective',
      desc: 'Solve Artist Detective in 3 tries or less',
      theme: 'purple',
      icon: 'lens'
    },
    {
      id: 'artist1',
      name: 'First-Try Psychic',
      desc: 'Solve Artist Detective on your very first guess',
      theme: 'purple',
      icon: 'star'
    },
    {
      id: 'dailyartist3',
      name: 'Daily Sleuth',
      desc: 'Reach a 3-day Daily Artist streak',
      theme: 'purple',
      icon: 'ribbon'
    },
    {
      id: 'explorer',
      name: 'All-Rounder',
      desc: 'Play Classic, Daily, Duel & Artist Detective',
      theme: 'purple',
      icon: 'grid'
    },
    {
      id: 'dailyhub1',
      name: 'Daily Spinner',
      desc: 'Complete your first 3-game Daily Challenge',
      theme: 'emerald',
      icon: 'reel'
    },
    {
      id: 'daily250',
      name: 'High Roller',
      desc: 'Score 250+ / 300 in a Daily Challenge',
      theme: 'gold',
      icon: 'trophy'
    },
    {
      id: 'daily300',
      name: 'Flawless 300',
      desc: 'Score a perfect 300 / 300 in a Daily Challenge',
      theme: 'gold',
      icon: 'crown'
    },
    {
      id: 'cover1',
      name: 'Pixel Hawk',
      desc: 'Guess an album on Try 1 in Cover Pixel',
      theme: 'emerald',
      icon: 'pixel'
    },
    {
      id: 'mv1',
      name: 'Cinema Buff',
      desc: 'Guess the song from Frame 1 in MV Frame',
      theme: 'gold',
      icon: 'film'
    },
    {
      id: 'hair1',
      name: 'Hair Stylist',
      desc: 'Guess the musician on Try 1 in Hair Peek',
      theme: 'purple',
      icon: 'scissors'
    },
    {
      id: 'fact10',
      name: 'Fact Checker',
      desc: 'Reach a 10+ streak in Fact or Cap',
      theme: 'orange',
      icon: 'check'
    },
    {
      id: 'lyric1',
      name: 'Lyric Savant',
      desc: 'Guess the song from Line 1 in Lyric Guess',
      theme: 'blue',
      icon: 'lyric'
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
    const dailyHub = snap.dailyHub || {};
    const duel = snap.duel || {};
    const artist = snap.artist || {};
    const mini = snap.mini || {};
    const songBest = Number(snap.songStreakBest) || 0;
    const dailyBestStreak = Math.max(Number(daily.best) || 0, Number(dailyHub.bestStreak) || 0);

    if (songBest >= 1 || (Number(daily.won) || 0) >= 1 || (Number(classic.total) || 0) >= 1 ||
        (Array.isArray(classic.dist) && classic.dist.slice(1).some((n) => (Number(n) || 0) > 0))) {
      earned.push('firstwin');
    }
    if (Array.isArray(classic.dist) && (Number(classic.dist[5]) || 0) > 0) earned.push('sweep');
    if (Array.isArray(daily.dist) && (Number(daily.dist[0]) || 0) > 0) earned.push('sniper');
    if (Array.isArray(daily.dist) && (Number(daily.dist[4]) || 0) > 0) earned.push('clutch');
    if (songBest >= 10) earned.push('streak10');
    if ((Number(classic.runs) || 0) >= 10) earned.push('veteran');
    if (dailyBestStreak >= 3) earned.push('daily3');
    if (dailyBestStreak >= 7) earned.push('daily7');
    if ((Number(duel.best) || 0) >= 10) earned.push('duel10');
    if ((Number(duel.best) || 0) >= 20) earned.push('duel20');
    if (Array.isArray(artist.dist) && (Number(artist.dist[0]) || 0) > 0) earned.push('artist1');
    if (Array.isArray(artist.dist) && ((Number(artist.dist[0]) || 0) + (Number(artist.dist[1]) || 0) + (Number(artist.dist[2]) || 0)) > 0) {
      earned.push('detective');
    }
    if ((Number(artist.dailyBest) || 0) >= 3) earned.push('dailyartist3');
    const playedAll =
      (Number(classic.runs) || 0) > 0 &&
      ((Number(daily.played) || 0) > 0 || (Number(dailyHub.played) || 0) > 0) &&
      ((Number(duel.runs) || 0) > 0 || (Number(duel.best) || 0) > 0) &&
      (Number(artist.played) || 0) > 0;
    if (playedAll) earned.push('explorer');

    const mgGames = (mini.games && typeof mini.games === 'object') ? mini.games : {};
    const factBest = Math.max(Number(mini.factBest) || 0, Number(mgGames.fact && mgGames.fact.best) || 0);
    if ((Number(dailyHub.played) || 0) >= 1) earned.push('dailyhub1');
    if ((Number(dailyHub.bestScore) || 0) >= 250) earned.push('daily250');
    if ((Number(dailyHub.bestScore) || 0) >= 300) earned.push('daily300');
    if ((Number(mini.cover1) || 0) >= 1) earned.push('cover1');
    if ((Number(mini.mv1) || 0) >= 1) earned.push('mv1');
    if ((Number(mini.hair1) || 0) >= 1) earned.push('hair1');
    if (factBest >= 10) earned.push('fact10');
    if ((Number(mini.lyric1) || 0) >= 1) earned.push('lyric1');

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

  const api = { STORAGE_KEY, CATALOG, load, save, unlock, syncFromStats, summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuneUpBadges = api;
})(typeof window !== 'undefined' ? window : globalThis);
