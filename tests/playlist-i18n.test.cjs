const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const I18n = require('../i18n.js');
const Backup = require('../backup.js');
const TuneUpCard = require('../score-card.js');

const ROOT = path.join(__dirname, '..');
const plSrc = fs.readFileSync(path.join(ROOT, 'functions/api/playlist.js'), 'utf8');
const plModPromise = import('data:text/javascript;base64,' + Buffer.from(plSrc).toString('base64'));

function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key(i) { return [...map.keys()][i] ?? null; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(String(k), String(v)); },
    removeItem(k) { map.delete(k); }
  };
}

test('parseExternalPlaylistUrl parses Apple Music & YouTube playlists/albums and rejects invalid or private lists', async () => {
  const { parseExternalPlaylistUrl } = await plModPromise;
  assert.deepEqual(
    parseExternalPlaylistUrl('https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb'),
    { source: 'apple', type: 'playlist', id: 'pl.f4d106fed2bd41149aaacabb233eb5eb', country: 'us' }
  );
  assert.deepEqual(
    parseExternalPlaylistUrl('https://music.apple.com/id/playlist/my-mix/pl.u-abc123XYZ987'),
    { source: 'apple', type: 'playlist', id: 'pl.u-abc123XYZ987', country: 'id' }
  );
  assert.deepEqual(
    parseExternalPlaylistUrl('https://music.apple.com/us/album/after-hours/1499378108'),
    { source: 'apple', type: 'album', id: '1499378108', country: 'us' }
  );
  assert.deepEqual(
    parseExternalPlaylistUrl('https://www.youtube.com/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj'),
    { source: 'youtube', type: 'playlist', id: 'PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj' }
  );
  assert.deepEqual(
    parseExternalPlaylistUrl('https://music.youtube.com/playlist?list=OLAK5uy_kExamplePlaylistId12345'),
    { source: 'youtube', type: 'playlist', id: 'OLAK5uy_kExamplePlaylistId12345' }
  );
  assert.deepEqual(
    parseExternalPlaylistUrl('https://youtu.be/kPa7bsKwL-c?list=PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i'),
    { source: 'youtube', type: 'playlist', id: 'PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i' }
  );
  assert.equal(parseExternalPlaylistUrl('https://www.youtube.com/playlist?list=WL'), null);
  assert.equal(parseExternalPlaylistUrl('https://evil.example/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj'), null);
  assert.equal(parseExternalPlaylistUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'), null);
});

test('extractApplePlaylistPayload and extractAppleAlbumPayload extract tracks, trackIds, and HD covers', async () => {
  const { extractApplePlaylistPayload, extractAppleAlbumPayload } = await plModPromise;
  const serialized = {
    data: [{
      sections: [
        {
          itemKind: 'containerDetailHeaderLockup',
          items: [{
            title: "Today's Hits",
            subtitleLinks: [{ title: 'Apple Music Hits' }],
            artwork: { dictionary: { url: 'https://is1-ssl.mzstatic.com/cover/{w}x{h}bb.{f}' } }
          }]
        },
        {
          items: [
            {
              title: 'Die With A Smile',
              subtitleLinks: [{ title: 'Lady Gaga' }, { title: 'Bruno Mars' }],
              duration: 251667,
              contentDescriptor: { identifiers: { storeAdamID: '1762656724' } },
              artwork: { dictionary: { url: 'https://is1-ssl.mzstatic.com/t1/{w}x{h}bb.{f}' } }
            },
            {
              title: 'Die With A Smile',
              subtitleLinks: [{ title: 'Lady Gaga' }, { title: 'Bruno Mars' }],
              contentDescriptor: { identifiers: { storeAdamID: '1762656724' } }
            }
          ]
        }
      ]
    }]
  };
  const html = `<script id="serialized-server-data">${JSON.stringify(serialized)}</script>`;
  const pl = extractApplePlaylistPayload(html, 'pl.test123', 'us');
  assert.equal(pl.status, 200);
  assert.equal(pl.data.source, 'apple');
  assert.equal(pl.data.name, "Today's Hits");
  assert.equal(pl.data.cover, 'https://is1-ssl.mzstatic.com/cover/600x600bb.jpg');
  assert.equal(pl.data.tracks.length, 1);
  assert.equal(pl.data.tracks[0].trackId, 1762656724);
  assert.equal(pl.data.tracks[0].artist, 'Lady Gaga, Bruno Mars');
  assert.equal(pl.data.tracks[0].art, 'https://is1-ssl.mzstatic.com/t1/600x600bb.jpg');
  assert.equal(pl.data.tracks[0].artThumb, 'https://is1-ssl.mzstatic.com/t1/300x300bb.jpg');

  const ab = extractAppleAlbumPayload({
    results: [
      { wrapperType: 'collection', collectionName: 'After Hours', artistName: 'The Weeknd', artworkUrl100: 'https://is1-ssl.mzstatic.com/a/100x100bb.jpg' },
      { wrapperType: 'track', kind: 'song', trackId: 1499378607, trackName: 'Blinding Lights', artistName: 'The Weeknd', collectionName: 'After Hours', releaseDate: '2020-03-20T00:00:00Z', previewUrl: 'https://audio-ssl.itunes.apple.com/p.m4a', artworkUrl100: 'https://is1-ssl.mzstatic.com/a/100x100bb.jpg' }
    ]
  }, '1499378108');
  assert.equal(ab.status, 200);
  assert.equal(ab.data.type, 'album');
  assert.equal(ab.data.tracks[0].preview, 'https://audio-ssl.itunes.apple.com/p.m4a');
  assert.equal(ab.data.tracks[0].year, 2020);
});

test('parseYouTubeTrack and extractYouTubePlaylistPayload clean video tags and support lockupViewModel + legacy renderers', async () => {
  const { parseYouTubeTrack, extractYouTubePlaylistPayload } = await plModPromise;
  assert.deepEqual(
    parseYouTubeTrack('Lady Gaga, Bruno Mars - Die With A Smile (Official Music Video)', 'Lady Gaga'),
    { artist: 'Lady Gaga, Bruno Mars', title: 'Die With A Smile' }
  );
  assert.deepEqual(
    parseYouTubeTrack('Blinding Lights [Official Audio]', 'The Weeknd - Topic'),
    { artist: 'The Weeknd', title: 'Blinding Lights' }
  );
  assert.equal(parseYouTubeTrack('[Deleted video]', ''), null);

  const ytData = {
    metadata: { playlistMetadataRenderer: { title: 'Pop Classics' } },
    contents: [
      {
        lockupViewModel: {
          contentId: 'kPa7bsKwL-c',
          metadata: {
            lockupMetadataViewModel: {
              title: { content: 'Billie Eilish - BIRDS OF A FEATHER (Official Music Video)' },
              metadata: { contentMetadataViewModel: { metadataRows: [{ metadataParts: [{ text: { content: 'Billie Eilish' } }] }] } }
            }
          }
        }
      },
      {
        playlistVideoRenderer: {
          videoId: 'abc123XYZ00',
          title: { simpleText: 'Cruel Summer (Lyric Video)' },
          shortBylineText: { runs: [{ text: 'Taylor SwiftVEVO' }] }
        }
      }
    ]
  };
  const html = `<script>var ytInitialData = ${JSON.stringify(ytData)};</script>`;
  const out = extractYouTubePlaylistPayload(html, 'PLtest123456');
  assert.equal(out.status, 200);
  assert.equal(out.data.source, 'youtube');
  assert.equal(out.data.name, 'Pop Classics');
  assert.equal(out.data.tracks.length, 2);
  assert.equal(out.data.tracks[0].artist, 'Billie Eilish');
  assert.equal(out.data.tracks[0].title, 'BIRDS OF A FEATHER');
  assert.equal(out.data.tracks[1].artist, 'Taylor Swift');
  assert.equal(out.data.tracks[1].title, 'Cruel Summer');
});

test('TuneUpI18n maintains EN/ES dictionary parity, persists tl:set:lang through Backup, and wires score-card sources', () => {
  const enKeys = Object.keys(I18n.DICT.en).sort();
  const esKeys = Object.keys(I18n.DICT.es).sort();
  assert.deepEqual(esKeys, enKeys, 'EN and ES dictionaries must contain the exact same keys');

  const st = makeStorage();
  assert.equal(I18n.load(st), 'en');
  assert.equal(I18n.t('dailyHeading'), 'Daily Challenge');

  I18n.set('es', st);
  assert.equal(I18n.get(), 'es');
  assert.equal(I18n.t('dailyHeading'), 'Desafío Diario');
  assert.equal(I18n.t('hintIn', { n: 3 }), 'Pista en 3');
  assert.equal(I18n.t('badgesScope', { u: 4, t: 8 }), '4 de 8 logros desbloqueados · guardados en este dispositivo');

  // Persists through TuneUpBackup
  const code = Backup.encode(Backup.collect(st));
  const st2 = makeStorage();
  Backup.restore(st2, Backup.decode(code).entries);
  assert.equal(I18n.load(st2), 'es');
  I18n.set('en', st);

  // Score card kickers for Apple Music & YouTube playlists
  const appleCard = TuneUpCard.buildCardData({
    kind: 'run', mode: 'custom', isSpotify: true, playlistSource: 'apple',
    total: 5, stages: [], subtitle: "Today's Hits", url: 'https://tuneup.my.id/'
  });
  assert.equal(appleCard.kicker, 'APPLE MUSIC');
  const ytCard = TuneUpCard.buildCardData({
    kind: 'run', mode: 'custom', isSpotify: true, playlistSource: 'youtube',
    total: 5, stages: [], subtitle: 'Pop Classics', url: 'https://tuneup.my.id/'
  });
  assert.equal(ytCard.kicker, 'YOUTUBE PLAYLIST');

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /id="setLangSeg"/);
  assert.match(html, /src="i18n\.js"/);
  assert.match(html, /id="playlistField"[^>]*data-src="neutral"/);
  assert.match(html, /class="ico-pl-apple"/);
  assert.match(html, /class="ico-pl-youtube"/);
  const appCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.match(appCode, /params\.get\('playlist'\)/);
  assert.match(appCode, /field\.dataset\.src = /);
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /'\.\/i18n\.js'/);
  const build = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');
  assert.match(build, /'i18n\.js'/);
});
