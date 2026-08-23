/* Guess The Song — satu sesi = 5 tahap, Easy naik terus sampai Impossible.
   Gagal di satu tahap tidak menghentikan sesi; skor akhirnya X/5.
   Audio: potongan pratinjau 30 detik dari iTunes Search API (publik, tanpa API key).
   Catatan: teks yang dilihat pemain berbahasa Inggris; komentar sengaja
   dibiarkan berbahasa Indonesia supaya gampang kamu baca sendiri. */
(function () {
  'use strict';

  /* ================= konfigurasi ================= */

  const TRIES = 6;

  // ladder = panjang potongan (detik) yang terbuka di tebakan ke-1..ke-6
  const DIFFS = {
    easy:       { label: 'Easy',       tiers: [1],    ladder: [2, 3, 5, 8, 12, 16] },
    medium:     { label: 'Medium',     tiers: [1, 2], ladder: [1, 2, 4, 7, 11, 16] },
    hard:       { label: 'Hard',       tiers: [2, 3], ladder: [0.5, 1, 2, 4, 8, 14] },
    expert:     { label: 'Expert',     tiers: [3, 4], ladder: [0.3, 0.6, 1.2, 2.5, 5, 10] },
    impossible: { label: 'Impossible', tiers: [4, 5], ladder: [0.1, 0.3, 0.7, 1.5, 3, 6] }
  };
  // urutan tahap dalam satu sesi
  const ORDER  = ['easy', 'medium', 'hard', 'expert', 'impossible'];
  const STAGES = ORDER.length;

  const REGIONS = { all: 'All regions', gl: 'Western', as: 'Asia' };
  const GENRES  = {
    all: 'All genres', pop: 'Pop', rock: 'Rock', hiphop: 'Hip-hop',
    rnb: 'R&B / Soul', edm: 'Electronic', indie: 'Indie', lain: 'Other'
  };
  const ERAS = {
    all: { label: 'All eras',    hit: function ()  { return true; } },
    old: { label: 'Before 2000', hit: function (y) { return y > 0 && y < 2000; } },
    y00: { label: '2000s',      hit: function (y) { return y >= 2000 && y < 2010; } },
    y10: { label: '2010s',      hit: function (y) { return y >= 2010 && y < 2020; } },
    y20: { label: '2020s',      hit: function (y) { return y >= 2020; } }
  };
  const MODES = { daily: 'Daily', endless: 'Free play' };

  // penanda versi yang bukan rekaman aslinya — dipakai untuk menolak hasil iTunes
  const JUNK = /\b(live|acoustic|remix|reprise|demo|karaoke|tribute|instrumental|cover|remaster|remastered|edit|version|ver|mix|orchestral|piano|lullaby|workout|sped up|slowed|made famous|originally performed|in the style of|backing track)\b/i;

  /* ================= util ================= */

  const $  = (s) => document.querySelector(s);
  const el = (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; };

  // buang tanda baca/diakritik supaya "Cariño" == "Carino", "Don't" == "Dont", dst.
  const norm = (s) => (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    // apostrof DIHAPUS, bukan jadi spasi -- "Don't" harus jadi "dont",
    // karena itu yang diketik pemain. Kalau jadi "don t" pencarian meleset.
    .replace(/['’ʼ`´]/g, '')
    .replace(/\$/g, 's')          // judul bergaya: "Dat $tick" -> "dat stick"
    .replace(/\b(feat|ft|with|and|the|dari|from)\b/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ').trim();

  const slug = (s) => norm(s[0] + ' ' + s[1]).replace(/ /g, '-');

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
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

  const fmt = (n) => (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + 's';

  function todayKey(d) {
    d = d || new Date();
    const p = (x) => String(x).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  const LS = {
    get(k, dflt) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : dflt; } catch (e) { return dflt; } },
    set(k, v)    { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k)       { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ================= state ================= */

  const S = {
    region: LS.get('tl:region', 'all'),
    genre:  LS.get('tl:genre', 'all'),
    era:    LS.get('tl:era', 'all'),
    mode:   LS.get('tl:mode', 'daily'),
    vol:    LS.get('tl:vol', 0.8),
    muted:  LS.get('tl:muted', false),

    stage: 0,        // tahap ke-0..4 dalam sesi ini
    stages: [],      // hasil tiap tahap: {slug,title,artist,guesses,done,won}
    runDone: false,

    pool: [],
    song: null,      // entri katalog tahap berjalan
    meta: null,      // hasil resolve iTunes
    guesses: [],     // tebakan tahap berjalan
    done: false,
    won: false,
    startAt: 0,
    picked: null,
    loading: false,
    epoch: 0         // penanda pemuatan, membatalkan request usang
  };

  if (!REGIONS[S.region]) S.region = 'all';
  if (!GENRES[S.genre]) S.genre = 'all';
  if (!ERAS[S.era]) S.era = 'all';
  if (!MODES[S.mode]) S.mode = 'daily';

  // kunci penyimpanan, seed sesi harian, dan cakupan statistik
  const filterKey = () => S.region + ':' + S.genre + ':' + S.era;
  const runKey    = () => 'tl:run:' + filterKey() + ':' +
                          (S.mode === 'daily' ? todayKey() : 'bebas');

  const D       = () => DIFFS[ORDER[S.stage]];
  const ladder  = () => D().ladder;
  const maxLen  = () => ladder()[TRIES - 1];
  const step    = () => Math.min(S.guesses.length, TRIES - 1);
  const limit   = () => ladder()[step()];
  const score   = () => S.stages.filter((x) => x && x.won).length;

  /* ================= katalog & pencarian ================= */

  const ALL = (window.SONGS || []).map((s, i) => ({
    i, title: s[0], artist: s[1], tier: s[2], region: s[3],
    genre: s[4] || 'lain', year: s[5] || 0, art: s[6] || '',
    slug: slug(s), hay: norm(s[0] + ' ' + s[1])
  }));

  // lagu yang lolos filter pemain, tanpa memandang tingkat kesulitan
  function filtered() {
    return ALL.filter((s) =>
      (S.region === 'all' || s.region === S.region) &&
      (S.genre === 'all' || s.genre === S.genre) &&
      ERAS[S.era].hit(s.year));
  }

  function buildPool() {
    // Wilayah, genre, dan era adalah pilihan sadar pemain -- tidak pernah
    // dilonggarkan. Hanya rentang tier tahap ini yang dilebarkan kalau
    // lagu yang cocok terlalu sedikit.
    const base = filtered();
    const tiers = D().tiers;
    const lo0 = Math.min.apply(null, tiers), hi0 = Math.max.apply(null, tiers);
    let pool = [], spread = 0;
    while (spread <= 4) {
      pool = base.filter((s) => s.tier >= lo0 - spread && s.tier <= hi0 + spread);
      if (pool.length >= 12) break;
      spread++;
    }
    if (!pool.length) pool = base.slice();

    pool.sort((a, b) => a.slug < b.slug ? -1 : 1); // urutan stabil, tak tergantung urutan file
    S.pool = pool;
    S.tierWidened = spread > 0 && base.length > 0;
  }

  function searchIndex(q) {
    const nq = norm(q);
    if (!nq) return [];
    const toks = nq.split(' ');
    const out = [];
    for (const s of ALL) {
      if (!toks.every((t) => s.hay.indexOf(t) >= 0)) continue;
      const nt = norm(s.title);
      let sc = 3;
      if (nt.indexOf(nq) === 0) sc = 0;
      else if (nt.indexOf(nq) > 0) sc = 1;
      else if (norm(s.artist).indexOf(nq) === 0) sc = 2;
      out.push({ s, sc });
    }
    out.sort((a, b) => a.sc - b.sc || a.s.title.length - b.s.title.length);
    return out.slice(0, 8).map((x) => x.s);
  }

  /* ================= iTunes ================= */

  function scoreResult(r, song, rank) {
    if (!r.previewUrl) return -1;
    const rt = norm(r.trackName), ra = norm(r.artistName);
    const wt = norm(song.title),  wa = norm(song.artist);
    let sc = 0;

    if (rt === wt) sc += 6; else if (rt.indexOf(wt) === 0) sc += 4;
    else if (rt.indexOf(wt) >= 0 || wt.indexOf(rt) >= 0) sc += 2; else return -1;

    // "feat." bikin nama artis tak persis sama — jangan dihukum terlalu berat,
    // kalau tidak versi live/karaoke justru menang skor.
    if (ra === wa) sc += 5; else if (ra.indexOf(wa) >= 0 || wa.indexOf(ra) >= 0) sc += 4; else sc -= 5;

    // tolak versi live/akustik/remix — kecuali judul yang dicari memang begitu
    const junky = JUNK.test(r.trackName) || JUNK.test(r.collectionName || '') || JUNK.test(r.artistName);
    if (junky && !JUNK.test(song.title)) sc -= 9;

    // judul polos tanpa embel-embel kurung lebih mungkin jadi rekaman aslinya
    if (!/[([]/.test(r.trackName) && !/[([]/.test(song.title)) sc += 1.5;

    // urutan iTunes sudah terurut relevansi; pakai sebagai pemecah seri
    return sc + (14 - rank) * 0.04;
  }

  async function resolve(song) {
    const ck = 'tl:trk3:' + song.slug;   // naikkan versi kalau aturan pencocokan berubah
    const c = LS.get(ck);
    if (c && c.exp > Date.now() && c.preview) return c;

    // Aksen di kata kunci bikin pencarian iTunes gagal total: "No One Noticed
    // The Marías" nol hasil, "No One Noticed The Marias" ketemu. Tanda baca lain
    // (' # $ &) justru membantu, jadi hanya diakritiknya yang dibuang.
    const term = encodeURIComponent(
      (song.title + ' ' + song.artist).normalize('NFD').replace(/\p{M}/gu, ''));
    // Toko US: sejak katalognya jadi Barat + Asia, cakupannya paling lengkap di sana
    // -- dan sama dengan toko yang dipakai tools/enrich.sh, jadi sampulnya cocok.
    const url = 'https://itunes.apple.com/search?term=' + term + '&entity=song&limit=14&country=US';
    const res = await fetch(url);
    if (!res.ok) throw new Error('http ' + res.status);
    const data = JSON.parse(await res.text()); // endpoint balas text/javascript

    const results = data.results || [];
    let best = null, bs = 0;
    for (let i = 0; i < results.length; i++) {
      const sc = scoreResult(results[i], song, i);
      if (sc > bs) { bs = sc; best = results[i]; }
    }
    if (!best) throw new Error('tidak ketemu');

    const rec = {
      preview: best.previewUrl,
      art: (best.artworkUrl100 || '').replace('100x100', '600x600'),
      title: best.trackName,
      artist: best.artistName,
      album: best.collectionName || '',
      year: (best.releaseDate || '').slice(0, 4),
      link: best.trackViewUrl || '',
      exp: Date.now() + 7 * 864e5
    };
    LS.set(ck, rec);
    return rec;
  }

  /* ================= audio ================= */

  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = S.muted ? 0 : S.vol;

  let raf = 0, playing = false;

  function seek(t) {
    return new Promise((done) => {
      if (Math.abs(audio.currentTime - t) < 0.03) return done();
      let fin = false;
      const ok = () => { if (fin) return; fin = true; audio.removeEventListener('seeked', ok); done(); };
      audio.addEventListener('seeked', ok);
      setTimeout(ok, 900);
      try { audio.currentTime = t; } catch (e) { ok(); }
    });
  }

  function stopAudio() {
    cancelAnimationFrame(raf);
    playing = false;
    audio.pause();
    audio.volume = S.muted ? 0 : S.vol;
    UI.head(null);
    UI.playState('idle');
    UI.readout(null);
  }

  async function playClip() {
    if (playing) { stopAudio(); return; }
    if (!S.meta || !S.meta.preview) return;

    // setelah tahapnya selesai, biarkan lagunya diputar lebih panjang
    const room = (isFinite(audio.duration) ? audio.duration : 30) - S.startAt - 0.2;
    const len = S.done ? Math.max(maxLen(), Math.min(room, 18)) : limit();
    UI.playState('loading');
    try {
      await seek(S.startAt);
      await audio.play();
    } catch (e) {
      UI.playState('idle');
      UI.status('The browser blocked playback. Hit play once more.', true);
      return;
    }
    playing = true;
    UI.playState('playing');

    const tick = () => {
      if (!playing) return;
      const t = Math.max(0, audio.currentTime - S.startAt);
      UI.head(t / maxLen());
      UI.readout(t);
      const left = len - t;
      if (left <= 0) { stopAudio(); return; }
      // S.vol dibaca ulang tiap frame, bukan disimpan di awal: kalau disimpan,
      // geseran volume di tengah lagu akan ditimpa terus oleh nilai lama.
      const v = S.muted ? 0 : S.vol;
      audio.volume = v * (left < 0.1 ? Math.max(0, left / 0.1) : 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  /* ================= sesi & pemuatan lagu ================= */

  function saveRun() {
    const stages = S.stages.slice();
    if (S.song) {
      stages[S.stage] = {
        slug: S.song.slug,
        title: (S.meta && S.meta.title) || S.song.title,
        artist: (S.meta && S.meta.artist) || S.song.artist,
        guesses: S.guesses, done: S.done, won: S.won
      };
    }
    S.stages = stages;
    LS.set(runKey(), { stage: S.stage, runDone: S.runDone, stages: stages });
  }

  function loadRun() {
    const r = LS.get(runKey());
    if (r && r.stages) {
      S.stages = r.stages;
      S.stage = Math.min(r.stage || 0, STAGES - 1);
      S.runDone = !!r.runDone;
    } else {
      S.stages = []; S.stage = 0; S.runDone = false;
    }
    const cur = S.stages[S.stage];
    S.guesses = (cur && cur.guesses) || [];
    S.done = !!(cur && cur.done);
    S.won  = !!(cur && cur.won);
  }

  function pickSong(offset) {
    // jangan ulang lagu yang sudah keluar di tahap sebelumnya dalam sesi ini
    const used = S.stages.filter(Boolean).map((x) => x.slug);
    const avail = S.pool.filter((s) => used.indexOf(s.slug) < 0);
    const from = avail.length ? avail : S.pool;

    if (S.mode === 'daily') {
      const seed = hash(todayKey() + '|' + filterKey() + '|' + S.stage);
      const r = rng(seed + (offset || 0) * 7919);
      return from[Math.floor(r() * from.length)];
    }
    const recent = LS.get('tl:recent', []);
    const fresh = from.filter((s) => recent.indexOf(s.slug) < 0);
    const src = fresh.length > 3 ? fresh : from;
    return src[Math.floor(Math.random() * src.length)];
  }

  async function load() {
    const me = ++S.epoch;
    stopAudio();
    buildPool();

    if (!S.pool.length) {
      S.song = null; S.meta = null; S.loading = false;
      UI.playState('idle');
      UI.render();
      UI.status('No songs match. Loosen the filters.', true);
      return;
    }

    const cur = S.stages[S.stage];
    let song = cur && cur.slug ? (ALL.find((s) => s.slug === cur.slug) || null) : null;

    S.meta = null; S.picked = null; S.loading = true;
    UI.playState('loading');
    UI.status('Loading song…');
    UI.render();

    for (let k = 0; k < 5; k++) {
      const cand = song || pickSong(k);
      try {
        const meta = await resolve(cand);
        if (me !== S.epoch) return;             // pemuatan lain sudah menggantikan ini
        S.song = cand; S.meta = meta; S.loading = false;

        audio.src = meta.preview;
        audio.load();
        await new Promise((r) => {
          if (audio.readyState >= 1) return r();
          const on = () => { audio.removeEventListener('loadedmetadata', on); r(); };
          audio.addEventListener('loadedmetadata', on);
          setTimeout(r, 6000);
        });
        if (me !== S.epoch) return;

        const dur = isFinite(audio.duration) && audio.duration > 1 ? audio.duration : 30;
        const hi = Math.max(0, dur - maxLen() - 0.4);
        S.startAt = Math.min(1.2 + rng(hash(cand.slug))() * 9, hi);

        saveRun();
        UI.playState('idle');
        UI.status(S.done ? '' : 'Ready. Hit play for the first ' + fmt(limit()) + '.');
        UI.render();
        if (S.done) setTimeout(() => UI.result(), 250);
        return;
      } catch (e) {
        if (me !== S.epoch) return;
        song = null;                            // kandidat gagal → coba berikutnya
      }
    }

    S.loading = false;
    UI.playState('idle');
    UI.status('Could not load the song. Check your connection and reload.', true);
  }

  /* ================= alur permainan ================= */

  function submitGuess(pick) {
    if (S.done || !S.song) return;
    const right = pick.slug === S.song.slug;
    const near = !right && norm(pick.artist) === norm(S.song.artist);
    S.guesses.push({ t: right ? 'right' : (near ? 'near' : 'wrong'), title: pick.title, artist: pick.artist });
    if (right) return finish(true);
    if (S.guesses.length >= TRIES) return finish(false);
    stopAudio();
    saveRun(); UI.render();
    UI.status(near ? 'Right artist, wrong song. ' + fmt(limit()) + ' unlocked.'
                   : 'Not it. ' + fmt(limit()) + ' unlocked now.');
    UI.clearInput();
  }

  function skip() {
    if (S.done || !S.song) return;
    S.guesses.push({ t: 'skip' });
    if (S.guesses.length >= TRIES) return finish(false);
    stopAudio();
    saveRun(); UI.render();
    UI.status('Skipped. ' + fmt(limit()) + ' unlocked now.');
    UI.clearInput();
  }

  function finish(won) {
    S.done = true; S.won = won;
    stopAudio();
    // Gagal tidak menghentikan sesi -- tahap berikutnya tetap jalan.
    if (S.stage === STAGES - 1) S.runDone = true;
    saveRun();
    if (S.runDone && S.mode === 'daily') recordStats();
    UI.render(); UI.clearInput();
    UI.status('');
    // Diputar SEKARANG, bukan setelah modal muncul: makin dekat ke klik aslinya,
    // makin aman dari kebijakan autoplay browser -- sekaligus terasa lebih responsif.
    // Kalah pun tetap diputar: justru saat itulah kamu ingin dengar lagunya.
    UI.autoplay();
    setTimeout(() => UI.result(), 420);
  }

  function nextStage() {
    closeAll();
    if (S.stage >= STAGES - 1) { UI.runResult(); return; }
    S.stage++;
    const cur = S.stages[S.stage];
    S.guesses = (cur && cur.guesses) || [];
    S.done = !!(cur && cur.done);
    S.won  = !!(cur && cur.won);
    S.song = null; S.meta = null;
    saveRun();
    UI.game();
    load();
  }

  function newRun() {
    closeAll();
    S.stages.filter(Boolean).forEach((x) => pushRecent(x.slug));
    LS.del(runKey());
    S.stages = []; S.stage = 0; S.runDone = false;
    S.guesses = []; S.done = false; S.won = false;
    S.song = null; S.meta = null;
    UI.game();
    load();
  }

  /* ================= statistik ================= */

  // satu sesi harian per kombinasi filter, jadi statistiknya juga per kombinasi
  const statKey = () => 'tl:stats:' + filterKey();
  const blankStats = () => ({ runs: 0, total: 0, best: 0, streak: 0, bestStreak: 0, dist: [0, 0, 0, 0, 0, 0], last: '' });

  function recordStats() {
    const st = Object.assign(blankStats(), LS.get(statKey(), {}));
    const today = todayKey();
    if (st.last === today) return;              // satu sesi harian dihitung sekali
    const sc = score();
    st.runs++;
    st.total += sc;
    st.dist[sc]++;
    st.best = Math.max(st.best, sc);
    const y = new Date(); y.setDate(y.getDate() - 1);
    st.streak = st.last === todayKey(y) ? st.streak + 1 : 1;
    st.bestStreak = Math.max(st.bestStreak, st.streak);
    st.last = today;
    LS.set(statKey(), st);
  }

  /* ================= UI ================= */

  const UI = {
    q: $('#q'), dd: $('#dd'), track: $('#track'),
    fill: $('#trackFill'), seams: $('#trackSeams'), headEl: $('#trackHead'),
    play: $('#play'), out: $('#readout'), st: $('#status'),
    skipBtn: $('#skip'), skipLabel: $('#skipLabel'),
    sel: -1, list: [],

    /* --- kontrol lobi --- */
    buildControls() {
      const fill = (sel, opts, cur, save) => {
        sel.innerHTML = '';
        for (const k in opts) {
          const o = document.createElement('option');
          o.value = k;
          o.textContent = opts[k].label || opts[k];
          o.selected = k === cur;
          sel.appendChild(o);
        }
        sel.dataset.on = cur === 'all' ? '0' : '1';
        sel.onchange = () => {
          LS.set(save, sel.value); S[save.slice(3)] = sel.value;
          UI.buildControls(); UI.refreshLobby();
        };
      };
      fill($('#region'), REGIONS, S.region, 'tl:region');
      fill($('#genre'),  GENRES,  S.genre,  'tl:genre');
      fill($('#era'),    ERAS,    S.era,    'tl:era');

      const md = $('#mode');
      md.innerHTML = '';
      for (const k in MODES) {
        const b = el('button');
        b.textContent = MODES[k];
        b.setAttribute('aria-pressed', k === S.mode);
        b.onclick = () => {
          if (S.mode === k) return;
          S.mode = k; LS.set('tl:mode', k);
          UI.buildControls(); UI.refreshLobby();
        };
        md.appendChild(b);
      }
    },

    /* --- rangkaian tahap --- */
    steps(host, live) {
      host.innerHTML = '';
      ORDER.forEach((k, i) => {
        if (i) { const a = el('li', 'arrow'); a.textContent = '›'; host.appendChild(a); }
        const li = el('li');
        li.dataset.k = k;
        const rec = S.stages[i];
        let mark = '';
        if (live) {
          if (rec && rec.done) { li.classList.add(rec.won ? 'win' : 'lose'); mark = rec.won ? '✓' : '✕'; }
          else if (i === S.stage) li.classList.add('now');
        }
        li.innerHTML = DIFFS[k].label + (mark ? ' <span class="mark">' + mark + '</span>' : '');
        host.appendChild(li);
      });
    },

    /* --- panggung --- */
    playState(s) {
      this.play.dataset.s = s;
      this.play.classList.toggle('playing', s === 'playing');
      this.play.disabled = s === 'loading' && S.loading;
      this.play.setAttribute('aria-label',
        s === 'playing' ? 'Stop playback' : 'Play the clip');
      $('#coverPlay').dataset.playing = s === 'playing' ? '1' : '0';
    },
    readout(t) {
      this.out.textContent = t === null ? fmt(S.done ? maxLen() : limit()) : t.toFixed(1) + 's';
    },
    head(f) {
      if (f === null) { this.headEl.classList.remove('on'); return; }
      this.headEl.classList.add('on');
      this.headEl.style.left = Math.min(100, f * 100) + '%';
    },
    status(msg, err) {
      this.st.textContent = msg || '';
      this.st.classList.toggle('err', !!err);
    },

    // Lobi hanya menghitung ulang kumpulan lagunya -- tidak memuat apa pun.
    // Lagu baru diambil saat tombol "Mulai main" ditekan.
    refreshLobby() {
      loadRun();
      buildPool();
      this.poolInfo();

      $('#ladderNote').innerHTML = '5 stages, the clip gets shorter every time · ' +
        'from <b>' + fmt(DIFFS.easy.ladder[0]) + '</b> on Easy down to ' +
        '<b>' + fmt(DIFFS.impossible.ladder[0]) + '</b> on Impossible · ' +
        TRIES + ' tries per stage';

      const note = $('#resumeNote');
      const jalan = S.stages.filter(Boolean).length;
      if (!S.pool.length) note.textContent = '';
      else if (S.runDone) note.textContent = 'This run is done — you scored ' + score() + '/' + STAGES + '.';
      else if (jalan || S.guesses.length)
        note.textContent = 'You have a run in progress (stage ' + (S.stage + 1) + ' of ' + STAGES + ').';
      else note.textContent = '';

      $('#start').disabled = !S.pool.length;
      $('#start').textContent = S.runDone ? 'See result'
        : (jalan || S.guesses.length ? 'Continue' : 'Start');
    },

    lobby() {
      stopAudio();
      S.epoch++;                       // batalkan pemuatan yang masih berjalan
      $('#game').hidden = true;
      $('#lobby').hidden = false;
      this.buildControls();
      this.refreshLobby();
    },

    game() {
      $('#lobby').hidden = true;
      $('#game').hidden = false;
      $('#gameMode').textContent = [
        S.region === 'all' ? null : REGIONS[S.region],
        S.genre === 'all' ? null : GENRES[S.genre],
        S.era === 'all' ? null : ERAS[S.era].label,
        MODES[S.mode]
      ].filter(Boolean).join(' · ');
      this.steps($('#steps'), true);
      $('#stageNow').innerHTML = 'Stage <b>' + (S.stage + 1) + '</b> of ' + STAGES +
        ' · <b>' + D().label + '</b>';
    },

    poolInfo() {
      const p = $('#poolInfo');
      const n = S.pool.length;      // jumlah lagu yang benar-benar bisa keluar di tahap ini
      const total = filtered().length;
      let msg = '', warn = false;
      if (!total) { msg = 'No songs match these filters.'; warn = true; }
      else if (total < STAGES * 3) { msg = 'Only ' + total + ' songs match — narrow filters.'; warn = true; }
      else { msg = total + ' songs in this pool.'; }
      p.textContent = msg;
      p.classList.toggle('warn', warn);
    },
    bar() {
      const L = ladder(), max = maxLen();
      this.seams.innerHTML = '';
      for (let i = 0; i < L.length - 1; i++) {
        const s = el('i');
        s.style.left = (L[i] / max * 100) + '%';
        this.seams.appendChild(s);
      }
      this.fill.style.width = ((S.done ? max : limit()) / max * 100) + '%';
    },

    /* --- daftar tebakan --- */
    render() {
      this.steps($('#steps'), true);   // centang/silang tahap ikut segar tiap redraw
      this.bar();
      this.readout(null);

      const L = ladder();
      const last = S.guesses.length >= TRIES - 1;
      const delta = last ? 0 : L[S.guesses.length + 1] - L[S.guesses.length];
      this.skipLabel.textContent = S.done ? 'See result' : (last ? 'Give up' : 'Skip +' + fmt(delta));
      this.skipBtn.dataset.s = S.done ? 'done' : 'play';
      this.skipBtn.disabled = !S.song;
      this.q.disabled = S.done || !S.song;
      this.play.disabled = !S.meta;
    },

    /* --- dropdown pencarian --- */
    openDD(list) {
      this.list = list; this.sel = -1;
      this.dd.innerHTML = '';
      if (!list.length) {
        const e = el('div', 'dd-empty');
        e.textContent = 'Not in the catalogue.';
        this.dd.appendChild(e);
      }
      list.forEach((s, i) => {
        const b = el('button', 'dd-item');
        b.type = 'button';
        b.innerHTML =
          // sengaja TANPA loading="lazy": daftarnya cuma 8 gambar kecil, dan
          // lazy membuat browser menunda pemuatan sampai dropdown dianggap terlihat
          (s.art ? '<img class="dd-art" src="' + esc(s.art) + '" alt="">'
                 : '<span class="dd-art ph" aria-hidden="true"></span>') +
          '<span class="dd-txt">' + esc(s.title) +
          '<small>' + esc(s.artist) + '</small></span>';
        // touchstart juga ditangani: di HP, blur pada input bisa menutup daftar
        // sebelum mousedown sempat jalan.
        const pilih = (e) => { e.preventDefault(); UI.choose(i); };
        b.onmousedown = pilih;
        b.addEventListener('touchstart', pilih, { passive: false });
        this.dd.appendChild(b);
      });
      this.dd.hidden = false;
      this.q.setAttribute('aria-expanded', 'true');
    },
    closeDD() {
      this.dd.hidden = true; this.sel = -1;
      this.q.setAttribute('aria-expanded', 'false');
    },
    move(d) {
      if (this.dd.hidden || !this.list.length) return;
      this.sel = (this.sel + d + this.list.length) % this.list.length;
      [].forEach.call(this.dd.children, (c, i) => c.classList.toggle('sel', i === this.sel));
      const n = this.dd.children[this.sel];
      if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest' });
    },
    // Memilih dari daftar LANGSUNG mengirim tebakan -- tidak ada tombol terpisah.
    choose(i) {
      const s = this.list[i];
      if (!s) return;
      this.q.value = s.title + ' · ' + s.artist;
      this.closeDD();
      submitGuess(s);
    },
    clearInput() {
      this.q.value = '';
      $('#clear').hidden = true;
      this.closeDD();
    },

    /* --- hasil satu tahap --- */
    result() {
      const m = S.meta || {}, sg = S.song || {};
      const n = S.guesses.length;

      $('#resultModal .result').className = 'sheet result ' + (S.won ? 'win' : 'lose');

      const v = $('#verdict');
      v.className = 'verdict ' + (S.won ? 'win' : 'lose');
      v.textContent = S.won
        ? ['First listen. Unreal.', 'Nailed it.', 'Got there.',
           'Safe.', 'Close one!', 'Last try. Respect.'][n - 1]
        : 'No luck. The song was:';

      // Panjang potongan saat tebakan benar -- ini yang bikin "0.1s" terasa keren,
      // jauh lebih bermakna daripada "tebakan ke-3".
      const badge = $('#badge');
      if (S.won) {
        const at = S.guesses.findIndex((g) => g.t === 'right');
        badge.className = 'badge';
        badge.textContent = 'Got it in ' + fmt(ladder()[at]) + '!';
      } else {
        badge.className = 'badge lose';
        badge.textContent = 'Never got it';
      }

      const img = $('#cover');
      img.src = m.art || '';
      img.alt = 'Sampul ' + (m.title || sg.title || '');
      $('#rTitle').textContent = m.title || sg.title || '';
      $('#rArtist').textContent = [m.artist || sg.artist, m.album].filter(Boolean).join(' · ');
      $('#rMeta').textContent = m.year || '';
      $('#squares').textContent = squares(S.guesses);

      const link = $('#listen');
      if (m.link) { link.href = m.link; link.hidden = false; } else link.hidden = true;

      $('#next').textContent = S.stage >= STAGES - 1
        ? 'See final result'
        : 'Stage ' + (S.stage + 2) + ': ' + DIFFS[ORDER[S.stage + 1]].label + ' →';

      open($('#resultModal'));
      confetti('#confetti', S.won ? 'win' : 'lose');
    },

    /* --- hasil satu sesi penuh --- */
    runResult() {
      const sc = score();
      const v = $('#runVerdict');
      v.className = 'verdict ' + (sc >= 3 ? 'win' : 'lose');
      v.textContent = ['Zero. Try again tomorrow.', 'One down.', 'Not bad.',
                       'Nice run!', 'So close to perfect!', 'Perfect. Every stage.'][sc];
      $('#runScore').textContent = sc;

      $('#runList').innerHTML = ORDER.map((k, i) => {
        const r = S.stages[i];
        if (!r || !r.done) {
          return '<li><span class="lvl">' + DIFFS[k].label + '</span>' +
                 '<span class="nm">belum dimainkan</span></li>';
        }
        const at = r.guesses.findIndex((g) => g.t === 'right');
        return '<li class="' + (r.won ? 'win' : 'lose') + '">' +
          '<span class="lvl">' + DIFFS[k].label + '</span>' +
          '<span class="sq">' + (r.won ? '🟩' : '🟥') + '</span>' +
          '<span class="nm">' + esc(r.title + ' · ' + r.artist) + '</span>' +
          '<span class="at">' + (r.won ? fmt(DIFFS[k].ladder[at]) : '✕') + '</span></li>';
      }).join('');

      $('#againRun').hidden = S.mode !== 'endless';
      $('.r-next').hidden = S.mode !== 'daily';

      open($('#runModal'));
      confetti('#runConfetti', sc >= 3 ? 'win' : 'lose');
    },

    // Begitu tebakan benar, langsung putar lagunya. Dipanggil dari dalam
    // penanganan klik tombol Tebak, jadi masih dalam jendela "user activation"
    // dan tidak diblokir kebijakan autoplay browser.
    autoplay() {
      if (!S.meta || playing) return;
      playClip();
    },

    stats() {
      const st = Object.assign(blankStats(), LS.get(statKey(), {}));
      $('#statScope').textContent = 'Daily run · ' + [
        REGIONS[S.region], GENRES[S.genre], ERAS[S.era].label
      ].join(' · ');
      const avg = st.runs ? (st.total / st.runs).toFixed(1) : '0';
      $('#statgrid').innerHTML =
        cell(st.runs, 'runs') + cell(avg, 'average') +
        cell(st.best, 'best') + cell(st.streak, 'streak');
      const top = Math.max.apply(null, st.dist.concat([1]));
      $('#dist').innerHTML = st.dist.map((c, i) =>
        '<div class="row"><span class="n">' + i + '</span>' +
        '<div class="bar' + (c && c === top ? ' hot' : '') + '" style="width:' +
        Math.max(8, c / top * 100) + '%">' + c + '</div></div>').join('');
      open($('#statsModal'));
    }
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cell = (v, l) => '<div><b>' + v + '</b><small>' + l + '</small></div>';

  function squares(gs) {
    let s = '';
    for (let i = 0; i < TRIES; i++) {
      const g = gs[i];
      s += !g ? '⬜' : g.t === 'right' ? '🟩' : g.t === 'skip' ? '⬛' : g.t === 'near' ? '🟨' : '🟥';
    }
    return s;
  }

  function shareText() {
    const tags = [];
    if (S.region !== 'all') tags.push(REGIONS[S.region]);
    if (S.genre !== 'all') tags.push(GENRES[S.genre]);
    if (S.era !== 'all') tags.push(ERAS[S.era].label);
    tags.push(S.mode === 'daily' ? todayKey() : 'bebas');

    const lines = ORDER.map((k, i) => {
      const r = S.stages[i];
      if (!r || !r.done) return '⬜ ' + DIFFS[k].label;
      const at = r.guesses.findIndex((g) => g.t === 'right');
      return (r.won ? '🟩 ' : '🟥 ') + DIFFS[k].label + (r.won ? ' ' + fmt(DIFFS[k].ladder[at]) : '');
    });

    return 'Guess The Song · ' + tags.join(' · ') + ' · ' + score() + '/' + STAGES +
           '\n' + lines.join('\n');
  }

  function pushRecent(sl) {
    if (!sl) return;
    const r = LS.get('tl:recent', []);
    r.unshift(sl);
    LS.set('tl:recent', r.slice(0, 40));
  }

  /* ================= confetti ================= */

  // Hujan kertas di layar hasil. Canvas polos, tanpa pustaka luar.
  //   mode 'win'  -> ledakan hijau ke atas, meriah
  //   mode 'lose' -> serpihan merah kelabu jatuh lesu dari atas
  let confettiStop = null;
  function confetti(sel, mode) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lose = mode === 'lose';
    const cv = $(sel);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.width = innerWidth * dpr;
    const H = cv.height = innerHeight * dpr;
    const cols = lose
      ? ['#f2555a', '#8e3b3f', '#5c6b62', '#3d4a43', '#a8524f']
      : ['#25e07d', '#ffffff', '#12b862', '#8ef7bd', '#d8fbe8'];
    const bits = [];

    const n = lose ? 90 : 120;
    for (let i = 0; i < n; i++) {
      bits.push({
        x: lose ? W * Math.random() : W * (0.34 + Math.random() * 0.32),
        // Mulai tepat di atas bingkai dan langsung punya kecepatan jatuh, kalau
        // tidak partikelnya masih di luar layar saat animasinya sudah lewat.
        y: lose ? -H * 0.22 * Math.random() : H * 0.44,
        vx: (Math.random() - 0.5) * (lose ? 2.2 : 11) * dpr,
        vy: lose ? (4 + Math.random() * 4) * dpr : (-4 - Math.random() * 9) * dpr,
        w: (4 + Math.random() * 5) * dpr,
        h: (6 + Math.random() * 8) * dpr,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * (lose ? 0.1 : 0.32),
        col: cols[(Math.random() * cols.length) | 0]
      });
    }
    const grav = lose ? 0.12 : 0.28;

    let rafc = 0, prev = performance.now();
    (function frame(now) {
      const dt = Math.min((now - prev) / 16.67, 3);
      prev = now;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const b of bits) {
        b.vy += grav * dpr * dt;
        b.vx *= 0.996;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.vr * dt;
        if (b.y < H + 50 * dpr) alive++;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.col;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      }
      if (alive) rafc = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    })(prev);

    confettiStop = () => { cancelAnimationFrame(rafc); ctx.clearRect(0, 0, W, H); };
  }

  /* ================= modal & toast ================= */

  function open(m) { m.hidden = false; }
  function closeAll() {
    if (confettiStop) { confettiStop(); confettiStop = null; }
    [].forEach.call(document.querySelectorAll('.modal'), (m) => m.hidden = true);
  }

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal') || e.target.hasAttribute('data-close')) closeAll();
  });

  let toastT = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, 2200);
  }

  /* ================= hitung mundur ================= */

  function tickClock() {
    const now = new Date();
    const mid = new Date(now); mid.setHours(24, 0, 0, 0);
    let s = Math.max(0, Math.floor((mid - now) / 1000));
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    const p = (x) => String(x).padStart(2, '0');
    const txt = p(h) + ':' + p(m) + ':' + p(s);
    $('#countdown').textContent = txt;
    $('#countdown2').textContent = txt;
  }

  /* ================= event ================= */

  UI.play.onclick = playClip;
  $('#coverPlay').onclick = playClip;

  $('#start').onclick = () => {
    loadRun();
    if (S.runDone) { UI.runResult(); return; }
    UI.game();
    load();
  };
  $('#back').onclick = () => { closeAll(); UI.lobby(); };
  $('#next').onclick = nextStage;
  $('#againRun').onclick = newRun;
  UI.skipBtn.onclick = () => { if (S.done) UI.result(); else skip(); };

  UI.q.addEventListener('input', () => {
    $('#clear').hidden = !UI.q.value;
    const v = UI.q.value.trim();
    if (v.length < 1) return UI.closeDD();
    UI.openDD(searchIndex(v));
  });
  UI.q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); UI.move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); UI.move(-1); }
    else if (e.key === 'Escape') { UI.closeDD(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (!UI.dd.hidden && UI.sel >= 0) UI.choose(UI.sel);
      else if (!UI.dd.hidden && UI.list.length === 1) UI.choose(0);
      else toast('Pick a song from the list first');
    }
  });
  UI.q.addEventListener('blur', () => setTimeout(() => UI.closeDD(), 120));
  $('#clear').onclick = () => { UI.clearInput(); UI.q.focus(); };

  const inGame = () => !$('#game').hidden;
  document.addEventListener('keydown', (e) => {
    const typing = e.target === UI.q;
    if (e.key === 'Escape') { closeAll(); return; }
    if (!inGame()) {
      // di lobi, Enter = mulai main
      if (e.key === 'Enter' && !$('#start').disabled) { e.preventDefault(); $('#start').click(); }
      return;
    }
    if (e.code === 'Space' && !typing) { e.preventDefault(); playClip(); }
    if (e.key === 'Tab' && !typing && !e.shiftKey && !S.done) { e.preventDefault(); skip(); }
  });

  $('#volume').value = Math.round(S.vol * 100);
  $('#volume').oninput = (e) => {
    S.vol = e.target.value / 100;
    S.muted = false;
    LS.set('tl:vol', S.vol); LS.set('tl:muted', false);
    audio.volume = S.vol;
    $('#mute').classList.remove('muted');
  };
  $('#mute').onclick = () => {
    S.muted = !S.muted;
    LS.set('tl:muted', S.muted);
    audio.volume = S.muted ? 0 : S.vol;
    $('#mute').classList.toggle('muted', S.muted);
  };
  $('#mute').classList.toggle('muted', S.muted);

  $('#statsBtn').onclick = () => UI.stats();
  $('#helpBtn').onclick = () => open($('#helpModal'));
  $('#reset').onclick = () => {
    LS.del(statKey());
    UI.stats();
    toast('Stats reset');
  };

  $('#share').onclick = async () => {
    const txt = shareText();
    try {
      await navigator.clipboard.writeText(txt);
      toast('Result copied');
    } catch (e) {
      const ta = el('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Result copied'); }
      catch (e2) { toast('Copy failed'); }
      ta.remove();
    }
  };

  audio.addEventListener('ended', stopAudio);
  audio.addEventListener('error', () => {
    if (!S.loading) UI.status('Audio failed to load. Try another song or reload.', true);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stopAudio(); });

  /* ================= mulai ================= */

  UI.buildControls();
  UI.render();
  UI.lobby();                 // selalu mulai dari layar pilih mode
  tickClock();
  setInterval(tickClock, 1000);

  if (!LS.get('tl:seen')) { LS.set('tl:seen', 1); setTimeout(() => open($('#helpModal')), 500); }
})();
