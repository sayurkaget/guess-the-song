/* Public Apple Music & YouTube / YouTube Music playlist loader (keyless). */
const APPLE_HOSTS = new Set(['music.apple.com', 'embed.music.apple.com']);
const YT_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);
const APPLE_PL_ID = /^pl\.[A-Za-z0-9._-]{6,80}$/;
const APPLE_ALBUM_ID = /^\d{5,15}$/;
const YT_LIST_ID = /^[A-Za-z0-9_-]{10,80}$/;

const jsonReply = (status, body, cache = 'no-store') => Response.json(body, {
  status,
  headers: { 'Cache-Control': cache }
});

const cleanText = (s) => String(s || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

const formatAppleArt = (tpl, size) => {
  if (!tpl || typeof tpl !== 'string' || !/^https:\/\//.test(tpl)) return '';
  return tpl
    .replace(/\{w\}/g, String(size))
    .replace(/\{h\}/g, String(size))
    .replace(/\{f\}/g, 'jpg')
    .replace(/\{c\}/g, 'bb');
};

export function parseExternalPlaylistUrl(raw) {
  const s = String(raw || '').trim();
  if (!s || s.length > 600) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();

  if (APPLE_HOSTS.has(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    const country = parts[0] && /^[a-z]{2}$/i.test(parts[0]) ? parts[0].toLowerCase() : 'us';
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i].toLowerCase();
      if (seg === 'playlist') {
        const id = parts.slice(i + 1).find((p) => APPLE_PL_ID.test(p));
        if (id) return { source: 'apple', type: 'playlist', id, country };
      }
      if (seg === 'album') {
        const id = parts.slice(i + 1).find((p) => APPLE_ALBUM_ID.test(p));
        if (id) return { source: 'apple', type: 'album', id, country };
      }
    }
    return null;
  }

  if (YT_HOSTS.has(host)) {
    const listId = (url.searchParams.get('list') || '').trim();
    if (!YT_LIST_ID.test(listId)) return null;
    // Skip personal Watch Later / Liked / Mix radio-only lists that require sign-in
    if (/^(WL|LL|LM)$/i.test(listId)) return null;
    return { source: 'youtube', type: 'playlist', id: listId };
  }

  return null;
}

export function extractApplePlaylistPayload(html, id, country = 'us') {
  const match = String(html || '').match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return { error: 'Could not read Apple Music playlist data.', status: 502 };
  let parsed;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return { error: 'Invalid Apple Music playlist response.', status: 502 };
  }

  let header = null;
  const tracks = [];
  const seen = new Set();

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) walk(node[i]);
      return;
    }
    if (!header && node.itemKind === 'containerDetailHeaderLockup' && Array.isArray(node.items) && node.items[0]?.title) {
      header = node.items[0];
    }
    if (node.title && Array.isArray(node.subtitleLinks) && node.contentDescriptor?.identifiers?.storeAdamID) {
      const title = cleanText(node.title);
      const artist = cleanText(node.subtitleLinks.map((l) => cleanText(l && l.title)).filter(Boolean).join(', '));
      const adamId = String(node.contentDescriptor.identifiers.storeAdamID).trim();
      if (title && artist) {
        const key = (title + '\0' + artist).toLowerCase();
        if (!seen.has(key) && tracks.length < 500) {
          seen.add(key);
          const artTpl = node.artwork?.dictionary?.url || '';
          const art = formatAppleArt(artTpl, 600);
          const artThumb = formatAppleArt(artTpl, 300) || art;
          tracks.push({
            id: adamId,
            trackId: /^\d+$/.test(adamId) ? Number(adamId) : 0,
            title,
            artist,
            art,
            artThumb,
            preview: '',
            externalUrl: `https://music.apple.com/${country}/song/${adamId}`,
            duration: Number(node.duration) || 0
          });
        }
      }
      return;
    }
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(parsed);

  if (!tracks.length) {
    return { error: 'No playable tracks found in this Apple Music playlist — make sure it is public.', status: 404 };
  }

  const ogTitle = (String(html).match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) || [])[1] || '';
  const fallbackName = cleanText(ogTitle.replace(/\s+on\s+Apple\s+Music$/i, ''));
  const name = cleanText(header?.title) || fallbackName || 'Apple Music Playlist';
  const owner = cleanText((header?.subtitleLinks || []).map((l) => l && l.title).filter(Boolean).join(', ')) || 'Apple Music';
  const cover = formatAppleArt(header?.artwork?.dictionary?.url || '', 600) || (tracks[0] && tracks[0].art) || '';

  return {
    status: 200,
    data: {
      ok: true,
      source: 'apple',
      type: 'playlist',
      id,
      name,
      owner,
      cover,
      total: tracks.length,
      tracks
    }
  };
}

export function extractAppleAlbumPayload(data, id) {
  const results = Array.isArray(data?.results) ? data.results : [];
  const albumMeta = results.find((r) => r && r.wrapperType === 'collection') || null;
  const rawTracks = results.filter((r) => r && r.wrapperType === 'track' && r.kind === 'song');
  const seen = new Set();
  const tracks = [];

  for (const r of rawTracks) {
    const title = cleanText(r.trackName);
    const artist = cleanText(r.artistName);
    if (!title || !artist) continue;
    const key = (title + '\0' + artist).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const art100 = typeof r.artworkUrl100 === 'string' ? r.artworkUrl100 : '';
    const art = art100 ? art100.replace('100x100', '600x600') : '';
    const artThumb = art100 ? art100.replace('100x100', '300x300') : '';
    const yearMatch = String(r.releaseDate || '').match(/\b(19|20)\d{2}\b/);
    tracks.push({
      id: String(r.trackId || tracks.length + 1),
      trackId: Number(r.trackId) || 0,
      title,
      artist,
      album: cleanText(r.collectionName || albumMeta?.collectionName || ''),
      year: yearMatch ? Number(yearMatch[0]) : 0,
      art,
      artThumb,
      preview: typeof r.previewUrl === 'string' && /^https:\/\//.test(r.previewUrl) ? r.previewUrl : '',
      externalUrl: typeof r.trackViewUrl === 'string' ? r.trackViewUrl : ''
    });
    if (tracks.length >= 200) break;
  }

  if (!tracks.length) {
    return { error: 'Apple Music album not found or has no playable songs.', status: 404 };
  }

  const cover100 = albumMeta?.artworkUrl100 || '';
  return {
    status: 200,
    data: {
      ok: true,
      source: 'apple',
      type: 'album',
      id,
      name: cleanText(albumMeta?.collectionName) || 'Apple Music Album',
      owner: cleanText(albumMeta?.artistName) || 'Apple Music',
      cover: cover100 ? cover100.replace('100x100', '600x600') : (tracks[0]?.art || ''),
      total: tracks.length,
      tracks
    }
  };
}

export function parseYouTubeTrack(rawTitle, rawChannel) {
  let s = cleanText(rawTitle);
  if (!s || /^\[(deleted|private)\s+video\]$/i.test(s)) return null;

  // Strip common YouTube video tags while keeping real song subtitles
  const NOISE_PAREN = /\s*[([]\s*(?:official\s*(?:music\s*)?(?:video|audio|lyric\s*video|lyrics?|visualizer|visualiser|mv|hd\s*video|4k(?:\s*remaster)?|live\s*video|performance\s*video)|music\s*video|lyric\s*video|lyrics?|audio\s*only|visualizer|visualiser|hd|4k|hq|mv|m\/v|explicit|clean\s*version|color\s*coded\s*lyrics?|sub\s*espa[nñ]ol|lirik(?:\s*lagu)?)\s*[)\]]/gi;
  s = s.replace(NOISE_PAREN, ' ');
  s = s.replace(/\s*\|\s*(?:official\s*(?:music\s*)?(?:video|audio|lyric\s*video|mv)|lyrics?|visualizer).*$/i, '');
  s = s.replace(/\s*#\w+/g, ' ');
  s = cleanText(s);

  const cleanChannel = cleanText(
    String(rawChannel || '')
      .replace(/\s*[-–—]\s*Topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/\s+(?:Official|Music|Channel)$/i, '')
  );

  // Split "Artist - Song Title"
  const sep = s.match(/^(.+?)\s+[-–—|:]\s+(.+)$/);
  if (sep) {
    let artist = cleanText(sep[1]);
    let title = cleanText(sep[2]).replace(/^["'“”]+|["'“”]+$/g, '').trim();
    // Move trailing "ft. X" cleanly or keep title tidy
    title = cleanText(title.replace(NOISE_PAREN, ' '));
    if (artist && title) return { title, artist };
  }

  // Auto-generated Topic / artist channel tracks ("Blinding Lights" by "The Weeknd - Topic")
  if (cleanChannel && s) {
    return { title: s.replace(/^["'“”]+|["'“”]+$/g, '').trim(), artist: cleanChannel };
  }
  return null;
}

export function extractYouTubePlaylistPayload(html, id) {
  const m = String(html || '').match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!m) return { error: 'Could not read YouTube playlist data.', status: 502 };
  let yd;
  try {
    yd = JSON.parse(m[1]);
  } catch {
    return { error: 'Invalid YouTube playlist response.', status: 502 };
  }

  const seen = new Set();
  const tracks = [];

  const pushEntry = (vid, rawTitle, rawChannel) => {
    if (!vid || tracks.length >= 200) return;
    const parsed = parseYouTubeTrack(rawTitle, rawChannel);
    if (!parsed || !parsed.title || !parsed.artist) return;
    const key = (parsed.title + '\0' + parsed.artist).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tracks.push({
      id: vid,
      title: parsed.title,
      artist: parsed.artist,
      preview: '',
      externalUrl: 'https://www.youtube.com/watch?v=' + encodeURIComponent(vid)
    });
  };

  const walk = (node) => {
    if (!node || typeof node !== 'object' || tracks.length >= 200) return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) walk(node[i]);
      return;
    }
    // 2026 YouTube lockupViewModel
    if (node.lockupViewModel) {
      const lvm = node.lockupViewModel;
      const vid = lvm.contentId || lvm.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId || '';
      const meta = lvm.metadata?.lockupMetadataViewModel;
      const rawTitle = meta?.title?.content || '';
      const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
      const rawChannel = rows[0]?.metadataParts?.[0]?.text?.content || '';
      if (vid && rawTitle) pushEntry(vid, rawTitle, rawChannel);
      return;
    }
    // Legacy playlistVideoRenderer fallback
    if (node.playlistVideoRenderer) {
      const v = node.playlistVideoRenderer;
      const vid = v.videoId || '';
      const rawTitle = v.title?.runs?.map((r) => r.text).join('') || v.title?.simpleText || '';
      const rawChannel = v.shortBylineText?.runs?.map((r) => r.text).join('') || '';
      if (vid && rawTitle) pushEntry(vid, rawTitle, rawChannel);
      return;
    }
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(yd.contents || yd);

  if (!tracks.length) {
    return { error: 'No playable songs found in this YouTube playlist — make sure it is Public or Unlisted.', status: 404 };
  }

  const name = cleanText(yd?.metadata?.playlistMetadataRenderer?.title) || 'YouTube Playlist';
  const cover = yd?.microformat?.microformatDataRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';
  const owner = cleanText(yd?.header?.playlistHeaderRenderer?.ownerText?.runs?.map((r) => r.text).join('')) || 'YouTube';

  return {
    status: 200,
    data: {
      ok: true,
      source: 'youtube',
      type: 'playlist',
      id,
      name,
      owner,
      cover: /^https:\/\//.test(cover) ? cover : '',
      total: tracks.length,
      tracks
    }
  };
}

export async function onRequest({ request }) {
  if (request.method !== 'GET') return jsonReply(405, { ok: false, error: 'Method not allowed.' });

  const reqUrl = new URL(request.url);
  const raw = reqUrl.searchParams.get('url') || '';
  const target = parseExternalPlaylistUrl(raw);
  if (!target) {
    return jsonReply(400, { ok: false, error: 'Paste a public Apple Music or YouTube playlist link.' });
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  try {
    if (target.source === 'apple' && target.type === 'album') {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(target.id)}&entity=song&limit=200&country=${encodeURIComponent(target.country)}`, {
        signal: AbortSignal.timeout(10000),
        headers
      });
      if (!res.ok) return jsonReply(502, { ok: false, error: 'Apple Music could not be reached right now.' });
      const data = JSON.parse(await res.text());
      const out = extractAppleAlbumPayload(data, target.id);
      if (out.error) return jsonReply(out.status || 404, { ok: false, error: out.error });
      return jsonReply(200, out.data, 'public, max-age=600');
    }

    if (target.source === 'apple') {
      const pageUrl = `https://music.apple.com/${encodeURIComponent(target.country)}/playlist/p/${encodeURIComponent(target.id)}`;
      const res = await fetch(pageUrl, { signal: AbortSignal.timeout(11000), headers });
      if (res.status === 404) {
        return jsonReply(404, { ok: false, error: 'Apple Music playlist not found — make sure it is public.' });
      }
      if (!res.ok) return jsonReply(502, { ok: false, error: 'Apple Music could not be reached right now.' });
      const out = extractApplePlaylistPayload(await res.text(), target.id, target.country);
      if (out.error) return jsonReply(out.status || 502, { ok: false, error: out.error });
      return jsonReply(200, out.data, 'public, max-age=600');
    }

    // YouTube / YouTube Music playlist
    const ytUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(target.id)}`;
    const res = await fetch(ytUrl, { signal: AbortSignal.timeout(11000), headers });
    if (res.status === 404) {
      return jsonReply(404, { ok: false, error: 'YouTube playlist not found — make sure it is Public or Unlisted.' });
    }
    if (!res.ok) return jsonReply(502, { ok: false, error: 'YouTube could not be reached right now.' });
    const out = extractYouTubePlaylistPayload(await res.text(), target.id);
    if (out.error) return jsonReply(out.status || 502, { ok: false, error: out.error });
    return jsonReply(200, out.data, 'public, max-age=600');
  } catch {
    return jsonReply(502, { ok: false, error: 'Could not reach playlist provider right now. Try again.' });
  }
}
