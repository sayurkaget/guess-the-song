const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const spotifySrc = fs.readFileSync(path.join(root, 'functions/api/spotify.js'), 'utf8');
const modPromise = import('data:text/javascript;base64,' + Buffer.from(spotifySrc).toString('base64'));

test('parseSpotifyInput parses playlist, intl, album, URI, bare ID, short link, and rejects foreign URLs', async () => {
  const { parseSpotifyInput } = await modPromise;
  assert.deepEqual(
    parseSpotifyInput('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc123'),
    { type: 'playlist', id: '37i9dQZF1DXcBWIGoYBM5M' }
  );
  assert.deepEqual(
    parseSpotifyInput('https://open.spotify.com/intl-id/playlist/37i9dQZF1DX9tPFwDMOaN1'),
    { type: 'playlist', id: '37i9dQZF1DX9tPFwDMOaN1' }
  );
  assert.deepEqual(
    parseSpotifyInput('https://open.spotify.com/album/4yP0hdKOZPNshxUOjY0cZj'),
    { type: 'album', id: '4yP0hdKOZPNshxUOjY0cZj' }
  );
  assert.deepEqual(
    parseSpotifyInput('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M'),
    { type: 'playlist', id: '37i9dQZF1DXcBWIGoYBM5M' }
  );
  assert.deepEqual(
    parseSpotifyInput('37i9dQZF1DXcBWIGoYBM5M'),
    { type: 'playlist', id: '37i9dQZF1DXcBWIGoYBM5M' }
  );
  assert.deepEqual(
    parseSpotifyInput('https://spotify.link/abcDEF123'),
    { shortUrl: 'https://spotify.link/abcDEF123' }
  );
  assert.equal(parseSpotifyInput('https://evil.example/playlist/37i9dQZF1DXcBWIGoYBM5M'), null);
  assert.equal(parseSpotifyInput('https://open.spotify.com/track/3h5T5JypYU7huFiVYhv1dr'), null);
  assert.equal(parseSpotifyInput(''), null);
});

test('extractEmbedPayload cleans NBSP artists, strips episodes, deduplicates, and enforces >= 5 tracks', async () => {
  const { extractEmbedPayload } = await modPromise;
  const payload = {
    props: {
      pageProps: {
        state: {
          data: {
            entity: {
              name: 'My\u00A0Mix',
              subtitle: 'Tester',
              visualIdentity: { image: [{ url: 'https://image-cdn-ak.spotifycdn.com/cover.jpg' }] },
              trackList: [
                { uri: 'spotify:track:1111111111111111111111', title: 'Song One', subtitle: 'Artist\u00A0A, Artist\u00A0B', entityType: 'track', duration: 200000, audioPreview: { url: 'https://p.scdn.co/mp3-preview/a' } },
                { uri: 'spotify:track:1111111111111111111111', title: 'Song One', subtitle: 'Artist A, Artist B', entityType: 'track', duration: 200000, audioPreview: { url: 'https://p.scdn.co/mp3-preview/a' } },
                { uri: 'spotify:episode:9999999999999999999999', title: 'Podcast Ep', subtitle: 'Host', entityType: 'episode' },
                { uri: 'spotify:track:2222222222222222222222', title: 'Song Two', subtitle: 'Artist C', entityType: 'track', audioPreview: { url: 'https://p.scdn.co/mp3-preview/b' } },
                { uri: 'spotify:track:3333333333333333333333', title: 'Song Three', subtitle: 'Artist D', entityType: 'track', audioPreview: { url: 'https://evil.example/x.mp3' } },
                { uri: 'spotify:track:4444444444444444444444', title: 'Song Four', subtitle: 'Artist E', entityType: 'track' },
                { uri: 'spotify:track:5555555555555555555555', title: 'Song Five', subtitle: 'Artist F', entityType: 'track', audioPreview: { url: 'https://p.scdn.co/mp3-preview/e' } }
              ]
            }
          }
        }
      }
    }
  };
  const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(payload)}</script></html>`;
  const ok = extractEmbedPayload(html, 'playlist', '37i9dQZF1DXcBWIGoYBM5M');
  assert.equal(ok.status, 200);
  assert.equal(ok.data.name, 'My Mix');
  assert.equal(ok.data.tracks.length, 5);
  assert.equal(ok.data.tracks[0].artist, 'Artist A, Artist B');
  assert.equal(ok.data.tracks[0].preview, 'https://p.scdn.co/mp3-preview/a');
  assert.equal(ok.data.tracks[2].preview, ''); // rejects non-scdn preview URL
  assert.equal(ok.data.tracks[0].spotifyUrl, 'https://open.spotify.com/track/1111111111111111111111');

  const notFound = extractEmbedPayload('<script id="__NEXT_DATA__">{"props":{"pageProps":{"status":404}}}</script>', 'playlist', '37i9dQZF1DXcBWIGoYBM5M');
  assert.equal(notFound.status, 404);

  const tooFew = extractEmbedPayload('<script id="__NEXT_DATA__">{"props":{"pageProps":{"state":{"data":{"entity":{"name":"Tiny","trackList":[{"title":"A","subtitle":"B"}]}}}}}}</script>', 'playlist', '37i9dQZF1DXcBWIGoYBM5M');
  assert.equal(tooFew.status, 422);
});

test('Spotify tab UI is present in index.html and wired in app.js', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const appCode = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(html, /data-classic-tab="spotify"/);
  assert.match(html, /id="classicSpotifyPanel"[\s\S]*id="spotifyUrl"[\s\S]*id="loadSpotifyBtn"[\s\S]*id="spotifyPicks"/);
  assert.match(appCode, /async function startSpotifyPlaylist/);
  assert.match(appCode, /\/api\/spotify\?url=/);
});
