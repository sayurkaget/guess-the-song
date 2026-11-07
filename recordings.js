/* Shared recording policy for catalogue imports and playback. */
(function (root) {
  'use strict';
  function isStudio(track) {
    const title = track.trackName || track.title || '';
    const album = track.collectionName || track.album || '';
    const alternate = /\b(?:unplugged|acoustic|remix(?:ed|es)?|karaoke|tribute|demo|instrumental|sped[ -]up|slowed|re[ -]recorded|backing track|in the style of|originally performed)\b/i;
    const liveMarker = /(?:[([][^)\]]*\blive\b|\s[-–—:]\s*live\b|\blive\s+(?:at|from)\b|^live$|\brecorded live\b|\blive recording\b)/i;
    const liveAlbum = /\blive\s+(?:in|on|at|from|audio|concert|sessions?|killers|magic|rust|anthology|recordings?|global broadcast)\b|\blive(?=\s*(?:$|[:.!@(/\[–—-]))|\bin concert\b|\b(?:mtv|bbc)\s+(?:sessions|live)\b/i;
    const singleTitle = album.replace(/\s*[-–—]\s*(?:single|ep)$/i, '').trim();
    // Allow ordinary titles ending in "Live" (e.g. "Long Live - Single"),
    // without letting a single's explicit performance label bypass the filter.
    const namedSingle = singleTitle !== album && /\blive$/i.test(title) &&
      singleTitle.toLowerCase() === title.toLowerCase();
    return Boolean(title) && !alternate.test(title + ' ' + album) &&
      !liveMarker.test(title) && !liveMarker.test(album) && (namedSingle || !liveAlbum.test(album));
  }
  const policy = { isStudio };
  if (typeof module === 'object' && module.exports) module.exports = policy;
  else root.RecordingPolicy = policy;
})(typeof window === 'object' ? window : globalThis);
