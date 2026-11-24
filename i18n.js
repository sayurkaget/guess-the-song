/* TuneUp — Bilingual EN / ID translation layer (stored in tl:set:lang, backed up by TuneUpBackup). */
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
      mgLblMv: 'MV Spot',
      mgSubMv: 'Music video',
      mgLblHair: 'HairSpot',
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
      tabBadges: 'Achievements',
      scoreSpread: 'Score spread',
      attemptSpread: 'Attempt spread',
      deckComparison: 'Deck comparison',
      guessesToSolve: 'Guesses to solve',
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
      statDuels: 'duels',
      statScopeDaily: 'Daily Challenge · all saved days',
      statScopeDuel: 'Music Duel · Spotify Streams & Release Year',
      statScopeArtist: 'Artist Detective · Top 530 roster',
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
      badge_mv1_desc: 'Guess the song from Frame 1 in MV Spot',
      badge_hair1_name: 'Hair Stylist',
      badge_hair1_desc: 'Guess the musician on Try 1 in HairSpot',
      badge_fact10_name: 'Fact Checker',
      badge_fact10_desc: 'Reach a 10+ streak in Fact or Cap',
      badge_lyric1_name: 'Lyric Savant',
      badge_lyric1_desc: 'Guess the song from Line 1 in Lyric Guess',
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
      acceptChallenge: 'Accept challenge',
      dailyChalTitle: 'Daily Song challenge',
      dailyChalRules: 'One song. Five tries. Same clip lengths:<br>0.1s → 0.5s → 2s → 8s → 15s.',
      dailyChalFriendWon: 'Your friend solved today\'s Daily Song in {len} ({n}/5 tries). Can you beat them?',
      dailyChalFriendMissed: 'Your friend couldn\'t solve today\'s Daily Song. Can you beat it?',
      dailyChalOldWon: 'Your friend solved the {day} Daily Song in {len}. Try today\'s Daily Song!',
      dailyChalOldMissed: 'Your friend played the {day} Daily Song. Try today\'s Daily Song!',
      plChalKicker: 'Playlist Quiz',
      plChalTitle: 'Playlist challenge',
      plChalRules: '{n} songs from the same playlist. Five tries each:<br>0.1s → 0.5s → 2s → 8s → 15s.',
      plChalFriendScored: 'Your friend scored {s}/{t} on this playlist. Can you beat them?'
    },
    id: {
      // Lobby
      dailyHeading: 'Tantangan Harian',
      dailyHubHeading: 'Tantangan Harian',
      dailySongHeading: 'Lagu Harian',
      dailySub: '1 lagu · 5 percobaan',
      moreGamesHeading: 'Game Musik Lainnya',
      moreGamesSub: '7 mode bebas main',
      mgLblCover: 'Cover Pixel',
      mgSubCover: 'Album piksel',
      mgLblMv: 'MV Spot',
      mgSubMv: 'Video klip MV',
      mgLblHair: 'HairSpot',
      mgSubHair: 'Rambut musisi',
      mgLblFact: 'Fakta / Hoax',
      mgSubFact: 'Trivia musik',
      mgLblLyric: 'Tebak Lirik',
      mgSubLyric: '5 baris lirik',
      dailyArtistHeading: 'Artis Harian',
      dailyArtistSub: '1 artis · 10 tebakan',
      dailyWinStreakLbl: 'Streak {n} menang',
      dailyNextSongShort: 'Lagu baru {t}',
      dailyArtistStreakLbl: 'Streak {n} hari',
      dailyArtistNextShort: 'Artis baru {t}',
      dailyArtistTriesSoFar: '{n}/10 tebakan',
      dailyBadgeDone: 'Selesai',
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
      artistPill: 'Tanpa batas',
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
      multiDone: 'Selesai',
      multiSelected: '{n} dipilih',
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
      agTabDaily: 'Artis Harian',
      agTabEndless: 'Tanpa Batas',
      agPlayEndless: 'Main Tanpa Batas',
      agDailyWait: 'Artis Harian berikutnya dalam {t}',
      agDailyMeta: 'Artis Harian · {day}',
      agDailyStreakPill: 'Streak harian {n}',
      artistSubDailyDone: 'Harian {n}/10 · Mode bebas siap',
      artistSubDailyMissed: 'Harian selesai · Mode bebas siap',
      artistSubDailyStreak: 'Harian + Bebas · Streak {n} hari',
      artistSubDailyReady: 'Artis Harian + Bebas · 6 petunjuk',
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
      setAnimLbl: 'Animasi',
      setAnimDesc: 'Konfeti, vinyl berputar & efek halus (tetap aktif walau animasi OS mati)',
      toastAnimOn: 'Animasi aktif',
      toastAnimOff: 'Animasi dimatikan',
      setBackupTitle: 'Cadangkan & pindah data',
      setBackupNote: 'Tanpa akun. Salin kodemu lalu tempel di browser atau perangkat lain untuk memindahkan statistik, streak, pencapaian, & riwayat Harian.',
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
      tabBadges: 'Pencapaian',
      scoreSpread: 'Sebaran skor',
      attemptSpread: 'Sebaran percobaan',
      deckComparison: 'Perbandingan deck',
      guessesToSolve: 'Tebakan untuk menebak',
      resetStats: 'Reset statistik',
      badgesScope: '{u} dari {t} pencapaian terbuka · tersimpan di perangkat ini',
      achUnlockedKicker: 'Pencapaian terbuka',
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
      customSub: 'Mainkan artis',
      customHint: 'Pilih artis — kami pilihkan 5 lagunya.',
      customPhInput: 'Cari nama artis…',
      recentArtists: 'Artis terbaru',
      popularArtists: 'Artis populer',
      clearBtn: 'Hapus',
      surpriseMe: '✦ Acak',
      refreshBtn: '↻ Segarkan',
      // Result / Run / Leave / Feedback / Challenge
      nextBtn: 'Berikutnya',
      dailyResultBtn: 'Hasil Harian',
      seeResultBtn: 'Lihat hasil',
      dailyBadgePill: 'Lagu Harian · 1 lagu',
      friendBadgePill: 'Tantangan Teman · 1 lagu',
      friendChallengeTag: 'Tantangan Teman',
      customTag: 'Kustom',
      verdictDailyWon: 'Lagu Harian tertebak!',
      verdictDailyLost: 'Lagu baru besok.',
      verdictZero: 'Nol. Coba lagi!',
      verdictOne: 'Satu kena.',
      verdictNotBad: 'Lumayan.',
      verdictNice: 'Keren!',
      verdictClose: 'Nyaris sempurna!',
      verdictPerfectSongs: 'Sempurna. Semua lagu!',
      verdictPerfectStages: 'Sempurna. Semua tahap.',
      verdictToughPlaylist: 'Playlist yang menantang!',
      scoreUnitSong: 'lagu',
      scoreUnitSongs: 'lagu',
      scoreUnitStage: 'tahap',
      scoreUnitStages: 'tahap',
      todaysSong: 'Lagu hari ini',
      songNum: 'Lagu {n}',
      notPlayed: 'Belum dimainkan',
      browserPausedAudio: 'Browser menjeda pemutaran. Ketuk Putar untuk mendengarkan.',
      loadingSong: 'Memuat lagu…',
      dailyResultStreak: 'Streak menang {cur} · Terbaik {best} · Harian berikutnya {rem}',
      dailyCommunityStat: 'Hari ini · {pct}% benar · rata-rata {avg}x',
      dailyCommunityZero: 'Hari ini · 0% benar',
      dcFasterThan: 'Lebih cepat dari {pct}% pemain',
      dcFastestFirst: 'Tercepat hari ini · tebakan ke-1{clip}',
      dcMatchedPace: 'Setara rata-rata · {n} percobaan',
      dcToughMissed: '{pct}% pemain lain juga gagal',
      dcBadgeWin: 'Kamu: {you} · rata-rata {avg}',
      dcBadgeLose: 'Kamu: X · rata-rata {avg}',
      dcBadgeZero: '0% berhasil',
      dcSubSongWin: '{pct}% pemain berhasil · {samePct}% di {tryLabel}',
      dcSubSongAvg: '{pct}% pemain berhasil · rata-rata {avg}x',
      dcSubSongZero: 'Belum ada pemain yang berhasil hari ini (0%)',
      dcSubArtistWin: '{pct}% pemain berhasil · {samePct}% dalam {tryLabel}',
      dcSubArtistAvg: '{pct}% pemain berhasil · rata-rata {avg}x',
      dcSubArtistZero: 'Belum ada pemain yang berhasil hari ini (0%)',
      quickPresets: 'Playlist cepat',
      refreshPresets: 'Ganti',
      presetIndo: 'Indo Pop',
      presetKpop: 'K-Pop',
      presetAnime: 'Anime',
      presetThrowback: '2000-an',
      presetY10s: '2010-an',
      presetY90s: '90-an',
      presetY20s: 'Pop 2020-an',
      presetRock: 'Rock Hits',
      presetHiphop: 'Hip-Hop',
      presetRnb: 'R&B & Soul',
      presetIndie: 'Indie',
      presetEdm: 'EDM',
      duelVerdictWon: 'Kamu menang duel!',
      duelVerdictTie: 'Duel seri!',
      duelVerdictLost: 'Temanmu unggul kali ini',
      duelVerdictBest: 'Rekor pribadi baru!',
      duelVerdictFire: 'Luar biasa!',
      duelVerdictGood: 'Permainan bagus!',
      duelFinalBest: 'terbaik {n}',
      duelSummaryMore: '{b} ({bm}) punya Spotify streams lebih banyak dari {a} ({am}).',
      duelSummaryFewer: '{b} ({bm}) punya Spotify streams lebih sedikit dari {a} ({am}).',
      duelSummaryAfter: '{b} ({bm}) rilis lebih baru daripada {a} ({am}).',
      duelSummaryBefore: '{b} ({bm}) rilis lebih lama daripada {a} ({am}).',
      duelFriendPrefix: 'Duel Teman · ',
      duelStartLbl: 'Awal',
      duelRoundNum: 'Ronde {n}',
      chInvalidLink: 'Link tantangan ini tidak valid atau versinya tidak didukung. Minta link baru dari temanmu.',
      chArtistTitle: 'Tantangan artis misterius',
      chArtistRules: 'Artis misterius yang sama. Maksimal 10 tebakan.<br>Pakai 6 petunjuk (Debut, Tipe, Gender, Genre, Negara, Peringkat) untuk menebak lebih cepat!',
      chArtistRulesInvalid: 'Tantangan tebak artis misterius.<br>Minta link tantangan yang valid dari temanmu.',
      chArtistMsgWon: 'Temanmu menebak Artis Misterius ini dalam {n} percobaan. Bisa kalahkan?',
      chArtistMsgLost: 'Temanmu gagal menebak Artis Misterius ini. Bisa kamu pecahkan?',
      chDuelAccept: 'Terima duel',
      chDuelTitle: 'Duel teman',
      chDuelRules: 'Urutan lagu persis sama dengan temanmu.<br>Kalahkan skor {n} untuk menang!',
      chDuelRulesInvalid: 'Duel musik head-to-head.<br>Minta link duel yang valid dari temanmu.',
      chDuelMsg: 'Temanmu meraih skor {n} di Duel {deck}. Bisa kalahkan?',
      chSongKicker: 'Tantangan Lagu',
      chFriendTitle: 'Tantangan teman',
      chRunRules: '{n} lagu. Lima kesempatan per lagu. Rekaman & durasi klip sama:<br>0,1d → 0,5d → 2d → 8d → 15d.',
      chSongRules: 'Satu lagu. Lima kesempatan. Rekaman & durasi klip sama:<br>0,1d → 0,5d → 2d → 8d → 15d.',
      chRunMsg: 'Temanmu meraih skor {desc}. Bisa kalahkan?',
      chSongMsg: 'Skor temanmu: {desc}. Bisa kalahkan?',
      playAgain: 'Main lagi',
      backToMenu: 'Kembali ke menu',
      listenFull: 'Dengar penuh ↗',
      reportSong: 'Laporkan lagu ini',
      leaveTitle: 'Tinggalkan playlist ini?',
      leaveKeep: 'Lanjut main',
      leaveFinish: 'Selesai & lihat hasil',
      leaveExit: 'Keluar ke menu',
      feedbackTitle: 'Kirim masukan',
      feedbackIntro: 'Bug, request lagu, atau ide — semua catatan kamu kami baca.',
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
      playRegular: 'Main Classic',
      playClassic: 'Main Classic',
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
      faqA5: 'Progres Harian, streak, statistik, pencapaian, dan pengaturan tersimpan di browser ini. Buka Pengaturan → Cadangkan & pindah data untuk menyalin kode backup dan memulihkannya di browser atau perangkat lain.',
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
      badge_firstwin_name: 'Nada Pertama',
      badge_firstwin_desc: 'Tebak lagu pertamamu dengan benar di mode apa saja',
      badge_sniper_name: 'Sniper 0,1 dtk',
      badge_sniper_desc: 'Tebak lagu tepat pada klip pertama 0,1 detik',
      badge_clutch_name: 'Detik Terakhir',
      badge_clutch_desc: 'Tebak benar tepat di kesempatan ke-5 (klip 15 detik)',
      badge_impossible_name: 'Telinga Baja',
      badge_impossible_desc: 'Taklukkan Tahap 5 (Impossible) di mode Classic',
      badge_sweep_name: 'Sapu Bersih',
      badge_sweep_desc: 'Raih skor 5/5 di ronde Classic atau Artis',
      badge_streak10_name: 'On Fire',
      badge_streak10_desc: 'Capai streak 10 lagu berturut-turut di Classic',
      badge_veteran_name: 'Kolektor Musik',
      badge_veteran_desc: 'Selesaikan 10 sesi penuh di mode Classic',
      badge_playlist_name: 'Mode DJ',
      badge_playlist_desc: 'Selesaikan kuis Playlist Spotify, Apple Music, atau YouTube',
      badge_daily3_name: 'Rutin Harian',
      badge_daily3_desc: 'Capai streak 3 hari di Tantangan Harian',
      badge_daily7_name: 'Pejuang Seminggu',
      badge_daily7_desc: 'Capai streak 7 hari di Tantangan Harian',
      badge_duel10_name: 'Jagoan Duel',
      badge_duel10_desc: 'Raih skor 10+ dalam satu sesi Music Duel',
      badge_duel20_name: 'Legenda Tangga Lagu',
      badge_duel20_desc: 'Raih skor 20+ dalam satu sesi Music Duel',
      badge_detective_name: 'Detektif Tajam',
      badge_detective_desc: 'Tebak Artist Detective dalam 3 percobaan atau kurang',
      badge_artist1_name: 'Indra Keenam',
      badge_artist1_desc: 'Tebak Artist Detective langsung di percobaan pertama',
      badge_dailyartist3_name: 'Detektif Harian',
      badge_dailyartist3_desc: 'Capai streak 3 hari di Artis Harian',
      badge_explorer_name: 'Serba Bisa',
      badge_explorer_desc: 'Mainkan Classic, Harian, Duel & Artist Detective',
      badge_dailyhub1_name: 'Pemutar Harian',
      badge_dailyhub1_desc: 'Selesaikan Tantangan Harian 3 game pertamamu',
      badge_daily250_name: 'Skor Tinggi',
      badge_daily250_desc: 'Raih skor 250+ / 300 di Tantangan Harian',
      badge_daily300_name: 'Sempurna 300',
      badge_daily300_desc: 'Raih skor sempurna 300 / 300 di Tantangan Harian',
      badge_cover1_name: 'Mata Piksel',
      badge_cover1_desc: 'Tebak album tepat pada percobaan ke-1 di Cover Pixel',
      badge_mv1_name: 'Penggemar MV',
      badge_mv1_desc: 'Tebak lagu dari Frame 1 di MV Spot',
      badge_hair1_name: 'Penata Rambut',
      badge_hair1_desc: 'Tebak musisi tepat pada percobaan ke-1 di HairSpot',
      badge_fact10_name: 'Cek Fakta',
      badge_fact10_desc: 'Capai streak 10+ di Fakta / Hoax',
      badge_lyric1_name: 'Hafal Lirik',
      badge_lyric1_desc: 'Tebak lagu langsung dari Baris 1 di Tebak Lirik',
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
      toastCopiedFriend: 'Link tantangan disalin — kirim ke temanmu',
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
      fbReportIntro: 'Pilih kendala pada lagu ini. Detail rekaman otomatis dilampirkan.',
      fbNotesOpt: 'Catatan (opsional)',
      fbTopicKicker: 'Topik',
      fbReasonKicker: 'Apa kendalanya?',
      fbCatBugPill: 'Bug',
      fbCatSongPill: 'Request lagu',
      fbCatIdeaPill: 'Ide',
      fbReasonAudioPill: 'Audio mati',
      fbReasonLivePill: 'Versi live',
      fbReasonTitlePill: 'Info salah',
      fbReasonOtherPill: 'Lainnya',
      fbBugPh: 'Apa yang terjadi? Ceritakan mode yang sedang kamu mainkan…',
      fbSongPh: 'Tulis judul lagu & nama artis yang ingin kamu tambahkan…',
      fbIdeaPh: 'Bagikan ide fitur atau hal yang bisa kami tingkatkan…',
      fbReportPh: 'Catatan tambahan soal audio atau judul lagu (opsional)…',
      fbPrivacyNote: 'Privat untuk TuneUp',
      fbEmailToggle: 'Tambah email untuk balasan (opsional)',
      fbPickReason: 'Pilih dulu kendala pada lagu ini.',
      fbSending: 'Mengirim…',
      fbSendingNote: 'Mengirim masukanmu…',
      fbSent: 'Makasih! Masukanmu sudah terkirim.',
      fbSendFail: 'Gagal mengirim masukan. Pesanmu masih aman — silakan coba lagi.',
      fbUnavailable: 'Masukan sementara tidak tersedia. Silakan coba lagi nanti.',
      acceptChallenge: 'Terima tantangan',
      dailyChalTitle: 'Tantangan Lagu Harian',
      dailyChalRules: 'Satu lagu. Lima kesempatan. Durasi klip sama:<br>0,1d → 0,5d → 2d → 8d → 15d.',
      dailyChalFriendWon: 'Temanmu menebak Lagu Harian hari ini dalam {len} ({n}/5 percobaan). Bisa kalahkan?',
      dailyChalFriendMissed: 'Temanmu gagal menebak Lagu Harian hari ini. Kamu bisa?',
      dailyChalOldWon: 'Temanmu menebak Lagu Harian {day} dalam {len}. Coba Lagu Harian hari ini!',
      dailyChalOldMissed: 'Temanmu memainkan Lagu Harian {day}. Coba Lagu Harian hari ini!',
      plChalKicker: 'Kuis Playlist',
      plChalTitle: 'Tantangan Playlist',
      plChalRules: '{n} lagu dari playlist yang sama. Lima kesempatan per lagu:<br>0,1d → 0,5d → 2d → 8d → 15d.',
      plChalFriendScored: 'Temanmu meraih {s}/{t} di playlist ini. Bisa kalahkan?'
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
    if (!el) return;
    const lbl = typeof el.querySelector === 'function' ? el.querySelector('.lbl') : null;
    (lbl || el).textContent = t(key);
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
    setBtnLabelKeepSvg($('#agShareBtn'), 'challengeFriend');
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
    const langId = $('[data-mode-link="lang-id"]');
    if (langEn) {
      if (currentLang === 'en') langEn.setAttribute('aria-current', 'page');
      else langEn.removeAttribute('aria-current');
    }
    if (langId) {
      if (currentLang === 'id') langId.setAttribute('aria-current', 'page');
      else langId.removeAttribute('aria-current');
    }
  }

  const api = { STORAGE_KEY, DICT, load, set, get, t, apply };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuneUpI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
