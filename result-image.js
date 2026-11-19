(function (root) {
  'use strict';
  const labels = ['Easy', 'Medium', 'Hard', 'Expert', 'Impossible'];
  const colors = { right:'#25e07d', wrong:'#f2555a', near:'#f5b13d', skip:'#6b8477', empty:'#1b3026' };
  const ink = '#e9f5ee', dim = '#a2baac', bg = '#05100b';

  function createModel(data) {
    const daily = data.mode === 'daily', custom = data.mode === 'custom';
    const total = daily ? 1 : 5;
    const rows = Array.from({length:total}, (_, i) => {
      const stage = (data.stages || [])[i];
      const done = !!(stage && stage.done), won = done && !!stage.won;
      const guesses = done ? stage.guesses || [] : [];
      const at = guesses.findIndex(g => g.t === 'right');
      const duration = (data.ladder || [])[at];
      return {
        label: daily ? 'Daily' : custom ? 'Song ' + (i + 1) : labels[i],
        won,
        result: !done ? 'Not played' : won ? (Number.isFinite(duration) ? duration + 's' : 'Solved') : 'Missed',
        attempts: Array.from({length:5}, (_, j) => {
          const type = guesses[j] && guesses[j].t;
          return ['right','near','skip'].includes(type) ? type : type ? 'wrong' : 'empty';
        })
      };
    });
    return { mode: daily ? 'daily' : custom ? 'custom' : 'regular', total, rows,
      score:rows.filter(r => r.won).length,
      title:daily ? 'Daily Challenge' : custom ? 'Artist challenge' : 'Classic',
      subtitle:daily ? String(data.day || '') : String(data.subtitle || 'All songs'),
      streak:daily ? Math.max(0, Number(data.streak) || 0) : 0,
      url:String(data.url || 'https://tuneup.pages.dev/')
    };
  }

  function render(model) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image rendering is unavailable');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    function text(value, x, y, size, color = ink, weight = 500, maxWidth = 904, align = 'left', family = 'General Sans') {
      let s = String(value);
      ctx.textAlign = align;
      ctx.font = weight + ' ' + size + 'px "' + family + '", sans-serif';
      while (ctx.measureText(s).width > maxWidth && size > 24) {
        size -= 1; ctx.font = weight + ' ' + size + 'px "' + family + '", sans-serif';
      }
      if (ctx.measureText(s).width > maxWidth) {
        while (s.length && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
        s += '…';
      }
      ctx.fillStyle = color; ctx.fillText(s, x, y);
    }
    function line(y) { ctx.fillStyle = '#284034'; ctx.fillRect(88, y, 904, 2); }
    function attempt(type, x, y, size) {
      ctx.fillStyle = colors[type]; ctx.fillRect(x, y, size, size);
      if (type === 'right') {
        ctx.strokeStyle = bg; ctx.lineWidth = Math.max(3, size * .07);
        ctx.beginPath(); ctx.moveTo(x + size * .24, y + size * .5);
        ctx.lineTo(x + size * .43, y + size * .68); ctx.lineTo(x + size * .77, y + size * .3); ctx.stroke();
      }
    }
    text('name the', 88, 117, 60, ink, 800, 904, 'left', 'Cabinet Grotesk');
    const brandWidth = ctx.measureText('name the ').width;
    text('track', 88 + brandWidth, 117, 60, colors.right, 800, 904, 'left', 'Cabinet Grotesk');
    text(model.title, 88, 231, 43, ink, 600);
    text(model.subtitle, 88, 279, 30, dim);
    text(model.score, 78, 466, 190, colors.right, 800, 350, 'left', 'Cabinet Grotesk');
    const scoreWidth = ctx.measureText(String(model.score)).width;
    text('/ ' + model.total, 99 + scoreWidth, 463, 74, ink, 600);
    text(model.total === 1 ? 'song guessed' : 'songs guessed', 992, 460, 30, dim, 500, 440, 'right');
    line(516);
    if (model.mode === 'daily') {
      const row = model.rows[0];
      text(row.won ? 'Guessed in ' + row.result : row.result, 88, 610, 46, ink, 600);
      row.attempts.forEach((type, i) => attempt(type, 88 + i * 184, 664, 168));
      text('5 tries', 88, 895, 28, dim);
      text(model.streak + '-win streak', 992, 895, 28, dim, 500, 440, 'right');
    } else {
      model.rows.forEach((row, i) => {
        const y = 594 + i * 94;
        text(row.label, 88, y, 34, ink, 600, 300);
        row.attempts.forEach((type, j) => attempt(type, 449 + j * 50, y - 30, 34));
        text(row.result, 992, y, 31, row.won ? colors.right : dim, 600, 280, 'right');
        if (i < 4) { ctx.fillStyle='#142a1e';ctx.fillRect(88, y + 34, 904, 1); }
      });
    }
    line(1070);
    text('Your turn.', 88, 1160, 58, ink, 700, 904, 'left', 'Cabinet Grotesk');
    text(model.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), 88, 1221, 34, colors.right, 600);
    text('Guess the song from 0.1 seconds.', 88, 1270, 27, dim);
    return canvas;
  }

  async function prepare(model) {
    if (document.fonts) {
      await Promise.race([
        Promise.all([document.fonts.load('600 34px "General Sans"'), document.fonts.load('800 60px "Cabinet Grotesk"')]).catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);
    }
    const canvas = render(model);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not create image')), 'image/png'));
    return new File([blob], 'name-the-track-' + model.mode + '.png', { type:'image/png' });
  }

  function download(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; document.body.appendChild(a);
    a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function deliver(file, environment) {
    const nav = environment ? environment.navigator : navigator;
    const save = environment ? environment.download : download;
    try {
      if (nav.share && nav.canShare && nav.canShare({files:[file]})) {
        await nav.share({files:[file], title:'TuneUp'});
        return 'shared';
      }
    } catch (error) {
      if (error.name === 'AbortError') return 'cancelled';
    }
    save(file);
    return 'downloaded';
  }

  async function writeMultiClipboard(file, text, nav, ClipboardItemCtor, BlobCtor) {
    const textBlob = new BlobCtor([text], { type: 'text/plain' });
    await nav.clipboard.write([
      new ClipboardItemCtor({ 'image/png': file, 'text/plain': textBlob })
    ]);
  }

  async function copy(fileOrPromise, text, environment) {
    const env = environment || {};
    const nav = env.navigator || (typeof navigator !== 'undefined' ? navigator : {});
    const ClipboardItemCtor = env.ClipboardItem !== undefined
      ? env.ClipboardItem
      : (typeof ClipboardItem !== 'undefined' ? ClipboardItem : null);
    const BlobCtor = env.Blob || (typeof Blob !== 'undefined' ? Blob : null);
    const content = String(text || '');

    if (fileOrPromise && nav.clipboard && typeof nav.clipboard.write === 'function' && ClipboardItemCtor && BlobCtor) {
      if (typeof fileOrPromise.then === 'function') {
        try {
          // Preserve gesture activation when PNG encoding is still finishing.
          await writeMultiClipboard(
            fileOrPromise.then(f => {
              if (!f) throw new Error('Image unavailable');
              return f;
            }),
            content, nav, ClipboardItemCtor, BlobCtor
          );
          return 'copied-both';
        } catch (error) {
          try {
            const resolved = await fileOrPromise;
            if (resolved) {
              await writeMultiClipboard(resolved, content, nav, ClipboardItemCtor, BlobCtor);
              return 'copied-both';
            }
          } catch (retryError) { /* Fall through to text copy. */ }
        }
      } else {
        try {
          await writeMultiClipboard(fileOrPromise, content, nav, ClipboardItemCtor, BlobCtor);
          return 'copied-both';
        } catch (error) { /* Fall through to text copy. */ }
      }
    }

    if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      try {
        await nav.clipboard.writeText(content);
        return 'copied-text';
      } catch (error) { /* Fall through to synchronous text copy fallback. */ }
    }

    if (typeof env.copyText === 'function' && env.copyText(content)) {
      return 'copied-text';
    }
    return 'failed';
  }

  const api = { createModel, render, prepare, deliver, copy };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ResultImage = api;
})(typeof window !== 'undefined' ? window : globalThis);
