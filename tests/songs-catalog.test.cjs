const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { isStudio } = require('../recordings.js');

const root = path.join(__dirname, '..');

function loadSongs() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'songs.js'), 'utf8'), ctx);
  return ctx.window.SONGS;
}

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/['’ʼ`´]/g, '').replace(/\$/g, 's').replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function strictCanon(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[([]\s*(?:feat\.?|ft\.?|featuring|with)\s+[^)\]]*[)\]]/gi, ' ')
    .replace(/\s+(?:feat\.?|ft\.?|featuring)\s+.*$/i, ' ')
    .replace(/[([]\s*(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?(?:\s+version)?\s*[)\]]/gi, ' ')
    .replace(/\s*[-–—]\s*(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?(?:\s+version)?\s*$/i, ' ')
    .replace(/[([]\s*(?:bonus track|single version|radio edit|album version|extended version|deluxe version)\s*[)\]]/gi, ' ')
    .replace(/\s*[-–—]\s*(?:bonus track|single version|radio edit|album version|extended version)\s*$/i, ' ')
    .replace(/['’ʼ`´]/g, '').replace(/\$/g, 's').replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function setupApp(results = []) {
  const noop = () => {};
  const node = () => ({
    hidden: true, disabled: false, textContent: '', innerHTML: '',
    style: {}, dataset: {},
    classList: { add: noop, remove: noop, toggle: noop },
    setAttribute: noop, appendChild: noop
  });
  const ctx = vm.createContext({
    window: { SONGS: [] },
    console, AbortSignal, Map, Math, Date,
    Audio: class extends EventTarget { readyState = 0; pause() {} load() {} },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    document: { querySelector: node, querySelectorAll: () => [], addEventListener: noop, body: { dataset: {}, removeAttribute: noop }, createElement: node },
    fetch: async () => ({ ok: true, text: async () => JSON.stringify({ results }) })
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'recordings.js'), 'utf8'), ctx);
  const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8')
    .split('  /* ================= event ================= */')[0];
  vm.runInContext(src + '\nglobalThis.test={S,sameRecording,pickSong,fetchArtistSongs};})();', ctx);
  return ctx.test;
}

test('catalog passes recording policy and has no artist splits, duplicate trackIds, or same-artist canonical dupes', () => {
  const SONGS = loadSongs();
  assert.ok(SONGS.length > 30000);

  const artistForms = new Map();
  const trackIds = new Set();
  const canonKeys = new Map();

  for (let i = 0; i < SONGS.length; i++) {
    const s = SONGS[i];
    assert.ok(Array.isArray(s) && s.length >= 7, `invalid row #${i}`);
    assert.ok(typeof s[0] === 'string' && s[0].length > 0, `empty title #${i}`);
    assert.ok(typeof s[1] === 'string' && s[1].length > 0, `empty artist #${i}`);
    assert.ok(s[2] >= 1 && s[2] <= 5, `bad tier #${i}`);
    assert.ok(isStudio({ title: s[0] }), `non-studio/skit row slipped into songs.js: #${i} ${s[1]} - ${s[0]}`);

    const na = norm(s[1]);
    if (!artistForms.has(na)) artistForms.set(na, new Set());
    artistForms.get(na).add(s[1]);

    if (s[7]) {
      const id = String(s[7]);
      assert.equal(trackIds.has(id), false, `duplicate trackId ${id}: #${i}`);
      trackIds.add(id);
    }

    const ck = na + '||' + strictCanon(s[0]);
    assert.equal(canonKeys.has(ck), false, `same-artist duplicate "${ck}": #${canonKeys.get(ck)} vs #${i} ("${s[0]}")`);
    canonKeys.set(ck, i);
  }

  for (const [na, set] of artistForms) {
    assert.equal(set.size, 1, `artist spelling split for ${na}: ${[...set].join(', ')}`);
  }
});

test('catalog contains no known collab doubles or Nelly/Simon metadata regressions', () => {
  const SONGS = loadSongs();
  const has = (artist, title) => SONGS.some((s) => s[1] === artist && s[0] === title);
  const countByNormTitle = (target) => SONGS.filter((s) => norm(s[0]) === target).length;

  assert.equal(has('Rihanna', 'We Found Love'), true);
  assert.equal(has('Calvin Harris', 'We Found Love'), false);
  assert.equal(has('Silk Sonic', 'Leave the Door Open'), true);
  assert.equal(has('Bruno Mars', 'Leave the Door Open'), false);
  assert.equal(has('Silk Sonic', 'Smokin Out the Window'), true);
  assert.equal(has('Bruno Mars', 'Smokin Out The Window'), false);
  assert.equal(has('Camila Cabello', 'Señorita'), true);
  assert.equal(has('Shawn Mendes', 'Senorita'), false);
  assert.equal(has('The Kid LAROI', 'STAY'), true);
  assert.equal(has('Justin Bieber', 'STAY'), false);
  assert.equal(has('Ariana Grande', 'Bang Bang'), true);
  assert.equal(has('Jessie J', 'Bang Bang'), false);
  assert.equal(has('Billie Eilish', 'bad guy'), true);
  assert.equal(has('Justin Bieber', 'bad guy'), false);
  assert.equal(has('Maroon 5', 'Beautiful Mistakes'), true);
  assert.equal(has('Megan Thee Stallion', 'Beautiful Mistakes'), false);
  assert.equal(has('Galantis', 'Heartbreak Anthem (feat. David Guetta & Little Mix)'), true);
  assert.equal(has('Little Mix', 'Heartbreak Anthem'), false);
  assert.equal(has('Tiesto', 'Hot In It (feat. Charli xcx)'), true);
  assert.equal(has('Charli XCX', 'Hot In It'), false);
  assert.equal(has('Eurythmics', "Sisters Are Doin' It for Themselves"), true);
  assert.equal(has('Eurythmics', 'Sisters Are Doing It for Themselves'), false);
  assert.equal(has('Aretha Franklin', "Sisters Are Doin' It for Themselves"), false);
  assert.equal(has('Michael Buble', 'Quando, Quando, Quando (with Nelly Furtado)'), true);
  assert.equal(has('Nelly Furtado', 'Quando, Quando, Quando'), false);
  assert.equal(has('Kygo', 'Lose Somebody'), true);
  assert.equal(has('OneRepublic', 'Lose Somebody (from One Night In Malibu)'), false);
  assert.equal(has('Amy Winehouse', 'Valerie'), true);
  assert.equal(has('Mark Ronson', 'Valerie'), false);
  assert.equal(has('OneRepublic', 'If I Lose Myself'), true);
  assert.equal(has('Alesso', 'If I Lose Myself'), false);
  assert.equal(has('Zara Larsson', 'Like It Is'), true);
  assert.equal(has('Kygo', 'Like It Is'), false);
  assert.equal(has('Beyonce', 'Baby Boy (feat. Sean Paul)'), true);
  assert.equal(has('Sean Paul', 'Baby Boy (feat. Beyoncé )'), false);
  assert.equal(countByNormTitle('say it right'), 1);
  assert.equal(has('Nelly', 'Say It Right'), false);
  assert.equal(countByNormTitle('maneater'), 1);
  assert.equal(has('Nelly', 'Maneater'), false);
  assert.equal(SONGS.filter((s) => s[1] === 'Simon & Garfunkel' && /sounds? of silence/i.test(s[0])).length, 1);

  const simon = SONGS.find((s) => s[1] === 'Simon & Garfunkel' && s[0] === 'The Sound of Silence');
  assert.ok(simon);
  assert.equal(simon[5], 1964);
});

test('catalog has valid years, clean formatting, high trackId coverage, no homonym impostors, and balanced Easy-Hard tiers', () => {
  const SONGS = loadSongs();
  const has = (artist, title) => SONGS.some((s) => s[1] === artist && s[0] === title);

  let missingTid = 0;
  for (let i = 0; i < SONGS.length; i++) {
    const [title, artist, tier, region, genre, year, art, tid] = SONGS[i];
    assert.ok(Number.isInteger(year) && year >= 1900 && year <= 2026, `invalid year #${i}: ${artist} - ${title} (${year})`);
    assert.equal(/\s{2,}/.test(title), false, `double space #${i}: ${title}`);
    assert.equal(/\bclean version\b|\bre-?record\b/i.test(title), false, `clean/re-record #${i}: ${artist} - ${title}`);
    if (!tid) missingTid++;
  }
  assert.equal(missingTid, 0, `expected 100% trackId coverage, got ${missingTid} missing`);

  const tidOf = (artist, title) => (SONGS.find((s) => s[1] === artist && s[0] === title) || [])[7];
  assert.equal(tidOf('Beyonce', 'All Night'), 1460472034);
  assert.equal(tidOf('Beyonce', 'Pray You Catch Me'), 1460471925);
  assert.equal(tidOf('Steve Lacy', 'Ryd'), 1207820257);
  assert.equal(tidOf('Steve Lacy', 'Looks'), 1207820255);
  assert.equal(tidOf('Steve Lacy', 'Thangs'), 1207820381);
  assert.equal(tidOf('Tiesto', 'Elements Of Life'), 1793818473);
  assert.equal(tidOf('Franz Ferdinand', 'Bite Hard'), 300683358);
  assert.equal(tidOf('Franz Ferdinand', 'What She Came For'), 300683359);
  for (const [artist, title] of [
    ['Hanson', 'Only One'],
    ['Hanson', 'Daze Inn'],
    ['Hanson', 'Numb'],
    ['Jose Gonzalez', '#9 Dream'],
    ['Westlife', "Nothing's Going to Change My Love For You"],
    ['Ludacris', 'Butter.Atl'],
    ['System Of A Down', 'Arto'],
    ['Skrillex', 'Make It Bun Dem'],
    ['Marshmello', 'One Thing Right']
  ]) {
    assert.equal(has(artist, title), false, `expected unplayable/impostor removal: ${artist} - ${title}`);
  }

  // Fixed years, titles, SOAD upgrades, and Louis Armstrong cleanup
  const payTheMan = SONGS.find((s) => s[1] === 'Foster the People' && s[0] === 'Pay the Man');
  assert.equal(payTheMan && payTheMan[5], 2017);
  const ravers = SONGS.find((s) => s[1] === 'Ellie Goulding' && s[0] === 'Ravers');
  assert.equal(ravers && ravers[5], 2026);
  const ymca = SONGS.find((s) => s[1] === 'Village People' && s[0] === 'YMCA');
  assert.equal(ymca && ymca[5], 1978);
  const friday = SONGS.find((s) => s[1] === 'The Cure' && s[0] === "Friday I'm in Love");
  assert.equal(friday && friday[5], 1992);
  assert.equal(has('System Of A Down', 'Sugar'), true);
  assert.equal(has('Louis Armstrong', "Struttin' With Some Barbecue"), true);
  assert.equal(has('Louis Armstrong', "Nobody Knows The Trouble I've Seen"), true);
  assert.equal(has('Louis Armstrong', 'When Your Smiling'), false);

  // Known homonym / impostor removals
  assert.equal(has('Sia', 'Titanium'), false);
  assert.equal(has('Dave', 'Ants Marching'), false);
  assert.equal(has('Dave', 'Raindance'), true);
  assert.equal(has('Prince', 'Corazón Sin Cara'), false);
  assert.equal(has('Prince', 'dopamina'), false);
  assert.equal(has('Queen', 'Medicine'), false);
  assert.equal(has('Lorde', 'Teofagia'), false);
  assert.equal(has('The Marías', 'Spaghetti (We Wish You A Merry Christmas) [feat. DJ Tanny]'), false);
  assert.equal(has('Drowning Pool', 'Black Baghdad'), false);
  assert.equal(has('Lauryn Hill', 'I Gotta Find Peace of Mind'), false);
  assert.equal(has('Lauryn Hill', 'Deus É Fiel'), false);

  // Wave 4 cleanups: non-studio alternates, foreign duplicates, bad years, and promoted hits
  assert.equal(has('Bruno Mars', 'Lo Arriesgo Todo'), false);
  assert.equal(has('Bruno Mars', 'Bonde Do Brunão'), false);
  assert.equal(has('Bruno Mars', 'Risk It All'), true);
  const locked = SONGS.find((s) => s[1] === 'Bruno Mars' && s[0] === 'Locked Out of Heaven');
  assert.equal(locked && locked[2], 1);
  assert.equal(has('Shakira', 'Suerte (Whenever, Wherever)'), false);
  assert.equal(has('Shakira', 'Eyes Like Yours (Ojos Así)'), false);
  assert.equal(has('Shakira', 'Whenever, Wherever'), true);
  assert.equal(has('Nicki Minaj', 'Moment 4 Life (feat. Drake)'), true);
  assert.equal(has('Nicki Minaj', 'Moment 4 Life (feat. Drake) [Edited]'), false);
  assert.equal(has('System Of A Down', "Kill Rock 'n Roll"), true);
  assert.equal(has('System Of A Down', "Kill Rock 'n Roll (Clean)"), false);
  assert.equal(has('John Denver', 'Country Roads, Take Me Home (2024 Mix)'), false);
  assert.equal(has('Britney Spears', 'Chris Cox Megamix'), false);
  const bailando = SONGS.find((s) => s[1] === 'Enrique Iglesias' && s[0].startsWith('Bailando'));
  assert.equal(bailando && bailando[5], 2014);
  const sheep = SONGS.find((s) => s[1] === 'Pink Floyd' && s[0] === 'Sheep');
  assert.equal(sheep && sheep[5], 1977);

  // Tier 1-3 availability across all genre x era buckets
  const genres = ['pop', 'rock', 'hiphop', 'rnb', 'edm', 'indie', 'lain'];
  const eras = {
    old: (y) => y > 0 && y < 2000,
    y00: (y) => y >= 2000 && y < 2010,
    y10: (y) => y >= 2010 && y < 2020,
    y20: (y) => y >= 2020
  };
  for (const g of genres) {
    for (const [ek, hit] of Object.entries(eras)) {
      const sub = SONGS.filter((s) => s[4] === g && hit(s[5]));
      assert.ok(sub.length >= 30, `${g}/${ek} total too small: ${sub.length}`);
      assert.ok(sub.filter((s) => s[2] === 1).length >= 3, `${g}/${ek} missing Tier 1`);
      assert.ok(sub.filter((s) => s[2] <= 2).length >= 7, `${g}/${ek} missing Tier 1-2`);
      assert.ok(sub.filter((s) => s[2] <= 3).length >= 10, `${g}/${ek} missing Tier 1-3`);
      assert.ok(sub.filter((s) => s[2] === 3 || s[2] === 4).length >= 16, `${g}/${ek} Expert [3,4] too small`);
      assert.ok(sub.filter((s) => s[2] === 4 || s[2] === 5).length >= 16, `${g}/${ek} Impossible [4,5] too small`);
    }
  }
  const worthIt = SONGS.find((s) => s[1] === 'Fifth Harmony' && s[0].startsWith('Worth It'));
  assert.equal(worthIt && worthIt[2], 2);
  const babylon = SONGS.find((s) => s[1] === 'Lady Gaga' && s[0] === 'Babylon');
  assert.equal(babylon && babylon[2], 5);

  // Wave 11 studio-only enforcement: remove covers/sessions/live concerts/stripped/outtakes & upgrade classics
  assert.equal(has('Glass Animals', 'Young And Beautiful'), false);
  assert.equal(has('Glass Animals', 'Heart-Shaped Box'), false);
  assert.equal(has('Deftones', 'Drive'), false);
  assert.equal(has('Kodaline', 'Billie Jean'), false);
  assert.equal(has('Nickelback', 'We Will Rock You'), false);
  assert.equal(has('Ozzy Osbourne', 'Mississippi Queen'), false);
  assert.equal(has('T-Pain', 'A Change Is Gonna Come'), false);
  assert.equal(has('George Michael', 'Roxanne'), false);
  assert.equal(has('Natalie Imbruglia', 'Instant Crush'), false);
  assert.equal(has('Mitski', 'Glide (cover)'), false);
  assert.equal(has('Korn', 'Another Brick in the Wall, Pt. 1, 2, 3 (Pink Floyd Cover)'), false);
  assert.equal(has('The Temper Trap', 'Sign of the Times (triple j Like A Version)'), false);
  assert.equal(has('Olivia Dean', "Wish I Didn't Miss You (Mahogany Sessions)"), false);
  assert.equal(has('Daddy Yankee', 'Machucando (En Directo)'), false);
  assert.equal(has('Shakira', 'La Pared (Versión Acústica)'), false);
  assert.equal(has('Rihanna', 'Love the Way You Lie (Piano Version)'), false);
  assert.equal(has('Glass Animals', 'Hazey (Stripped)'), false);
  assert.equal(has('The Strokes', 'Under Cover of Darkness'), true);
  assert.equal(has('Omar Apollo', 'Live For Me'), true);

  const johnWoman = SONGS.find((s) => s[1] === 'John Lennon' && s[0] === 'Woman');
  assert.equal(johnWoman && johnWoman[7], 1440848005);
  const blueMonday = SONGS.find((s) => s[1] === 'New Order' && s[0] === 'Blue Monday');
  assert.equal(blueMonday && blueMonday[7], 1129721527);
  const beautifulLife = SONGS.find((s) => s[1] === 'Lost Frequencies' && s[0] === 'Beautiful Life (feat. Sandro Cavazza)');
  assert.equal(beautifulLife && beautifulLife[7], 1155693600);
});

test('fetchArtistSongs prefers clean studio titles and deduplicates remasters/editions/collab splits', async () => {
  const t = setupApp([
    { wrapperType: 'track', kind: 'song', trackId: 1, trackName: 'Live Forever (2014 Remaster)', artistName: 'Oasis', previewUrl: 'https://x/1.m4a', releaseDate: '1994-08-08' },
    { wrapperType: 'track', kind: 'song', trackId: 2, trackName: 'Live Forever', artistName: 'Oasis', previewUrl: 'https://x/2.m4a', releaseDate: '1994-08-08' },
    { wrapperType: 'track', kind: 'song', trackId: 3, trackName: 'Wonderwall - Radio Edit', artistName: 'Oasis', previewUrl: 'https://x/3.m4a', releaseDate: '1995-10-30' },
    { wrapperType: 'track', kind: 'song', trackId: 4, trackName: 'Wonderwall', artistName: 'Oasis', previewUrl: 'https://x/4.m4a', releaseDate: '1995-10-30' },
    { wrapperType: 'track', kind: 'song', trackId: 5, trackName: 'Supersonic (Remastered)', artistName: 'Oasis', previewUrl: 'https://x/5.m4a', releaseDate: '1994-04-11' },
    { wrapperType: 'track', kind: 'song', trackId: 6, trackName: 'Want U 2 (Mixed)', artistName: 'Oasis', previewUrl: 'https://x/6.m4a', releaseDate: '2020-01-01' },
    { wrapperType: 'track', kind: 'song', trackId: 7, trackName: 'Over and Over (feat. Guest)', artistName: 'Oasis', previewUrl: 'https://x/7.m4a', releaseDate: '2004-01-01' },
    { wrapperType: 'track', kind: 'song', trackId: 8, trackName: 'Over and Over', artistName: 'Oasis & Guest', previewUrl: 'https://x/8.m4a', releaseDate: '2004-01-01' }
  ]);
  const songs = await t.fetchArtistSongs(123);
  assert.deepEqual(Array.from(songs, (s) => s.title), ['Live Forever', 'Wonderwall', 'Supersonic (Remastered)', 'Over and Over']);
});

test('pickSong avoids picking the same recording across stages in a run', () => {
  const t = setupApp();
  const a = { slug: 'hello-adele', title: 'Hello', artist: 'Adele' };
  const b = { slug: 'hello-2015-remaster-adele', title: 'Hello (2015 Remaster)', artist: 'Adele' };
  const c = { slug: 'rolling-in-the-deep-adele', title: 'Rolling in the Deep', artist: 'Adele' };
  t.S.pool = [a, b, c];
  t.S.stages = [{ slug: a.slug, title: a.title, artist: a.artist, guesses: [], done: true, won: true }];
  for (let i = 0; i < 20; i++) {
    const picked = t.pickSong(0);
    assert.equal(picked.slug, c.slug);
  }
});

test('fetchArtistSongs filters vs-remixes, censored duplicates, short intros, and deep guest cameos; pickSong favors popular custom tracks', async () => {
  const filler = Array.from({ length: 105 }, (_, i) => ({
    wrapperType: 'track', kind: 'song', trackId: 500 + i,
    trackName: `Hit Track ${i + 1}`, artistName: 'Bruno Mars',
    previewUrl: `https://x/${500 + i}.m4a`, releaseDate: '2016-01-01', trackTimeMillis: 200000
  }));
  const t = setupApp([
    { wrapperType: 'artist', artistId: 278873078, artistName: 'Bruno Mars' },
    { wrapperType: 'track', kind: 'song', trackId: 1, trackName: 'Uptown Funk (feat. Bruno Mars)', artistName: 'Mark Ronson', previewUrl: 'https://x/1.m4a', releaseDate: '2014-11-10', trackTimeMillis: 269000 },
    { wrapperType: 'track', kind: 'song', trackId: 2, trackName: 'Versace On The Floor', artistName: 'Bruno Mars', previewUrl: 'https://x/2.m4a', releaseDate: '2016-11-18', trackTimeMillis: 261000 },
    { wrapperType: 'track', kind: 'song', trackId: 3, trackName: 'Versace On The Floor (Bruno Mars vs. David Guetta)', artistName: 'Bruno Mars & David Guetta', previewUrl: 'https://x/3.m4a', releaseDate: '2017-06-27', trackTimeMillis: 228000 },
    { wrapperType: 'track', kind: 'song', trackId: 4, trackName: 'Fat Juicy & Wet', artistName: 'Sexyy Red & Bruno Mars', previewUrl: 'https://x/4.m4a', releaseDate: '2025-01-24', trackTimeMillis: 141000 },
    { wrapperType: 'track', kind: 'song', trackId: 5, trackName: 'Fat Juicy &... (Radio Edit)', artistName: 'Sexyy Red & Bruno Mars', previewUrl: 'https://x/5.m4a', releaseDate: '2025-01-24', trackTimeMillis: 141000 },
    { wrapperType: 'track', kind: 'song', trackId: 6, trackName: 'Silk Sonic Intro', artistName: 'Silk Sonic, Bruno Mars & Anderson .Paak', previewUrl: 'https://x/6.m4a', releaseDate: '2021-11-12', trackTimeMillis: 63000 },
    ...filler,
    { wrapperType: 'track', kind: 'song', trackId: 999, trackName: '6AM (feat. Bruno Mars)', artistName: 'Bueno', previewUrl: 'https://x/999.m4a', releaseDate: '2008-10-07', trackTimeMillis: 230000 }
  ]);
  const songs = await t.fetchArtistSongs(278873078);
  const titles = songs.map((s) => s.title);
  assert.equal(titles.includes('Uptown Funk (feat. Bruno Mars)'), true);
  assert.equal(titles.includes('Versace On The Floor'), true);
  assert.equal(titles.includes('Versace On The Floor (Bruno Mars vs. David Guetta)'), false);
  assert.equal(titles.includes('Fat Juicy & Wet'), true);
  assert.equal(titles.includes('Fat Juicy &... (Radio Edit)'), false);
  assert.equal(titles.includes('Silk Sonic Intro'), false);
  assert.equal(titles.includes('6AM (feat. Bruno Mars)'), false);
  assert.equal(songs[0].tier, 1);
  assert.equal(songs[songs.length - 1].tier, 4);

  t.S.custom = { id: '278873078', label: 'Bruno Mars', songs };
  t.S.pool = songs;
  t.S.stage = 3;
  t.S.stages = [];
  for (let i = 0; i < 40; i++) {
    const p = t.pickSong(0);
    assert.ok(p.rank < 48, `picked deep tail rank ${p.rank} (${p.title})`);
  }
});
