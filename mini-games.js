/* TuneUp Daily Spin Hub & 5 Pure-Music Mini-Games (Cover Pixel, MV Frame, Hair Peek, Music Fact or Cap, Lyric Guess). */
(function () {
  'use strict';

  const Hub = window.TuneUpDailyHub;
  if (!Hub) return;
  const getData = () => window.TUNEUP_DAILY_HUB_DATA || {};

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  const LS = {
    get(k, dflt) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : dflt; } catch { return dflt; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* Crisp monochrome SVG icons matching TuneUp's exact stroke-width 1.9 visual grammar */
  const ICONS = {
    song: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.8V5.2l11-2v12.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.2" cy="17.8" r="2.8" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="17.2" cy="15.8" r="2.8" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>',
    cover: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17M15 3.5v17" fill="none" stroke="currentColor" stroke-width="1.35" opacity=".65"/></svg>',
    hair: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 11.5a5.5 5.5 0 0 1 11 0v1.5a5.5 5.5 0 0 1-11 0v-1.5Z" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M6 10.5c.8-4.2 3.2-6.5 6-6.5 3.2 0 5.6 2.1 6.2 5.8-2.2-1.6-4.4-2.2-6.6-1.8-2.2.4-3.8 1.2-5.6 2.5Z" fill="currentColor" opacity=".32"/><path d="M4.5 20.5c1.5-2.7 4.2-4 7.5-4s6 1.3 7.5 4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    mv: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="m10 9.5 5 2.5-5 2.5v-5Z" fill="currentColor"/></svg>',
    fact: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2.8 4.8 13.4h6.4L10.4 21.2 19.2 10.6h-6.4L13 2.8Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    lyric: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 6.5h15M4.5 11.5h11M4.5 16.5h13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="18.5" cy="16.5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    artist: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 2.85 5.8 6.4.93-4.62 4.5 1.09 6.37L12 17.2 6.28 20.2l1.09-6.37-4.62-4.5 6.4-.93L12 2.6Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    duel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5 19.5 9.5M19.5 4.5l-5 5M4.5 14.5l5 5M4.5 19.5l5-5M7 12h10" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>'
  };

  const HUB_KEY = (day) => 'tl:dailyhub:v1:' + day;
  const HUB_ARCHIVE_KEY = (day) => 'tl:dailyhub:archive:v1:' + day;
  const HUB_DONE_KEY = 'tl:dailyhub:completed';
  const HUB_POSTED_KEY = (day) => 'tl:dailyhub:posted:' + day;
  const FACT_BEST_KEY = 'tl:fact:best';
  const MG_STATS_KEY = 'tl:mg:stats';

  let bridge = null;
  const isEs = () => (bridge && bridge.getLang && bridge.getLang() === 'es');
  const t = (en, es) => (isEs() ? es : en);

  function gameLabel(id) {
    const g = Hub.GAME_MAP[id];
    if (!g) return id;
    return isEs() ? g.nameEs : g.nameEn;
  }

  /* ================= Daily Hub State ================= */
  let hubState = null;       // { day, slots, spun, results: [null, null, null], done, totalScore, isArchive }
  let activeHubDay = null;   // null = today (live), 'YYYY-MM-DD' = past Archive practice day
  let activeDailySlot = null;// null when Free Play, or { slot, gameId, diffKey, diffTier, seed, day, isArchive }
  let spinAnimating = false;
  let spinTimers = [];
  let spinRafs = [];
  let cachedCommunity = null;
  let spinAudioCtx = null;

  const GAME_COLORS = {
    song:   '#25e07d',
    cover:  '#25e07d',
    mv:     '#f5b13d',
    duel:   '#f5b13d',
    artist: '#a855f7',
    hair:   '#a855f7',
    fact:   '#f08a3c',
    lyric:  '#3db6f5'
  };
  function gameColor(id) {
    return GAME_COLORS[id] || '#25e07d';
  }
  function recordMgStat(mutator) {
    const cur = LS.get(MG_STATS_KEY, {}) || {};
    mutator(cur);
    LS.set(MG_STATS_KEY, cur);
    return cur;
  }
  function awardMiniBadges(ids) {
    if (!bridge || !ids || !ids.length) return;
    if (typeof bridge.unlockBadges === 'function') bridge.unlockBadges(ids);
  }

  function getSpinAudio() {
    if (bridge && bridge.isSfxOn && !bridge.isSfxOn()) return null;
    const Ctx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!Ctx) return null;
    try {
      if (!spinAudioCtx) spinAudioCtx = new Ctx();
      if (spinAudioCtx.state === 'suspended') spinAudioCtx.resume().catch(() => {});
      return spinAudioCtx;
    } catch { return null; }
  }
  function haptic(pattern) {
    if (bridge && bridge.isSfxOn && !bridge.isSfxOn()) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {}
  }
  function playLeverPull() {
    haptic([20, 22, 12]);
    const ctx = getSpinAudio();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Mechanical ratchet pull + spring click
      [[190, 0, 0.08, 0.14], [130, 0.06, 0.09, 0.16], [420, 0.14, 0.05, 0.08]].forEach(([f, d, dur, v]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f, now + d);
        o.frequency.exponentialRampToValueAtTime(f * 0.55, now + d + dur);
        g.gain.setValueAtTime(v, now + d);
        g.gain.exponentialRampToValueAtTime(0.0008, now + d + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + d); o.stop(now + d + dur + 0.01);
      });
    } catch {}
  }
  function playSpinTick(pitch) {
    haptic(6);
    const ctx = getSpinAudio();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(pitch, now);
      o.frequency.exponentialRampToValueAtTime(pitch * 0.45, now + 0.028);
      g.gain.setValueAtTime(0.075, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.032);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.036);
    } catch {}
  }
  function playSpinLock(idx) {
    haptic(idx === 2 ? [18, 28, 26] : 16);
    const ctx = getSpinAudio();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const f = notes[idx] || 659.25;
      const now = ctx.currentTime;
      // Mechanical drum lock thud
      const thud = ctx.createOscillator(), tg = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(125, now);
      thud.frequency.exponentialRampToValueAtTime(48, now + 0.085);
      tg.gain.setValueAtTime(0.18, now);
      tg.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
      thud.connect(tg); tg.connect(ctx.destination);
      thud.start(now); thud.stop(now + 0.1);

      // Lock chime
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, now);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.32);

      // Final reel 3 sparkling slot jackpot chord
      if (idx === 2) {
        [[1046.5, 0.07, 0.48, 0.14], [1318.5, 0.14, 0.52, 0.11], [1567.98, 0.21, 0.58, 0.09]].forEach(([cf, d, dur, v]) => {
          const o2 = ctx.createOscillator(), g2 = ctx.createGain();
          o2.type = 'triangle';
          o2.frequency.setValueAtTime(cf, now + d);
          g2.gain.setValueAtTime(0.001, now);
          g2.gain.setValueAtTime(v, now + d);
          g2.gain.exponentialRampToValueAtTime(0.001, now + d + dur);
          o2.connect(g2); g2.connect(ctx.destination);
          o2.start(now + d); o2.stop(now + d + dur + 0.02);
        });
      }
    } catch {}
  }

  /* Tactile feedback SFX + visual juice helpers (respects settings.sfx & settings.anim) */
  function playFxTone(freqs, dur, type, vol, step) {
    const ctx = getSpinAudio();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      freqs.forEach((f, i) => {
        const t0 = now + i * (step || 0.065);
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || 'triangle';
        o.frequency.setValueAtTime(f, t0);
        g.gain.setValueAtTime(vol || 0.09, t0);
        g.gain.exponentialRampToValueAtTime(0.0008, t0 + (dur || 0.22));
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + (dur || 0.22) + 0.02);
      });
    } catch {}
  }
  function playFxWin()     { haptic([16, 26, 22]); playFxTone([523.25, 659.25, 783.99, 1046.5], 0.32, 'sine', 0.11, 0.068); }
  function playFxCorrect() { haptic(14); playFxTone([523.25, 783.99], 0.22, 'sine', 0.1, 0.065); }
  function playFxNear()    { haptic([10, 22, 10]); playFxTone([440, 554.37], 0.18, 'triangle', 0.085, 0.06); }
  function playFxWrong()   { haptic([28, 22, 28]); playFxTone([220, 164.81], 0.17, 'triangle', 0.095, 0.075); }

  function isAnimOn() {
    return !(bridge && bridge.isAnimOn && !bridge.isAnimOn());
  }
  function triggerFxClass(el, cls, ms) {
    if (!el || !isAnimOn()) return;
    if (typeof el.classList.contains !== 'function' || el.classList.contains(cls)) {
      el.classList.remove(cls);
      void el.offsetWidth;
    }
    el.classList.add(cls);
    clearTimeout(el._fxTid);
    el._fxTid = setTimeout(() => el.classList.remove(cls), ms || 560);
  }
  function popFloatBadge(anchor, text, kind) {
    if (!anchor || !isAnimOn()) return;
    const b = document.createElement('span');
    b.className = 'mg-float-pop is-' + (kind || 'win');
    b.textContent = text;
    anchor.appendChild(b);
    setTimeout(() => { if (b.parentNode) b.parentNode.removeChild(b); }, 780);
  }
  function spawnWinSparks(anchor) {
    if (!anchor || !isAnimOn()) return;
    const wrap = document.createElement('div');
    wrap.className = 'mg-sparks';
    wrap.setAttribute('aria-hidden', 'true');
    const cols = ['#25e07d', '#58ffad', '#a7f3d0', '#fde047', '#38bdf8'];
    for (let i = 0; i < 14; i++) {
      const ang = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.28;
      const dist = 42 + Math.random() * 68;
      const dx = Math.round(Math.cos(ang) * dist);
      const dy = Math.round(Math.sin(ang) * dist - 14);
      const sp = document.createElement('span');
      sp.className = 'mg-spark';
      sp.style.setProperty('--dx', dx + 'px');
      sp.style.setProperty('--dy', dy + 'px');
      sp.style.setProperty('--c', cols[i % cols.length]);
      sp.style.animationDelay = Math.round(Math.random() * 70) + 'ms';
      wrap.appendChild(sp);
    }
    anchor.appendChild(wrap);
    setTimeout(() => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 820);
  }

  function todayStr() {
    return (bridge && bridge.getDay) ? bridge.getDay() : (window.DailyGame ? window.DailyGame.day() : new Date().toISOString().slice(0, 10));
  }
  function isArchiveDay(day) {
    return Boolean(day && /^\d{4}-\d{2}-\d{2}$/.test(day) && day < todayStr());
  }
  function readHubStateForDay(day) {
    const archive = isArchiveDay(day);
    const slots = Hub.planDay(day);
    const liveSaved = LS.get(HUB_KEY(day), null);
    const archSaved = archive ? LS.get(HUB_ARCHIVE_KEY(day), null) : null;
    const saved = (liveSaved && liveSaved.day === day && Array.isArray(liveSaved.results) && liveSaved.results.length === 3)
      ? liveSaved
      : (archSaved && archSaved.day === day && Array.isArray(archSaved.results) && archSaved.results.length === 3 ? archSaved : null);
    if (saved) {
      return {
        day,
        slots,
        spun: !!saved.spun,
        results: saved.results,
        done: saved.results.every(Boolean),
        totalScore: saved.results.reduce((s, r) => s + (r ? Number(r.score) || 0 : 0), 0),
        isArchive: archive,
        wasLiveDone: Boolean(liveSaved && Array.isArray(liveSaved.results) && liveSaved.results.every(Boolean))
      };
    }
    return { day, slots, spun: false, results: [null, null, null], done: false, totalScore: 0, isArchive: archive, wasLiveDone: false };
  }
  function archivedCompletedDays() {
    const out = new Set();
    try {
      const len = typeof localStorage !== 'undefined' && Number.isFinite(localStorage.length) ? localStorage.length : 0;
      for (let i = 0; i < len; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('tl:dailyhub:archive:v1:')) continue;
        const st = LS.get(k, null);
        if (st && st.day && Array.isArray(st.results) && st.results.every(Boolean)) out.add(st.day);
      }
    } catch {}
    return out;
  }

  function loadHubState(dayOverride) {
    const day = dayOverride || activeHubDay || todayStr();
    hubState = readHubStateForDay(day);
    return hubState;
  }

  function saveHubState() {
    if (!hubState) return;
    hubState.done = hubState.results.every(Boolean);
    hubState.totalScore = hubState.results.reduce((s, r) => s + (r ? Number(r.score) || 0 : 0), 0);
    if (hubState.isArchive) {
      LS.set(HUB_ARCHIVE_KEY(hubState.day), {
        day: hubState.day,
        spun: hubState.spun,
        results: hubState.results
      });
      refreshLobbyDailyUI();
      return;
    }
    LS.set(HUB_KEY(hubState.day), {
      day: hubState.day,
      spun: hubState.spun,
      results: hubState.results
    });
    if (hubState.done) {
      const doneList = LS.get(HUB_DONE_KEY, []);
      if (Array.isArray(doneList) && !doneList.includes(hubState.day)) {
        doneList.push(hubState.day);
        LS.set(HUB_DONE_KEY, doneList);
      }
      recordMgStat((s) => {
        s.hubPlayed = Math.max(Number(s.hubPlayed) || 0, Array.isArray(doneList) ? doneList.length : 1);
        s.hubBestScore = Math.max(Number(s.hubBestScore) || 0, hubState.totalScore);
      });
      const earned = ['dailyhub1'];
      if (hubState.totalScore >= 250) earned.push('daily250');
      if (hubState.totalScore >= 300) earned.push('daily300');
      awardMiniBadges(earned);
      if (bridge && typeof bridge.syncBadges === 'function') bridge.syncBadges(true);
      postHubStats(hubState.day, hubState.totalScore);
    }
    refreshLobbyDailyUI();
  }

  function combinedCompletedDays() {
    const a = LS.get(HUB_DONE_KEY, []);
    const b = LS.get('tl:daily:completed', []);
    const c = LS.get('tl:artist:daily:completed', []);
    return [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : []), ...(Array.isArray(c) ? c : [])])];
  }

  /* ================= D1 Community Histogram API ================= */
  async function postHubStats(day, score) {
    if (typeof fetch !== 'function') return;
    if (LS.get(HUB_POSTED_KEY(day), false)) {
      fetchHubStats(day);
      return;
    }
    try {
      const res = await fetch('/api/daily-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'hub', day, score: Math.max(0, Math.min(300, Math.round(score))) })
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.ok) {
          LS.set(HUB_POSTED_KEY(day), true);
          cachedCommunity = json;
          renderHubScorecardCommunity();
          return;
        }
      }
    } catch {}
    fetchHubStats(day);
  }

  async function fetchHubStats(day) {
    if (typeof fetch !== 'function') return;
    try {
      const res = await fetch('/api/daily-stats?kind=hub&day=' + encodeURIComponent(day));
      if (res.ok) {
        const json = await res.json();
        if (json && json.ok) {
          cachedCommunity = json;
          renderHubScorecardCommunity();
        }
      }
    } catch {}
  }

  /* ================= Lobby & Streak Popover UI ================= */
  function refreshLobbyDailyUI() {
    const st = readHubStateForDay(todayStr());
    if (!activeHubDay && (!hubState || hubState.day === st.day)) hubState = st;
    const ov = Hub.streakOverview(combinedCompletedDays(), st.day);
    const rem = (bridge && bridge.getRemaining) ? bridge.getRemaining() : '';

    // Update streak pills (lobby + daily hub)
    const numTxt = String(ov.current);
    const sPillNum = $('#streakPillNum');
    const dhStreakNum = $('#dhStreakNum');
    if (sPillNum) sPillNum.textContent = numTxt;
    if (dhStreakNum) dhStreakNum.textContent = numTxt;
    const sPillBtn = $('#streakPillBtn');
    if (sPillBtn) sPillBtn.dataset.active = ov.current > 0 ? '1' : '0';

    // Update Streak Popover contents
    renderStreakPopover(ov);

    // Update Unified Daily Hero Card in Lobby
    const card = $('#dailyHubCard');
    const badge = $('#dailyHubBadge');
    const status = $('#dailyHubStatus');
    const btn = $('#openDailyHub');
    const meta = $('#dailyHubMeta');
    const doneCount = st.results.filter(Boolean).length;

    if (meta) {
      if (st.done) {
        meta.textContent = rem ? t(`Next daily in ${rem}`, `Próximo diario en ${rem}`) : t('Completed today', 'Completado hoy');
      } else if (doneCount > 0) {
        meta.textContent = t(`${doneCount}/3 done · ${st.totalScore} pts`, `${doneCount}/3 listos · ${st.totalScore} pts`);
      } else {
        meta.textContent = rem ? t(`3 random games · Resets in ${rem}`, `3 juegos al azar · Reinicia en ${rem}`) : t('3 random music games', '3 juegos musicales al azar');
      }
    }
    if (card) {
      if (st.done) card.dataset.done = 'win';
      else card.removeAttribute('data-done');
    }
    if (badge) {
      if (st.done) {
        badge.textContent = `✓ ${st.totalScore}/300`;
        badge.hidden = false;
      } else if (doneCount > 0) {
        badge.textContent = `${doneCount}/3`;
        badge.hidden = false;
      } else {
        badge.textContent = t('3 games · /300', '3 juegos · /300');
        badge.hidden = false;
      }
    }
    if (status) {
      status.textContent = '';
      status.hidden = true;
    }
    if (btn) {
      btn.textContent = st.done
        ? t('View daily score', 'Ver puntaje diario')
        : (doneCount > 0 || st.spun ? t('Continue daily', 'Continuar diario') : t('Spin Daily', 'Girar Diario'));
    }

    // Update countdown inside hub
    const cd = $('#dhCountdown');
    if (cd && rem) cd.textContent = rem;
  }

  function renderStreakPopover(ov) {
    const body = $('#streakPopBody');
    if (!body) return;
    const archDays = archivedCompletedDays();
    const sinceTxt = ov.since ? t('Since ' + ov.since, 'Desde ' + ov.since) : t('Finish today’s Daily to start', 'Completa el Diario de hoy para empezar');
    const daysHtml = ov.days28.map((d) => {
      const isArch = !d.played && archDays.has(d.day);
      const label = d.isToday
        ? `${d.day} (${t('Today', 'Hoy')})`
        : `${d.day} (${t('Tap to play archive', 'Toca para jugar el archivo')})`;
      return `<button type="button" class="sp-day${d.played ? ' is-on' : ''}${isArch ? ' is-arch' : ''}${d.isToday ? ' is-today' : ''}" data-day="${esc(d.day)}" title="${esc(label)}">${d.dom}</button>`;
    }).join('');
    const wds = ov.days28.slice(0, 7).map((d) => `<span class="sp-wd">${d.wd}</span>`).join('');
    body.innerHTML =
      `<div class="sp-kicker">${esc(t('DAILY STREAK', 'RACHA DIARIA'))}</div>` +
      `<div class="sp-hero"><span class="sp-flame" aria-hidden="true">🔥</span><div><div class="sp-val"><b>${ov.current}</b> ${esc(t(ov.current === 1 ? 'day' : 'days', ov.current === 1 ? 'día' : 'días'))}</div><div class="sp-since">${esc(sinceTxt)}</div></div></div>` +
      `<div class="sp-cal-lbl">${esc(t('Last 28 days', 'Últimos 28 días'))}</div>` +
      `<div class="sp-cal-tip">${esc(t('Tap any date to practice past Dailies', 'Toca cualquier fecha para practicar Diarios pasados'))}</div>` +
      `<div class="sp-grid">${wds}${daysHtml}</div>` +
      `<div class="sp-rows">` +
        `<div><span>${esc(t('Longest', 'Más larga'))}</span><b>${ov.best} ${esc(t('days', 'días'))}</b></div>` +
        `<div><span>${esc(t('Days played', 'Días jugados'))}</span><b>${ov.totalDays}</b></div>` +
        `<div><span>${esc(t('Next milestone', 'Próxima meta'))}</span><b class="is-acc">${ov.nextMilestone} ${esc(t('days', 'días'))}</b></div>` +
      `</div>`;
  }

  /* ================= Daily Spin Hub View ================= */
  function hideAllScreens() {
    if (bridge && bridge.undockMiniVolume) bridge.undockMiniVolume();
    if (bridge && bridge.hidePrimaryScreens) bridge.hidePrimaryScreens();
    const hub = $('#dailyHub');
    const mg = $('#miniGame');
    if (hub) hub.hidden = true;
    if (mg) mg.hidden = true;
    const pop = $('#streakPopover');
    if (pop) pop.hidden = true;
  }

  function scrollTopReset() {
    if (typeof window === 'undefined') return;
    try { window.scrollTo(0, 0); } catch {}
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => { try { window.scrollTo(0, 0); } catch {} });
    }
  }

  function showDailyHub(opts) {
    if (bridge && bridge.stopAudio) bridge.stopAudio();
    activeDailySlot = null;
    if (!opts || !opts.keepDay) activeHubDay = null;
    hideAllScreens();
    document.body.dataset.diff = 'easy';
    const hub = $('#dailyHub');
    if (hub) hub.hidden = false;
    loadHubState(activeHubDay || undefined);
    renderDailyHub();
    if ((!opts || !opts.skipRoute) && bridge && bridge.syncRoute) {
      bridge.syncRoute('daily', t('Daily Challenge — TuneUp', 'Desafío Diario — TuneUp'), !!(opts && opts.replace));
    }
    scrollTopReset();
  }

  function openDailyArchive(day) {
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
    activeHubDay = isArchiveDay(day) ? day : null;
    showDailyHub({ keepDay: true });
    return true;
  }

  function clearSpinTimers() {
    spinTimers.forEach((id) => clearTimeout(id));
    spinRafs.forEach((id) => { if (id) cancelAnimationFrame(id); });
    spinTimers = [];
    spinRafs = [];
    spinAnimating = false;
    for (let i = 0; i < 3; i++) {
      const w = $('#dhWin' + i);
      if (w) w.classList.remove('is-spinning', 'is-suspense');
    }
  }

  function nextUnfinishedSlotIndex() {
    if (!hubState) return 0;
    return hubState.results.findIndex((r) => !r);
  }

  function renderDailyHub() {
    const st = hubState || loadHubState();
    refreshLobbyDailyUI();
    const isArch = !!st.isArchive;
    const dayPill = $('#dhDayPill');
    if (dayPill) {
      dayPill.textContent = `${isArch ? t('ARCHIVE', 'ARCHIVO') : t('DAILY', 'DIARIO')} · ${st.day}`;
      dayPill.classList.toggle('is-archive', isArch);
    }
    const todayBtn = $('#dhTodayBtn');
    if (todayBtn) {
      todayBtn.hidden = !isArch;
      todayBtn.textContent = t('Today', 'Hoy');
    }
    const archLbl = $('#dhArchiveLbl');
    if (archLbl) archLbl.textContent = t('Archive', 'Archivo');
    const kicker = $('#dhKicker');
    if (kicker) kicker.textContent = isArch ? t('DAILY ARCHIVE', 'ARCHIVO DIARIO') : t('DAILY CHALLENGE', 'DESAFÍO DIARIO');
    const doneKicker = $('#dhDoneKicker');
    if (doneKicker) doneKicker.textContent = isArch ? t('ARCHIVE COMPLETE', 'ARCHIVO COMPLETADO') : t('DAILY COMPLETE', 'DIARIO COMPLETADO');

    const spinPanel = $('#dhSpinPanel');
    const scorePanel = $('#dhScorePanel');
    if (!spinPanel || !scorePanel) return;

    if (st.done) {
      spinPanel.hidden = true;
      scorePanel.hidden = false;
      renderHubScorecard();
      if (!isArch && (!cachedCommunity || cachedCommunity.day !== st.day)) fetchHubStats(st.day);
      return;
    }

    spinPanel.hidden = false;
    scorePanel.hidden = true;

    const titleEl = $('#dhTitle');
    const subEl = $('#dhSub');
    const ctaBtn = $('#dhMainBtn');
    const nextIdx = nextUnfinishedSlotIndex();

    if (!st.spun) {
      if (titleEl) titleEl.textContent = isArch ? t(`Archive · ${st.day}`, `Archivo · ${st.day}`) : t("Today's 3 Music Games", '3 Juegos Musicales de Hoy');
      if (subEl) subEl.textContent = isArch
        ? t('Practice past Daily — won’t affect today’s streak.', 'Práctica de Diario pasado — no afecta tu racha de hoy.')
        : t('Spin to reveal today’s lineup — same 3 games for everyone.', 'Gira para revelar los 3 juegos de hoy — iguales para todos.');
      if (ctaBtn) {
        ctaBtn.textContent = isArch ? t('Spin Archive Games', 'Girar Juegos de Archivo') : t("Spin Today's Games", 'Girar Juegos de Hoy');
        ctaBtn.disabled = false;
      }
      for (let i = 0; i < 3; i++) buildReelStrip(i, false);
    } else {
      const nextSlot = st.slots[nextIdx >= 0 ? nextIdx : 0];
      if (titleEl) titleEl.textContent = isArch ? t(`Archive · ${st.day}`, `Archivo · ${st.day}`) : t("Today's 3 Music Games", '3 Juegos Musicales de Hoy');
      if (subEl) subEl.textContent = isArch
        ? t('Finish all 3 archive games for your practice /300 score.', 'Completa los 3 juegos del archivo para tu puntaje de práctica /300.')
        : t('Finish all 3 games for your daily /300 score.', 'Completa los 3 juegos para tu puntaje diario /300.');
      if (ctaBtn) {
        ctaBtn.textContent = t(`Play ${gameLabel(nextSlot.gameId)} →`, `Jugar ${gameLabel(nextSlot.gameId)} →`);
        ctaBtn.disabled = false;
      }
      for (let i = 0; i < 3; i++) buildReelStrip(i, true);
    }
  }

  const REEL_STEP = 58; // 52px card + 6px gap
  const REEL_BASE_LOOPS = [4, 6, 8]; // high-travel escalating casino slot loops
  function buildReelStrip(slotIdx, landed) {
    const strip = $('#dhReel' + slotIdx);
    const win = $('#dhWin' + slotIdx);
    const col = $('#dhCol' + slotIdx);
    const badge = $('#dhBadge' + slotIdx);
    const sub = $('#dhSub' + slotIdx);
    if (!strip || !hubState) return;
    const slot = hubState.slots[slotIdx];
    const res = hubState.results[slotIdx];
    const nextIdx = nextUnfinishedSlotIndex();

    const rc = gameColor(slot.gameId);
    if (col) col.classList.remove('is-recoil', 'is-finale');
    if (win) {
      win.className = 'dh-reel-window';
      win.style.setProperty('--rc', rc);
    }

    const list = [];
    for (let loop = 0; loop < 10; loop++) {
      for (let i = 0; i < Hub.GAMES.length; i++) list.push(Hub.GAMES[i]);
    }
    strip.innerHTML = list.map((g, idx) =>
      `<div class="dh-reel-item" data-idx="${idx}" data-gid="${g.id}">` +
        `<span class="dh-reel-ico">${ICONS[g.id] || ''}</span>` +
        `<span class="dh-reel-name">${esc(gameLabel(g.id))}</span>` +
      `</div>`
    ).join('');

    const targetGameIdx = Hub.GAMES.findIndex((g) => g.id === slot.gameId);
    const targetRow = REEL_BASE_LOOPS[slotIdx] * Hub.GAMES.length + Math.max(0, targetGameIdx);

    strip.style.transition = 'none';
    if (badge) badge.hidden = true;
    if (!landed) {
      const idleRow = 1 + slotIdx * 2;
      strip.style.transform = `translate3d(0,${-(idleRow * REEL_STEP) + 54}px,0)`;
      if (sub) { sub.textContent = t('Game ' + (slotIdx + 1), 'Juego ' + (slotIdx + 1)); sub.className = 'dh-slot-sub'; sub.style.removeProperty('--rc'); }
    } else {
      strip.style.transform = `translate3d(0,${-(targetRow * REEL_STEP) + 54}px,0)`;
      if (win) win.classList.add('is-locked', 'is-flash');
      const card = strip.querySelector(`[data-idx="${targetRow}"]`);
      if (card) {
        card.style.setProperty('--rc', rc);
        card.classList.add('is-landed');
        if (res) card.classList.add('is-done');
      }
      if (sub) {
        if (res) {
          sub.textContent = `+${res.score} · ${res.shortSummary || ''}`;
          sub.className = 'dh-slot-sub is-done';
          sub.style.removeProperty('--rc');
        } else if (slotIdx === nextIdx) {
          sub.textContent = t('Up next', 'Siguiente');
          sub.className = 'dh-slot-sub is-next';
          sub.style.setProperty('--rc', rc);
        } else {
          sub.textContent = t('Game ' + (slotIdx + 1), 'Juego ' + (slotIdx + 1));
          sub.className = 'dh-slot-sub';
          sub.style.removeProperty('--rc');
        }
      }
    }
  }

  function startDailySpin() {
    if (!hubState) loadHubState();
    if (spinAnimating) {
      // Tap to skip spin animation!
      clearSpinTimers();
      hubState.spun = true;
      saveHubState();
      renderDailyHub();
      return;
    }
    if (hubState.spun) {
      const idx = nextUnfinishedSlotIndex();
      launchDailySlot(idx >= 0 ? idx : 0);
      return;
    }

    // Respect in-app Animations OFF setting
    if (bridge && bridge.isAnimOn && !bridge.isAnimOn()) {
      hubState.spun = true;
      saveHubState();
      renderDailyHub();
      playSpinLock(2);
      return;
    }

    clearSpinTimers();
    spinAnimating = true;
    const titleEl = $('#dhTitle');
    const ctaBtn = $('#dhMainBtn');
    const reelsBox = $('.dh-reels');
    if (titleEl) titleEl.textContent = t('Rolling today’s lineup…', 'Sorteando los juegos de hoy…');
    if (ctaBtn) ctaBtn.textContent = t('Tap to skip', 'Toca para saltar');

    // Crisp mechanical slot start ratchet
    playLeverPull();

    // Extended casino-slot physics: high-speed cruise -> staggered heavy slam -> dramatic Reel 3 suspense crawl (~4.85s)
    const durs = [2050, 3250, 4850];
    hubState.slots.forEach((slot, rIdx) => {
      const strip = $('#dhReel' + rIdx);
      const win = $('#dhWin' + rIdx);
      const col = $('#dhCol' + rIdx);
      if (!strip) return;
      const targetGameIdx = Hub.GAMES.findIndex((g) => g.id === slot.gameId);
      const targetRow = REEL_BASE_LOOPS[rIdx] * Hub.GAMES.length + Math.max(0, targetGameIdx);
      const startY = -((1 + rIdx * 2) * REEL_STEP) + 54;
      const endY = -(targetRow * REEL_STEP) + 54;
      const dist = endY - startY;
      const dur = durs[rIdx];
      const t0 = performance.now();
      let lastRowPassed = -1;
      let suspenseOn = false;

      const rc = gameColor(slot.gameId);
      if (win) {
        win.style.setProperty('--rc', rc);
        win.classList.remove('is-locked', 'is-flash', 'is-suspense');
        win.classList.add('is-spinning');
      }
      if (col) col.classList.remove('is-recoil', 'is-finale');
      strip.style.transition = 'none';

      function frame(now) {
        if (!spinAnimating) return;
        const el = now - t0;
        const p = Math.min(1, el / dur);
        let y, vel;
        const overshoot = rIdx === 2 ? 1.028 : 1.02;
        if (p < 0.055) {
          // Anticipation pull-back upward before reel launch
          const k = p / 0.055;
          y = startY + Math.sin(k * Math.PI) * 18;
          vel = 0;
        } else {
          const u = (p - 0.055) / 0.945;
          const pow = rIdx === 2 ? 4.9 : (rIdx === 1 ? 4.3 : 3.9);
          let eased;
          if (u < 0.91) {
            const s = u / 0.91;
            // Fast initial cruise blending smoothly into long dramatic brake
            eased = (1 - Math.pow(1 - s, pow)) * overshoot;
            vel = Math.pow(1 - s, pow - 1);
          } else {
            // Crisp mechanical overshoot snap-back into exact payline
            const s = (u - 0.91) / 0.09;
            eased = overshoot - (overshoot - 1) * (1 - Math.pow(1 - s, 2.2));
            vel = 0;
          }
          y = startY + dist * eased;
          if (rIdx === 2 && !suspenseOn && el > durs[1] - 60 && p < 0.97 && win) {
            suspenseOn = true;
            win.classList.add('is-suspense');
          }
        }
        // Pure GPU transform (zero per-frame Gaussian blur rasterization!)
        const stretch = vel > 0.2 ? (1 + Math.min(0.045, (vel - 0.2) * 0.06)) : 1;
        strip.style.transform = stretch > 1.001
          ? `translate3d(0,${y.toFixed(1)}px,0) scaleY(${stretch.toFixed(3)})`
          : `translate3d(0,${y.toFixed(1)}px,0)`;

        // Per-symbol slot click synced to active reel (rising tension pitch on final Reel 3 ticks!)
        const curRow = Math.floor((-y + 54) / REEL_STEP);
        if (curRow !== lastRowPassed && p >= 0.055 && p < 0.985) {
          lastRowPassed = curRow;
          if (rIdx === 0 || el > durs[rIdx - 1] - 120) {
            const isSuspenseTick = rIdx === 2 && el > durs[1];
            const pitch = isSuspenseTick ? (480 + p * 440) : (520 + (1 - p) * 320);
            playSpinTick(pitch);
          }
        }

        if (p < 1) {
          spinRafs[rIdx] = requestAnimationFrame(frame);
        } else {
          spinRafs[rIdx] = 0;
          strip.style.transform = `translate3d(0,${endY}px,0)`;
          if (win) {
            win.classList.remove('is-spinning', 'is-suspense');
            win.classList.add('is-locked', 'is-flash');
          }
          if (col) col.classList.add('is-recoil');
          const card = strip.querySelector(`[data-idx="${targetRow}"]`);
          if (card) {
            card.style.setProperty('--rc', rc);
            card.classList.add('is-landed');
          }
          const badge = $('#dhBadge' + rIdx);
          const sub = $('#dhSub' + rIdx);
          if (badge) badge.hidden = true;
          if (sub) {
            sub.textContent = rIdx === 0 ? t('Up next', 'Siguiente') : t('Game ' + (rIdx + 1), 'Juego ' + (rIdx + 1));
            sub.className = rIdx === 0 ? 'dh-slot-sub is-next' : 'dh-slot-sub';
            if (rIdx === 0) sub.style.setProperty('--rc', rc);
            else sub.style.removeProperty('--rc');
          }
          playSpinLock(rIdx);
          if (rIdx === 2) {
            spinAnimating = false;
            hubState.spun = true;
            saveHubState();
            if (reelsBox) spawnWinSparks(reelsBox);
            if (titleEl) titleEl.textContent = hubState.isArchive ? t(`Archive · ${hubState.day}`, `Archivo · ${hubState.day}`) : t("Today's 3 Music Games", '3 Juegos Musicales de Hoy');
            if (ctaBtn) ctaBtn.textContent = t(`Play ${gameLabel(hubState.slots[0].gameId)} →`, `Jugar ${gameLabel(hubState.slots[0].gameId)} →`);
            // Cascading jackpot wave across all 3 columns
            [0, 1, 2].forEach((ci) => {
              const finaleTid = setTimeout(() => {
                const c = $('#dhCol' + ci);
                if (c) c.classList.add('is-finale');
              }, 110 + ci * 95);
              spinTimers.push(finaleTid);
            });
          }
        }
      }
      spinRafs[rIdx] = requestAnimationFrame(frame);
    });
  }

  /* ================= Completed Scorecard (/300 + 15-band D1 Histogram) ================= */
  function renderHubScorecard() {
    const st = hubState;
    if (!st) return;
    const scoreEl = $('#dhTotalScore');
    if (scoreEl) scoreEl.textContent = String(st.totalScore);
    const metaEl = $('#dhScoreMeta');
    const ov = Hub.streakOverview(combinedCompletedDays(), st.day);
    const rem = (bridge && bridge.getRemaining) ? bridge.getRemaining() : '';
    if (metaEl) {
      if (st.isArchive) {
        metaEl.textContent = st.wasLiveDone
          ? t(`Saved Daily · ${st.day}`, `Diario guardado · ${st.day}`)
          : t(`Archive practice · ${st.day}`, `Práctica de archivo · ${st.day}`);
      } else {
        const parts = [];
        if (ov.current > 0) parts.push(t(`${ov.current}-day streak`, `Racha de ${ov.current} días`));
        if (rem) parts.push(t(`Next daily in ${rem}`, `Próximo diario en ${rem}`));
        metaEl.textContent = parts.join(' · ');
      }
    }

    // 3-segment progress bar
    for (let i = 0; i < 3; i++) {
      const bar = $('#dhSeg' + i);
      const r = st.results[i];
      const slot = st.slots[i];
      if (bar) {
        const sc = Math.max(0, Math.min(100, Number(r && r.score) || 0)) / 100;
        bar.style.transform = `scaleX(${sc})`;
        bar.style.setProperty('--rc', gameColor(slot.gameId));
        bar.className = 'dh-seg-fill';
      }
    }

    // Breakdown list (TuneUp .runlist style)
    const list = $('#dhBreakdown');
    if (list) {
      list.innerHTML = st.slots.map((slot, i) => {
        const r = st.results[i] || { score: 0, shortSummary: '' };
        const winCls = r.score >= 60 ? ' win' : '';
        const rc = gameColor(slot.gameId);
        return `<li class="dh-row${winCls}" style="--rc:${rc}">` +
          `<span class="dh-row-ico">${ICONS[slot.gameId] || ''}</span>` +
          `<div class="dh-row-copy">` +
            `<div class="dh-row-head"><b>${esc(gameLabel(slot.gameId))}</b></div>` +
            `<div class="dh-row-sub">${esc(r.detail || r.shortSummary || '')}</div>` +
          `</div>` +
          `<div class="dh-row-score"><b>${r.score}</b><span>/100</span></div>` +
        `</li>`;
      }).join('');
    }

    renderHubScorecardCommunity();
  }

  function renderHubScorecardCommunity() {
    const box = $('#dhCommunity');
    if (!box || !hubState || !hubState.done) return;
    if (hubState.isArchive) {
      box.innerHTML = `<p class="dh-arch-note">${esc(t('Practice archive · does not affect today’s Daily streak or live rankings.', 'Modo práctica de archivo · no afecta tu racha ni el ranking de hoy.'))}</p>`;
      return;
    }
    const sum = Hub.summarizeHistogram(cachedCommunity, hubState.totalScore);
    const headline = sum.plays <= 1
      ? t('First finisher today!', '¡Primer jugador en terminar hoy!')
      : t(`Better than ${sum.beatPct}% of players`, `Mejor que el ${sum.beatPct}% de jugadores`);
    const badge = sum.plays <= 1
      ? t(`Avg ${sum.avgScore}/300`, `Prom. ${sum.avgScore}/300`)
      : t(`Rank #${sum.rank} of ${sum.plays} · Avg ${sum.avgScore}`, `Puesto #${sum.rank} de ${sum.plays} · Prom. ${sum.avgScore}`);

    const barsHtml = sum.bands.map((b) => {
      const h = Math.max(6, Math.round(b.heightPct * 0.52));
      return `<div class="dh-bar-col${b.isUser ? ' is-you' : ''}">` +
        (b.isUser ? `<span class="dh-bar-you">${esc(t('You', 'Tú'))}</span>` : '') +
        `<span class="dh-bar-pct">${b.pct > 0 || b.isUser ? (b.pct + '%') : ''}</span>` +
        `<div class="dh-bar-fill" style="height:${h}px"></div>` +
      `</div>`;
    }).join('');

    box.innerHTML =
      `<div class="dh-comm-head">` +
        `<div class="dh-comm-title"><span class="dh-dot"></span><span>${esc(headline)}</span></div>` +
        `<span class="dh-comm-badge">${esc(badge)}</span>` +
      `</div>` +
      `<div class="dh-histo">${barsHtml}</div>` +
      `<div class="dh-histo-axis"><span>0</span><span>${esc(t("Today's players · 20-pt bands", 'Jugadores de hoy · rangos de 20 pts'))}</span><span>300</span></div>`;
  }

  /* ================= Between-Game Transition Modal (`DAILY · GAME X OF 3`) ================= */
  function finishDailySlot(slotIdx, result) {
    if (!hubState) loadHubState();
    const finSlot = hubState.slots && hubState.slots[slotIdx];
    if (finSlot) {
      delete dailyMiniSessions[finSlot.seed + (hubState.isArchive ? ':arch' : '')];
    }
    hubState.results[slotIdx] = {
      score: Math.max(0, Math.min(100, Math.round(Number(result.score) || 0))),
      won: !!result.won,
      shortSummary: result.shortSummary || '',
      detail: result.detail || result.shortSummary || ''
    };
    saveHubState();

    // If all 3 games done -> go straight to the Final /300 Scorecard!
    if (hubState.done) {
      closeStepModal();
      showDailyHub({ keepDay: true });
      if (hubState.totalScore > 0) {
        playFxWin();
        const scoreHero = $('#dhScorePanel .dh-score-big');
        const scorePanel = $('#dhScorePanel');
        triggerFxClass(scorePanel, 'is-fx-win', 660);
        spawnWinSparks(scoreHero);
      }
      return;
    }

    // Show Native TuneUp Between-Game Transition Modal
    openStepModal(slotIdx, hubState.results[slotIdx]);
  }

  function openStepModal(slotIdx, res) {
    const m = $('#dhStepModal');
    if (!m || !hubState) return;
    const slot = hubState.slots[slotIdx];
    const nextIdx = nextUnfinishedSlotIndex();
    const nextSlot = hubState.slots[nextIdx >= 0 ? nextIdx : 0];

    $('#dhStepKicker').textContent = `${t('DAILY', 'DIARIO')} · ${t(`GAME ${slotIdx + 1} OF 3`, `JUEGO ${slotIdx + 1} DE 3`)}`;
    $('#dhStepVerdict').textContent = res.score >= 80
      ? t('Awesome!', '¡Genial!')
      : (res.score >= 40 ? t('Nice work!', '¡Buen trabajo!') : t('Tough one!', '¡Estuvo difícil!'));
    const ptsEl = $('#dhStepPoints');
    if (ptsEl) {
      ptsEl.textContent = `+${res.score}`;
      ptsEl.className = 'dh-step-pts';
      ptsEl.style.setProperty('--rc', gameColor(slot.gameId));
    }
    $('#dhStepDetail').textContent = res.detail || res.shortSummary || '';
    $('#dhStepTotal').textContent = t(`Total so far: ${hubState.totalScore} / 300`, `Total hasta ahora: ${hubState.totalScore} / 300`);

    // 3-card run strip
    $('#dhStepStrip').innerHTML = hubState.slots.map((s, i) => {
      const r = hubState.results[i];
      const isNext = i === nextIdx;
      const rc = gameColor(s.gameId);
      return `<div class="dh-strip-card${r ? ' is-done' : ''}${isNext ? ' is-next' : ''}" style="--rc:${rc}">` +
        `<span class="dh-strip-ico">${ICONS[s.gameId] || ''}</span>` +
        `<span class="dh-strip-name">${esc(gameLabel(s.gameId))}</span>` +
        `<span class="dh-strip-val">${r ? (r.score + '') : (isNext ? t('NEXT', 'SIGUIENTE') : '—')}</span>` +
      `</div>`;
    }).join('');

    const nextBtn = $('#dhStepNextBtn');
    nextBtn.textContent = t(`Next: ${gameLabel(nextSlot.gameId)} →`, `Siguiente: ${gameLabel(nextSlot.gameId)} →`);
    nextBtn.onclick = () => {
      closeStepModal();
      launchDailySlot(nextIdx);
    };
    $('#dhStepBackBtn').onclick = () => {
      closeStepModal();
      showDailyHub({ keepDay: true });
    };
    m.hidden = false;
    const sheet = m.querySelector('.dh-step-sheet');
    if (sheet) {
      sheet.classList.remove('is-fx-win', 'is-fx-lose');
      if (isAnimOn()) {
        if (res.won || res.score >= 40) {
          sheet.classList.add('is-fx-win');
          spawnWinSparks(sheet);
        } else {
          sheet.classList.add('is-fx-lose');
        }
      }
    }
  }

  function closeStepModal() {
    const m = $('#dhStepModal');
    if (m) {
      m.hidden = true;
      const sheet = m.querySelector('.dh-step-sheet');
      if (sheet) sheet.classList.remove('is-fx-win', 'is-fx-lose');
    }
  }

  /* ================= Launching Games (Daily Slot OR Free Play!) ================= */
  function launchDailySlot(slotIdx) {
    if (!hubState) loadHubState();
    const baseSlot = hubState.slots[slotIdx];
    if (!baseSlot) return;
    const slot = { ...baseSlot, day: hubState.day, isArchive: !!hubState.isArchive };
    activeDailySlot = slot;
    document.body.dataset.diff = 'easy';

    if (slot.gameId === 'song' && bridge && bridge.startDailySongForHub) {
      hideAllScreens();
      bridge.startDailySongForHub(slot, (res) => {
        activeDailySlot = null;
        finishDailySlot(slotIdx, res);
      });
      return;
    }
    if (slot.gameId === 'artist' && bridge && bridge.startDailyArtistForHub) {
      hideAllScreens();
      bridge.startDailyArtistForHub(slot, (res) => {
        activeDailySlot = null;
        finishDailySlot(slotIdx, res);
      });
      return;
    }
    if (slot.gameId === 'duel' && bridge && bridge.startDailyDuelForHub) {
      hideAllScreens();
      bridge.startDailyDuelForHub(slot, (res) => {
        activeDailySlot = null;
        finishDailySlot(slotIdx, res);
      });
      return;
    }
    openMiniGame(slot.gameId, slot);
  }

  const GAME_ROUTES = {
    cover: { slug: 'cover-pixel', titleEn: 'Cover Pixel — TuneUp',       titleEs: 'Cover Pixel — TuneUp' },
    mv:    { slug: 'mv-frame',    titleEn: 'MV Frame — TuneUp',          titleEs: 'MV Frame — TuneUp' },
    hair:  { slug: 'hair-peek',   titleEn: 'Hair Peek — TuneUp',         titleEs: 'Hair Peek — TuneUp' },
    fact:  { slug: 'fact-or-cap', titleEn: 'Music Fact or Cap — TuneUp', titleEs: 'Dato o Mito Musical — TuneUp' },
    lyric: { slug: 'lyric-guess', titleEn: 'Lyric Guess — TuneUp',       titleEs: 'Adivina la Letra — TuneUp' }
  };

  const recentFreeIds = { cover: [], mv: [], hair: [], lyric: [] };
  function pickFreeUnseen(pool, gameId, seed, idFn) {
    if (!pool || !pool.length) return null;
    const recent = recentFreeIds[gameId] || [];
    const fresh = pool.filter((x) => !recent.includes(String(idFn(x))));
    const src = fresh.length ? fresh : pool;
    const picked = Hub.pickDeterministic(src, seed, 1);
    if (picked) {
      const key = String(idFn(picked));
      recent.push(key);
      if (recent.length > Math.min(18, Math.floor(pool.length * 0.6))) recent.shift();
      recentFreeIds[gameId] = recent;
    }
    return picked;
  }

  function normStr(s) {
    if (bridge && bridge.norm) return bridge.norm(s);
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  let albumIndexCache = null;
  function getAlbumIndex() {
    if (albumIndexCache) return albumIndexCache;
    const raw = getData().albumBank || [];
    // [album, artist, artUrl, diff, trackId, anchorTitle, year]
    albumIndexCache = raw.map((r) => ({
      album: r[0],
      artist: r[1],
      art: r[2],
      diff: r[3],
      trackId: r[4],
      anchorTitle: r[5],
      year: r[6],
      nAlbum: normStr(r[0]),
      nArtist: normStr(r[1]),
      hay: normStr(r[0] + ' ' + r[1])
    }));
    return albumIndexCache;
  }

  function searchAlbums(query, limit) {
    const q = normStr(query);
    if (!q) return [];
    const tokens = q.split(' ').filter(Boolean);
    const scored = [];
    const list = getAlbumIndex();
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!tokens.every((tk) => a.hay.includes(tk))) continue;
      let sc = 0;
      if (a.nAlbum === q) sc += 100;
      else if (a.nAlbum.startsWith(q)) sc += 60;
      else if (a.nArtist.startsWith(q)) sc += 40;
      else if (a.nAlbum.includes(q)) sc += 25;
      else sc += 10;
      sc += (4 - (a.diff || 3)) * 2;
      scored.push({ a, sc });
    }
    scored.sort((x, y) => y.sc - x.sc || x.a.album.localeCompare(y.a.album));
    return scored.slice(0, limit || 10).map((x) => x.a);
  }

  function formatMvGenre(g) {
    const map = { pop: 'Pop', rock: 'Rock', hiphop: 'Hip-Hop', rnb: 'R&B', edm: 'Electronic', indie: 'Indie', latin: 'Latin', country: 'Country', kpop: 'K-Pop', metal: 'Metal' };
    const k = String(g || '').toLowerCase();
    return map[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : 'Pop');
  }

  /* ================= Spoiler-Free Mini-Game Friend Challenges (#mg=...) ================= */
  const CHALLENGEABLE_GAMES = new Set(['cover', 'mv', 'hair', 'lyric']);
  function fnvHex(str) {
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }
  function b64UrlEnc(str) {
    if (typeof btoa === 'function') {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64UrlDec(tok) {
    const pad = tok.replace(/-/g, '+').replace(/_/g, '/');
    const full = pad + '='.repeat((4 - (pad.length % 4)) % 4);
    if (typeof atob === 'function') return atob(full);
    return Buffer.from(full, 'base64').toString('utf8');
  }
  function encodeMiniChallenge({ gameId, index, key, won, tries }) {
    if (!CHALLENGEABLE_GAMES.has(gameId) || !Number.isInteger(index) || index < 0) return '';
    const payload = {
      v: 1,
      g: gameId,
      x: index,
      h: fnvHex(key),
      w: won ? 1 : 0,
      t: Math.max(1, Math.min(5, Number(tries) || 5))
    };
    try { return b64UrlEnc(JSON.stringify(payload)); } catch { return ''; }
  }
  function parseMiniChallenge(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const tok = raw.startsWith('#mg=') ? raw.slice(4) : raw.startsWith('mg=') ? raw.slice(3) : raw;
    if (!tok || tok.length > 200 || !/^[A-Za-z0-9_-]+$/.test(tok)) return null;
    try {
      const obj = JSON.parse(b64UrlDec(tok));
      if (!obj || obj.v !== 1 || !CHALLENGEABLE_GAMES.has(obj.g)) return null;
      if (!Number.isInteger(obj.x) || obj.x < 0) return null;
      if (typeof obj.h !== 'string' || !/^[0-9a-f]{8}$/.test(obj.h)) return null;
      if (obj.w !== 0 && obj.w !== 1) return null;
      if (!Number.isInteger(obj.t) || obj.t < 1 || obj.t > 5) return null;
      return { gameId: obj.g, index: obj.x, hash: obj.h, won: obj.w === 1, tries: obj.t };
    } catch { return null; }
  }
  function resolveMiniChallengeTarget(ch) {
    if (!ch || !CHALLENGEABLE_GAMES.has(ch.gameId)) return null;
    let list = null, keyOf = null;
    const d = getData();
    if (ch.gameId === 'cover') { list = getAlbumIndex(); keyOf = (a) => a.nAlbum + '|' + a.nArtist; }
    else if (ch.gameId === 'mv') { list = d.mvBank || []; keyOf = (r) => r[2]; }
    else if (ch.gameId === 'hair') { list = d.hairBank || []; keyOf = (p) => p[0]; }
    else if (ch.gameId === 'lyric') { list = d.lyricBank || []; keyOf = (r) => String(r[0]); }
    if (!list || !list.length) return null;
    if (ch.index < list.length && fnvHex(keyOf(list[ch.index])) === ch.hash) {
      return { item: list[ch.index], index: ch.index };
    }
    for (let i = 0; i < list.length; i++) {
      if (fnvHex(keyOf(list[i])) === ch.hash) return { item: list[i], index: i };
    }
    return null;
  }
  function compareMiniChallenge(ch, myWon, myTries) {
    if (!ch) return null;
    if (myWon && !ch.won) {
      return { cls: 'is-win', text: t(`You beat your friend! (${myTries}/5 vs Miss)`, `¡Venciste a tu amigo! (${myTries}/5 vs Fallo)`) };
    }
    if (!myWon && ch.won) {
      return { cls: 'is-lose', text: t(`Friend won (${ch.tries}/5 vs Miss)`, `Tu amigo ganó (${ch.tries}/5 vs Fallo)`) };
    }
    if (!myWon && !ch.won) {
      return { cls: 'is-tie', text: t('Both stumped — tough one!', '¡Ninguno acertó — estuvo difícil!') };
    }
    if (myTries < ch.tries) {
      return { cls: 'is-win', text: t(`You beat your friend! (${myTries}/5 vs ${ch.tries}/5)`, `¡Venciste a tu amigo! (${myTries}/5 vs ${ch.tries}/5)`) };
    }
    if (myTries > ch.tries) {
      return { cls: 'is-lose', text: t(`Friend edged you out (${ch.tries}/5 vs ${myTries}/5)`, `Tu amigo fue más rápido (${ch.tries}/5 vs ${myTries}/5)`) };
    }
    return { cls: 'is-tie', text: t(`Tied with your friend! (${myTries}/5)`, `¡Empate con tu amigo! (${myTries}/5)`) };
  }
  function openMiniChallenge(rawHash) {
    const ch = parseMiniChallenge(rawHash);
    if (!ch) return false;
    if (!window.TUNEUP_DAILY_HUB_DATA && bridge && bridge.ensureHubDataReady) {
      bridge.ensureHubDataReady().then(() => openMiniChallenge(rawHash));
      return true;
    }
    const resolved = resolveMiniChallengeTarget(ch);
    if (!resolved) {
      if (bridge && bridge.toast) bridge.toast(t('Challenge link is no longer valid.', 'El enlace del reto ya no es válido.'));
      return false;
    }
    activeDailySlot = null;
    document.body.dataset.diff = 'easy';
    openMiniGame(ch.gameId, null, { skipRoute: true, challenge: { ...ch, item: resolved.item, resolvedIndex: resolved.index } });
    return true;
  }

  function renderMiniStreakPill(gameId, dailySlot, bump) {
    const pill = $('#mgStreakPill');
    if (!pill) return;
    if (dailySlot || !gameId || gameId === 'fact') {
      pill.hidden = true;
      return;
    }
    const raw = LS.get(MG_STATS_KEY, {}) || {};
    const g = (raw && raw.games && raw.games[gameId]) || {};
    const streak = Number(g.streak) || 0;
    const best = Number(g.best) || 0;
    const flameSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.3 2.7c.4 3.4-1.6 5.2-3 6.9-1.4 1.7-2.3 3.2-2.3 5.2a5 5 0 0 0 10 0c0-2.7-1.6-4.7-2.6-6.2-.5 1.3-1.4 2.1-2.5 2.4.7-2.2 1.3-4.6.4-8.3Z" fill="currentColor"/></svg>';
    pill.style.setProperty('--rc', gameColor(gameId));
    pill.classList.toggle('is-hot', streak > 0);
    pill.innerHTML = `${flameSvg}<b>${streak}</b><span>· ${esc(t('Best', 'Récord'))} ${best}</span>`;
    pill.hidden = false;
    if (bump === 'win') {
      triggerFxClass(pill, 'is-bump', 420);
      popFloatBadge(pill, '+1', 'win');
    }
  }

  function renderMiniChallengeBar(challenge) {
    const bar = $('#mgChallengeBar');
    if (!bar) return;
    if (!challenge) {
      bar.hidden = true;
      bar.innerHTML = '';
      return;
    }
    const msg = challenge.won
      ? t(`Friend challenge · Beat ${challenge.tries}/5!`, `Reto de amigo · ¡Supera ${challenge.tries}/5!`)
      : t('Friend challenge · Stumped your friend — can you get it?', 'Reto de amigo · No pudo acertar — ¿tú puedes?');
    bar.innerHTML = `${ICONS.duel}<span>${esc(msg)}</span>`;
    bar.hidden = false;
  }

  function startFreeMiniGame(gameId, opts) {
    const normalizedId = gameId === 'color' ? 'mv' : gameId;
    activeDailySlot = null;
    document.body.dataset.diff = 'easy';
    openMiniGame(normalizedId, null, opts);
  }

  /* ================= Unified Mini-Game Stage (`#miniGame`) ================= */
  let mgState = null; // current active mini-game runtime state
  // Park unfinished free-play and Daily Hub rounds in memory (matching Classic RUNS): switching modes/tabs
  // or returning via Change mode / Back to Daily resumes the exact same puzzle & progress.
  const freeMiniSessions = Object.create(null);
  const dailyMiniSessions = Object.create(null);
  const dailySlotKey = (slot) => (slot ? (slot.seed + (slot.isArchive ? ':arch' : '')) : '');
  function clearFreeSessions() {
    for (const k in freeMiniSessions) delete freeMiniSessions[k];
    for (const k in dailyMiniSessions) delete dailyMiniSessions[k];
  }

  function renderDailyPillInMiniGame(slot) {
    const pill = $('#mgDailyPill');
    if (!pill) return;
    if (!slot || !hubState) {
      pill.hidden = true;
      return;
    }
    const segs = hubState.slots.map((s, i) => {
      const done = !!hubState.results[i];
      const cur = i === slot.slot;
      const rc = gameColor(s.gameId);
      return `<span class="mg-dp-seg${done ? ' is-done' : ''}${cur ? ' is-cur' : ''}"${cur ? ` style="--rc:${rc}"` : ''}></span>`;
    }).join('');
    const curRc = gameColor(slot.gameId);
    pill.innerHTML = `<span class="mg-dp-tag">${esc(t('DAILY', 'DIARIO'))}</span>${segs}<span class="mg-dp-step" style="--rc:${curRc}">${esc(`Game ${slot.slot + 1}/3`)}</span>`;
    pill.hidden = false;
  }

  const SWITCHER_IDS = ['cover', 'mv', 'hair', 'fact', 'lyric'];
  function renderMiniSwitcher(activeId, dailySlot) {
    const nav = $('#mgSwitcher');
    if (!nav) return;
    if (dailySlot) {
      nav.hidden = true;
      return;
    }
    nav.innerHTML = SWITCHER_IDS.map((gid) => {
      const act = gid === activeId;
      return `<button type="button" class="mg-sw-pill${act ? ' is-active' : ''}" data-sw="${gid}" style="--rc:${gameColor(gid)}"${act ? ' aria-current="page"' : ''}>` +
        `${ICONS[gid] || ''}<span>${esc(gameLabel(gid))}</span>` +
      `</button>`;
    }).join('');
    nav.hidden = false;
    nav.onclick = (e) => {
      const b = e.target.closest('button[data-sw]');
      if (!b) return;
      const gid = b.dataset.sw;
      if (!gid || gid === activeId) return;
      if (typeof location !== 'undefined' && location.hash.startsWith('#mg=') && typeof history !== 'undefined' && history.replaceState) {
        const r = GAME_ROUTES[gid];
        history.replaceState(null, '', r ? ('/' + r.slug) : location.pathname);
      }
      startFreeMiniGame(gid, { replace: true });
    };
  }

  function openMiniGame(rawGameId, dailySlot, opts) {
    const gameId = rawGameId === 'color' ? 'mv' : rawGameId;
    if (!window.TUNEUP_DAILY_HUB_DATA && bridge && bridge.ensureHubDataReady) {
      bridge.ensureHubDataReady().then(() => openMiniGame(rawGameId, dailySlot, opts));
      return;
    }
    if (gameId !== 'fact' && bridge && bridge.isCatalogReady && !bridge.isCatalogReady() && bridge.ensureSongsReady) {
      bridge.ensureSongsReady();
    }
    const challenge = (!dailySlot && opts && opts.challenge) ? opts.challenge : null;
    if (bridge && bridge.stopAudio) bridge.stopAudio();
    if (bridge && bridge.undockMiniVolume) bridge.undockMiniVolume();
    hideAllScreens();
    const sec = $('#miniGame');
    if (sec) sec.hidden = false;

    const arena = $('#mgArena');
    if (arena) arena.dataset.layout = 'centered';

    const backLbl = $('#mgBackLbl');
    if (backLbl) backLbl.textContent = dailySlot ? t('Back to Daily', 'Volver al Diario') : t('Change mode', 'Cambiar modo');
    $('#mgBack').onclick = () => {
      if (bridge && bridge.stopAudio) bridge.stopAudio();
      if (typeof location !== 'undefined' && location.hash.startsWith('#mg=') && typeof history !== 'undefined' && history.replaceState) {
        history.replaceState(null, '', '/');
      }
      if (dailySlot) showDailyHub({ keepDay: true });
      else if (bridge && bridge.showLobby) bridge.showLobby();
    };

    renderDailyPillInMiniGame(dailySlot);
    renderMiniStreakPill(gameId, dailySlot, null);
    renderMiniSwitcher(gameId, dailySlot);
    renderMiniChallengeBar(challenge);
    const icoEl = $('#mgTitleIco');
    if (icoEl) icoEl.innerHTML = ICONS[gameId] || '';
    const titleEl = $('#mgGameTitle');
    if (titleEl) titleEl.textContent = gameLabel(gameId);
    const rightEl = $('#mgHeadRight');
    if (rightEl) rightEl.innerHTML = '';

    if (bridge && bridge.syncRoute) {
      if (dailySlot) {
        bridge.syncRoute('daily', t('Daily Challenge — TuneUp', 'Desafío Diario — TuneUp'), true);
      } else if (!opts || !opts.skipRoute) {
        const r = GAME_ROUTES[gameId];
        if (r) bridge.syncRoute(r.slug, isEs() ? r.titleEs : r.titleEn, !!(opts && opts.replace));
      }
    }

    const isDaily = !!dailySlot;
    if (!isDaily && !challenge && opts && opts.forceNew) {
      delete freeMiniSessions[gameId];
    }
    const dKey = isDaily ? dailySlotKey(dailySlot) : '';
    const saved = isDaily
      ? (dailyMiniSessions[dKey] && !dailyMiniSessions[dKey].done ? dailyMiniSessions[dKey] : null)
      : ((!challenge && freeMiniSessions[gameId] && !freeMiniSessions[gameId].done) ? freeMiniSessions[gameId] : null);
    const seed = isDaily ? dailySlot.seed : ('free:' + gameId + ':' + Date.now() + ':' + Math.random());

    if (gameId === 'cover') initCoverPixel(seed, dailySlot, challenge, saved);
    else if (gameId === 'mv') initMvFrame(seed, dailySlot, challenge, saved);
    else if (gameId === 'hair') initHairPeek(seed, dailySlot, challenge, saved);
    else if (gameId === 'fact') initFactOrCap(seed, dailySlot, saved);
    else if (gameId === 'lyric') initLyricGuess(seed, dailySlot, challenge, saved);

    scrollTopReset();
  }

  /* ---------- Helper: Shared Autocomplete Search Bar (with keyboard nav & anti-duplicate) ---------- */
  function bindMiniSearch({ placeholder, mode, onPick, onSkip, skipLabel, isTried }) {
    const host = $('#mgControls');
    if (!host) return;
    host.innerHTML =
      `<div class="mg-search-row">` +
        `<div class="mg-field">` +
          `<input id="mgInput" type="text" placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="mgDD">` +
          `<button id="mgClear" class="clear" type="button" aria-label="Clear" hidden>&times;</button>` +
          `<ul id="mgDD" class="dd mg-dd" role="listbox" hidden></ul>` +
        `</div>` +
        `<button id="mgSkipBtn" class="btn ghostbtn mg-skip-btn" type="button">${esc(skipLabel)}</button>` +
      `</div>`;

    const input = $('#mgInput');
    const clearBtn = $('#mgClear');
    const skipBtn = $('#mgSkipBtn');
    const dd = $('#mgDD');
    let lastItems = [];
    let selIdx = -1;

    function closeDD() {
      dd.hidden = true;
      dd.innerHTML = '';
      lastItems = [];
      selIdx = -1;
      input.setAttribute('aria-expanded', 'false');
    }
    function syncSel() {
      dd.querySelectorAll('button[data-i]').forEach((b) => {
        b.classList.toggle('sel', Number(b.dataset.i) === selIdx);
      });
      const active = dd.querySelector('button.sel');
      if (active && typeof active.scrollIntoView === 'function') active.scrollIntoView({ block: 'nearest' });
    }
    function pickIndex(idx) {
      const item = lastItems[idx];
      if (!item || item.tried) return;
      input.value = '';
      clearBtn.hidden = true;
      closeDD();
      onPick(item.raw);
    }
    function renderDD(items) {
      lastItems = items.map((it) => ({ ...it, tried: Boolean(isTried && isTried(it.raw)) }));
      selIdx = lastItems.findIndex((it) => !it.tried);
      if (!lastItems.length) { closeDD(); return; }
      const triedTxt = t('Tried', 'Probado');
      dd.innerHTML = lastItems.map((it, idx) =>
        `<li><button type="button" data-i="${idx}" class="${idx === selIdx ? 'sel' : ''}${it.tried ? ' is-tried' : ''}" ${it.tried ? 'disabled' : ''}>` +
          `<div class="mg-dd-copy"><b>${esc(it.primary)}</b>${it.secondary ? `<span>${esc(it.secondary)}</span>` : ''}</div>` +
          (it.tried ? `<span class="dd-badge">${esc(triedTxt)}</span>` : '') +
        `</button></li>`
      ).join('');
      dd.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    input.oninput = () => {
      const q = input.value.trim();
      clearBtn.hidden = !q;
      if (q.length < 1) { closeDD(); return; }
      if ((mode === 'song' || mode === 'artist') && bridge && bridge.isCatalogReady && !bridge.isCatalogReady() && bridge.ensureSongsReady) {
        bridge.ensureSongsReady().then(() => {
          if (input.value.trim()) input.oninput();
        });
        return;
      }
      if (mode === 'song' && bridge && bridge.searchSongs) {
        const res = bridge.searchSongs(q, 10);
        renderDD(res.map((s) => ({ primary: s.title, secondary: s.artist, raw: s })));
      } else if (mode === 'album') {
        const res = searchAlbums(q, 10);
        renderDD(res.map((a) => ({ primary: a.album, secondary: `${a.artist} · ${a.year}`, raw: a })));
      } else if (mode === 'artist' && bridge && bridge.searchArtists) {
        const res = bridge.searchArtists(q, 10);
        renderDD(res.map((a) => ({ primary: a.name, secondary: a.genre || '', raw: a })));
      }
    };
    input.onkeydown = (e) => {
      if (dd.hidden || !lastItems.length) return;
      if (e.key === 'Escape') { e.preventDefault(); closeDD(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        for (let step = 0; step < lastItems.length; step++) {
          const next = (selIdx + dir * (step + 1) + lastItems.length) % lastItems.length;
          if (!lastItems[next].tried) { selIdx = next; syncSel(); break; }
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selIdx >= 0 && lastItems[selIdx] && !lastItems[selIdx].tried) pickIndex(selIdx);
      }
    };
    clearBtn.onclick = () => { input.value = ''; clearBtn.hidden = true; closeDD(); input.focus(); };
    dd.onclick = (e) => {
      const btn = e.target.closest('button[data-i]');
      if (!btn || btn.disabled) return;
      pickIndex(Number(btn.dataset.i));
    };
    skipBtn.onclick = () => {
      closeDD();
      onSkip();
    };
  }

  /* Compact 5-pip progress indicator in header (zero chips or empty 1..5 boxes!) */
  function renderAttemptPips(guesses, maxTries, done, pulseIdx) {
    const rightEl = $('#mgHeadRight');
    if (!rightEl) return;
    if (!maxTries) {
      rightEl.innerHTML = '';
      return;
    }
    const pips = [];
    for (let i = 0; i < maxTries; i++) {
      const g = guesses[i];
      let cls = 'mg-pip';
      if (g) cls += ' is-' + g.kind;
      else if (!done && i === guesses.length) cls += ' is-now';
      if (pulseIdx === i) cls += ' is-pulse';
      pips.push(`<span class="${cls}"></span>`);
    }
    rightEl.innerHTML = `<div class="mg-pips" aria-label="${esc(t('Attempts', 'Intentos'))}">${pips.join('')}</div>`;
  }

  function renderMiniReveal({ won, score, title, subtitle, art, trackId, ytId, lyricStart, dailySlot, gameId, shortSummary, detail, freeKicker }) {
    const isArchDaily = Boolean(dailySlot && dailySlot.isArchive);
    if (!isArchDaily && gameId && (gameId === 'cover' || gameId === 'mv' || gameId === 'hair' || gameId === 'fact' || gameId === 'lyric')) {
      recordMgStat((s) => {
        if (!s.games || typeof s.games !== 'object') s.games = {};
        const g = s.games[gameId] || { played: 0, won: 0, streak: 0, best: 0 };
        g.played = (Number(g.played) || 0) + 1;
        if (won) {
          g.won = (Number(g.won) || 0) + 1;
        }
        // Only Free-Play affects the live Free-Play streak pill & personal streak record
        if (!dailySlot) {
          if (won) {
            g.streak = (Number(g.streak) || 0) + 1;
            if (g.streak > (Number(g.best) || 0)) g.best = g.streak;
          } else {
            g.streak = 0;
          }
        }
        s.games[gameId] = g;
      });
      renderMiniStreakPill(gameId, dailySlot, won ? 'win' : 'lose');
    }
    const controls = $('#mgControls');
    if (!controls) return;
    if (bridge && bridge.undockMiniVolume) bridge.undockMiniVolume();
    const replaySvg = '<svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 1 2.4 5.7M4 12V7m0 5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const nextSvg = '<svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const shareSvg = '<svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.6" fill="currentColor"/><circle cx="6" cy="12" r="2.6" fill="currentColor"/><circle cx="18" cy="19" r="2.6" fill="currentColor"/><path d="M15.6 6.3 8.4 10.7M8.4 13.3l7.2 4.4" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>';

    const st = mgState;
    if (dailySlot && st) {
      delete dailyMiniSessions[dailySlotKey(dailySlot)];
    } else if (!dailySlot && gameId && st && !st.challenge && freeMiniSessions[gameId] === st) {
      delete freeMiniSessions[gameId];
    }
    const canChallenge = !dailySlot && CHALLENGEABLE_GAMES.has(gameId) && st && Number.isInteger(st.challengeIndex) && st.challengeIndex >= 0 && st.challengeKey;
    const verdict = (!dailySlot && st && st.challenge) ? compareMiniChallenge(st.challenge, won, st.tries || 5) : null;
    const verdictHtml = verdict ? `<div class="mg-ch-verdict ${verdict.cls}">${esc(verdict.text)}</div>` : '';

    const actionHtml = dailySlot
      ? `<button id="mgContinueDaily" class="btn solid icon-btn" type="button"><span class="lbl">${esc(t('Continue Daily', 'Continuar Diario'))}</span>${nextSvg}</button>`
      : canChallenge
      ? `<button id="mgChallengeBtn" class="btn ghostbtn icon-btn share-btn" type="button">${shareSvg}<span class="lbl">${esc(t('Challenge friend', 'Retar amigo'))}</span></button>` +
        `<button id="mgPlayAgain" class="btn solid icon-btn" type="button">${replaySvg}<span class="lbl">${esc(t('Next round', 'Siguiente ronda'))}</span></button>`
      : `<button id="mgPlayAgain" class="btn solid icon-btn" type="button">${replaySvg}<span class="lbl">${esc(t('Next round', 'Siguiente ronda'))}</span></button>`;

    const kickerTxt = dailySlot
      ? `${won ? t('Solved!', '¡Acertaste!') : t('Revealed', 'Revelado')} · ${score}/100`
      : (freeKicker || (won ? t('Solved!', '¡Acertaste!') : t('Out of tries', 'Sin intentos')));

    const playable = Boolean((trackId || ytId) && art);
    const portraitCls = gameId === 'hair' ? ' is-portrait' : '';
    const artHtml = art
      ? `<img id="mgRevArt" class="mg-rev-art${portraitCls}${playable ? ' is-playable' : ''}" src="${esc(art)}" alt="${esc(title)}"${playable ? ` role="button" tabindex="0" data-playing="0" title="${esc(t('Tap to pause or resume preview', 'Toca para pausar o reanudar la vista previa'))}"` : ''}${gameId === 'hair' ? ' referrerpolicy="no-referrer"' : ''}>`
      : '';
    const volHtml = (trackId || ytId) ? '<div class="vol-slot mg-vol-slot" id="mgVolSlot"></div>' : '';
    const startSec = Math.max(0, Math.floor(Number(lyricStart) || 0));
    const ytUrl = ytId ? `https://www.youtube.com/watch?v=${encodeURIComponent(ytId)}${startSec > 0 ? `&t=${startSec}s` : ''}` : '';
    const useYt = Boolean(gameId === 'lyric' && ytId && bridge && bridge.playLyricAudio);
    const ytWrapHtml = useYt
      ? `<div class="mg-yt-wrap" id="mgYtWrap">` +
          `<div class="mg-yt-bar">` +
            `<div class="mg-yt-bar-acts">` +
              `<button type="button" class="mg-yt-restart" id="mgYtRestart">↺ ${esc(t('Restart', 'Reiniciar'))}</button>` +
              `<a id="mgYtLink" class="mg-yt-ext-link" href="${ytUrl}" target="_blank" rel="noopener noreferrer">YouTube ↗</a>` +
            `</div>` +
          `</div>` +
          `<div class="mg-yt-frame" id="mgYtHost"></div>` +
        `</div>`
      : '';

    controls.innerHTML =
      `<div class="mg-reveal-card${won ? ' is-win' : ' is-lose'}">` +
        verdictHtml +
        `<div class="mg-rev-top">` +
          artHtml +
          `<div class="mg-rev-copy">` +
            `<span class="mg-rev-kicker">${esc(kickerTxt)}</span>` +
            `<div class="mg-rev-title">${esc(title)}</div>` +
            `<div class="mg-rev-sub">${esc(subtitle)}</div>` +
          `</div>` +
          volHtml +
        `</div>` +
        ytWrapHtml +
        `<div class="mg-rev-actions${canChallenge ? ' is-pair' : ''}">${actionHtml}</div>` +
      `</div>`;

    const revCard = controls.querySelector('.mg-reveal-card');
    const stageCard = $('.mg-stage-card');
    if (won) {
      playFxWin();
      triggerFxClass(revCard, 'is-fx-win', 650);
      triggerFxClass(stageCard, 'is-fx-win', 650);
      spawnWinSparks(revCard);
    } else {
      playFxWrong();
      triggerFxClass(revCard, 'is-fx-lose', 540);
      triggerFxClass(stageCard, 'is-fx-lose', 540);
    }

    const artEl = $('#mgRevArt');
    if (artEl) {
      const safeSvg = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#081a11"/><circle cx="60" cy="60" r="38" fill="none" stroke="rgba(37,224,125,.3)" stroke-width="2"/><circle cx="60" cy="60" r="11" fill="#102b1e" stroke="#25e07d" stroke-width="2"/></svg>'
      );
      artEl.onerror = () => {
        const cur = artEl.getAttribute('src') || '';
        if (!artEl.dataset.fb && /600x600/.test(cur)) {
          artEl.dataset.fb = '1';
          artEl.src = cur.replace('600x600', '300x300');
          return;
        }
        artEl.onerror = null;
        artEl.src = safeSvg;
      };
    }
    const ytLink = $('#mgYtLink');
    if (ytLink && bridge && bridge.stopAudio) {
      ytLink.onclick = () => bridge.stopAudio();
    }
    const bindPreviewArt = (autoPlay) => {
      if (trackId && artEl && bridge && bridge.playTrackPreview) {
        const toggle = () => bridge.playTrackPreview(trackId, artEl, { auto: false });
        artEl.onclick = toggle;
        artEl.onkeydown = (e) => {
          if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); toggle(); }
        };
        if (autoPlay) bridge.playTrackPreview(trackId, artEl, { auto: true });
      }
    };
    if ((trackId || ytId) && bridge) {
      if (bridge.dockMiniVolume) bridge.dockMiniVolume();
      const ytWrap = $('#mgYtWrap');
      const ytHost = $('#mgYtHost');
      const ytRestart = $('#mgYtRestart');
      if (useYt && ytWrap && ytHost) {
        const handleYtFallback = () => {
          ytWrap.hidden = true;
          bindPreviewArt(true);
        };
        if (artEl) {
          const toggleYt = () => bridge.playLyricAudio({ trackId, ytId, startSec, hostEl: ytHost, artEl, auto: false, toggle: true, onFallback: handleYtFallback });
          artEl.onclick = toggleYt;
          artEl.onkeydown = (e) => {
            if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); toggleYt(); }
          };
        }
        if (ytRestart) {
          ytRestart.onclick = () => bridge.playLyricAudio({ trackId, ytId, startSec, hostEl: ytHost, artEl, auto: false, restart: true, onFallback: handleYtFallback });
        }
        bridge.playLyricAudio({ trackId, ytId, startSec, hostEl: ytHost, artEl, auto: true, onFallback: handleYtFallback });
      } else {
        bindPreviewArt(true);
      }
    }
    const contBtn = $('#mgContinueDaily');
    if (contBtn && dailySlot) {
      contBtn.onclick = () => {
        if (bridge && bridge.stopAudio) bridge.stopAudio();
        if (bridge && bridge.undockMiniVolume) bridge.undockMiniVolume();
        finishDailySlot(dailySlot.slot, { score, won, shortSummary, detail });
      };
    }
    const chBtn = $('#mgChallengeBtn');
    if (chBtn && canChallenge) {
      chBtn.onclick = () => {
        const tok = encodeMiniChallenge({ gameId, index: st.challengeIndex, key: st.challengeKey, won, tries: st.tries || 5 });
        if (!tok) return;
        const r = GAME_ROUTES[gameId];
        const url = `${location.origin}/${r ? r.slug : ''}#mg=${tok}`;
        const gName = gameLabel(gameId);
        const triesN = st.tries || 5;
        const msg = won
          ? (isEs() ? `¿Puedes superar mi ${triesN}/5 en TuneUp ${gName}?\n${url}` : `Can you beat my ${triesN}/5 in TuneUp ${gName}?\n${url}`)
          : (isEs() ? `Este TuneUp ${gName} me ganó — ¿puedes adivinarlo?\n${url}` : `This TuneUp ${gName} stumped me — can you get it?\n${url}`);
        if (bridge && bridge.copyText) bridge.copyText(msg, 'mini_challenge_copy', t('Challenge link copied!', '¡Enlace de reto copiado!'));
      };
    }
    const againBtn = $('#mgPlayAgain');
    if (againBtn) {
      againBtn.onclick = () => {
        if (bridge && bridge.stopAudio) bridge.stopAudio();
        if (bridge && bridge.undockMiniVolume) bridge.undockMiniVolume();
        if (typeof location !== 'undefined' && location.hash.startsWith('#mg=') && typeof history !== 'undefined' && history.replaceState) {
          const r = GAME_ROUTES[gameId];
          history.replaceState(null, '', r ? ('/' + r.slug) : location.pathname);
        }
        startFreeMiniGame(gameId, { replace: true, forceNew: true });
      };
    }
  }

  /* ================= GAME 1: COVER PIXEL (GUESS THE ALBUM NAME) ================= */
  const PIXEL_GRIDS = [6, 10, 16, 28, 46];
  function initCoverPixel(seed, dailySlot, challenge, saved) {
    let st = saved && saved.gameId === 'cover' ? saved : null;
    if (!st) {
      const allAlbums = getAlbumIndex();
      const maxDiff = dailySlot ? dailySlot.diffTier : 2;
      const pool = allAlbums.filter((a) => a.art && a.diff <= maxDiff);
      const srcPool = pool.length ? pool : allAlbums;
      const target = (challenge && challenge.item)
        ? challenge.item
        : dailySlot
        ? Hub.pickDeterministic(srcPool, seed, 1)
        : pickFreeUnseen(srcPool, 'cover', seed, (a) => a.nAlbum + '|' + a.nArtist);
      if (!target) return;
      const challengeKey = target.nAlbum + '|' + target.nArtist;
      const challengeIndex = (challenge && Number.isInteger(challenge.resolvedIndex))
        ? challenge.resolvedIndex
        : allAlbums.indexOf(target);
      st = { gameId: 'cover', target, challenge, challengeKey, challengeIndex, tries: 0, maxTries: 5, guesses: [], tried: new Set(), done: false, imgEl: null };
      if (dailySlot) dailyMiniSessions[dailySlotKey(dailySlot)] = st;
      else if (!challenge) freeMiniSessions.cover = st;
    }
    mgState = st;
    const target = st.target;
    const initGrid = PIXEL_GRIDS[Math.min(PIXEL_GRIDS.length - 1, st.tries)];
    $('#mgSubtitle').textContent = t('Guess the album from its pixelated cover', 'Adivina el álbum por su portada pixelada');
    $('#mgBody').innerHTML =
      `<div class="mg-cover-stage">` +
        `<div class="mg-cover-disc" aria-hidden="true"></div>` +
        `<div class="mg-cover-wrap">` +
          `<canvas id="mgPixelCanvas" width="210" height="210" class="mg-pixel-canvas"></canvas>` +
          `<img id="mgPixelFallback" class="mg-pixel-fallback" alt="" hidden>` +
          `<span id="mgPixelTag" class="mg-stage-tag">${initGrid}×${initGrid} px</span>` +
        `</div>` +
      `</div>`;
    renderAttemptPips(st.guesses, st.maxTries, false, -1);

    if (st.imgEl && st.imgEl.complete && st.imgEl.naturalWidth > 0) {
      drawCoverPixel(false);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        st.imgEl = img;
        if (mgState === st) drawCoverPixel(false);
      };
      img.onerror = () => {
        if (mgState !== st) return;
        const fb = $('#mgPixelFallback');
        const cv = $('#mgPixelCanvas');
        if (fb && cv) {
          cv.hidden = true; fb.hidden = false;
          fb.src = target.art;
          drawCoverPixel(false);
        }
      };
      img.src = target.art;
    }

    bindMiniSearch({
      placeholder: t('Type album name or artist…', 'Escribe el nombre del álbum o artista…'),
      mode: 'album',
      skipLabel: t('Sharpen', 'Enfocar'),
      isTried: (a) => mgState && mgState.tried.has(a.nAlbum + '|' + a.nArtist),
      onPick: (album) => submitCoverGuess(album, dailySlot),
      onSkip: () => skipCoverGuess(dailySlot)
    });
  }

  function drawCoverPixel(revealHd) {
    const st = mgState;
    if (!st || st.gameId !== 'cover') return;
    const cv = $('#mgPixelCanvas');
    const fb = $('#mgPixelFallback');
    const tag = $('#mgPixelTag');
    const idx = Math.min(PIXEL_GRIDS.length - 1, st.tries);
    const grid = PIXEL_GRIDS[idx];

    if (st.imgEl && cv && !cv.hidden) {
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (revealHd) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(st.imgEl, 0, 0, cv.width, cv.height);
      } else {
        const off = document.createElement('canvas');
        off.width = grid; off.height = grid;
        off.getContext('2d').drawImage(st.imgEl, 0, 0, grid, grid);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, cv.width, cv.height);
      }
    } else if (fb && !fb.hidden) {
      const blurs = [22, 15, 9, 4, 2];
      fb.style.filter = revealHd ? 'none' : `blur(${blurs[idx]}px)`;
    }
    if (tag) tag.textContent = revealHd ? 'HD' : `${grid}×${grid} px`;
  }

  function submitCoverGuess(pick, dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    const key = pick.nAlbum + '|' + pick.nArtist;
    if (st.tried.has(key)) {
      if (bridge && bridge.toast) bridge.toast(t('Already tried that album.', 'Ya probaste ese álbum.'));
      return;
    }
    st.tried.add(key);

    const tgt = st.target;
    const sameArt = pick.nArtist === tgt.nArtist;
    const sameAlbum = (pick.nAlbum === tgt.nAlbum && sameArt) || (pick.art && tgt.art && pick.art === tgt.art && sameArt);

    st.tries++;
    const idx = st.tries - 1;
    const subTxt = tgt.anchorTitle ? `${tgt.artist} · ${tgt.year} · ${tgt.anchorTitle}` : `${tgt.artist} · ${tgt.year}`;
    if (sameAlbum) {
      st.done = true;
      st.guesses.push({ kind: 'right' });
      renderAttemptPips(st.guesses, 5, true, idx);
      drawCoverPixel(true);
      const score = Hub.scoreTries(true, st.tries, 5);
      const sum = t(`Solved in ${st.tries}/5`, `Acertado en ${st.tries}/5`);
      if (st.tries === 1 && !(dailySlot && dailySlot.isArchive)) {
        recordMgStat((s) => { s.cover1 = (s.cover1 || 0) + 1; });
        awardMiniBadges(['cover1']);
      }
      renderMiniReveal({ won: true, score, title: tgt.album, subtitle: subTxt, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'cover', shortSummary: sum, detail: `${sum} · ${tgt.album}`, freeKicker: sum });
      return;
    }
    st.guesses.push({ kind: sameArt ? 'near' : 'wrong' });
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderAttemptPips(st.guesses, 5, true, idx);
      drawCoverPixel(true);
      const sum = t('Missed', 'Fallaste');
      renderMiniReveal({ won: false, score: 0, title: tgt.album, subtitle: subTxt, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'cover', shortSummary: sum, detail: `${sum} · ${tgt.album}`, freeKicker: t('Out of tries', 'Sin intentos') });
    } else {
      renderAttemptPips(st.guesses, 5, false, idx);
      drawCoverPixel(false);
      if (sameArt) {
        playFxNear();
        triggerFxClass($('#mgInput'), 'is-fx-near', 520);
        if (bridge && bridge.toast) bridge.toast(t('Right artist, wrong album!', '¡Artista correcto, álbum incorrecto!'));
      } else {
        playFxWrong();
        triggerFxClass($('.mg-search-row'), 'is-fx-wrong', 420);
        triggerFxClass($('.mg-cover-stage'), 'is-fx-wrong', 420);
      }
    }
  }

  function skipCoverGuess(dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    st.tries++;
    const idx = st.tries - 1;
    st.guesses.push({ kind: 'skip' });
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderAttemptPips(st.guesses, 5, true, idx);
      drawCoverPixel(true);
      const tgt = st.target;
      const subTxt = tgt.anchorTitle ? `${tgt.artist} · ${tgt.year} · ${tgt.anchorTitle}` : `${tgt.artist} · ${tgt.year}`;
      const sum = t('Missed', 'Fallaste');
      renderMiniReveal({ won: false, score: 0, title: tgt.album, subtitle: subTxt, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'cover', shortSummary: sum, detail: `${sum} · ${tgt.album}`, freeKicker: t('Out of tries', 'Sin intentos') });
    } else {
      renderAttemptPips(st.guesses, 5, false, idx);
      drawCoverPixel(false);
    }
  }

  /* ================= GAME 2: MV FRAME (CURATED NON-FACE MUSIC VIDEO SCENES) ================= */
  function mvFrameUrl(ytId, frameNum, variant) {
    if (variant === 'yt') return `https://i.ytimg.com/vi/${ytId}/maxres${frameNum}.jpg`;
    if (variant === 'hq720') return `https://i.ytimg.com/vi/${ytId}/hq720.jpg`;
    const prefix = (typeof location !== 'undefined' && location.protocol === 'file:') ? './mv-frames/' : '/mv-frames/';
    return `${prefix}${ytId}_${frameNum}.webp`;
  }

  function preloadMvFrames(ytId) {
    if (typeof Image !== 'function') return;
    [2, 3].forEach((n) => {
      const pre = new Image();
      pre.src = mvFrameUrl(ytId, n);
    });
  }

  function initMvFrame(seed, dailySlot, challenge, saved) {
    let st = saved && saved.gameId === 'mv' ? saved : null;
    if (!st) {
      const bank = getData().mvBank || [];
      const maxDiff = dailySlot ? dailySlot.diffTier : 3;
      const pool = bank.filter((r) => r[3] <= maxDiff);
      const srcPool = pool.length ? pool : bank;
      const targetRow = (challenge && challenge.item)
        ? challenge.item
        : dailySlot
        ? Hub.pickDeterministic(srcPool, seed, 1)
        : pickFreeUnseen(srcPool, 'mv', seed, (r) => r[2]);
      if (!targetRow) return;
      // [title, artist, yt, tier, year, genre, art, trackId]
      const [title, artist, yt, tier, year, genre, art, trackId] = targetRow;
      const challengeIndex = (challenge && Number.isInteger(challenge.resolvedIndex))
        ? challenge.resolvedIndex
        : bank.indexOf(targetRow);
      st = {
        gameId: 'mv',
        target: { title, artist, yt, tier, year, genre, art, trackId },
        challenge,
        challengeKey: yt,
        challengeIndex,
        tries: 0,
        maxTries: 5,
        viewFrame: 1,
        guesses: [],
        tried: new Set(),
        done: false
      };
      if (dailySlot) dailyMiniSessions[dailySlotKey(dailySlot)] = st;
      else if (!challenge) freeMiniSessions.mv = st;
    }
    mgState = st;

    $('#mgSubtitle').textContent = t('Guess the song from 3 music video frames', 'Adivina la canción con 3 escenas del videoclip');
    $('#mgBody').innerHTML =
      `<div class="mg-mv-stage" id="mgMvStage">` +
        `<div class="mg-mv-frame-wrap">` +
          `<img id="mgMvImg" class="mg-mv-img" alt="${esc(t('Music video scene', 'Escena del videoclip'))}" decoding="async">` +
          `<div class="mg-mv-bar">` +
            `<span class="mg-mv-badge" id="mgMvBadge">Frame 1/3</span>` +
            `<div class="mg-mv-tabs" id="mgMvTabs" role="group" aria-label="${esc(t('Music video frames', 'Escenas del videoclip'))}">` +
              `<button type="button" class="mg-mv-tab is-active" data-mvf="1">1</button>` +
              `<button type="button" class="mg-mv-tab" data-mvf="2" disabled>2</button>` +
              `<button type="button" class="mg-mv-tab" data-mvf="3" disabled>3</button>` +
            `</div>` +
          `</div>` +
        `</div>` +
        `<div class="mg-mv-clues" id="mgMvClues" hidden></div>` +
      `</div>`;

    renderAttemptPips(st.guesses, st.maxTries, false, -1);
    bindMiniSearch({
      placeholder: t('Type song or artist…', 'Escribe la canción o el artista…'),
      mode: 'song',
      skipLabel: t('Next frame', 'Siguiente escena'),
      isTried: (s) => mgState && mgState.tried.has(normStr(s.title) + '|' + normStr(s.artist)),
      onPick: (song) => submitMvGuess(song, dailySlot),
      onSkip: () => skipMvGuess(dailySlot)
    });

    const tabsHost = $('#mgMvTabs');
    if (tabsHost) {
      tabsHost.onclick = (e) => {
        const btn = e.target.closest('button[data-mvf]');
        if (!btn || btn.disabled || !mgState || mgState.gameId !== 'mv') return;
        const f = Number(btn.dataset.mvf);
        if (f >= 1 && f <= 3 && f !== mgState.viewFrame) {
          mgState.viewFrame = f;
          renderMvStage(Boolean(mgState.done));
        }
      };
    }

    renderMvStage(false);
    preloadMvFrames(st.target.yt);
  }

  function renderMvStage(revealAll) {
    const st = mgState;
    if (!st || st.gameId !== 'mv') return;
    const tgt = st.target;
    const showAll = Boolean(revealAll || st.done);
    const unlockedFrames = showAll ? 3 : Math.min(3, st.tries + 1);
    if (st.viewFrame > unlockedFrames) st.viewFrame = unlockedFrames;

    const img = $('#mgMvImg');
    const nextSrc = mvFrameUrl(tgt.yt, st.viewFrame);

    if (img) {
      if (img.dataset.curSrc !== nextSrc) {
        img.dataset.curSrc = nextSrc;
        img.dataset.fallback = '';
        img.classList.add('is-loading');
        img.onload = () => img.classList.remove('is-loading');
        img.onerror = () => {
          img.classList.remove('is-loading');
          if (!img.dataset.fallback) {
            img.dataset.fallback = '1';
            img.src = mvFrameUrl(tgt.yt, st.viewFrame, 'yt');
          } else if (img.dataset.fallback === '1') {
            img.dataset.fallback = '2';
            img.src = mvFrameUrl(tgt.yt, st.viewFrame, 'hq720');
          }
        };
        img.src = nextSrc;
      }
    }

    const badge = $('#mgMvBadge');
    if (badge) {
      badge.textContent = showAll
        ? `${t('Scene', 'Escena')} ${st.viewFrame}/3`
        : `${t('Frame', 'Escena')} ${st.viewFrame}/3`;
    }

    const tabsHost = $('#mgMvTabs');
    if (tabsHost) {
      tabsHost.querySelectorAll('button[data-mvf]').forEach((b) => {
        const f = Number(b.dataset.mvf);
        b.disabled = f > unlockedFrames;
        b.classList.toggle('is-active', f === st.viewFrame);
        b.classList.toggle('is-open', f <= unlockedFrames);
      });
    }

    const cluesEl = $('#mgMvClues');
    if (cluesEl) {
      const chips = [];
      if (showAll || st.tries >= 3) {
        chips.push(`<span class="mg-mv-clue"><small>${esc(t('Clue 1', 'Pista 1'))}</small><b>${esc(tgt.year + ' · ' + formatMvGenre(tgt.genre))}</b></span>`);
      }
      if (showAll || st.tries >= 4) {
        chips.push(`<span class="mg-mv-clue"><small>${esc(t('Artist', 'Artista'))}</small><b>${esc(tgt.artist)}</b></span>`);
      }
      cluesEl.hidden = !chips.length;
      cluesEl.innerHTML = chips.join('');
    }

    const skipBtn = $('#mgSkipBtn');
    if (skipBtn && !st.done) {
      skipBtn.textContent = st.tries < 2
        ? t('Next frame', 'Siguiente escena')
        : st.tries === 2
        ? t('Year clue', 'Pista de año')
        : st.tries === 3
        ? t('Artist clue', 'Pista de artista')
        : t('Reveal song', 'Revelar canción');
    }
  }

  function advanceMvProgress() {
    const st = mgState;
    if (!st || st.gameId !== 'mv') return;
    if (st.tries <= 2) st.viewFrame = Math.min(3, st.tries + 1);
  }

  function submitMvGuess(pick, dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    const key = normStr(pick.title) + '|' + normStr(pick.artist);
    if (st.tried.has(key)) {
      if (bridge && bridge.toast) bridge.toast(t('Already tried that song.', 'Ya probaste esa canción.'));
      return;
    }
    st.tried.add(key);

    st.tries++;
    const idx = st.tries - 1;
    const tgt = st.target;
    const sameArt = normStr(pick.artist) === normStr(tgt.artist);
    const sameTrack = (pick.trackId && String(pick.trackId) === String(tgt.trackId)) ||
      (normStr(pick.title) === normStr(tgt.title) && sameArt);

    if (sameTrack) {
      st.done = true;
      st.guesses.push({ kind: 'right' });
      renderAttemptPips(st.guesses, 5, true, idx);
      renderMvStage(true);
      const score = Hub.scoreTries(true, st.tries, 5);
      const sum = t(`Solved in ${st.tries}/5`, `Acertado en ${st.tries}/5`);
      if (st.tries === 1 && !(dailySlot && dailySlot.isArchive)) {
        recordMgStat((s) => { s.mv1 = (s.mv1 || 0) + 1; });
        awardMiniBadges(['mv1']);
      }
      renderMiniReveal({ won: true, score, title: tgt.title, subtitle: `${tgt.artist} · ${tgt.year}`, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'mv', shortSummary: sum, detail: `${sum} · ${tgt.title}`, freeKicker: sum });
      return;
    }
    st.guesses.push({ kind: sameArt ? 'near' : 'wrong' });
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderAttemptPips(st.guesses, 5, true, idx);
      renderMvStage(true);
      const sum = t('Missed', 'Fallaste');
      renderMiniReveal({ won: false, score: 0, title: tgt.title, subtitle: `${tgt.artist} · ${tgt.year}`, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'mv', shortSummary: sum, detail: `${sum} · ${tgt.title}`, freeKicker: t('Out of tries', 'Sin intentos') });
    } else {
      advanceMvProgress();
      renderAttemptPips(st.guesses, 5, false, idx);
      renderMvStage(false);
      if (sameArt) {
        playFxNear();
        triggerFxClass($('#mgInput'), 'is-fx-near', 520);
        if (bridge && bridge.toast) bridge.toast(t('Right artist, wrong MV!', '¡Artista correcto, videoclip incorrecto!'));
      } else {
        playFxWrong();
        triggerFxClass($('.mg-search-row'), 'is-fx-wrong', 420);
        triggerFxClass($('.mg-mv-stage'), 'is-fx-wrong', 420);
      }
    }
  }

  function skipMvGuess(dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    st.tries++;
    const idx = st.tries - 1;
    st.guesses.push({ kind: 'skip' });
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderAttemptPips(st.guesses, 5, true, idx);
      renderMvStage(true);
      const tgt = st.target;
      const sum = t('Missed', 'Fallaste');
      renderMiniReveal({ won: false, score: 0, title: tgt.title, subtitle: `${tgt.artist} · ${tgt.year}`, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'mv', shortSummary: sum, detail: `${sum} · ${tgt.title}`, freeKicker: t('Out of tries', 'Sin intentos') });
    } else {
      advanceMvProgress();
      renderAttemptPips(st.guesses, 5, false, idx);
      renderMvStage(false);
    }
  }

  /* ================= GAME 3: HAIR PEEK ================= */
  const HAIR_CURTAIN_PCTS = [77, 63, 49, 34, 18, 0];
  function initHairPeek(seed, dailySlot, challenge, saved) {
    let st = saved && saved.gameId === 'hair' ? saved : null;
    if (!st) {
      const bank = getData().hairBank || [];
      const maxDiff = dailySlot ? dailySlot.diffTier : 3;
      const pool = bank.filter((p) => p[3] <= maxDiff);
      const srcPool = pool.length ? pool : bank;
      const picked = (challenge && challenge.item)
        ? challenge.item
        : dailySlot
        ? Hub.pickDeterministic(srcPool, seed, 1)
        : pickFreeUnseen(srcPool, 'hair', seed, (p) => p[0]);
      if (!picked) return;
      // [artistId, artistName, imgUrl, diff, crop?]
      const [artistId, artistName, imgUrl, , crop] = picked;
      const hasCrop = Array.isArray(crop) && crop.length >= 8;
      const curtains = hasCrop ? [crop[3], crop[4], crop[5], crop[6], crop[7], 0] : HAIR_CURTAIN_PCTS;
      const imgStyle = hasCrop ? `left:${crop[0]}%;top:${crop[1]}%;width:${crop[2]}%` : '';
      const challengeIndex = (challenge && Number.isInteger(challenge.resolvedIndex))
        ? challenge.resolvedIndex
        : bank.indexOf(picked);
      st = { gameId: 'hair', artistId, artistName, imgUrl, curtains, hasCrop, imgStyle, challenge, challengeKey: artistId, challengeIndex, tries: 0, maxTries: 5, guesses: [], tried: new Set(), done: false };
      if (dailySlot) dailyMiniSessions[dailySlotKey(dailySlot)] = st;
      else if (!challenge) freeMiniSessions.hair = st;
    }
    mgState = st;
    const { imgUrl, curtains, hasCrop, imgStyle } = st;

    $('#mgSubtitle').textContent = t('Guess the musician from their hairstyle', 'Adivina al músico por su peinado');
    renderAttemptPips(st.guesses, st.maxTries, false, -1);

    $('#mgBody').innerHTML =
      `<div class="mg-hair-frame">` +
        `<div id="mgHairClip" class="mg-hair-clip" style="clip-path:inset(0 0 ${curtains[0]}% 0)">` +
          `<img id="mgHairImg" class="mg-hair-img${hasCrop ? ' is-framed' : ''}" src="${esc(imgUrl)}" alt="Mystery musician" referrerpolicy="no-referrer"${imgStyle ? ` style="${imgStyle}"` : ''}>` +
        `</div>` +
        `<div id="mgHairCurtain" class="mg-hair-curtain" style="transform:translate3d(0,${100 - curtains[0]}%,0)">` +
          `<span id="mgHairStage">${esc(t('Hair only', 'Solo cabello'))}</span>` +
        `</div>` +
      `</div>`;

    bindMiniSearch({
      placeholder: t('Search musician name…', 'Busca el nombre del músico…'),
      mode: 'artist',
      skipLabel: t('Reveal more', 'Revelar más'),
      isTried: (a) => mgState && mgState.tried.has(normStr(a.name)),
      onPick: (artist) => submitHairGuess(artist, dailySlot),
      onSkip: () => skipHairGuess(dailySlot)
    });
    if (st.tries > 0) updateHairCurtain(false);
  }

  function updateHairCurtain(fullReveal) {
    const st = mgState;
    if (!st || st.gameId !== 'hair') return;
    const curtain = $('#mgHairCurtain');
    const lbl = $('#mgHairStage');
    const idx = fullReveal ? 5 : Math.min(4, st.tries);
    const names = [
      t('Hair only', 'Solo cabello'),
      t('Hairline', 'Frente'),
      t('Eyes', 'Ojos'),
      t('Upper face', 'Parte superior'),
      t('Last clue', 'Última pista'),
      st.artistName
    ];
    const list = (st.curtains && st.curtains.length === 6) ? st.curtains : HAIR_CURTAIN_PCTS;
    const pct = list[idx];
    const clip = $('#mgHairClip');
    if (clip) {
      clip.style.clipPath = fullReveal ? 'inset(0 0 0 0)' : `inset(0 0 ${pct}% 0)`;
    }
    if (curtain) {
      curtain.style.transform = `translate3d(0,${fullReveal ? 100 : (100 - pct)}%,0)`;
      curtain.classList.toggle('is-open', Boolean(fullReveal));
    }
    if (lbl) lbl.textContent = names[idx];
    const skipBtn = $('#mgSkipBtn');
    if (skipBtn && !st.done) {
      skipBtn.textContent = st.tries >= 4
        ? t('Reveal artist', 'Revelar artista')
        : t('Reveal more', 'Revelar más');
    }
  }

  function hairTopTrack(artistObj, artistName) {
    if (artistObj && artistObj.topSong && artistObj.topSong.trackId) {
      return { trackId: artistObj.topSong.trackId, title: artistObj.topSong.title || '' };
    }
    const hit = bridge && bridge.findArtistTopTrack ? bridge.findArtistTopTrack(artistName) : null;
    return hit ? { trackId: hit.trackId, title: hit.title || '' } : { trackId: null, title: '' };
  }

  function hairRevealSub(hit, fallbackGenre) {
    if (hit && hit.title) return hit.title;
    return fallbackGenre || t('Mystery musician', 'Músico misterioso');
  }

  function submitHairGuess(artist, dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    const key = normStr(artist.name);
    if (st.tried.has(key)) {
      if (bridge && bridge.toast) bridge.toast(t('Already tried that musician.', 'Ya probaste con ese músico.'));
      return;
    }
    st.tried.add(key);

    st.tries++;
    const idx = st.tries - 1;
    const match = artist.id === st.artistId || key === normStr(st.artistName);
    if (match) {
      st.done = true;
      st.guesses.push({ kind: 'right' });
      renderAttemptPips(st.guesses, 5, true, idx);
      updateHairCurtain(true);
      const score = Hub.scoreTries(true, st.tries, 5);
      const sum = t(`Solved in ${st.tries}/5`, `Acertado en ${st.tries}/5`);
      if (st.tries === 1 && !(dailySlot && dailySlot.isArchive)) {
        recordMgStat((s) => { s.hair1 = (s.hair1 || 0) + 1; });
        awardMiniBadges(['hair1']);
      }
      const hit = hairTopTrack(artist, st.artistName);
      renderMiniReveal({ won: true, score, title: st.artistName, subtitle: hairRevealSub(hit, artist.genre), art: st.imgUrl, trackId: hit.trackId, dailySlot, gameId: 'hair', shortSummary: sum, detail: `${sum} · ${st.artistName}`, freeKicker: sum });
      return;
    }
    st.guesses.push({ kind: 'wrong' });
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderAttemptPips(st.guesses, 5, true, idx);
      updateHairCurtain(true);
      const sum = t('Missed', 'Fallaste');
      const hit = hairTopTrack(null, st.artistName);
      renderMiniReveal({ won: false, score: 0, title: st.artistName, subtitle: hairRevealSub(hit, null), art: st.imgUrl, trackId: hit.trackId, dailySlot, gameId: 'hair', shortSummary: sum, detail: `${sum} · ${st.artistName}`, freeKicker: t('Out of tries', 'Sin intentos') });
    } else {
      renderAttemptPips(st.guesses, 5, false, idx);
      updateHairCurtain(false);
      playFxWrong();
      triggerFxClass($('.mg-search-row'), 'is-fx-wrong', 420);
      triggerFxClass($('.mg-hair-frame'), 'is-fx-wrong', 420);
    }
  }

  function skipHairGuess(dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    st.tries++;
    const idx = st.tries - 1;
    st.guesses.push({ kind: 'skip' });
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderAttemptPips(st.guesses, 5, true, idx);
      updateHairCurtain(true);
      const sum = t('Missed', 'Fallaste');
      const hit = hairTopTrack(null, st.artistName);
      renderMiniReveal({ won: false, score: 0, title: st.artistName, subtitle: hairRevealSub(hit, null), art: st.imgUrl, trackId: hit.trackId, dailySlot, gameId: 'hair', shortSummary: sum, detail: `${sum} · ${st.artistName}`, freeKicker: t('Out of tries', 'Sin intentos') });
    } else {
      renderAttemptPips(st.guesses, 5, false, idx);
      updateHairCurtain(false);
    }
  }

  /* ================= GAME 4: MUSIC FACT OR CAP ================= */
  function renderFactHeader(lostHeartIdx, bumpScore) {
    const st = mgState;
    const rightEl = $('#mgHeadRight');
    if (!st || st.gameId !== 'fact' || !rightEl) return;
    const best = Number(LS.get(FACT_BEST_KEY, 0)) || 0;
    if (st.isDaily) {
      rightEl.innerHTML = `<div class="mg-fact-pill${bumpScore ? ' is-bump' : ''}">${esc(`${t('Claim', 'Dato')} ${st.idx + 1}/5 · ${st.correct * 20} ${t('pts', 'pts')}`)}</div>`;
      if (bumpScore) popFloatBadge(rightEl.querySelector('.mg-fact-pill'), '+20', 'win');
      return;
    }
    const hearts = [0, 1, 2].map((i) => {
      const losing = lostHeartIdx === i;
      const on = i < st.lives;
      return `<span class="mg-heart${on ? ' is-on' : ''}${losing ? ' is-losing' : ''}" aria-hidden="true">♥</span>`;
    }).join('');
    rightEl.innerHTML =
      `<div class="mg-fact-meta">` +
        `<div class="mg-fact-hearts" aria-label="${esc(`${Math.max(0, st.lives)} ${t('lives', 'vidas')}`)}">${hearts}</div>` +
        `<div class="mg-fact-pill${bumpScore ? ' is-bump' : ''}">${st.correct} · ${esc(t('Best', 'Récord'))} ${best}</div>` +
      `</div>`;
    if (lostHeartIdx >= 0) popFloatBadge(rightEl.querySelector('.mg-fact-hearts'), '-1 ♥', 'lose');
    if (bumpScore) popFloatBadge(rightEl.querySelector('.mg-fact-pill'), '+1', 'win');
  }

  function initFactOrCap(seed, dailySlot, saved) {
    const isDaily = !!dailySlot;
    let st = (saved && saved.gameId === 'fact') ? saved : null;
    if (!st) {
      const bank = getData().factBank || [];
      const deck = isDaily
        ? Hub.pickDeterministic(bank, seed, 5)
        : bank.slice().sort(() => Math.random() - 0.5);
      st = {
        gameId: 'fact',
        isDaily,
        dailySlot,
        deck,
        idx: 0,
        correct: 0,
        lives: 3,
        locked: false,
        lastAnswer: null,
        done: false
      };
      if (isDaily) dailyMiniSessions[dailySlotKey(dailySlot)] = st;
      else freeMiniSessions.fact = st;
    }
    mgState = st;
    $('#mgSubtitle').textContent = isDaily
      ? t('5 quick music claims · 20 pts each', '5 datos musicales · 20 pts cada uno')
      : t('Music trivia · 3 lives', 'Trivia musical · 3 vidas');
    renderAttemptPips([], 0, false, -1);
    renderFactClaim();
  }

  function renderFactAnswered(ans) {
    const st = mgState;
    if (!st || st.gameId !== 'fact' || !ans) return;
    const { ok, finished, isFact, expEn, expEs } = ans;
    const fb = $('#mgFactFeedback');
    if (fb) {
      fb.hidden = false;
      fb.className = 'mg-fact-fb ' + (ok ? 'is-win' : 'is-lose');
      const tag = isFact ? t('FACT', 'DATO') : t('CAP', 'MITO');
      fb.innerHTML = `<b>${ok ? '✓ ' + t('Correct!', '¡Correcto!') : '✕ ' + t('Wrong!', '¡Incorrecto!')} (${tag})</b> — ${esc(isEs() ? expEs : expEn)}`;
    }
    $('#mgControls').innerHTML =
      `<button id="mgFactNext" class="btn solid mg-lock-btn" type="button">${esc(finished ? t('See result →', 'Ver resultado →') : t('Next claim →', 'Siguiente →'))}</button>`;
    $('#mgFactNext').onclick = () => {
      st.locked = false;
      st.lastAnswer = null;
      if (!finished) {
        st.idx++;
        renderFactClaim();
        return;
      }
      st.done = true;
      if (st.isDaily) {
        delete dailyMiniSessions[dailySlotKey(st.dailySlot)];
        const score = Hub.scorePairs(st.correct, 5);
        const sum = `${st.correct}/5 ${t('correct', 'correctas')}`;
        finishDailySlot(st.dailySlot.slot, { score, won: st.correct >= 3, shortSummary: sum, detail: sum });
      } else {
        const best = Number(LS.get(FACT_BEST_KEY, 0)) || 0;
        renderMiniReveal({
          won: st.correct >= 5,
          score: Math.min(100, st.correct * 10),
          title: `${st.correct} ${t('correct!', '¡correctas!')}`,
          subtitle: `${t('Personal best', 'Récord personal')}: ${best}`,
          art: '',
          trackId: null,
          dailySlot: null,
          gameId: 'fact',
          freeKicker: `${t('Score', 'Puntos')} ${st.correct} · ${t('Best', 'Récord')} ${best}`
        });
      }
    };
  }

  function renderFactClaim() {
    const st = mgState;
    if (!st || st.gameId !== 'fact') return;
    const item = st.deck[st.idx];
    if (!item) return;
    const [, , claimEn, claimEs] = item;
    renderFactHeader(-1, false);

    $('#mgBody').innerHTML =
      `<div class="mg-deck-wrap">` +
        `<div class="mg-deck-card">` +
          `<span class="mg-deck-quote" aria-hidden="true">“</span>` +
          `<p class="mg-fact-claim">${esc(isEs() ? claimEs : claimEn)}</p>` +
          `<div id="mgFactFeedback" class="mg-fact-fb" hidden></div>` +
        `</div>` +
      `</div>`;

    if (st.locked && st.lastAnswer) {
      renderFactAnswered(st.lastAnswer);
      return;
    }

    $('#mgControls').innerHTML =
      `<div class="mg-fact-btns">` +
        `<button id="mgBtnFact" class="btn ghostbtn mg-fact-btn is-fact" type="button"><span class="mg-fact-badge" aria-hidden="true">✓</span><span>${esc(t('FACT', 'DATO'))}</span><kbd class="mg-kbd" aria-hidden="true">F</kbd></button>` +
        `<button id="mgBtnCap" class="btn ghostbtn mg-fact-btn is-cap" type="button"><span class="mg-fact-badge" aria-hidden="true">✕</span><span>${esc(t('CAP', 'MITO'))}</span><kbd class="mg-kbd" aria-hidden="true">C</kbd></button>` +
      `</div>`;

    $('#mgBtnFact').onclick = () => answerFact(1);
    $('#mgBtnCap').onclick = () => answerFact(0);
  }

  function answerFact(choice) {
    const st = mgState;
    if (!st || st.locked || st.done) return;
    st.locked = true;
    const [isFact, , , , expEn, expEs] = st.deck[st.idx];
    const ok = choice === isFact;
    let lostHeartIdx = -1;
    if (ok) {
      st.correct++;
      if (!st.isDaily) {
        const best = Number(LS.get(FACT_BEST_KEY, 0)) || 0;
        if (st.correct > best) LS.set(FACT_BEST_KEY, st.correct);
        if (st.correct >= 10) awardMiniBadges(['fact10']);
      }
    } else if (!st.isDaily) {
      st.lives--;
      lostHeartIdx = Math.max(0, st.lives);
    }

    renderFactHeader(lostHeartIdx, ok);

    const deckCard = $('.mg-deck-card');
    if (ok) {
      playFxCorrect();
      triggerFxClass(deckCard, 'is-fx-correct', 560);
      spawnWinSparks(deckCard);
    } else {
      playFxWrong();
      triggerFxClass(deckCard, 'is-fx-wrong', 480);
    }

    const finished = st.isDaily ? (st.idx + 1 >= st.deck.length) : (st.lives <= 0 || st.idx + 1 >= st.deck.length);
    st.lastAnswer = { ok, finished, isFact, expEn, expEs };
    renderFactAnswered(st.lastAnswer);
  }

  /* ================= GAME 5: LYRIC GUESS ================= */
  function initLyricGuess(seed, dailySlot, challenge, saved) {
    let st = saved && saved.gameId === 'lyric' ? saved : null;
    if (!st) {
      const bank = getData().lyricBank || [];
      const targetRow = (challenge && challenge.item)
        ? challenge.item
        : dailySlot
        ? Hub.pickDeterministic(bank, seed, 1)
        : pickFreeUnseen(bank, 'lyric', seed, (r) => r[0]);
      if (!targetRow) return;
      // [trackId, title, artist, art, year, diff, lines, ytId?, lyricStart?]
      const [trackId, title, artist, art, year, , lines, ytId, lyricStart] = targetRow;
      const challengeIndex = (challenge && Number.isInteger(challenge.resolvedIndex))
        ? challenge.resolvedIndex
        : bank.indexOf(targetRow);
      st = {
        gameId: 'lyric', dailySlot, trackId, title, artist, art, year, lines,
        ytId: ytId || '', lyricStart: Number.isFinite(Number(lyricStart)) ? Math.max(0, Math.floor(Number(lyricStart))) : 0,
        challenge, challengeKey: String(trackId), challengeIndex, tries: 0, maxTries: 5, guesses: [], tried: new Set(), done: false
      };
      if (dailySlot) dailyMiniSessions[dailySlotKey(dailySlot)] = st;
      else if (!challenge) freeMiniSessions.lyric = st;
    }
    mgState = st;

    renderAttemptPips(st.guesses, st.maxTries, false, -1);
    renderLyricLines(false);

    bindMiniSearch({
      placeholder: t('Type song title or artist…', 'Escribe el título o artista…'),
      mode: 'song',
      skipLabel: t('+1 line', '+1 verso'),
      isTried: (s) => mgState && mgState.tried.has(normStr(s.title) + '|' + normStr(s.artist)),
      onPick: (song) => submitLyricGuess(song, dailySlot),
      onSkip: () => skipLyricGuess(dailySlot)
    });
  }

  function renderLyricLines(showAll) {
    const st = mgState;
    if (!st || st.gameId !== 'lyric') return;
    const count = showAll ? st.lines.length : Math.min(st.lines.length, st.tries + 1);
    const pts = Hub.scoreTries(true, st.tries + 1, 5);
    const lineTag = t(`Line ${count} of 5`, `Verso ${count} de 5`);
    const subEl = $('#mgSubtitle');
    if (subEl) {
      subEl.textContent = (st.dailySlot && !showAll)
        ? `${lineTag} · +${pts} ${t('pts', 'pts')}`
        : lineTag;
    }
    $('#mgBody').innerHTML =
      `<div class="mg-lyric-card">` +
        st.lines.slice(0, count).map((ln, idx) =>
          `<p class="mg-lyric-line${idx === count - 1 && !showAll ? ' is-fresh' : ''}">“${esc(ln)}”</p>`
        ).join('') +
      `</div>`;
  }

  function submitLyricGuess(pick, dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    const key = normStr(pick.title) + '|' + normStr(pick.artist);
    if (st.tried.has(key)) {
      if (bridge && bridge.toast) bridge.toast(t('Already tried that song.', 'Ya probaste esa canción.'));
      return;
    }
    st.tried.add(key);

    st.tries++;
    const idx = st.tries - 1;
    const sameArt = normStr(pick.artist) === normStr(st.artist);
    const sameTrack = (pick.trackId && String(pick.trackId) === String(st.trackId)) ||
      (normStr(pick.title) === normStr(st.title) && sameArt);

    if (sameTrack) {
      st.done = true;
      st.guesses.push({ kind: 'right' });
      renderAttemptPips(st.guesses, 5, true, idx);
      renderLyricLines(true);
      const score = Hub.scoreTries(true, st.tries, 5);
      const sum = t(`Solved in ${st.tries}/5`, `Acertado en ${st.tries}/5`);
      if (st.tries === 1 && !(dailySlot && dailySlot.isArchive)) {
        recordMgStat((s) => { s.lyric1 = (s.lyric1 || 0) + 1; });
        awardMiniBadges(['lyric1']);
      }
      renderMiniReveal({ won: true, score, title: st.title, subtitle: `${st.artist} · ${st.year}`, art: st.art, trackId: st.trackId, ytId: st.ytId, lyricStart: st.lyricStart, dailySlot, gameId: 'lyric', shortSummary: sum, detail: `${sum} · ${st.title}`, freeKicker: sum });
      return;
    }
    st.guesses.push({ kind: sameArt ? 'near' : 'wrong' });
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderAttemptPips(st.guesses, 5, true, idx);
      renderLyricLines(true);
      const sum = t('Missed', 'Fallaste');
      renderMiniReveal({ won: false, score: 0, title: st.title, subtitle: `${st.artist} · ${st.year}`, art: st.art, trackId: st.trackId, ytId: st.ytId, lyricStart: st.lyricStart, dailySlot, gameId: 'lyric', shortSummary: sum, detail: `${sum} · ${st.title}`, freeKicker: t('Out of tries', 'Sin intentos') });
    } else {
      renderAttemptPips(st.guesses, 5, false, idx);
      renderLyricLines(false);
      if (sameArt) {
        playFxNear();
        triggerFxClass($('#mgInput'), 'is-fx-near', 520);
        if (bridge && bridge.toast) bridge.toast(t('Right artist, wrong song!', '¡Artista correcto, canción incorrecta!'));
      } else {
        playFxWrong();
        triggerFxClass($('.mg-search-row'), 'is-fx-wrong', 420);
        triggerFxClass($('.mg-lyric-card'), 'is-fx-wrong', 420);
      }
    }
  }

  function skipLyricGuess(dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    st.tries++;
    const idx = st.tries - 1;
    st.guesses.push({ kind: 'skip' });
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderAttemptPips(st.guesses, 5, true, idx);
      renderLyricLines(true);
      const sum = t('Missed', 'Fallaste');
      renderMiniReveal({ won: false, score: 0, title: st.title, subtitle: `${st.artist} · ${st.year}`, art: st.art, trackId: st.trackId, ytId: st.ytId, lyricStart: st.lyricStart, dailySlot, gameId: 'lyric', shortSummary: sum, detail: `${sum} · ${st.title}`, freeKicker: t('Out of tries', 'Sin intentos') });
    } else {
      renderAttemptPips(st.guesses, 5, false, idx);
      renderLyricLines(false);
    }
  }

  /* ================= Boot & Event Wiring ================= */
  function init(appBridge) {
    bridge = appBridge;

    const openBtn = $('#openDailyHub');
    if (openBtn) openBtn.onclick = () => showDailyHub();
    const dhBack = $('#dhBack');
    if (dhBack) dhBack.onclick = () => {
      clearSpinTimers();
      if (bridge && bridge.showLobby) bridge.showLobby();
    };
    const dhMainBtn = $('#dhMainBtn');
    if (dhMainBtn) dhMainBtn.onclick = startDailySpin;
    const dhTodayBtn = $('#dhTodayBtn');
    if (dhTodayBtn) dhTodayBtn.onclick = () => showDailyHub();
    const spPopBody = $('#streakPopBody');
    if (spPopBody) {
      spPopBody.addEventListener('click', (e) => {
        const dayBtn = e.target.closest('button.sp-day[data-day]');
        if (!dayBtn) return;
        const pop = $('#streakPopover');
        if (pop) pop.hidden = true;
        openDailyArchive(dayBtn.dataset.day);
      });
    }

    const dhShare = $('#dhShareBtn');
    if (dhShare) dhShare.onclick = () => {
      if (!hubState) return;
      const txt = Hub.shareText(hubState, hubState.day, location.origin + '/daily', isEs() ? 'es' : 'en');
      if (bridge && bridge.copyText) bridge.copyText(txt, 'daily_hub_share');
    };
    const dhMenuBtn = $('#dhMenuBtn');
    if (dhMenuBtn) dhMenuBtn.onclick = () => {
      clearSpinTimers();
      if (bridge && bridge.showLobby) bridge.showLobby();
    };

    // Streak popovers (Lobby + Daily Hub)
    function toggleStreakPop() {
      const pop = $('#streakPopover');
      if (!pop) return;
      if (pop.hidden) {
        loadHubState();
        renderStreakPopover(Hub.streakOverview(combinedCompletedDays(), todayStr()));
        pop.hidden = false;
      } else {
        pop.hidden = true;
      }
    }
    const spBtn = $('#streakPillBtn');
    if (spBtn) spBtn.onclick = (e) => { e.stopPropagation(); toggleStreakPop(); };
    const dhSpBtn = $('#dhStreakBtn');
    if (dhSpBtn) dhSpBtn.onclick = (e) => { e.stopPropagation(); toggleStreakPop(); };
    const dhArchBtn = $('#dhArchiveBtn');
    if (dhArchBtn) dhArchBtn.onclick = (e) => { e.stopPropagation(); toggleStreakPop(); };
    document.addEventListener('click', (e) => {
      const pop = $('#streakPopover');
      if (pop && !pop.hidden && !pop.contains(e.target) && e.target !== spBtn && e.target !== dhSpBtn && (!dhArchBtn || !dhArchBtn.contains(e.target))) {
        pop.hidden = true;
      }
      const mgDD = $('#mgDD');
      const mgField = mgDD && mgDD.parentElement;
      if (mgDD && !mgDD.hidden && mgField && !mgField.contains(e.target)) {
        mgDD.hidden = true;
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const pop = $('#streakPopover');
        if (pop && !pop.hidden) pop.hidden = true;
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const mg = $('#miniGame');
      if (!mg || mg.hidden || !mgState) return;
      const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;

      // MV Frame: press 1 / 2 / 3 to jump between unlocked video frames
      if (mgState.gameId === 'mv' && (e.key === '1' || e.key === '2' || e.key === '3')) {
        const f = Number(e.key);
        const unlocked = mgState.done ? 3 : Math.min(3, mgState.tries + 1);
        if (f <= unlocked && f !== mgState.viewFrame) {
          e.preventDefault();
          mgState.viewFrame = f;
          renderMvStage(Boolean(mgState.done));
        }
        return;
      }

      // Fact or Cap: F / ArrowLeft = FACT, C / ArrowRight = CAP, Enter / Space = Next claim
      if (mgState.gameId === 'fact' && !mgState.done) {
        if (!mgState.locked) {
          if (e.key === 'f' || e.key === 'F' || e.key === 'ArrowLeft') { e.preventDefault(); answerFact(1); return; }
          if (e.key === 'c' || e.key === 'C' || e.key === 'ArrowRight') { e.preventDefault(); answerFact(0); return; }
        } else if (e.key === 'Enter' || e.code === 'Space') {
          const nxt = $('#mgFactNext');
          if (nxt) { e.preventDefault(); nxt.click(); return; }
        }
        return;
      }

      if (!mgState.done) return;
      if (e.code === 'Space') {
        const art = $('#mgRevArt');
        if (art && art.classList.contains('is-playable')) { e.preventDefault(); art.click(); }
      } else if (e.key === 'Enter') {
        const nextBtn = $('#mgContinueDaily') || $('#mgPlayAgain');
        if (nextBtn) { e.preventDefault(); nextBtn.click(); }
      }
    });

    // Free-play More Music Games buttons in lobby
    document.querySelectorAll('[data-minigame]').forEach((btn) => {
      btn.addEventListener('click', () => startFreeMiniGame(btn.dataset.minigame));
    });

    syncLang();
    setInterval(refreshLobbyDailyUI, 30000);
  }

  function setBtnLbl(el, txt) {
    if (!el) return;
    const lbl = el.querySelector && el.querySelector('.lbl');
    (lbl || el).textContent = txt;
  }

  function syncLang() {
    refreshLobbyDailyUI();
    const backLbl = $('#dhBackLbl');
    if (backLbl) backLbl.textContent = t('Change mode', 'Cambiar modo');
    const archLbl = $('#dhArchiveLbl');
    if (archLbl) archLbl.textContent = t('Archive', 'Archivo');
    const nextLbl = $('#dhNextLbl');
    if (nextLbl) nextLbl.textContent = t('Next daily in', 'Próximo diario en');
    const kicker = $('#dhKicker');
    if (kicker) kicker.textContent = t('DAILY CHALLENGE', 'DESAFÍO DIARIO');
    const doneKicker = $('#dhDoneKicker');
    if (doneKicker) doneKicker.textContent = t('DAILY COMPLETE', 'DIARIO COMPLETADO');
    setBtnLbl($('#dhShareBtn'), t('Share result', 'Compartir resultado'));
    setBtnLbl($('#dhMenuBtn'), t('Back to menu', 'Volver al menú'));
    setBtnLbl($('#dhStepBackBtn'), t('Back to Daily', 'Volver al Diario'));
    if ($('#dailyHub') && !$('#dailyHub').hidden) renderDailyHub();
    if ($('#miniGame') && !$('#miniGame').hidden && mgState) {
      const slot = activeDailySlot;
      const gId = mgState.gameId;
      const mgBackLbl = $('#mgBackLbl');
      if (mgBackLbl) mgBackLbl.textContent = slot ? t('Back to Daily', 'Volver al Diario') : t('Change mode', 'Cambiar modo');
      renderDailyPillInMiniGame(slot);
      renderMiniStreakPill(gId, slot, null);
      renderMiniSwitcher(gId, slot);
      renderMiniChallengeBar(mgState.challenge || null);
      const titleEl = $('#mgGameTitle');
      if (titleEl) titleEl.textContent = gameLabel(gId);
      if (!mgState.done) {
        if (gId === 'cover') initCoverPixel('', slot, mgState.challenge || null, mgState);
        else if (gId === 'mv') initMvFrame('', slot, mgState.challenge || null, mgState);
        else if (gId === 'hair') initHairPeek('', slot, mgState.challenge || null, mgState);
        else if (gId === 'fact') initFactOrCap('', slot, mgState);
        else if (gId === 'lyric') initLyricGuess('', slot, mgState.challenge || null, mgState);
      } else {
        setBtnLbl($('#mgContinueDaily'), t('Continue Daily', 'Continuar Diario'));
        setBtnLbl($('#mgChallengeBtn'), t('Challenge friend', 'Retar amigo'));
        setBtnLbl($('#mgPlayAgain'), t('Next round', 'Siguiente ronda'));
        if (gId === 'cover') $('#mgSubtitle').textContent = t('Guess the album from its pixelated cover', 'Adivina el álbum por su portada pixelada');
        else if (gId === 'mv') { $('#mgSubtitle').textContent = t('Guess the song from 3 music video frames', 'Adivina la canción con 3 escenas del videoclip'); renderMvStage(true); }
        else if (gId === 'hair') { $('#mgSubtitle').textContent = t('Guess the musician from their hairstyle', 'Adivina al músico por su peinado'); updateHairCurtain(true); }
        else if (gId === 'lyric') {
          renderLyricLines(true);
          const ytRes = $('#mgYtRestart');
          if (ytRes) ytRes.textContent = `↺ ${t('Restart', 'Reiniciar')}`;
        }
      }
    }
  }

  window.TuneUpDailyUI = {
    init,
    showDailyHub,
    openDailyArchive,
    refreshLobbyDailyUI,
    syncLang,
    startFreeMiniGame,
    clearFreeSessions,
    openMiniChallenge,
    encodeMiniChallenge,
    parseMiniChallenge,
    compareMiniChallenge,
    getActiveDailySlot: () => activeDailySlot,
    onExternalGameFinished(slotIdx, result) {
      activeDailySlot = null;
      finishDailySlot(slotIdx, result);
    },
    isOpen: () => {
      const h = $('#dailyHub'), m = $('#miniGame');
      return Boolean((h && !h.hidden) || (m && !m.hidden));
    }
  };
})();
