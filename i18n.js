/* TuneUp — Bilingual EN / ID translation layer (stored in tl:set:lang, backed up by TuneUpBackup). */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'tl:set:lang';
  let currentLang = 'en';

  const DICT = {
    en: {
      // Lobby
      dailyHeading: 'Daily Challenge',
      dailySub: '1 song · 5 tries',
      playDaily: 'Play daily',
      continueDaily: 'Continue',
      viewResult: 'See result',
      classicHeading: 'Classic',
      stages5: '5 stages',
      tabFilters: 'Genre & Era',
      tabArtist: 'By Artist',
      tabPlaylist: 'Playlists',
      start: 'Start',
      continueBtn: 'Continue',
      seeResult: 'See result',
      artistPanelTitle: 'Play your favorite artist',
      artistPanelDesc: 'Pick any artist — guess 5 of their tracks from 0.1s clips',
      chooseArtist: 'Choose artist',
      playlistPlaceholder: 'Paste Spotify, Apple, or YouTube link…',
      playlistPlay: 'Play',
      songsLbl: 'Songs',
      allBtn: 'All',
      customPh: 'Custom',
      playlistHint: 'Paste Spotify, Apple Music, or YouTube playlist links (or Ctrl+A Spotify tracks)',
      duelPill: 'Higher or lower',
      duelSub: 'Spotify streams & release year',
      playDuel: 'Play duel',
      artistPill: '10 tries',
      artistSub: 'Deduce the mystery artist from 6 clues',
      playArtist: 'Play artist',
      statsBtn: 'Stats',
      settingsBtn: 'Settings',
      feedbackBtn: 'Feedback',
      // Game / Duel / Artist Detective
      changeMode: 'Change mode',
      searchSongsPh: 'Search songs…',
      skip: 'Skip',
      viewSummary: 'See result',
      duelStreamsTab: 'Spotify Streams',
      duelYearTab: 'Release Year',
      hoverPlay: 'Hover play',
      searchArtistPh: 'Search any artist…',
      legendExact: 'Exact',
      legendClose: 'Close',
      giveUp: 'Give up',
      saveScoreCard: 'Save score card',
      challengeFriend: 'Challenge your friend',
      nextArtist: 'Next artist',
      agEmpty: 'Guess any artist above to reveal Debut Year, Solo/Group Type, Gender, Genre, Country & Global Rank (#1–#250).',
      hintIn: 'Hint in {n}',
      hint2In: 'Hint 2 in {n}',
      getHint1: 'Get hint (1/2)',
      getHint2: 'Name hint (2/2)',
      hintsUsedAll: '2/2 hints used',
      // Settings Modal
      setTitle: 'Settings',
      setLangLbl: 'Language',
      setLangDesc: 'Display language for menus & labels',
      setAutoplayLbl: 'Auto-play on reveal',
      setAutoplayDesc: 'Play the full song when a round ends',
      setSfxLbl: 'Sound effects',
      setSfxDesc: 'Chimes for right, close, and wrong answers',
      setHoverLbl: 'Hover play',
      setHoverDesc: 'Music Duel · play a card when your mouse is over it',
      setBackupTitle: 'Backup & transfer',
      setBackupNote: 'No account needed. Copy your code, then paste it on another browser or device to bring over your stats, streaks, and Daily history.',
      setBackupPh: 'Your backup code appears here — or paste a code to restore',
      backupCopy: 'Copy backup code',
      backupRestore: 'Restore from code',
      confirmRestore: 'Confirm restore',
      resetAllData: 'Reset all data on this device',
      resetAllConfirm: 'Click again to erase all stats, streaks & settings',
      // Stats Modal & Badges
      statsTitle: 'Stats',
      tabThisFilter: 'This filter',
      tabAllClassic: 'All Classic',
      tabDaily: 'Daily',
      tabDuel: 'Duel',
      tabArtistStat: 'Artist',
      tabBadges: 'Badges',
      scoreSpread: 'Score spread',
      attemptSpread: 'Attempt spread',
      deckComparison: 'Deck comparison',
      guessesToSolve: 'Guesses to solve',
      resetStats: 'Reset stats',
      badgesScope: '{u} of {t} unlocked · saved on this device',
      // Custom Modal
      customTitle: 'Pick an artist',
      customHint: 'Pick an artist — we pick 5 of their songs.',
      customPhInput: 'Search any artist…',
      recentArtists: 'Recent artists',
      popularArtists: 'Popular artists',
      clearBtn: 'Clear',
      surpriseMe: '✦ Surprise me',
      refreshBtn: '↻ Refresh',
      // Result / Run / Leave / Feedback / Challenge
      nextBtn: 'Next',
      playAgain: 'Play again',
      backToMenu: 'Back to menu',
      listenFull: 'Listen in full ↗',
      reportSong: 'Report this song',
      leaveTitle: 'Leave this playlist?',
      leaveKeep: 'Keep playing',
      leaveFinish: 'Finish & see result',
      leaveExit: 'Leave to menu',
      feedbackTitle: 'Send feedback',
      feedbackIntro: 'Found a bug, missing a song, or have an idea? Let us know.',
      sendFeedback: 'Send feedback',
      acceptChallenge: 'Accept challenge',
      playRegular: 'Play regular game',
      // Guide & FAQ
      guideTitle: 'Choose your music',
      guideIntro: 'A few shortcuts for your next Classic run.',
      guideGenres: 'Genres',
      guideEras: 'Eras',
      guideNote: 'Genre shortcuts include every era; era shortcuts include every genre. Combine both using the filters above.',
      aboutTitle: 'About the game',
      aboutP1: 'TuneUp brings quick music games together right in your browser. Put your ear to the test with 0.1s–15s audio clips in Daily, Classic, Artist, and Playlist modes (Spotify, Apple Music, YouTube), compare hit songs in Music Duel, or deduce 250 global artists from 6 clues in Artist Detective.',
      aboutP2: 'Play for free, anytime you want.',
      faqTitle: 'Good to know',
      backToTop: 'Back to top',
      // Dynamic strings
      allGenres: 'All genres',
      allEras: 'All eras',
      before2000: 'Before 2000',
      allSongs: 'All songs',
      nSongs: '{n} songs',
      nSong: '{n} song',
      loadingPlaylist: 'Loading playlist tracks…',
      playlistNeedLink: 'Paste a Spotify, Apple Music, or YouTube playlist link first.',
      playlistBadLink: 'Paste a valid Spotify, Apple Music, or YouTube playlist link.',
      playlistNoTracks: 'No playable tracks found. Make sure the playlist is Public.',
      playlistUnreachable: 'Could not reach the playlist provider right now. Try again.',
      duelPromptStreams: 'Does the challenger have <b>more</b> or <b>fewer</b> Spotify streams?',
      duelPromptYear: 'Was the challenger released <b>later</b> or <b>earlier</b>?',
      // Badges
      badge_sniper_name: '0.1s Sniper',
      badge_sniper_desc: 'Guess a song right on the first 0.1s clip',
      badge_sweep_name: 'Perfect Sweep',
      badge_sweep_desc: 'Score 5/5 in a Classic or Artist run',
      badge_streak10_name: 'Hot Streak',
      badge_streak10_desc: 'Reach a 10-song Classic win streak',
      badge_daily3_name: 'Daily Regular',
      badge_daily3_desc: 'Reach a 3-day Daily Challenge streak',
      badge_daily7_name: 'Week Warrior',
      badge_daily7_desc: 'Reach a 7-day Daily Challenge streak',
      badge_duel10_name: 'Duel Ace',
      badge_duel10_desc: 'Score 10+ in a single Music Duel run',
      badge_detective_name: 'Sharp Detective',
      badge_detective_desc: 'Solve Artist Detective in 3 tries or less',
      badge_explorer_name: 'All-Rounder',
      badge_explorer_desc: 'Play Classic, Daily, Duel & Artist Detective'
    },
    id: {
      // Lobby
      dailyHeading: 'Tantangan Harian',
      dailySub: '1 lagu · 5 percobaan',
      playDaily: 'Main harian',
      continueDaily: 'Lanjutkan',
      viewResult: 'Lihat hasil',
      classicHeading: 'Classic',
      stages5: '5 tahap',
      tabFilters: 'Genre & Era',
      tabArtist: 'Per Artis',
      tabPlaylist: 'Playlist',
      start: 'Mulai',
      continueBtn: 'Lanjutkan',
      seeResult: 'Lihat hasil',
      artistPanelTitle: 'Mainkan artis favoritmu',
      artistPanelDesc: 'Pilih artis bebas — tebak 5 lagunya dari klip 0,1 detik',
      chooseArtist: 'Pilih artis',
      playlistPlaceholder: 'Tempel link Spotify / Apple / YT…',
      playlistPlay: 'Main',
      songsLbl: 'Lagu',
      allBtn: 'Semua',
      customPh: 'Kustom',
      playlistHint: 'Tempel link playlist Spotify, Apple Music, atau YouTube (atau Ctrl+A lagu Spotify)',
      duelPill: 'Tinggi / rendah',
      duelSub: 'Spotify streams & tahun rilis',
      playDuel: 'Main duel',
      artistPill: '10 tebakan',
      artistSub: 'Tebak artis misterius dari 6 petunjuk',
      playArtist: 'Main artis',
      statsBtn: 'Statistik',
      settingsBtn: 'Pengaturan',
      feedbackBtn: 'Masukan',
      // Game / Duel / Artist Detective
      changeMode: 'Ganti mode',
      searchSongsPh: 'Cari judul lagu…',
      skip: 'Lewati',
      viewSummary: 'Lihat hasil',
      duelStreamsTab: 'Spotify Streams',
      duelYearTab: 'Tahun Rilis',
      hoverPlay: 'Hover play',
      searchArtistPh: 'Cari nama artis…',
      legendExact: 'Tepat',
      legendClose: 'Dekat',
      giveUp: 'Menyerah',
      saveScoreCard: 'Simpan kartu skor',
      challengeFriend: 'Tantang teman',
      nextArtist: 'Artis berikutnya',
      agEmpty: 'Tebak artis apa saja di atas untuk membuka petunjuk Tahun Debut, Tipe, Gender, Genre, Negara & Peringkat Global (#1–#250).',
      hintIn: 'Petunjuk dlm {n}',
      hint2In: 'Petunjuk 2 dlm {n}',
      getHint1: 'Buka petunjuk (1/2)',
      getHint2: 'Petunjuk nama (2/2)',
      hintsUsedAll: '2/2 petunjuk terpakai',
      // Settings Modal
      setTitle: 'Pengaturan',
      setLangLbl: 'Bahasa',
      setLangDesc: 'Bahasa tampilan untuk menu & tombol',
      setAutoplayLbl: 'Putar otomatis saat terungkap',
      setAutoplayDesc: 'Putar lagu penuh begitu ronde selesai',
      setSfxLbl: 'Efek suara',
      setSfxDesc: 'Suara singkat untuk tebakan benar, dekat, & salah',
      setHoverLbl: 'Hover play',
      setHoverDesc: 'Music Duel · putar lagu saat kursor di atas kartu',
      setBackupTitle: 'Cadangkan & pindah data',
      setBackupNote: 'Tanpa akun. Salin kodemu lalu tempel di browser atau perangkat lain untuk memindahkan statistik, streak, lencana, & riwayat Harian.',
      setBackupPh: 'Kode backup muncul di sini — atau tempel kode untuk memulihkan',
      backupCopy: 'Salin kode backup',
      backupRestore: 'Pulihkan dari kode',
      confirmRestore: 'Konfirmasi pulihkan',
      resetAllData: 'Hapus semua data di perangkat ini',
      resetAllConfirm: 'Klik lagi untuk hapus semua statistik, streak & pengaturan',
      // Stats Modal & Badges
      statsTitle: 'Statistik',
      tabThisFilter: 'Filter ini',
      tabAllClassic: 'Semua Classic',
      tabDaily: 'Harian',
      tabDuel: 'Duel',
      tabArtistStat: 'Artis',
      tabBadges: 'Lencana',
      scoreSpread: 'Sebaran skor',
      attemptSpread: 'Sebaran percobaan',
      deckComparison: 'Perbandingan deck',
      guessesToSolve: 'Tebakan untuk menebak',
      resetStats: 'Reset statistik',
      badgesScope: '{u} dari {t} terbuka · tersimpan di perangkat ini',
      // Custom Modal
      customTitle: 'Pilih artis',
      customHint: 'Pilih artis — kami pilihkan 5 lagunya.',
      customPhInput: 'Cari nama artis…',
      recentArtists: 'Artis terbaru',
      popularArtists: 'Artis populer',
      clearBtn: 'Hapus',
      surpriseMe: '✦ Acak',
      refreshBtn: '↻ Segarkan',
      // Result / Run / Leave / Feedback / Challenge
      nextBtn: 'Berikutnya',
      playAgain: 'Main lagi',
      backToMenu: 'Kembali ke menu',
      listenFull: 'Dengar penuh ↗',
      reportSong: 'Laporkan lagu ini',
      leaveTitle: 'Tinggalkan playlist ini?',
      leaveKeep: 'Lanjut main',
      leaveFinish: 'Selesai & lihat hasil',
      leaveExit: 'Keluar ke menu',
      feedbackTitle: 'Kirim masukan',
      feedbackIntro: 'Menemukan bug, lagu kurang, atau punya ide? Kasih tahu kami.',
      sendFeedback: 'Kirim masukan',
      acceptChallenge: 'Terima tantangan',
      playRegular: 'Main mode biasa',
      // Guide & FAQ
      guideTitle: 'Pilih musikmu',
      guideIntro: 'Pintasan cepat untuk sesi Classic berikutnya.',
      guideGenres: 'Genre',
      guideEras: 'Era',
      guideNote: 'Pintasan genre mencakup semua era; pintasan era mencakup semua genre. Gabungkan keduanya lewat filter di atas.',
      aboutTitle: 'Tentang game',
      aboutP1: 'TuneUp menghadirkan game musik cepat langsung di browser. Uji telingamu dengan klip 0,1–15 detik di mode Harian, Classic, Artis, & Playlist (Spotify, Apple Music, YouTube), adu lagu hits di Music Duel, atau tebak 250 artis global dari 6 petunjuk di Artist Detective.',
      aboutP2: 'Gratis dimainkan kapan saja.',
      faqTitle: 'Perlu diketahui',
      backToTop: 'Kembali ke atas',
      // Dynamic strings
      allGenres: 'Semua genre',
      allEras: 'Semua era',
      before2000: 'Sebelum 2000',
      allSongs: 'Semua lagu',
      nSongs: '{n} lagu',
      nSong: '{n} lagu',
      loadingPlaylist: 'Memuat daftar lagu playlist…',
      playlistNeedLink: 'Tempel link playlist Spotify, Apple Music, atau YouTube dulu.',
      playlistBadLink: 'Tempel link playlist Spotify, Apple Music, atau YouTube yang valid.',
      playlistNoTracks: 'Tidak ada lagu yang bisa diputar. Pastikan playlist bersifat Publik.',
      playlistUnreachable: 'Gagal menghubungi penyedia playlist saat ini. Coba lagi.',
      duelPromptStreams: 'Apakah penantang punya <b>lebih banyak</b> atau <b>lebih sedikit</b> Spotify streams?',
      duelPromptYear: 'Apakah penantang dirilis <b>lebih baru</b> atau <b>lebih lama</b>?',
      // Badges
      badge_sniper_name: 'Sniper 0,1 dtk',
      badge_sniper_desc: 'Tebak lagu tepat pada klip pertama 0,1 detik',
      badge_sweep_name: 'Sapu Bersih',
      badge_sweep_desc: 'Raih skor 5/5 di ronde Classic atau Artis',
      badge_streak10_name: 'On Fire',
      badge_streak10_desc: 'Capai streak 10 lagu berturut-turut di Classic',
      badge_daily3_name: 'Rutin Harian',
      badge_daily3_desc: 'Capai streak 3 hari di Tantangan Harian',
      badge_daily7_name: 'Pejuang Seminggu',
      badge_daily7_desc: 'Capai streak 7 hari di Tantangan Harian',
      badge_duel10_name: 'Jagoan Duel',
      badge_duel10_desc: 'Raih skor 10+ dalam satu sesi Music Duel',
      badge_detective_name: 'Detektif Tajam',
      badge_detective_desc: 'Tebak Artist Detective dalam 3 percobaan atau kurang',
      badge_explorer_name: 'Serba Bisa',
      badge_explorer_desc: 'Mainkan Classic, Harian, Duel & Artist Detective'
    }
  };

  function normalize(lang) {
    return String(lang || '').toLowerCase().startsWith('id') ? 'id' : 'en';
  }

  function load(storage) {
    if (!storage || typeof storage.getItem !== 'function') return currentLang;
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return 'en';
      let val = raw;
      try { val = JSON.parse(raw); } catch (e) {}
      currentLang = normalize(val);
    } catch (e) {
      currentLang = 'en';
    }
    return currentLang;
  }

  function set(lang, storage) {
    currentLang = normalize(lang);
    if (storage && typeof storage.setItem === 'function') {
      try { storage.setItem(STORAGE_KEY, JSON.stringify(currentLang)); } catch (e) {}
    }
    return currentLang;
  }

  function get() {
    return currentLang;
  }

  function t(key, vars) {
    const table = DICT[currentLang] || DICT.en;
    let str = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : (DICT.en[key] || key);
    if (vars && typeof vars === 'object') {
      for (const k of Object.keys(vars)) {
        str = str.replaceAll('{' + k + '}', String(vars[k]));
      }
    }
    return str;
  }

  function setText(el, key) {
    if (el) el.textContent = t(key);
  }

  function setBtnLabelKeepSvg(el, key) {
    if (!el) return;
    const svg = el.querySelector && el.querySelector('svg');
    if (!svg) { el.textContent = t(key); return; }
    // Keep SVG node(s) intact and update the text node
    let textNode = null;
    for (let i = 0; i < el.childNodes.length; i++) {
      const n = el.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim()) { textNode = n; break; }
    }
    if (textNode) {
      textNode.textContent = ' ' + t(key) + ' ';
    } else {
      el.appendChild(el.ownerDocument.createTextNode(' ' + t(key)));
    }
  }

  function apply(doc) {
    if (!doc || typeof doc.querySelector !== 'function') return;
    const $ = (sel) => doc.querySelector(sel);
    if (doc.documentElement) doc.documentElement.lang = currentLang;

    // Lobby
    setText($('#dailyHeading'), 'dailyHeading');
    setText($('.daily-heading > span'), 'dailySub');
    setText($('#classicHeading'), 'classicHeading');
    setText($('#classicTabs [data-classic-tab="filters"]'), 'tabFilters');
    setText($('#classicTabs [data-classic-tab="artist"]'), 'tabArtist');
    setText($('#classicTabs [data-classic-tab="spotify"]'), 'tabPlaylist');
    setText($('.artist-panel-copy b'), 'artistPanelTitle');
    setText($('.artist-panel-copy span'), 'artistPanelDesc');
    setBtnLabelKeepSvg($('#openCustom'), 'chooseArtist');
    if ($('#spotifyUrl')) $('#spotifyUrl').placeholder = t('playlistPlaceholder');
    setText($('#loadSpotifyBtn'), 'playlistPlay');
    setText($('.spotify-rounds-lbl'), 'songsLbl');
    setText($('#spotifyRoundsSeg [data-rounds="all"]'), 'allBtn');
    if ($('#spotifyRoundsCustom')) $('#spotifyRoundsCustom').placeholder = t('customPh');
    setText($('#openDuel .mode-pill'), 'duelPill');
    setBtnLabelKeepSvg($('#openDuel .duel-cta-pill'), 'playDuel');
    setText($('#openArtistGame .mode-pill'), 'artistPill');
    setBtnLabelKeepSvg($('#openArtistGame .duel-cta-pill'), 'playArtist');
    setText($('#openStats'), 'statsBtn');
    setText($('#openSettings'), 'settingsBtn');
    setText($('#openFeedback'), 'feedbackBtn');

    // Arena & Duel & Artist Detective
    setBtnLabelKeepSvg($('#back'), 'changeMode');
    setBtnLabelKeepSvg($('#duelBack'), 'changeMode');
    setBtnLabelKeepSvg($('#artistGameBack'), 'changeMode');
    if ($('#q')) $('#q').placeholder = t('searchSongsPh');
    setText($('#duelTabs [data-duel="streams"]'), 'duelStreamsTab');
    setText($('#duelTabs [data-duel="year"]'), 'duelYearTab');
    setText($('#duelHoverToggle span:last-child'), 'hoverPlay');
    if ($('#agQ')) $('#agQ').placeholder = t('searchArtistPh');
    setText($('#agGiveUp'), 'giveUp');
    setText($('#saveArtistCard'), 'saveScoreCard');
    setText($('#agShareBtn'), 'challengeFriend');
    setText($('#agNextBtn'), 'nextArtist');
    const legendSpans = doc.querySelectorAll('.spotle-legend span');
    if (legendSpans[0] && legendSpans[0].lastChild) legendSpans[0].lastChild.textContent = t('legendExact');
    if (legendSpans[1] && legendSpans[1].lastChild) legendSpans[1].lastChild.textContent = t('legendClose');

    // Settings modal
    setText($('#setTitle'), 'setTitle');
    setText($('#setLangLbl'), 'setLangLbl');
    setText($('#setLangDesc'), 'setLangDesc');
    setText($('#setAutoplayLbl'), 'setAutoplayLbl');
    setText($('#setAutoplayDesc'), 'setAutoplayDesc');
    setText($('#setSfxLbl'), 'setSfxLbl');
    setText($('#setSfxDesc'), 'setSfxDesc');
    setText($('#setHoverLbl'), 'setHoverLbl');
    setText($('#setHoverDesc'), 'setHoverDesc');
    setText($('#setBackupTitle'), 'setBackupTitle');
    setText($('#setBackupNote'), 'setBackupNote');
    if ($('#backupCode')) $('#backupCode').placeholder = t('setBackupPh');
    setText($('#backupCopy'), 'backupCopy');
    if ($('#backupRestore') && !$('#backupRestore').classList.contains('is-armed')) {
      setText($('#backupRestore'), 'backupRestore');
    }
    if ($('#resetAllData') && !$('#resetAllData').classList.contains('is-armed')) {
      setText($('#resetAllData'), 'resetAllData');
    }

    // Stats modal
    setText($('#sTitle'), 'statsTitle');
    setText($('#statsTabs [data-tab="filter"]'), 'tabThisFilter');
    setText($('#statsTabs [data-tab="overall"]'), 'tabAllClassic');
    setText($('#statsTabs [data-tab="daily"]'), 'tabDaily');
    setText($('#statsTabs [data-tab="duel"]'), 'tabDuel');
    setText($('#statsTabs [data-tab="artist"]'), 'tabArtistStat');
    setText($('#statsTabs [data-tab="badges"]'), 'tabBadges');
    setText($('#reset'), 'resetStats');

    // Custom modal & result/run/duel/leave/feedback modals
    setText($('#cTitle'), 'customTitle');
    if ($('#artistQ')) $('#artistQ').placeholder = t('customPhInput');
    setBtnLabelKeepSvg($('#shareStage'), 'challengeFriend');
    setText($('#listen'), 'listenFull');
    setText($('#reportSong'), 'reportSong');
    setText($('#again'), 'playAgain');
    setText($('#share'), 'challengeFriend');
    setText($('#saveRunCard'), 'saveScoreCard');
    setText($('#backToMenu'), 'backToMenu');
    setText($('#duelAgain'), 'playAgain');
    setText($('#duelShare'), 'challengeFriend');
    setText($('#saveDuelCard'), 'saveScoreCard');
    setText($('#duelMenu'), 'backToMenu');
    setText($('#leaveRunTitle'), 'leaveTitle');
    setText($('#leaveKeepPlaying'), 'leaveKeep');
    setText($('#leaveFinishEarly'), 'leaveFinish');
    setText($('#leaveConfirmExit'), 'leaveExit');
    setText($('#feedbackTitle'), 'feedbackTitle');
    setText($('#feedbackIntro'), 'feedbackIntro');
    setText($('#sendFeedback'), 'sendFeedback');
    setText($('#leaveChallenge'), 'playRegular');

    // Site guide
    setText($('#musicBrowserTitle'), 'guideTitle');
    setText($('.browser-intro'), 'guideIntro');
    const mgHeads = doc.querySelectorAll('.music-group h3');
    if (mgHeads[0]) mgHeads[0].textContent = t('guideGenres');
    if (mgHeads[1]) mgHeads[1].textContent = t('guideEras');
    setText($('.browser-note'), 'guideNote');
    setText($('#aboutTitle'), 'aboutTitle');
    const aboutPs = doc.querySelectorAll('.guide-about p');
    if (aboutPs[0]) aboutPs[0].textContent = t('aboutP1');
    if (aboutPs[1]) aboutPs[1].textContent = t('aboutP2');
    setText($('#faqTitle'), 'faqTitle');
    setBtnLabelKeepSvg($('[data-guide-top]'), 'backToTop');
  }

  const api = { STORAGE_KEY, DICT, load, set, get, t, apply };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuneUpI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
