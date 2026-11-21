/* TuneUp — Spotify-Wrapped-style shareable PNG score card (spoiler-free). */
(function (root) {
  'use strict';

  const STAGE_LABELS = ['Easy', 'Medium', 'Hard', 'Expert', 'Impossible'];
  const PALETTE = {
    emerald: { acc: '#25e07d', accL: '#58ffad', glow: 'rgba(37,224,125,0.28)' },
    gold:    { acc: '#e3c74a', accL: '#ffe270', glow: 'rgba(227,199,74,0.26)' },
    purple:  { acc: '#a78bfa', accL: '#c4b5fd', glow: 'rgba(155,123,245,0.30)' }
  };
  const ATTEMPT_COLORS = {
    right: '#25e07d',
    near:  '#f5b13d',
    wrong: '#f2555a',
    skip:  '#587063',
    empty: 'rgba(255,255,255,0.08)'
  };

  function rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function fitText(ctx, value, x, y, size, color, weight, maxWidth, align, family) {
    let s = String(value == null ? '' : value);
    let sz = size;
    const fam = family || 'General Sans';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = weight + ' ' + sz + 'px "' + fam + '", system-ui, sans-serif';
    while (ctx.measureText(s).width > maxWidth && sz > 22) {
      sz -= 1;
      ctx.font = weight + ' ' + sz + 'px "' + fam + '", system-ui, sans-serif';
    }
    if (ctx.measureText(s).width > maxWidth) {
      while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
      s += '…';
    }
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
    return ctx.measureText(s).width;
  }

  function buildCardData(input) {
    const kind = input && input.kind ? input.kind : 'run';
    const host = String((input && input.url) || 'https://tuneup.pages.dev/')
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    if (kind === 'artist') {
      const won = !!input.won;
      const maxTries = Math.max(1, Number(input.maxTries) || 10);
      const rawRows = Array.isArray(input.rows) ? input.rows : [];
      const rows = rawRows.slice(0, maxTries).map((r) =>
        Array.from({ length: 6 }, (_, i) => {
          const s = Array.isArray(r) ? r[i] : '';
          return (s === 'exact' || s === 'close') ? s : 'miss';
        })
      );
      const tries = Number.isFinite(Number(input.tries)) ? Math.max(0, Number(input.tries)) : rows.length;
      const hintsUsed = Math.max(0, Number(input.hintsUsed) || 0);
      const best = Math.max(0, Number(input.best) || 0);
      const verdict = String(input.verdict || (won ? ('Solved in ' + tries + (tries === 1 ? ' try!' : ' tries!')) : 'Mystery unsolved'));
      const subParts = [best > 0 ? ('Best streak ' + best) : 'Top 450 global roster'];
      if (hintsUsed > 0 && !/\bhints?\b/i.test(verdict)) subParts.push(hintsUsed + (hintsUsed === 1 ? ' hint' : ' hints'));
      return {
        kind: 'artist',
        theme: 'purple',
        kicker: 'ARTIST DETECTIVE',
        scoreMain: won ? String(tries) : 'X',
        scoreSub: '/ ' + maxTries,
        subtitle: subParts.join(' · '),
        verdict,
        rows,
        host,
        filename: 'tuneup-artist-detective-score.png'
      };
    }

    if (kind === 'duel') {
      const deck = input.deck === 'year' ? 'Release Year' : 'Spotify Streams';
      const history = Array.isArray(input.history) ? input.history : [];
      return {
        kind: 'duel',
        theme: 'gold',
        kicker: 'MUSIC DUEL · ' + deck.toUpperCase(),
        scoreMain: String(Math.max(0, Number(input.score) || 0)),
        scoreSub: 'streak',
        subtitle: 'Best ' + Math.max(0, Number(input.best) || 0) + ' · ' + deck,
        verdict: String(input.verdict || 'Duel Complete'),
        history: history.map((h) => !!(h && h.won)),
        host,
        filename: 'tuneup-duel-score.png'
      };
    }

    const daily = input.mode === 'daily';
    const custom = input.mode === 'custom';
    const isSpotify = !!input.isSpotify;
    const rawTotal = Number(input.total);
    const total = daily ? 1 : (Number.isInteger(rawTotal) && rawTotal >= 1 ? rawTotal : 5);
    const ladder = Array.isArray(input.ladder) && input.ladder.length ? input.ladder : [0.1, 0.5, 2, 8, 15];
    const rows = Array.from({ length: total }, (_, i) => {
      const st = (input.stages || [])[i];
      const done = !!(st && st.done);
      const won = done && !!st.won;
      const gs = done && Array.isArray(st.guesses) ? st.guesses : [];
      const at = gs.findIndex((g) => g && g.t === 'right');
      const sec = ladder[at];
      return {
        label: daily ? 'Daily' : custom ? 'Song ' + (i + 1) : (STAGE_LABELS[i] || ('Song ' + (i + 1))),
        won,
        done,
        result: !done ? '—' : won ? (Number.isFinite(sec) ? (sec % 1 === 0 ? sec + 's' : sec.toFixed(1) + 's') : 'Solved') : 'Missed',
        attempts: Array.from({ length: 5 }, (_, j) => {
          const t = gs[j] && gs[j].t;
          return (t === 'right' || t === 'near' || t === 'skip') ? t : t ? 'wrong' : 'empty';
        })
      };
    });
    const score = rows.filter((r) => r.won).length;
    const plSrc = String(input.playlistSource || '').toLowerCase();
    const plKicker = plSrc === 'apple' ? 'APPLE MUSIC' : plSrc === 'youtube' ? 'YOUTUBE PLAYLIST' : 'SPOTIFY PLAYLIST';
    return {
      kind: daily ? 'daily' : total > 5 ? 'playlist' : 'run',
      theme: isSpotify ? 'emerald' : custom ? 'purple' : 'emerald',
      kicker: daily ? 'DAILY CHALLENGE' : isSpotify ? plKicker : custom ? 'ARTIST CHALLENGE' : 'CLASSIC RUN',
      scoreMain: String(score),
      scoreSub: '/ ' + total,
      subtitle: daily
        ? String(input.day || '') + (input.streak > 0 ? ' · ' + input.streak + '-day streak' : '')
        : String(input.subtitle || 'All songs'),
      verdict: String(input.verdict || (score === total ? 'Flawless run!' : 'Run complete')),
      rows,
      host,
      filename: 'tuneup-' + (daily ? 'daily' : isSpotify ? 'spotify' : custom ? 'artist' : 'classic') + '-score.png'
    };
  }

  function renderCard(data) {
    const model = data && data.kicker ? data : buildCardData(data || {});
    const pal = PALETTE[model.theme] || PALETTE.emerald;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    // Deep atmospheric dark-emerald canvas + spotlight glow
    ctx.fillStyle = '#05100b';
    ctx.fillRect(0, 0, 1080, 1350);

    const g1 = ctx.createRadialGradient(540, 120, 30, 540, 180, 740);
    g1.addColorStop(0, pal.glow);
    g1.addColorStop(0.55, 'rgba(14,48,32,0.18)');
    g1.addColorStop(1, 'rgba(5,16,11,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, 1080, 1350);

    const g2 = ctx.createRadialGradient(140, 1180, 20, 140, 1180, 560);
    g2.addColorStop(0, 'rgba(37,224,125,0.14)');
    g2.addColorStop(1, 'rgba(5,16,11,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle outer hairline frame
    rr(ctx, 44, 44, 992, 1262, 46);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top wordmark "TuneUp"
    ctx.font = '800 58px "Unbounded", "Cabinet Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f2fbf6';
    ctx.fillText('Tune', 92, 142);
    const tuneW = ctx.measureText('Tune').width;
    ctx.fillStyle = pal.acc;
    ctx.fillText('Up', 92 + tuneW, 142);

    // Mode pill top-right
    ctx.font = '800 22px "General Sans", sans-serif';
    const kickerW = Math.min(460, ctx.measureText(model.kicker).width + 44);
    rr(ctx, 988 - kickerW, 100, kickerW, 48, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = pal.acc;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    fitText(ctx, model.kicker, 988 - kickerW / 2, 132, 22, pal.accL, 800, kickerW - 28, 'center', 'General Sans');

    // Hero score block
    fitText(ctx, model.verdict, 92, 250, 44, '#f2fbf6', 800, 896, 'left', 'Cabinet Grotesk');
    fitText(ctx, model.subtitle, 92, 298, 28, '#9cb6a7', 600, 896, 'left', 'General Sans');

    const scoreW = fitText(ctx, model.scoreMain, 86, 488, 198, pal.acc, 800, 460, 'left', 'Unbounded');
    fitText(ctx, model.scoreSub, 106 + scoreW, 480, 56, '#d9ece2', 700, 380, 'left', 'Cabinet Grotesk');

    // Inner glass board panel
    rr(ctx, 84, 548, 912, 534, 34);
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (model.kind === 'artist') {
      const cols = ['DEBUT', 'TYPE', 'GENDER', 'GENRE', 'COUNTRY', 'RANK'];
      const tileW = 114;
      const gapX = 16;
      const gridW = cols.length * tileW + (cols.length - 1) * gapX;
      const startX = Math.round(84 + (912 - gridW) / 2);
      cols.forEach((lbl, c) => {
        fitText(ctx, lbl, startX + c * (tileW + gapX) + tileW / 2, 598, 18, '#9cb6a7', 800, tileW, 'center', 'General Sans');
      });
      const rows = model.rows || [];
      if (!rows.length) {
        fitText(ctx, 'No guesses made.', 540, 825, 36, '#9cb6a7', 600, 820, 'center', 'General Sans');
      } else {
        const n = rows.length;
        const tileH = n <= 5 ? 56 : n <= 7 ? 44 : 34;
        const gapY = n <= 5 ? 14 : n <= 7 ? 12 : 9;
        const totalH = n * tileH + (n - 1) * gapY;
        const startY = Math.round(622 + (432 - totalH) / 2);
        const rad = tileH >= 48 ? 14 : 10;
        rows.forEach((row, r) => {
          const y = startY + r * (tileH + gapY);
          row.forEach((st, c) => {
            const x = startX + c * (tileW + gapX);
            rr(ctx, x, y, tileW, tileH, rad);
            if (st === 'exact') {
              ctx.fillStyle = '#25e07d';
              ctx.fill();
            } else if (st === 'close') {
              ctx.fillStyle = '#f5b13d';
              ctx.fill();
            } else {
              ctx.fillStyle = 'rgba(255,255,255,0.12)';
              ctx.fill();
              ctx.strokeStyle = 'rgba(255,255,255,0.16)';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          });
        });
      }
    } else if (model.kind === 'duel') {
      fitText(ctx, 'ROUND HISTORY', 130, 622, 24, '#9cb6a7', 800, 820, 'left', 'General Sans');
      const items = model.history.slice(0, 28);
      if (!items.length) {
        fitText(ctx, 'Ready for a rematch.', 130, 720, 36, '#f2fbf6', 600, 820, 'left', 'General Sans');
      } else {
        const cols = 7;
        const size = 92;
        const gap = 24;
        items.forEach((won, idx) => {
          const r = Math.floor(idx / cols);
          const c = idx % cols;
          const x = 130 + c * (size + gap);
          const y = 660 + r * (size + gap);
          rr(ctx, x, y, size, size, 20);
          ctx.fillStyle = won ? 'rgba(37,224,125,0.18)' : 'rgba(242,85,90,0.20)';
          ctx.fill();
          ctx.strokeStyle = won ? '#25e07d' : '#f2555a';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          fitText(ctx, won ? '✓' : '✕', x + size / 2, y + 62, 44, won ? '#58ffad' : '#ff8a8e', 800, size, 'center', 'General Sans');
        });
      }
    } else if (model.kind === 'daily') {
      const row = model.rows[0];
      fitText(ctx, row.won ? 'Solved in ' + row.result : 'Missed today\'s track', 132, 650, 44, '#f2fbf6', 800, 816, 'left', 'Cabinet Grotesk');
      row.attempts.forEach((type, i) => {
        const x = 132 + i * 168;
        const y = 716;
        rr(ctx, x, y, 144, 144, 28);
        ctx.fillStyle = ATTEMPT_COLORS[type] || ATTEMPT_COLORS.empty;
        ctx.fill();
        if (type === 'right') {
          fitText(ctx, '✓', x + 72, y + 92, 66, '#04120a', 800, 120, 'center', 'General Sans');
        }
      });
      fitText(ctx, '5 tries · Spoiler-free daily summary', 132, 956, 26, '#9cb6a7', 600, 816, 'left', 'General Sans');
    } else if (model.kind === 'playlist') {
      fitText(ctx, 'PLAYLIST BREAKDOWN (' + model.rows.length + ' SONGS)', 130, 616, 22, '#9cb6a7', 800, 820, 'left', 'General Sans');
      const shown = model.rows.slice(0, 40);
      const cols = 10;
      const size = 68;
      const gap = 16;
      shown.forEach((row, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const x = 130 + c * (size + gap);
        const y = 648 + r * (size + gap);
        rr(ctx, x, y, size, size, 16);
        ctx.fillStyle = !row.done ? 'rgba(255,255,255,0.06)' : row.won ? 'rgba(37,224,125,0.20)' : 'rgba(242,85,90,0.22)';
        ctx.fill();
        ctx.strokeStyle = !row.done ? 'rgba(255,255,255,0.14)' : row.won ? '#25e07d' : '#f2555a';
        ctx.lineWidth = 2;
        ctx.stroke();
        fitText(ctx, !row.done ? '·' : row.won ? '✓' : '✕', x + size / 2, y + 46, 32, !row.done ? '#7b9486' : row.won ? '#58ffad' : '#ff8a8e', 800, size, 'center', 'General Sans');
      });
      if (model.rows.length > 40) {
        fitText(ctx, '+' + (model.rows.length - 40) + ' more songs in full run', 130, 1028, 24, '#9cb6a7', 600, 820, 'left', 'General Sans');
      }
    } else {
      const n = model.rows.length;
      const step = n <= 3 ? 112 : 96;
      const startY = Math.round(825 - ((n - 1) * step) / 2);
      model.rows.forEach((row, i) => {
        const y = startY + i * step;
        fitText(ctx, row.label, 128, y, 32, '#f2fbf6', 700, 260, 'left', 'General Sans');
        row.attempts.forEach((type, j) => {
          rr(ctx, 434 + j * 54, y - 30, 40, 40, 11);
          ctx.fillStyle = ATTEMPT_COLORS[type] || ATTEMPT_COLORS.empty;
          ctx.fill();
          if (type === 'right') {
            fitText(ctx, '✓', 454 + j * 54, y - 2, 22, '#04120a', 800, 36, 'center', 'General Sans');
          }
        });
        fitText(ctx, row.result, 952, y, 30, row.won ? pal.accL : '#7b9486', 700, 200, 'right', 'General Sans');
        if (i < n - 1) {
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(128, y + Math.round(step * 0.35), 824, 1.5);
        }
      });
    }

    // Bottom CTA footer
    fitText(ctx, 'Can you beat my score?', 92, 1172, 46, '#f2fbf6', 800, 896, 'left', 'Cabinet Grotesk');
    fitText(ctx, model.host, 92, 1232, 34, pal.accL, 700, 620, 'left', 'General Sans');
    fitText(ctx, 'Free music games in your browser', 988, 1232, 24, '#7b9486', 600, 440, 'right', 'General Sans');

    return canvas;
  }

  async function prepareFile(input) {
    const model = buildCardData(input || {});
    if (typeof document !== 'undefined' && document.fonts && typeof document.fonts.load === 'function') {
      await Promise.race([
        Promise.all([
          document.fonts.load('800 58px "Unbounded"'),
          document.fonts.load('800 46px "Cabinet Grotesk"'),
          document.fonts.load('700 32px "General Sans"')
        ]).catch(() => {}),
        new Promise((r) => setTimeout(r, 1800))
      ]);
    }
    const canvas = renderCard(model);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png');
    });
    return {
      file: new File([blob], model.filename, { type: 'image/png' }),
      model
    };
  }

  async function shareOrSave(input) {
    const { file } = await prepareFile(input);
    try {
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'TuneUp Score Card' });
        return 'shared';
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return 'downloaded';
  }

  const api = { buildCardData, renderCard, prepareFile, shareOrSave };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuneUpCard = api;
})(typeof window !== 'undefined' ? window : globalThis);
