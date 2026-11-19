/* Official Spotify OAuth 2.0 PKCE + Web API (Feb 2026 /items schema) client. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpotifyAuth = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const AUTH_KEY = 'tl:spotify:auth:v1';
  const CLIENT_KEY = 'tl:spotify:client_id';
  const VERIFIER_KEY = 'tl:sp:pkce:verifier';
  const STATE_KEY = 'tl:sp:pkce:state';
  const SCOPE = 'playlist-read-private playlist-read-collaborative';
  const CLIENT_ID_RE = /^[a-f0-9]{32}$/i;
  const BASE62_ID = /^[A-Za-z0-9]{22}$/;
  const MAX_TRACKS = 1000;

  let serverClientId = '';
  let configLoaded = false;

  const cleanText = (s) => String(s || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function lsSet(key, val) {
    try {
      if (val === null || val === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }

  function redirectUri() {
    if (typeof location === 'undefined') return 'https://tuneup.pages.dev/';
    const origin = location.origin.replace(/^http:\/\/localhost\b/i, 'http://127.0.0.1');
    return origin + '/';
  }

  function parseSpotifyTarget(raw) {
    const s = String(raw || '').trim();
    if (!s || s.length > 500) return null;
    if (BASE62_ID.test(s)) return { type: 'playlist', id: s };
    if (s.startsWith('album:') && BASE62_ID.test(s.slice(6))) return { type: 'album', id: s.slice(6) };
    const uriMatch = s.match(/^spotify:(playlist|album):([A-Za-z0-9]{22})$/i);
    if (uriMatch) return { type: uriMatch[1].toLowerCase(), id: uriMatch[2] };
    let url;
    try {
      url = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s);
    } catch {
      return null;
    }
    const host = url.hostname.toLowerCase();
    if (host !== 'open.spotify.com' && host !== 'play.spotify.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i].toLowerCase();
      if ((seg === 'playlist' || seg === 'album') && BASE62_ID.test(parts[i + 1])) {
        return { type: seg, id: parts[i + 1] };
      }
    }
    return null;
  }

  function pickCoverSizes(images) {
    if (!Array.isArray(images) || !images.length) return { hd: '', thumb: '' };
    const valid = images
      .filter((img) => img && typeof img.url === 'string' && /^https:\/\//.test(img.url))
      .map((img) => ({
        url: img.url,
        w: Number(img.width || img.maxWidth) || 300
      }))
      .sort((a, b) => b.w - a.w);
    if (!valid.length) return { hd: '', thumb: '' };
    const hd = valid[0].url;
    const medium = valid.find((x) => x.w >= 200 && x.w <= 400);
    const thumb = (medium && medium.url) || valid[valid.length - 1].url || hd;
    return { hd, thumb };
  }

  function extractTrackFromEntry(entry, fallbackAlbum, fallbackImages) {
    if (!entry || entry.is_local) return null;
    const t = entry.item || entry.track || entry;
    if (!t || t.is_local) return null;
    if (t.type && t.type !== 'track') return null;
    const title = cleanText(t.name);
    const artists = Array.isArray(t.artists)
      ? t.artists.map((a) => cleanText(a && a.name)).filter(Boolean).join(', ')
      : '';
    if (!title || !artists) return null;

    const id = BASE62_ID.test(String(t.id || '')) ? String(t.id) : '';
    const albumObj = t.album || fallbackAlbum || null;
    const covers = pickCoverSizes((albumObj && albumObj.images) || fallbackImages);
    const yearMatch = String((albumObj && albumObj.release_date) || '').match(/\b(19|20)\d{2}\b/);
    const preview = typeof t.preview_url === 'string' && /^https:\/\/p\.scdn\.co\//.test(t.preview_url)
      ? t.preview_url
      : '';
    return {
      id,
      title,
      artist: artists,
      album: cleanText(albumObj && albumObj.name),
      year: yearMatch ? Number(yearMatch[0]) : 0,
      art: covers.hd,
      artThumb: covers.thumb,
      preview,
      spotifyUrl: id ? 'https://open.spotify.com/track/' + id : '',
      duration: Number(t.duration_ms) || 0
    };
  }

  function base64UrlEncode(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = typeof btoa === 'function'
      ? btoa(bin)
      : Buffer.from(bytes).toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function generatePkce() {
    const raw = new Uint8Array(64);
    crypto.getRandomValues(raw);
    const verifier = base64UrlEncode(raw);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const challenge = base64UrlEncode(new Uint8Array(digest));
    const stBytes = new Uint8Array(16);
    crypto.getRandomValues(stBytes);
    const state = base64UrlEncode(stBytes);
    return { verifier, challenge, state };
  }

  function buildAuthorizeUrl({ clientId, redirect, challenge, state }) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SCOPE,
      redirect_uri: redirect,
      state,
      code_challenge_method: 'S256',
      code_challenge: challenge
    });
    return 'https://accounts.spotify.com/authorize?' + params.toString();
  }

  async function loadServerConfig() {
    if (configLoaded) return serverClientId;
    configLoaded = true;
    if (typeof fetch !== 'function') return '';
    try {
      const res = await fetch('/api/spotify?config=1', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return '';
      const data = await res.json().catch(() => null);
      if (data && typeof data.clientId === 'string' && CLIENT_ID_RE.test(data.clientId.trim())) {
        serverClientId = data.clientId.trim();
      }
    } catch {}
    return serverClientId;
  }

  function getClientId() {
    if (serverClientId) return serverClientId;
    const saved = lsGet(CLIENT_KEY, '');
    return typeof saved === 'string' && CLIENT_ID_RE.test(saved.trim()) ? saved.trim() : '';
  }

  function setClientId(raw) {
    const id = String(raw || '').trim();
    if (!CLIENT_ID_RE.test(id)) return false;
    lsSet(CLIENT_KEY, id);
    return true;
  }

  function getSession() {
    const s = lsGet(AUTH_KEY, null);
    if (!s || typeof s.accessToken !== 'string' || !s.accessToken) return null;
    return s;
  }

  function isConnected() {
    const s = getSession();
    return !!(s && (s.refreshToken || Date.now() < (Number(s.expiresAt) || 0)));
  }

  function disconnect() {
    lsSet(AUTH_KEY, null);
    try {
      sessionStorage.removeItem(VERIFIER_KEY);
      sessionStorage.removeItem(STATE_KEY);
    } catch {}
  }

  async function startLogin(customClientId) {
    await loadServerConfig();
    if (customClientId && !setClientId(customClientId)) {
      throw new Error('Client ID must be 32 letters/numbers from your Spotify Developer app.');
    }
    const clientId = getClientId();
    if (!clientId) return { needsClientId: true };

    const { verifier, challenge, state } = await generatePkce();
    try {
      sessionStorage.setItem(VERIFIER_KEY, verifier);
      sessionStorage.setItem(STATE_KEY, state);
    } catch {}
    const url = buildAuthorizeUrl({ clientId, redirect: redirectUri(), challenge, state });
    location.assign(url);
    return { redirected: true };
  }

  async function exchangeToken(bodyParams) {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(bodyParams)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.access_token) {
      throw new Error((data && (data.error_description || data.error)) || 'Spotify login failed.');
    }
    return data;
  }

  async function fetchProfileName(accessToken) {
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: 'Bearer ' + accessToken }
      });
      if (!res.ok) return '';
      const d = await res.json().catch(() => null);
      return cleanText((d && (d.display_name || d.id)) || '');
    } catch {
      return '';
    }
  }

  async function handleCallback() {
    if (typeof location === 'undefined') return null;
    let params;
    try { params = new URLSearchParams(location.search || ''); } catch { return null; }
    const code = params.get('code');
    const err = params.get('error');
    const state = params.get('state');
    if (!code && !err) return null;

    // Clean OAuth params from URL immediately
    params.delete('code');
    params.delete('state');
    params.delete('error');
    const cleanQuery = params.toString();
    const cleanUrl = location.pathname + (cleanQuery ? '?' + cleanQuery : '') + (location.hash || '');
    try { history.replaceState(null, '', cleanUrl); } catch {}

    if (err) return { ok: false, error: err === 'access_denied' ? 'Spotify login cancelled.' : 'Spotify login failed: ' + err };

    let verifier = '';
    let expectedState = '';
    try {
      verifier = sessionStorage.getItem(VERIFIER_KEY) || '';
      expectedState = sessionStorage.getItem(STATE_KEY) || '';
      sessionStorage.removeItem(VERIFIER_KEY);
      sessionStorage.removeItem(STATE_KEY);
    } catch {}
    if (!verifier || (expectedState && state !== expectedState)) {
      return { ok: false, error: 'Spotify login session expired. Please try Connect Spotify again.' };
    }

    await loadServerConfig();
    const clientId = getClientId();
    if (!clientId) return { ok: false, error: 'Missing Spotify Client ID.' };

    try {
      const tok = await exchangeToken({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri(),
        code_verifier: verifier
      });
      const userName = await fetchProfileName(tok.access_token);
      const session = {
        accessToken: tok.access_token,
        refreshToken: tok.refresh_token || '',
        expiresAt: Date.now() + Math.max(60, Number(tok.expires_in) || 3600) * 1000,
        userName: userName || 'Spotify',
        clientId
      };
      lsSet(AUTH_KEY, session);
      return { ok: true, session };
    } catch (e) {
      return { ok: false, error: (e && e.message) || 'Could not finish Spotify login.' };
    }
  }

  async function ensureToken() {
    const s = getSession();
    if (!s) return null;
    if (Date.now() < (Number(s.expiresAt) || 0) - 60000) return s.accessToken;
    if (!s.refreshToken) { disconnect(); return null; }
    await loadServerConfig();
    const clientId = s.clientId || getClientId();
    if (!clientId) { disconnect(); return null; }
    try {
      const tok = await exchangeToken({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: s.refreshToken
      });
      const updated = {
        ...s,
        accessToken: tok.access_token,
        refreshToken: tok.refresh_token || s.refreshToken,
        expiresAt: Date.now() + Math.max(60, Number(tok.expires_in) || 3600) * 1000
      };
      lsSet(AUTH_KEY, updated);
      return updated.accessToken;
    } catch {
      disconnect();
      return null;
    }
  }

  async function apiGet(url, token) {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.status === 401) {
      disconnect();
      return { status: 401, data: null };
    }
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  async function fetchPlaylistWithAuth(type, id, fetchImpl) {
    const token = fetchImpl ? 'test-token' : await ensureToken();
    if (!token) return { ok: false, fallbackToEmbed: true };
    const doGet = fetchImpl || ((url) => apiGet(url, token));

    if (type === 'album') {
      const first = await doGet('https://api.spotify.com/v1/albums/' + encodeURIComponent(id));
      if (first.status !== 200 || !first.data) return { ok: false, fallbackToEmbed: true, status: first.status };
      const alb = first.data;
      const covers = pickCoverSizes(alb.images);
      const tracks = [];
      const seen = new Set();
      let page = alb.tracks || alb.items || null;
      while (page && Array.isArray(page.items) && tracks.length < MAX_TRACKS) {
        for (const entry of page.items) {
          const parsed = extractTrackFromEntry(entry, alb, alb.images);
          if (!parsed) continue;
          const k = (parsed.title + '\0' + parsed.artist).toLowerCase();
          if (seen.has(k)) continue;
          seen.add(k);
          tracks.push(parsed);
          if (tracks.length >= MAX_TRACKS) break;
        }
        if (!page.next || tracks.length >= MAX_TRACKS) break;
        const nxt = await doGet(page.next);
        if (nxt.status !== 200 || !nxt.data) break;
        page = nxt.data;
      }
      if (!tracks.length) return { ok: false, fallbackToEmbed: true };
      return {
        ok: true,
        data: {
          ok: true,
          type: 'album',
          id,
          name: cleanText(alb.name) || 'Spotify Album',
          owner: Array.isArray(alb.artists) ? alb.artists.map((a) => cleanText(a && a.name)).filter(Boolean).join(', ') : 'Spotify',
          cover: covers.hd,
          total: tracks.length,
          tracks,
          fromOAuth: true
        }
      };
    }

    // Playlist: Feb 2026 schema uses `items` & `/items`, legacy uses `tracks` & `/tracks`
    const metaRes = await doGet('https://api.spotify.com/v1/playlists/' + encodeURIComponent(id));
    if (metaRes.status !== 200 || !metaRes.data) {
      return { ok: false, fallbackToEmbed: true, status: metaRes.status };
    }
    const pl = metaRes.data;
    const covers = pickCoverSizes(pl.images);
    let page = (pl.items && Array.isArray(pl.items.items)) ? pl.items
      : (pl.tracks && Array.isArray(pl.tracks.items)) ? pl.tracks
      : null;

    if (!page || !page.items.length) {
      const itemsRes = await doGet('https://api.spotify.com/v1/playlists/' + encodeURIComponent(id) + '/items?limit=100&offset=0');
      if (itemsRes.status === 200 && itemsRes.data && Array.isArray(itemsRes.data.items) && itemsRes.data.items.length) {
        page = itemsRes.data;
      } else {
        // Not owned/collaborated by user under Feb 2026 rules -> fall back to public embed cleanly
        return { ok: false, fallbackToEmbed: true };
      }
    }

    const tracks = [];
    const seen = new Set();
    let safetyPages = 0;
    while (page && Array.isArray(page.items) && tracks.length < MAX_TRACKS && safetyPages < 15) {
      safetyPages++;
      for (const entry of page.items) {
        const parsed = extractTrackFromEntry(entry);
        if (!parsed) continue;
        const k = (parsed.title + '\0' + parsed.artist).toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        tracks.push(parsed);
        if (tracks.length >= MAX_TRACKS) break;
      }
      if (!page.next || tracks.length >= MAX_TRACKS) break;
      const nxt = await doGet(page.next);
      if (nxt.status !== 200 || !nxt.data) break;
      page = nxt.data;
    }

    if (!tracks.length) return { ok: false, fallbackToEmbed: true };
    return {
      ok: true,
      data: {
        ok: true,
        type: 'playlist',
        id,
        name: cleanText(pl.name) || 'Spotify Playlist',
        owner: cleanText((pl.owner && pl.owner.display_name) || 'Spotify'),
        cover: covers.hd,
        total: tracks.length,
        tracks,
        fromOAuth: true
      }
    };
  }

  return {
    CLIENT_ID_RE,
    SCOPE,
    redirectUri,
    parseSpotifyTarget,
    pickCoverSizes,
    extractTrackFromEntry,
    generatePkce,
    buildAuthorizeUrl,
    loadServerConfig,
    getClientId,
    setClientId,
    getSession,
    isConnected,
    disconnect,
    startLogin,
    handleCallback,
    fetchPlaylistWithAuth
  };
});
