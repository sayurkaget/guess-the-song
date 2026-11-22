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
      playlistPlaceholder: 'Spotify, Apple, or YT link…',
      playlistPlay: 'Play',
      songsLbl: 'Songs',
      allBtn: 'All',
      customPh: 'Custom',
      playlistHint: 'Paste Spotify, Apple Music, or YouTube playlist links (or Ctrl+A Spotify tracks)',
      duelPill: 'Higher or lower',
      duelSub: 'Spotify streams & release year',
      duelSubBest: 'Spotify streams & release year · Best {n}',
      playDuel: 'Play duel',
      artistPill: '10 tries',
      artistSub: 'Deduce the mystery artist from 6 clues',
      artistSubBest: '6 clues · Best streak {n}',
      artistSubWon: '6 clues · Solved {n}',
      playArtist: 'Play artist',
      statsBtn: 'Stats',
      settingsBtn: 'Settings',
      feedbackBtn: 'Feedback',
      // Genres & Eras
      allGenres: 'All genres',
      otherGenre: 'Other',
      allEras: 'All eras',
      before2000: 'Before 2000',
      noSongsFilter: 'No songs match these filters.',
      oneSongMatch: '1 song matches.',
      nSongsMatch: '{n} songs match.',
      nSongsPool: '{n} songs',
      // Game Arena
      changeMode: 'Change mode',
      searchSongsPh: 'Search songs…',
      maxLbl: 'Max ',
      skip: 'Skip',
      skipPlus: 'Skip +{len}',
      giveUp: 'Give up',
      viewSummary: 'See result',
      tryAgain: 'Try again',
      oneSong5Tries: 'One song · <b>5 tries</b>',
      stageOf: 'Stage <b>{s}</b> of {t} · <b>{lvl}</b>',
      songOf: 'Song <b>{s}</b> of {t} · <b>{lbl}</b>',
      pressPlayToHear: 'Press Play to hear {len}.',
      rightArtistUnlock: 'Right artist, wrong song. {len} unlocked.',
      wrongUnlock: 'Not it. {len} unlocked now.',
      skippedUnlock: 'Skipped. {len} unlocked.',
      alreadyTried: 'Already tried that song.',
      pickFromList: 'Pick a song from the list first',
      notInCatalogue: 'Not in the catalogue.',
      triedBadge: 'Tried',
      skippedLbl: 'Skipped',
      rightArtistLbl: 'Right artist',
      loadingClip: 'Loading clip…',
      clipUnavailable: 'Clip unavailable — tap Try again',
      attemptListen: 'Attempt {n} · Listen to {len} clip',
      verdictGotIt: 'Got it!',
      verdictMissed: 'Out of tries',
      // Music Duel
      duelStreamsTab: 'Spotify Streams',
      duelYearTab: 'Release Year',
      hoverPlay: 'Hover play',
      duelKnownStreams: 'Known streams',
      duelReleased: 'Released',
      duelChallenger: 'Challenger',
      duelPromptStreams: 'Does the challenger have <b>more</b> or <b>fewer</b> Spotify streams?',
      duelPromptYear: 'Guess if the challenger came out <b>earlier</b> or <b>later</b>.',
      duelHigher: '▲ Higher',
      duelLower: '▼ Lower',
      duelLater: '▲ Later',
      duelEarlier: '▼ Earlier',
      duelMoreThan: 'More than {v}',
      duelFewerThan: 'Fewer than {v}',
      duelAfter: 'After {v}',
      duelBefore: 'Before {v}',
      duelScore: 'Score {n}',
      duelBest: 'Best {n}',
      duelTarget: 'Target {n}',
      duelBeat: 'Beat {n}!',
      duelCorrectStreams: 'Correct! {v}.',
      duelCorrectYear: 'Correct! Released in {y}.',
      duelMissedStreams: 'Missed — {v}.',
      duelMissedYear: 'Missed — released in {y}.',
      // Artist Detective
      searchArtistPh: 'Search any artist…',
      legendExact: 'Exact',
      legendClose: 'Close',
      saveScoreCard: 'Save score card',
      challengeFriend: 'Challenge your friend',
      nextArtist: 'Next artist',
      agEmpty: 'Guess any artist above to reveal Debut Year, Solo/Group Type, Gender, Genre, Country & Global Rank (#1–#530).',
      agNoMatch: 'No matching artist in top 530 roster.',
      agGuessPill: 'Guess {n} / {max}',
      agSolvedPill: 'Solved {n} / {max}',
      agMissedPill: 'Missed · {max} / {max}',
      agGuessNum: 'Guess #{n}',
      agBestPill: 'Best {n}',
      agSolvedTry: 'Solved in 1 try!',
      agSolvedTries: 'Solved in {n} tries!',
      agSolvedTryHint: 'Solved in {n} {unit} · {h} {hUnit}',
      agRevealed: 'Mystery Artist Revealed',
      agTopHit: 'Top Hit: {title} ({country} · {genre})',
      clue_debut: 'Debut',
      clue_members: 'Type',
      clue_gender: 'Gender',
      clue_genre: 'Genre',
      clue_country: 'Country',
      clue_rank: 'Global Rank',
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
      statRuns: 'runs',
      statAvg: 'average',
      statBest: 'best',
      statPerfect: 'perfect',
      statPlayed: 'played',
      statWins: 'wins',
      statStreak: 'streak',
      statSolved: 'solved',
      statStreamsBest: 'streams best',
      statYearBest: 'year best',
      statBestStreak: 'best streak',
      statDuels: 'duels',
      statScopeDaily: 'Daily Challenge · all saved days',
      statScopeDuel: 'Music Duel · Spotify Streams & Release Year',
      statScopeArtist: 'Artist Detective · Top 530 roster',
      statScopeAllClassic: 'All Classic filters',
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
      fbIssueLbl: 'Issue',
      fbCategoryLbl: 'Category',
      fbCatBug: 'Report a bug',
      fbCatSong: 'Suggest a song',
      fbCatOther: 'Other feedback',
      fbMsgLbl: 'Message',
      fbMsgPh: 'What happened, or what would you like to see?',
      fbEmailLbl: 'Email',
      fbEmailOpt: "(optional, if you'd like a reply)",
      fbDetailsLbl: 'Game details',
      fbDetailsOpt: '(optional)',
      fbDetailsPh: 'Mode, song, or device details',
      fbNote: 'Your message and any details you include go privately to the site owner.',
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
      aboutP1: 'TuneUp brings quick music games together right in your browser. Put your ear to the test with 0.1s–15s audio clips in Daily, Classic, Artist, and Playlist modes (Spotify, Apple Music, YouTube), compare hit songs in Music Duel, or deduce 530 global artists from 6 clues in Artist Detective.',
      aboutP2: 'Play for free, anytime you want.',
      faqTitle: 'Good to know',
      faqQ1: 'Do I need an account?',
      faqA1: 'No sign-up is needed. Open the game on your phone or computer and pick a mode, or paste any public Spotify, Apple Music, or YouTube playlist link to play your own tracks.',
      faqQ2: 'What can I replay?',
      faqA2: 'Classic, Custom Artist, Playlists, Music Duel, and Artist Detective can be played as often as you like. The Daily song is available once per day, with five attempts.',
      faqQ3: 'When is the next Daily?',
      faqA3: "At 7:00 AM in your device's local time. Consecutive Daily wins build your streak; a missed day or a loss resets it.",
      faqQ4: 'Can I challenge a friend?',
      faqA4: 'Yes. After any song, 5-stage run, Music Duel, or Artist Detective round, tap Challenge your friend to copy a spoiler-free link with the exact same tracks or mystery artist.',
      faqQ5: 'Where is my progress saved?',
      faqA5: 'Your Daily progress, streaks, stats, badges, and settings are saved in this browser. Open Settings → Backup & transfer to copy a backup code and restore your progress on another browser or device.',
      backToTop: 'Back to top',
      modeLinkDaily: 'Daily Challenge',
      modeLinkClassic: 'Classic',
      modeLinkArtist: 'By Artist',
      modeLinkSpotify: 'Playlist Quiz',
      modeLinkDuel: 'Music Duel',
      modeLinkDetective: 'Artist Detective',
      modeLinkLang: 'Bahasa Indonesia',
      // Playlist / Dynamic strings
      allSongs: 'All songs',
      nSongs: '{n} songs',
      nSong: '{n} song',
      loadingPlaylist: 'Loading playlist tracks…',
      playlistNeedLink: 'Paste a Spotify, Apple Music, or YouTube playlist link first.',
      playlistBadLink: 'Paste a valid Spotify, Apple Music, or YouTube playlist link.',
      playlistNoTracks: 'No playable tracks found. Make sure the playlist is Public.',
      playlistUnreachable: 'Could not reach the playlist provider right now. Try again.',
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
      badge_explorer_desc: 'Play Classic, Daily, Duel & Artist Detective',
      // Result verdicts, streaks & toasts (Wave 64 full ID parity)
      verdict1: 'first listen',
      verdict2: 'nailed it',
      verdict3: 'got there',
      verdict4: 'safe',
      verdict5: 'last try',
      verdictItWas: 'it was',
      guessedIn: 'Guessed in {len}!',
      lostBadge: 'Lost!',
      songStreak: '{n} song streak',
      customStreak: '{n} custom streak',
      newBestTag: ' · New best!',
      bestTag: ' · Best {n}',
      loadingBtn: 'Loading…',
      plMultiMix: '{c} playlists + {t} tracks detected — will merge all',
      plMulti: '{c} playlists detected — will merge all tracks',
      plOnePlusTracks: 'Playlist + {t} track links detected — will auto-merge without duplicates',
      plTracksReady: '{t} Spotify {unit} detected — ready to play',
      toastPreviewUnavailable: 'Preview unavailable for this track.',
      toastPreviewError: 'Could not play preview.',
      toastAutoplayOn: 'Auto-play on reveal enabled',
      toastAutoplayOff: 'Auto-play on reveal off',
      toastSfxOn: 'Sound effects on',
      toastSfxOff: 'Sound effects off',
      toastHoverOn: 'Hover play on',
      toastHoverOff: 'Hover play off',
      toastHoverOffHint: 'Hover play off — click ▶ to listen',
      toastBackupCopied: 'Backup code copied!',
      toastBackupManual: 'Code generated above — select and copy it manually.',
      toastRestored: 'Progress restored!',
      toastAllReset: 'All data reset',
      toastCantShare: 'This recording cannot be shared right now. Try another song.',
      toastStatsReset: 'Stats reset',
      toastCopiedFriend: 'Copied — paste it to a friend',
      toastCopyFailed: 'Copy failed',
      toastCardSaved: 'Score card saved!',
      toastCardShared: 'Score card shared!',
      toastCardFailed: 'Could not save score card.',
      toastDuelNotEnough: 'Not enough songs for Music Duel.',
      toastDuelFailed: 'Could not start Music Duel.',
      toastAudioUnavailable: 'Audio preview unavailable right now.',
      toastAudioFailed: 'Could not play audio preview.',
      toastAlreadyGuessed: 'Already guessed {name}',
      toastRosterUnavailable: 'Artist roster unavailable.',
      toastPickArtist: 'Pick an artist from the dropdown list',
      recentPlaylists: 'Recent playlists',
      toastRecentPlaylistsCleared: 'Recent playlists cleared',
      fbReportTitle: 'Report this song',
      fbReportIntro: 'What is wrong with this song? Its details are included below.',
      fbNotesOpt: 'Notes (optional)'
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
      playlistPlaceholder: 'Link Spotify, Apple, atau YT…',
      playlistPlay: 'Main',
      songsLbl: 'Lagu',
      allBtn: 'Semua',
      customPh: 'Kustom',
      playlistHint: 'Tempel link playlist Spotify, Apple Music, atau YouTube (atau Ctrl+A lagu Spotify)',
      duelPill: 'Tinggi / rendah',
      duelSub: 'Spotify streams & tahun rilis',
      duelSubBest: 'Spotify streams & tahun rilis · Terbaik {n}',
      playDuel: 'Main duel',
      artistPill: '10 tebakan',
      artistSub: 'Tebak artis misterius dari 6 petunjuk',
      artistSubBest: '6 petunjuk · Streak terbaik {n}',
      artistSubWon: '6 petunjuk · Tertebak {n}',
      playArtist: 'Main artis',
      statsBtn: 'Statistik',
      settingsBtn: 'Pengaturan',
      feedbackBtn: 'Masukan',
      // Genres & Eras
      allGenres: 'Semua genre',
      otherGenre: 'Lainnya',
      allEras: 'Semua era',
      before2000: 'Sebelum 2000',
      noSongsFilter: 'Tidak ada lagu yang cocok dengan filter ini.',
      oneSongMatch: '1 lagu cocok.',
      nSongsMatch: '{n} lagu cocok.',
      nSongsPool: '{n} lagu',
      // Game Arena
      changeMode: 'Ganti mode',
      searchSongsPh: 'Cari judul lagu…',
      maxLbl: 'Maks ',
      skip: 'Lewati',
      skipPlus: 'Lewati +{len}',
      giveUp: 'Menyerah',
      viewSummary: 'Lihat hasil',
      tryAgain: 'Coba lagi',
      oneSong5Tries: 'Satu lagu · <b>5 percobaan</b>',
      stageOf: 'Tahap <b>{s}</b> dari {t} · <b>{lvl}</b>',
      songOf: 'Lagu <b>{s}</b> dari {t} · <b>{lbl}</b>',
      pressPlayToHear: 'Tekan Putar untuk dengar {len}.',
      rightArtistUnlock: 'Artis benar, lagu salah. Klip {len} terbuka.',
      wrongUnlock: 'Belum tepat. Klip {len} terbuka.',
      skippedUnlock: 'Dilewati. Klip {len} terbuka.',
      alreadyTried: 'Lagu ini sudah dicoba.',
      pickFromList: 'Pilih lagu dari daftar dulu',
      notInCatalogue: 'Tidak ada di katalog.',
      triedBadge: 'Dicoba',
      skippedLbl: 'Dilewati',
      rightArtistLbl: 'Artis benar',
      loadingClip: 'Memuat klip…',
      clipUnavailable: 'Klip tidak tersedia — ketuk Coba lagi',
      attemptListen: 'Percobaan {n} · Dengar klip {len}',
      verdictGotIt: 'Tepat!',
      verdictMissed: 'Kesempatan habis',
      // Music Duel
      duelStreamsTab: 'Spotify Streams',
      duelYearTab: 'Tahun Rilis',
      hoverPlay: 'Hover play',
      duelKnownStreams: 'Streams diketahui',
      duelReleased: 'Tahun rilis',
      duelChallenger: 'Penantang',
      duelPromptStreams: 'Apakah penantang punya <b>lebih banyak</b> atau <b>lebih sedikit</b> Spotify streams?',
      duelPromptYear: 'Tebak apakah penantang dirilis <b>lebih baru</b> atau <b>lebih lama</b>.',
      duelHigher: '▲ Lebih Tinggi',
      duelLower: '▼ Lebih Rendah',
      duelLater: '▲ Lebih Baru',
      duelEarlier: '▼ Lebih Lama',
      duelMoreThan: 'Lebih dari {v}',
      duelFewerThan: 'Kurang dari {v}',
      duelAfter: 'Setelah {v}',
      duelBefore: 'Sebelum {v}',
      duelScore: 'Skor {n}',
      duelBest: 'Terbaik {n}',
      duelTarget: 'Target {n}',
      duelBeat: 'Lewati {n}!',
      duelCorrectStreams: 'Benar! {v}.',
      duelCorrectYear: 'Benar! Rilis tahun {y}.',
      duelMissedStreams: 'Salah — {v}.',
      duelMissedYear: 'Salah — rilis tahun {y}.',
      // Artist Detective
      searchArtistPh: 'Cari nama artis…',
      legendExact: 'Tepat',
      legendClose: 'Dekat',
      saveScoreCard: 'Simpan kartu skor',
      challengeFriend: 'Tantang teman',
      nextArtist: 'Artis berikutnya',
      agEmpty: 'Tebak artis apa saja di atas untuk membuka petunjuk Tahun Debut, Tipe, Gender, Genre, Negara & Peringkat Global (#1–#530).',
      agNoMatch: 'Tidak ada artis yang cocok di daftar Top 530.',
      agGuessPill: 'Tebakan {n} / {max}',
      agSolvedPill: 'Tertebak {n} / {max}',
      agMissedPill: 'Gagal · {max} / {max}',
      agGuessNum: 'Tebakan #{n}',
      agBestPill: 'Terbaik {n}',
      agSolvedTry: 'Tertebak dalam 1 percobaan!',
      agSolvedTries: 'Tertebak dalam {n} percobaan!',
      agSolvedTryHint: 'Tertebak dalam {n} percobaan · {h} petunjuk',
      agRevealed: 'Artis Misterius Terungkap',
      agTopHit: 'Lagu Hits: {title} ({country} · {genre})',
      clue_debut: 'Debut',
      clue_members: 'Tipe',
      clue_gender: 'Gender',
      clue_genre: 'Genre',
      clue_country: 'Negara',
      clue_rank: 'Peringkat',
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
      statRuns: 'sesi',
      statAvg: 'rata-rata',
      statBest: 'terbaik',
      statPerfect: 'sempurna',
      statPlayed: 'main',
      statWins: 'menang',
      statStreak: 'streak',
      statSolved: 'tertebak',
      statStreamsBest: 'terbaik streams',
      statYearBest: 'terbaik tahun',
      statBestStreak: 'streak terbaik',
      statDuels: 'duel',
      statScopeDaily: 'Tantangan Harian · semua hari tersimpan',
      statScopeDuel: 'Music Duel · Spotify Streams & Tahun Rilis',
      statScopeArtist: 'Artist Detective · daftar Top 530',
      statScopeAllClassic: 'Semua filter Classic',
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
      fbIssueLbl: 'Masalah',
      fbCategoryLbl: 'Kategori',
      fbCatBug: 'Laporkan bug',
      fbCatSong: 'Usulkan lagu',
      fbCatOther: 'Masukan lainnya',
      fbMsgLbl: 'Pesan',
      fbMsgPh: 'Apa yang terjadi, atau apa yang ingin kamu lihat?',
      fbEmailLbl: 'Email',
      fbEmailOpt: '(opsional, jika ingin dibalas)',
      fbDetailsLbl: 'Detail game',
      fbDetailsOpt: '(opsional)',
      fbDetailsPh: 'Mode, lagu, atau detail perangkat',
      fbNote: 'Pesan dan detail yang kamu kirim langsung masuk secara privat ke pemilik situs.',
      sendFeedback: 'Kirim masukan',
      acceptChallenge: 'Terima tantangan',
      playRegular: 'Main mode biasa',
      // Guide & FAQ
      guideTitle: 'Pilih musikmu',
      guideIntro: 'Pintasan cepat untuk sesi Classic berikutnya.',
      guideGenres: 'Genre',
      guideEras: 'Era',
      guideNote: 'Pintasan genre mencakup semua era; pintasan era mencakup semua genre. Gabungkan keduanya lewat filter di atas.',
      aboutTitle: 'Tentang TuneUp',
      aboutP1: 'TuneUp adalah game tebak lagu online gratis langsung di browser tanpa akun. Uji telingamu menebak judul lagu dari klip 0,1–15 detik di Tantangan Harian, Classic (33.500+ lagu), Per Artis, & Playlist Spotify, Apple Music, dan YouTube, adu lagu hits di Music Duel, atau tebak 530 artis global di Artist Detective.',
      aboutP2: 'Gratis dimainkan kapan saja di HP maupun laptop.',
      faqTitle: 'Perlu diketahui',
      faqQ1: 'Apakah perlu bikin akun?',
      faqA1: 'Tidak perlu daftar. Buka game di HP atau laptop lalu pilih mode, atau tempel link playlist publik Spotify, Apple Music, maupun YouTube untuk main pakai lagumu sendiri.',
      faqQ2: 'Mode apa saja yang bisa dimainkan berulang kali?',
      faqA2: 'Classic, Per Artis, Playlist, Music Duel, dan Artist Detective bisa dimainkan sepuasnya. Tantangan Harian tersedia satu lagu per hari dengan lima kesempatan.',
      faqQ3: 'Kapan Tantangan Harian berikutnya dibuka?',
      faqA3: 'Setiap pukul 07.00 waktu perangkatmu. Menang berturut-turut menambah streak; terlewat sehari atau kalah akan mereset streak.',
      faqQ4: 'Bisa menantang teman?',
      faqA4: 'Bisa. Setelah menyelesaikan lagu, sesi 5 tahap, Music Duel, atau Artist Detective, klik Tantang teman untuk menyalin link bebas spoiler dengan lagu atau artis yang persis sama.',
      faqQ5: 'Di mana progres saya disimpan?',
      faqA5: 'Progres Harian, streak, statistik, lencana, dan pengaturan tersimpan di browser ini. Buka Pengaturan → Cadangkan & pindah data untuk menyalin kode backup dan memulihkannya di browser atau perangkat lain.',
      backToTop: 'Kembali ke atas',
      modeLinkDaily: 'Tantangan Harian',
      modeLinkClassic: 'Classic',
      modeLinkArtist: 'Per Artis',
      modeLinkSpotify: 'Kuis Playlist',
      modeLinkDuel: 'Music Duel',
      modeLinkDetective: 'Artist Detective',
      modeLinkLang: 'English',
      // Playlist / Dynamic strings
      allSongs: 'Semua lagu',
      nSongs: '{n} lagu',
      nSong: '{n} lagu',
      loadingPlaylist: 'Memuat daftar lagu playlist…',
      playlistNeedLink: 'Tempel link playlist Spotify, Apple Music, atau YouTube dulu.',
      playlistBadLink: 'Tempel link playlist Spotify, Apple Music, atau YouTube yang valid.',
      playlistNoTracks: 'Tidak ada lagu yang bisa diputar. Pastikan playlist bersifat Publik.',
      playlistUnreachable: 'Gagal menghubungi penyedia playlist saat ini. Coba lagi.',
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
      badge_explorer_desc: 'Mainkan Classic, Harian, Duel & Artist Detective',
      // Result verdicts, streaks & toasts (Wave 64 full ID parity)
      verdict1: 'langsung kena',
      verdict2: 'mantap',
      verdict3: 'ketebak',
      verdict4: 'aman',
      verdict5: 'nyaris',
      verdictItWas: 'jawabannya',
      guessedIn: 'Ketebak dalam {len}!',
      lostBadge: 'Gagal!',
      songStreak: 'streak {n} lagu',
      customStreak: 'streak {n} kustom',
      newBestTag: ' · Rekor baru!',
      bestTag: ' · Terbaik {n}',
      loadingBtn: 'Memuat…',
      plMultiMix: '{c} playlist + {t} lagu terdeteksi — akan digabung',
      plMulti: '{c} playlist terdeteksi — semua lagu akan digabung',
      plOnePlusTracks: 'Playlist + {t} link lagu terdeteksi — digabung tanpa duplikat',
      plTracksReady: '{t} lagu Spotify terdeteksi — siap dimainkan',
      toastPreviewUnavailable: 'Pratinjau tidak tersedia untuk lagu ini.',
      toastPreviewError: 'Gagal memutar pratinjau.',
      toastAutoplayOn: 'Putar otomatis aktif',
      toastAutoplayOff: 'Putar otomatis nonaktif',
      toastSfxOn: 'Efek suara aktif',
      toastSfxOff: 'Efek suara nonaktif',
      toastHoverOn: 'Hover play aktif',
      toastHoverOff: 'Hover play nonaktif',
      toastHoverOffHint: 'Hover play nonaktif — klik ▶ untuk dengar',
      toastBackupCopied: 'Kode backup tersalin!',
      toastBackupManual: 'Kode dibuat di atas — pilih lalu salin manual.',
      toastRestored: 'Progres berhasil dipulihkan!',
      toastAllReset: 'Semua data telah dihapus',
      toastCantShare: 'Rekaman ini belum bisa dibagikan sekarang. Coba lagu lain.',
      toastStatsReset: 'Statistik direset',
      toastCopiedFriend: 'Tersalin — kirim ke temanmu',
      toastCopyFailed: 'Gagal menyalin',
      toastCardSaved: 'Kartu skor tersimpan!',
      toastCardShared: 'Kartu skor dibagikan!',
      toastCardFailed: 'Gagal menyimpan kartu skor.',
      toastDuelNotEnough: 'Lagu belum cukup untuk Music Duel.',
      toastDuelFailed: 'Gagal memulai Music Duel.',
      toastAudioUnavailable: 'Pratinjau audio sedang tidak tersedia.',
      toastAudioFailed: 'Gagal memutar pratinjau audio.',
      toastAlreadyGuessed: '{name} sudah pernah ditebak',
      toastRosterUnavailable: 'Daftar artis tidak tersedia.',
      toastPickArtist: 'Pilih artis dari daftar dulu',
      recentPlaylists: 'Playlist terakhir',
      toastRecentPlaylistsCleared: 'Riwayat playlist dihapus',
      fbReportTitle: 'Laporkan lagu ini',
      fbReportIntro: 'Apa masalah dengan lagu ini? Detail lagunya sudah disertakan di bawah.',
      fbNotesOpt: 'Catatan (opsional)'
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
    if (!$('#classicSpotifyPanel') || $('#classicSpotifyPanel').hidden) {
      setText($('.classic-title-group .mode-pill'), 'stages5');
    }
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
    setText($('.clip-pill small'), 'maxLbl');
    setText($('#retrySong'), 'tryAgain');
    setText($('#resultRetry'), 'tryAgain');
    setText($('#duelTabs [data-duel="streams"]'), 'duelStreamsTab');
    setText($('#duelTabs [data-duel="year"]'), 'duelYearTab');
    setText($('#duelHoverToggle span:last-child'), 'hoverPlay');
    setText($('#duelTagB'), 'duelChallenger');
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
    setText($('#againRun'), 'playAgain');
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
    setText($('#feedbackReasonField label'), 'fbIssueLbl');
    setText($('#feedbackCategoryField label'), 'fbCategoryLbl');
    const fbCat = $('#feedbackCategory');
    if (fbCat && fbCat.options && fbCat.options.length >= 3) {
      fbCat.options[0].textContent = t('fbCatBug');
      fbCat.options[1].textContent = t('fbCatSong');
      fbCat.options[2].textContent = t('fbCatOther');
    }
    setText($('#feedbackMessageLabel'), 'fbMsgLbl');
    if ($('#feedbackMessage')) $('#feedbackMessage').placeholder = t('fbMsgPh');
    const emLbl = $('label[for="feedbackEmail"]');
    if (emLbl) emLbl.innerHTML = t('fbEmailLbl') + ' <span>' + t('fbEmailOpt') + '</span>';
    const dtLbl = $('label[for="feedbackDetails"]');
    if (dtLbl) dtLbl.innerHTML = t('fbDetailsLbl') + ' <span>' + t('fbDetailsOpt') + '</span>';
    if ($('#feedbackDetails')) $('#feedbackDetails').placeholder = t('fbDetailsPh');
    setText($('.feedback-note'), 'fbNote');
    setText($('#sendFeedback'), 'sendFeedback');
    setText($('#leaveChallenge'), 'playRegular');

    // Site guide + FAQ
    setText($('#musicBrowserTitle'), 'guideTitle');
    setText($('.browser-intro'), 'guideIntro');
    const mgHeads = doc.querySelectorAll('.music-group h3');
    if (mgHeads[0]) mgHeads[0].textContent = t('guideGenres');
    if (mgHeads[1]) mgHeads[1].textContent = t('guideEras');
    setText($('[data-guide-genre="lain"]'), 'otherGenre');
    setText($('[data-guide-era="old"]'), 'before2000');
    setText($('.browser-note'), 'guideNote');
    setText($('#aboutTitle'), 'aboutTitle');
    const aboutPs = doc.querySelectorAll('.guide-about p');
    if (aboutPs[0]) aboutPs[0].textContent = t('aboutP1');
    if (aboutPs[1]) aboutPs[1].textContent = t('aboutP2');
    setText($('#faqTitle'), 'faqTitle');
    const faqs = doc.querySelectorAll('.guide-faq details');
    for (let i = 0; i < faqs.length && i < 5; i++) {
      const sum = faqs[i].querySelector('summary');
      const p = faqs[i].querySelector('p');
      if (sum) sum.textContent = t('faqQ' + (i + 1));
      if (p) p.textContent = t('faqA' + (i + 1));
    }
    setBtnLabelKeepSvg($('[data-guide-top]'), 'backToTop');
    setText($('[data-mode-link="daily"]'), 'modeLinkDaily');
    setText($('[data-mode-link="classic"]'), 'modeLinkClassic');
    setText($('[data-mode-link="artist"]'), 'modeLinkArtist');
    setText($('[data-mode-link="spotify"]'), 'modeLinkSpotify');
    setText($('[data-mode-link="duel"]'), 'modeLinkDuel');
    setText($('[data-mode-link="detective"]'), 'modeLinkDetective');
    const langLink = $('[data-mode-link="lang"]');
    if (langLink) {
      langLink.textContent = t('modeLinkLang');
      langLink.setAttribute('href', currentLang === 'id' ? '/' : '/id');
      langLink.setAttribute('hreflang', currentLang === 'id' ? 'en' : 'id');
      langLink.setAttribute('lang', currentLang === 'id' ? 'en' : 'id');
    }
  }

  const api = { STORAGE_KEY, DICT, load, set, get, t, apply };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuneUpI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
