/* TuneUp Daily Spin Hub & 5 Pure-Music Mini-Games (Cover Pixel, Album Color, HairSpot Music, Music Fact or Cap, Lyric Guess). */
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
    color: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.8" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="9.2" cy="9.4" r="1.4" fill="currentColor"/><circle cx="14.8" cy="9.4" r="1.4" fill="currentColor"/><circle cx="8.6" cy="14" r="1.4" fill="currentColor"/><path d="M14.5 15.2a2 2 0 1 0 3.2-1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    fact: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2.8 4.8 13.4h6.4L10.4 21.2 19.2 10.6h-6.4L13 2.8Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    lyric: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 6.5h15M4.5 11.5h11M4.5 16.5h13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="18.5" cy="16.5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    artist: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 2.85 5.8 6.4.93-4.62 4.5 1.09 6.37L12 17.2 6.28 20.2l1.09-6.37-4.62-4.5 6.4-.93L12 2.6Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    duel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5 19.5 9.5M19.5 4.5l-5 5M4.5 14.5l5 5M4.5 19.5l5-5M7 12h10" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>'
  };

  const HUB_KEY = (day) => 'tl:dailyhub:v1:' + day;
  const HUB_DONE_KEY = 'tl:dailyhub:completed';
  const HUB_POSTED_KEY = (day) => 'tl:dailyhub:posted:' + day;
  const FACT_BEST_KEY = 'tl:fact:best';

  let bridge = null;
  const isId = () => (bridge && bridge.getLang && bridge.getLang() === 'id');
  const t = (en, id) => (isId() ? id : en);

  function gameLabel(id) {
    const g = Hub.GAME_MAP[id];
    if (!g) return id;
    return isId() ? g.nameId : g.nameEn;
  }
  function diffLabel(key) {
    const d = Hub.DIFFS.find((x) => x.key === key) || Hub.DIFFS[0];
    return isId() ? d.labelId : d.labelEn;
  }

  /* ================= Daily Hub State ================= */
  let hubState = null;       // { day, slots, spun, results: [null, null, null], done, totalScore }
  let activeDailySlot = null;// null when Free Play, or { slot, gameId, diffKey, diffTier, seed }
  let spinAnimating = false;
  let spinTimers = [];
  let cachedCommunity = null;

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
      meta.textContent = t(
        'Spin 3 random music games · 300 pts max',
        'Spin 3 game musik acak · maks 300 poin'
      );
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
      const parts = [];
      if (ov.current > 0) parts.push(t(`${ov.current}-day streak`, `Streak ${ov.current} hari`));
      if (st.done && rem) parts.push(t(`Next daily in ${rem}`, `Harian baru ${rem}`));
      else if (doneCount > 0) parts.push(t(`${doneCount}/3 games done · ${st.totalScore} pts`, `${doneCount}/3 selesai · ${st.totalScore} poin`));
      else if (rem) parts.push(t(`Resets in ${rem}`, `Reset ${rem}`));
      status.textContent = parts.join(' · ');
      status.hidden = !parts.length;
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
    if (bridge && bridge.hidePrimaryScreens) bridge.hidePrimaryScreens();
    const hub = $('#dailyHub');
    const mg = $('#miniGame');
    if (hub) hub.hidden = true;
    if (mg) mg.hidden = true;
    const pop = $('#streakPopover');
    if (pop) pop.hidden = true;
  }

  function showDailyHub() {
    if (bridge && bridge.stopAudio) bridge.stopAudio();
    activeDailySlot = null;
    hideAllScreens();
    document.body.dataset.diff = 'easy';
    const hub = $('#dailyHub');
    if (hub) hub.hidden = false;
    loadHubState();
    renderDailyHub();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function clearSpinTimers() {
    spinTimers.forEach((id) => clearTimeout(id));
    spinTimers = [];
    spinAnimating = false;
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
  function buildReelStrip(slotIdx, landed) {
    const strip = $('#dhReel' + slotIdx);
    const badge = $('#dhBadge' + slotIdx);
    const sub = $('#dhSub' + slotIdx);
    if (!strip || !hubState) return;
    const slot = hubState.slots[slotIdx];
    const res = hubState.results[slotIdx];
    const nextIdx = nextUnfinishedSlotIndex();

    const list = [];
    for (let loop = 0; loop < 4; loop++) {
      for (let i = 0; i < Hub.GAMES.length; i++) list.push(Hub.GAMES[i]);
    }
    strip.innerHTML = list.map((g, idx) =>
      `<div class="dh-reel-item" data-idx="${idx}" data-gid="${g.id}">` +
        `<span class="dh-reel-ico">${ICONS[g.id] || ''}</span>` +
        `<span class="dh-reel-name">${esc(gameLabel(g.id))}</span>` +
      `</div>`
    ).join('');

    const targetGameIdx = Hub.GAMES.findIndex((g) => g.id === slot.gameId);
    const targetRow = 16 + Math.max(0, targetGameIdx);

    strip.style.transition = 'none';
    if (!landed) {
      const idleRow = 1 + slotIdx * 2;
      strip.style.transform = `translateY(${-(idleRow * REEL_STEP) + 54}px)`;
      if (badge) { badge.textContent = '•••'; badge.className = 'dh-diff-pill'; }
      if (sub) { sub.textContent = t('Game ' + (slotIdx + 1), 'Game ' + (slotIdx + 1)); sub.className = 'dh-slot-sub'; }
    } else {
      strip.style.transform = `translateY(${-(targetRow * REEL_STEP) + 54}px)`;
      const card = strip.querySelector(`[data-idx="${targetRow}"]`);
      if (card) {
        card.classList.add('is-landed', 'is-' + slot.diffKey);
        if (res) card.classList.add('is-done');
      }
      if (badge) {
        badge.textContent = diffLabel(slot.diffKey);
        badge.className = 'dh-diff-pill is-' + slot.diffKey;
      }
      if (sub) {
        if (res) {
          sub.textContent = `+${res.score} · ${res.shortSummary || ''}`;
          sub.className = 'dh-slot-sub is-done';
        } else if (slotIdx === nextIdx) {
          sub.textContent = t('Up next', 'Berikutnya');
          sub.className = 'dh-slot-sub is-next is-' + slot.diffKey;
        } else {
          sub.textContent = t('Game ' + (slotIdx + 1), 'Game ' + (slotIdx + 1));
          sub.className = 'dh-slot-sub';
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

    spinAnimating = true;
    const titleEl = $('#dhTitle');
    const ctaBtn = $('#dhMainBtn');
    if (titleEl) titleEl.textContent = t('Rolling today’s lineup…', 'Mengundi 3 game hari ini…');
    if (ctaBtn) ctaBtn.textContent = t('Tap to skip', 'Ketuk untuk lewati');

    hubState.slots.forEach((slot, rIdx) => {
      const strip = $('#dhReel' + rIdx);
      if (!strip) return;
      const targetGameIdx = Hub.GAMES.findIndex((g) => g.id === slot.gameId);
      const targetRow = 16 + Math.max(0, targetGameIdx);
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(54px)';
      void strip.offsetHeight;
      const dur = 0.95 + rIdx * 0.42;
      strip.style.transition = `transform ${dur}s cubic-bezier(0.14, 0.88, 0.24, 1)`;
      strip.style.transform = `translateY(${-(targetRow * REEL_STEP) + 54}px)`;

      const tid = setTimeout(() => {
        const card = strip.querySelector(`[data-idx="${targetRow}"]`);
        if (card) card.classList.add('is-landed', 'is-' + slot.diffKey);
        const badge = $('#dhBadge' + rIdx);
        const sub = $('#dhSub' + rIdx);
        if (badge) { badge.textContent = diffLabel(slot.diffKey); badge.className = 'dh-diff-pill is-' + slot.diffKey; }
        if (sub) {
          sub.textContent = rIdx === 0 ? t('Up next', 'Berikutnya') : t('Game ' + (rIdx + 1), 'Game ' + (rIdx + 1));
          sub.className = rIdx === 0 ? ('dh-slot-sub is-next is-' + slot.diffKey) : 'dh-slot-sub';
        }
        if (rIdx === 2) {
          spinAnimating = false;
          hubState.spun = true;
          saveHubState();
          if (titleEl) titleEl.textContent = t("Today's 3 Music Games", '3 Game Musik Hari Ini');
          if (ctaBtn) ctaBtn.textContent = t(`Play ${gameLabel(hubState.slots[0].gameId)} →`, `Main ${gameLabel(hubState.slots[0].gameId)} →`);
        }
      }, dur * 1000);
      spinTimers.push(tid);
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
        bar.className = 'dh-seg-fill is-' + slot.diffKey;
      }
    }

    // Breakdown list (TuneUp .runlist style)
    const list = $('#dhBreakdown');
    if (list) {
      list.innerHTML = st.slots.map((slot, i) => {
        const r = st.results[i] || { score: 0, shortSummary: '' };
        const winCls = r.score >= 60 ? ' win' : '';
        return `<li class="dh-row${winCls}">` +
          `<span class="dh-row-ico is-${slot.diffKey}">${ICONS[slot.gameId] || ''}</span>` +
          `<div class="dh-row-copy">` +
            `<div class="dh-row-head"><b>${esc(gameLabel(slot.gameId))}</b><span class="dh-row-diff is-${slot.diffKey}">${esc(diffLabel(slot.diffKey))}</span></div>` +
            `<div class="dh-row-sub">${esc(r.detail || r.shortSummary || '')}</div>` +
          `</div>` +
          `<div class="dh-row-score is-${slot.diffKey}"><b>${r.score}</b><span>/100</span></div>` +
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
      const h = Math.max(6, Math.round(b.heightPct * 0.62));
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
    $('#dhStepPoints').textContent = `+${res.score}`;
    $('#dhStepPoints').className = 'dh-step-pts is-' + slot.diffKey;
    $('#dhStepDetail').textContent = res.detail || res.shortSummary || '';
    $('#dhStepTotal').textContent = t(`Total so far: ${hubState.totalScore} / 300`, `Total sementara: ${hubState.totalScore} / 300`);

    // 3-card run strip
    $('#dhStepStrip').innerHTML = hubState.slots.map((s, i) => {
      const r = hubState.results[i];
      const isNext = i === nextIdx;
      return `<div class="dh-strip-card${r ? ' is-done' : ''}${isNext ? ' is-next is-' + s.diffKey : ''}">` +
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
  }

  function closeStepModal() {
    const m = $('#dhStepModal');
    if (m) m.hidden = true;
  }

  /* ================= Launching Games (Daily Slot OR Free Play!) ================= */
  function launchDailySlot(slotIdx) {
    if (!hubState) loadHubState();
    const slot = hubState.slots[slotIdx];
    if (!slot) return;
    activeDailySlot = slot;
    document.body.dataset.diff = slot.diffKey;

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

  function startFreeMiniGame(gameId) {
    activeDailySlot = null;
    document.body.dataset.diff = 'easy';
    openMiniGame(gameId, null);
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
      return `<span class="mg-dp-seg${done ? ' is-done' : ''}${cur ? ' is-cur is-' + s.diffKey : ''}"></span>`;
    }).join('');
    pill.innerHTML = `<span class="mg-dp-tag">${esc(t('DAILY', 'HARIAN'))}</span>${segs}<span class="mg-dp-diff is-${slot.diffKey}">${esc(diffLabel(slot.diffKey))}</span>`;
    pill.hidden = false;
  }

  function openMiniGame(gameId, dailySlot) {
    if (bridge && bridge.stopAudio) bridge.stopAudio();
    hideAllScreens();
    const sec = $('#miniGame');
    if (sec) sec.hidden = false;

    const backLbl = $('#mgBackLbl');
    if (backLbl) backLbl.textContent = dailySlot ? t('Back to Daily', 'Kembali ke Daily') : t('Change mode', 'Ganti mode');
    $('#mgBack').onclick = () => {
      if (bridge && bridge.stopAudio) bridge.stopAudio();
      if (dailySlot) showDailyHub();
      else if (bridge && bridge.showLobby) bridge.showLobby();
    };

    renderDailyPillInMiniGame(dailySlot);
    $('#mgGameTitle').innerHTML = `<span class="mg-title-ico">${ICONS[gameId] || ''}</span><span>${esc(gameLabel(gameId))}</span>`;

    const isDaily = !!dailySlot;
    const seed = isDaily ? dailySlot.seed : ('free:' + gameId + ':' + Date.now() + ':' + Math.random());

    if (gameId === 'cover') initCoverPixel(seed, dailySlot);
    else if (gameId === 'color') initAlbumColor(seed, dailySlot);
    else if (gameId === 'hair') initHairSpot(seed, dailySlot);
    else if (gameId === 'fact') initFactOrCap(seed, dailySlot);
    else if (gameId === 'lyric') initLyricGuess(seed, dailySlot);

    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- Helper: Shared Autocomplete Search Bar for Cover / Lyric / HairSpot ---------- */
  function bindMiniSearch({ placeholder, mode, onPick, onSkip, skipLabel }) {
    const host = $('#mgControls');
    if (!host) return;
    host.innerHTML =
      `<div class="mg-search-row">` +
        `<div class="mg-field">` +
          `<input id="mgInput" type="text" placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false">` +
          `<button id="mgClear" class="clear" type="button" aria-label="Clear" hidden>&times;</button>` +
        `</div>` +
        `<button id="mgSkipBtn" class="btn ghostbtn mg-skip-btn" type="button">${esc(skipLabel)}</button>` +
      `</div>` +
      `<ul id="mgDD" class="dd mg-dd" hidden></ul>`;

    const input = $('#mgInput');
    const clearBtn = $('#mgClear');
    const skipBtn = $('#mgSkipBtn');
    const dd = $('#mgDD');
    let lastItems = [];

    function closeDD() { dd.hidden = true; dd.innerHTML = ''; lastItems = []; }
    function renderDD(items) {
      lastItems = items;
      if (!items.length) { closeDD(); return; }
      dd.innerHTML = items.map((it, idx) =>
        `<li><button type="button" data-i="${idx}"><b>${esc(it.primary)}</b>` +
        (it.secondary ? `<span>${esc(it.secondary)}</span>` : '') +
        `</button></li>`
      ).join('');
      dd.hidden = false;
    }

    input.oninput = () => {
      const q = input.value.trim();
      clearBtn.hidden = !q;
      if (q.length < 1) { closeDD(); return; }
      if (mode === 'song' && bridge && bridge.searchSongs) {
        const res = bridge.searchSongs(q, 10);
        renderDD(res.map((s) => ({ primary: s.title, secondary: s.artist, raw: s })));
      } else if (mode === 'artist' && bridge && bridge.searchArtists) {
        const res = bridge.searchArtists(q, 10);
        renderDD(res.map((a) => ({ primary: a.name, secondary: a.genre || '', raw: a })));
      }
    };
    clearBtn.onclick = () => { input.value = ''; clearBtn.hidden = true; closeDD(); input.focus(); };
    dd.onclick = (e) => {
      const btn = e.target.closest('button[data-i]');
      if (!btn) return;
      const item = lastItems[Number(btn.dataset.i)];
      if (!item) return;
      input.value = '';
      clearBtn.hidden = true;
      closeDD();
      onPick(item.raw);
    };
    skipBtn.onclick = () => {
      closeDD();
      onSkip();
    };
  }

  function renderGuessHistory(guesses) {
    const el = $('#mgHistory');
    if (!el) return;
    if (!guesses.length) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = guesses.map((g) =>
      `<li class="mg-g-row is-${g.kind}">` +
        `<span class="mg-g-dot">${g.kind === 'right' ? '✓' : (g.kind === 'near' ? '≈' : (g.kind === 'skip' ? '↷' : '✕'))}</span>` +
        `<span class="mg-g-txt">${esc(g.label)}</span>` +
      `</li>`
    ).join('');
  }

  function renderMiniReveal({ won, score, title, subtitle, art, trackId, dailySlot, gameId, shortSummary, detail }) {
    const controls = $('#mgControls');
    if (!controls) return;
    const playHtml = trackId
      ? `<button id="mgPlayPreview" class="btn ghostbtn mg-rev-play" type="button">▶ ${esc(t('Play preview', 'Putar lagu'))}</button>`
      : '';
    const actionHtml = dailySlot
      ? `<button id="mgContinueDaily" class="btn solid" type="button">${esc(t('Continue Daily →', 'Lanjut Daily →'))}</button>`
      : `<button id="mgPlayAgain" class="btn solid" type="button">${esc(t('Next round', 'Ronde berikutnya'))}</button>`;

    controls.innerHTML =
      `<div class="mg-reveal-card${won ? ' is-win' : ' is-lose'}">` +
        `<div class="mg-rev-top">` +
          (art ? `<img class="mg-rev-art" src="${esc(art)}" alt="">` : '') +
          `<div class="mg-rev-copy">` +
            `<span class="mg-rev-kicker">${esc(won ? t('Solved!', 'Benar!') : t('Revealed', 'Jawabannya'))} · ${score}/100</span>` +
            `<div class="mg-rev-title">${esc(title)}</div>` +
            `<div class="mg-rev-sub">${esc(subtitle)}</div>` +
          `</div>` +
        `</div>` +
        `<div class="mg-rev-actions">${playHtml}${actionHtml}</div>` +
      `</div>`;

    const playBtn = $('#mgPlayPreview');
    if (playBtn && trackId && bridge && bridge.playTrackPreview) {
      playBtn.onclick = () => bridge.playTrackPreview(trackId, playBtn);
    }
    const contBtn = $('#mgContinueDaily');
    if (contBtn && dailySlot) {
      contBtn.onclick = () => {
        if (bridge && bridge.stopAudio) bridge.stopAudio();
        finishDailySlot(dailySlot.slot, { score, won, shortSummary, detail });
      };
    }
    const againBtn = $('#mgPlayAgain');
    if (againBtn) {
      againBtn.onclick = () => {
        if (bridge && bridge.stopAudio) bridge.stopAudio();
        startFreeMiniGame(gameId);
      };
    }
  }

  /* ================= GAME 1: COVER PIXEL ================= */
  const PIXEL_GRIDS = [6, 10, 16, 28, 46];
  function initCoverPixel(seed, dailySlot) {
    const all = (bridge && bridge.getAllSongs) ? bridge.getAllSongs() : [];
    const maxTier = dailySlot ? (dailySlot.diffTier === 1 ? 1 : 2) : 2;
    const seenArt = new Set();
    const pool = all.filter((s) => {
      if (!s.art || s.tier > maxTier) return false;
      if (seenArt.has(s.art)) return false;
      seenArt.add(s.art);
      return true;
    });
    const target = Hub.pickDeterministic(pool.length ? pool : all, seed, 1);
    if (!target) return;

    mgState = { gameId: 'cover', target, tries: 0, maxTries: 5, guesses: [], done: false, imgEl: null };
    $('#mgSubtitle').textContent = t('Guess the song from its pixelated album cover.', 'Tebak lagu dari cover album piksel yang makin tajam tiap percobaan.');
    $('#mgBody').innerHTML =
      `<div class="mg-cover-wrap">` +
        `<canvas id="mgPixelCanvas" width="240" height="240" class="mg-pixel-canvas"></canvas>` +
        `<img id="mgPixelFallback" class="mg-pixel-fallback" alt="" hidden>` +
        `<span id="mgPixelTag" class="mg-stage-tag">1/5 · 6×6 px</span>` +
      `</div>`;
    renderGuessHistory([]);

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
      placeholder: t('Type song title or artist…', 'Ketik judul lagu atau artis…'),
      mode: 'song',
      skipLabel: t('Skip', 'Lewati'),
      onPick: (song) => submitCoverGuess(song, dailySlot),
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
    if (tag) tag.textContent = revealHd ? 'HD' : `${st.tries + 1}/5 · ${grid}×${grid} px`;
  }

  function submitCoverGuess(pick, dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    const tgt = st.target;
    const sameTrack = (pick.trackId && tgt.trackId && String(pick.trackId) === String(tgt.trackId)) ||
      (pick.slug === tgt.slug) ||
      (pick.art && tgt.art && pick.art === tgt.art && pick.artist === tgt.artist);
    const sameArt = pick.artist && tgt.artist && pick.artist.toLowerCase() === tgt.artist.toLowerCase();

    st.tries++;
    if (sameTrack) {
      st.done = true;
      st.guesses.push({ kind: 'right', label: `${pick.title} — ${pick.artist}` });
      renderGuessHistory(st.guesses);
      drawCoverPixel(true);
      const score = Hub.scoreTries(true, st.tries, 5);
      const sum = t(`Solved in ${st.tries}/5`, `Benar ${st.tries}/5`);
      renderMiniReveal({ won: true, score, title: tgt.title, subtitle: `${tgt.artist} · ${tgt.year}`, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'cover', shortSummary: sum, detail: `${sum} · ${tgt.title}` });
      return;
    }
    st.guesses.push({
      kind: sameArt ? 'near' : 'wrong',
      label: sameArt
        ? `${pick.title} — ${pick.artist} (${t('Right artist!', 'Artis benar!')})`
        : `${pick.title} — ${pick.artist}`
    });
    renderGuessHistory(st.guesses);
    if (st.tries >= st.maxTries) {
      st.done = true;
      drawCoverPixel(true);
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: tgt.title, subtitle: `${tgt.artist} · ${tgt.year}`, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'cover', shortSummary: sum, detail: `${sum} · ${tgt.title}` });
    } else {
      drawCoverPixel(false);
    }
  }

  function skipCoverGuess(dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    st.tries++;
    st.guesses.push({ kind: 'skip', label: t('Skipped · sharper pixels', 'Lewati · piksel lebih jelas') });
    renderGuessHistory(st.guesses);
    if (st.tries >= st.maxTries) {
      st.done = true;
      drawCoverPixel(true);
      const tgt = st.target;
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: tgt.title, subtitle: `${tgt.artist} · ${tgt.year}`, art: tgt.art, trackId: tgt.trackId, dailySlot, gameId: 'cover', shortSummary: sum, detail: `${sum} · ${tgt.title}` });
    } else {
      drawCoverPixel(false);
    }
  }

  /* ================= GAME 2: ALBUM COLOR ("WARNAI ALBUM") ================= */
  function initAlbumColor(seed, dailySlot) {
    const bank = Data.albumColors || [];
    const targetRow = Hub.pickDeterministic(bank, seed, 1);
    if (!targetRow) return;
    // [album, artist, artUrl, [h,s,l], diff, trackId, anchorTitle, year]
    const [album, artist, artUrl, targetHsl, , trackId, anchorTitle, year] = targetRow;
    mgState = { gameId: 'color', album, artist, artUrl, targetHsl, trackId, anchorTitle, year, done: false };

    $('#mgSubtitle').textContent = t('Remember this iconic album cover? Paint its true signature color!', 'Ingat warna asli cover album ikonik ini? Geser slider untuk mewarnainya!');
    renderGuessHistory([]);

    // Start slider at a neutral contrasting hue away from answer
    const initH = (targetHsl[0] + 150) % 360;
    const initS = 60, initL = 50;

    $('#mgBody').innerHTML =
      `<div class="mg-album-meta"><b>${esc(album)}</b><span>${esc(artist)} · ${year}</span></div>` +
      `<div class="mg-color-compare">` +
        `<div class="mg-color-col">` +
          `<div class="mg-album-stage" id="mgPaintBox">` +
            `<img src="${esc(artUrl)}" class="mg-album-gray" alt="${esc(album)}">` +
            `<div class="mg-album-tint" id="mgPaintTint"></div>` +
            `<div class="mg-album-lit" id="mgPaintLit"></div>` +
          `</div>` +
          `<span class="mg-color-cap">${esc(t('Your color', 'Warnamu'))}</span>` +
        `</div>` +
        `<div class="mg-color-col" id="mgRealCol" hidden>` +
          `<div class="mg-album-stage is-real"><img src="${esc(artUrl)}" class="mg-album-orig" alt="${esc(album)}"></div>` +
          `<span class="mg-color-cap is-acc">${esc(t('Original', 'Asli'))}</span>` +
        `</div>` +
      `</div>` +
      `<div class="mg-sliders">` +
        `<label class="mg-sl-row"><span>${esc(t('Hue', 'Warna'))}</span><b id="mgHVal">${initH}°</b>` +
          `<input id="mgSlH" class="mg-slider is-hue" type="range" min="0" max="360" value="${initH}"></label>` +
        `<label class="mg-sl-row"><span>${esc(t('Saturation', 'Saturasi'))}</span><b id="mgSVal">${initS}%</b>` +
          `<input id="mgSlS" class="mg-slider" type="range" min="0" max="100" value="${initS}"></label>` +
        `<label class="mg-sl-row"><span>${esc(t('Brightness', 'Kecerahan'))}</span><b id="mgLVal">${initL}%</b>` +
          `<input id="mgSlL" class="mg-slider" type="range" min="12" max="88" value="${initL}"></label>` +
      `</div>`;

    const slH = $('#mgSlH'), slS = $('#mgSlS'), slL = $('#mgSlL');
    function syncTint() {
      const h = +slH.value, s = +slS.value, l = +slL.value;
      $('#mgHVal').textContent = h + '°';
      $('#mgSVal').textContent = s + '%';
      $('#mgLVal').textContent = l + '%';
      const tint = $('#mgPaintTint');
      const lit = $('#mgPaintLit');
      if (tint) tint.style.background = `hsl(${h}, ${s}%, ${l}%)`;
      if (lit) {
        const delta = (l - 50) / 50;
        lit.style.background = delta >= 0
          ? `rgba(255,255,255,${(delta * 0.34).toFixed(2)})`
          : `rgba(0,0,0,${(-delta * 0.45).toFixed(2)})`;
      }
      slS.style.background = `linear-gradient(90deg, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`;
      slL.style.background = `linear-gradient(90deg, #000, hsl(${h},${s}%,50%), #fff)`;
    }
    slH.oninput = slS.oninput = slL.oninput = syncTint;
    syncTint();

    $('#mgControls').innerHTML = `<button id="mgLockColor" class="btn solid mg-lock-btn" type="button">${esc(t('Lock color', 'Kunci warna'))}</button>`;
    $('#mgLockColor').onclick = () => {
      if (mgState.done) return;
      mgState.done = true;
      slH.disabled = slS.disabled = slL.disabled = true;
      const score = Hub.scoreColorMatch([+slH.value, +slS.value, +slL.value], targetHsl);
      const rc = $('#mgRealCol');
      if (rc) rc.hidden = false;
      const sum = `${score}% ${t('match', 'cocok')}`;
      renderMiniReveal({
        won: score >= 60,
        score,
        title: `${album} (${score}%)`,
        subtitle: `${artist} · ${anchorTitle}`,
        art: artUrl,
        trackId,
        dailySlot,
        gameId: 'color',
        shortSummary: sum,
        detail: `${sum} · ${album}`
      });
    };
  }

  /* ================= GAME 3: HAIRSPOT MUSIC ================= */
  const HAIR_CURTAIN_PCTS = [70, 58, 44, 26, 0];
  function initHairSpot(seed, dailySlot) {
    const bank = Data.hairBank || [];
    const maxDiff = dailySlot ? dailySlot.diffTier : 3;
    const pool = bank.filter((p) => p[3] <= maxDiff);
    const picked = Hub.pickDeterministic(pool.length ? pool : bank, seed, 1);
    if (!picked) return;
    // [artistId, artistName, imgUrl, diff]
    const [artistId, artistName, imgUrl] = picked;
    mgState = { gameId: 'hair', artistId, artistName, imgUrl, tries: 0, maxTries: 5, guesses: [], done: false };

    $('#mgSubtitle').textContent = t('Guess the musician from their hairstyle — skip reveals more!', 'Tebak musisi dari gaya rambutnya — lewati untuk membuka wajah lebih banyak!');
    renderGuessHistory([]);

    $('#mgBody').innerHTML =
      `<div class="mg-hair-frame">` +
        `<img class="mg-hair-img" src="${esc(imgUrl)}" alt="Mystery musician" referrerpolicy="no-referrer">` +
        `<div id="mgHairCurtain" class="mg-hair-curtain" style="height:${HAIR_CURTAIN_PCTS[0]}%">` +
          `<span id="mgHairStage">${esc(t('1/5 · Hair only', '1/5 · Rambut saja'))}</span>` +
        `</div>` +
      `</div>`;

    bindMiniSearch({
      placeholder: t('Search musician name…', 'Cari nama musisi…'),
      mode: 'artist',
      skipLabel: t('Reveal more', 'Buka lagi'),
      onPick: (artist) => submitHairGuess(artist, dailySlot),
      onSkip: () => skipHairGuess(dailySlot)
    });
  }

  function updateHairCurtain(fullReveal) {
    const st = mgState;
    if (!st || st.gameId !== 'hair') return;
    const curtain = $('#mgHairCurtain');
    const lbl = $('#mgHairStage');
    const idx = fullReveal ? 4 : Math.min(3, st.tries);
    const names = [
      t('1/5 · Hair only', '1/5 · Rambut saja'),
      t('2/5 · Hairline', '2/5 · Garis dahi'),
      t('3/5 · Eyes', '3/5 · Mata'),
      t('4/5 · Upper face', '4/5 · Wajah atas'),
      st.artistName
    ];
    if (curtain) curtain.style.height = HAIR_CURTAIN_PCTS[idx] + '%';
    if (lbl) lbl.textContent = names[idx];
  }

  function submitHairGuess(artist, dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    st.tries++;
    const match = artist.id === st.artistId || artist.name.toLowerCase() === st.artistName.toLowerCase();
    if (match) {
      st.done = true;
      st.guesses.push({ kind: 'right', label: artist.name });
      renderGuessHistory(st.guesses);
      updateHairCurtain(true);
      const score = Hub.scoreTries(true, st.tries, 5);
      const sum = t(`Solved in ${st.tries}/5`, `Benar ${st.tries}/5`);
      renderMiniReveal({ won: true, score, title: st.artistName, subtitle: artist.genre || t('Musician', 'Musisi'), art: st.imgUrl, trackId: artist.topSong && artist.topSong.trackId, dailySlot, gameId: 'hair', shortSummary: sum, detail: `${sum} · ${st.artistName}` });
      return;
    }
    st.guesses.push({ kind: 'wrong', label: artist.name });
    renderGuessHistory(st.guesses);
    if (st.tries >= st.maxTries) {
      st.done = true;
      updateHairCurtain(true);
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: st.artistName, subtitle: t('Mystery musician', 'Musisi misterius'), art: st.imgUrl, trackId: null, dailySlot, gameId: 'hair', shortSummary: sum, detail: `${sum} · ${st.artistName}` });
    } else {
      updateHairCurtain(false);
    }
  }

  function skipHairGuess(dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    st.tries++;
    st.guesses.push({ kind: 'skip', label: t('Skipped · revealed more', 'Lewati · tirai dibuka') });
    renderGuessHistory(st.guesses);
    if (st.tries >= st.maxTries) {
      st.done = true;
      updateHairCurtain(true);
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: st.artistName, subtitle: t('Mystery musician', 'Musisi misterius'), art: st.imgUrl, trackId: null, dailySlot, gameId: 'hair', shortSummary: sum, detail: `${sum} · ${st.artistName}` });
    } else {
      updateHairCurtain(false);
    }
  }

  /* ================= GAME 4: MUSIC FACT OR CAP ================= */
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
      ? t('5 quick music claims — 20 points each!', '5 pernyataan musik cepat — 20 poin tiap jawaban benar!')
      : t('Endless music trivia — 3 lives!', 'Trivia musik tanpa batas — 3 nyawa!');
    renderGuessHistory([]);
    renderFactClaim();
  }

  function renderFactClaim() {
    const st = mgState;
    if (!st || st.gameId !== 'fact') return;
    const item = st.deck[st.idx];
    if (!item) return;
    const [isFact, , claimEn, claimId] = item;
    const best = Number(LS.get(FACT_BEST_KEY, 0)) || 0;

    const statusLine = st.isDaily
      ? `${t('Claim', 'Soal')} ${st.idx + 1}/5 · ${st.correct * 20} ${t('pts', 'poin')}`
      : `${'♥'.repeat(st.lives)}${'♡'.repeat(Math.max(0, 3 - st.lives))} · ${t('Score', 'Skor')} ${st.correct} · ${t('Best', 'Terbaik')} ${best}`;

    $('#mgBody').innerHTML =
      `<div class="mg-fact-status">${esc(statusLine)}</div>` +
      `<div class="mg-fact-card"><p class="mg-fact-claim">“${esc(isId() ? claimId : claimEn)}”</p></div>` +
      `<div id="mgFactFeedback" class="mg-fact-fb" hidden></div>`;

    $('#mgControls').innerHTML =
      `<div class="mg-fact-btns">` +
        `<button id="mgBtnFact" class="btn ghostbtn mg-fact-btn is-fact" type="button">✓ ${esc(t('FACT', 'FAKTA'))}</button>` +
        `<button id="mgBtnCap" class="btn ghostbtn mg-fact-btn is-cap" type="button">✕ ${esc(t('CAP', 'HOAX'))}</button>` +
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
    if (ok) {
      st.correct++;
      if (!st.isDaily) {
        const best = Number(LS.get(FACT_BEST_KEY, 0)) || 0;
        if (st.correct > best) LS.set(FACT_BEST_KEY, st.correct);
      }
    } else if (!st.isDaily) {
      st.lives--;
    }

    const stEl = $('.mg-fact-status');
    if (stEl) {
      const best = Number(LS.get(FACT_BEST_KEY, 0)) || 0;
      stEl.textContent = st.isDaily
        ? `${t('Claim', 'Soal')} ${st.idx + 1}/5 · ${st.correct * 20} ${t('pts', 'poin')}`
        : `${'♥'.repeat(Math.max(0, st.lives))}${'♡'.repeat(Math.max(0, 3 - st.lives))} · ${t('Score', 'Skor')} ${st.correct} · ${t('Best', 'Terbaik')} ${best}`;
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
          title: `${st.correct} ${t('correct in a row!', 'jawaban benar!')}`,
          subtitle: `${t('Personal best', 'Skor terbaik')}: ${best}`,
          art: '',
          trackId: null,
          dailySlot: null,
          gameId: 'fact'
        });
      }
    };
  }

  /* ================= GAME 5: LYRIC GUESS ================= */
  function initLyricGuess(seed, dailySlot) {
    const bank = Data.lyricBank || [];
    const targetRow = Hub.pickDeterministic(bank, seed, 1);
    if (!targetRow) return;
    // [trackId, title, artist, art, year, diff, lines]
    const [trackId, title, artist, art, year, , lines] = targetRow;
    mgState = { gameId: 'lyric', trackId, title, artist, art, year, lines, tries: 0, maxTries: 5, guesses: [], done: false };

    $('#mgSubtitle').textContent = t('Guess the song from its lyrics — each skip reveals another line.', 'Tebak lagu dari liriknya — tiap lewati membuka 1 baris lagi.');
    renderGuessHistory([]);
    renderLyricLines(false);

    bindMiniSearch({
      placeholder: t('Type song title or artist…', 'Ketik judul lagu atau artis…'),
      mode: 'song',
      skipLabel: t('+1 line', '+1 baris'),
      onPick: (song) => submitLyricGuess(song, dailySlot),
      onSkip: () => skipLyricGuess(dailySlot)
    });
  }

  function renderLyricLines(showAll) {
    const st = mgState;
    if (!st || st.gameId !== 'lyric') return;
    const count = showAll ? st.lines.length : Math.min(st.lines.length, st.tries + 1);
    const pts = Hub.scoreTries(true, st.tries + 1, 5);
    $('#mgBody').innerHTML =
      `<div class="mg-lyric-meta">${esc(t(`Line ${count}/5`, `Baris ${count}/5`))} · ${showAll ? '' : esc(`+${pts} ${t('pts if solved now', 'poin jika benar sekarang')}`)}</div>` +
      `<div class="mg-lyric-card">` +
        st.lines.slice(0, count).map((ln, idx) =>
          `<p class="mg-lyric-line${idx === count - 1 && !showAll ? ' is-fresh' : ''}">“${esc(ln)}”</p>`
        ).join('') +
      `</div>`;
  }

  function submitLyricGuess(pick, dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    st.tries++;
    const sameTrack = (pick.trackId && String(pick.trackId) === String(st.trackId)) ||
      (pick.title.toLowerCase() === st.title.toLowerCase() && pick.artist.toLowerCase() === st.artist.toLowerCase());
    const sameArt = pick.artist && pick.artist.toLowerCase() === st.artist.toLowerCase();

    if (sameTrack) {
      st.done = true;
      st.guesses.push({ kind: 'right', label: `${pick.title} — ${pick.artist}` });
      renderGuessHistory(st.guesses);
      renderLyricLines(true);
      const score = Hub.scoreTries(true, st.tries, 5);
      const sum = t(`Solved in ${st.tries}/5`, `Benar ${st.tries}/5`);
      renderMiniReveal({ won: true, score, title: st.title, subtitle: `${st.artist} · ${st.year}`, art: st.art, trackId: st.trackId, dailySlot, gameId: 'lyric', shortSummary: sum, detail: `${sum} · ${st.title}` });
      return;
    }
    st.guesses.push({
      kind: sameArt ? 'near' : 'wrong',
      label: sameArt ? `${pick.title} — ${pick.artist} (${t('Right artist!', 'Artis benar!')})` : `${pick.title} — ${pick.artist}`
    });
    renderGuessHistory(st.guesses);
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderLyricLines(true);
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: st.title, subtitle: `${st.artist} · ${st.year}`, art: st.art, trackId: st.trackId, dailySlot, gameId: 'lyric', shortSummary: sum, detail: `${sum} · ${st.title}` });
    } else {
      renderLyricLines(false);
    }
  }

  function skipLyricGuess(dailySlot) {
    const st = mgState;
    if (!st || st.done) return;
    st.tries++;
    st.guesses.push({ kind: 'skip', label: t('Skipped · revealed next line', 'Lewati · baris baru dibuka') });
    renderGuessHistory(st.guesses);
    if (st.tries >= st.maxTries) {
      st.done = true;
      renderLyricLines(true);
      const sum = t('Missed', 'Gagal');
      renderMiniReveal({ won: false, score: 0, title: st.title, subtitle: `${st.artist} · ${st.year}`, art: st.art, trackId: st.trackId, dailySlot, gameId: 'lyric', shortSummary: sum, detail: `${sum} · ${st.title}` });
    } else {
      renderLyricLines(false);
    }
  }

  /* ================= Boot & Event Wiring ================= */
  function init(appBridge) {
    bridge = appBridge;

    const openBtn = $('#openDailyHub');
    if (openBtn) openBtn.onclick = showDailyHub;
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
      const txt = Hub.shareText(hubState, hubState.day, location.origin + '/', isId() ? 'id' : 'en');
      if (bridge && bridge.copyText) bridge.copyText(txt, 'daily_hub_share');
    };
    const dhMenuBtn = $('#dhMenuBtn');
    if (dhMenuBtn) dhMenuBtn.onclick = () => {
      if (bridge && bridge.showLobby) bridge.showLobby();
    };

    // Streak popovers (Lobby + Daily Hub)
    function toggleStreakPop(anchorBtn) {
      const pop = $('#streakPopover');
      if (!pop) return;
      const wasHidden = pop.hidden;
      if (wasHidden) {
        loadHubState();
        renderStreakPopover(Hub.streakOverview(combinedCompletedDays(), todayStr()));
        pop.hidden = false;
      } else {
        pop.hidden = true;
      }
    }
    const spBtn = $('#streakPillBtn');
    if (spBtn) spBtn.onclick = (e) => { e.stopPropagation(); toggleStreakPop(spBtn); };
    const dhSpBtn = $('#dhStreakBtn');
    if (dhSpBtn) dhSpBtn.onclick = (e) => { e.stopPropagation(); toggleStreakPop(dhSpBtn); };
    document.addEventListener('click', (e) => {
      const pop = $('#streakPopover');
      if (pop && !pop.hidden && !pop.contains(e.target) && e.target !== spBtn && e.target !== dhSpBtn) {
        pop.hidden = true;
      }
    });

    // Free-play More Music Games buttons in lobby
    document.querySelectorAll('[data-minigame]').forEach((btn) => {
      btn.addEventListener('click', () => startFreeMiniGame(btn.dataset.minigame));
    });

    syncLang();
    setInterval(refreshLobbyDailyUI, 30000);
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
    const shareBtn = $('#dhShareBtn');
    if (shareBtn) shareBtn.textContent = t('Share result', 'Bagikan hasil');
    const menuBtn = $('#dhMenuBtn');
    if (menuBtn) menuBtn.textContent = t('Back to menu', 'Kembali ke menu');
    const stepBack = $('#dhStepBackBtn');
    if (stepBack) stepBack.textContent = t('Back to Daily', 'Kembali ke Daily');
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
