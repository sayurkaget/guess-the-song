/* Public Spotify playlist & album loader via Spotify's official embed JSON. */
const BASE62_ID = /^[A-Za-z0-9]{22}$/;
const SHORT_HOSTS = new Set(['spotify.link', 'spoti.fi']);
const SPOTIFY_HOSTS = new Set(['open.spotify.com', 'play.spotify.com']);

const jsonReply = (status, body, cache = 'no-store') => Response.json(body, {
  status,
  headers: { 'Cache-Control': cache }
});

const cleanText = (s) => String(s || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

export function parseSpotifyInput(raw) {
  const s = String(raw || '').trim();
  if (!s || s.length > 500) return null;

  // Bare 22-char playlist ID
  if (BASE62_ID.test(s)) return { type: 'playlist', id: s };

  // spotify:playlist:<id> or spotify:album:<id>
  const uriMatch = s.match(/^spotify:(playlist|album):([A-Za-z0-9]{22})$/i);
  if (uriMatch) return { type: uriMatch[1].toLowerCase(), id: uriMatch[2] };

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (SHORT_HOSTS.has(host)) {
    return { shortUrl: 'https://' + host + url.pathname + url.search };
  }
  if (!SPOTIFY_HOSTS.has(host)) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  // Handle optional locale prefix (/intl-id/playlist/...) or /embed/playlist/...
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i].toLowerCase();
    if ((seg === 'playlist' || seg === 'album') && BASE62_ID.test(parts[i + 1])) {
      return { type: seg, id: parts[i + 1] };
    }
  }
  return null;
}

export function extractEmbedPayload(html, type, id) {
  const match = String(html || '').match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return { error: 'Could not read Spotify playlist data.', status: 502 };
  let parsed;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return { error: 'Invalid Spotify embed response.', status: 502 };
  }
  const pageProps = parsed?.props?.pageProps || {};
  if (pageProps.status === 404) {
    return { error: 'Playlist not found — make sure it is set to Public on Spotify.', status: 404 };
  }
  const entity = pageProps?.state?.data?.entity;
  if (!entity || !Array.isArray(entity.trackList)) {
    return { error: 'Playlist is private or unavailable.', status: 404 };
  }

  const seen = new Set();
  const tracks = [];
  for (const item of entity.trackList) {
    if (!item || item.entityType === 'episode') continue;
    const title = cleanText(item.title);
    const artist = cleanText(item.subtitle);
    if (!title || !artist) continue;
    const key = (title + '\0' + artist).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const uri = String(item.uri || '');
    const tidMatch = uri.match(/^spotify:track:([A-Za-z0-9]{22})$/);
    const preview = typeof item.audioPreview?.url === 'string' && /^https:\/\/p\.scdn\.co\//.test(item.audioPreview.url)
      ? item.audioPreview.url
      : '';
    tracks.push({
      id: tidMatch ? tidMatch[1] : String(tracks.length + 1),
      title,
      artist,
      preview,
      spotifyUrl: tidMatch ? 'https://open.spotify.com/track/' + tidMatch[1] : '',
      duration: Number(item.duration) || 0
    });
    if (tracks.length >= 100) break;
  }

  if (tracks.length < 5) {
    return { error: 'Need at least 5 tracks in this Spotify ' + type + ' to play.', status: 422 };
  }

  const cover = entity.visualIdentity?.image?.[0]?.url
    || entity.coverArt?.sources?.[0]?.url
    || '';

  return {
    status: 200,
    data: {
      ok: true,
      type,
      id,
      name: cleanText(entity.name) || 'Spotify Playlist',
      owner: cleanText(entity.subtitle) || 'Spotify',
      cover: typeof cover === 'string' && /^https:\/\//.test(cover) ? cover : '',
      total: tracks.length,
      tracks
    }
  };
}

export async function onRequest({ request }) {
  if (request.method !== 'GET') return jsonReply(405, { ok: false, error: 'Method not allowed.' });

  const reqUrl = new URL(request.url);
  const raw = reqUrl.searchParams.get('url') || reqUrl.searchParams.get('id') || '';
  let target = parseSpotifyInput(raw);
  if (!target) {
    return jsonReply(400, { ok: false, error: 'Paste a public Spotify playlist or album link.' });
  }

  if (target.shortUrl) {
    try {
      const resolved = await fetch(target.shortUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      target = parseSpotifyInput(resolved.url);
      if (!target || target.shortUrl) {
        return jsonReply(400, { ok: false, error: 'Short link did not point to a Spotify playlist or album.' });
      }
    } catch {
      return jsonReply(502, { ok: false, error: 'Could not follow Spotify short link.' });
    }
  }

  try {
    const embedUrl = `https://open.spotify.com/embed/${target.type}/${target.id}`;
    const res = await fetch(embedUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (res.status === 404) {
      return jsonReply(404, { ok: false, error: 'Playlist not found — make sure it is set to Public on Spotify.' });
    }
    if (!res.ok) {
      return jsonReply(502, { ok: false, error: 'Spotify is temporarily unavailable. Try again shortly.' });
    }
    const html = await res.text();
    const out = extractEmbedPayload(html, target.type, target.id);
    if (out.error) return jsonReply(out.status, { ok: false, error: out.error });
    return jsonReply(200, out.data, 'public, max-age=300');
  } catch {
    return jsonReply(502, { ok: false, error: 'Could not reach Spotify. Check your connection and try again.' });
  }
}
