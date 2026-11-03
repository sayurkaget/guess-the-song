/* Daily resets at 07:00 in the player device timezone, including DST changes. */
(function () {
  'use strict';
  const dayMs = 86400000;
  function previous(date) {
    return new Date(Date.parse(date + 'T00:00:00Z') - dayMs).toISOString().slice(0, 10);
  }
  function day(now = new Date()) {
    const date = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    return now.getHours() < 7 ? previous(date) : date;
  }
  function nextReset(now = new Date()) {
    const next = new Date(now.getTime());
    next.setHours(7, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }
  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function plan(pool, date) {
    const chosen = [], artists = new Set();
    for (let tier = 1; tier <= 5; tier++) {
      const candidates = pool.filter((r) => r[2] === tier).slice().sort((a, b) => {
        const ka = a[0] + '|' + a[1], kb = b[0] + '|' + b[1];
        return hash('daily-v1|' + date + '|' + ka) - hash('daily-v1|' + date + '|' + kb) || (ka < kb ? -1 : ka > kb ? 1 : 0);
      });
      const picked = candidates.find((r) => !artists.has(r[1]) && !chosen.some((c) => c[0] === r[0] && c[1] === r[1]));
      if (!picked) throw new Error('Daily pool needs five distinct artists');
      chosen.push(picked); artists.add(picked[1]);
    }
    return chosen;
  }
  function streak(completed, today = day()) {
    const dates = [...new Set(completed)].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today).sort();
    const all = new Set(dates);
    let current = 0, cursor = all.has(today) ? today : previous(today);
    while (all.has(cursor)) { current++; cursor = previous(cursor); }
    let best = 0, run = 0, last = '';
    for (const d of dates) { run = previous(d) === last ? run + 1 : 1; best = Math.max(best, run); last = d; }
    return { current, best };
  }
  function restore(value, slugs) {
    if (!value || !Array.isArray(value.stages) || !Number.isInteger(value.stage) || value.stage < 0 || value.stage > 4) return null;
    const stages = value.stages.slice(0, 5);
    for (let i = 0; i < stages.length; i++) {
      const r = stages[i];
      if (!r) continue;
      if (r.slug !== slugs[i] || !Array.isArray(r.guesses) || r.guesses.length > 5 ||
          r.guesses.some((g) => !g || !['right','wrong','near','skip'].includes(g.t))) return null;
    }
    const runDone = stages.length === 5 && stages.every((r) => r && r.done);
    return { stages, stage: value.stage, runDone };
  }
  function remaining(now = new Date()) {
    const seconds = Math.ceil((nextReset(now).getTime() - now.getTime()) / 1000);
    return Math.floor(seconds / 3600) + 'h ' + Math.floor(seconds % 3600 / 60) + 'm';
  }
  window.DailyGame = { day, previous, nextReset, plan, streak, restore, remaining };
})();
