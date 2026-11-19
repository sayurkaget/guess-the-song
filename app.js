/* TuneUp — satu sesi = 5 tahap, Easy naik terus sampai Impossible.
   Gagal di satu tahap tidak menghentikan sesi; skor akhirnya X/5.
   Audio: potongan pratinjau 30 detik dari iTunes Search API (publik, tanpa API key).
   Catatan: teks yang dilihat pemain berbahasa Inggris; komentar sengaja
   dibiarkan berbahasa Indonesia supaya gampang kamu baca sendiri. */
(function () {
  'use strict';

  /* ================= konfigurasi ================= */

  // Panjang potongan (detik) yang terbuka di tebakan ke-1..ke-5. Sama untuk
  // semua tahap: yang naik antar-tahap hanyalah keniche-an lagunya, bukan
  // waktunya.
  const LADDER = [0.1, 0.5, 2, 8, 15];
  const TRIES  = LADDER.length;

  const DIFFS = {
    easy:       { label: 'Easy',       tiers: [1] },
    medium:     { label: 'Medium',     tiers: [1, 2] },
    hard:       { label: 'Hard',       tiers: [2, 3] },
    expert:     { label: 'Expert',     tiers: [3, 4] },
    impossible: { label: 'Impossible', tiers: [4, 5] }
  };
  // urutan tahap dalam satu sesi
  const ORDER  = ['easy', 'medium', 'hard', 'expert', 'impossible'];
  const STAGES = ORDER.length;

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

  // Identitas jawaban terpisah dari slug pencarian. Kredit kolaborasi dan
  // remaster dapat berbeda antaralbum, tetapi live/remix tetap versi berbeda.
  function recordingTitle(title) {
    return (title || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
      .replace(/[([]\s*(?:feat\.?|ft\.?|featuring|with)\s+[^)\]]*[)\]]/gi, ' ')
      .replace(/\s+(?:feat\.?|ft\.?|featuring)\s+.*$/i, ' ')
      .replace(/[([]\s*(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?\s*[)\]]/gi, ' ')
      .replace(/\s*-\s*(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?\s*$/i, ' ')
      .replace(/['’ʼ`´]/g, '').replace(/\$/g, 's')
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  const COMPOUND_ARTISTS = [
    ['tyler the creator', /\btyler\s*,\s*the\s+creator\b/gi],
    ['earth wind fire', /\bearth\s*,\s*wind\s*(?:&|and)\s*fire\b/gi],
    ['simon garfunkel', /\bsimon\s*(?:&|and)\s*garfunkel\b/gi],
    ['of monsters and men', /\bof\s+monsters\s*(?:&|and)\s*men\b/gi],
    ['mumford sons', /\bmumford\s*(?:&|and)\s*sons\b/gi],
    ['iron wine', /\biron\s*(?:&|and)\s*wine\b/gi],
    ['peter bjorn and john', /\bpeter\s+bjorn\s*(?:&|and)\s*john\b/gi],
    ['edward sharpe the magnetic zeros', /\bedward\s+sharpe\s*(?:&|and)\s*the\s+magnetic\s+zeros\b/gi],
    ['the mamas the papas', /\bthe\s+mamas\s*(?:&|and)\s*the\s+papas\b/gi]
  ];
  const ARTIST_ALIASES = { 'silk sonic': ['bruno mars', 'anderson paak'] };

  function songArtists(song) {
    const artistKey = (name) => name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
      .replace(/['’ʼ`´]/g, '').replace(/\$/g, 's').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const credits = [song.artist || ''];
    for (const m of (song.title || '').matchAll(/[([]\s*(?:feat\.?|ft\.?|featuring|with)\s+([^)\]]+)[)\]]/gi)) credits.push(m[1]);
    for (const m of (song.title || '').matchAll(/(?:^|\s)(?:feat\.?|ft\.?|featuring)\s+([^()[\]]+)/gi)) credits.push(m[1]);
    const keys = new Set();
    for (let credit of credits) {
      // Keep the full name too (e.g. Earth, Wind & Fire).
      keys.add(artistKey(credit));
      for (const [alias, pattern] of COMPOUND_ARTISTS) {
        const next = credit.replace(pattern, ',');
        if (next !== credit) {
          keys.add(alias);
          credit = next;
        }
      }
      for (const name of credit.split(/\s*(?:,|&|\b(?:featuring|feat|ft)\b\.?|\bwith\b|\band\b)\s*/i)) {
        const key = artistKey(name);
        if (key) keys.add(key);
      }
    }
    for (const [group, members] of Object.entries(ARTIST_ALIASES)) {
      if (keys.has(group)) members.forEach((m) => keys.add(m));
    }
    keys.delete('');
    return keys;
  }

  function sameArtist(a, b) {
    if (!a || !b) return false;
    const artists = songArtists(a);
    return [...songArtists(b)].some((artist) => artists.has(artist));
  }

  function sameRecording(a, b) {
    if (!a || !b) return false;
    if (a.trackId && b.trackId && String(a.trackId) === String(b.trackId)) return true;
    const title = recordingTitle(a.title);
    if (!title || title !== recordingTitle(b.title)) return false;
    return sameArtist(a, b);
  }

  function correctAnswer(pick) {
    return [pick, pick.pre].filter(Boolean).some((candidate) =>
      [S.song, S.meta].some((target) => sameRecording(candidate, target)));
  }

  function sameGuessArtist(pick) {
    return [pick, pick.pre].filter(Boolean).some((candidate) =>
      [S.song, S.meta].some((target) => sameArtist(candidate, target)));
  }

  function sameStageGuess(g, song) {
    return Boolean(g && g.t !== 'skip' && song && (
      (g.slug && song.slug && g.slug === song.slug) ||
      (norm(g.title) === norm(song.title) && norm(g.artist) === norm(song.artist))
    ));
  }

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

  const LS = {
    get(k, dflt) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : dflt; } catch (e) { return dflt; } },
    set(k, v)    { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k)       { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ================= state ================= */

  const S = {
    genre:  LS.get('tl:genre', 'all'),
    era:    LS.get('tl:era', 'all'),
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
    epoch: 0,        // penanda pemuatan, membatalkan request usang
    daily: null,
    challenge: null,
    runChallenge: null,
    custom: null     // mode artis kustom: {id,label,songs[]} -- null = mode katalog biasa
  };

  // Pilihan region lama tidak lagi berlaku; statistik Western tetap memakai kunci gl.
  LS.del('tl:region');
  if (!GENRES[S.genre]) S.genre = 'all';
  if (!ERAS[S.era]) S.era = 'all';

  // Kombinasi filter memisahkan dua hal: sesi yang berjalan dan statistiknya.
  const filterKey = () => S.daily ? 'daily:' + S.daily.day
    : S.challenge ? 'challenge:' + S.challenge.id
    : S.runChallenge ? 'run:' + S.runChallenge.ids.join('-')
    : S.custom ? 'custom:' + S.custom.id
    : ('gl:' + S.genre + ':' + S.era);

  const D       = () => DIFFS[ORDER[Math.min(S.stage, ORDER.length - 1)]];
  const ladder  = () => LADDER;
  const maxLen  = () => ladder()[TRIES - 1];
  const step    = () => Math.min(S.guesses.length, TRIES - 1);
  const limit   = () => ladder()[step()];
  const CLIP_STOPS = [0.06, 0.16, 0.32, 0.58, 1];
  const clipStop = (i, n) => (n === CLIP_STOPS.length ? CLIP_STOPS[i] : (i + 1) / n);
  const clipProgress = (t) => {
    const L = ladder(), n = L.length;
    if (!n || t <= 0) return 0;
    let prevT = 0, prevP = 0;
    for (let i = 0; i < n; i++) {
      const curT = L[i], curP = clipStop(i, n);
      if (t <= curT) {
        const ratio = Math.max(0, t - prevT) / Math.max(0.001, curT - prevT);
        return prevP + ratio * (curP - prevP);
      }
      prevT = curT; prevP = curP;
    }
    return 1;
  };
  const stageCount = () => S.daily ? 1 : S.runChallenge ? S.runChallenge.songs.length
    : (S.custom && S.custom.kind === 'spotify') ? Math.max(1, S.custom.rounds || S.custom.songs.length) : STAGES;
  const score   = () => S.stages.filter((x) => x && x.won).length;
  const gameMode = () => S.daily ? 'daily' : (S.challenge || S.runChallenge) ? 'challenge' : S.custom ? 'custom' : 'regular';
  function trackActivity(name, details = {}) {
    // Analytics must never interrupt a game (including with blockers enabled).
    try { window.PlayerAnalytics?.event(name, { mode: gameMode(), ...details }); } catch (e) {}
  }

  let sfxCtx = null;
  function playSfx(kind) {
    if (S.muted || !(S.vol > 0)) return;
    const Ctx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
    if (!Ctx) return;
    try {
      if (!sfxCtx) sfxCtx = new Ctx();
      if (sfxCtx.state === 'suspended') sfxCtx.resume().catch(() => {});
      const now = sfxCtx.currentTime;
      const gainScale = Math.min(0.08, Math.max(0.015, 0.065 * S.vol));
      const notes = kind === 'fanfare'
        ? [[523.25, 0, 0.13, 'triangle'], [659.25, 0.075, 0.14, 'triangle'], [783.99, 0.15, 0.16, 'triangle'], [1046.5, 0.23, 0.28, 'sine']]
        : kind === 'win'
        ? [[523.25, 0, 0.11, 'sine'], [659.25, 0.065, 0.13, 'sine'], [783.99, 0.13, 0.20, 'sine']]
        : kind === 'near'
        ? [[440, 0, 0.11, 'sine'], [554.37, 0.07, 0.14, 'sine']]
        : [[293.66, 0, 0.09, 'triangle'], [220, 0.065, 0.15, 'triangle']];
      for (const [freq, delay, dur, type] of notes) {
        const osc = sfxCtx.createOscillator();
        const g = sfxCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + delay);
        g.gain.setValueAtTime(0.0001, now + delay);
        g.gain.linearRampToValueAtTime(gainScale, now + delay + 0.014);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
        osc.connect(g);
        g.connect(sfxCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + dur + 0.02);
      }
    } catch (e) {}
  }

  /* ================= katalog & pencarian ================= */

  const ALL = (window.SONGS || []).filter((s) =>
    s[3] === 'gl' && window.RecordingPolicy.isStudio({ title: s[0] })).map((s, i) => ({
    i, title: s[0], artist: s[1], tier: s[2], region: s[3],
    genre: s[4] || 'lain', year: s[5] || 0, art: s[6] || '', trackId: s[7] || null,
    slug: slug(s), hay: norm(s[0] + ' ' + s[1])
  }));


  // Cari entri lagu dari slug. Di mode kustom, lagu artis didahulukan -- lagu
  // itu membawa meta iTunes yang sudah diambil (.pre), jadi tak perlu resolve ulang.
  function findSong(sl) {
    if (S.daily) { const d = S.daily.songs.find((s) => s.slug === sl); if (d) return d; }
    if (S.custom) { const c = S.custom.songs.find((s) => s.slug === sl); if (c) return c; }
    return ALL.find((s) => s.slug === sl) || null;
  }

  // lagu yang lolos filter pemain, tanpa memandang tingkat kesulitan
  function filtered() {
    if (S.custom) return S.custom.songs;
    return ALL.filter((s) =>
      (S.genre === 'all' || s.genre === S.genre) &&
      ERAS[S.era].hit(s.year));
  }

  function buildPool() {
    if (S.daily) { S.pool = S.daily.songs.slice(); S.tierWidened = false; return; }
    // Mode kustom: kumpulannya adalah seluruh lagu artis yang diambil, tanpa tier.
    if (S.custom) { S.pool = S.custom.songs.slice(); S.tierWidened = false; return; }
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
    for (const s of (S.custom ? S.custom.songs : S.daily ? [...new Map([...ALL, ...S.daily.songs].map((s) => [s.slug, s])).values()] : ALL)) {
      if (!toks.every((t) => s.hay.indexOf(t) >= 0)) continue;
      const nt = norm(s.title);
      let sc = 3;
      if (nt.indexOf(nq) === 0) sc = 0;
      else if (nt.indexOf(nq) > 0) sc = 1;
      else if (norm(s.artist).indexOf(nq) === 0) sc = 2;
      out.push({ s, sc });
    }
    // Setelah kecocokan, urutkan menurut POPULARITAS (tier rendah = makin
    // terkenal), bukan panjang judul. Batas 200 cukup untuk menampung seluruh
    // diskografi artis terbanyak (168 lagu) sambil tetap membatasi kata umum.
    out.sort((a, b) => a.sc - b.sc || a.s.tier - b.s.tier ||
                       a.s.title.length - b.s.title.length);
    return out.slice(0, 200).map((x) => x.s);
  }

  /* ================= iTunes ================= */

  function cleanSearchTitle(t) {
    return String(t || '')
      .replace(/\s*[-–—]\s*(?:\d{4}\s+)?(?:remaster(?:ed)?|radio\s+edit|single\s+version|album\s+version|original\s+mix|mono|stereo|explicit|clean|bonus\s+track|deluxe).*$/i, '')
      .replace(/\s*[\[(](?:feat\.?|ft\.?|with|remaster(?:ed)?|radio\s+edit|\d{4}\s+remaster)[^)\]]*[\])]/ig, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function primaryArtist(a) {
    return String(a || '').split(/\s*(?:,|&|;|\bfeat\.?\b|\bft\.?\b|\bx\b)\s*/i)[0].trim();
  }

  function scoreResult(r, song, rank) {
    if (!r.previewUrl || !window.RecordingPolicy.isStudio(r)) return -1;
    const rt = norm(r.trackName), ra = norm(r.artistName);
    const wt = norm(song.title),  wa = norm(song.artist);
    const crt = norm(cleanSearchTitle(r.trackName));
    const cwt = norm(cleanSearchTitle(song.title));
    let sc = 0;

    if (rt === wt) sc += 6; else if (rt.indexOf(wt) === 0) sc += 4;
    else if (rt.indexOf(wt) >= 0 || wt.indexOf(rt) >= 0) sc += 2;
    else if (cwt && crt && (crt === cwt || crt.indexOf(cwt) === 0 || cwt.indexOf(crt) === 0)) sc += 3;
    else return -1;

    // Hanya izinkan artis yang cocok / alias resmi; blokir cover band saat trackId tidak dikunci.
    const pa = norm(primaryArtist(song.artist));
    if (ra === wa) sc += 5;
    else if (ra.indexOf(wa) >= 0 || wa.indexOf(ra) >= 0 || sameArtist({ title: r.trackName, artist: r.artistName }, song)) sc += 4;
    else if (pa && pa.length >= 2 && (ra.indexOf(pa) >= 0 || norm(primaryArtist(r.artistName)) === pa)) sc += 3;
    else if (!song.trackId) return -1;
    else sc -= 5;

    // judul polos tanpa embel-embel kurung lebih mungkin jadi rekaman aslinya
    if (!/[([]/.test(r.trackName) && !/[([]/.test(song.title)) sc += 1.5;

    // urutan iTunes sudah terurut relevansi; pakai sebagai pemecah seri
    return sc + (14 - rank) * 0.04;
  }

  async function resolve(song) {
    if (song.pre) {
      if (!song.pre.fromSpotify && !window.RecordingPolicy.isStudio(song.pre)) throw new Error('Studio recording unavailable');
      return song.pre;
    }
    const ck = 'tl:trk5:' + song.slug;
    const c = LS.get(ck);
    if (c && c.exp > Date.now() && c.preview && window.RecordingPolicy.isStudio(c)) {
      if (!song.art && c.art) song.art = c.art;
      return c;
    }

    const searchItunes = async (rawQuery, useTrackId) => {
      // Aksen di kata kunci bikin pencarian iTunes gagal total: "No One Noticed
      // The Marías" nol hasil, "No One Noticed The Marias" ketemu. Tanda baca lain
      // (' # $ &) justru membantu, jadi hanya diakritiknya yang dibuang.
      const term = encodeURIComponent(rawQuery.normalize('NFD').replace(/\p{M}/gu, ''));
      const url = useTrackId
        ? 'https://itunes.apple.com/lookup?id=' + encodeURIComponent(song.trackId) + '&entity=song&country=US'
        : 'https://itunes.apple.com/search?term=' + term + '&entity=song&limit=14&country=US';
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error('http ' + res.status);
      const data = JSON.parse(await res.text()); // endpoint balas text/javascript
      const results = data.results || [];
      let best = null, bs = 0;
      for (let i = 0; i < results.length; i++) {
        if (useTrackId && String(results[i].trackId) !== String(song.trackId)) continue;
        const sc = scoreResult(results[i], song, i);
        if (sc > bs) { bs = sc; best = results[i]; }
      }
      return best;
    };

    let best = await searchItunes(song.title + ' ' + song.artist, !!song.trackId);
    if (!best && !song.trackId) {
      const cleaned = cleanSearchTitle(song.title) + ' ' + primaryArtist(song.artist);
      if (cleaned.trim().toLowerCase() !== (song.title + ' ' + song.artist).trim().toLowerCase()) {
        best = await searchItunes(cleaned, false);
      }
    }
    if (!best) throw new Error('tidak ketemu');

    const rec = {
      trackId: best.trackId,
      preview: best.previewUrl,
      art: song.hdArt || (best.artworkUrl100 || '').replace('100x100', '600x600'),
      title: best.trackName,
      artist: best.artistName,
      album: best.collectionName || '',
      year: (best.releaseDate || '').slice(0, 4),
      link: song.spotifyUrl || best.trackViewUrl || '',
      exp: Date.now() + 7 * 864e5
    };
    if (!song.art && rec.art) song.art = rec.art;
    LS.set(ck, rec);
    return rec;
  }

  /* ================= audio ================= */

  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = S.muted ? 0 : S.vol;

  let raf = 0, playing = false, playPending = false, playbackEpoch = 0;
  let cancelAudioLoad = null, cancelPendingPlay = null, bufferTimer = 0;

  function loadAudioMetadata(src) {
    return new Promise((resolve, reject) => {
      let timer;
      const finish = (error) => {
        clearTimeout(timer);
        audio.removeEventListener('loadedmetadata', ready);
        audio.removeEventListener('error', failed);
        if (cancelAudioLoad === cancel) cancelAudioLoad = null;
        error ? reject(error) : resolve();
      };
      const ready = () => finish();
      const failed = () => finish(new Error('Audio unavailable'));
      const cancel = () => finish(new DOMException('Cancelled', 'AbortError'));
      cancelAudioLoad = cancel;
      audio.addEventListener('loadedmetadata', ready);
      audio.addEventListener('error', failed);
      timer = setTimeout(() => finish(new Error('Audio timed out')), 12000);
      audio.src = src;
      audio.load();
    });
  }

  function beginPlayback() {
    return new Promise((resolve, reject) => {
      let timer;
      const finish = (error) => {
        clearTimeout(timer);
        if (cancelPendingPlay === cancel) cancelPendingPlay = null;
        error ? reject(error) : resolve();
      };
      const cancel = () => finish(new DOMException('Cancelled', 'AbortError'));
      cancelPendingPlay = cancel;
      timer = setTimeout(() => finish(new Error('Playback timed out')), 12000);
      try { Promise.resolve(audio.play()).then(() => finish(), finish); }
      catch (error) { finish(error); }
    });
  }

  function audioFailure() {
    stopAudio();
    S.audioFailed = true;
    UI.render();
    UI.status('Could not play the audio. Check your connection and try again.', true);
    $('#retrySong').hidden = false;
    $('#resultRetry').hidden = false;
  }

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
    playbackEpoch++;
    playPending = false;
    clearTimeout(bufferTimer);
    if (cancelAudioLoad) cancelAudioLoad();
    if (cancelPendingPlay) cancelPendingPlay();
    cancelAnimationFrame(raf);
    playing = false;
    audio.pause();
    audio.volume = S.muted ? 0 : S.vol;
    UI.head(null);
    if (UI.playSweep) UI.playSweep(null, null);
    UI.playState('idle');
    UI.readout(null);
  }

  async function playClip() {
    if (playing) { stopAudio(); return; }
    if (playPending || S.loading || S.audioFailed || !S.meta || !S.meta.preview) return;
    const attempt = ++playbackEpoch;
    playPending = true;

    // Batas main dibaca ULANG tiap frame (curBatas), bukan dikunci sekali:
    // menekan Skip di tengah putaran menaikkan limit(), dan klipnya ikut
    // memanjang mulus tanpa berhenti.
    const curBatas = () => S.done
      ? Math.min((isFinite(audio.duration) ? audio.duration : 30) - 0.2, 30)
      : limit();

    // Menyambung, bukan mengulang: kalau ada bagian baru yang belum pernah
    // terdengar (baru saja lewat/salah tebak), putar dari situ. Kalau semuanya
    // sudah terdengar, tekan lagi untuk mengulang dari awal.
    let dari = 0;
    if (typeof S.heard !== 'number') S.heard = 0;
    if (S.heard > 0.02 && S.heard < curBatas() - 0.02) dari = S.heard;
    else S.heard = 0;

    UI.playState('loading');
    UI.status('Loading audio…');
    try {
      await seek(dari);
      if (attempt !== playbackEpoch) return;
      await beginPlayback();
    } catch (e) {
      if (attempt !== playbackEpoch) return;
      if (e.name === 'NotAllowedError') {
        stopAudio();
        UI.status('Your browser paused playback. Tap Play to listen.', true);
      } else audioFailure();
      return;
    }
    if (attempt !== playbackEpoch) return;
    playPending = false;
    playing = true;
    UI.playState('playing');
    UI.status('');

    const tick = () => {
      if (!playing) return;
      const batas = curBatas();
      const t = Math.max(0, audio.currentTime);
      S.heard = Math.max(S.heard, Math.min(t, batas));
      const prog = clipProgress(t);
      UI.head(prog);
      if (UI.playSweep) UI.playSweep(prog, t);
      UI.readout(t);
      const left = batas - t;
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
        trackId: (S.meta && S.meta.trackId) || S.song.trackId || null,
        title: (S.meta && S.meta.title) || S.song.title,
        artist: (S.meta && S.meta.artist) || S.song.artist,
        guesses: S.guesses, done: S.done, won: S.won
      };
    }
    S.stages = stages;
    if (S.daily) saveDaily();
    // Sengaja TIDAK disimpan ke localStorage: sesi hidup di memori saja, jadi
    // muat ulang halaman selalu memulai yang baru. "Change mode" lalu kembali
    // tetap menyambung karena masih satu muatan halaman.
  }

  function loadRun() {
    const cur = S.stages[S.stage];
    S.guesses = (cur && cur.guesses) || [];
    S.done = !!(cur && cur.done);
    S.won  = !!(cur && cur.won);
  }

  // Tiap kombinasi filter punya sesinya sendiri, di memori saja. Tanpa ini
  // sesi yang berjalan ikut terbawa saat pemain ganti mode, dan tahap yang
  // sudah tercatat tetap memakai lagu lamanya -- filter rock/before-2000 pun
  // bisa memunculkan lagu pop 2010-an yang sudah keluar sebelumnya.
  const RUNS = Object.create(null);
  let runFilter = filterKey();

  function switchRun() {
    RUNS[runFilter] = { stages: S.stages, stage: S.stage, runDone: S.runDone };
    runFilter = filterKey();
    const r = RUNS[runFilter] || { stages: [], stage: 0, runDone: false };
    S.stages = r.stages; S.stage = r.stage; S.runDone = r.runDone;
    S.song = null; S.meta = null;
    loadRun();      // tebakan tahap ini, milik sesi yang baru dipilih
  }

  function pickSong(offset) {
    // jangan ulang lagu yang sudah keluar di tahap sebelumnya dalam sesi ini
    const used = S.stages.filter(Boolean);
    const avail = S.pool.filter((s) =>
      used.every((u) => s.slug !== u.slug && !sameRecording(s, u)));
    const from = avail.length ? avail : S.pool;

    const recent = LS.get('tl:recent', []);
    const fresh = from.filter((s) => recent.indexOf(s.slug) < 0);
    const src = fresh.length > 3 ? fresh : from;
    if (S.custom && S.custom.kind !== 'spotify' && src.length > 1) {
      const ranked = src.slice().sort((a, b) => (a.rank ?? a.tier ?? 0) - (b.rank ?? b.tier ?? 0));
      const core = ranked.length > 48 ? ranked.slice(0, 48) : ranked;
      const pool = (S.stage < 2 && core.length > 20) ? core.slice(0, Math.max(20, Math.ceil(core.length * 0.6))) : core;
      let total = 0;
      const weights = pool.map((_, i) => (total += (pool.length - i + 4), pool.length - i + 4));
      let roll = Math.random() * total;
      for (let i = 0; i < pool.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return pool[i];
      }
      return pool[pool.length - 1];
    }
    if (!S.custom && !S.daily && !S.challenge && src.length > 1) {
      const tiers = [...new Set(src.map((s) => s.tier).filter(Boolean))];
      if (tiers.length > 1) {
        const pickTier = tiers[Math.floor(Math.random() * tiers.length)];
        const byTier = src.filter((s) => s.tier === pickTier);
        if (byTier.length) return byTier[Math.floor(Math.random() * byTier.length)];
      }
    }
    return src[Math.floor(Math.random() * src.length)];
  }

  async function load(retrySong = null) {
    const me = ++S.epoch;
    lastStreak = null;
    stopAudio();
    $('#retrySong').hidden = true;
    $('#resultRetry').hidden = true;
    S.audioFailed = false;
    buildPool();

    if (!S.pool.length) {
      S.song = null; S.meta = null; S.loading = false;
      UI.playState('idle');
      UI.render();
      UI.status('No songs match. Loosen the filters.', true);
      return;
    }

    const cur = S.stages[S.stage];
    let song = retrySong || (cur && cur.slug ? (findSong(cur.slug) || null) : null);

    S.song = null; S.meta = null; S.picked = null; S.loading = true;
    UI.playState('loading');
    UI.status('Loading song…');
    UI.render();

    for (let k = 0; k < 5; k++) {
      const cand = S.daily ? S.daily.songs[S.stage]
        : S.challenge ? S.challenge.song
        : S.runChallenge ? S.runChallenge.songs[S.stage]
        : (song || pickSong(k));
      S.retrySong = cand;
      if (S.custom && S.custom.kind === 'spotify') fetchSpotifyTrackArt(cand);   // lagu aktif duluan
      try {
        const meta = await resolve(cand);
        if (me !== S.epoch) return;             // pemuatan lain sudah menggantikan ini
        S.song = cand; S.meta = meta;
        UI.status('Loading audio…');
        await loadAudioMetadata(meta.preview);
        if (me !== S.epoch) return;
        S.loading = false;

        // Mulai dari detik nol pratinjau: yang diminta adalah intro lagunya,
        // bukan potongan acak dari tengah.
        S.startAt = 0;
        S.heard = 0;          // sudah terdengar sampai detik ke berapa

        if (S.stage === 0 && !cur) {
          trackActivity('game_start');
          if (S.custom && !S.challenge) trackActivity('custom_start');
        }
        saveRun();
        UI.playState('idle');
        UI.status(S.done ? '' : 'Press Play to hear ' + fmt(limit()) + '.');
        UI.render();
        if (S.done) setTimeout(() => { if (me === S.epoch && S.done) UI.result(); }, 250);
        return;
      } catch (e) {
        if (me !== S.epoch) return;
        if (S.challenge || S.daily || cur || retrySong) break; // Preserve an existing round on retry.
        song = null;                            // kandidat gagal → coba berikutnya
      }
    }

    S.loading = false;
    S.audioFailed = true;
    UI.playState('idle');
    UI.render();
    UI.status('Could not load the song. Check your connection and try again.', true);
    $('#retrySong').hidden = false;
    $('#resultRetry').hidden = false;
  }

  // Cover asli tiap lagu playlist Spotify (bukan foto playlist), lewat oEmbed
  // resmi Spotify (CORS terbuka). Thumbnail 300px dipakai di dropdown pilihan,
  // versi 640px dipakai di layar reveal.
  function fetchSpotifyTrackArt(song) {
    if (!song || song.artTried || !song.spotifyUrl || !/\/track\/[A-Za-z0-9]{22}/.test(song.spotifyUrl)) {
      return Promise.resolve();
    }
    song.artTried = true;
    return fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(song.spotifyUrl))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const raw = d && typeof d.thumbnail_url === 'string' && /^https:\/\//.test(d.thumbnail_url) ? d.thumbnail_url : '';
        if (!raw) return;
        const hd = raw.replace('ab67616d00001e02', 'ab67616d0000b273');
        song.art = raw;
        if (song.pre) song.pre.art = hd;
        if (S.song === song && S.meta) {
          S.meta.art = hd;
          if (S.done && $('#resultModal') && !$('#resultModal').hidden) {
            const img = $('#cover');
            if (img) img.src = hd;
            const bg = $('#artBg');
            if (bg) { bg.style.backgroundImage = 'url("' + hd + '")'; bg.classList.add('on'); }
          }
        }
      })
      .catch(() => {});
  }

  let spotifyArtJob = 0;
  function prefetchSpotifyArt(songs) {
    const job = ++spotifyArtJob;
    const queue = songs.filter((s) => !s.artTried && s.spotifyUrl);
    let i = 0;
    const worker = async () => {
      while (i < queue.length && job === spotifyArtJob) {
        await fetchSpotifyTrackArt(queue[i++]);
      }
    };
    for (let w = 0; w < 6; w++) worker();
  }

  /* ================= alur permainan ================= */

  function submitGuess(pick) {
    if (S.done || !S.song || S.loading || S.audioFailed) return;
    if (S.guesses.some((g) => sameStageGuess(g, pick))) {
      UI.status('Already tried that song.');
      UI.clearInput();
      return;
    }
    const right = correctAnswer(pick);
    const artistLocked = S.custom && S.custom.kind !== 'spotify' && (!S.runChallenge || S.runChallenge.artistId);
    const near = !right && !artistLocked && sameGuessArtist(pick);
    S.guesses.push({ t: right ? 'right' : (near ? 'near' : 'wrong'), title: pick.title, artist: pick.artist, slug: pick.slug });
    if (right) return finish(true);
    if (S.guesses.length >= TRIES) return finish(false);
    stopAudio();
    playSfx(near ? 'near' : 'wrong');
    saveRun(); UI.render();
    UI.status(near ? 'Right artist, wrong song. ' + fmt(limit()) + ' unlocked.'
                   : 'Not it. ' + fmt(limit()) + ' unlocked now.');
    UI.clearInput();
    if (UI.q && typeof UI.q.blur === 'function') UI.q.blur();
  }

  function skip() {
    if (S.done || !S.song || S.loading || S.audioFailed) return;
    S.guesses.push({ t: 'skip' });
    if (S.guesses.length >= TRIES) return finish(false);
    saveRun(); UI.render();
    UI.status('Skipped. ' + fmt(limit()) + ' unlocked now.');
    UI.clearInput();
    // Kalau klip masih berputar, curBatas() langsung memanjangkannya mulus;
    // kalau sudah berhenti, otomatis putar sambungan klip baru tanpa klik ulang.
    if (!playing && !playPending && S.meta && S.meta.preview && typeof audio.play === 'function') {
      playClip();
    }
  }

  function finish(won) {
    S.done = true; S.won = won;
    stopAudio();
    // Gagal tidak menghentikan sesi -- tahap berikutnya tetap jalan.
    if (S.stage === stageCount() - 1) S.runDone = true;
    playSfx(won ? ((S.daily || (S.runDone && score() + 1 >= stageCount())) ? 'fanfare' : 'win') : 'wrong');
    saveRun();
    lastStreak = updateSongStreak(won);
    if (S.daily) trackActivity('daily_complete', { won, attempts: S.guesses.length });
    if (S.runDone) { if (S.daily) completeDaily(); else recordStats(); }
    UI.render(); UI.streak(); UI.clearInput();
    if (UI.q && typeof UI.q.blur === 'function') UI.q.blur();
    UI.status('');
    S.heard = 0;      // saat terungkap, putar lagunya dari awal
    // Diputar SEKARANG, bukan setelah modal muncul: makin dekat ke klik aslinya,
    // makin aman dari kebijakan autoplay browser -- sekaligus terasa lebih responsif.
    // Kalah pun tetap diputar: justru saat itulah kamu ingin dengar lagunya.
    UI.autoplay();
    const finishedEpoch = S.epoch;
    setTimeout(() => { if (S.epoch === finishedEpoch && S.done) UI.result(); }, 420);
  }

  function nextStage() {
    closeAll();
    if (S.challenge) { UI.lobby(); return; }
    if (S.stage >= stageCount() - 1) { UI.runResult(); return; }
    S.stage++;
    const cur = S.stages[S.stage];
    S.guesses = (cur && cur.guesses) || [];
    S.done = !!(cur && cur.done);
    S.won  = !!(cur && cur.won);
    S.song = null; S.meta = null;
    saveRun();
    UI.game();
    return load();
  }

  function newRun() {
    closeAll();
    if (S.daily || S.runChallenge) { UI.lobby(); return; }
    S.stages.filter(Boolean).forEach((x) => pushRecent(x.slug));
    S.stages = []; S.stage = 0; S.runDone = false;
    S.guesses = []; S.done = false; S.won = false;
    S.song = null; S.meta = null;
    UI.game();
    load();
  }

  /* ============ mode kustom: main lagu-lagu satu artis ============ */

  // Ambil lagu satu artis dari iTunes (tanpa kunci). Hasilnya sudah membawa
  // preview + sampul lewat .pre, jadi resolve() melewatinya tanpa request lagi.
  async function fetchArtistSongs(artistId) {
    if (String(artistId).startsWith('local:')) {
      return localArtistSongs(String(artistId).slice(6));
    }
    const url = 'https://itunes.apple.com/lookup?id=' + encodeURIComponent(artistId) +
                '&entity=song&limit=200&country=US';
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error('http ' + res.status);
    const data = JSON.parse(await res.text());
    const results = data.results || [];
    const artistRow = results.find((r) => r.wrapperType === 'artist');
    const primaryKey = artistRow && artistRow.artistName ? norm(artistRow.artistName) : '';
    const aliases = primaryKey
      ? Object.entries(ARTIST_ALIASES).filter(([, ms]) => ms.some((m) => norm(m) === primaryKey)).map(([k]) => k)
      : [];
    const leadKeys = primaryKey ? [primaryKey, ...aliases] : [];
    const editionKey = (t) => recordingTitle((t || '')
      .replace(/[([]\s*[^)\]]*(?:\b(?:bonus track|single version|radio edit|album version|extended(?: version)?|deluxe version|remastered version|amended|explicit|clean|spanish(?:\s+version)?|spanglish(?:\s+version)?|english(?:\s+version)?|alternate(?:\s+\w+)?|video mix|radio mix|club mix)\b|\bvs\.?\s+[^)\]]*)[)\]]/gi, ' ')
      .replace(/\s*[-–—]\s*(?:bonus track|single version|radio edit|album version|extended(?: version)?|deluxe version|stripped|radio mix|spanish(?:\s+version)?|spanglish(?:\s+version)?)\s*$/i, ' ')
      .replace(/&/g, ' and '));
    const dupTagScore = (t) => /[([]\s*(?:[^)\]]*(?:\b(?:feat\.?|ft\.?|featuring|bonus track|single version|radio edit|album version|extended|deluxe|amended|explicit|clean|remaster|mix|spanish|spanglish|english|alternate)\b|\bvs\.?\s+[^)\]]*))[)\]]|[-–—]\s*(?:bonus track|single version|radio edit|album version|extended|deluxe|\d{4}\s+remaster|remaster|stripped|radio mix|spanish|spanglish)\s*$|\b(?:feat\.?|ft\.?|featuring)\b|(?:&|\S)[.…]{2,}/i.test(t) ? 1 : 0;
    const censoredPrefix = (t) => {
      const hasEditTag = /[([]\s*(?:radio edit|clean(?:\s+version)?|edited)\s*[)\]]/i.test(t || '');
      const stripped = (t || '').replace(/\s*[([]\s*(?:feat\.?|ft\.?|featuring|with|radio edit|clean(?:\s+version)?|edited)\s*[^)\]]*[)\]]/gi, '').trim();
      const m = (hasEditTag || /[&*$][.…]{2,}$/.test(stripped)) && stripped.match(/^(.+?)\s*[&*$]*[.…]{2,}\s*$/);
      const toks = m ? recordingTitle(m[1]).split(' ').filter(Boolean) : [];
      return toks.length >= 2 ? toks : [];
    };
    const startsWithToks = (fullTitle, prefixToks) => {
      if (!prefixToks.length) return false;
      const fullToks = recordingTitle(fullTitle).split(' ').filter(Boolean);
      return fullToks.length > prefixToks.length && prefixToks.every((tk, idx) => fullToks[idx] === tk);
    };
    const songs = [];
    let leadCount = 0;
    for (let rawIdx = 0; rawIdx < results.length; rawIdx++) {
      const r = results[rawIdx];
      if (r.wrapperType !== 'track' || r.kind !== 'song' || !r.previewUrl ||
          !window.RecordingPolicy.isStudio(r)) continue;
      if (r.trackTimeMillis > 0 && r.trackTimeMillis < 75000 &&
          /\b(?:intro|outro|interlude)\b/i.test(r.trackName)) continue;
      const ra = norm(r.artistName || '');
      const isLead = !leadKeys.length || leadKeys.some((k) => ra.indexOf(k) >= 0);
      if (isLead) leadCount++;
      else if (rawIdx >= 100 && leadCount >= 12) continue;

      const title = r.trackName, artist = r.artistName, sl = slug([title, artist]);
      const art = (r.artworkUrl100 || '').replace('100x100', '600x600');
      const year = (r.releaseDate || '').slice(0, 4);
      const song = {
        title, artist, tier: 0, region: '', genre: '', year, art,
        slug: sl, hay: norm(title + ' ' + artist),
        pre: { trackId: r.trackId, preview: r.previewUrl, art, title, artist, album: r.collectionName || '',
               year, link: r.trackViewUrl || '', exp: Date.now() + 7 * 864e5 }
      };
      const ek = editionKey(title);
      const artists = songArtists(song);
      const cToks = censoredPrefix(title);
      const prevIdx = songs.findIndex((prev) => {
        if (prev.slug === sl || sameRecording(prev, song)) return true;
        const shared = [...songArtists(prev)].some((a) => artists.has(a));
        if (!shared) return false;
        if (ek && ek === editionKey(prev.title)) return true;
        if (cToks.length && !censoredPrefix(prev.title).length && startsWithToks(prev.title, cToks)) return true;
        const pToks = censoredPrefix(prev.title);
        return pToks.length && !cToks.length && startsWithToks(title, pToks);
      });
      if (prevIdx >= 0) {
        const prev = songs[prevIdx];
        const prevCens = censoredPrefix(prev.title).length > 0;
        const newCens = cToks.length > 0;
        if (prevCens && !newCens) { songs[prevIdx] = song; continue; }
        if (!prevCens && newCens) continue;
        const sNew = dupTagScore(title), sOld = dupTagScore(prev.title);
        if (sNew < sOld || (sNew === sOld && title.length < prev.title.length)) songs[prevIdx] = song;
        continue;
      }
      songs.push(song);
    }
    songs.forEach((s, idx) => {
      s.rank = idx;
      s.tier = idx < 10 ? 1 : idx < 25 ? 2 : idx < 45 ? 3 : 4;
    });
    return songs;
  }

  // Daftar artis untuk dropdown pencarian; cocok persis/awalan didahulukan.
  async function searchArtists(q) {
    const url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(q) +
                '&entity=musicArtist&limit=8&country=US';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = JSON.parse(await res.text());
    const nq = norm(q), seen = Object.create(null), list = [];
    for (const r of (data.results || [])) {
      if (!r.artistId || !r.artistName || seen[r.artistId]) continue;
      seen[r.artistId] = 1;
      const na = norm(r.artistName);
      let sc = 3;
      if (na === nq) sc = 0; else if (na.indexOf(nq) === 0) sc = 1; else if (na.indexOf(nq) >= 0) sc = 2;
      list.push({ id: r.artistId, name: r.artistName, genre: r.primaryGenreName || '', sc });
    }
    list.sort((a, b) => a.sc - b.sc || a.name.length - b.name.length);
    return list.slice(0, 6);
  }

  const POPULAR_ARTISTS = [
    { id: '159260351', name: 'Taylor Swift' },
    { id: '479756766', name: 'The Weeknd' },
    { id: '271256', name: 'Drake' },
    { id: '278873078', name: 'Bruno Mars' },
    { id: '471744', name: 'Coldplay' },
    { id: '1065981054', name: 'Billie Eilish' },
    { id: '62820413', name: 'Arctic Monkeys' },
    { id: '63346553', name: 'Rihanna' },
    { id: '412778295', name: 'Ariana Grande' },
    { id: '1031397873', name: 'Dua Lipa' },
    { id: '320569549', name: 'Justin Bieber' },
    { id: '183313439', name: 'Ed Sheeran' },
    { id: '277293880', name: 'Lady Gaga' },
    { id: '111051', name: 'Eminem' },
    { id: '368183298', name: 'Kendrick Lamar' },
    { id: '605800394', name: 'SZA' },
    { id: '979458609', name: 'Olivia Rodrigo' },
    { id: '471260289', name: 'Harry Styles' },
    { id: '390647681', name: 'Sabrina Carpenter' },
    { id: '966309175', name: 'Post Malone' },
    { id: '464296584', name: 'Lana Del Rey' },
    { id: '1419227', name: 'Beyoncé' },
    { id: '262836961', name: 'Adele' },
    { id: '64387566', name: 'Katy Perry' },
    { id: '1798556', name: 'Maroon 5' },
    { id: '358714030', name: 'Imagine Dragons' },
    { id: '148662', name: 'Linkin Park' },
    { id: '3296287', name: 'Queen' },
    { id: '32940', name: 'Michael Jackson' },
    { id: '549236696', name: 'Travis Scott' },
    { id: '830588310', name: 'Doja Cat' },
    { id: '890403665', name: 'Shawn Mendes' },
    { id: '217005', name: 'Britney Spears' },
    { id: '137057909', name: 'Miley Cyrus' },
    { id: '280215834', name: 'Selena Gomez' },
    { id: '336249253', name: 'Charlie Puth' },
    { id: '156488786', name: 'Sam Smith' },
    { id: '324916925', name: 'Halsey' },
    { id: '1446365464', name: 'Tate McRae' },
    { id: '1264818718', name: 'Chappell Roan' },
    { id: '935727853', name: 'Camila Cabello' },
    { id: '280215821', name: 'Demi Lovato' },
    { id: '260414340', name: 'OneRepublic' },
    { id: '28721078', name: 'Sia' },
    { id: '338264227', name: 'Ellie Goulding' },
    { id: '334854763', name: 'Kesha' },
    { id: '4488522', name: 'P!nk' },
    { id: '259398', name: 'Christina Aguilera' },
    { id: '91853', name: 'Mariah Carey' },
    { id: '13952', name: 'Whitney Houston' },
    { id: '63729', name: 'Céline Dion' },
    { id: '20044', name: 'Madonna' },
    { id: '54657', name: 'Elton John' },
    { id: '46726', name: 'Stevie Wonder' },
    { id: '217039', name: 'Backstreet Boys' },
    { id: '396754057', name: 'One Direction' },
    { id: '114342891', name: 'Jonas Brothers' },
    { id: '398120', name: '*NSYNC' },
    { id: '577354628', name: 'Fifth Harmony' },
    { id: '477515548', name: 'Little Mix' },
    { id: '973181994', name: 'ZAYN' },
    { id: '471260298', name: 'Niall Horan' },
    { id: '316265', name: 'Kelly Clarkson' },
    { id: '348580754', name: 'Meghan Trainor' },
    { id: '466059563', name: 'Bebe Rexha' },
    { id: '570372593', name: 'Zara Larsson' },
    { id: '1265164818', name: 'Ava Max' },
    { id: '894337', name: 'George Michael' },
    { id: '548421', name: 'Wham!' },
    { id: '2715720', name: 'Kanye West' },
    { id: '128050210', name: 'Future' },
    { id: '5869117', name: 'Lil Wayne' },
    { id: '105998', name: '2Pac' },
    { id: '112058', name: '50 Cent' },
    { id: '95705522', name: 'Chris Brown' },
    { id: '15885', name: 'Usher' },
    { id: '316069', name: 'Alicia Keys' },
    { id: '78257321', name: 'Ne-Yo' },
    { id: '82842423', name: 'Khalid' },
    { id: '442122051', name: 'Frank Ocean' },
    { id: '1019899019', name: 'Daniel Caesar' },
    { id: '420368335', name: 'Tyler, The Creator' },
    { id: '278464538', name: 'Nicki Minaj' },
    { id: '956078923', name: 'Cardi B' },
    { id: '73705833', name: 'J. Cole' },
    { id: '3261325', name: 'Akon' },
    { id: '255303209', name: 'Flo Rida' },
    { id: '360391', name: 'Black Eyed Peas' },
    { id: '1435848034', name: 'The Kid LAROI' },
    { id: '256673237', name: 'T-Pain' },
    { id: '136975', name: 'The Beatles' },
    { id: '112018', name: 'Nirvana' },
    { id: '657515', name: 'Radiohead' },
    { id: '954266', name: 'Green Day' },
    { id: '889780', name: 'Red Hot Chili Peppers' },
    { id: '487143', name: 'Pink Floyd' },
    { id: '5040714', name: 'AC/DC' },
    { id: '3996865', name: 'Metallica' },
    { id: '6906197', name: 'Foo Fighters' },
    { id: '512633', name: 'Oasis' },
    { id: '158038', name: 'Fleetwood Mac' },
    { id: '219350813', name: 'The Neighbourhood' },
    { id: '290242959', name: 'Tame Impala' },
    { id: '1069739468', name: 'Cigarettes After Sex' },
    { id: '28673423', name: 'Fall Out Boy' },
    { id: '75950796', name: 'Paramore' },
    { id: '14748659', name: 'My Chemical Romance' },
    { id: '567072', name: 'Gorillaz' },
    { id: '542640016', name: 'The 1975' },
    { id: '497546276', name: 'Mitski' },
    { id: '122782', name: 'Bon Jovi' },
    { id: '106621', name: 'Guns N\' Roses' },
    { id: '78500', name: 'U2' },
    { id: '6483093', name: 'The Killers' },
    { id: '5468295', name: 'Daft Punk' },
    { id: '5557599', name: 'David Guetta' },
    { id: '298496035', name: 'Avicii' },
    { id: '1062085272', name: 'Alan Walker' },
    { id: '980795202', name: 'Marshmello' },
    { id: '580391756', name: 'The Chainsmokers' },
    { id: '635806094', name: 'Kygo' },
    { id: '368433979', name: 'Zedd' },
    { id: '1126808565', name: 'Bad Bunny' },
    { id: '889327', name: 'Shakira' },
    { id: '290814601', name: 'Karol G' },
    { id: '25514958', name: 'Daddy Yankee' },
    { id: '444520760', name: 'J Balvin' },
    { id: '1107186883', name: 'Rauw Alejandro' },
    { id: '90895', name: 'Enrique Iglesias' },
    { id: '1258279972', name: 'Joji' },
    { id: '290699', name: 'Earth, Wind & Fire' },
    { id: '807028', name: 'Westlife' },
    { id: '16586443', name: 'John Legend' },
    { id: '1260160', name: 'Nelly Furtado' },
    { id: '155138', name: 'Sean Paul' },
    { id: '259118085', name: 'Jason Derulo' },
    { id: '161541223', name: 'Gotye' },
    { id: '1104179033', name: 'Dominic Fike' },
    { id: '4416594', name: 'John Lennon' },
    { id: '2307230', name: 'Yellowcard' },
    { id: '85932', name: 'Bryan Adams' },
    { id: '148377', name: 'Depeche Mode' },
    { id: '27044968', name: 'Pitbull' },
    { id: '201955086', name: 'Calvin Harris' },
    { id: '398128', name: 'Justin Timberlake' },
    { id: '1352449404', name: 'JAY-Z' },
    { id: '1237012992', name: 'Don Toliver' },
    { id: '349736311', name: 'Twenty One Pilots' }
  ];
  const CUSTOM_RECENT_KEY = 'tl:custom:recent';
  function shuffledPopular(exclude) {
    const list = POPULAR_ARTISTS.slice();
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    }
    if (exclude && exclude.size && list.length > exclude.size * 2) {
      const head = [], tail = [];
      for (const a of list) (exclude.has(norm(a.name)) ? tail : head).push(a);
      return head.concat(tail);
    }
    return list;
  }
  let popularPool = shuffledPopular();
  let popularOffset = 0;
  const recentArtists = () => LS.get(CUSTOM_RECENT_KEY, []).filter((a) => a && a.id && a.name);
  function pushRecentArtist(id, name) {
    const next = [{ id: String(id), name }, ...recentArtists().filter((a) => String(a.id) !== String(id) && norm(a.name) !== norm(name))];
    LS.set(CUSTOM_RECENT_KEY, next.slice(0, 6));
  }
  function clearRecentArtists() {
    LS.set(CUSTOM_RECENT_KEY, []);
    renderQuickArtists(true);
  }
  function popularState() {
    const recent = recentArtists();
    const seen = new Set(recent.map((a) => norm(a.name)));
    const avail = popularPool.filter((a) => !seen.has(norm(a.name)));
    const size = recent.length ? 4 : 8;
    const start = avail.length ? (popularOffset % avail.length) : 0;
    const popular = avail.slice(start).concat(avail.slice(0, start)).slice(0, size);
    return { recent, avail, size, popular };
  }
  function refreshPopularArtists() {
    const { avail, size, popular } = popularState();
    popularOffset += size;
    if (popularOffset >= avail.length) {
      popularPool = shuffledPopular(new Set(popular.map((a) => norm(a.name))));
      popularOffset = 0;
    }
    renderQuickArtists(true);
  }
  function surprisePopularArtist() {
    const last = recentArtists()[0];
    const pool = POPULAR_ARTISTS.filter((a) => !last || (String(a.id) !== String(last.id) && norm(a.name) !== norm(last.name)));
    const source = pool.length ? pool : POPULAR_ARTISTS;
    if (!source.length) return;
    const pick = source[Math.floor(Math.random() * source.length)];
    startCustom(pick.id, pick.name);
  }
  function localArtistSongs(artistName) {
    const key = norm(artistName);
    return ALL.filter((s) => norm(s.artist) === key)
      .slice()
      .sort((a, b) => a.tier - b.tier)
      .map((s, idx) => ({ ...s, rank: idx }));
  }
  function localArtistMatches(q) {
    const nq = norm(q);
    if (!nq) return [];
    const counts = new Map();
    for (const s of ALL) counts.set(s.artist, (counts.get(s.artist) || 0) + 1);
    const list = [];
    for (const [name, count] of counts) {
      if (count < STAGES) continue;
      const na = norm(name);
      if (na.indexOf(nq) < 0) continue;
      const sc = na === nq ? 0 : na.indexOf(nq) === 0 ? 1 : 2;
      list.push({ id: 'local:' + name, name, genre: count + ' tracks', sc });
    }
    list.sort((a, b) => a.sc - b.sc || a.name.length - b.name.length);
    return list.slice(0, 6);
  }

  let customStartReq = 0;
  function setCustomBusy(busy) {
    if (typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('#artistResults button, #customQuick button').forEach((b) => { b.disabled = busy; });
    }
  }

  // Mulai satu sesi kustom dari artis terpilih.
  async function startCustom(artistId, artistName) {
    const req = ++customStartReq;
    const hint = $('#customHint');
    setCustomBusy(true);
    hint.className = 'custom-hint'; hint.textContent = 'Loading ' + artistName + '…';
    let songs;
    try {
      songs = await fetchArtistSongs(artistId);
    } catch (e) {
      songs = localArtistSongs(artistName);
      if (songs.length < STAGES) {
        if (req !== customStartReq) return;
        setCustomBusy(false);
        hint.className = 'custom-hint warn'; hint.textContent = 'Could not load that artist. Try another.'; return;
      }
    }
    if (req !== customStartReq || ($('#customModal') && $('#customModal').hidden)) {
      setCustomBusy(false);
      return;
    }
    setCustomBusy(false);
    if (songs.length < STAGES) {
      hint.className = 'custom-hint warn';
      hint.textContent = 'Only ' + songs.length + ' original tracks found — need at least ' + STAGES + '. Try another artist.';
      return;
    }
    pushRecentArtist(artistId, artistName);
    delete RUNS['custom:' + artistId];              // dari modal selalu mulai sesi baru
    S.challenge = null; S.runChallenge = null; S.daily = null;
    S.custom = { id: String(artistId), label: artistName, songs };
    switchRun();                                    // parkir sesi katalog, pindah ke slot kustom
    S.stages = []; S.stage = 0; S.runDone = false;
    S.guesses = []; S.done = false; S.won = false;
    S.song = null; S.meta = null;
    closeAll();
    UI.game();
    load();
  }

  const CUSTOM_HINT = 'Pick an artist — we pick 5 of their songs.';
  function renderQuickArtists(visible = true) {
    const host = $('#customQuick');
    if (!host) return;
    if (!visible) { host.hidden = true; return; }
    const { recent, avail, size, popular } = popularState();
    const chipGroup = (lbl, items, actionHtml) => items.length
      ? '<div class="custom-quick-group"><div class="custom-quick-head"><span class="custom-quick-lbl">' + lbl + '</span>' +
        (actionHtml || '') +
        '</div><div class="custom-chips">' +
        items.map((a) => '<button type="button" class="artist-chip" data-id="' + esc(String(a.id)) +
        '" data-name="' + esc(a.name) + '">' + esc(a.name) + '</button>').join('') + '</div></div>'
      : '';
    const clearBtn = '<button type="button" class="custom-quick-clear" id="clearRecentArtists">Clear</button>';
    const refreshBtn = avail.length > size
      ? '<button type="button" class="custom-quick-clear" id="refreshPopularArtists">&#8635; Refresh</button>'
      : '';
    const surpriseBtn = '<button type="button" class="custom-quick-clear" id="surprisePopularArtist">&#10022; Surprise me</button>';
    const popularActions = '<div class="custom-quick-actions">' + surpriseBtn + refreshBtn + '</div>';
    host.innerHTML = chipGroup('Recent artists', recent, clearBtn) + chipGroup('Popular artists', popular, popularActions);
    host.hidden = !host.innerHTML;
  }
  function openCustom() {
    closeAll();
    customStartReq++;
    setCustomBusy(false);
    $('#artistQ').value = '';
    if ($('#artistClear')) $('#artistClear').hidden = true;
    const box = $('#artistResults'); box.hidden = true; box.innerHTML = '';
    renderQuickArtists(true);
    const h = $('#customHint'); h.className = 'custom-hint'; h.textContent = CUSTOM_HINT;
    $('#customModal').hidden = false;
    setTimeout(() => $('#artistQ').focus(), 40);
  }
  function renderArtists(list) {
    const box = $('#artistResults');
    if (!list.length) { box.hidden = true; box.innerHTML = ''; renderQuickArtists(true); return; }
    box.innerHTML = list.map((a) =>
      '<li><button type="button" class="artist-row" data-id="' + esc(String(a.id)) +
      '" data-name="' + esc(a.name) + '"><span class="artist-name">' + esc(a.name) + '</span>' +
      (a.genre ? '<span class="artist-genre">' + esc(a.genre) + '</span>' : '') +
      '</button></li>').join('');
    box.hidden = false;
    renderQuickArtists(false);
  }

  /* ================= daily challenge ================= */

  const DUEL_BEST_KEYS = { streams: 'tl:duel:streams:best', year: 'tl:duel:best' };
  function duelStats() {
    const saved = LS.get('tl:duel:stats', {});
    const streamsBest = Math.max(0, Number(LS.get(DUEL_BEST_KEYS.streams, 0)) || 0, Number(saved.streamsBest) || 0);
    const yearBest = Math.max(0, Number(LS.get(DUEL_BEST_KEYS.year, 0)) || 0, Number(saved.yearBest) || 0);
    const runs = Math.max(0, Number(saved.runs) || 0);
    return { streamsBest, yearBest, best: Math.max(streamsBest, yearBest), runs };
  }
  function artistStats() {
    const saved = LS.get('tl:artist:stats', {});
    const won = Math.max(0, Number(saved.won) || 0);
    const played = Math.max(won, Number(saved.played) || 0);
    const best = Math.max(0, Number(saved.best) || 0);
    const current = Math.max(0, Number(saved.current) || 0);
    const rawDist = Array.isArray(saved.dist) && saved.dist.length === 11
      ? saved.dist.map((n) => Math.max(0, Number(n) || 0))
      : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    return { played, won, best, current, dist: rawDist };
  }

  const dailyKey = (day) => 'tl:daily:v2:' + day;
  function dailyStats() {
    const daily = window.DailyGame, today = daily.day();
    const completed = LS.get('tl:daily:completed', []);
    const wins = [];
    const dist = [0, 0, 0, 0, 0, 0];
    let lostToday = false, played = 0;
    for (const date of new Set(Array.isArray(completed) ? completed : [])) {
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) continue;
      const saved = LS.get(dailyKey(date)) || LS.get('tl:daily:v1:' + date);
      if (!saved) continue;
      const slugs = daily.plan(window.DAILY_POOL_V1, date).map(slug);
      const result = daily.restore(saved, slugs);
      if (!result || !result.runDone) continue;
      played++;
      const stage = result.stages[0];
      if (stage.won) {
        wins.push(date);
        const at = stage.guesses.findIndex((g) => g.t === 'right');
        if (at >= 0 && at < TRIES) dist[at]++;
      } else {
        dist[TRIES]++;
        if (date === today) lostToday = true;
      }
    }
    const streak = daily.streak(wins, today);
    if (lostToday) streak.current = 0;
    return { ...streak, played, won: wins.length, dist };
  }
  const dailyStreak = dailyStats;
  function refreshDaily() {
    const day = window.DailyGame.day(), saved = LS.get(dailyKey(day)) || LS.get('tl:daily:v1:' + day);
    const current = dailyStreak().current;
    const status = $('#dailyStatus');
    const details = [];
    if (current) details.push(current + '-win streak');
    if (saved && saved.runDone) details.push('Next song in ' + window.DailyGame.remaining());
    status.textContent = details.join(' · ');
    status.hidden = !details.length;
    $('#openDaily').textContent = saved && saved.runDone ? 'View daily result' : saved ? 'Continue daily' : 'Play daily';
  }
  function saveDaily() {
    const key = dailyKey(S.daily.day), saved = LS.get(key);
    // An already completed result is immutable, including across browser tabs.
    if (saved && saved.runDone) return;
    LS.set(key, { stage: S.stage, stages: S.stages, runDone: S.runDone });
  }
  function completeDaily() {
    const completed = LS.get('tl:daily:completed', []);
    if (!completed.includes(S.daily.day)) LS.set('tl:daily:completed', [...completed, S.daily.day].sort());
  }
  async function startDaily() {
    closeAll();
    const day = window.DailyGame.day();
    const songs = window.DailyGame.plan(window.DAILY_POOL_V1, day).map((s) => ({
      title: s[0], artist: s[1], tier: s[2], region: s[3], genre: s[4], year: s[5], art: s[6],
      slug: slug(s), hay: norm(s[0] + ' ' + s[1])
    }));
    S.daily = { day, songs };
    S.custom = null; S.challenge = null; S.runChallenge = null;
    switchRun();
    const saved = window.DailyGame.restore(LS.get(dailyKey(day)) || LS.get('tl:daily:v1:' + day), songs.map((s) => s.slug));
    Object.assign(S, saved || { stage: 0, stages: [], runDone: false });
    S.song = null; S.meta = null;
    loadRun();
    history.replaceState(null, '', location.pathname + location.search + '#daily');
    UI.clearInput(); UI.game();
    if (S.runDone) { saveDaily(); completeDaily(); UI.render(); UI.status('Daily complete. Come back tomorrow for a new song.'); UI.runResult(); return; }
    await load();
  }

  /* ================= friend challenge ================= */

  function trackToSong(r) {
    const title = r.trackName, artist = r.artistName;
    const art = (r.artworkUrl100 || '').replace('100x100', '600x600');
    const year = (r.releaseDate || '').slice(0, 4);
    return {
      title, artist, tier: 0, region: '', genre: '', year, art, trackId: r.trackId,
      slug: slug([title, artist]), hay: norm(title + ' ' + artist),
      pre: { trackId: r.trackId, preview: r.previewUrl, art, title, artist,
        album: r.collectionName || '', year, link: r.trackViewUrl || '' }
    };
  }

  async function acceptChallenge() {
    if (location.hash.startsWith('#duel=')) {
      const duelIncoming = window.ReleaseDuel ? window.ReleaseDuel.parseChallenge(location.hash) : null;
      if (!duelIncoming || !launchDuelChallenge) return;
      if (!launchDuelChallenge(duelIncoming)) {
        $('#challengeMessage').textContent = 'Could not load the tracks from this duel link. Ask your friend for a new link.';
      }
      return;
    }
    if (location.hash.startsWith('#artist=')) {
      const artistIncoming = window.ArtistDetective ? window.ArtistDetective.parseChallenge(location.hash) : null;
      if (!artistIncoming || !launchArtistChallenge) return;
      if (!launchArtistChallenge(artistIncoming)) {
        $('#challengeMessage').textContent = 'Could not load the artist from this challenge link. Ask your friend for a new link.';
      }
      return;
    }
    const single = window.TrackChallenge.parse(location.hash);
    const run = single ? null : window.TrackChallenge.parseRun(location.hash);
    if (!single && !run) return;
    const ticket = ++S.epoch;
    const button = $('#acceptChallenge'), message = $('#challengeMessage');
    button.disabled = true;
    message.textContent = 'Loading your challenge…';
    try {
      const tracks = single
        ? [await window.TrackChallenge.lookup(single.id)]
        : await window.TrackChallenge.lookupRun(run.ids);
      const artistId = single ? tracks[0].artistId : run.artistId;
      // Include the artist catalogue for custom challenges, alongside normal suggestions.
      let extras = [];
      if (artistId) {
        try { extras = await fetchArtistSongs(artistId); } catch (e) { /* Main catalogue remains available. */ }
      }
      if (ticket !== S.epoch) return;
      const challengeSongs = tracks.map(trackToSong);
      const songs = new Map([...ALL, ...extras, ...challengeSongs].map((s) => [s.slug, s]));
      S.daily = null;
      if (single) {
        S.runChallenge = null;
        S.challenge = { ...single, song: challengeSongs[0] };
        S.custom = { id: 'challenge:' + single.id, label: 'Friend challenge', songs: [...songs.values()] };
        delete RUNS['challenge:' + single.id];
      } else {
        const artistLabel = run.artistId
          ? ((extras[0] && extras[0].artist) || (challengeSongs[0] && challengeSongs[0].artist) || null)
          : null;
        S.challenge = null;
        S.runChallenge = { ...run, artistLabel, songs: challengeSongs };
        S.custom = { id: 'run:' + run.ids.join('-'), label: artistLabel || 'Friend challenge', songs: [...songs.values()] };
        delete RUNS['run:' + run.ids.join('-')];
      }
      switchRun();
      UI.clearInput();
      UI.game();
      await load();
    } catch (e) {
      if (ticket !== S.epoch) return;
      message.textContent = run
        ? 'Could not load all songs in this challenge. Check your connection or try again. A preview may no longer be available.'
        : 'Could not load this exact song. Check your connection or try again. The preview may no longer be available.';
      button.textContent = 'Try again';
    } finally {
      if (ticket === S.epoch || S.challenge || S.runChallenge) button.disabled = false;
    }
  }

  function showIncomingChallenge() {
    const isSingle = location.hash.startsWith('#challenge=');
    const isRun = location.hash.startsWith('#run=');
    const isDuel = location.hash.startsWith('#duel=');
    const isArtist = location.hash.startsWith('#artist=');
    if (!isSingle && !isRun && !isDuel && !isArtist) return false;
    const kicker = $('#challengeKicker');
    const title = $('#challengeTitle');
    if (isArtist) {
      const incoming = window.ArtistDetective ? window.ArtistDetective.parseChallenge(location.hash) : null;
      $('#lobby').hidden = true;
      $('#challengeIntro').hidden = false;
      $('#acceptChallenge').hidden = !incoming;
      $('#acceptChallenge').disabled = false;
      $('#acceptChallenge').textContent = 'Accept challenge';
      if (kicker) {
        kicker.textContent = 'Artist Detective';
        kicker.dataset.mode = 'artist';
      }
      if (title) title.textContent = 'Mystery artist challenge';
      $('#challengeRules').innerHTML = incoming
        ? 'Same mystery artist. Up to 10 tries.<br>Use 6 clues (Debut, Type, Gender, Genre, Country, Rank) to solve it faster!'
        : 'Mystery artist deduction challenge.<br>Ask your friend for a valid challenge link.';
      $('#challengeMessage').textContent = !incoming
        ? 'This challenge link is invalid or uses an unsupported version. Ask your friend for a new link.'
        : incoming.won
        ? 'Your friend solved this Mystery Artist in ' + incoming.tries + (incoming.tries === 1 ? ' try. ' : ' tries. ') + 'Can you beat them?'
        : 'Your friend was stumped by this Mystery Artist. Can you solve it?';
      return true;
    }
    if (isDuel) {
      const incoming = window.ReleaseDuel ? window.ReleaseDuel.parseChallenge(location.hash) : null;
      const duelModeLabel = incoming && incoming.kind === 'streams' ? 'Spotify Streams' : 'Release Year';
      $('#lobby').hidden = true;
      $('#challengeIntro').hidden = false;
      $('#acceptChallenge').hidden = !incoming;
      $('#acceptChallenge').disabled = false;
      $('#acceptChallenge').textContent = 'Accept duel';
      if (kicker) {
        kicker.textContent = incoming ? ('Music Duel · ' + duelModeLabel) : 'Music Duel';
        kicker.dataset.mode = 'duel';
      }
      if (title) title.textContent = 'Friend duel';
      $('#challengeRules').innerHTML = incoming
        ? 'Exact same song sequence as your friend.<br>Beat their score of ' + incoming.score + ' to win!'
        : 'Head-to-head music duel.<br>Ask your friend for a valid duel link.';
      $('#challengeMessage').textContent = !incoming
        ? 'This challenge link is invalid or uses an unsupported version. Ask your friend for a new link.'
        : 'Your friend scored ' + incoming.score + ' in ' + duelModeLabel + ' Duel. Can you beat them?';
      return true;
    }
    if (kicker) {
      kicker.textContent = 'Song Challenge';
      if (kicker.dataset) delete kicker.dataset.mode;
    }
    if (title) title.textContent = 'Friend challenge';
    const incoming = isRun
      ? window.TrackChallenge.parseRun(location.hash)
      : window.TrackChallenge.parse(location.hash);
    $('#lobby').hidden = true;
    $('#challengeIntro').hidden = false;
    $('#acceptChallenge').hidden = !incoming;
    $('#acceptChallenge').textContent = 'Accept challenge';
    const count = incoming && isRun ? incoming.ids.length : 1;
    $('#challengeRules').innerHTML = isRun && incoming
      ? count + (count === 1 ? ' song. Five tries. ' : ' songs. Five tries each. ') +
        'Same recordings, same clip lengths:<br>0.1s → 0.5s → 2s → 8s → 15s.'
      : 'One song. Five tries. Same recording, same clip lengths:<br>0.1s → 0.5s → 2s → 8s → 15s.';
    $('#challengeMessage').textContent = !incoming
      ? 'This challenge link is invalid or uses an unsupported version. Ask your friend for a new link.'
      : isRun
      ? 'Your friend scored ' + window.TrackChallenge.describeRun(incoming.results) + '. Can you beat them?'
      : 'Your friend ' + window.TrackChallenge.describe(incoming.result) + '. Can you beat them?';
    return true;
  }

  /* ================= statistik ================= */

  // statistik per kombinasi filter; tiap sesi yang tuntas dihitung
  const statKey = () => 'tl:stats:' + filterKey();
  const blankStats = () => ({ runs: 0, total: 0, best: 0, perfect: 0, dist: [0, 0, 0, 0, 0, 0] });

  function recordStats() {
    if (S.custom || S.challenge || S.runChallenge || S.daily) return;   // mode kustom tak masuk statistik harian
    const st = Object.assign(blankStats(), LS.get(statKey(), {}));
    const sc = score();
    st.runs++;
    st.total += sc;
    st.dist[sc]++;
    st.best = Math.max(st.best, sc);
    if (sc === STAGES) st.perfect++;
    LS.set(statKey(), st);
  }

  function allClassicStats() {
    const agg = blankStats();
    let filtersUsed = 0;
    for (const g in GENRES) {
      for (const e in ERAS) {
        const raw = LS.get('tl:stats:gl:' + g + ':' + e);
        if (!raw || !raw.runs) continue;
        filtersUsed++;
        agg.runs += raw.runs || 0;
        agg.total += raw.total || 0;
        agg.best = Math.max(agg.best, raw.best || 0);
        agg.perfect += raw.perfect || 0;
        for (let i = 0; i <= STAGES; i++) agg.dist[i] += (raw.dist && raw.dist[i]) || 0;
      }
    }
    return { ...agg, filtersUsed };
  }

  let statsTab = 'filter';
  const SONG_STREAK_KEY = 'tl:song:streak';
  const CUSTOM_STREAK_KEY = 'tl:custom:streak';
  let lastStreak = null;
  function streakKey(mode) {
    if (mode === 'classic') return SONG_STREAK_KEY;
    if (mode === 'custom') return CUSTOM_STREAK_KEY;
    if (S.challenge || S.runChallenge || S.daily) return '';
    return S.custom ? CUSTOM_STREAK_KEY : SONG_STREAK_KEY;
  }
  function songStreak(mode) {
    const key = streakKey(mode);
    if (!key) return { current: 0, best: 0 };
    const d = LS.get(key, {});
    const current = Number.isInteger(d && d.current) && d.current >= 0 ? d.current : 0;
    const best = Number.isInteger(d && d.best) && d.best >= current ? d.best : current;
    return { current, best };
  }
  function updateSongStreak(won) {
    const key = streakKey();
    if (!key) return null;
    const prev = songStreak();
    const current = won ? prev.current + 1 : 0;
    const best = Math.max(prev.best, current);
    LS.set(key, { current, best });
    return { current, best, isNewBest: won && current > prev.best && current >= 2 };
  }

  let stopDuel = null, stopDuelAudio = null, syncDuelVolume = null, duelEnded = () => false, launchDuelChallenge = null, launchDuelMode = null;
  let stopArtistGame = null, stopArtistAudio = null, syncArtistVolume = null, launchArtistChallenge = null, launchArtistMode = null;

  // Susun kipas sampul album (maks. 3 sampul unik) atau satu sampul + piringan vinyl
  function renderRunFan(el, arts) {
    if (!el) return;
    const raw = [];
    for (const src of arts) if (src && raw.indexOf(src) < 0) raw.push(src);
    const list = raw.slice(0, 3);
    if (!list.length) {
      el.hidden = true;
      el.innerHTML = '';
      el.className = 'run-fan';
      return;
    }
    el.hidden = false;
    if (list.length === 1) {
      el.className = 'run-fan single';
      el.innerHTML =
        '<span class="fan-disc" aria-hidden="true"></span>' +
        '<img class="fan-card f2" src="' + esc(list[0]) + '" alt="">';
      return;
    }
    // Tempatkan sampul terbaik (index 0) di kartu depan tengah (f2)
    const ordered = list.length === 3 ? [list[1], list[0], list[2]] : [list[1], list[0]];
    const slots = list.length === 3 ? ['f1', 'f2', 'f3'] : ['f1', 'f2'];
    el.className = 'run-fan count-' + list.length;
    el.innerHTML =
      '<span class="fan-disc" aria-hidden="true"></span>' +
      ordered.map((src, idx) =>
        '<img class="fan-card ' + slots[idx] + '" src="' + esc(src) + '" alt="">'
      ).join('');
  }

  let summaryAudio = null, summaryKey = '', summaryEpoch = 0;
  const summarySongs = new Map();
  const summaryPos = new Map();

  function setSummaryBtnState(key, state) {
    [].forEach.call(document.querySelectorAll('.runlist.run-shelf li'), (li) => {
      const btn = li.querySelector('.run-playbtn');
      const on = !!(btn && btn.dataset.sKey === key && state !== 'idle');
      li.classList.toggle('is-playing', state === 'playing' && on);
      if (btn) btn.dataset.s = on ? state : 'idle';
    });
  }

  function stopSummaryPreview(resetPos = false) {
    summaryEpoch++;
    const prevKey = summaryKey;
    summaryKey = '';
    if (resetPos) summaryPos.clear();
    if (summaryAudio) {
      if (!resetPos && prevKey && Number.isFinite(summaryAudio.currentTime) && !summaryAudio.ended && summaryAudio.currentTime > 0.05) {
        summaryPos.set(prevKey, summaryAudio.currentTime);
      }
      try { summaryAudio.pause(); } catch (e) {}
    }
    setSummaryBtnState('', 'idle');
  }

  function syncSummaryVolume() {
    if (summaryAudio) summaryAudio.volume = S.muted ? 0 : S.vol;
  }

  async function toggleSummaryPreview(key) {
    const song = summarySongs.get(key);
    if (!song) return;
    if (summaryKey === key && summaryAudio && !summaryAudio.paused) {
      stopSummaryPreview();
      return;
    }
    if (typeof Audio !== 'function') return;
    stopAudio();
    if (stopDuelAudio) stopDuelAudio();
    if (stopArtistAudio) stopArtistAudio();
    stopSummaryPreview();

    const ticket = ++summaryEpoch;
    summaryKey = key;
    setSummaryBtnState(key, 'loading');

    try {
      let preview = (song.pre && song.pre.preview) || '';
      if (!preview && song.slug) {
        const cached = LS.get('tl:trk5:' + song.slug);
        if (cached && cached.exp > Date.now() && cached.preview) preview = cached.preview;
      }
      if (!preview) {
        const meta = await resolve(song);
        preview = meta && meta.preview;
      }
      if (ticket !== summaryEpoch || !preview) {
        if (ticket === summaryEpoch) stopSummaryPreview();
        return;
      }
      if (!summaryAudio) {
        summaryAudio = new Audio();
        summaryAudio.preload = 'auto';
        summaryAudio.addEventListener('ended', () => {
          if (summaryKey) summaryPos.delete(summaryKey);
          if (summaryKey) stopSummaryPreview();
        });
        summaryAudio.addEventListener('error', () => {
          if (summaryKey) { stopSummaryPreview(); toast('Preview unavailable for this track.'); }
        });
      }
      syncSummaryVolume();
      if (summaryAudio.src !== preview) summaryAudio.src = preview;
      const resumeAt = summaryPos.get(key) || 0;
      try { summaryAudio.currentTime = resumeAt; } catch (e) {}
      await summaryAudio.play();
      if (ticket !== summaryEpoch) {
        try { summaryAudio.pause(); } catch (e) {}
        return;
      }
      setSummaryBtnState(key, 'playing');
    } catch (e) {
      if (ticket === summaryEpoch) {
        stopSummaryPreview();
        toast('Could not play preview.');
      }
    }
  }

  function renderShelfCard(item) {
    const cls = item.kosong ? 'kosong' : (item.won ? 'win' : 'lose');
    const thumb = item.art
      ? '<img class="thumb" src="' + esc(item.art) + '" alt="">'
      : '<span class="thumb ph"></span>';
    const playHtml = item.playKey
      ? '<button class="run-playbtn" type="button" data-s="idle" data-s-key="' + esc(item.playKey) + '" aria-label="' + esc('Play preview: ' + item.title) + '">' +
          '<svg class="ico-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z"/></svg>' +
          '<svg class="ico-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.4"/><rect x="13.5" y="5" width="4" height="14" rx="1.4"/></svg>' +
          '<svg class="ico-load" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="12 38"/></svg>' +
        '</button>'
      : '';
    const badge = item.badge
      ? '<span class="at">' + esc(item.badge) + '</span>'
      : '';
    return '<li class="' + cls + (item.playKey ? ' has-preview' : '') + '" data-diff="' + esc(item.diff || 'easy') + '">' +
      '<div class="run-artwrap">' + thumb + '<span class="lvl">' + esc(item.lvl) + '</span>' + playHtml + badge + '</div>' +
      '<span class="txt"><b>' + esc(item.title) + '</b>' +
      (item.artist ? '<small>' + esc(item.artist) + '</small>' : '') +
      '</span></li>';
  }

  function applyShelfAttrs(el, count) {
    if (!el || !el.dataset) return;
    el.dataset.count = String(count);
    el.dataset.odd = (count >= 3 && count % 2 === 1) ? 'true' : 'false';
  }

  /* ================= UI ================= */

  const UI = {
    q: $('#q'), dd: $('#dd'), track: $('#track'),
    wave: $('#trackWave'), fill: $('#trackFill'), seams: $('#trackSeams'), headEl: $('#trackHead'),
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
          switchRun();
          UI.buildControls(); UI.refreshLobby();
        };
      };
      fill($('#genre'),  GENRES,  S.genre,  'tl:genre');
      fill($('#era'),    ERAS,    S.era,    'tl:era');
    },

    /* --- rangkaian tahap --- */
    steps(host, live) {
      host.innerHTML = '';
      const count = stageCount();
      const isSpotify = !!(S.custom && S.custom.kind === 'spotify');
      host.hidden = !!(S.challenge || S.daily);
      if ($('#dailyGameBadge')) {
        const showSpBadge = isSpotify;
        $('#dailyGameBadge').hidden = !S.daily && !S.challenge && !showSpBadge;
        if (S.daily) $('#dailyGameBadge').textContent = 'Daily Challenge · 1 song';
        else if (S.challenge) $('#dailyGameBadge').textContent = 'Friend Challenge · 1 song';
        else if (showSpBadge) {
          const played = S.stages.filter((x) => x && x.done).length;
          const kindLbl = S.custom.spotifyType === 'album' ? 'Album' : 'Playlist';
          const totalInList = S.custom.songs.length;
          const countPart = count < totalInList
            ? (count + ' of ' + totalInList + ' songs')
            : (count + (count === 1 ? ' song' : ' songs'));
          const txt = kindLbl + ' · ' + countPart + (played ? ' · Score ' + score() + '/' + played : '');
          const cov = S.custom.cover && /^https:\/\//.test(S.custom.cover) ? S.custom.cover : '';
          $('#dailyGameBadge').innerHTML = (cov ? '<img class="sp-pill-cover" src="' + esc(cov) + '" alt="">' : '') +
            '<span>' + esc(txt) + '</span>';
        }
      }
      if (S.challenge || S.daily) return;
      const artistMode = S.runChallenge ? !!S.runChallenge.artistId : !!S.custom;
      const many = count > STAGES;
      host.classList.toggle('many', many);
      if (host.style && typeof host.style.setProperty === 'function') {
        if (!many) host.style.setProperty('--step-cols', String(Math.max(1, count)));
        else host.style.removeProperty('--step-cols');
      }

      let activeEl = null;
      for (let i = 0; i < count; i++) {
        const k = ORDER[i] || ORDER[ORDER.length - 1];
        if (i > 0 && !many) { const a = el('li', 'arrow'); a.textContent = '›'; host.appendChild(a); }
        const li = el('li');
        li.dataset.k = artistMode ? 'custom' : k;
        const rec = S.stages[i];
        let mark = '';
        if (live) {
          if (rec && rec.done) { li.classList.add(rec.won ? 'win' : 'lose'); mark = rec.won ? '✓' : '✕'; }
          else if (i === S.stage) { li.classList.add('now'); activeEl = li; }
        }
        const label = artistMode ? (i + 1) : DIFFS[k].label;
        li.innerHTML = label + (mark ? ' <span class="mark">' + mark + '</span>' : '');
        host.appendChild(li);
      }
      if (many && live && activeEl && typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          const targetLeft = activeEl.offsetLeft - (host.clientWidth - activeEl.offsetWidth) / 2;
          host.scrollLeft = Math.max(0, targetLeft);
        });
      }
    },

    /* --- panggung --- */
    playState(s) {
      this.play.dataset.s = s;
      this.play.classList.toggle('playing', s === 'playing');
      this.play.disabled = S.loading || S.audioFailed || !S.meta || (s === 'loading' && !playing);
      this.play.setAttribute('aria-busy', String(s === 'loading'));
      this.play.setAttribute('aria-label',
        s === 'loading' ? (playing ? 'Buffering audio. Stop playback' : 'Loading audio') : s === 'playing' ? 'Stop playback' : 'Play the clip');
      $('#coverPlay').disabled = this.play.disabled;
      $('#coverPlay').setAttribute('aria-busy', String(s === 'loading'));
      $('#coverPlay').setAttribute('aria-label', this.play.getAttribute('aria-label'));
      $('#coverPlay').dataset.playing = s === 'playing' ? '1' : '0';
    },
    readout(t) {
      const label = t === null ? fmt(S.done ? maxLen() : limit()) : t.toFixed(1) + 's';
      if (this.out.textContent !== label) this.out.textContent = label;
    },
    head(f) {
      if (f === null) { this.headEl.classList.remove('on'); return; }
      this.headEl.classList.add('on');
      this.headEl.style.transform = 'translate3d(' + Math.max(0, Math.min(100, f * 100)) + '%, -50%, 0)';
    },
    status(msg, err) {
      this.st.textContent = msg || '';
      this.st.classList.toggle('err', !!err);
      $('#resultAudioStatus').textContent = msg || '';
      $('#resultAudioStatus').classList.toggle('err', !!err);
      $('#resultAudioStatus').hidden = !msg;
    },
    playSweep(f, t) {
      const pEl = $('#trackPlayed');
      if (pEl) pEl.style.width = f === null ? '0%' : (Math.max(0, Math.min(100, f * 100)) + '%');
      const curEl = $('#trackCur');
      if (curEl) {
        const lbl = t === null ? '0.0s' : t.toFixed(1) + 's';
        if (curEl.textContent !== lbl) curEl.textContent = lbl;
      }
    },

    // Lobi hanya menghitung ulang kumpulan lagunya -- tidak memuat apa pun.
    // Lagu baru diambil saat tombol "Mulai main" ditekan.
    refreshLobby() {
      loadRun();
      buildPool();
      this.poolInfo();
      refreshDaily();

      const jalan = S.stages.filter(Boolean).length;
      $('#start').disabled = !S.pool.length;
      $('#start').textContent = S.runDone ? 'See result'
        : (jalan || S.guesses.length ? 'Continue' : 'Start');
      const duelSub = $('#duelLobbySub');
      if (duelSub) {
        const bestDuel = duelStats().best;
        duelSub.textContent = bestDuel > 0
          ? 'Spotify streams & release year · Best ' + bestDuel
          : 'Spotify streams & release year';
      }
      const artistSub = $('#artistLobbySub');
      if (artistSub) {
        const st = artistStats();
        artistSub.textContent = st.best > 0
          ? '6 clues · Best streak ' + st.best
          : st.won > 0
          ? '6 clues · Solved ' + st.won
          : 'Deduce the mystery artist from 6 clues';
      }
    },

    lobby() {
      stopAudio();
      if (stopDuel) stopDuel();
      if (stopArtistGame) stopArtistGame();
      $('#challengeIntro').hidden = true;
      if (S.challenge || S.runChallenge || S.daily) history.replaceState(null, '', location.pathname + location.search);
      if (S.custom || S.challenge || S.runChallenge || S.daily) { S.custom = null; S.challenge = null; S.runChallenge = null; S.daily = null; switchRun(); }   // keluar dari mode kustom, pulihkan sesi katalog
      S.epoch++;                       // batalkan pemuatan yang masih berjalan
      document.body.removeAttribute('data-diff');   // lobi tak terikat satu kesulitan
      $('#game').hidden = true;
      if ($('#duel')) $('#duel').hidden = true;
      if ($('#artistGame')) $('#artistGame').hidden = true;
      $('#lobby').hidden = false;
      this.buildControls();
      this.refreshLobby();
    },

    game() {
      $('#lobby').hidden = true;
      $('#challengeIntro').hidden = true;
      $('#game').hidden = false;
      const artistMode = S.runChallenge ? !!S.runChallenge.artistId : !!S.custom;
      document.body.dataset.diff = artistMode ? 'custom' : ORDER[S.stage];  // warna mewarnai seluruh halaman
      $('#gameMode').textContent = S.daily ? S.daily.day
        : S.runChallenge ? (S.runChallenge.artistLabel ? 'Friend challenge · ' + S.runChallenge.artistLabel : 'Friend challenge')
        : S.custom ? S.custom.label
        : [
          S.genre === 'all' ? null : GENRES[S.genre],
          S.era === 'all' ? null : ERAS[S.era].label
        ].filter(Boolean).join(' · ');
      $('#gameMode').hidden = !$('#gameMode').textContent;
      this.steps($('#steps'), true);
      $('#stageNow').innerHTML = S.daily ? 'One song · <b>5 tries</b>' : S.challenge
        ? 'Friend challenge · Your friend ' + window.TrackChallenge.describe(S.challenge.result)
        : S.runChallenge
        ? (artistMode ? 'Song <b>' + (S.stage + 1) + '</b> of ' + stageCount() : 'Stage <b>' + (S.stage + 1) + '</b> of ' + stageCount() + ' · <b>' + D().label + '</b>') +
          ' · Friend ' + window.TrackChallenge.describe(S.runChallenge.results[S.stage] || 0)
        : S.custom
        ? 'Song <b>' + (S.stage + 1) + '</b> of ' + stageCount() + ' · <b>' + esc(S.custom.label) + '</b>'
        : 'Stage <b>' + (S.stage + 1) + '</b> of ' + STAGES + ' · <b>' + D().label + '</b>';
      this.streak();
    },
    streak() {
      const badge = $('#songStreak');
      if (!badge) return;
      const cur = songStreak().current;
      if (!cur) { badge.hidden = true; badge.textContent = ''; badge.className = 'streak-pill'; return; }
      badge.hidden = false;
      badge.className = 'streak-pill' + (cur >= 3 ? ' hot' : '');
      badge.textContent = '\uD83D\uDD25 ' + cur;
    },

    poolInfo() {
      const p = $('#poolInfo');
      const total = filtered().length;
      let msg = '', warn = false;
      if (!total) { msg = 'No songs match these filters.'; warn = true; }
      else if (total < STAGES * 3) { msg = total + (total === 1 ? ' song matches.' : ' songs match.'); warn = true; }
      else if (S.genre !== 'all' || S.era !== 'all') { msg = total.toLocaleString('en-US') + ' songs'; }
      p.textContent = msg;
      p.hidden = !msg;
      p.classList.toggle('warn', warn);
    },
    // Bar kapsul bersekat gaya Songspot: isian warna penuh sampai batas klip
    // terbuka, sekat tipis di dalam kapsul, tanda segitiga ▲ + durasi tepat
    // di bawah batas aktif, dan sapuan terang + playhead saat diputar.
    bar() {
      const L = ladder(), n = L.length, max = maxLen();
      const unlockedIdx = S.done ? n - 1 : Math.min(S.guesses.length, n - 1);
      const pct = clipStop(unlockedIdx, n) * 100;
      const curLim = S.done ? max : L[unlockedIdx];

      this.fill.style.width = pct + '%';

      const pin = $('#trackLimitPin');
      if (pin) {
        pin.hidden = false;
        pin.style.left = Math.min(97, pct) + '%';
      }
      const tag = $('#trackLimitTag');
      if (tag) {
        tag.textContent = fmt(curLim);
        tag.style.left = Math.max(8, Math.min(92, pct)) + '%';
      }

      this.seams.innerHTML = '';
      for (let i = 0; i < n - 1; i++) {
        const cut = el('i');
        cut.style.left = (clipStop(i, n) * 100) + '%';
        this.seams.appendChild(cut);
      }
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
      this.skipBtn.disabled = !S.song || S.loading || S.audioFailed;
      this.q.disabled = S.done || !S.song || S.loading || S.audioFailed;
      this.play.disabled = !S.meta || S.loading || S.audioFailed || playPending;
      $('#coverPlay').disabled = this.play.disabled;

      const gHost = $('#guesses');
      if (gHost) {
        if (!S.guesses.length) {
          gHost.hidden = true;
          gHost.innerHTML = '';
        } else {
          gHost.hidden = false;
          gHost.innerHTML = S.guesses.map((g, i) => {
            const ico = g.t === 'right' ? '✓' : g.t === 'near' ? '≈' : g.t === 'skip' ? '»' : '✕';
            const txt = g.t === 'skip'
              ? 'Skipped'
              : '<b>' + esc(g.title || '') + '</b> <span>· ' + esc(g.artist || '') + '</span>';
            const hint = g.t === 'near' ? '<span class="g-hint">Right artist</span>' : '';
            const len = fmt(LADDER[Math.min(i, TRIES - 1)]);
            return '<li class="' + g.t + '"><span class="g-ico" aria-hidden="true">' + ico + '</span>' +
              '<span class="g-txt">' + txt + '</span>' +
              '<span class="g-tag">' + hint + '<span>' + len + '</span></span></li>';
          }).join('');
        }
      }

      if ($('#clipMax')) $('#clipMax').textContent = fmt(maxLen());
      const slotsHost = $('#trySlots');
      if (slotsHost) {
        slotsHost.innerHTML = Array.from({ length: TRIES }, (_, i) => {
          const g = S.guesses[i];
          const len = fmt(L[Math.min(i, L.length - 1)]);
          if (g) {
            const ico = g.t === 'right' ? '✓' : g.t === 'near' ? '≈' : g.t === 'skip' ? '»' : '✕';
            const txt = g.t === 'skip'
              ? '<span class="slot-skip">Skipped</span>'
              : '<b>' + esc(g.title || '') + '</b> <small>· ' + esc(g.artist || '') + '</small>';
            const hint = g.t === 'near' ? '<span class="slot-pill warn">Right artist</span>' : '';
            return '<li class="slot ' + g.t + '"><span class="slot-n" aria-hidden="true">' + ico + '</span>' +
              '<span class="slot-txt">' + txt + '</span>' + hint +
              '<span class="slot-len">' + len + '</span></li>';
          }
          if (!S.done && i === S.guesses.length) {
            const hintMsg = S.audioFailed ? 'Clip unavailable — tap Try again'
              : !S.song || S.loading ? 'Loading clip…'
              : 'Attempt ' + (i + 1) + ' · Listen to ' + len + ' clip';
            return '<li class="slot active"><span class="slot-n">' + (i + 1) + '</span>' +
              '<span class="slot-txt slot-active-lbl">' + hintMsg + '</span>' +
              '<span class="slot-len on">' + len + '</span></li>';
          }
          return '<li class="slot locked"><span class="slot-n">' + (i + 1) + '</span>' +
            '<span class="slot-txt"></span>' +
            '<span class="slot-len">' + len + '</span></li>';
        }).join('');
      }
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
        const tried = S.guesses.some((g) => sameStageGuess(g, s));
        const b = el('button', 'dd-item' + (tried ? ' tried' : ''));
        b.type = 'button';
        b.disabled = tried;
        // Sepuluh baris pertama dimuat biasa -- itu yang langsung terlihat,
        // dan loading="lazy" di situ justru menunda gambar sampai browser
        // menganggap dropdown terlihat. Sisanya baru dimuat saat digulung.
        const malas = i >= 10 ? ' loading="lazy"' : '';
        b.innerHTML =
          (s.art ? '<img class="dd-art"' + malas + ' src="' + esc(s.art) + '" alt="">'
                 : '<span class="dd-art ph" aria-hidden="true"></span>') +
          '<span class="dd-txt">' + esc(s.title) +
          '<small>' + esc(s.artist) + '</small></span>' +
          (tried ? '<span class="dd-badge">Tried</span>' : '');
        if (!tried) {
          // Di HP jangan pernah memilih saat touchstart: jari baru menempel dan
          // browser belum tahu ini ketukan atau geseran, jadi setiap usaha
          // menggulung daftar malah mengirim tebakan. Diputuskan di touchend,
          // hanya kalau jarinya nyaris tidak bergeser.
          let mulai = null;
          b.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            mulai = { x: t.clientX, y: t.clientY, ms: Date.now() };
          }, { passive: true });          // passive: biarkan gulungan tetap mulus

          b.addEventListener('touchend', (e) => {
            if (!mulai) return;
            const t = e.changedTouches[0];
            const geser = Math.abs(t.clientX - mulai.x) + Math.abs(t.clientY - mulai.y);
            const lama = Date.now() - mulai.ms;
            mulai = null;
            UI.lastTouch = Date.now();
            if (geser < 12 && lama < 700) { e.preventDefault(); UI.choose(i); }
          }, { passive: false });

          // mousedown dipakai desktop; dilewati kalau baru saja ada sentuhan
          // supaya klik tiruan dari layar sentuh tidak memilih dua kali.
          b.onmousedown = (e) => {
            if (Date.now() - (UI.lastTouch || 0) < 900) return;
            e.preventDefault();
            UI.choose(i);
          };
        }
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
      const len = this.list.length;
      for (let step = 1; step <= len; step++) {
        const idx = ((this.sel < 0 ? (d > 0 ? -1 : 0) : this.sel) + d * step + len) % len;
        if (!S.guesses.some((g) => sameStageGuess(g, this.list[idx]))) {
          this.sel = idx;
          break;
        }
        if (step === len) return;
      }
      [].forEach.call(this.dd.children, (c, i) => c.classList.toggle('sel', i === this.sel));
      const n = this.dd.children[this.sel];
      if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest' });
    },
    // Memilih dari daftar LANGSUNG mengirim tebakan -- tidak ada tombol terpisah.
    choose(i) {
      const s = this.list[i];
      if (!s || S.guesses.some((g) => sameStageGuess(g, s))) return;
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

      $('#resultModal .reveal').className = 'reveal ' + (S.won ? 'win' : 'lose');

      // Label kecil di atas judul: menang -> pujian, kalah -> "it was"
      $('#verdict').textContent = S.won
        ? ['first listen', 'nailed it', 'got there', 'safe', 'last try'][n - 1]
        : 'it was';

      // Panjang potongan saat tebakan benar -- ini yang bikin "0.1s" terasa keren,
      // jauh lebih bermakna daripada "tebakan ke-3".
      const badge = $('#badge');
      if (S.won) {
        const at = S.guesses.findIndex((g) => g.t === 'right');
        badge.className = 'badge';
        badge.textContent = 'Guessed in ' + fmt(LADDER[at]) + '!';
      } else {
        badge.className = 'badge lose';
        badge.textContent = 'Lost!';
      }

      const sn = $('#streakNote');
      if (sn) {
        const st = songStreak();
        if (S.won && streakKey() && st.current >= 1) {
          sn.hidden = false;
          sn.textContent = '\uD83D\uDD25 ' + st.current + (S.custom ? ' custom streak' : ' song streak') +
            (lastStreak && lastStreak.isNewBest ? ' · New best!' : st.best > st.current ? ' · Best ' + st.best : '');
        } else {
          sn.hidden = true;
          sn.textContent = '';
        }
      }

      const img = $('#cover');
      img.src = m.art || '';
      img.alt = 'Cover for ' + (m.title || sg.title || '');
      $('#rTitle').textContent = m.title || sg.title || '';
      $('#rArtist').textContent =
        [m.artist || sg.artist, m.album, m.year].filter(Boolean).join(' · ');

      const bg = $('#artBg');
      if (m.art) { bg.style.backgroundImage = 'url("' + m.art + '")'; bg.classList.add('on'); }
      else bg.classList.remove('on');

      const link = $('#listen');
      if (m.link) { link.href = m.link; link.hidden = false; } else link.hidden = true;

      $('#next').textContent = S.challenge ? 'Play regular game' : (S.daily ? 'Daily result' : S.stage >= stageCount() - 1 ? 'See result' : 'Next');
      const friendResult = S.challenge ? S.challenge.result : S.runChallenge ? (S.runChallenge.results[S.stage] || 0) : null;
      const comparison = $('#challengeComparison');
      comparison.hidden = friendResult === null;
      comparison.textContent = friendResult === null ? ''
        : window.TrackChallenge.compare(friendResult, S.won ? n : 0) +
          ' Your friend ' + window.TrackChallenge.describe(friendResult) +
          '; you ' + window.TrackChallenge.describe(S.won ? n : 0) + '.';

      open($('#resultModal'));
      confetti('#confetti', S.won ? 'win' : 'lose');
    },

    /* --- hasil satu sesi penuh --- */
    runResult() {
      document.body.removeAttribute('data-diff');   // rangkuman lintas kelima kesulitan
      const sc = score(), count = stageCount();
      const artistMode = S.runChallenge ? !!S.runChallenge.artistId : !!S.custom;
      const wonRun = sc >= (S.daily ? 1 : Math.ceil(count * 0.6));
      const v = $('#runVerdict');
      v.className = 'verdict ' + (wonRun ? 'win' : 'lose');
      const ratio = count ? sc / count : 0;
      v.textContent = S.daily
        ? (sc ? 'Daily solved!' : 'New song tomorrow.')
        : sc === 0 ? 'Zero. Try again!'
        : sc === count ? (artistMode ? 'Perfect. Every song!' : 'Perfect. Every stage.')
        : count === STAGES
        ? ['Zero. Try again!', 'One down.', 'Not bad.',
           'Nice run!', 'So close to perfect!', 'Perfect. Every stage.'][Math.min(5, sc)]
        : ratio >= 0.8 ? 'So close to perfect!'
        : ratio >= 0.6 ? 'Nice run!'
        : ratio >= 0.3 ? 'Not bad.'
        : 'Tough playlist!';
      $('#runScore').textContent = sc;
      $('#runScoreLabel').textContent = S.daily ? '/1 song'
        : '/' + count + (artistMode ? (count === 1 ? ' song' : ' songs') : (count === 1 ? ' stage' : ' stages'));

      const modeKind = S.daily ? 'daily' : artistMode ? 'custom' : 'classic';
      const runSheet = $('#runModal .run-sheet');
      if (runSheet && runSheet.dataset) {
        runSheet.dataset.mode = modeKind;
        runSheet.dataset.won = wonRun ? 'true' : 'false';
      }

      const modeTag = $('#runModeTag');
      if (modeTag) {
        if (modeTag.dataset) modeTag.dataset.mode = modeKind;
        if (S.daily) {
          modeTag.textContent = 'Daily Challenge · ' + S.daily.day;
        } else if (S.runChallenge) {
          modeTag.textContent = S.runChallenge.artistId
            ? ('Friend Challenge · ' + (S.runChallenge.artistLabel || 'Artist'))
            : ('Friend Challenge · ' + count + ' Stages');
        } else if (S.custom) {
          modeTag.textContent = 'Custom · ' + (S.custom.label || 'Artist');
        } else {
          const parts = [];
          if (S.genre !== 'all' && GENRES[S.genre]) parts.push(GENRES[S.genre]);
          if (S.era !== 'all' && ERAS[S.era]) parts.push(ERAS[S.era].label);
          modeTag.textContent = 'Classic · ' + (parts.length ? parts.join(' · ') : (count + ' Stages'));
        }
      }

      stopSummaryPreview();
      const stageArtsWin = [], stageArtsAll = [];
      const listEl = $('#runList');
      listEl.innerHTML = Array.from({ length: count }, (_, i) => {
        const k = ORDER[i] || ORDER[ORDER.length - 1];
        const r = S.stages[i];
        const lvl = S.daily ? "Today's song" : artistMode ? ('Song ' + (i + 1)) : DIFFS[k].label;
        const diff = S.daily ? 'daily' : artistMode ? 'custom' : k;
        if (!r || !r.done) {
          return renderShelfCard({ diff, kosong: true, art: '', lvl, title: 'Not played' });
        }
        const cat = (S.runChallenge && S.runChallenge.songs[i]) || findSong(r.slug);
        const art = (cat && cat.art) || '';
        if (art) {
          if (r.won) stageArtsWin.push(art);
          stageArtsAll.push(art);
        }
        const playKey = 'run:' + i;
        summarySongs.set(playKey, {
          slug: r.slug,
          trackId: r.trackId || (cat && cat.trackId) || null,
          title: r.title,
          artist: r.artist,
          pre: (cat && cat.pre) || null,
        });
        const at = r.guesses.findIndex((g) => g.t === 'right');
        return renderShelfCard({
          diff,
          won: r.won,
          art,
          lvl,
          playKey,
          badge: r.won ? fmt(LADDER[at]) : 'missed',
          title: r.title,
          artist: r.artist,
        });
      }).join('');
      applyShelfAttrs(listEl, count);
      const fanArts = (S.custom && S.custom.kind === 'spotify' && S.custom.cover)
        ? [S.custom.cover]
        : [...stageArtsWin, ...stageArtsAll];
      renderRunFan($('#runFan'), fanArts);

      $('#againRun').hidden = false;
      $('#againRun').textContent = (S.daily || S.runChallenge) ? 'Play regular game' : 'Play again';
      $('#dailyResult').hidden = !S.daily;
      if (S.daily) {
        const streak = dailyStreak();
        $('#dailyResult').textContent = 'Win streak ' + streak.current + ' · Best ' + streak.best + ' · Next daily in ' + window.DailyGame.remaining();
      }
      const runComp = $('#runChallengeResult');
      if (S.runChallenge) {
        const yourResults = Array.from({ length: count }, (_, i) => {
          const r = S.stages[i];
          if (!r || !r.done || !r.won) return 0;
          const at = r.guesses.findIndex((g) => g.t === 'right');
          return at >= 0 ? Math.min(TRIES, at + 1) : 0;
        });
        runComp.hidden = false;
        runComp.textContent =
          window.TrackChallenge.compareRun(S.runChallenge.results, yourResults) +
          ' Your friend scored ' + window.TrackChallenge.describeRun(S.runChallenge.results) +
          '; you scored ' + window.TrackChallenge.describeRun(yourResults) + '.';
      } else {
        runComp.hidden = true;
        runComp.textContent = '';
      }

      // latar dari sampul playlist (mode Spotify) atau lagu terakhir yang berhasil ditebak
      const menang = S.stages.filter((x) => x && x.won);
      const seed = menang.length ? menang[menang.length - 1] : null;
      const art = (S.custom && S.custom.kind === 'spotify' && S.custom.cover)
        || (seed && ((findSong(seed.slug) || {}).art || (S.runChallenge && (S.runChallenge.songs.find((x) => x.slug === seed.slug) || {}).art)));
      const bgr = $('#artBgRun');
      if (art) { bgr.style.backgroundImage = 'url("' + art + '")'; bgr.classList.add('on'); }
      else bgr.classList.remove('on');

      open($('#runModal'));
      confetti('#runConfetti', wonRun ? 'win' : 'lose');
    },

    // Begitu tebakan benar, langsung putar lagunya. Dipanggil dari dalam
    // penanganan klik tombol Tebak, jadi masih dalam jendela "user activation"
    // dan tidak diblokir kebijakan autoplay browser.
    autoplay() {
      if (!S.meta || playing) return;
      playClip();
    },

    stats(tab = statsTab) {
      statsTab = (tab === 'overall' || tab === 'daily' || tab === 'duel' || tab === 'artist') ? tab : 'filter';
      const tabs = $('#statsTabs');
      if (tabs && typeof tabs.querySelectorAll === 'function') {
        tabs.querySelectorAll('[data-tab]').forEach((b) => {
          const on = b.dataset.tab === statsTab;
          b.setAttribute('aria-selected', String(on));
          b.setAttribute('aria-pressed', String(on));
        });
      }
      const dh = $('#distHeading');
      const rt = $('#reset');
      if (statsTab === 'daily') {
        const d = dailyStats();
        $('#statScope').textContent = 'Daily Challenge · all saved days';
        $('#statgrid').innerHTML =
          cell(d.played, 'played') + cell(d.won, 'wins') +
          cell(d.current, 'streak') + cell(d.best, 'best');
        if (dh) dh.textContent = 'Attempt spread';
        const labels = ['0.1s', '0.5s', '2s', '8s', '15s', 'Miss'];
        const top = Math.max.apply(null, d.dist.concat([1]));
        $('#dist').innerHTML = d.dist.map((c, i) =>
          '<div class="row"><span class="n wide">' + labels[i] + '</span>' +
          '<div class="bar' + (c && c === top ? ' hot' : '') + '" style="width:' +
          Math.max(8, c / top * 100) + '%">' + c + '</div></div>').join('');
        if (rt) rt.hidden = true;
      } else if (statsTab === 'duel') {
        const d = duelStats();
        $('#statScope').textContent = 'Music Duel · Spotify Streams & Release Year';
        $('#statgrid').innerHTML =
          cell(d.streamsBest, 'streams best') + cell(d.yearBest, 'year best') +
          cell(d.best, 'best streak') + cell(d.runs, 'duels');
        if (dh) dh.textContent = 'Deck comparison';
        const peak = Math.max(d.streamsBest, d.yearBest);
        const top = Math.max(peak, 1);
        const rows = [
          { label: 'Streams', val: d.streamsBest },
          { label: 'Year', val: d.yearBest }
        ];
        $('#dist').innerHTML = rows.map((r) =>
          '<div class="row"><span class="n wide duel">' + r.label + '</span>' +
          '<div class="bar' + (r.val && r.val === peak ? ' hot' : '') + '" style="width:' +
          Math.max(8, r.val / top * 100) + '%">' + r.val + '</div></div>').join('');
        if (rt) rt.hidden = true;
      } else if (statsTab === 'artist') {
        const d = artistStats();
        $('#statScope').textContent = 'Artist Detective · Top 250 roster';
        $('#statgrid').innerHTML =
          cell(d.played, 'played') + cell(d.won, 'solved') +
          cell(d.current, 'streak') + cell(d.best, 'best');
        if (dh) dh.textContent = 'Guesses to solve';
        const buckets = [
          { label: '1–2', val: d.dist[0] + d.dist[1] },
          { label: '3–4', val: d.dist[2] + d.dist[3] },
          { label: '5–6', val: d.dist[4] + d.dist[5] },
          { label: '7–8', val: d.dist[6] + d.dist[7] },
          { label: '9–10', val: d.dist[8] + d.dist[9] },
          { label: 'Miss', val: d.dist[10] }
        ];
        const peak = Math.max.apply(null, buckets.map((b) => b.val));
        const top = Math.max(peak, 1);
        $('#dist').innerHTML = buckets.map((b) =>
          '<div class="row"><span class="n wide">' + b.label + '</span>' +
          '<div class="bar' + (b.val && b.val === peak ? ' hot' : '') + '" style="width:' +
          Math.max(8, b.val / top * 100) + '%">' + b.val + '</div></div>').join('');
        if (rt) rt.hidden = true;
      } else {
        const overall = statsTab === 'overall';
        const st = overall ? allClassicStats() : Object.assign(blankStats(), LS.get(statKey(), {}));
        const bestStreak = overall ? songStreak('classic').best : 0;
        $('#statScope').textContent = overall
          ? [(st.filtersUsed ? 'All Classic filters · ' + st.filtersUsed + (st.filtersUsed === 1 ? ' preset' : ' presets') : 'All Classic filters'),
             bestStreak ? 'Best song streak ' + bestStreak : ''].filter(Boolean).join(' · ')
          : [GENRES[S.genre], ERAS[S.era].label].join(' · ');
        const avg = st.runs ? (st.total / st.runs).toFixed(1) : '0';
        $('#statgrid').innerHTML =
          cell(st.runs, 'runs') + cell(avg, 'average') +
          cell(st.best, 'best') + cell(st.perfect || 0, 'perfect');
        if (dh) dh.textContent = 'Score spread';
        const top = Math.max.apply(null, st.dist.concat([1]));
        $('#dist').innerHTML = st.dist.map((c, i) =>
          '<div class="row"><span class="n">' + i + '</span>' +
          '<div class="bar' + (c && c === top ? ' hot' : '') + '" style="width:' +
          Math.max(8, c / top * 100) + '%">' + c + '</div></div>').join('');
        if (rt) rt.hidden = overall;
      }
      open($('#statsModal'));
    }
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cell = (v, l) => '<div><b>' + v + '</b><small>' + l + '</small></div>';

  // Untuk dibagikan ke teman -- di sini emoji memang tepat, karena
  // itu satu-satunya cara mewarnai teks di WhatsApp/X.
  function squares(gs) {
    let s = '';
    for (let i = 0; i < TRIES; i++) {
      const g = gs[i];
      s += !g ? '⬜' : g.t === 'right' ? '🟩' : g.t === 'skip' ? '⬛' : g.t === 'near' ? '🟨' : '🟥';
    }
    return s;
  }

  function runSubtitle() {
    if (S.runChallenge) {
      return S.runChallenge.artistLabel ? 'Friend challenge · ' + S.runChallenge.artistLabel : 'Friend challenge';
    }
    if (S.custom) return S.custom.label;
    const tags = [
      S.genre === 'all' ? null : GENRES[S.genre],
      S.era === 'all' ? null : ERAS[S.era].label
    ].filter(Boolean);
    return tags.length ? tags.join(' · ') : 'All songs';
  }

  function shareText() {
    if (S.daily) return 'TuneUp · Daily Challenge · ' + S.daily.day + '\n' +
      (S.stages[0] && S.stages[0].won ? 'Guessed in ' + fmt(LADDER[S.stages[0].guesses.findIndex((g) => g.t === 'right')]) : 'Missed') + '\n' + squares((S.stages[0] || {}).guesses || []) +
      '\nWin streak: ' + dailyStreak().current + '\n' + siteUrl() + '#daily';
    const count = stageCount();
    const artistMode = S.runChallenge ? !!S.runChallenge.artistId : !!S.custom;

    let lines;
    if (count > 10) {
      const cells = Array.from({ length: count }, (_, i) => {
        const r = S.stages[i];
        return (!r || !r.done) ? '⬜' : (r.won ? '🟩' : '🟥');
      });
      lines = [];
      for (let i = 0; i < cells.length; i += 10) lines.push(cells.slice(i, i + 10).join(''));
    } else {
      lines = Array.from({ length: count }, (_, i) => {
        const k = ORDER[i] || ORDER[ORDER.length - 1];
        const name = artistMode ? ('Song ' + (i + 1)) : DIFFS[k].label;
        const r = S.stages[i];
        if (!r || !r.done) return '⬜ ' + name;
        const at = r.guesses.findIndex((g) => g.t === 'right');
        return (r.won ? '🟩 ' : '🟥 ') + name + (r.won ? ' ' + fmt(LADDER[at]) : '');
      });
    }

    const ids = [], results = [];
    for (let i = 0; i < count; i++) {
      const r = S.stages[i];
      const cs = S.runChallenge && S.runChallenge.songs[i];
      const tid = (r && r.trackId) || (cs && (cs.trackId || (cs.pre && cs.pre.trackId))) ||
        (i === S.stage && ((S.meta && S.meta.trackId) || (S.song && S.song.trackId))) ||
        (r && r.slug && (findSong(r.slug) || {}).trackId) || null;
      if (tid == null || !/^[1-9]\d{0,15}$/.test(String(tid))) continue;
      ids.push(String(tid));
      const at = r && r.done && r.won ? r.guesses.findIndex((g) => g.t === 'right') : -1;
      results.push(at >= 0 ? Math.min(TRIES, at + 1) : 0);
    }
    const artistId = S.runChallenge ? S.runChallenge.artistId
      : (S.custom && /^[1-9]\d{0,15}$/.test(String(S.custom.id)) ? String(S.custom.id) : null);
    let url = siteUrl();
    if (S.custom && S.custom.kind === 'spotify' && S.custom.spotifyId) {
      url = url + '?spotify=' + encodeURIComponent((S.custom.spotifyType === 'album' ? 'album:' : '') + S.custom.spotifyId) +
        (count < S.custom.songs.length ? '&songs=' + count : '');
    } else if (ids.length && window.TrackChallenge && typeof window.TrackChallenge.createRun === 'function') {
      url = window.TrackChallenge.createRun(url, ids, results, artistId);
    }

    return 'TuneUp · ' + runSubtitle() + ' · ' + score() + '/' + count +
           '\n' + lines.join('\n') + '\n' + url;
  }

  // Alamat situs mengikuti domain tempat game dibuka (github.io, pages.dev,
  // domain sendiri -- apa pun), jadi tautan tantangan tak pernah usang.
  function siteUrl() { return location.origin + location.pathname; }

  // tantangan satu lagu -- sengaja tidak menyebut judulnya
  function shareStage() {
    const at = S.guesses.findIndex((g) => g.t === 'right');
    const hasil = S.won ? 'I got it in ' + fmt(LADDER[at]) : 'I lost this one';
    const link = (S.meta && S.meta.trackId && window.TrackChallenge)
      ? window.TrackChallenge.create(siteUrl(), S.meta.trackId, S.won ? at + 1 : 0)
      : (S.custom && S.custom.kind === 'spotify' && S.custom.spotifyId)
      ? siteUrl() + '?spotify=' + encodeURIComponent((S.custom.spotifyType === 'album' ? 'album:' : '') + S.custom.spotifyId)
      : (S.custom && S.custom.kind === 'spotify')
      ? siteUrl()
      : (() => { throw new Error('No shareable track id'); })();
    return 'TuneUp · ' + (S.custom ? S.custom.label : D().label) + '\n' +
           squares(S.guesses) + '  ' + hasil + '\n' +
           'Beat me: ' + link;
  }

  function pushRecent(sl) {
    if (!sl) return;
    const r = LS.get('tl:recent', []);
    r.unshift(sl);
    LS.set('tl:recent', r.slice(0, 40));
  }

  /* ================= confetti ================= */

  // Hujan kertas di layar hasil. Canvas polos, tanpa pustaka luar.
  // Hanya tampil saat menang; saat kalah layar hasil tampil bersih tanpa perayaan.
  let confettiStop = null;
  function confetti(sel, mode) {
    if (confettiStop) { confettiStop(); confettiStop = null; }
    if (mode === 'lose' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $(sel);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    // Keep the raster workload bounded on large/high-DPI screens. CSS still
    // fills the viewport; positions and velocities share the same scale.
    const dpr = Math.min(window.devicePixelRatio || 1, 2,
      Math.sqrt(1200000 / Math.max(1, innerWidth * innerHeight)));
    const W = cv.width = Math.max(1, Math.floor(innerWidth * dpr));
    const H = cv.height = Math.max(1, Math.floor(innerHeight * dpr));
    const cols = ['#25e07d', '#ffffff', '#12b862', '#8ef7bd', '#d8fbe8'];
    const bits = [];

    for (let i = 0; i < 120; i++) {
      bits.push({
        x: W * (0.34 + Math.random() * 0.32),
        y: H * 0.44,
        vx: (Math.random() - 0.5) * 11 * dpr,
        vy: (-4 - Math.random() * 9) * dpr,
        w: (4 + Math.random() * 5) * dpr,
        h: (6 + Math.random() * 8) * dpr,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.32,
        col: cols[(Math.random() * cols.length) | 0]
      });
    }
    const grav = 0.28;

    let rafc = 0, prev = performance.now();
    confettiStop = () => { cancelAnimationFrame(rafc); ctx.clearRect(0, 0, W, H); };
    (function frame(now) {
      if (document.hidden) { confettiStop(); return; }
      const dt = Math.min((now - prev) / 16.67, 3);
      prev = now;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const b of bits) {
        b.vy += grav * dpr * dt;
        b.vx *= Math.pow(0.996, dt);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.vr * dt;
        if (b.y >= H + 50 * dpr) continue;
        alive++;
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
  }

  /* ================= modal & toast ================= */

  function open(m) { m.hidden = false; }
  function closeAll() {
    if (typeof stopSummaryPreview === 'function') stopSummaryPreview();
    if (confettiStop) { confettiStop(); confettiStop = null; }
    [].forEach.call(document.querySelectorAll('.modal'), (m) => m.hidden = true);
  }

  function dismissModal() {
    const completedDaily = S.daily && S.runDone && !$('#runModal').hidden;
    const finishedDuel = $('#duelModal') && !$('#duelModal').hidden && $('#duel') && !$('#duel').hidden && duelEnded();
    closeAll();
    if (completedDaily || finishedDuel) UI.lobby();
  }

  document.addEventListener('click', (e) => {
    const summaryLi = e.target && typeof e.target.closest === 'function'
      ? e.target.closest('.runlist.run-shelf li.has-preview')
      : null;
    if (summaryLi) {
      const pb = summaryLi.querySelector('.run-playbtn');
      if (pb && pb.dataset && pb.dataset.sKey) toggleSummaryPreview(pb.dataset.sKey);
      return;
    }
    if (e.target.classList.contains('modal') || e.target.hasAttribute('data-close')) dismissModal();
  });

  let toastT = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, 2200);
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
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#challenge=') || location.hash.startsWith('#run=') || location.hash.startsWith('#duel=') || location.hash.startsWith('#artist=') || location.hash === '#daily') location.reload();
  });
  $('#openDaily').onclick = startDaily;
  $('#retrySong').onclick = () => load(S.song || S.retrySong);
  $('#resultRetry').onclick = () => load(S.song || S.retrySong);
  $('#acceptChallenge').onclick = acceptChallenge;
  $('#leaveChallenge').onclick = () => { history.replaceState(null, '', location.pathname + location.search); UI.lobby(); };
  $('#back').onclick = () => { closeAll(); UI.lobby(); };
  $('#next').onclick = nextStage;
  $('#againRun').onclick = newRun;
  $('#backToMenu').onclick = () => {
    closeAll();
    UI.lobby();
    $('#start').focus();
  };

  // ---- custom game (main satu artis) ----
  $('#openCustom').onclick = openCustom;
  $('#openStats').onclick = () => { closeAll(); UI.stats(); };

  $('#openFeedback').onclick = () => {
    stopAudio();
    if (stopDuelAudio) stopDuelAudio();
    if (stopArtistAudio) stopArtistAudio();
    const inDuelMode = $('#duel') && !$('#duel').hidden;
    const inArtistMode = $('#artistGame') && !$('#artistGame').hidden;
    const artistMode = S.custom && (!S.runChallenge || S.runChallenge.artistId);
    const details = [inDuelMode ? 'Mode: Music Duel'
      : inArtistMode ? 'Mode: Artist Detective'
      : S.daily ? 'Mode: Daily ' + S.daily.day
      : (S.challenge || S.runChallenge) ? ('Mode: Friend challenge' + (S.runChallenge && S.runChallenge.artistLabel ? ' — ' + S.runChallenge.artistLabel : ''))
      : S.custom ? 'Mode: Custom artist — ' + S.custom.label
      : 'Mode: Free play',
      !$('#game').hidden && !S.daily && !S.challenge
        ? ('Stage: ' + (artistMode ? 'Song ' + (S.stage + 1) : D().label))
        : '',
      S.done && S.meta ? 'Song: ' + S.meta.title + ' — ' + S.meta.artist : ''].filter(Boolean).join('\n');
    closeAll();
    window.PlayerFeedback.open(details);
  };
  $('#reportSong').onclick = () => {
    if (!S.done || !S.song || !S.meta) return;
    const meta = S.meta, song = S.song;
    const short = value => String(value || '').slice(0, 110);
    const details = [
      'Mode: ' + gameMode(),
      'Track ID: ' + short(meta.trackId || song.trackId),
      'Song: ' + short(meta.title) + ' — ' + short(meta.artist),
      'Catalogue: ' + short(song.title) + ' — ' + short(song.artist)
    ].join('\n').slice(0, 600);
    stopAudio(); closeAll();
    window.PlayerFeedback.openSong(details);
  };
  let artistT = 0, artistReq = 0;
  $('#artistQ').addEventListener('input', () => {
    if ($('#artistClear')) $('#artistClear').hidden = !$('#artistQ').value;
    const v = $('#artistQ').value.trim();
    clearTimeout(artistT);
    if (v.length < 2) {
      $('#artistResults').hidden = true; $('#artistResults').innerHTML = '';
      renderQuickArtists(true);
      return;
    }
    const my = ++artistReq;
    artistT = setTimeout(async () => {
      let list = [];
      try { list = await searchArtists(v); } catch (e) { list = []; }
      if (!list.length) list = localArtistMatches(v);
      if (my === artistReq) renderArtists(list);
    }, 260);
  });
  if ($('#artistClear')) {
    $('#artistClear').onclick = () => {
      clearTimeout(artistT);
      artistReq++;
      $('#artistQ').value = '';
      $('#artistClear').hidden = true;
      $('#artistResults').hidden = true;
      $('#artistResults').innerHTML = '';
      renderQuickArtists(true);
      $('#artistQ').focus();
    };
  }
  $('#artistQ').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = $('#artistResults').querySelector('.artist-row');
      if (first) startCustom(first.dataset.id, first.dataset.name);
    }
  });
  $('#artistResults').addEventListener('click', (e) => {
    const b = e.target.closest('.artist-row');
    if (b && !b.disabled) startCustom(b.dataset.id, b.dataset.name);
  });
  if ($('#customQuick')) {
    $('#customQuick').addEventListener('click', (e) => {
      const clr = e.target.closest('#clearRecentArtists');
      if (clr && !clr.disabled) { clearRecentArtists(); return; }
      const sur = e.target.closest('#surprisePopularArtist');
      if (sur && !sur.disabled) { surprisePopularArtist(); return; }
      const ref = e.target.closest('#refreshPopularArtists');
      if (ref && !ref.disabled) { refreshPopularArtists(); return; }
      const b = e.target.closest('.artist-chip');
      if (b && !b.disabled) startCustom(b.dataset.id, b.dataset.name);
    });
  }
  if ($('#statsTabs')) {
    $('#statsTabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (b) UI.stats(b.dataset.tab);
    });
  }
  $('#shareStage').onclick = () => {
    try { salin(shareStage(), 'challenge_copy'); }
    catch (e) { toast('This recording cannot be shared right now. Try another song.'); }
  };
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
      else if (!UI.dd.hidden && UI.list.length === 1 && !S.guesses.some((g) => sameStageGuess(g, UI.list[0]))) UI.choose(0);
      else toast('Pick a song from the list first');
    }
  });
  UI.q.addEventListener('blur', () => setTimeout(() => UI.closeDD(), 120));
  $('#clear').onclick = () => { UI.clearInput(); UI.q.focus(); };

  const inGame = () => !$('#game').hidden;
  const inDuel = () => $('#duel') && !$('#duel').hidden;
  const inArtist = () => $('#artistGame') && !$('#artistGame').hidden;
  document.addEventListener('keydown', (e) => {
    const typing = e.target === UI.q || e.target === $('#agQ');
    if (e.key === 'Escape') { dismissModal(); return; }
    // Dialogs and focused controls keep their native keyboard behavior.
    if (document.querySelector('.modal:not([hidden])') || !$('#challengeIntro').hidden) return;
    if (!typing && e.target.closest('button, input, select, textarea, a')) return;
    if (inArtist()) {
      const doneBanner = $('#agResultBanner') && !$('#agResultBanner').hidden;
      if (!typing && doneBanner) {
        if (e.code === 'Space' && $('#agResultArt')) { e.preventDefault(); $('#agResultArt').click(); }
        else if (e.key === 'Enter' && $('#agNextBtn')) { e.preventDefault(); $('#agNextBtn').click(); }
      }
      return;
    }
    if (inDuel()) {
      if (e.key === 'ArrowUp' && !$('#duelLater').disabled) { e.preventDefault(); $('#duelLater').click(); }
      else if (e.key === 'ArrowDown' && !$('#duelEarlier').disabled) { e.preventDefault(); $('#duelEarlier').click(); }
      else if (e.code === 'Space') {
        e.preventDefault();
        const playingA = $('#duelPlayA') && $('#duelPlayA').dataset.s === 'playing';
        const btn = playingA ? $('#duelPlayA') : $('#duelPlayB');
        if (btn) btn.click();
      }
      return;
    }
    if (!inGame()) {
      // di lobi, Enter = mulai main sesuai tab aktif Classic
      if (!$('#lobby').hidden && e.key === 'Enter') {
        if ($('#classicArtistPanel') && !$('#classicArtistPanel').hidden && $('#openCustom')) {
          e.preventDefault();
          $('#openCustom').click();
        } else if (!$('#start').disabled) {
          e.preventDefault();
          $('#start').click();
        }
      }
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
    if (syncDuelVolume) syncDuelVolume();
    if (syncArtistVolume) syncArtistVolume();
    syncSummaryVolume();
    $('#mute').classList.remove('muted');
  };
  $('#mute').onclick = () => {
    S.muted = !S.muted;
    LS.set('tl:muted', S.muted);
    audio.volume = S.muted ? 0 : S.vol;
    if (syncDuelVolume) syncDuelVolume();
    if (syncArtistVolume) syncArtistVolume();
    syncSummaryVolume();
    $('#mute').classList.toggle('muted', S.muted);
  };
  $('#mute').classList.toggle('muted', S.muted);

  $('#reset').onclick = () => {
    LS.del(statKey());
    UI.stats();
    toast('Stats reset');
  };

  function copyTextSync(txt) {
    const ta = el('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let copied = false;
    try { copied = document.execCommand('copy'); }
    catch (e) { /* Caller shows failure below. */ }
    ta.remove();
    return copied;
  }

  async function salin(txt, eventName, modeOverride) {
    const mode = modeOverride || gameMode();
    let copied = false;
    try {
      await navigator.clipboard.writeText(txt);
      copied = true;
    } catch (e) {
      copied = copyTextSync(txt);
    }
    toast(copied ? 'Copied — paste it to a friend' : 'Copy failed');
    if (copied && eventName) trackActivity(eventName, { mode });
    return copied;
  }

  $('#share').onclick = () => salin(shareText(), 'result_copy');
  if ($('#saveRunCard')) {
    $('#saveRunCard').onclick = async () => {
      if (!window.TuneUpCard) return;
      try {
        const sub = S.custom ? S.custom.label
          : [S.genre === 'all' ? null : GENRES[S.genre], S.era === 'all' ? null : ERAS[S.era].label].filter(Boolean).join(' · ') || 'All songs';
        const outcome = await window.TuneUpCard.shareOrSave({
          kind: 'run',
          mode: S.daily ? 'daily' : S.custom ? 'custom' : 'regular',
          isSpotify: !!(S.custom && S.custom.kind === 'spotify'),
          total: stageCount(),
          stages: S.stages,
          ladder: ladder(),
          day: S.daily ? S.daily.day : '',
          streak: S.daily ? dailyStats().current : songStreak().current,
          subtitle: sub,
          verdict: $('#runVerdict') ? $('#runVerdict').textContent : '',
          url: siteUrl()
        });
        if (outcome === 'downloaded') toast('Score card saved!');
        else if (outcome === 'shared') toast('Score card shared!');
      } catch (e) {
        toast('Could not save score card.');
      }
    };
  }

  audio.addEventListener('ended', stopAudio);
  audio.addEventListener('error', () => {
    if (!S.loading && S.meta && !$('#game').hidden) audioFailure();
  });
  audio.addEventListener('waiting', () => {
    if (!playing) return;
    UI.playState('loading');
    UI.status('Buffering audio…');
    clearTimeout(bufferTimer);
    bufferTimer = setTimeout(() => { if (playing) audioFailure(); }, 12000);
  });
  audio.addEventListener('playing', () => {
    clearTimeout(bufferTimer);
    if (playing) { UI.playState('playing'); UI.status(''); }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (playing || playPending) stopAudio();
    if (stopArtistAudio) stopArtistAudio();
    stopSummaryPreview();
  });

  /* ================= mulai ================= */

  (() => {
    const Duel = window.ReleaseDuel;
    if (!Duel || !$('#duel') || !$('#openDuel')) return;
    const duelPools = {
      streams: Duel.buildPool(ALL, window.DUEL_STREAMS_V1, 'streams'),
      year: Duel.buildPool(ALL, null, 'year')
    };
    const readBest = (kind) => Math.max(0, Number(LS.get(DUEL_BEST_KEYS[kind] || DUEL_BEST_KEYS.year, 0)) || 0);
    const duelPos = new Map();
    const slotPlayers = {
      a: { audio: null, preview: '', slug: '' },
      b: { audio: null, preview: '', slug: '' }
    };
    let duelAudioEpoch = 0, activeSlot = null, lastMouseCard = null, manualPausedSlot = null;
    let duelTimer = 0, duelEpoch = 0;
    const ds = { kind: 'streams', a: null, b: null, score: 0, best: 0, newBest: false, seen: new Set(), history: [], busy: false, over: false, challenge: null, queue: [], qIndex: 0 };

    const btnOf = (slot) => slot === 'a' ? $('#duelPlayA') : $('#duelPlayB');
    const cardOf = (slot) => slot === 'a' ? $('#duelA') : $('#duelB');
    const setPlayBtn = (slot, state) => {
      const btn = btnOf(slot), card = cardOf(slot);
      if (btn) btn.dataset.s = state;
      if (card) card.classList.toggle('playing', state === 'playing');
    };
    const pauseSlot = (slot) => {
      const sp = slotPlayers[slot];
      if (sp && sp.audio) {
        sp.audio.pause();
        if (sp.slug && Number.isFinite(sp.audio.currentTime) && !sp.audio.ended) {
          duelPos.set(sp.slug, sp.audio.currentTime);
        }
      }
      setPlayBtn(slot, 'idle');
    };

    stopDuelAudio = () => {
      duelAudioEpoch++;
      activeSlot = null;
      pauseSlot('a');
      pauseSlot('b');
    };
    syncDuelVolume = () => {
      const v = S.muted ? 0 : S.vol;
      for (const slot of ['a', 'b']) {
        if (slotPlayers[slot].audio) slotPlayers[slot].audio.volume = v;
      }
    };
    stopDuel = () => {
      clearTimeout(duelTimer);
      duelEpoch++;
      lastMouseCard = null;
      manualPausedSlot = null;
      ds.busy = false;
      ds.over = false;
      if (ds.challenge) {
        ds.challenge = null;
        ds.queue = [];
        ds.qIndex = 0;
        if (location.hash.startsWith('#duel=')) history.replaceState(null, '', location.pathname + location.search);
      }
      stopDuelAudio();
    };
    duelEnded = () => ds.over;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && activeSlot) stopDuelAudio();
    });

    function ensureSlotAudio(slot) {
      const sp = slotPlayers[slot];
      if (sp.audio) return sp;
      const a = new Audio();
      a.preload = 'auto';
      a.addEventListener('ended', () => {
        if (sp.slug) duelPos.delete(sp.slug);
        if (activeSlot === slot) activeSlot = null;
        setPlayBtn(slot, 'idle');
      });
      a.addEventListener('error', () => {
        if (activeSlot !== slot) return;
        activeSlot = null;
        setPlayBtn(slot, 'idle');
        $('#duelStatus').textContent = 'Preview unavailable right now — you can still guess!';
      });
      sp.audio = a;
      return sp;
    }

    function seekOnceReady(a, targetTime) {
      return new Promise((done) => {
        if (!(targetTime > 0.05)) return done();
        const apply = () => {
          try {
            const cap = Number.isFinite(a.duration) ? Math.max(0, a.duration - 0.3) : targetTime;
            a.currentTime = Math.min(targetTime, cap);
          } catch (e) {}
          done();
        };
        if (a.readyState >= 1) return apply();
        const onMeta = () => { a.removeEventListener('loadedmetadata', onMeta); apply(); };
        a.addEventListener('loadedmetadata', onMeta);
        setTimeout(() => { a.removeEventListener('loadedmetadata', onMeta); done(); }, 1500);
      });
    }

    async function playDuelSlot(slot) {
      const song = slot === 'a' ? ds.a : ds.b;
      if (!song || $('#duel').hidden || ds.over) return;
      stopAudio();
      const other = slot === 'a' ? 'b' : 'a';
      if (activeSlot === other) pauseSlot(other);
      const myEpoch = ++duelAudioEpoch;
      activeSlot = slot;
      const sp = slotPlayers[slot];
      const fastResume = sp.audio && sp.slug === song.slug && sp.preview;

      try {
        let previewUrl = fastResume ? sp.preview : '';
        if (!previewUrl) {
          setPlayBtn(slot, 'loading');
          const meta = await resolve(song);
          if (myEpoch !== duelAudioEpoch || activeSlot !== slot || $('#duel').hidden || !meta || !meta.preview) return;
          previewUrl = meta.preview;
        }
        ensureSlotAudio(slot);
        sp.audio.volume = S.muted ? 0 : S.vol;
        if (sp.slug !== song.slug || sp.preview !== previewUrl) {
          sp.slug = song.slug;
          sp.preview = previewUrl;
          sp.audio.src = previewUrl;
          const saved = duelPos.get(song.slug) || 0;
          await seekOnceReady(sp.audio, saved);
          if (myEpoch !== duelAudioEpoch || activeSlot !== slot || $('#duel').hidden) return;
        }
        await sp.audio.play();
        if (myEpoch !== duelAudioEpoch || activeSlot !== slot || $('#duel').hidden) {
          sp.audio.pause();
          return;
        }
        setPlayBtn(slot, 'playing');
        $('#duelStatus').textContent = '';
      } catch (err) {
        if (myEpoch !== duelAudioEpoch || activeSlot !== slot) return;
        activeSlot = null;
        setPlayBtn(slot, 'idle');
        if (err && err.name !== 'NotAllowedError') {
          $('#duelStatus').textContent = 'Preview unavailable right now — you can still guess!';
        }
      }
    }

    function toggleDuelPreview(slot) {
      if (activeSlot === slot) {
        manualPausedSlot = slot;
        duelAudioEpoch++;
        activeSlot = null;
        pauseSlot(slot);
        return;
      }
      manualPausedSlot = null;
      playDuelSlot(slot);
    }

    function syncDuelChrome(a) {
      const isStreams = ds.kind === 'streams';
      const mA = Duel.formatMetric(a, ds.kind);
      $('#duelModeLabel').textContent = isStreams ? 'Spotify Streams' : 'Release Year';
      if ($('#duelTabs')) {
        $('#duelTabs').querySelectorAll('[data-duel]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.duel === ds.kind));
          if (b.dataset.duel === 'streams') b.disabled = duelPools.streams.length < 2;
        });
      }
      $('#duelTagA').textContent = isStreams ? 'Known streams' : 'Released';
      $('#duelPrompt').innerHTML = isStreams
        ? 'Does the challenger have <b>more</b> or <b>fewer</b> Spotify streams?'
        : 'Guess if the challenger came out <b>earlier</b> or <b>later</b>.';
      $('#duelLaterLbl').textContent = isStreams ? '\u25B2 Higher' : '\u25B2 Later';
      $('#duelEarlierLbl').textContent = isStreams ? '\u25BC Lower' : '\u25BC Earlier';
      $('#duelLaterSub').textContent = (isStreams ? 'More than ' : 'After ') + mA.main;
      $('#duelEarlierSub').textContent = (isStreams ? 'Fewer than ' : 'Before ') + mA.main;
    }

    function syncDuelTarget() {
      const el = $('#duelTarget');
      if (!el) return;
      if (!ds.challenge) {
        el.hidden = true;
        if (el.dataset) delete el.dataset.passed;
        return;
      }
      const target = ds.challenge.score;
      const passed = ds.score > target;
      el.hidden = false;
      if (el.dataset) el.dataset.passed = passed ? '1' : '0';
      el.textContent = passed ? ('Beat ' + target + '!') : ('Target ' + target);
    }

    function renderDuelPair() {
      const { a, b } = ds;
      const mA = Duel.formatMetric(a, ds.kind);
      syncDuelChrome(a);

      $('#duelArtA').src = a.art || '';
      $('#duelArtA').alt = a.title + ' by ' + a.artist;
      $('#duelTitleA').textContent = a.title;
      $('#duelArtistA').textContent = a.artist;
      $('#duelYearA').textContent = mA.main;
      $('#duelSubA').textContent = mA.sub;
      $('#duelSubA').hidden = !mA.sub;

      $('#duelArtB').src = b.art || '';
      $('#duelArtB').alt = b.title + ' by ' + b.artist;
      $('#duelTitleB').textContent = b.title;
      $('#duelArtistB').textContent = b.artist;
      $('#duelYearB').textContent = '?';
      $('#duelYearB').className = 'duel-year duel-unknown';
      $('#duelSubB').textContent = '';
      $('#duelSubB').hidden = true;
      $('#duelB').className = 'duel-card duel-challenger';

      $('#duelLater').disabled = false;
      $('#duelEarlier').disabled = false;
      $('#duelScore').textContent = 'Score ' + ds.score;
      $('#duelBest').hidden = ds.best <= 0;
      $('#duelBest').textContent = 'Best ' + ds.best;
      syncDuelTarget();
      $('#duelStatus').textContent = '';
      $('#duelStatus').className = 'status duel-status';
      if (lastMouseCard && !ds.over && !$('#duel').hidden && manualPausedSlot !== lastMouseCard) {
        playDuelSlot(lastMouseCard);
      }
    }

    function openDuelSummary() {
      ds.over = true;
      const curStats = LS.get('tl:duel:stats', {});
      LS.set('tl:duel:stats', {
        runs: (Number(curStats.runs) || 0) + 1,
        streamsBest: Math.max(Number(curStats.streamsBest) || 0, ds.kind === 'streams' ? ds.best : 0),
        yearBest: Math.max(Number(curStats.yearBest) || 0, ds.kind === 'year' ? ds.best : 0)
      });
      const isStreams = ds.kind === 'streams';
      const last = ds.history[ds.history.length - 1];
      const friendTarget = ds.challenge ? ds.challenge.score : null;
      const beatFriend = friendTarget !== null && ds.score > friendTarget;
      const tiedFriend = friendTarget !== null && ds.score === friendTarget;
      if (friendTarget !== null) {
        $('#duelVerdict').textContent = beatFriend ? 'You won the duel!' : tiedFriend ? 'Duel tied!' : 'Friend wins this round';
        $('#duelVerdict').className = 'verdict ' + (beatFriend ? 'win' : tiedFriend ? '' : 'lose');
      } else {
        $('#duelVerdict').textContent = ds.score === 0 ? 'Zero. Try again!' : ds.newBest ? 'New personal best!' : ds.score >= 5 ? 'On fire!' : 'Good run!';
        $('#duelVerdict').className = 'verdict ' + (ds.newBest || ds.score >= 3 ? 'win' : ds.score === 0 ? 'lose' : '');
      }
      $('#duelFinalScore').textContent = ds.score;
      $('#duelFinalBest').textContent = 'best ' + ds.best;
      const metricNote = last
        ? (isStreams
            ? last.b.title + ' (' + Duel.formatMetric(last.b, ds.kind).main + ') has ' + (last.b.streams >= last.a.streams ? 'more' : 'fewer') + ' Spotify streams than ' + last.a.title + ' (' + Duel.formatMetric(last.a, ds.kind).main + ').'
            : last.b.title + ' (' + Duel.formatMetric(last.b, ds.kind).main + ') came out ' + (last.b.year > last.a.year ? 'after ' : 'before ') + last.a.title + ' (' + Duel.formatMetric(last.a, ds.kind).main + ').')
        : '';
      const summaryCopy = friendTarget !== null
        ? (Duel.compareChallenge(friendTarget, ds.score) + ' (Friend: ' + friendTarget + ' · You: ' + ds.score + ').' + (metricNote ? ' ' + metricNote : ''))
        : metricNote;
      $('#duelSummaryNote').textContent = summaryCopy;
      const modeTag = $('#duelModeTag');
      if (modeTag) {
        if (modeTag.dataset) modeTag.dataset.mode = 'duel';
        modeTag.textContent = (friendTarget !== null ? 'Friend Duel · ' : 'Music Duel · ') + (isStreams ? 'Spotify Streams' : 'Release Year');
      }
      stopSummaryPreview();
      const entries = ds.history.length ? [{ song: ds.history[0].a, won: true }, ...ds.history.map((h) => ({ song: h.b, won: h.won }))] : [];
      const duelList = $('#duelRunList');
      duelList.innerHTML = entries.map((e, i) => {
        const playKey = 'duel:' + i;
        summarySongs.set(playKey, e.song);
        return renderShelfCard({
          diff: 'duel',
          won: e.won,
          art: e.song.art || '',
          lvl: i === 0 ? 'Start' : ('Round ' + i),
          playKey,
          badge: Duel.formatMetric(e.song, ds.kind).main,
          title: e.song.title,
          artist: e.song.artist,
        });
      }).join('');
      applyShelfAttrs(duelList, entries.length);
      const fanArts = [
        ...entries.filter((e) => e.won && e.song.art).reverse().map((e) => e.song.art),
        ...entries.filter((e) => e.song.art).map((e) => e.song.art),
      ];
      renderRunFan($('#duelFan'), fanArts);
      const bgr = $('#artBgDuel');
      if (bgr) {
        if (fanArts[0]) { bgr.style.backgroundImage = 'url("' + fanArts[0] + '")'; bgr.classList.add('on'); }
        else bgr.classList.remove('on');
      }
      open($('#duelModal'));
      if (beatFriend || (friendTarget === null && ds.newBest && ds.score > 0)) confetti('#duelConfetti', 'win');
    }

    function guessDuel(direction) {
      if (ds.busy || ds.over || !ds.a || !ds.b) return;
      ds.busy = true;
      $('#duelLater').disabled = true;
      $('#duelEarlier').disabled = true;
      const choice = ds.kind === 'streams'
        ? (direction === 'hi' ? 'higher' : 'lower')
        : (direction === 'hi' ? 'later' : 'earlier');
      const res = Duel.evaluate(ds.a, ds.b, choice, ds.kind);
      const mB = Duel.formatMetric(ds.b, ds.kind);
      $('#duelYearB').textContent = mB.main;
      $('#duelYearB').className = 'duel-year';
      $('#duelSubB').textContent = mB.sub;
      $('#duelSubB').hidden = !mB.sub;
      $('#duelB').className = 'duel-card duel-challenger ' + (res.won ? 'ok' : 'no');
      ds.history.push({ a: ds.a, b: ds.b, pick: choice, won: res.won });

      if (res.won) {
        playSfx('win');
        ds.score++;
        if (ds.score > ds.best) {
          ds.best = ds.score;
          ds.newBest = true;
          LS.set(DUEL_BEST_KEYS[ds.kind] || DUEL_BEST_KEYS.year, ds.best);
        }
        $('#duelScore').textContent = 'Score ' + ds.score;
        $('#duelBest').hidden = false;
        $('#duelBest').textContent = 'Best ' + ds.best;
        syncDuelTarget();
        $('#duelStatus').textContent = ds.kind === 'streams'
          ? 'Correct! ' + mB.sub + '.'
          : 'Correct! Released in ' + ds.b.year + '.';
        $('#duelStatus').className = 'status duel-status';
      } else {
        playSfx('wrong');
        $('#duelStatus').textContent = ds.kind === 'streams'
          ? 'Missed — ' + mB.sub + '.'
          : 'Missed — released in ' + ds.b.year + '.';
        $('#duelStatus').className = 'status duel-status err';
      }

      const pool = duelPools[ds.kind] || duelPools.year;
      const myEpoch = ++duelEpoch;
      clearTimeout(duelTimer);
      duelTimer = setTimeout(() => {
        if (myEpoch !== duelEpoch || $('#duel').hidden) return;
        stopDuelAudio();
        if (!res.won) {
          ds.busy = false;
          openDuelSummary();
          return;
        }
        const prevB = ds.b;
        const queuedNext = (ds.challenge && ds.qIndex < ds.queue.length) ? ds.queue[ds.qIndex++] : null;
        const nextB = queuedNext || Duel.pickNext(pool, prevB, ds.seen, ds.score, ds.kind);
        if (!nextB) {
          ds.busy = false;
          openDuelSummary();
          return;
        }
        ds.a = prevB;
        ds.b = nextB;
        ds.seen.add(nextB.slug);
        ds.busy = false;
        renderDuelPair();
      }, 900);
    }

    function startDuel(kind, incoming) {
      closeAll();
      stopAudio();
      stopDuel();
      duelPos.clear();
      const target = incoming ? incoming.kind : ((kind === 'streams' || kind === 'year') ? kind : ds.kind);
      const resolvedKind = (target === 'streams' && duelPools.streams.length >= 2) ? 'streams' : 'year';
      const pool = duelPools[resolvedKind];
      if (!pool || pool.length < 2) { toast('Not enough songs for Music Duel.'); return false; }

      let first = null, second = null, queue = [], qIndex = 0;
      const seen = new Set();
      if (incoming) {
        const byTid = new Map();
        for (const s of pool) {
          if (s && s.trackId && !byTid.has(Number(s.trackId))) byTid.set(Number(s.trackId), s);
        }
        queue = (incoming.ids || []).map((id) => byTid.get(Number(id))).filter(Boolean);
        if (queue.length < 2) return false;
        first = queue[0];
        second = queue[1];
        qIndex = 2;
        for (const s of queue) seen.add(s.slug);
      } else {
        if (location.hash.startsWith('#duel=')) history.replaceState(null, '', location.pathname + location.search);
        first = Duel.pickFirst(pool, resolvedKind);
        if (first) seen.add(first.slug);
        second = Duel.pickNext(pool, first, seen, 0, resolvedKind);
        if (!first || !second) { toast('Could not start Music Duel.'); return false; }
        seen.add(second.slug);
      }

      ds.kind = resolvedKind;
      ds.a = first;
      ds.b = second;
      ds.score = 0;
      ds.best = readBest(resolvedKind);
      ds.newBest = false;
      ds.seen = seen;
      ds.history = [];
      ds.busy = false;
      ds.over = false;
      ds.challenge = incoming || null;
      ds.queue = queue;
      ds.qIndex = qIndex;

      $('#lobby').hidden = true;
      $('#challengeIntro').hidden = true;
      $('#game').hidden = true;
      document.body.dataset.diff = 'duel';
      $('#duel').hidden = false;
      renderDuelPair();
      trackActivity(incoming ? 'duel_challenge_start' : 'duel_start', { mode: 'duel' });
      return true;
    }

    launchDuelChallenge = (incoming) => startDuel(incoming && incoming.kind, incoming);
    launchDuelMode = (deck) => startDuel(deck || ds.kind);

    $('#openDuel').onclick = () => startDuel(ds.kind);
    if ($('#duelTabs')) {
      $('#duelTabs').addEventListener('click', (e) => {
        const b = e.target.closest('[data-duel]');
        if (b && !b.disabled && b.dataset.duel !== ds.kind) startDuel(b.dataset.duel);
      });
    }
    $('#duelBack').onclick = () => { closeAll(); UI.lobby(); };
    $('#duelPlayA').onclick = () => toggleDuelPreview('a');
    $('#duelPlayB').onclick = () => toggleDuelPreview('b');
    for (const [slot, card] of [['a', $('#duelA')], ['b', $('#duelB')]]) {
      if (!card) continue;
      card.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' || ds.over || $('#duel').hidden) return;
        lastMouseCard = slot;
        if (manualPausedSlot === slot) return;
        playDuelSlot(slot);
      });
      card.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (lastMouseCard === slot) lastMouseCard = null;
        manualPausedSlot = null;
        if (activeSlot === slot) {
          duelAudioEpoch++;
          activeSlot = null;
          pauseSlot(slot);
        }
      });
    }
    $('#duelLater').onclick = () => guessDuel('hi');
    $('#duelEarlier').onclick = () => guessDuel('lo');
    $('#duelAgain').onclick = () => startDuel(ds.kind);
    $('#duelShare').onclick = () => {
      const ids = ds.history.length
        ? [ds.history[0].a, ...ds.history.map((h) => h.b)].map((s) => s && s.trackId).filter(Boolean).slice(0, 25)
        : [];
      const challengeUrl = ids.length >= 2
        ? Duel.createChallenge(siteUrl(), { kind: ds.kind, score: ds.score, ids })
        : '';
      salin(Duel.shareText({
        score: ds.score, best: ds.best, history: ds.history, url: siteUrl(), kind: ds.kind, challengeUrl
      }), 'duel_copy', 'duel');
    };
    if ($('#saveDuelCard')) {
      $('#saveDuelCard').onclick = async () => {
        if (!window.TuneUpCard) return;
        try {
          const outcome = await window.TuneUpCard.shareOrSave({
            kind: 'duel',
            deck: ds.kind,
            score: ds.score,
            best: ds.best,
            verdict: $('#duelVerdict') ? $('#duelVerdict').textContent : '',
            history: ds.history,
            url: siteUrl()
          });
          if (outcome === 'downloaded') toast('Score card saved!');
          else if (outcome === 'shared') toast('Score card shared!');
        } catch (e) {
          toast('Could not save score card.');
        }
      };
    }
    $('#duelMenu').onclick = () => { closeAll(); UI.lobby(); $('#openDuel').focus(); };
  })();

  (() => {
    const AD = window.ArtistDetective;
    if (!AD || !$('#artistGame') || !$('#openArtistGame')) return;
    const roster = AD.buildRoster(ALL, window.DUEL_STREAMS_V1);
    const byId = new Map(roster.map((a) => [a.id, a]));
    const seenFree = new Set();
    let agAudio = null, agAudioKind = '', agAudioEpoch = 0;

    const ag = {
      mode: 'free',
      target: null,
      preloadedSlug: '',
      preloadedUrl: '',
      playingSlug: '',
      pausedAt: 0,
      guesses: [],
      done: false,
      won: false,
      challenge: null,
      sel: -1,
      matches: []
    };

    function ensureAgAudio() {
      if (agAudio || typeof Audio !== 'function') return agAudio;
      agAudio = new Audio();
      agAudio.preload = 'auto';
      agAudio.addEventListener('ended', () => {
        ag.pausedAt = 0;
        if (agAudio) {
          try { agAudio.currentTime = 0; } catch (e) {}
        }
        stopArtistAudio();
      });
      agAudio.addEventListener('error', () => {
        if (agAudioKind) {
          stopArtistAudio();
          toast('Audio preview unavailable right now.');
        }
      });
      return agAudio;
    }

    function preloadTargetHit(target) {
      ag.preloadedSlug = '';
      ag.preloadedUrl = '';
      ag.playingSlug = '';
      ag.pausedAt = 0;
      if (!target || !target.topSong) return;
      const song = target.topSong;
      const myEpoch = agAudioEpoch;
      resolve(song).then((meta) => {
        if (myEpoch !== agAudioEpoch || !ag.target || ag.target.id !== target.id || !meta || !meta.preview) return;
        ag.preloadedSlug = song.slug;
        ag.preloadedUrl = meta.preview;
        const a = ensureAgAudio();
        if (a && !agAudioKind) {
          a.src = meta.preview;
          a.load();
        }
      }).catch(() => {});
    }

    function syncAudioBtns() {
      const art = $('#agResultArt');
      if (art) {
        const playingHit = agAudioKind === 'hit' && agAudio && !agAudio.paused;
        art.dataset.playing = playingHit ? '1' : '0';
      }
    }

    stopArtistAudio = () => {
      agAudioEpoch++;
      agAudioKind = '';
      if (agAudio) {
        if (Number.isFinite(agAudio.currentTime) && !agAudio.ended && agAudio.currentTime > 0.05) {
          ag.pausedAt = agAudio.currentTime;
        }
        try { agAudio.pause(); } catch (e) {}
      }
      syncAudioBtns();
    };

    syncArtistVolume = () => {
      if (agAudio) agAudio.volume = S.muted ? 0 : S.vol;
    };

    stopArtistGame = () => {
      stopArtistAudio();
      ag.playingSlug = '';
      ag.pausedAt = 0;
      closeAgDD();
      if (ag.challenge) {
        ag.challenge = null;
        if (location.hash.startsWith('#artist=')) {
          history.replaceState(null, '', location.pathname + location.search);
        }
      }
    };

    async function playArtistTrack(song, kind, isAuto = false) {
      if (!song || typeof Audio !== 'function') return;
      if (!isAuto && agAudioKind === kind && agAudio && !agAudio.paused) {
        stopArtistAudio();
        return;
      }
      stopAudio();
      if (stopDuelAudio) stopDuelAudio();
      stopSummaryPreview();
      stopArtistAudio();

      const myEpoch = ++agAudioEpoch;
      agAudioKind = kind;

      try {
        let previewUrl = (ag.preloadedSlug === song.slug && ag.preloadedUrl) ? ag.preloadedUrl : '';
        if (!previewUrl) {
          const meta = await resolve(song);
          if (myEpoch !== agAudioEpoch || !meta || !meta.preview || $('#artistGame').hidden) {
            if (myEpoch === agAudioEpoch) stopArtistAudio();
            return;
          }
          previewUrl = meta.preview;
        }
        const a = ensureAgAudio();
        if (!a) return;
        a.volume = S.muted ? 0 : S.vol;
        const sameTrack = ag.playingSlug === song.slug && a.src === previewUrl;
        if (!sameTrack || isAuto) {
          ag.playingSlug = song.slug;
          ag.pausedAt = 0;
          if (a.src !== previewUrl) a.src = previewUrl;
          try { a.currentTime = 0; } catch (e) {}
        } else if (a.ended) {
          ag.pausedAt = 0;
          try { a.currentTime = 0; } catch (e) {}
        } else if (ag.pausedAt > 0.05 && Math.abs((a.currentTime || 0) - ag.pausedAt) > 0.25) {
          try { a.currentTime = ag.pausedAt; } catch (e) {}
        }
        await a.play();
        if (myEpoch !== agAudioEpoch || $('#artistGame').hidden) {
          stopArtistAudio();
          return;
        }
        syncAudioBtns();
      } catch (e) {
        if (myEpoch === agAudioEpoch) {
          stopArtistAudio();
          if (!isAuto) toast('Could not play audio preview.');
        }
      }
    }

    function recordArtistOutcome(won, tries = 0) {
      const prev = artistStats();
      const current = won ? prev.current + 1 : 0;
      const best = Math.max(prev.best, current);
      const dist = prev.dist.slice();
      if (won && tries >= 1 && tries <= AD.MAX_TRIES) dist[tries - 1]++;
      else dist[AD.MAX_TRIES]++;
      LS.set('tl:artist:stats', {
        played: prev.played + 1,
        won: prev.won + (won ? 1 : 0),
        current,
        best,
        dist
      });
    }

    function renderAgBoard() {
      const st = artistStats();
      const bestPill = $('#agBestPill');
      if (bestPill) {
        bestPill.hidden = st.best <= 0;
        bestPill.textContent = 'Best ' + st.best;
      }
      const targetPill = $('#agTargetPill');
      if (targetPill) {
        if (!ag.challenge) {
          targetPill.hidden = true;
          if (targetPill.dataset) delete targetPill.dataset.passed;
        } else {
          targetPill.hidden = false;
          if (ag.challenge.won) {
            const passed = ag.won && ag.guesses.length < ag.challenge.tries;
            if (targetPill.dataset) targetPill.dataset.passed = passed ? '1' : '0';
            targetPill.textContent = passed
              ? ('Beat ' + ag.challenge.tries + '!')
              : ('Target ' + ag.challenge.tries + (ag.challenge.tries === 1 ? ' try' : ' tries'));
          } else {
            if (targetPill.dataset) targetPill.dataset.passed = ag.won ? '1' : '0';
            targetPill.textContent = ag.won ? 'Solved!' : 'Friend missed';
          }
        }
      }

      const triesPill = $('#agTriesPill');
      if (triesPill) {
        triesPill.textContent = ag.done
          ? (ag.won ? ('Solved ' + ag.guesses.length + ' / ' + AD.MAX_TRIES) : ('Missed · ' + AD.MAX_TRIES + ' / ' + AD.MAX_TRIES))
          : ('Guess ' + Math.min(AD.MAX_TRIES, ag.guesses.length + 1) + ' / ' + AD.MAX_TRIES);
      }

      $('#agQ').disabled = ag.done;
      $('#agGiveUp').hidden = ag.done;
      syncAudioBtns();

      const banner = $('#agResultBanner');
      if (banner && ag.target) {
        banner.hidden = !ag.done;
        if (ag.done) {
          banner.dataset.won = ag.won ? '1' : '0';
          $('#agResultArt').src = ag.target.art || '';
          $('#agResultArt').alt = ag.target.name;
          $('#agVerdict').textContent = ag.won
            ? ('Solved in ' + ag.guesses.length + (ag.guesses.length === 1 ? ' try!' : ' tries!'))
            : 'Mystery Artist Revealed';
          $('#agAnswerName').textContent = ag.target.name;
          $('#agTopSongLabel').textContent = ag.target.topSong
            ? ('Top Hit: ' + ag.target.topSong.title + ' (' + ag.target.country + ' · ' + ag.target.genre + ')')
            : (ag.target.country + ' · ' + ag.target.genre);
          const noteEl = $('#agChallengeNote');
          if (noteEl) {
            if (ag.challenge) {
              noteEl.hidden = false;
              noteEl.textContent = AD.compareChallenge(ag.challenge.won, ag.challenge.tries, ag.won, ag.guesses.length);
            } else {
              noteEl.hidden = true;
              noteEl.textContent = '';
            }
          }
          $('#agNextBtn').textContent = 'Next artist';
        }
      }

      const board = $('#agBoard');
      if (!board) return;
      if (!ag.guesses.length) {
        board.innerHTML = '<div class="spotle-empty">Guess any artist above to reveal Debut Year, Solo/Group Type, Gender, Genre, Country &amp; Global Rank (#1&ndash;#250).</div>';
        return;
      }
      board.innerHTML = ag.guesses.slice().reverse().map((g, revIdx) => {
        const num = ag.guesses.length - revIdx;
        const tiles = AD.compare(g, ag.target);
        const isWin = g.id === ag.target.id;
        return '<article class="spotle-guess-card' + (isWin ? ' is-winner' : '') + '">' +
          '<div class="spotle-guess-head">' +
            '<div class="spotle-guess-who">' +
              '<img class="spotle-guess-avatar" src="' + esc(g.art || '') + '" alt="">' +
              '<span class="spotle-guess-name">' + esc(g.name) + '</span>' +
            '</div>' +
            '<span class="spotle-guess-num">Guess #' + num + '</span>' +
          '</div>' +
          '<div class="spotle-tiles">' +
            tiles.map((t) =>
              '<div class="sp-tile ' + t.status + '">' +
                '<small>' + esc(t.label) + '</small>' +
                '<b>' + esc(t.value) + '</b>' +
              '</div>'
            ).join('') +
          '</div>' +
        '</article>';
      }).join('');
    }

    function closeAgDD() {
      const dd = $('#agDD');
      if (!dd) return;
      dd.hidden = true;
      dd.innerHTML = '';
      $('#agQ').setAttribute('aria-expanded', 'false');
      ag.sel = -1;
      ag.matches = [];
    }

    function openAgDD(query) {
      const qNorm = norm(query);
      const dd = $('#agDD');
      if (!qNorm || ag.done) { closeAgDD(); return; }
      const matches = roster
        .filter((a) => a.hay.includes(qNorm))
        .sort((a, b) => {
          const aPre = a.hay.startsWith(qNorm) ? 0 : ((' ' + a.hay).includes(' ' + qNorm) ? 1 : 2);
          const bPre = b.hay.startsWith(qNorm) ? 0 : ((' ' + b.hay).includes(' ' + qNorm) ? 1 : 2);
          return (aPre - bPre) || (a.rank - b.rank);
        })
        .slice(0, 10);
      ag.matches = matches;
      ag.sel = -1;
      dd.innerHTML = '';
      if (!matches.length) {
        const empty = el('div', 'dd-empty');
        empty.textContent = 'No matching artist in top 250 roster.';
        dd.appendChild(empty);
      } else {
        matches.forEach((a, idx) => {
          const tried = ag.guesses.some((g) => g.id === a.id);
          const b = el('button', 'dd-item' + (tried ? ' tried' : ''));
          b.type = 'button';
          b.disabled = tried;
          b.dataset.idx = String(idx);
          b.innerHTML =
            '<img class="spotle-dd-art" src="' + esc(a.art || '') + '" alt="">' +
            '<span class="dd-txt"><b>' + esc(a.name) + '</b><small>' + esc(a.country + ' · ' + a.type) + '</small></span>' +
            '<span class="spotle-dd-meta">' + esc(a.genre) + '</span>';
          dd.appendChild(b);
        });
      }
      dd.hidden = false;
      $('#agQ').setAttribute('aria-expanded', 'true');
    }

    function moveAgSel(dir) {
      const items = $('#agDD').querySelectorAll('.dd-item');
      if (!items.length) return;
      ag.sel = (ag.sel + dir + items.length) % items.length;
      items.forEach((elItem, idx) => elItem.classList.toggle('sel', idx === ag.sel));
      if (items[ag.sel] && typeof items[ag.sel].scrollIntoView === 'function') {
        items[ag.sel].scrollIntoView({ block: 'nearest' });
      }
    }

    function submitArtistGuess(artist) {
      if (!artist || ag.done || !ag.target) return;
      if (ag.guesses.some((g) => g.id === artist.id)) {
        toast('Already guessed ' + artist.name);
        return;
      }
      ag.guesses.push(artist);
      $('#agQ').value = '';
      $('#agClear').hidden = true;
      closeAgDD();

      if (artist.id === ag.target.id) {
        ag.done = true;
        ag.won = true;
        if ($('#agQ') && typeof $('#agQ').blur === 'function') $('#agQ').blur();
        playSfx('fanfare');
        recordArtistOutcome(true, ag.guesses.length);
        renderAgBoard();
        if (ag.target.topSong) playArtistTrack(ag.target.topSong, 'hit', true);
        return;
      }
      if (ag.guesses.length >= AD.MAX_TRIES) {
        ag.done = true;
        ag.won = false;
        playSfx('wrong');
        recordArtistOutcome(false, ag.guesses.length);
        renderAgBoard();
        if (ag.target.topSong) playArtistTrack(ag.target.topSong, 'hit', true);
        return;
      }
      playSfx('near');
      renderAgBoard();
    }

    function giveUpArtist() {
      if (ag.done || !ag.target) return;
      ag.done = true;
      ag.won = false;
      playSfx('wrong');
      closeAgDD();
      recordArtistOutcome(false, ag.guesses.length);
      renderAgBoard();
      if (ag.target.topSong) playArtistTrack(ag.target.topSong, 'hit', true);
    }

    function pickFreeTarget() {
      let pool = roster.filter((a) => !seenFree.has(a.id));
      if (!pool.length) {
        seenFree.clear();
        pool = roster;
      }
      const pick = pool[(Math.random() * pool.length) | 0] || roster[0];
      if (pick) seenFree.add(pick.id);
      return pick;
    }

    function startArtistGame(incoming = null) {
      if (!roster.length) {
        toast('Artist roster unavailable.');
        return false;
      }
      closeAll();
      stopAudio();
      if (stopDuel) stopDuel();
      stopArtistAudio();
      closeAgDD();

      $('#agQ').value = '';
      $('#agClear').hidden = true;

      if (incoming) {
        const target = byId.get(incoming.id);
        if (!target) return false;
        ag.mode = 'challenge';
        ag.target = target;
        ag.guesses = [];
        ag.done = false;
        ag.won = false;
        ag.challenge = incoming;
      } else {
        ag.challenge = null;
        if (location.hash.startsWith('#artist=')) {
          history.replaceState(null, '', location.pathname + location.search);
        }
        ag.mode = 'free';
        ag.target = pickFreeTarget();
        ag.guesses = [];
        ag.done = false;
        ag.won = false;
      }
      preloadTargetHit(ag.target);

      $('#lobby').hidden = true;
      $('#challengeIntro').hidden = true;
      $('#game').hidden = true;
      if ($('#duel')) $('#duel').hidden = true;
      document.body.dataset.diff = 'artist';
      $('#artistGame').hidden = false;
      renderAgBoard();
      trackActivity(incoming ? 'artist_challenge_start' : 'artist_free_start', { mode: 'artist' });
      if (!ag.done) setTimeout(() => $('#agQ').focus(), 40);
      return true;
    }

    launchArtistChallenge = (incoming) => startArtistGame(incoming);
    launchArtistMode = () => startArtistGame();

    $('#openArtistGame').onclick = () => startArtistGame();
    $('#artistGameBack').onclick = () => { closeAll(); UI.lobby(); };
    $('#agQ').addEventListener('input', () => {
      $('#agClear').hidden = !$('#agQ').value;
      const v = $('#agQ').value.trim();
      if (!v) { closeAgDD(); return; }
      openAgDD(v);
    });
    $('#agQ').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveAgSel(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveAgSel(-1); }
      else if (e.key === 'Escape') { closeAgDD(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (!$('#agDD').hidden && ag.sel >= 0 && ag.matches[ag.sel]) {
          submitArtistGuess(ag.matches[ag.sel]);
        } else if (!$('#agDD').hidden && ag.matches.length === 1) {
          submitArtistGuess(ag.matches[0]);
        } else {
          const firstUntried = ag.matches.find((m) => !ag.guesses.some((g) => g.id === m.id));
          if (!$('#agDD').hidden && firstUntried) submitArtistGuess(firstUntried);
          else toast('Pick an artist from the dropdown list');
        }
      }
    });
    let agTouchStart = null, agLastTouch = 0;
    $('#agDD').addEventListener('mousedown', (e) => e.preventDefault());
    $('#agDD').addEventListener('touchstart', (e) => {
      const t = e.touches && e.touches[0];
      if (t) agTouchStart = { x: t.clientX, y: t.clientY, ms: Date.now() };
    }, { passive: true });
    $('#agDD').addEventListener('touchend', (e) => {
      if (!agTouchStart) return;
      const t = e.changedTouches && e.changedTouches[0];
      const moved = t ? (Math.abs(t.clientX - agTouchStart.x) + Math.abs(t.clientY - agTouchStart.y)) : 999;
      const dur = Date.now() - agTouchStart.ms;
      agTouchStart = null;
      if (moved < 12 && dur < 450) {
        const b = e.target.closest('.dd-item');
        if (b && !b.disabled) {
          agLastTouch = Date.now();
          e.preventDefault();
          const idx = Number(b.dataset.idx);
          if (ag.matches[idx]) submitArtistGuess(ag.matches[idx]);
        }
      }
    });
    $('#agDD').addEventListener('click', (e) => {
      if (Date.now() - agLastTouch < 500) return;
      const b = e.target.closest('.dd-item');
      if (!b || b.disabled) return;
      const idx = Number(b.dataset.idx);
      if (ag.matches[idx]) submitArtistGuess(ag.matches[idx]);
    });
    document.addEventListener('pointerdown', (e) => {
      if ($('#agDD').hidden) return;
      if (!e.target.closest('.spotle-search')) closeAgDD();
    });
    $('#agClear').onclick = () => {
      $('#agQ').value = '';
      $('#agClear').hidden = true;
      closeAgDD();
      $('#agQ').focus();
    };
    $('#agGiveUp').onclick = () => giveUpArtist();
    if ($('#agResultArt')) {
      $('#agResultArt').title = 'Tap to pause or resume hit';
      $('#agResultArt').onclick = () => {
        if (ag.done && ag.target && ag.target.topSong) playArtistTrack(ag.target.topSong, 'hit');
      };
    }
    $('#agShareBtn').onclick = () => {
      if (!ag.target) return;
      const challengeUrl = AD.createChallenge(siteUrl(), {
        id: ag.target.id,
        tries: ag.guesses.length,
        won: ag.won
      });
      salin(AD.shareText({
        mode: 'free',
        guesses: ag.guesses,
        target: ag.target,
        won: ag.won,
        url: siteUrl(),
        challengeUrl
      }), 'artist_copy', 'artist');
    };
    $('#agNextBtn').onclick = () => startArtistGame();
  })();

  const SPOTIFY_ROUNDS_KEY = 'tl:spotify:rounds';
  const SPOTIFY_PRESET_ROUNDS = new Set(['5', '10', '20', '50', 'all']);
  let spotifyRoundsChoice = (() => {
    const saved = LS.get(SPOTIFY_ROUNDS_KEY, 'all');
    if (saved === 'all') return 'all';
    const n = parseInt(saved, 10);
    return Number.isFinite(n) && n >= 1 ? Math.min(500, n) : 'all';
  })();

  function spotifyRoundsPillLabel() {
    return spotifyRoundsChoice === 'all'
      ? 'All songs'
      : (spotifyRoundsChoice + (spotifyRoundsChoice === 1 ? ' song' : ' songs'));
  }

  function syncSpotifyRoundsUI() {
    const key = spotifyRoundsChoice === 'all' ? 'all' : String(spotifyRoundsChoice);
    const isPreset = SPOTIFY_PRESET_ROUNDS.has(key);
    const seg = $('#spotifyRoundsSeg');
    if (seg && typeof seg.querySelectorAll === 'function') {
      for (const b of seg.querySelectorAll('[data-rounds]')) {
        const on = isPreset && b.dataset.rounds === key;
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-checked', String(on));
      }
    }
    const customInput = $('#spotifyRoundsCustom');
    if (customInput) {
      customInput.classList.toggle('active', !isPreset);
      if (isPreset && document.activeElement !== customInput) customInput.value = '';
      else if (!isPreset && customInput.value !== key) customInput.value = key;
    }
    if ($('#classicSpotifyPanel') && !$('#classicSpotifyPanel').hidden) {
      const modePill = document.querySelector('.classic-section .mode-pill');
      if (modePill) modePill.textContent = spotifyRoundsPillLabel();
    }
  }

  function setSpotifyRoundsChoice(val) {
    if (val === 'all') {
      spotifyRoundsChoice = 'all';
    } else {
      const n = parseInt(val, 10);
      if (!Number.isFinite(n) || n < 1) return;
      spotifyRoundsChoice = Math.min(500, n);
    }
    LS.set(SPOTIFY_ROUNDS_KEY, spotifyRoundsChoice);
    syncSpotifyRoundsUI();
  }

  function setClassicTab(mode) {
    const tab = mode === 'artist' ? 'artist' : mode === 'spotify' ? 'spotify' : 'filters';
    if ($('#classicFiltersPanel')) $('#classicFiltersPanel').hidden = tab !== 'filters';
    if ($('#classicArtistPanel')) $('#classicArtistPanel').hidden = tab !== 'artist';
    if ($('#classicSpotifyPanel')) $('#classicSpotifyPanel').hidden = tab !== 'spotify';
    const modePill = document.querySelector('.classic-section .mode-pill');
    if (modePill) modePill.textContent = tab === 'spotify' ? spotifyRoundsPillLabel() : '5 stages';
    if ($('#classicTabs')) {
      for (const b of $('#classicTabs').querySelectorAll('[data-classic-tab]')) {
        const on = b.dataset.classicTab === tab;
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-selected', String(on));
      }
    }
  }
  if ($('#classicTabs')) {
    $('#classicTabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-classic-tab]');
      if (b) setClassicTab(b.dataset.classicTab);
    });
  }
  if ($('#spotifyRoundsSeg')) {
    $('#spotifyRoundsSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rounds]');
      if (!b) return;
      if ($('#spotifyRoundsCustom')) $('#spotifyRoundsCustom').value = '';
      setSpotifyRoundsChoice(b.dataset.rounds);
    });
  }
  if ($('#spotifyRoundsCustom')) {
    $('#spotifyRoundsCustom').addEventListener('input', () => {
      const raw = $('#spotifyRoundsCustom').value.trim();
      if (!raw) { setSpotifyRoundsChoice('all'); return; }
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && n >= 1) setSpotifyRoundsChoice(n);
    });
    $('#spotifyRoundsCustom').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); startSpotifyPlaylist(); }
    });
  }
  syncSpotifyRoundsUI();

  function matchLocalCatalogTrack(title, artist) {
    const nt = norm(title);
    const primary = norm(String(artist || '').split(/[,&]/)[0]);
    if (!nt || !primary) return null;
    for (let i = 0; i < ALL.length; i++) {
      const c = ALL[i];
      if (norm(c.title) !== nt) continue;
      const ca = norm(c.artist);
      if (ca === primary || ca.includes(primary) || primary.includes(ca)) return c;
    }
    return null;
  }

  const SPOTIFY_DEFAULT_HINT = '100+ songs? Paste 2 playlist links, or Ctrl+A → Ctrl+C tracks from Spotify';

  function parseSpotifyMultiInput(raw) {
    const s = String(raw || '').trim();
    const collections = [];
    const trackIds = [];
    const shortUrls = [];
    if (!s) return { collections, trackIds, shortUrls };

    const seenCol = new Set();
    const seenTrk = new Set();
    const seenShort = new Set();

    const addCol = (type, id) => {
      const k = type + ':' + id;
      if (!seenCol.has(k) && collections.length < 10) {
        seenCol.add(k);
        collections.push({ type, id });
      }
    };
    const addTrk = (id) => {
      if (!seenTrk.has(id) && trackIds.length < 500) {
        seenTrk.add(id);
        trackIds.push(id);
      }
    };

    // Match all Spotify URLs & URIs (works even when pasted without spaces)
    const urlRe = /(?:https?:\/\/)?(?:open|play)\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?(playlist|album|track)\/([A-Za-z0-9]{22})/gi;
    let m;
    while ((m = urlRe.exec(s)) !== null) {
      const kind = m[1].toLowerCase();
      if (kind === 'track') addTrk(m[2]);
      else addCol(kind, m[2]);
    }
    const uriRe = /spotify:(playlist|album|track):([A-Za-z0-9]{22})/gi;
    while ((m = uriRe.exec(s)) !== null) {
      const kind = m[1].toLowerCase();
      if (kind === 'track') addTrk(m[2]);
      else addCol(kind, m[2]);
    }
    const shortRe = /https?:\/\/(?:spotify\.link|spoti\.fi)\/[A-Za-z0-9_-]+/gi;
    while ((m = shortRe.exec(s)) !== null) {
      if (!seenShort.has(m[0]) && shortUrls.length < 5) {
        seenShort.add(m[0]);
        shortUrls.push(m[0]);
      }
    }

    // Backwards-compatible bare 22-char playlist ID or deep-link `album:<id>`
    if (!collections.length && !trackIds.length && !shortUrls.length) {
      if (/^album:[A-Za-z0-9]{22}$/.test(s)) addCol('album', s.slice(6));
      else if (/^[A-Za-z0-9]{22}$/.test(s)) addCol('playlist', s);
    }
    return { collections, trackIds, shortUrls };
  }

  function updateSpotifyInputHint() {
    const inp = $('#spotifyUrl');
    const st = $('#spotifyStatus');
    if (!inp || !st || spotifyBusy) return;
    const raw = inp.value || '';
    if (!raw.trim()) {
      st.textContent = SPOTIFY_DEFAULT_HINT;
      st.classList.remove('err');
      return;
    }
    const parsed = parseSpotifyMultiInput(raw);
    const cCount = parsed.collections.length + parsed.shortUrls.length;
    const tCount = parsed.trackIds.length;
    st.classList.remove('err');
    if (cCount > 1 && tCount) {
      st.textContent = cCount + ' playlists + ' + tCount + ' tracks detected — will merge all';
    } else if (cCount > 1) {
      st.textContent = cCount + ' playlists detected — will merge all tracks';
    } else if (cCount === 1 && tCount) {
      st.textContent = 'Playlist + ' + tCount + ' track links detected — will auto-merge without duplicates';
    } else if (tCount > 0) {
      st.textContent = tCount + ' Spotify ' + (tCount === 1 ? 'track' : 'tracks') + ' detected — ready to play';
    } else {
      st.textContent = SPOTIFY_DEFAULT_HINT;
    }
  }

  let spotifyBusy = false;
  async function startSpotifyPlaylist(rawInput, overrideRounds) {
    const raw = String(rawInput || ($('#spotifyUrl') ? $('#spotifyUrl').value : '')).trim();
    const st = $('#spotifyStatus');
    const btn = $('#loadSpotifyBtn');
    const setStatus = (msg, err) => {
      if (!st) return;
      st.textContent = msg;
      st.classList.toggle('err', !!err);
    };
    if (!raw) {
      setStatus('Paste a Spotify playlist, album, or track links first.', true);
      if ($('#spotifyUrl')) $('#spotifyUrl').focus();
      return false;
    }
    if (spotifyBusy) return false;
    spotifyBusy = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
    setStatus('Loading Spotify tracks…', false);

    try {
      const parsed = parseSpotifyMultiInput(raw);
      const colUrls = [
        ...parsed.collections.map((c) => 'https://open.spotify.com/' + c.type + '/' + c.id),
        ...parsed.shortUrls
      ];
      if (!colUrls.length && !parsed.trackIds.length) {
        setStatus('Paste a valid Spotify playlist, album, or Ctrl+A track links.', true);
        return false;
      }

      let primaryMeta = null;
      const mergedTracks = [];
      const seenKeys = new Set();
      const loadedTrackIds = new Set();

      const appendTrack = (t, fallbackAlbumName) => {
        if (!t || !t.title || !t.artist) return;
        const key = (t.title + '\0' + t.artist).toLowerCase();
        if (seenKeys.has(key)) return;
        seenKeys.add(key);
        if (t.id && /^[A-Za-z0-9]{22}$/.test(t.id)) loadedTrackIds.add(t.id);
        mergedTracks.push(fallbackAlbumName && !t.album ? { ...t, album: fallbackAlbumName } : t);
      };

      // 1. Fetch all playlist/album links in parallel
      if (colUrls.length) {
        const colResults = await Promise.all(colUrls.map(async (u) => {
          const r = await fetch('/api/spotify?url=' + encodeURIComponent(u), {
            signal: AbortSignal.timeout(14000)
          });
          const d = await r.json().catch(() => null);
          return { ok: r.ok && d && d.ok, data: d };
        }));
        let lastErr = '';
        for (const item of colResults) {
          if (!item.ok) { lastErr = (item.data && item.data.error) || lastErr; continue; }
          const d = item.data;
          if (!primaryMeta) primaryMeta = d;
          for (const t of (d.tracks || [])) {
            appendTrack(t, d.type === 'album' ? d.name : '');
          }
        }
        if (!mergedTracks.length && !parsed.trackIds.length) {
          setStatus(lastErr || 'Could not load that Spotify link. Make sure it is a Public playlist or album.', true);
          return false;
        }
      }

      // 2. Fetch ONLY missing track IDs (skips tracks already loaded from the playlist!)
      const missingTrackIds = parsed.trackIds.filter((id) => !loadedTrackIds.has(id));
      if (missingTrackIds.length) {
        const batchSize = 20;
        const batches = [];
        for (let i = 0; i < missingTrackIds.length; i += batchSize) {
          batches.push(missingTrackIds.slice(i, i + batchSize));
        }
        let doneTracks = 0;
        const totalNeed = missingTrackIds.length;
        const baseCount = mergedTracks.length;
        const batchOut = new Array(batches.length);
        let cursor = 0;

        const runWorker = async () => {
          while (cursor < batches.length) {
            const idx = cursor++;
            const chunk = batches[idx];
            try {
              const r = await fetch('/api/spotify?tracks=' + encodeURIComponent(chunk.join(',')), {
                signal: AbortSignal.timeout(15000)
              });
              const d = await r.json().catch(() => null);
              batchOut[idx] = (r.ok && d && d.ok && Array.isArray(d.tracks)) ? d.tracks : [];
            } catch {
              batchOut[idx] = [];
            }
            doneTracks += chunk.length;
            setStatus('Loading Spotify tracks… ' + Math.min(baseCount + doneTracks, baseCount + totalNeed) + '/' + (baseCount + totalNeed), false);
          }
        };
        await Promise.all(Array.from({ length: Math.min(3, batches.length) }, runWorker));
        for (const list of batchOut) {
          for (const t of (list || [])) appendTrack(t, '');
        }
      }

      if (!mergedTracks.length) {
        setStatus('No playable Spotify tracks found. Check your links and try again.', true);
        return false;
      }

      const isSingleAlbum = !!(primaryMeta && primaryMeta.type === 'album' && colUrls.length === 1 && !missingTrackIds.length);
      const customId = primaryMeta ? primaryMeta.id : ('tracks:' + mergedTracks.length + ':' + Date.now().toString(36));
      const label = primaryMeta
        ? (colUrls.length > 1 ? primaryMeta.name + ' +' + (colUrls.length - 1) : primaryMeta.name)
        : 'Spotify Mix';
      const cover = (primaryMeta && primaryMeta.cover) || '';

      const songs = mergedTracks.map((t, i) => {
        const local = matchLocalCatalogTrack(t.title, t.artist);
        const localThumb = local && local.art ? local.art : '';
        const localHd = localThumb ? localThumb.replace('300x300', '600x600') : '';
        const directThumb = t.artThumb || t.art || '';
        const directHd = t.art || t.artThumb || '';
        // Album: semua lagu memang memakai cover album itu. Playlist/tracks: JANGAN
        // pakai foto playlist untuk lagu -- pakai cover asli track / katalog / oEmbed.
        const listArt = directThumb || localThumb || (isSingleAlbum ? cover : '');
        const revealArt = directHd || localHd || (isSingleAlbum ? cover : '');
        const pre = t.preview ? {
          trackId: (local && local.trackId) || 0,
          preview: t.preview,
          art: revealArt || cover || '',
          title: t.title,
          artist: t.artist,
          album: t.album || (isSingleAlbum ? label : ''),
          year: t.year ? String(t.year) : (local && local.year ? String(local.year) : ''),
          link: t.spotifyUrl || (primaryMeta ? ('https://open.spotify.com/' + primaryMeta.type + '/' + primaryMeta.id) : ''),
          fromSpotify: true
        } : null;
        return {
          slug: 'sp:' + customId + ':' + (t.id || i),
          title: t.title,
          artist: t.artist,
          tier: 1,
          genre: 'spotify',
          year: t.year || (local && local.year) || 0,
          art: listArt,
          hdArt: revealArt,
          spotifyUrl: t.spotifyUrl || '',
          artTried: !!(listArt || isSingleAlbum),
          trackId: (local && local.trackId) || 0,
          pre,
          hay: norm(t.title + ' ' + t.artist)
        };
      });

      const chosenRounds = overrideRounds != null ? overrideRounds : spotifyRoundsChoice;
      const rounds = chosenRounds === 'all'
        ? songs.length
        : Math.max(1, Math.min(songs.length, parseInt(chosenRounds, 10) || songs.length));

      S.daily = null; S.challenge = null; S.runChallenge = null;
      S.custom = {
        id: 'sp:' + customId,
        kind: 'spotify',
        spotifyId: (primaryMeta && colUrls.length === 1 && !missingTrackIds.length) ? primaryMeta.id : '',
        spotifyType: isSingleAlbum ? 'album' : 'playlist',
        label,
        owner: (primaryMeta && primaryMeta.owner) || 'Spotify',
        cover,
        rounds,
        songs
      };
      switchRun();
      S.stages = []; S.stage = 0; S.runDone = false;
      saveRun();
      setStatus(SPOTIFY_DEFAULT_HINT, false);
      if ($('#spotifyUrl') && typeof $('#spotifyUrl').blur === 'function') $('#spotifyUrl').blur();
      if ($('#spotifyRoundsCustom') && typeof $('#spotifyRoundsCustom').blur === 'function') $('#spotifyRoundsCustom').blur();
      UI.clearInput();
      UI.game();
      load();
      prefetchSpotifyArt(songs);   // cover asli lagu lain menyusul di latar
      return true;
    } catch (e) {
      setStatus('Could not reach Spotify right now. Check your connection and try again.', true);
      return false;
    } finally {
      spotifyBusy = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Play'; }
    }
  }

  if ($('#spotifyUrl')) {
    $('#spotifyUrl').addEventListener('paste', (e) => {
      const txt = e.clipboardData && e.clipboardData.getData('text');
      if (!txt || !/[\r\n]/.test(txt)) return;
      e.preventDefault();
      const inp = $('#spotifyUrl');
      const normalized = txt.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      const start = inp.selectionStart ?? inp.value.length;
      const end = inp.selectionEnd ?? inp.value.length;
      const before = inp.value.slice(0, start);
      const after = inp.value.slice(end);
      const joinBefore = before && !/\s$/.test(before) ? ' ' : '';
      const joinAfter = after && !/^\s/.test(after) ? ' ' : '';
      inp.value = (before + joinBefore + normalized + joinAfter + after).trim();
      if ($('#spotifyClear')) $('#spotifyClear').hidden = !inp.value;
      updateSpotifyInputHint();
    });
    $('#spotifyUrl').addEventListener('input', () => {
      if ($('#spotifyClear')) $('#spotifyClear').hidden = !$('#spotifyUrl').value;
      updateSpotifyInputHint();
    });
    $('#spotifyUrl').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); startSpotifyPlaylist(); }
    });
  }
  if ($('#spotifyClear')) {
    $('#spotifyClear').onclick = () => {
      $('#spotifyUrl').value = '';
      $('#spotifyClear').hidden = true;
      updateSpotifyInputHint();
      $('#spotifyUrl').focus();
    };
  }
  if ($('#loadSpotifyBtn')) {
    $('#loadSpotifyBtn').onclick = () => startSpotifyPlaylist();
  }
  if ($('#steps')) {
    $('#steps').addEventListener('wheel', (e) => {
      const h = $('#steps');
      if (!h.classList.contains('many') || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (h.scrollWidth > h.clientWidth) {
        e.preventDefault();
        h.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  UI.buildControls();
  UI.render();
  UI.lobby();                 // selalu mulai dari layar pilih mode

  function applyDeepLink() {
    const hash = location.hash || '';
    if (hash === '#daily') { startDaily(); return true; }
    if (hash === '#duel' && launchDuelMode) { launchDuelMode(); return true; }
    if (hash === '#artist' && launchArtistMode) { launchArtistMode(); return true; }

    let params;
    try { params = new URLSearchParams(location.search || ''); } catch (e) { return false; }
    const sp = (params.get('spotify') || '').trim();
    if (sp) {
      const spSongs = parseInt(params.get('songs') || '', 10);
      if (Number.isFinite(spSongs) && spSongs >= 1) setSpotifyRoundsChoice(spSongs);
      setClassicTab('spotify');
      startSpotifyPlaylist(sp, Number.isFinite(spSongs) && spSongs >= 1 ? spSongs : undefined);
      return true;
    }
    const genreAliases = { 'hip-hop': 'hiphop', electronic: 'edm', other: 'lain' };
    const eraAliases = { '2000s': 'y00', '2010s': 'y10', '2020s': 'y20', classic: 'old', before2000: 'old' };
    const rawG = (params.get('genre') || '').toLowerCase();
    const rawE = (params.get('era') || '').toLowerCase();
    const g = genreAliases[rawG] || rawG;
    const e = eraAliases[rawE] || rawE;
    let changed = false;
    if (g && GENRES[g]) { S.genre = g; LS.set('tl:genre', g); changed = true; }
    if (e && ERAS[e]) { S.era = e; LS.set('tl:era', e); changed = true; }
    if (changed) {
      switchRun();
      UI.buildControls();
      UI.refreshLobby();
    }

    const mode = (params.get('mode') || '').toLowerCase();
    if (mode === 'daily') { startDaily(); return true; }
    if (mode === 'duel' && launchDuelMode) {
      const deck = (params.get('deck') || '').toLowerCase();
      launchDuelMode(deck === 'year' || deck === 'streams' ? deck : undefined);
      return true;
    }
    if (mode === 'artist' && launchArtistMode) { launchArtistMode(); return true; }
    if (mode === 'classic' && $('#start') && !$('#start').disabled) { $('#start').click(); return true; }
    return changed;
  }

  setInterval(() => { if (!$('#lobby').hidden) refreshDaily(); }, 30000);
  if (!showIncomingChallenge()) applyDeepLink();
})();
