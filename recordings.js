/* Shared recording policy for catalogue imports and playback. */
(function (root) {
  'use strict';
  function isStudio(track) {
    const title = track.trackName || track.title || '';
    const album = track.collectionName || track.album || '';
    const artist = track.artistName || track.artist || '';
    const alternate = /\b(?:unplugged|acoustic|ac[uú]stic[ao]s?|en\s+vivo|ao\s+vivo|en\s+directo|unpeeled|(?:triple\s+j\s+)?like\s+a\s+version|remix(?:ed|es)?|karaoke|tribute|demo|instrumental|sped[ -]up|slowed|nightcore|8-?bit|soundalike|minus\s+one|re[ -]record(?:ed)?|rehearsal\s+version|backing\s+track|in\s+the\s+style\s+of|originally\s+performed|made\s+famous\s+by|a\s+colors\s+show|apple\s+music\s+(?:home\s+)?sessions?|infinity\s+station\s+sessions|(?:itunes|mahogany|ourvinyl|bedroom|backyard|lockdown|yum\s+cha|john\s+peel|david\s+jensen|sound\s+city|sawmills|windmill\s+lane|record\s+plant|air\s+studios|tiny\s+desk|kexp|siriusxm|npr(?:\s+music)?|spotify)\s+(?:sessions?|originals?|singles?)|itunes\s+originals|backyard\s+sessions(?:\s+edition)?|livestream\s+version|deconstructed(?:\s+mix)?|piano\s+jam\b|session\s+banter|mega-?mix|continuous\s+mix|rough\s+mix|dub\s+mix|vocal\s+club\s+mix|club\s+mix|extended\s+mix|vocal\s+mix|vip\s+(?:mix|mash-?up)|mash-?ups?|dj\s+set|mixed\s+by|alternate\s+(?:mix|mixes|edit|take|takes|version|versions|sequence|vocal(?:\s+version)?)|alt\.?\s+versions?|revised\s+(?:version|edit)|g-mix|(?:studio\s+)?outtakes?|bootleg\s+series|rare\s*&\s*unreleased|home\s+recordings?|original\s+session\s+takes?|(?:piano|orchestral|string|the\s+aretha)\s+version|piano\s+solo|piano\s*&\s*a\s+microphone|2d\s+piano\s+version|arr\.\s+for\s+(?:piano|guitar)|tabla\s+version|(?:3d\s+)?concert\s+experience|connection\s+tour|comeback\s+special|(?:nbc\s+)?tv\s+special|magical\s+christmas\s+special|breakfast\s+show|anniversary\s+show|from\s+cmt\s+invitation\s+only|tour\s+edits?|(?:piano|bass|guitar|wurlitzer|vocal|rock|quarantine)\s+covers?|discovered\s*&\s*covered|covermount|on\s+top\s+of\s+the\s+covers|the\s+con\s+x:\s*covers|echo\s+of\s+miles:.*-\s*covers|songs\s+of\s+kevn\s+kinney|songs\s+from\s+the\s+last\s+century|sessions\s+for\s+robert\s+j|the\s+spaghetti\s+incident|sings\s+the\s+great\s+diva\s+classics|the\s+hamilton\s+mixtape|box\s+set\s+bonus\s+track)\b/i;
    const nonSongOrMix = /(?:[([]\s*mixed\s*[)\]]|\bdj mix\b|^\s*skit\s*:|[([]\s*skit\s*[)\]]|\s[-–—]\s*beat\s*$|[([]\s*[^)\]]*\ba?\s*capp?ella\b[^)\]]*[)\]]|\s[-–—]\s*a?\s*capp?ella\b|[([]\s*(?:edited|clean(?:\s+version)?)\s*[)\]]|[([]\s*(?:[^)\]]*\s)?(?:covers?|cover\s+version)\s*[)\]]|\s[-–—]\s*(?:cover|directo)\s*$|[([]\s*(?:take\s+\d+|(?:\d{4}\s+)?unfinished|outtakes?|directo)\s*[)\]]|[([]\s*stripped(?:\s+(?:version|session|acoustic))?\s*[)\]]|\s[-–—]\s*stripped(?:\s+version)?\s*$|[([]\s*[^)\]]*\b(?:rework|refix|redux|predux)\b[^)\]]*[)\]]|\b(?:rework|refix)\s*(?:\(|\[|$)|[([]\s*(?:[^)\]]*\bstudios?,\s*[^)\]]*(?:19|20)\d{2}|(?:ttg|mayfair)\s+studios)\b[^)\]]*[)\]]|[([]\s*medley\s*[)\]]|\b(?:christmas|gospel|silent\s+night|ronnie\s+rising)\s+medley\b)/i;
    const liveMarker = /(?:[([][^)\]]*\blive\b|\s[-–—:]\s*live\b|\blive\s+(?:at|from)\b|^live$|\brecorded live\b|\blive recording\b|\brecorded\s+for\s+bbc\b|\bbbc\s+(?:sessions?|live|proms|radio\s+1)\b|\bat\s+the\s+royal\s+albert\s+hall\b|[([]\s*[^)\]]*\bstudio\s+rehearsal\b)/i;
    const liveAlbum = /\blive\s+(?:in|on|at|from|audio|concert|sessions?|killers|magic|rust|anthology|recordings?|global broadcast|and\s+sleazy)\b|\blive(?=\s*(?:$|[:.!@(/\[–—-]))|\bin concert\b|\bat\s+the\s+royal\s+albert\s+hall\b|\bbbc\s+(?:sessions?|live|proms|radio\s+1)\b/i;
    const nonStudioAlbum = /[([]\s*mixed\s*[)\]]|\bdj\s+mix\b|^(?:covers|under\s+cover|pinups|male)(?:\s*[-–—]\s*(?:ep|album))?(?:\s*\([^)]*\))?$|\)\s*covered$|^the\s+demos\b|-\s*covers$|\bat\s+[^)\]]+,\s*(?:19|20)\d{2}\b|\bstripped\s+(?:down|version|sessions?)\b|[([]\s*stripped\s+down\s*[)\]]|\bmixed\s+by\b/i;
    const coverArtist = /\b(?:piano\s+covers?|covers?\s+on\s+bass|string\s+quartet|the\s+piano\s+guys|piano\s+dreamers|lullaby\s+baby|baby\s+lullaby|kidz\s+bop|glee\s+cast|vitamin\s+string|midnite\s+string|royal\s+philharmonic|hit\s+crew|ameritz|karaoke|soundalike|tribute\s+to|relaxing\s+piano|rockabye\s+baby|smooth\s+jazz\s+all\s+stars|brooklyn\s+duo|2cellos|music\s+lab\s+(?:strings|collective))\b/i;
    const singleTitle = album.replace(/\s*[-–—]\s*(?:single|ep)$/i, '').trim();
    // Allow official studio EP titles named "Steve Lacy's Demo" without weakening demo filtering elsewhere.
    const filterAlbum = /^steve lacy['’]?s demo\b/i.test(album) ? '' : album;
    // Allow ordinary titles ending in "Live" (e.g. "Long Live - Single") or infinitives ("Learn To Live"),
    // without letting a single's explicit performance label bypass the filter.
    const namedSingle = singleTitle !== album && /\blive$/i.test(title) &&
      singleTitle.toLowerCase() === title.toLowerCase();
    const infinitiveLive = /\bto\s+live\s*$/i.test(album);
    return Boolean(title) && !alternate.test(title + ' ' + filterAlbum) && !nonSongOrMix.test(title) &&
      !nonStudioAlbum.test(album) && !coverArtist.test(artist) &&
      !liveMarker.test(title) && !liveMarker.test(album) && (namedSingle || infinitiveLive || !liveAlbum.test(album));
  }
  const policy = { isStudio };
  if (typeof module === 'object' && module.exports) module.exports = policy;
  else root.RecordingPolicy = policy;
})(typeof window === 'object' ? window : globalThis);
