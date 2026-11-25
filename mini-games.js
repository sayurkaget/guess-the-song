/* TuneUp Daily Spin Hub & 5 Pure-Music Mini-Games (Cover Pixel, MV Spot, HairSpot Music, Music Fact or Cap, Lyric Guess). */
(function () {
  'use strict';

  const Hub = window.TuneUpDailyHub;
  const Data = window.TUNEUP_DAILY_HUB_DATA;
  if (!Hub || !Data) return;

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
  const HUB_DONE_KEY = 'tl:dailyhub:completed';
  const HUB_POSTED_KEY = (day) => 'tl:dailyhub:posted:' + day;
  const FACT_BEST_KEY = 'tl:fact:best';
  const MG_STATS_KEY = 'tl:mg:stats';

  let bridge = null;
  const isId = () => (bridge && bridge.getLang && bridge.getLang() === 'id');
  const t = (en, id) => (isId() ? id : en);

  function gameLabel(id) {
    const g = Hub.GAME_MAP[id];
    if (!g) return id;
    return isId() ? g.nameId : g.nameEn;
  }

  /* ================= Daily Hub State ================= */
  let hubState = null;       // { day, slots, spun, results: [null, null, null], done, totalScore }
  let activeDailySlot = null;// null when Free Play, or { slot, gameId, diffKey, diffTier, seed }
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
  function playSpinTick(pitch) {
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
    const ctx = getSpinAudio();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const f = notes[idx] || 659.25;
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, now);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.3);
      if (idx === 2) {
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(1046.5, now + 0.08);
        g2.gain.setValueAtTime(0.001, now);
        g2.gain.setValueAtTime(0.13, now + 0.08);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(now + 0.08); o2.stop(now + 0.54);
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
  function playFxWin()     { playFxTone([523.25, 659.25, 783.99, 1046.5], 0.32, 'sine', 0.11, 0.068); }
  function playFxCorrect() { playFxTone([523.25, 783.99], 0.22, 'sine', 0.1, 0.065); }
  function playFxNear()    { playFxTone([440, 554.37], 0.18, 'triangle', 0.085, 0.06); }
  function playFxWrong()   { playFxTone([220, 164.81], 0.17, 'triangle', 0.095, 0.075); }

  function isAnimOn() {
    return !(bridge && bridge.isAnimOn && !bridge.isAnimOn());
  }
  function triggerFxClass(el, cls, ms) {
    if (!el || !isAnimOn()) return;
    el.classList.remove(cls);
    void el.offsetWidth;
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

  function loadHubState() {
    const day = todayStr();
    const slots = Hub.planDay(day);
    const saved = LS.get(HUB_KEY(day), null);
    if (saved && saved.day === day && Array.isArray(saved.results) && saved.results.length === 3) {
      hubState = {
        day,
        slots,
        spun: !!saved.spun,
        results: saved.results,
        done: saved.results.every(Boolean),
        totalScore: saved.results.reduce((s, r) => s + (r ? Number(r.score) || 0 : 0), 0)
      };
    } else {
      hubState = { day, slots, spun: false, results: [null, null, null], done: false, totalScore: 0 };
    }
    return hubState;
  }

  function saveHubState() {
    if (!hubState) return;
    hubState.done = hubState.results.every(Boolean);
    hubState.totalScore = hubState.results.reduce((s, r) => s + (r ? Number(r.score) || 0 : 0), 0);
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
    const st = loadHubState();
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
        meta.textContent = rem ? t(`Next daily in ${rem}`, `Harian baru ${rem}`) : t('Completed today', 'Selesai hari ini');
      } else if (doneCount > 0) {
        meta.textContent = t(`${doneCount}/3 done · ${st.totalScore} pts`, `${doneCount}/3 selesai · ${st.totalScore} poin`);
      } else {
        meta.textContent = rem ? t(`3 random games · Resets in ${rem}`, `3 game acak · Reset ${rem}`) : t('3 random music games', '3 game musik acak');
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
        badge.textContent = t('3 games · /300', '3 game · /300');
        badge.hidden = false;
      }
    }
    if (status) {
      status.textContent = '';
      status.hidden = true;
    }
    if (btn) {
      btn.textContent = st.done
        ? t('View daily score', 'Lihat skor harian')
        : (doneCount > 0 || st.spun ? t('Continue daily', 'Lanjut harian') : t('Spin Daily', 'Spin Harian'));
    }

    // Update countdown inside hub
    const cd = $('#dhCountdown');
    if (cd && rem) cd.textContent = rem;
  }

  function renderStreakPopover(ov) {
    const body = $('#streakPopBody');
    if (!body) return;
    const sinceTxt = ov.since ? t('Since ' + ov.since, 'Sejak ' + ov.since) : t('Finish today’s Daily to start', 'Selesaikan Daily hari ini');
    const daysHtml = ov.days28.map((d) =>
      `<span class="sp-day${d.played ? ' is-on' : ''}${d.isToday ? ' is-today' : ''}" title="${esc(d.day)}">${d.dom}</span>`
    ).join('');
    const wds = ov.days28.slice(0, 7).map((d) => `<span class="sp-wd">${d.wd}</span>`).join('');
    body.innerHTML =
      `<div class="sp-kicker">${esc(t('DAILY STREAK', 'STREAK HARIAN'))}</div>` +
      `<div class="sp-hero"><span class="sp-flame" aria-hidden="true">🔥</span><div><div class="sp-val"><b>${ov.current}</b> ${esc(t(ov.current === 1 ? 'day' : 'days', 'hari'))}</div><div class="sp-since">${esc(sinceTxt)}</div></div></div>` +
      `<div class="sp-cal-lbl">${esc(t('Last 28 days', '28 hari terakhir'))}</div>` +
      `<div class="sp-grid">${wds}${daysHtml}</div>` +
      `<div class="sp-rows">` +
        `<div><span>${esc(t('Longest', 'Terpanjang'))}</span><b>${ov.best} ${esc(t('days', 'hari'))}</b></div>` +
        `<div><span>${esc(t('Days played', 'Hari dimainkan'))}</span><b>${ov.totalDays}</b></div>` +
        `<div><span>${esc(t('Next milestone', 'Target berikutnya'))}</span><b class="is-acc">${ov.nextMilestone} ${esc(t('days', 'hari'))}</b></div>` +
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
    hideAllScreens();
    document.body.dataset.diff = 'easy';
    const hub = $('#dailyHub');
    if (hub) hub.hidden = false;
    loadHubState();
    renderDailyHub();
    if ((!opts || !opts.skipRoute) && bridge && bridge.syncRoute) {
      bridge.syncRoute('daily', t('Daily Challenge — TuneUp', 'Tantangan Harian — TuneUp'), !!(opts && opts.replace));
    }
    scrollTopReset();
  }

  function clearSpinTimers() {
    spinTimers.forEach((id) => clearTimeout(id));
    spinRafs.forEach((id) => cancelAnimationFrame(id));
    spinTimers = [];
    spinRafs = [];
    spinAnimating = false;
    for (let i = 0; i < 3; i++) {
      const s = $('#dhReel' + i);
      if (s) s.style.filter = 'none';
      const w = $('#dhWin' + i);
      if (w) w.classList.remove('is-spinning');
    }
  }

  function nextUnfinishedSlotIndex() {
    if (!hubState) return 0;
    return hubState.results.findIndex((r) => !r);
  }

  function renderDailyHub() {
    const st = hubState || loadHubState();
    refreshLobbyDailyUI();
    const dayPill = $('#dhDayPill');
    if (dayPill) dayPill.textContent = `${t('DAILY', 'HARIAN')} · ${st.day}`;

    const spinPanel = $('#dhSpinPanel');
    const scorePanel = $('#dhScorePanel');
    if (!spinPanel || !scorePanel) return;

    if (st.done) {
      spinPanel.hidden = true;
      scorePanel.hidden = false;
      renderHubScorecard();
      if (!cachedCommunity || cachedCommunity.day !== st.day) fetchHubStats(st.day);
      return;
    }

    spinPanel.hidden = false;
    scorePanel.hidden = true;

    const titleEl = $('#dhTitle');
    const subEl = $('#dhSub');
    const ctaBtn = $('#dhMainBtn');
    const nextIdx = nextUnfinishedSlotIndex();

    if (!st.spun) {
      if (titleEl) titleEl.textContent = t("Today's 3 Music Games", '3 Game Musik Hari Ini');
      if (subEl) subEl.textContent = t('Spin to reveal today’s lineup — same 3 games for everyone.', 'Spin untuk buka 3 game acak hari ini — sama untuk semua pemain.');
      if (ctaBtn) {
        ctaBtn.textContent = t("Spin Today's Games", 'Spin Game Hari Ini');
        ctaBtn.disabled = false;
      }
      for (let i = 0; i < 3; i++) buildReelStrip(i, false);
    } else {
      const nextSlot = st.slots[nextIdx >= 0 ? nextIdx : 0];
      if (titleEl) titleEl.textContent = t("Today's 3 Music Games", '3 Game Musik Hari Ini');
      if (subEl) subEl.textContent = t('Finish all 3 games for your daily /300 score.', 'Selesaikan 3 game untuk skor harian /300.');
      if (ctaBtn) {
        ctaBtn.textContent = t(`Play ${gameLabel(nextSlot.gameId)} →`, `Main ${gameLabel(nextSlot.gameId)} →`);
        ctaBtn.disabled = false;
      }
      for (let i = 0; i < 3; i++) buildReelStrip(i, true);
    }
  }

  const REEL_STEP = 58; // 52px card + 6px gap
  const REEL_BASE_LOOPS = [3, 4, 5]; // escalating travel per reel for Option A physics
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
    for (let loop = 0; loop < 7; loop++) {
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
    strip.style.filter = 'none';
    if (badge) badge.hidden = true;
    if (!landed) {
      const idleRow = 1 + slotIdx * 2;
      strip.style.transform = `translateY(${-(idleRow * REEL_STEP) + 54}px)`;
      if (sub) { sub.textContent = t('Game ' + (slotIdx + 1), 'Game ' + (slotIdx + 1)); sub.className = 'dh-slot-sub'; sub.style.removeProperty('--rc'); }
    } else {
      strip.style.transform = `translateY(${-(targetRow * REEL_STEP) + 54}px)`;
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
          sub.textContent = t('Up next', 'Berikutnya');
          sub.className = 'dh-slot-sub is-next';
          sub.style.setProperty('--rc', rc);
        } else {
          sub.textContent = t('Game ' + (slotIdx + 1), 'Game ' + (slotIdx + 1));
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
    if (titleEl) titleEl.textContent = t('Rolling today’s lineup…', 'Mengundi 3 game hari ini…');
    if (ctaBtn) ctaBtn.textContent = t('Tap to skip', 'Ketuk untuk lewati');

    const durs = [1450, 2150, 2950];
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

      const rc = gameColor(slot.gameId);
      if (win) {
        win.style.setProperty('--rc', rc);
        win.classList.remove('is-locked', 'is-flash');
        win.classList.add('is-spinning');
      }
      if (col) col.classList.remove('is-recoil', 'is-finale');
      strip.style.transition = 'none';

      function frame(now) {
        if (!spinAnimating) return;
        const el = now - t0;
        const p = Math.min(1, el / dur);
        let y, vel;
        if (p < 0.08) {
          // Anticipation pull-back upward before launch
          const k = p / 0.08;
          y = startY + Math.sin(k * Math.PI) * 16;
          vel = 0;
        } else {
          const u = (p - 0.08) / 0.92;
          let eased;
          if (u < 0.91) {
            const s = u / 0.91;
            eased = (1 - Math.pow(1 - s, 4.2)) * 1.018;
          } else {
            const s = (u - 0.91) / 0.09;
            eased = 1.018 - 0.018 * (1 - Math.pow(1 - s, 2));
          }
          y = startY + dist * eased;
          vel = u < 0.91 ? Math.pow(1 - u / 0.91, 3.2) : 0;
        }
        const blurPx = vel > 0.25 ? Math.min(2.1, (vel - 0.25) * 2.8) : 0;
        strip.style.filter = blurPx > 0.15 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
        strip.style.transform = `translateY(${y.toFixed(1)}px)`;

        // Per-item mechanical tick synced to active reel
        const curRow = Math.floor((-y + 54) / REEL_STEP);
        if (curRow !== lastRowPassed && p >= 0.08 && p < 0.97) {
          lastRowPassed = curRow;
          if (rIdx === 0 || el > durs[rIdx - 1] - 180) {
            playSpinTick(540 + (1 - p) * 280);
          }
        }

        if (p < 1) {
          spinRafs.push(requestAnimationFrame(frame));
        } else {
          strip.style.filter = 'none';
          strip.style.transform = `translateY(${endY}px)`;
          if (win) {
            win.classList.remove('is-spinning');
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
            sub.textContent = rIdx === 0 ? t('Up next', 'Berikutnya') : t('Game ' + (rIdx + 1), 'Game ' + (rIdx + 1));
            sub.className = rIdx === 0 ? 'dh-slot-sub is-next' : 'dh-slot-sub';
            if (rIdx === 0) sub.style.setProperty('--rc', rc);
            else sub.style.removeProperty('--rc');
          }
          playSpinLock(rIdx);
          if (rIdx === 2) {
            spinAnimating = false;
            hubState.spun = true;
            saveHubState();
            if (titleEl) titleEl.textContent = t("Today's 3 Music Games", '3 Game Musik Hari Ini');
            if (ctaBtn) ctaBtn.textContent = t(`Play ${gameLabel(hubState.slots[0].gameId)} →`, `Main ${gameLabel(hubState.slots[0].gameId)} →`);
            const finaleTid = setTimeout(() => {
              for (let i = 0; i < 3; i++) {
                const c = $('#dhCol' + i);
                if (c) c.classList.add('is-finale');
              }
            }, 160);
            spinTimers.push(finaleTid);
          }
        }
      }
      spinRafs.push(requestAnimationFrame(frame));
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
      const parts = [];
      if (ov.current > 0) parts.push(t(`${ov.current}-day streak`, `Streak ${ov.current} hari`));
      if (rem) parts.push(t(`Next daily in ${rem}`, `Harian baru ${rem}`));
      metaEl.textContent = parts.join(' · ');
    }

    // 3-segment progress bar
    for (let i = 0; i < 3; i++) {
      const bar = $('#dhSeg' + i);
      const r = st.results[i];
      const slot = st.slots[i];
      if (bar) {
        bar.style.width = `${Math.max(0, Math.min(100, Number(r && r.score) || 0))}%`;
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
    const sum = Hub.summarizeHistogram(cachedCommunity, hubState.totalScore);
    const headline = sum.plays <= 1
      ? t('First finisher today!', 'Pemain pertama yang selesai hari ini!')
      : t(`Better than ${sum.beatPct}% of players`, `Lebih tinggi dari ${sum.beatPct}% pemain`);
    const badge = sum.plays <= 1
      ? t(`Avg ${sum.avgScore}/300`, `Rata-rata ${sum.avgScore}/300`)
      : t(`Rank #${sum.rank} of ${sum.plays} · Avg ${sum.avgScore}`, `Peringkat #${sum.rank}/${sum.plays} · Rata-rata ${sum.avgScore}`);

    const barsHtml = sum.bands.map((b) => {
      const h = Math.max(6, Math.round(b.heightPct * 0.52));
      return `<div class="dh-bar-col${b.isUser ? ' is-you' : ''}">` +
        (b.isUser ? `<span class="dh-bar-you">${esc(t('You', 'Kamu'))}</span>` : '') +
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
      `<div class="dh-histo-axis"><span>0</span><span>${esc(t("Today's players · 20-pt bands", 'Pemain hari ini · rentang 20 poin'))}</span><span>300</span></div>`;
  }

  /* ================= Between-Game Transition Modal (`DAILY · GAME X OF 3`) ================= */
  function finishDailySlot(slotIdx, result) {
    if (!hubState) loadHubState();
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
      showDailyHub();
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

    $('#dhStepKicker').textContent = `${t('DAILY', 'HARIAN')} · ${t(`GAME ${slotIdx + 1} OF 3`, `GAME ${slotIdx + 1} DARI 3`)}`;
    $('#dhStepVerdict').textContent = res.score >= 80
      ? t('Awesome!', 'Keren!')
      : (res.score >= 40 ? t('Nice work!', 'Bagus!') : t('Tough one!', 'Lumayan susah!'));
    const ptsEl = $('#dhStepPoints');
    if (ptsEl) {
      ptsEl.textContent = `+${res.score}`;
      ptsEl.className = 'dh-step-pts';
      ptsEl.style.setProperty('--rc', gameColor(slot.gameId));
    }
    $('#dhStepDetail').textContent = res.detail || res.shortSummary || '';
    $('#dhStepTotal').textContent = t(`Total so far: ${hubState.totalScore} / 300`, `Total sementara: ${hubState.totalScore} / 300`);

    // 3-card run strip
    $('#dhStepStrip').innerHTML = hubState.slots.map((s, i) => {
      const r = hubState.results[i];
      const isNext = i === nextIdx;
      const rc = gameColor(s.gameId);
      return `<div class="dh-strip-card${r ? ' is-done' : ''}${isNext ? ' is-next' : ''}" style="--rc:${rc}">` +
        `<span class="dh-strip-ico">${ICONS[s.gameId] || ''}</span>` +
        `<span class="dh-strip-name">${esc(gameLabel(s.gameId))}</span>` +
        `<span class="dh-strip-val">${r ? (r.score + '') : (isNext ? t('NEXT', 'LANJUT') : '—')}</span>` +
      `</div>`;
    }).join('');

    const nextBtn = $('#dhStepNextBtn');
    nextBtn.textContent = t(`Next: ${gameLabel(nextSlot.gameId)} →`, `Lanjut: ${gameLabel(nextSlot.gameId)} →`);
    nextBtn.onclick = () => {
      closeStepModal();
      launchDailySlot(nextIdx);
    };
    $('#dhStepBackBtn').onclick = () => {
      closeStepModal();
      showDailyHub();
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
    const slot = hubState.slots[slotIdx];
    if (!slot) return;
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
    cover: { slug: 'cover-pixel', titleEn: 'Cover Pixel — TuneUp',       titleId: 'Cover Pixel — TuneUp' },
    mv:    { slug: 'mv-spot',     titleEn: 'MV Spot — TuneUp',           titleId: 'MV Spot — TuneUp' },
    hair:  { slug: 'hairspot',    titleEn: 'HairSpot Music — TuneUp',    titleId: 'HairSpot Musik — TuneUp' },
    fact:  { slug: 'fact-or-cap', titleEn: 'Music Fact or Cap — TuneUp', titleId: 'Fakta / Hoax Musik — TuneUp' },
    lyric: { slug: 'lyric-guess', titleEn: 'Lyric Guess — TuneUp',       titleId: 'Tebak Lirik — TuneUp' }
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
    const raw = (Data && Data.albumBank) || [];
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

  function startFreeMiniGame(gameId, opts) {
    const normalizedId = gameId === 'color' ? 'mv' : gameId;
    activeDailySlot = null;
    document.body.dataset.diff = 'easy';
    openMiniGame(normalizedId, null, opts);
  }

  /* ================= Unified Mini-Game Stage (`#miniGame`) ================= */
  let mgState = null; // current active mini-game runtime state

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
    pill.innerHTML = `<span class="mg-dp-tag">${esc(t('DAILY', 'HARIAN'))}</span>${segs}<span class="mg-dp-step" style="--rc:${curRc}">${esc(`Game ${slot.slot + 1}/3`)}</span>`;
    pill.hidden = false;
  }

  function openMiniGame(rawGameId, dailySlot, opts) {
    const gameId = rawGameId === 'color' ? 'mv' : rawGameId;
    if (bridge && bridge.stopAudio) bridge.stopAudio();
    if (bridge && bridge.undockMiniVolume) bridge.undockMiniVolume();
    hideAllScreens();
    const sec = $('#miniGame');
    if (sec) sec.hidden = false;

    const arena = $('#mgArena');
    if (arena) arena.dataset.layout = 'centered';

    const backLbl = $('#mgBackLbl');
    if (backLbl) backLbl.textContent = dailySlot ? t('Back to Daily', 'Kembali ke Daily') : t('Change mode', 'Ganti mode');
    $('#mgBack').onclick = () => {
      if (bridge && bridge.stopAudio) bridge.stopAudio();
      if (dailySlot) showDailyHub();
      else if (bridge && bridge.showLobby) bridge.showLobby();
    };

    renderDailyPillInMiniGame(dailySlot);
    const icoEl = $('#mgTitleIco');
    if (icoEl) icoEl.innerHTML = ICONS[gameId] || '';
    const titleEl = $('#mgGameTitle');
    if (titleEl) titleEl.textContent = gameLabel(gameId);
    const rightEl = $('#mgHeadRight');
    if (rightEl) rightEl.innerHTML = '';

    if (bridge && bridge.syncRoute) {
      if (dailySlot) {
        bridge.syncRoute('daily', t('Daily Challenge — TuneUp', 'Tantangan Harian — TuneUp'), true);
      } else if (!opts || !opts.skipRoute) {
        const r = GAME_ROUTES[gameId];
        if (r) bridge.syncRoute(r.slug, isId() ? r.titleId : r.titleEn, !!(opts && opts.replace));
      }
    }

    const isDaily = !!dailySlot;
    const seed = isDaily ? dailySlot.seed : ('free:' + gameId + ':' + Date.now() + ':' + Math.random());

    if (gameId === 'cover') initCoverPixel(seed, dailySlot);
    else if (gameId === 'mv') initMvSpot(seed, dailySlot);
    else if (gameId === 'hair') initHairSpot(seed, dailySlot);
    else if (gameId === 'fact') initFactOrCap(seed, dailySlot);
    else if (gameId === 'lyric') initLyricGuess(seed, dailySlot);

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
      const triedTxt = t('Tried', 'Dicoba');
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
    rightEl.innerHTML = `<div class="mg-pips" aria-label="${esc(t('Attempts', 'Percobaan'))}">${pips.join('')}</div>`;
  }

  function renderMiniReveal({ won, score, title, subtitle, art, trackId, dailySlot, gameId, shortSummary, detail, freeKicker }) {
    if (gameId && (gameId === 'cover' || gameId === 'mv' || gameId === 'hair' || gameId === 'fact' || gameId === 'lyric')) {
      recordMgStat((s) => {
        if (!s.games || typeof s.games !== 'object') s.games = {};
        const g = s.games[gameId] || { played: 0, won: 0, streak: 0, best: 0 };
        g.played = (Number(g.played) || 0) + 1;
        if (won) {
          g.won = (Number(g.won) || 0) + 1;
          g.streak = (Number(g.streak) || 0) + 1;
          if (g.streak > (Number(g.best) || 0)) g.best = g.streak;
        } else {
          g.streak = 0;
        }
        s.games[gameId] = g;
      });
    }
    const controls = $('#mgControls');
    if (!controls) return;
    if (bridge && bridge.undockMiniVolume) bridge.undockMiniVolume();
    const replaySvg = '<svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 1 2.4 5.7M4 12V7m0 5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const nextSvg = '<svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const actionHtml = dailySlot
      ? `<button id="mgContinueDaily" class="btn solid icon-btn" type="button"><span class="lbl">${esc(t('Continue Daily', 'Lanjut Daily'))}</span>${nextSvg}</button>`
      : `<button id="mgPlayAgain" class="btn solid icon-btn" type="button">${replaySvg}<span class="lbl">${esc(t('Next round', 'Ronde berikutnya'))}</span></button>`;

    const kickerTxt = dailySlot
      ? `${won ? t('Solved!', 'Benar!') : t('Revealed', 'Jawabannya')} · ${score}/100`
      : (freeKicker || (won ? t('Solved!', 'Benar!') : t('Out of tries', 'Kesempatan habis')));

    const playable = Boolean(trackId && art);
    const portraitCls = gameId === 'hair' ? ' is-portrait' : '';
    const artHtml = art
      ? `<img id="mgRevArt" class="mg-rev-art${portraitCls}${playable ? ' is-playable' : ''}" src="${esc(art)}" alt="${esc(title)}"${playable ? ` role="button" tabindex="0" data-playing="0" title="${esc(t('Tap to pause or resume preview', 'Ketuk untuk jeda atau putar pratinjau'))}"` : ''}${gameId === 'hair' ? ' referrerpolicy="no-referrer"' : ''}>`
      : '';
    const volHtml = trackId ? '<div class="vol-slot mg-vol-slot" id="mgVolSlot"></div>' : '';

    controls.innerHTML =
      `<div class="mg-reveal-card${won ? ' is-win' : ' is-lose'}">` +
        `<div class="mg-rev-top">` +
          artHtml +
          `<div class="mg-rev-copy">` +
            `<span class="mg-rev-kicker">${esc(kickerTxt)}</span>` +
            `<div class="mg-rev-title">${esc(title)}</div>` +
            `<div class="mg-rev-sub">${esc(subtitle)}</div>` +
          `</div>` +
          volHtml +
        `</div>` +
        `<div class="mg-rev-actions">${actionHtml}</div>` +
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
    if (trackId && bridge) {
      if (bridge.dockMiniVolume) bridge.dockMiniVolume();
      if (artEl && bridge.playTrackPreview) {
        const toggle = () => bridge.playTrackPreview(trackId, artEl, { auto: false });
        artEl.onclick = toggle;
        artEl.onkeydown = (e) => {
          if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); toggle(); }
        };
        bridge.playTrackPreview(trackId, artEl, { auto: true });
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
    const againBtn = $('#mgPlayAgain');
    if (againBtn) {
      againBtn.onclick = () => {
        if (bridge && bridge.stopAudio) bridge.stopAudio();
        if (bridge && bridge.undockMiniVolume) bridge.undockMiniVolume();
        startFreeMiniGame(gameId, { replace: true });
      };
    }
  }

  /* ================= GAME 1: COVER PIXEL (GUESS THE ALBUM NAME) ================= */
  const PIXEL_GRIDS = [6, 10, 16, 28, 46];
  function initCoverPixel(seed, dailySlot) {
    const allAlbums = getAlbumIndex();
    const maxDiff = dailySlot ? dailySlot.diffTier : 2;
    const pool = allAlbums.filter((a) => a.art && a.diff <= maxDiff);
    const srcPool = pool.length ? pool : allAlbums;
    const target = dailySlot
      ? Hub.pickDeterministic(srcPool, seed, 1)
      : pickFreeUnseen(srcPool, 'cover', seed, (a) => a.nAlbum + '|' + a.nArtist);
    if (!target) return;

    mgState = { gameId: 'cover', target, tries: 0, maxTries: 5, guesses: [], tried: new Set(), done: false, imgEl: null };
    $('#mgSubtitle').textContent = t('Guess the album from its pixelated cover', 'Tebak nama album dari cover pikselnya');
    $('#mgBody').innerHTML =
      `<div class="mg-cover-stage">` +
        `<div class="mg-cover-disc" aria-hidden="true"></div>` +
        `<div class="mg-cover-wrap">` +
          `<canvas id="mgPixelCanvas" width="210" height="210" class="mg-pixel-canvas"></canvas>` +
          `<img id="mgPixelFallback" class="mg-pixel-fallback" alt="" hidden>` +
          `<span id="mgPixelTag" class="mg-stage-tag">6×6 px</span>` +
        `</div>` +
      `</div>`;
    renderAttemptPips([], 5, false, -1);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { mgState.imgEl = img; drawCoverPixel(false); };
    img.onerror = () => {
      const fb = $('#mgPixelFallback');
      const cv = $('#mgPixelCanvas');
      if (fb && cv) {
        cv.hidden = true; fb.hidden = false;
        fb.src = target.art;
        drawCoverPixel(false);
      }
    };
    img.src = target.art;

    bindMiniSearch({
      placeholder: t('Type album name or artist…', 'Ketik nama album atau artis…'),
      mode: 'album',
      skipLabel: t('Sharpen', 'Perjelas'),
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
      if (bridge && bridge.toast) bridge.toast(t('Already tried that album.', 'Album ini sudah dicoba.'));
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
      const sum = t(`Solved in ${st.tries}/5`, `Benar ${st.tries}/5`);
      if (st.tries === 1) {
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
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: tgt.album, subtitle: subTxt, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'cover', shortSummary: sum, detail: `${sum} · ${tgt.album}`, freeKicker: t('Out of tries', 'Kesempatan habis') });
    } else {
      renderAttemptPips(st.guesses, 5, false, idx);
      drawCoverPixel(false);
      if (sameArt) {
        playFxNear();
        triggerFxClass($('#mgInput'), 'is-fx-near', 520);
        if (bridge && bridge.toast) bridge.toast(t('Right artist, wrong album!', 'Artis benar, album salah!'));
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
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: tgt.album, subtitle: subTxt, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'cover', shortSummary: sum, detail: `${sum} · ${tgt.album}`, freeKicker: t('Out of tries', 'Kesempatan habis') });
    } else {
      renderAttemptPips(st.guesses, 5, false, idx);
      drawCoverPixel(false);
    }
  }

  /* ================= GAME 2: MV SPOT (CURATED NON-FACE MUSIC VIDEO SCENES — FRAMED STYLE) ================= */
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

  function initMvSpot(seed, dailySlot) {
    const bank = Data.mvBank || [];
    const maxDiff = dailySlot ? dailySlot.diffTier : 3;
    const pool = bank.filter((r) => r[3] <= maxDiff);
    const srcPool = pool.length ? pool : bank;
    const targetRow = dailySlot
      ? Hub.pickDeterministic(srcPool, seed, 1)
      : pickFreeUnseen(srcPool, 'mv', seed, (r) => r[2]);
    if (!targetRow) return;
    // [title, artist, yt, tier, year, genre, art, trackId]
    const [title, artist, yt, tier, year, genre, art, trackId] = targetRow;
    mgState = {
      gameId: 'mv',
      target: { title, artist, yt, tier, year, genre, art, trackId },
      tries: 0,
      maxTries: 5,
      viewFrame: 1,
      guesses: [],
      tried: new Set(),
      done: false
    };

    $('#mgSubtitle').textContent = t('Guess the song from 3 music video frames', 'Tebak lagu dari 3 adegan video klip');
    $('#mgBody').innerHTML =
      `<div class="mg-mv-stage" id="mgMvStage">` +
        `<div class="mg-mv-frame-wrap">` +
          `<img id="mgMvImg" class="mg-mv-img" alt="${esc(t('Music video scene', 'Adegan video klip'))}" decoding="async">` +
          `<div class="mg-mv-bar">` +
            `<span class="mg-mv-badge" id="mgMvBadge">Frame 1/3</span>` +
            `<div class="mg-mv-tabs" id="mgMvTabs" role="group" aria-label="${esc(t('Music video frames', 'Frame video klip'))}">` +
              `<button type="button" class="mg-mv-tab is-active" data-mvf="1">1</button>` +
              `<button type="button" class="mg-mv-tab" data-mvf="2" disabled>2</button>` +
              `<button type="button" class="mg-mv-tab" data-mvf="3" disabled>3</button>` +
            `</div>` +
          `</div>` +
        `</div>` +
        `<div class="mg-mv-clues" id="mgMvClues" hidden></div>` +
      `</div>`;

    renderAttemptPips([], 5, false, -1);
    bindMiniSearch({
      placeholder: t('Type song or artist…', 'Ketik lagu atau artis…'),
      mode: 'song',
      skipLabel: t('Next frame', 'Frame berikut'),
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
    preloadMvFrames(yt);
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
        ? `${t('Scene', 'Adegan')} ${st.viewFrame}/3`
        : `${t('Frame', 'Frame')} ${st.viewFrame}/3`;
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
        chips.push(`<span class="mg-mv-clue"><small>${esc(t('Clue 1', 'Petunjuk 1'))}</small><b>${esc(tgt.year + ' · ' + formatMvGenre(tgt.genre))}</b></span>`);
      }
      if (showAll || st.tries >= 4) {
        chips.push(`<span class="mg-mv-clue"><small>${esc(t('Artist', 'Artis'))}</small><b>${esc(tgt.artist)}</b></span>`);
      }
      cluesEl.hidden = !chips.length;
      cluesEl.innerHTML = chips.join('');
    }

    const skipBtn = $('#mgSkipBtn');
    if (skipBtn && !st.done) {
      skipBtn.textContent = st.tries < 2
        ? t('Next frame', 'Frame berikut')
        : st.tries === 2
        ? t('Year clue', 'Petunjuk tahun')
        : st.tries === 3
        ? t('Artist clue', 'Petunjuk artis')
        : t('Reveal song', 'Lihat lagu');
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
      if (bridge && bridge.toast) bridge.toast(t('Already tried that song.', 'Lagu ini sudah dicoba.'));
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
      const sum = t(`Solved in ${st.tries}/5`, `Benar ${st.tries}/5`);
      if (st.tries === 1) {
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
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: tgt.title, subtitle: `${tgt.artist} · ${tgt.year}`, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'mv', shortSummary: sum, detail: `${sum} · ${tgt.title}`, freeKicker: t('Out of tries', 'Kesempatan habis') });
    } else {
      advanceMvProgress();
      renderAttemptPips(st.guesses, 5, false, idx);
      renderMvStage(false);
      if (sameArt) {
        playFxNear();
        triggerFxClass($('#mgInput'), 'is-fx-near', 520);
        if (bridge && bridge.toast) bridge.toast(t('Right artist, wrong MV!', 'Artis benar, MV salah!'));
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
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: tgt.title, subtitle: `${tgt.artist} · ${tgt.year}`, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'mv', shortSummary: sum, detail: `${sum} · ${tgt.title}`, freeKicker: t('Out of tries', 'Kesempatan habis') });
    } else {
      advanceMvProgress();
      renderAttemptPips(st.guesses, 5, false, idx);
      renderMvStage(false);
    }
  }

  /* ================= GAME 3: HAIRSPOT MUSIC ================= */
  const HAIR_CURTAIN_PCTS = [77, 63, 49, 34, 18, 0];
  function initHairSpot(seed, dailySlot) {
    const bank = Data.hairBank || [];
    const maxDiff = dailySlot ? dailySlot.diffTier : 3;
    const pool = bank.filter((p) => p[3] <= maxDiff);
    const srcPool = pool.length ? pool : bank;
    const picked = dailySlot
      ? Hub.pickDeterministic(srcPool, seed, 1)
      : pickFreeUnseen(srcPool, 'hair', seed, (p) => p[0]);
    if (!picked) return;
    // [artistId, artistName, imgUrl, diff, crop?]
    const [artistId, artistName, imgUrl, , crop] = picked;
    const hasCrop = Array.isArray(crop) && crop.length >= 8;
    const curtains = hasCrop ? [crop[3], crop[4], crop[5], crop[6], crop[7], 0] : HAIR_CURTAIN_PCTS;
    const imgStyle = hasCrop ? `left:${crop[0]}%;top:${crop[1]}%;width:${crop[2]}%` : '';
    mgState = { gameId: 'hair', artistId, artistName, imgUrl, curtains, tries: 0, maxTries: 5, guesses: [], tried: new Set(), done: false };

    $('#mgSubtitle').textContent = t('Guess the musician from their hairstyle', 'Tebak musisi dari gaya rambutnya');
    renderAttemptPips([], 5, false, -1);

    $('#mgBody').innerHTML =
      `<div class="mg-hair-frame">` +
        `<div id="mgHairClip" class="mg-hair-clip" style="clip-path:inset(0 0 ${curtains[0]}% 0)">` +
          `<img id="mgHairImg" class="mg-hair-img${hasCrop ? ' is-framed' : ''}" src="${esc(imgUrl)}" alt="Mystery musician" referrerpolicy="no-referrer"${imgStyle ? ` style="${imgStyle}"` : ''}>` +
        `</div>` +
        `<div id="mgHairCurtain" class="mg-hair-curtain" style="height:${curtains[0]}%">` +
          `<span id="mgHairStage">${esc(t('Hair only', 'Rambut saja'))}</span>` +
        `</div>` +
      `</div>`;

    bindMiniSearch({
      placeholder: t('Search musician name…', 'Cari nama musisi…'),
      mode: 'artist',
      skipLabel: t('Reveal more', 'Buka lagi'),
      isTried: (a) => mgState && mgState.tried.has(normStr(a.name)),
      onPick: (artist) => submitHairGuess(artist, dailySlot),
      onSkip: () => skipHairGuess(dailySlot)
    });
  }

  function updateHairCurtain(fullReveal) {
    const st = mgState;
    if (!st || st.gameId !== 'hair') return;
    const curtain = $('#mgHairCurtain');
    const lbl = $('#mgHairStage');
    const idx = fullReveal ? 5 : Math.min(4, st.tries);
    const names = [
      t('Hair only', 'Rambut saja'),
      t('Hairline', 'Garis dahi'),
      t('Eyes', 'Mata'),
      t('Upper face', 'Wajah atas'),
      t('Last clue', 'Kesempatan terakhir'),
      st.artistName
    ];
    const list = (st.curtains && st.curtains.length === 6) ? st.curtains : HAIR_CURTAIN_PCTS;
    const pct = list[idx];
    const clip = $('#mgHairClip');
    if (clip) {
      clip.style.clipPath = fullReveal ? 'inset(0 0 0 0)' : `inset(0 0 ${pct}% 0)`;
    }
    if (curtain) {
      curtain.style.height = pct + '%';
      curtain.classList.toggle('is-open', Boolean(fullReveal));
    }
    if (lbl) lbl.textContent = names[idx];
    const skipBtn = $('#mgSkipBtn');
    if (skipBtn && !st.done) {
      skipBtn.textContent = st.tries >= 4
        ? t('Reveal artist', 'Lihat musisi')
        : t('Reveal more', 'Buka lagi');
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
    return fallbackGenre || t('Mystery musician', 'Musisi misterius');
  }

  function submitHairGuess(artist, dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    const key = normStr(artist.name);
    if (st.tried.has(key)) {
      if (bridge && bridge.toast) bridge.toast(t('Already tried that musician.', 'Musisi ini sudah ditebak.'));
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
      const sum = t(`Solved in ${st.tries}/5`, `Benar ${st.tries}/5`);
      if (st.tries === 1) {
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
      const sum = t('Missed', 'Gagal');
      const hit = hairTopTrack(null, st.artistName);
      renderMiniReveal({ won: false, score: 0, title: st.artistName, subtitle: hairRevealSub(hit, null), art: st.imgUrl, trackId: hit.trackId, dailySlot, gameId: 'hair', shortSummary: sum, detail: `${sum} · ${st.artistName}`, freeKicker: t('Out of tries', 'Kesempatan habis') });
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
      const sum = t('Missed', 'Gagal');
      const hit = hairTopTrack(null, st.artistName);
      renderMiniReveal({ won: false, score: 0, title: st.artistName, subtitle: hairRevealSub(hit, null), art: st.imgUrl, trackId: hit.trackId, dailySlot, gameId: 'hair', shortSummary: sum, detail: `${sum} · ${st.artistName}`, freeKicker: t('Out of tries', 'Kesempatan habis') });
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
      rightEl.innerHTML = `<div class="mg-fact-pill${bumpScore ? ' is-bump' : ''}">${esc(`${t('Claim', 'Soal')} ${st.idx + 1}/5 · ${st.correct * 20} ${t('pts', 'poin')}`)}</div>`;
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
        `<div class="mg-fact-hearts" aria-label="${esc(`${Math.max(0, st.lives)} ${t('lives', 'nyawa')}`)}">${hearts}</div>` +
        `<div class="mg-fact-pill${bumpScore ? ' is-bump' : ''}">${st.correct} · ${esc(t('Best', 'Terbaik'))} ${best}</div>` +
      `</div>`;
    if (lostHeartIdx >= 0) popFloatBadge(rightEl.querySelector('.mg-fact-hearts'), '-1 ♥', 'lose');
    if (bumpScore) popFloatBadge(rightEl.querySelector('.mg-fact-pill'), '+1', 'win');
  }

  function initFactOrCap(seed, dailySlot) {
    const bank = Data.factBank || [];
    const isDaily = !!dailySlot;
    const deck = isDaily
      ? Hub.pickDeterministic(bank, seed, 5)
      : bank.slice().sort(() => Math.random() - 0.5);

    mgState = {
      gameId: 'fact',
      isDaily,
      dailySlot,
      deck,
      idx: 0,
      correct: 0,
      lives: 3,
      locked: false,
      done: false
    };
    $('#mgSubtitle').textContent = isDaily
      ? t('5 quick music claims · 20 pts each', '5 pernyataan musik · 20 poin tiap benar')
      : t('Music trivia · 3 lives', 'Trivia musik · 3 nyawa');
    renderAttemptPips([], 0, false, -1);
    renderFactClaim();
  }

  function renderFactClaim() {
    const st = mgState;
    if (!st || st.gameId !== 'fact') return;
    const item = st.deck[st.idx];
    if (!item) return;
    const [, , claimEn, claimId] = item;
    renderFactHeader(-1, false);

    $('#mgBody').innerHTML =
      `<div class="mg-deck-wrap">` +
        `<div class="mg-deck-card">` +
          `<span class="mg-deck-quote" aria-hidden="true">“</span>` +
          `<p class="mg-fact-claim">${esc(isId() ? claimId : claimEn)}</p>` +
          `<div id="mgFactFeedback" class="mg-fact-fb" hidden></div>` +
        `</div>` +
      `</div>`;

    $('#mgControls').innerHTML =
      `<div class="mg-fact-btns">` +
        `<button id="mgBtnFact" class="btn ghostbtn mg-fact-btn is-fact" type="button"><span class="mg-fact-badge" aria-hidden="true">✓</span><span>${esc(t('FACT', 'FAKTA'))}</span></button>` +
        `<button id="mgBtnCap" class="btn ghostbtn mg-fact-btn is-cap" type="button"><span class="mg-fact-badge" aria-hidden="true">✕</span><span>${esc(t('CAP', 'HOAX'))}</span></button>` +
      `</div>`;

    $('#mgBtnFact').onclick = () => answerFact(1);
    $('#mgBtnCap').onclick = () => answerFact(0);
  }

  function answerFact(choice) {
    const st = mgState;
    if (!st || st.locked || st.done) return;
    st.locked = true;
    const [isFact, , , , expEn, expId] = st.deck[st.idx];
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

    const fb = $('#mgFactFeedback');
    if (fb) {
      fb.hidden = false;
      fb.className = 'mg-fact-fb ' + (ok ? 'is-win' : 'is-lose');
      const tag = isFact ? t('FACT', 'FAKTA') : t('CAP', 'HOAX');
      fb.innerHTML = `<b>${ok ? '✓ ' + t('Correct!', 'Benar!') : '✕ ' + t('Wrong!', 'Salah!')} (${tag})</b> — ${esc(isId() ? expId : expEn)}`;
    }

    const finished = st.isDaily ? (st.idx + 1 >= st.deck.length) : (st.lives <= 0 || st.idx + 1 >= st.deck.length);
    $('#mgControls').innerHTML =
      `<button id="mgFactNext" class="btn solid mg-lock-btn" type="button">${esc(finished ? t('See result →', 'Lihat hasil →') : t('Next claim →', 'Soal berikutnya →'))}</button>`;
    $('#mgFactNext').onclick = () => {
      st.locked = false;
      if (!finished) {
        st.idx++;
        renderFactClaim();
        return;
      }
      st.done = true;
      if (st.isDaily) {
        const score = Hub.scorePairs(st.correct, 5);
        const sum = `${st.correct}/5 ${t('correct', 'benar')}`;
        finishDailySlot(st.dailySlot.slot, { score, won: st.correct >= 3, shortSummary: sum, detail: sum });
      } else {
        const best = Number(LS.get(FACT_BEST_KEY, 0)) || 0;
        renderMiniReveal({
          won: st.correct >= 5,
          score: Math.min(100, st.correct * 10),
          title: `${st.correct} ${t('correct!', 'jawaban benar!')}`,
          subtitle: `${t('Personal best', 'Skor terbaik')}: ${best}`,
          art: '',
          trackId: null,
          dailySlot: null,
          gameId: 'fact',
          freeKicker: `${t('Score', 'Skor')} ${st.correct} · ${t('Best', 'Terbaik')} ${best}`
        });
      }
    };
  }

  /* ================= GAME 5: LYRIC GUESS ================= */
  function initLyricGuess(seed, dailySlot) {
    const bank = Data.lyricBank || [];
    const targetRow = dailySlot
      ? Hub.pickDeterministic(bank, seed, 1)
      : pickFreeUnseen(bank, 'lyric', seed, (r) => r[0]);
    if (!targetRow) return;
    // [trackId, title, artist, art, year, diff, lines]
    const [trackId, title, artist, art, year, , lines] = targetRow;
    mgState = { gameId: 'lyric', dailySlot, trackId, title, artist, art, year, lines, tries: 0, maxTries: 5, guesses: [], tried: new Set(), done: false };

    renderAttemptPips([], 5, false, -1);
    renderLyricLines(false);

    bindMiniSearch({
      placeholder: t('Type song title or artist…', 'Ketik judul lagu atau artis…'),
      mode: 'song',
      skipLabel: t('+1 line', '+1 baris'),
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
    const lineTag = t(`Line ${count} of 5`, `Baris ${count} dari 5`);
    const subEl = $('#mgSubtitle');
    if (subEl) {
      subEl.textContent = (st.dailySlot && !showAll)
        ? `${lineTag} · +${pts} ${t('pts', 'poin')}`
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
      if (bridge && bridge.toast) bridge.toast(t('Already tried that song.', 'Lagu ini sudah dicoba.'));
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
      const sum = t(`Solved in ${st.tries}/5`, `Benar ${st.tries}/5`);
      if (st.tries === 1) {
        recordMgStat((s) => { s.lyric1 = (s.lyric1 || 0) + 1; });
        awardMiniBadges(['lyric1']);
      }
      renderMiniReveal({ won: true, score, title: st.title, subtitle: `${st.artist} · ${st.year}`, art: st.art, trackId: st.trackId, dailySlot, gameId: 'lyric', shortSummary: sum, detail: `${sum} · ${st.title}`, freeKicker: sum });
      return;
    }
    st.guesses.push({ kind: sameArt ? 'near' : 'wrong' });
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderAttemptPips(st.guesses, 5, true, idx);
      renderLyricLines(true);
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: st.title, subtitle: `${st.artist} · ${st.year}`, art: st.art, trackId: st.trackId, dailySlot, gameId: 'lyric', shortSummary: sum, detail: `${sum} · ${st.title}`, freeKicker: t('Out of tries', 'Kesempatan habis') });
    } else {
      renderAttemptPips(st.guesses, 5, false, idx);
      renderLyricLines(false);
      if (sameArt) {
        playFxNear();
        triggerFxClass($('#mgInput'), 'is-fx-near', 520);
        if (bridge && bridge.toast) bridge.toast(t('Right artist, wrong song!', 'Artis benar, lagu salah!'));
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
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: st.title, subtitle: `${st.artist} · ${st.year}`, art: st.art, trackId: st.trackId, dailySlot, gameId: 'lyric', shortSummary: sum, detail: `${sum} · ${st.title}`, freeKicker: t('Out of tries', 'Kesempatan habis') });
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

    const dhShare = $('#dhShareBtn');
    if (dhShare) dhShare.onclick = () => {
      if (!hubState) return;
      const txt = Hub.shareText(hubState, hubState.day, location.origin + '/daily', isId() ? 'id' : 'en');
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
    document.addEventListener('click', (e) => {
      const pop = $('#streakPopover');
      if (pop && !pop.hidden && !pop.contains(e.target) && e.target !== spBtn && e.target !== dhSpBtn) {
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
      const mg = $('#miniGame');
      if (!mg || mg.hidden || !mgState || !mgState.done) return;
      const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;
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
    if (backLbl) backLbl.textContent = t('Change mode', 'Ganti mode');
    const nextLbl = $('#dhNextLbl');
    if (nextLbl) nextLbl.textContent = t('Next daily in', 'Harian berikutnya dalam');
    const kicker = $('#dhKicker');
    if (kicker) kicker.textContent = t('DAILY CHALLENGE', 'TANTANGAN HARIAN');
    const doneKicker = $('#dhDoneKicker');
    if (doneKicker) doneKicker.textContent = t('DAILY COMPLETE', 'HARIAN SELESAI');
    setBtnLbl($('#dhShareBtn'), t('Share result', 'Bagikan hasil'));
    setBtnLbl($('#dhMenuBtn'), t('Back to menu', 'Kembali ke menu'));
    setBtnLbl($('#dhStepBackBtn'), t('Back to Daily', 'Kembali ke Daily'));
    if ($('#dailyHub') && !$('#dailyHub').hidden) renderDailyHub();
  }

  window.TuneUpDailyUI = {
    init,
    showDailyHub,
    refreshLobbyDailyUI,
    syncLang,
    startFreeMiniGame,
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
