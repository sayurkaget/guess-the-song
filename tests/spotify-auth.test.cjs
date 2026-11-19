const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SpotifyAuth = require('../spotify-auth.js');
const root = path.join(__dirname, '..');
const spotifyFnSrc = fs.readFileSync(path.join(root, 'functions/api/spotify.js'), 'utf8');
const spotifyFnMod = import('data:text/javascript;base64,' + Buffer.from(spotifyFnSrc).toString('base64'));

test('SpotifyAuth parses Feb 2026 items.items[].item schema and paginates >100 tracks cleanly', async () => {
  const makeEntry = (n, useLegacy) => {
    const id = String(n).padStart(22, 'a');
    const obj = {
      id,
      type: 'track',
      name: `Song ${n}`,
      artists: [{ name: `Artist ${n}` }, ...(n === 1 ? [{ name: 'Guest' }] : [])],
      album: {
        name: `Album ${n}`,
        release_date: '2024-08-16',
        images: [
          { url: `https://i.scdn.co/image/${id}_64`, width: 64 },
          { url: `https://i.scdn.co/image/${id}_640`, width: 640 },
          { url: `https://i.scdn.co/image/${id}_300`, width: 300 }
        ]
      },
      preview_url: null,
      duration_ms: 210000
    };
    return useLegacy ? { is_local: false, track: obj } : { is_local: false, item: obj };
  };

  const page1Items = Array.from({ length: 100 }, (_, i) => makeEntry(i + 1, false));
  page1Items.push({ is_local: true, item: { type: 'track', name: 'Local MP3', artists: [{ name: 'Me' }] } });
  page1Items.push({ is_local: false, item: { type: 'episode', name: 'Podcast', artists: [{ name: 'Host' }] } });
  const page2Items = Array.from({ length: 10 }, (_, i) => makeEntry(101 + i, i % 2 === 1));

  const mockGet = async (url) => {
    if (url.endsWith('/playlists/37i9dQZF1DXcBWIGoYBM5M')) {
      return {
        status: 200,
        data: {
          name: '🥚',
          owner: { display_name: 'Khalid' },
          images: [{ url: 'https://i.scdn.co/image/pl_640', width: 640 }],
          items: {
            items: page1Items,
            next: 'https://api.spotify.com/v1/playlists/37i9dQZF1DXcBWIGoYBM5M/items?offset=100&limit=100'
          }
        }
      };
    }
    if (url.includes('offset=100')) {
      return { status: 200, data: { items: page2Items, next: null } };
    }
    return { status: 404, data: null };
  };

  const res = await SpotifyAuth.fetchPlaylistWithAuth('playlist', '37i9dQZF1DXcBWIGoYBM5M', mockGet);
  assert.equal(res.ok, true);
  assert.equal(res.data.name, '🥚');
  assert.equal(res.data.cover, 'https://i.scdn.co/image/pl_640');
  assert.equal(res.data.tracks.length, 110);
  assert.equal(res.data.tracks[0].artist, 'Artist 1, Guest');
  assert.equal(res.data.tracks[0].art, 'https://i.scdn.co/image/aaaaaaaaaaaaaaaaaaaaa1_640');
  assert.equal(res.data.tracks[0].artThumb, 'https://i.scdn.co/image/aaaaaaaaaaaaaaaaaaaaa1_300');
  assert.equal(res.data.tracks[109].title, 'Song 110');
});

test('SpotifyAuth falls back to public embed when third-party playlist returns empty items', async () => {
  const mockGet = async (url) => {
    if (url.endsWith('/playlists/37i9dQZF1DXcBWIGoYBM5M')) {
      return { status: 200, data: { name: 'Editorial', items: { items: [], next: null } } };
    }
    return { status: 403, data: null };
  };
  const res = await SpotifyAuth.fetchPlaylistWithAuth('playlist', '37i9dQZF1DXcBWIGoYBM5M', mockGet);
  assert.equal(res.ok, false);
  assert.equal(res.fallbackToEmbed, true);
});

test('SpotifyAuth builds valid PKCE S256 authorize URL and /api/spotify?config=1 exposes env SPOTIFY_CLIENT_ID', async () => {
  const pkce = await SpotifyAuth.generatePkce();
  assert.ok(pkce.verifier.length >= 43);
  assert.ok(pkce.challenge.length >= 43);
  const url = new URL(SpotifyAuth.buildAuthorizeUrl({
    clientId: '0123456789abcdef0123456789abcdef',
    redirect: 'https://tuneup.pages.dev/',
    challenge: pkce.challenge,
    state: pkce.state
  }));
  assert.equal(url.origin, 'https://accounts.spotify.com');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://tuneup.pages.dev/');
  assert.equal(url.searchParams.get('scope'), SpotifyAuth.SCOPE);

  const { onRequest } = await spotifyFnMod;
  const r1 = await onRequest({
    request: new Request('https://tuneup.pages.dev/api/spotify?config=1'),
    env: { SPOTIFY_CLIENT_ID: '0123456789abcdef0123456789abcdef' }
  });
  assert.equal(r1.status, 200);
  assert.deepEqual(await r1.json(), { ok: true, clientId: '0123456789abcdef0123456789abcdef' });

  const r2 = await onRequest({
    request: new Request('https://tuneup.pages.dev/api/spotify?config=1'),
    env: {}
  });
  assert.deepEqual(await r2.json(), { ok: true, clientId: '' });
});

test('Spotify OAuth connect UI is wired cleanly in index.html and app.js', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(html, /id="spotifyConnectBtn"[\s\S]*id="spotifyConnectedBadge"/);
  assert.match(html, /id="spotifyAuthModal"[\s\S]*id="spotifyClientIdInput"[\s\S]*id="spotifyAuthGo"/);
  assert.match(html, /src="spotify-auth\.js"/);
  assert.match(app, /window\.SpotifyAuth/);
});
