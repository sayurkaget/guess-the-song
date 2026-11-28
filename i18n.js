/* TuneUp — Bilingual EN / ES translation layer (stored in tl:set:lang, backed up by TuneUpBackup). */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'tl:set:lang';
  let currentLang = 'en';

  const DICT = {
    en: {
      // Lobby
      dailyHeading: 'Daily Challenge',
      dailyHubHeading: 'Daily Challenge',
      dailySongHeading: 'Daily Song',
      dailySub: '1 song · 5 tries',
      moreGamesHeading: 'More Music Games',
      moreGamesSub: '7 free-play modes',
      mgLblCover: 'Cover Pixel',
      mgSubCover: 'Pixel album',
      mgLblMv: 'MV Frame',
      mgSubMv: 'Music video',
      mgLblHair: 'Hair Peek',
      mgSubHair: 'Musician hair',
      mgLblFact: 'Fact or Cap',
      mgSubFact: 'Music trivia',
      mgLblLyric: 'Lyric Guess',
      mgSubLyric: '5 lyric lines',
      dailyArtistHeading: 'Daily Artist',
      dailyArtistSub: '1 artist · 10 tries',
      dailyWinStreakLbl: '{n}-win streak',
      dailyNextSongShort: 'Next song in {t}',
      dailyArtistStreakLbl: '{n}-day streak',
      dailyArtistNextShort: 'Next artist in {t}',
      dailyArtistTriesSoFar: '{n}/10 tries used',
      dailyBadgeDone: 'Done',
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
      artistPill: 'Endless',
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
      multiDone: 'Done',
      multiSelected: '{n} selected',
      noSongsFilter: 'No songs match these filters.',
      oneSongMatch: '1 song matches.',
      nSongsMatch: '{n} songs match.',
      nSongsPool: '{n} songs',
      // Game Arena
      changeMode: 'Change mode',
      backToDaily: 'Back to Daily',
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
      agTopHit: '{title} · {country} · {genre}',
      agTabDaily: 'Daily Artist',
      agTabEndless: 'Endless',
      agPlayEndless: 'Play Endless',
      agDailyWait: 'Next Daily Artist in {t}',
      agDailyMeta: 'Daily Artist · {day}',
      agDailyStreakPill: 'Daily streak {n}',
      artistSubDailyDone: 'Daily {n}/10 · Endless ready',
      artistSubDailyMissed: 'Daily complete · Endless ready',
      artistSubDailyStreak: 'Daily + Endless · {n}-day streak',
      artistSubDailyReady: 'Daily Artist + Endless · 6 clues',
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
      setAnimLbl: 'Animations',
      setAnimDesc: 'Confetti, spinning vinyl & smooth effects (even if OS animations are off)',
      toastAnimOn: 'Animations on',
      toastAnimOff: 'Animations off',
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
      tabMini: 'Mini-Games',
      tabBadges: 'Achievements',
      scoreSpread: 'Score spread',
      attemptSpread: 'Attempt spread',
      deckComparison: 'Deck comparison',
      guessesToSolve: 'Guesses to solve',
      miniBreakdown: 'Per-game breakdown',
      dailyHubSpread: 'Score spread (/300)',
      statAvg300: 'avg /300',
      statBest300: 'best /300',
      statScopeDailyHub: 'Daily Challenge · 3-game /300',
      resetStats: 'Reset stats',
      badgesScope: '{u} of {t} achievements unlocked · saved on this device',
      achUnlockedKicker: 'Achievement unlocked',
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
      statWinRate: 'win rate',
      statDuels: 'duels',
      statScopeDaily: 'Daily Challenge · all saved days',
      statScopeDuel: 'Music Duel · Spotify Streams & Release Year',
      statScopeArtist: 'Artist Detective · Top 530 roster',
      statScopeMini: '5 free-play & Daily Hub mini-games',
      statScopeAllClassic: 'All Classic filters',
      // Custom Modal
      customTitle: 'Pick an artist',
      customSub: 'Play an artist',
      customHint: 'Pick an artist — we pick 5 of their songs.',
      customPhInput: 'Search any artist…',
      recentArtists: 'Recent artists',
      popularArtists: 'Popular artists',
      clearBtn: 'Clear',
      surpriseMe: '✦ Surprise me',
      refreshBtn: '↻ Refresh',
      // Result / Run / Leave / Feedback / Challenge
      nextBtn: 'Next',
      dailyResultBtn: 'Daily result',
      seeResultBtn: 'See result',
      dailyBadgePill: 'Daily Challenge · 1 song',
      friendBadgePill: 'Friend Challenge · 1 song',
      friendChallengeTag: 'Friend Challenge',
      customTag: 'Custom',
      verdictDailyWon: 'Daily solved!',
      verdictDailyLost: 'New song tomorrow.',
      verdictZero: 'Zero. Try again!',
      verdictOne: 'One down.',
      verdictNotBad: 'Not bad.',
      verdictNice: 'Nice run!',
      verdictClose: 'So close to perfect!',
      verdictPerfectSongs: 'Perfect. Every song!',
      verdictPerfectStages: 'Perfect. Every stage.',
      verdictToughPlaylist: 'Tough playlist!',
      scoreUnitSong: 'song',
      scoreUnitSongs: 'songs',
      scoreUnitStage: 'stage',
      scoreUnitStages: 'stages',
      todaysSong: "Today's song",
      songNum: 'Song {n}',
      notPlayed: 'Not played',
      browserPausedAudio: 'Your browser paused playback. Tap Play to listen.',
      loadingSong: 'Loading song…',
      dailyResultStreak: 'Win streak {cur} · Best {best} · Next daily in {rem}',
      dailyCommunityStat: 'Today · {pct}% solved · avg {avg} tries',
      dailyCommunityZero: 'Today · 0% solved',
      dcFasterThan: 'Faster than {pct}% of players',
      dcFastestFirst: '#1 fastest today · 1st try{clip}',
      dcMatchedPace: "Matched today's pace · {n} tries",
      dcToughMissed: '{pct}% of players also missed',
      dcBadgeWin: 'You: {you} · {avg} avg',
      dcBadgeLose: 'You: X · {avg} avg',
      dcBadgeZero: '0% solved',
      dcSubSongWin: '{pct}% of players solved · {samePct}% on {tryLabel}',
      dcSubSongAvg: '{pct}% of players solved · avg {avg} tries',
      dcSubSongZero: '0% of players solved today so far',
      dcSubArtistWin: '{pct}% of players solved · {samePct}% in {tryLabel}',
      dcSubArtistAvg: '{pct}% of players solved · avg {avg} tries',
      dcSubArtistZero: '0% of players solved today so far',
      quickPresets: 'Quick playlists',
      refreshPresets: 'Refresh',
      presetIndo: 'Indo Pop',
      presetKpop: 'K-Pop',
      presetAnime: 'Anime',
      presetThrowback: '2000s',
      presetY10s: '2010s Hits',
      presetY90s: '90s Hits',
      presetY20s: '2020s Pop',
      presetRock: 'Rock Hits',
      presetHiphop: 'Hip-Hop',
      presetRnb: 'R&B & Soul',
      presetIndie: 'Indie Chill',
      presetEdm: 'EDM & Dance',
      duelVerdictWon: 'You won the duel!',
      duelVerdictTie: 'Duel tied!',
      duelVerdictLost: 'Friend wins this round',
      duelVerdictBest: 'New personal best!',
      duelVerdictFire: 'On fire!',
      duelVerdictGood: 'Good run!',
      duelFinalBest: 'best {n}',
      duelSummaryMore: '{b} ({bm}) has more Spotify streams than {a} ({am}).',
      duelSummaryFewer: '{b} ({bm}) has fewer Spotify streams than {a} ({am}).',
      duelSummaryAfter: '{b} ({bm}) came out after {a} ({am}).',
      duelSummaryBefore: '{b} ({bm}) came out before {a} ({am}).',
      duelFriendPrefix: 'Friend Duel · ',
      duelStartLbl: 'Start',
      duelRoundNum: 'Round {n}',
      chInvalidLink: 'This challenge link is invalid or uses an unsupported version. Ask your friend for a new link.',
      chArtistTitle: 'Mystery artist challenge',
      chArtistRules: 'Same mystery artist. Up to 10 tries.<br>Use 6 clues (Debut, Type, Gender, Genre, Country, Rank) to solve it faster!',
      chArtistRulesInvalid: 'Mystery artist deduction challenge.<br>Ask your friend for a valid challenge link.',
      chArtistMsgWon: 'Your friend solved this Mystery Artist in {n} {unit}. Can you beat them?',
      chArtistMsgLost: 'Your friend was stumped by this Mystery Artist. Can you solve it?',
      chDuelAccept: 'Accept duel',
      chDuelTitle: 'Friend duel',
      chDuelRules: 'Exact same song sequence as your friend.<br>Beat their score of {n} to win!',
      chDuelRulesInvalid: 'Head-to-head music duel.<br>Ask your friend for a valid duel link.',
      chDuelMsg: 'Your friend scored {n} in {deck} Duel. Can you beat them?',
      chSongKicker: 'Song Challenge',
      chFriendTitle: 'Friend challenge',
      chRunRules: '{n} {unit}. Five tries each. Same recordings, same clip lengths:<br>0.1s → 0.5s → 2s → 8s → 15s.',
      chSongRules: 'One song. Five tries. Same recording, same clip lengths:<br>0.1s → 0.5s → 2s → 8s → 15s.',
      chRunMsg: 'Your friend scored {desc}. Can you beat them?',
      chSongMsg: 'Your friend {desc}. Can you beat them?',
      playAgain: 'Play again',
      backToMenu: 'Back to menu',
      listenFull: 'Listen in full ↗',
      reportSong: 'Report this song',
      leaveTitle: 'Leave this playlist?',
      leaveKeep: 'Keep playing',
      leaveFinish: 'Finish & see result',
      leaveExit: 'Leave to menu',
      feedbackTitle: 'Send feedback',
      feedbackIntro: 'Bugs, song requests, or ideas — we read every note.',
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
      playRegular: 'Play Classic',
      playClassic: 'Play Classic',
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
      faqA5: 'Your Daily progress, streaks, stats, achievements, and settings are saved in this browser. Open Settings → Backup & transfer to copy a backup code and restore your progress on another browser or device.',
      backToTop: 'Back to top',
      modeLinkDaily: 'Daily Challenge',
      modeLinkClassic: 'Classic',
      modeLinkArtist: 'By Artist',
      modeLinkSpotify: 'Playlist Quiz',
      modeLinkDuel: 'Music Duel',
      modeLinkDetective: 'Artist Detective',
      modeLinkLang: 'Español',
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
      badge_firstwin_name: 'First Note',
      badge_firstwin_desc: 'Guess your first song right in any mode',
      badge_sniper_name: '0.1s Sniper',
      badge_sniper_desc: 'Guess a song right on the first 0.1s clip',
      badge_clutch_name: 'Last Second',
      badge_clutch_desc: 'Nail a song on the 5th and final 15s clip',
      badge_impossible_name: 'Ear of Steel',
      badge_impossible_desc: 'Beat Stage 5 (Impossible) in a Classic run',
      badge_sweep_name: 'Perfect Sweep',
      badge_sweep_desc: 'Score 5/5 in a Classic or Artist run',
      badge_streak10_name: 'Hot Streak',
      badge_streak10_desc: 'Reach a 10-song Classic win streak',
      badge_veteran_name: 'Crate Digger',
      badge_veteran_desc: 'Complete 10 Classic runs',
      badge_playlist_name: 'DJ Mode',
      badge_playlist_desc: 'Finish a Spotify, Apple Music, or YouTube playlist quiz',
      badge_daily3_name: 'Daily Regular',
      badge_daily3_desc: 'Reach a 3-day Daily streak',
      badge_daily7_name: 'Week Warrior',
      badge_daily7_desc: 'Reach a 7-day Daily streak',
      badge_duel10_name: 'Duel Ace',
      badge_duel10_desc: 'Score 10+ in a single Music Duel run',
      badge_duel20_name: 'Chart Legend',
      badge_duel20_desc: 'Score 20+ in a single Music Duel run',
      badge_detective_name: 'Sharp Detective',
      badge_detective_desc: 'Solve Artist Detective in 3 tries or less',
      badge_artist1_name: 'First-Try Psychic',
      badge_artist1_desc: 'Solve Artist Detective on your very first guess',
      badge_dailyartist3_name: 'Daily Sleuth',
      badge_dailyartist3_desc: 'Reach a 3-day Daily Artist streak',
      badge_explorer_name: 'All-Rounder',
      badge_explorer_desc: 'Play Classic, Daily, Duel & Artist Detective',
      badge_dailyhub1_name: 'Daily Spinner',
      badge_dailyhub1_desc: 'Complete your first 3-game Daily Challenge',
      badge_daily250_name: 'High Roller',
      badge_daily250_desc: 'Score 250+ / 300 in a Daily Challenge',
      badge_daily300_name: 'Flawless 300',
      badge_daily300_desc: 'Score a perfect 300 / 300 in a Daily Challenge',
      badge_cover1_name: 'Pixel Hawk',
      badge_cover1_desc: 'Guess an album on Try 1 in Cover Pixel',
      badge_mv1_name: 'Cinema Buff',
      badge_mv1_desc: 'Guess the song from Frame 1 in MV Frame',
      badge_hair1_name: 'Hair Stylist',
      badge_hair1_desc: 'Guess the musician on Try 1 in Hair Peek',
      badge_fact10_name: 'Fact Checker',
      badge_fact10_desc: 'Reach a 10+ streak in Fact or Cap',
      badge_lyric1_name: 'Lyric Savant',
      badge_lyric1_desc: 'Guess the song from Line 1 in Lyric Guess',
      // Result verdicts, streaks & toasts
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
      toastCopiedFriend: 'Challenge link copied — send it to a friend',
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
      fbReportIntro: 'Pick what is wrong with this track. Recording details attach automatically.',
      fbNotesOpt: 'Notes (optional)',
      fbTopicKicker: 'Topic',
      fbReasonKicker: 'What went wrong?',
      fbCatBugPill: 'Bug',
      fbCatSongPill: 'Song request',
      fbCatIdeaPill: 'Idea',
      fbReasonAudioPill: 'No audio',
      fbReasonLivePill: 'Live version',
      fbReasonTitlePill: 'Wrong info',
      fbReasonOtherPill: 'Other issue',
      fbBugPh: 'What happened? Tell us what you were playing…',
      fbSongPh: 'Drop the song title & artist you would love to see…',
      fbIdeaPh: 'Share a feature idea or anything we can make better…',
      fbReportPh: 'Optional notes about the audio or song info…',
      fbPrivacyNote: 'Private to TuneUp',
      fbEmailToggle: 'Add email for a reply (optional)',
      fbPickReason: 'Please pick what is wrong with this song.',
      fbSending: 'Sending…',
      fbSendingNote: 'Sending your feedback…',
      fbSent: 'Thanks! Your feedback has been sent.',
      fbSendFail: 'Could not send your feedback. Your message is still here — please try again.',
      fbUnavailable: 'Feedback is temporarily unavailable. Please come back later.',
      dailyChalTitle: 'Daily Song challenge',
      dailyChalRules: 'One song. Five tries. Same clip lengths:<br>0.1s → 0.5s → 2s → 8s → 15s.',
      dailyChalFriendWon: "Your friend solved today's Daily Song in {len} ({n}/5 tries). Can you beat them?",
      dailyChalFriendMissed: "Your friend couldn't solve today's Daily Song. Can you beat it?",
      dailyChalOldWon: "Your friend solved the {day} Daily Song in {len}. Try today's Daily Song!",
      dailyChalOldMissed: "Your friend played the {day} Daily Song. Try today's Daily Song!",
      plChalKicker: 'Playlist Quiz',
      plChalTitle: 'Playlist challenge',
      plChalRules: '{n} songs from the same playlist. Five tries each:<br>0.1s → 0.5s → 2s → 8s → 15s.',
      plChalFriendScored: 'Your friend scored {s}/{t} on this playlist. Can you beat them?'
    },
    es: {
      // Lobby
      dailyHeading: 'Desafío Diario',
      dailyHubHeading: 'Desafío Diario',
      dailySongHeading: 'Canción del Día',
      dailySub: '1 canción · 5 intentos',
      moreGamesHeading: 'Más Juegos Musicales',
      moreGamesSub: '7 modos de juego libre',
      mgLblCover: 'Cover Pixel',
      mgSubCover: 'Portada pixelada',
      mgLblMv: 'MV Frame',
      mgSubMv: 'Videoclip',
      mgLblHair: 'Hair Peek',
      mgSubHair: 'Peinado musical',
      mgLblFact: 'Dato o Mito',
      mgSubFact: 'Trivia musical',
      mgLblLyric: 'Adivina la Letra',
      mgSubLyric: '5 versos',
      dailyArtistHeading: 'Artista del Día',
      dailyArtistSub: '1 artista · 10 intentos',
      dailyWinStreakLbl: 'Racha de {n} victorias',
      dailyNextSongShort: 'Siguiente canción en {t}',
      dailyArtistStreakLbl: 'Racha de {n} días',
      dailyArtistNextShort: 'Siguiente artista en {t}',
      dailyArtistTriesSoFar: '{n}/10 intentos usados',
      dailyBadgeDone: 'Listo',
      playDaily: 'Jugar diario',
      continueDaily: 'Continuar',
      viewResult: 'Ver resultado',
      classicHeading: 'Clásico',
      stages5: '5 rondas',
      tabFilters: 'Género y Época',
      tabArtist: 'Por Artista',
      tabPlaylist: 'Playlists',
      start: 'Empezar',
      continueBtn: 'Continuar',
      seeResult: 'Ver resultado',
      artistPanelTitle: 'Juega con tu artista favorito',
      artistPanelDesc: 'Elige cualquier artista — adivina 5 canciones con clips de 0,1 s',
      chooseArtist: 'Elegir artista',
      playlistPlaceholder: 'Enlace de Spotify, Apple o YT…',
      playlistPlay: 'Jugar',
      songsLbl: 'Canciones',
      allBtn: 'Todas',
      customPh: 'Otro',
      playlistHint: 'Pega enlaces de playlists de Spotify, Apple Music o YouTube (o Ctrl+A de pistas de Spotify)',
      duelPill: 'Mayor o menor',
      duelSub: 'Streams de Spotify y año de lanzamiento',
      duelSubBest: 'Streams de Spotify y año · Récord {n}',
      playDuel: 'Jugar duelo',
      artistPill: 'Sin fin',
      artistSub: 'Descubre al artista misterioso con 6 pistas',
      artistSubBest: '6 pistas · Mejor racha {n}',
      artistSubWon: '6 pistas · Adivinados {n}',
      playArtist: 'Jugar artista',
      statsBtn: 'Estadísticas',
      settingsBtn: 'Ajustes',
      feedbackBtn: 'Comentarios',
      // Genres & Eras
      allGenres: 'Todos los géneros',
      otherGenre: 'Otros',
      allEras: 'Todas las épocas',
      before2000: 'Antes del 2000',
      multiDone: 'Listo',
      multiSelected: '{n} seleccionados',
      noSongsFilter: 'Ninguna canción coincide con estos filtros.',
      oneSongMatch: '1 canción coincide.',
      nSongsMatch: '{n} canciones coinciden.',
      nSongsPool: '{n} canciones',
      // Game Arena
      changeMode: 'Cambiar modo',
      backToDaily: 'Volver al Diario',
      searchSongsPh: 'Buscar canciones…',
      maxLbl: 'Máx. ',
      skip: 'Saltar',
      skipPlus: 'Saltar +{len}',
      giveUp: 'Rendirse',
      viewSummary: 'Ver resultado',
      tryAgain: 'Intentar de nuevo',
      oneSong5Tries: 'Una canción · <b>5 intentos</b>',
      stageOf: 'Ronda <b>{s}</b> de {t} · <b>{lvl}</b>',
      songOf: 'Canción <b>{s}</b> de {t} · <b>{lbl}</b>',
      pressPlayToHear: 'Pulsa Play para escuchar {len}.',
      rightArtistUnlock: 'Artista correcto, canción incorrecta. {len} desbloqueado.',
      wrongUnlock: 'No es esa. {len} desbloqueado.',
      skippedUnlock: 'Saltada. {len} desbloqueado.',
      alreadyTried: 'Ya probaste esa canción.',
      pickFromList: 'Primero elige una canción de la lista',
      notInCatalogue: 'No está en el catálogo.',
      triedBadge: 'Probada',
      skippedLbl: 'Saltada',
      rightArtistLbl: 'Artista correcto',
      loadingClip: 'Cargando clip…',
      clipUnavailable: 'Clip no disponible — pulsa Intentar de nuevo',
      attemptListen: 'Intento {n} · Escucha el clip de {len}',
      verdictGotIt: '¡Acertaste!',
      verdictMissed: 'Sin intentos',
      // Music Duel
      duelStreamsTab: 'Streams de Spotify',
      duelYearTab: 'Año de lanzamiento',
      hoverPlay: 'Reproducir al pasar',
      duelKnownStreams: 'Streams conocidos',
      duelReleased: 'Lanzamiento',
      duelChallenger: 'Retador',
      duelPromptStreams: '¿El retador tiene <b>más</b> o <b>menos</b> streams en Spotify?',
      duelPromptYear: 'Adivina si el retador salió <b>antes</b> o <b>después</b>.',
      duelHigher: '▲ Más',
      duelLower: '▼ Menos',
      duelLater: '▲ Después',
      duelEarlier: '▼ Antes',
      duelMoreThan: 'Más de {v}',
      duelFewerThan: 'Menos de {v}',
      duelAfter: 'Después de {v}',
      duelBefore: 'Antes de {v}',
      duelScore: 'Puntos {n}',
      duelBest: 'Récord {n}',
      duelTarget: 'Meta {n}',
      duelBeat: '¡Superaste {n}!',
      duelCorrectStreams: '¡Correcto! {v}.',
      duelCorrectYear: '¡Correcto! Salió en {y}.',
      duelMissedStreams: 'Fallaste — {v}.',
      duelMissedYear: 'Fallaste — salió en {y}.',
      // Artist Detective
      searchArtistPh: 'Buscar cualquier artista…',
      legendExact: 'Exacto',
      legendClose: 'Cerca',
      saveScoreCard: 'Guardar tarjeta',
      challengeFriend: 'Retar a un amigo',
      nextArtist: 'Siguiente artista',
      agEmpty: 'Adivina un artista arriba para revelar Año de Debut, Tipo, Género, Estilo, País y Ranking Global (#1–#530).',
      agNoMatch: 'No hay artistas coincidentes en el top 530.',
      agGuessPill: 'Intento {n} / {max}',
      agSolvedPill: 'Acertado {n} / {max}',
      agMissedPill: 'Fallaste · {max} / {max}',
      agGuessNum: 'Intento #{n}',
      agBestPill: 'Récord {n}',
      agSolvedTry: '¡Acertado al 1er intento!',
      agSolvedTries: '¡Acertado en {n} intentos!',
      agSolvedTryHint: 'Acertado en {n} {unit} · {h} {hUnit}',
      agRevealed: 'Artista Misterioso Revelado',
      agTopHit: '{title} · {country} · {genre}',
      agTabDaily: 'Artista Diario',
      agTabEndless: 'Sin fin',
      agPlayEndless: 'Jugar Sin fin',
      agDailyWait: 'Siguiente Artista Diario en {t}',
      agDailyMeta: 'Artista Diario · {day}',
      agDailyStreakPill: 'Racha diaria {n}',
      artistSubDailyDone: 'Diario {n}/10 · Sin fin listo',
      artistSubDailyMissed: 'Diario completo · Sin fin listo',
      artistSubDailyStreak: 'Diario + Sin fin · racha de {n} días',
      artistSubDailyReady: 'Artista Diario + Sin fin · 6 pistas',
      clue_debut: 'Debut',
      clue_members: 'Tipo',
      clue_gender: 'Género',
      clue_genre: 'Estilo',
      clue_country: 'País',
      clue_rank: 'Ranking Global',
      hintIn: 'Pista en {n}',
      hint2In: 'Pista 2 en {n}',
      getHint1: 'Ver pista (1/2)',
      getHint2: 'Pista del nombre (2/2)',
      hintsUsedAll: '2/2 pistas usadas',
      // Settings Modal
      setTitle: 'Ajustes',
      setLangLbl: 'Idioma',
      setLangDesc: 'Idioma de los menús y etiquetas',
      setAutoplayLbl: 'Auto-reproducir al revelar',
      setAutoplayDesc: 'Reproduce la canción completa al terminar la ronda',
      setSfxLbl: 'Efectos de sonido',
      setSfxDesc: 'Sonidos al acertar, acercarte o fallar',
      setHoverLbl: 'Reproducir al pasar',
      setHoverDesc: 'Duelo Musical · reproduce al pasar el cursor sobre la tarjeta',
      setAnimLbl: 'Animaciones',
      setAnimDesc: 'Confeti, vinilo girando y efectos fluidos (incluso si el sistema los reduce)',
      toastAnimOn: 'Animaciones activadas',
      toastAnimOff: 'Animaciones desactivadas',
      setBackupTitle: 'Respaldo y transferencia',
      setBackupNote: 'Sin cuenta. Copia tu código y pégalo en otro navegador o dispositivo para trasladar tus estadísticas, rachas e historial diario.',
      setBackupPh: 'Tu código de respaldo aparece aquí — o pega uno para restaurar',
      backupCopy: 'Copiar código',
      backupRestore: 'Restaurar código',
      confirmRestore: 'Confirmar restauración',
      resetAllData: 'Borrar todos los datos en este dispositivo',
      resetAllConfirm: 'Haz clic otra vez para borrar estadísticas, rachas y ajustes',
      // Stats Modal & Badges
      statsTitle: 'Estadísticas',
      tabThisFilter: 'Este filtro',
      tabAllClassic: 'Todo Clásico',
      tabDaily: 'Diario',
      tabDuel: 'Duelo',
      tabArtistStat: 'Artista',
      tabMini: 'Minijuegos',
      tabBadges: 'Logros',
      scoreSpread: 'Distribución de puntos',
      attemptSpread: 'Distribución de intentos',
      deckComparison: 'Comparación de modos',
      guessesToSolve: 'Intentos para acertar',
      miniBreakdown: 'Desglose por juego',
      dailyHubSpread: 'Distribución (/300)',
      statAvg300: 'prom. /300',
      statBest300: 'mejor /300',
      statScopeDailyHub: 'Desafío Diario · 3 juegos /300',
      resetStats: 'Reiniciar estadísticas',
      badgesScope: '{u} de {t} logros desbloqueados · guardados en este dispositivo',
      achUnlockedKicker: 'Logro desbloqueado',
      statRuns: 'partidas',
      statAvg: 'promedio',
      statBest: 'récord',
      statPerfect: 'perfectas',
      statPlayed: 'jugadas',
      statWins: 'victorias',
      statStreak: 'racha',
      statSolved: 'acertados',
      statStreamsBest: 'récord streams',
      statYearBest: 'récord año',
      statBestStreak: 'mejor racha',
      statWinRate: '% victorias',
      statDuels: 'duelos',
      statScopeDaily: 'Desafío Diario · todos los días guardados',
      statScopeDuel: 'Duelo Musical · Streams de Spotify y Año',
      statScopeArtist: 'Detective de Artistas · Top 530',
      statScopeMini: '5 minijuegos libres y del Desafío Diario',
      statScopeAllClassic: 'Todos los filtros Clásico',
      // Custom Modal
      customTitle: 'Elegir artista',
      customSub: 'Jugar con un artista',
      customHint: 'Elige un artista — seleccionamos 5 de sus canciones.',
      customPhInput: 'Buscar cualquier artista…',
      recentArtists: 'Artistas recientes',
      popularArtists: 'Artistas populares',
      clearBtn: 'Limpiar',
      surpriseMe: '✦ Sorpréndeme',
      refreshBtn: '↻ Actualizar',
      // Result / Run / Leave / Feedback / Challenge
      nextBtn: 'Siguiente',
      dailyResultBtn: 'Resultado diario',
      seeResultBtn: 'Ver resultado',
      dailyBadgePill: 'Desafío Diario · 1 canción',
      friendBadgePill: 'Reto de Amigo · 1 canción',
      friendChallengeTag: 'Reto de Amigo',
      customTag: 'Personalizado',
      verdictDailyWon: '¡Diario resuelto!',
      verdictDailyLost: 'Nueva canción mañana.',
      verdictZero: 'Cero. ¡Inténtalo otra vez!',
      verdictOne: 'Uno menos.',
      verdictNotBad: 'Nada mal.',
      verdictNice: '¡Buena partida!',
      verdictClose: '¡Casi perfecto!',
      verdictPerfectSongs: '¡Perfecto! ¡Todas las canciones!',
      verdictPerfectStages: '¡Perfecto! Todas las rondas.',
      verdictToughPlaylist: '¡Playlist difícil!',
      scoreUnitSong: 'canción',
      scoreUnitSongs: 'canciones',
      scoreUnitStage: 'ronda',
      scoreUnitStages: 'rondas',
      todaysSong: 'Canción de hoy',
      songNum: 'Canción {n}',
      notPlayed: 'Sin jugar',
      browserPausedAudio: 'Tu navegador pausó el audio. Pulsa Play para escuchar.',
      loadingSong: 'Cargando canción…',
      dailyResultStreak: 'Racha {cur} · Récord {best} · Próximo diario en {rem}',
      dailyCommunityStat: 'Hoy · {pct}% acertó · prom. {avg} intentos',
      dailyCommunityZero: 'Hoy · 0% acertó',
      dcFasterThan: 'Más rápido que el {pct}% de jugadores',
      dcFastestFirst: '#1 más rápido hoy · 1er intento{clip}',
      dcMatchedPace: 'Al ritmo de hoy · {n} intentos',
      dcToughMissed: 'El {pct}% de jugadores también falló',
      dcBadgeWin: 'Tú: {you} · prom. {avg}',
      dcBadgeLose: 'Tú: X · prom. {avg}',
      dcBadgeZero: '0% acertó',
      dcSubSongWin: '{pct}% acertó · {samePct}% en {tryLabel}',
      dcSubSongAvg: '{pct}% acertó · prom. {avg} intentos',
      dcSubSongZero: '0% de jugadores acertó hoy hasta ahora',
      dcSubArtistWin: '{pct}% acertó · {samePct}% en {tryLabel}',
      dcSubArtistAvg: '{pct}% acertó · prom. {avg} intentos',
      dcSubArtistZero: '0% de jugadores acertó hoy hasta ahora',
      quickPresets: 'Playlists rápidas',
      refreshPresets: 'Cambiar',
      presetIndo: 'Pop Indonesio',
      presetKpop: 'K-Pop',
      presetAnime: 'Anime',
      presetThrowback: '2000s',
      presetY10s: 'Éxitos 2010s',
      presetY90s: 'Éxitos 90s',
      presetY20s: 'Pop 2020s',
      presetRock: 'Éxitos Rock',
      presetHiphop: 'Hip-Hop',
      presetRnb: 'R&B y Soul',
      presetIndie: 'Indie Chill',
      presetEdm: 'EDM y Dance',
      duelVerdictWon: '¡Ganaste el duelo!',
      duelVerdictTie: '¡Duelo empatado!',
      duelVerdictLost: 'Tu amigo gana esta ronda',
      duelVerdictBest: '¡Nuevo récord personal!',
      duelVerdictFire: '¡Imparable!',
      duelVerdictGood: '¡Buena racha!',
      duelFinalBest: 'récord {n}',
      duelSummaryMore: '{b} ({bm}) tiene más streams en Spotify que {a} ({am}).',
      duelSummaryFewer: '{b} ({bm}) tiene menos streams en Spotify que {a} ({am}).',
      duelSummaryAfter: '{b} ({bm}) salió después que {a} ({am}).',
      duelSummaryBefore: '{b} ({bm}) salió antes que {a} ({am}).',
      duelFriendPrefix: 'Duelo con Amigo · ',
      duelStartLbl: 'Inicio',
      duelRoundNum: 'Ronda {n}',
      chInvalidLink: 'Este enlace de reto no es válido o usa una versión antigua. Pídele a tu amigo un enlace nuevo.',
      chArtistTitle: 'Reto de artista misterioso',
      chArtistRules: 'El mismo artista misterioso. Hasta 10 intentos.<br>¡Usa las 6 pistas (Debut, Tipo, Género, Estilo, País, Ranking) para resolverlo antes!',
      chArtistRulesInvalid: 'Reto de deducción de artista.<br>Pídele a tu amigo un enlace de reto válido.',
      chArtistMsgWon: 'Tu amigo adivinó este Artista Misterioso en {n} {unit}. ¿Puedes superarlo?',
      chArtistMsgLost: 'Tu amigo no pudo adivinar este Artista Misterioso. ¿Puedes lograrlo?',
      chDuelAccept: 'Aceptar duelo',
      chDuelTitle: 'Duelo con amigo',
      chDuelRules: 'Exactamente la misma secuencia de canciones que tu amigo.<br>¡Supera su puntaje de {n} para ganar!',
      chDuelRulesInvalid: 'Duelo musical cara a cara.<br>Pídele a tu amigo un enlace de duelo válido.',
      chDuelMsg: 'Tu amigo logró {n} en Duelo de {deck}. ¿Puedes superarlo?',
      chSongKicker: 'Reto Musical',
      chFriendTitle: 'Reto de amigo',
      chRunRules: '{n} {unit}. Cinco intentos cada una. Mismas grabaciones y duración:<br>0,1s → 0,5s → 2s → 8s → 15s.',
      chSongRules: 'Una canción. Cinco intentos. Misma grabación y duración:<br>0,1s → 0,5s → 2s → 8s → 15s.',
      chRunMsg: 'Tu amigo logró {desc}. ¿Puedes superarlo?',
      chSongMsg: 'Tu amigo {desc}. ¿Puedes superarlo?',
      playAgain: 'Jugar de nuevo',
      backToMenu: 'Volver al menú',
      listenFull: 'Escuchar completa ↗',
      reportSong: 'Reportar esta canción',
      leaveTitle: '¿Salir de esta playlist?',
      leaveKeep: 'Seguir jugando',
      leaveFinish: 'Terminar y ver resultado',
      leaveExit: 'Salir al menú',
      feedbackTitle: 'Enviar comentarios',
      feedbackIntro: 'Errores, peticiones de canciones o ideas — leemos cada mensaje.',
      fbIssueLbl: 'Problema',
      fbCategoryLbl: 'Categoría',
      fbCatBug: 'Reportar un error',
      fbCatSong: 'Sugerir una canción',
      fbCatOther: 'Otros comentarios',
      fbMsgLbl: 'Mensaje',
      fbMsgPh: '¿Qué pasó o qué te gustaría ver?',
      fbEmailLbl: 'Correo',
      fbEmailOpt: '(opcional, si quieres respuesta)',
      fbDetailsLbl: 'Detalles del juego',
      fbDetailsOpt: '(opcional)',
      fbDetailsPh: 'Modo, canción o dispositivo',
      fbNote: 'Tu mensaje y detalles se envían en privado al creador del sitio.',
      sendFeedback: 'Enviar comentarios',
      acceptChallenge: 'Aceptar reto',
      playRegular: 'Jugar Clásico',
      playClassic: 'Jugar Clásico',
      // Guide & FAQ
      guideTitle: 'Elige tu música',
      guideIntro: 'Algunos accesos rápidos para tu próxima partida Clásica.',
      guideGenres: 'Géneros',
      guideEras: 'Épocas',
      guideNote: 'Los accesos de género incluyen todas las épocas; los de época incluyen todos los géneros. Combina ambos con los filtros de arriba.',
      aboutTitle: 'Sobre el juego',
      aboutP1: 'TuneUp reúne juegos musicales rápidos directo en tu navegador. Pon a prueba tu oído con clips de 0,1 s a 15 s en modo Diario, Clásico, Artista y Playlists (Spotify, Apple Music, YouTube), compara éxitos en Duelo Musical o descubre 530 artistas globales con 6 pistas en Detective de Artistas.',
      aboutP2: 'Juega gratis, cuando quieras.',
      faqTitle: 'Información útil',
      faqQ1: '¿Necesito una cuenta?',
      faqA1: 'No hace falta registrarse. Abre el juego en tu celular o computadora y elige un modo, o pega el enlace de cualquier playlist pública de Spotify, Apple Music o YouTube para jugar con tus canciones.',
      faqQ2: '¿Qué puedo volver a jugar?',
      faqA2: 'Clásico, Por Artista, Playlists, Duelo Musical, Detective de Artistas y los 5 minijuegos se pueden jugar todas las veces que quieras. El Desafío Diario se renueva una vez al día.',
      faqQ3: '¿Cuándo sale el próximo Diario?',
      faqA3: 'A las 7:00 a. m. en la hora local de tu dispositivo. Las victorias diarias seguidas aumentan tu racha; un día perdido la reinicia.',
      faqQ4: '¿Puedo retar a un amigo?',
      faqA4: 'Sí. Al terminar cualquier canción, partida de 5 rondas, Duelo Musical, Detective de Artistas o minijuego, pulsa Retar a un amigo para copiar un enlace sin spoilers con exactamente las mismas canciones o artista.',
      faqQ5: '¿Dónde se guarda mi progreso?',
      faqA5: 'Tu progreso diario, rachas, estadísticas, logros y ajustes se guardan en este navegador. Abre Ajustes → Respaldo y transferencia para copiar tu código y restaurarlo en otro navegador o dispositivo.',
      backToTop: 'Volver arriba',
      modeLinkDaily: 'Desafío Diario',
      modeLinkClassic: 'Clásico',
      modeLinkArtist: 'Por Artista',
      modeLinkSpotify: 'Quiz de Playlist',
      modeLinkDuel: 'Duelo Musical',
      modeLinkDetective: 'Detective de Artistas',
      modeLinkLang: 'English',
      // Playlist / Dynamic strings
      allSongs: 'Todas las canciones',
      nSongs: '{n} canciones',
      nSong: '{n} canción',
      loadingPlaylist: 'Cargando canciones de la playlist…',
      playlistNeedLink: 'Pega primero un enlace de playlist de Spotify, Apple Music o YouTube.',
      playlistBadLink: 'Pega un enlace válido de playlist de Spotify, Apple Music o YouTube.',
      playlistNoTracks: 'No se encontraron pistas reproducibles. Asegúrate de que la playlist sea pública.',
      playlistUnreachable: 'No se pudo conectar con el servicio de playlists ahora. Inténtalo de nuevo.',
      // Badges
      badge_firstwin_name: 'Primera Nota',
      badge_firstwin_desc: 'Adivina tu primera canción en cualquier modo',
      badge_sniper_name: 'Francotirador 0,1 s',
      badge_sniper_desc: 'Adivina una canción en el primer clip de 0,1 s',
      badge_clutch_name: 'Último Segundo',
      badge_clutch_desc: 'Acierta una canción en el 5.º y último clip de 15 s',
      badge_impossible_name: 'Oído de Acero',
      badge_impossible_desc: 'Supera la Ronda 5 (Imposible) en Clásico',
      badge_sweep_name: 'Barrida Perfecta',
      badge_sweep_desc: 'Logra 5/5 en una partida Clásica o de Artista',
      badge_streak10_name: 'Racha Ardiente',
      badge_streak10_desc: 'Consigue una racha de 10 canciones en Clásico',
      badge_veteran_name: 'Coleccionista',
      badge_veteran_desc: 'Completa 10 partidas en modo Clásico',
      badge_playlist_name: 'Modo DJ',
      badge_playlist_desc: 'Completa un quiz de playlist de Spotify, Apple Music o YouTube',
      badge_daily3_name: 'Habitual Diario',
      badge_daily3_desc: 'Alcanza una racha diaria de 3 días',
      badge_daily7_name: 'Guerrero Semanal',
      badge_daily7_desc: 'Alcanza una racha diaria de 7 días',
      badge_duel10_name: 'As del Duelo',
      badge_duel10_desc: 'Logra 10+ puntos en una partida de Duelo Musical',
      badge_duel20_name: 'Leyenda de Listas',
      badge_duel20_desc: 'Logra 20+ puntos en una partida de Duelo Musical',
      badge_detective_name: 'Detective Agudo',
      badge_detective_desc: 'Resuelve Detective de Artistas en 3 intentos o menos',
      badge_artist1_name: 'Vidente al 1er Intento',
      badge_artist1_desc: 'Resuelve Detective de Artistas en tu primer intento',
      badge_dailyartist3_name: 'Sabueso Diario',
      badge_dailyartist3_desc: 'Alcanza una racha de 3 días en Artista Diario',
      badge_explorer_name: 'Todoterreno',
      badge_explorer_desc: 'Juega Clásico, Diario, Duelo y Detective de Artistas',
      badge_dailyhub1_name: 'Giro Diario',
      badge_dailyhub1_desc: 'Completa tu primer Desafío Diario de 3 juegos',
      badge_daily250_name: 'Gran Jugador',
      badge_daily250_desc: 'Logra 250+ / 300 en un Desafío Diario',
      badge_daily300_name: '300 Impecable',
      badge_daily300_desc: 'Logra un perfecto 300 / 300 en un Desafío Diario',
      badge_cover1_name: 'Ojo de Halcón',
      badge_cover1_desc: 'Adivina un álbum al 1er intento en Cover Pixel',
      badge_mv1_name: 'Cinéfilo Musical',
      badge_mv1_desc: 'Adivina la canción en el Frame 1 de MV Frame',
      badge_hair1_name: 'Estilista',
      badge_hair1_desc: 'Adivina al músico al 1er intento en Hair Peek',
      badge_fact10_name: 'Verificador',
      badge_fact10_desc: 'Alcanza una racha de 10+ en Dato o Mito',
      badge_lyric1_name: 'Sabio de Letras',
      badge_lyric1_desc: 'Adivina la canción con el 1er verso en Adivina la Letra',
      // Result verdicts, streaks & toasts
      verdict1: 'a la primera',
      verdict2: 'clavado',
      verdict3: 'lo lograste',
      verdict4: 'a salvo',
      verdict5: 'último intento',
      verdictItWas: 'era',
      guessedIn: '¡Adivinada en {len}!',
      lostBadge: '¡Perdiste!',
      songStreak: 'racha de {n}',
      customStreak: 'racha personalizada {n}',
      newBestTag: ' · ¡Nuevo récord!',
      bestTag: ' · Récord {n}',
      loadingBtn: 'Cargando…',
      plMultiMix: '{c} playlists + {t} canciones detectadas — se combinarán todas',
      plMulti: '{c} playlists detectadas — se combinarán todas las canciones',
      plOnePlusTracks: 'Playlist + {t} enlaces detectados — se unirán sin duplicados',
      plTracksReady: '{t} {unit} de Spotify detectadas — listo para jugar',
      toastPreviewUnavailable: 'Vista previa no disponible para esta pista.',
      toastPreviewError: 'No se pudo reproducir la vista previa.',
      toastAutoplayOn: 'Auto-reproducción al revelar activada',
      toastAutoplayOff: 'Auto-reproducción al revelar desactivada',
      toastSfxOn: 'Efectos de sonido activados',
      toastSfxOff: 'Efectos de sonido desactivados',
      toastHoverOn: 'Reproducir al pasar activado',
      toastHoverOff: 'Reproducir al pasar desactivado',
      toastHoverOffHint: 'Reproducir al pasar desactivado — pulsa ▶ para escuchar',
      toastBackupCopied: '¡Código de respaldo copiado!',
      toastBackupManual: 'Código generado arriba — selecciónalo y cópialo manualmente.',
      toastRestored: '¡Progreso restaurado!',
      toastAllReset: 'Todos los datos borrados',
      toastCantShare: 'Esta grabación no se puede compartir ahora. Prueba otra canción.',
      toastStatsReset: 'Estadísticas reiniciadas',
      toastCopiedFriend: 'Enlace de reto copiado — envíaselo a un amigo',
      toastCopyFailed: 'Error al copiar',
      toastCardSaved: '¡Tarjeta guardada!',
      toastCardShared: '¡Tarjeta compartida!',
      toastCardFailed: 'No se pudo guardar la tarjeta.',
      toastDuelNotEnough: 'No hay suficientes canciones para Duelo Musical.',
      toastDuelFailed: 'No se pudo iniciar Duelo Musical.',
      toastAudioUnavailable: 'Vista previa de audio no disponible ahora.',
      toastAudioFailed: 'No se pudo reproducir la vista previa.',
      toastAlreadyGuessed: 'Ya probaste con {name}',
      toastRosterUnavailable: 'Lista de artistas no disponible.',
      toastPickArtist: 'Elige un artista de la lista desplegable',
      recentPlaylists: 'Playlists recientes',
      toastRecentPlaylistsCleared: 'Playlists recientes borradas',
      fbReportTitle: 'Reportar esta canción',
      fbReportIntro: 'Elige qué ocurre con esta pista. Los datos de grabación se adjuntan automáticamente.',
      fbNotesOpt: 'Notas (opcional)',
      fbTopicKicker: 'Tema',
      fbReasonKicker: '¿Qué salió mal?',
      fbCatBugPill: 'Error',
      fbCatSongPill: 'Pedir canción',
      fbCatIdeaPill: 'Idea',
      fbReasonAudioPill: 'Sin audio',
      fbReasonLivePill: 'Versión en vivo',
      fbReasonTitlePill: 'Info incorrecta',
      fbReasonOtherPill: 'Otro problema',
      fbBugPh: '¿Qué pasó? Cuéntanos qué estabas jugando…',
      fbSongPh: 'Escribe el título y artista que te gustaría ver…',
      fbIdeaPh: 'Comparte una idea o algo que podamos mejorar…',
      fbReportPh: 'Notas opcionales sobre el audio o los datos de la canción…',
      fbPrivacyNote: 'Privado para TuneUp',
      fbEmailToggle: 'Añadir correo para respuesta (opcional)',
      fbPickReason: 'Por favor elige qué ocurre con esta canción.',
      fbSending: 'Enviando…',
      fbSendingNote: 'Enviando tus comentarios…',
      fbSent: '¡Gracias! Tus comentarios fueron enviados.',
      fbSendFail: 'No se pudo enviar. Tu mensaje sigue aquí — inténtalo de nuevo.',
      fbUnavailable: 'Los comentarios no están disponibles temporalmente. Intenta más tarde.',
      dailyChalTitle: 'Reto Canción del Día',
      dailyChalRules: 'Una canción. Cinco intentos. Misma duración de clips:<br>0,1s → 0,5s → 2s → 8s → 15s.',
      dailyChalFriendWon: 'Tu amigo resolvió la Canción del Día de hoy en {len} ({n}/5 intentos). ¿Puedes superarlo?',
      dailyChalFriendMissed: 'Tu amigo no pudo adivinar la Canción del Día de hoy. ¿Puedes lograrlo?',
      dailyChalOldWon: 'Tu amigo resolvió la Canción del Día del {day} en {len}. ¡Prueba la de hoy!',
      dailyChalOldMissed: 'Tu amigo jugó la Canción del Día del {day}. ¡Prueba la de hoy!',
      plChalKicker: 'Quiz de Playlist',
      plChalTitle: 'Reto de playlist',
      plChalRules: '{n} canciones de la misma playlist. Cinco intentos cada una:<br>0,1s → 0,5s → 2s → 8s → 15s.',
      plChalFriendScored: 'Tu amigo logró {s}/{t} en esta playlist. ¿Puedes superarlo?'
    }
  };

  function normalize(lang) {
    return String(lang || '').toLowerCase().startsWith('es') ? 'es' : 'en';
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
    if (!el) return;
    const lbl = typeof el.querySelector === 'function' ? el.querySelector('.lbl') : null;
    (lbl || el).textContent = t(key);
  }

  function setBtnLabelKeepSvg(el, key) {
    if (!el) return;
    const svg = el.querySelector && el.querySelector('svg');
    if (!svg || !el.childNodes) { el.textContent = t(key); return; }
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
    setText($('#dailyHubHeading'), 'dailyHubHeading');
    setText($('#dailyHeading'), 'dailySongHeading');
    setText($('#dailySub') || $('.daily-heading > span'), 'dailySub');
    setText($('#dailyArtistHeading'), 'dailyArtistHeading');
    setText($('#dailyArtistSub'), 'dailyArtistSub');
    setText($('#moreGamesHeading'), 'moreGamesHeading');
    setText($('#moreGamesSub'), 'moreGamesSub');
    setText($('#mgLblCover'), 'mgLblCover');
    setText($('#mgSubCover'), 'mgSubCover');
    setText($('#mgLblMv'), 'mgLblMv');
    setText($('#mgSubMv'), 'mgSubMv');
    setText($('#mgLblHair'), 'mgLblHair');
    setText($('#mgSubHair'), 'mgSubHair');
    setText($('#mgLblFact'), 'mgLblFact');
    setText($('#mgSubFact'), 'mgSubFact');
    setText($('#mgLblLyric'), 'mgLblLyric');
    setText($('#mgSubLyric'), 'mgSubLyric');
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
    setBtnLabelKeepSvg($('#back'), ($('#back') && $('#back').dataset && $('#back').dataset.dailyBack === '1') ? 'backToDaily' : 'changeMode');
    setBtnLabelKeepSvg($('#duelBack'), ($('#duelBack') && $('#duelBack').dataset && $('#duelBack').dataset.dailyBack === '1') ? 'backToDaily' : 'changeMode');
    setBtnLabelKeepSvg($('#artistGameBack'), ($('#artistGameBack') && $('#artistGameBack').dataset && $('#artistGameBack').dataset.dailyBack === '1') ? 'backToDaily' : 'changeMode');
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
    setBtnLabelKeepSvg($('#agShareBtn'), 'challengeFriend');
    setText($('#agNextBtn'), 'nextArtist');
    const legendSpans = doc.querySelectorAll('.ag-legend span');
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
    setText($('#setAnimLbl'), 'setAnimLbl');
    setText($('#setAnimDesc'), 'setAnimDesc');
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
    setText($('#statsTabs [data-tab="overall"]'), 'tabAllClassic');
    setText($('#statsTabs [data-tab="daily"]'), 'tabDaily');
    setText($('#statsTabs [data-tab="duel"]'), 'tabDuel');
    setText($('#statsTabs [data-tab="artist"]'), 'tabArtistStat');
    setText($('#statsTabs [data-tab="mini"]'), 'tabMini');
    setText($('#statsTabs [data-tab="badges"]'), 'tabBadges');
    setText($('#reset'), 'resetStats');

    // Custom modal & result/run/duel/leave/feedback modals
    setText($('#customTitle'), 'customTitle');
    setText($('#customModal .custom-lbl'), 'customSub');
    setText($('#customHint'), 'customHint');
    if ($('#artistQ')) $('#artistQ').placeholder = t('customPhInput');
    setBtnLabelKeepSvg($('#shareStage'), 'challengeFriend');
    setText($('#listen'), 'listenFull');
    setText($('#reportSong'), 'reportSong');
    setText($('#againRun'), 'playAgain');
    setBtnLabelKeepSvg($('#share'), 'challengeFriend');
    setText($('#backToMenu'), 'backToMenu');
    setText($('#duelAgain'), 'playAgain');
    setBtnLabelKeepSvg($('#duelShare'), 'challengeFriend');
    setText($('#duelMenu'), 'backToMenu');
    setText($('#leaveRunTitle'), 'leaveTitle');
    setText($('#leaveKeepPlaying'), 'leaveKeep');
    setText($('#leaveFinishEarly'), 'leaveFinish');
    setText($('#leaveConfirmExit'), 'leaveExit');
    setText($('#feedbackTitle'), 'feedbackTitle');
    setText($('#feedbackIntro'), 'feedbackIntro');
    setText($('#fbTopicKicker'), 'fbTopicKicker');
    setText($('#fbReasonKicker'), 'fbReasonKicker');
    setText($('#feedbackCategoryPills [data-cat="bug"] span'), 'fbCatBugPill');
    setText($('#feedbackCategoryPills [data-cat="song"] span'), 'fbCatSongPill');
    setText($('#feedbackCategoryPills [data-cat="other"] span'), 'fbCatIdeaPill');
    setText($('#feedbackReasonPills [data-reason="audio"]'), 'fbReasonAudioPill');
    setText($('#feedbackReasonPills [data-reason="live"]'), 'fbReasonLivePill');
    setText($('#feedbackReasonPills [data-reason="title"]'), 'fbReasonTitlePill');
    setText($('#feedbackReasonPills [data-reason="other"]'), 'fbReasonOtherPill');
    const fbCat = $('#feedbackCategory');
    if (fbCat && fbCat.options && fbCat.options.length >= 3) {
      fbCat.options[0].textContent = t('fbCatBug');
      fbCat.options[1].textContent = t('fbCatSong');
      fbCat.options[2].textContent = t('fbCatOther');
    }
    setText($('#feedbackMessageLabel'), 'fbMsgLbl');
    if ($('#feedbackMessage')) $('#feedbackMessage').placeholder = t('fbBugPh');
    setText($('#fbPrivacyNote span'), 'fbPrivacyNote');
    setText($('#fbEmailToggleLbl'), 'fbEmailToggle');
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
    const langEn = $('[data-mode-link="lang-en"]');
    const langEs = $('[data-mode-link="lang-es"]');
    if (langEn) {
      if (currentLang === 'en') langEn.setAttribute('aria-current', 'page');
      else langEn.removeAttribute('aria-current');
    }
    if (langEs) {
      if (currentLang === 'es') langEs.setAttribute('aria-current', 'page');
      else langEs.removeAttribute('aria-current');
    }
  }

  const api = { STORAGE_KEY, DICT, load, set, get, t, apply, setBtnLabelKeepSvg };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuneUpI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
