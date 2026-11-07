/* Fetch metadata only. Audio previews are never downloaded. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { isStudio } = require('../recordings.js');
const root = path.join(__dirname, '..');
const cacheDir = path.join(root, '.catalog-cache');
const cachedOnly = process.argv.includes('--cached-only');
fs.mkdirSync(cacheDir, { recursive: true });
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'songs.js'), 'utf8'), context);
const original = context.window.SONGS;
const artists = [...new Set(original.map(song => song[1]))];
const artistKey = value => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  .replace(/\b(?:and|the)\b/g, '').replace(/[^\p{L}\p{N}]/gu, '');
const songKey = (title, artist) => (title.replace(/\s*[-–—]\s*(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?\s*$/i, '') + ' ' + artist).toLowerCase().normalize('NFD')
  .replace(/\p{M}/gu, '').replace(/\(.*?\)|\[.*?\]/g, ' ')
  .replace(/['’ʼ`´]/g, '').replace(/\$/g, 's')
  .replace(/\b(feat|ft|with|and|the|dari|from)\b/g, ' ')
  .replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
function genre(value) {
  if (/hip.hop|rap/i.test(value)) return 'hiphop';
  if (/r&b|soul/i.test(value)) return 'rnb';
  if (/dance|electronic|house/i.test(value)) return 'edm';
  if (/indie|alternative/i.test(value)) return 'indie';
  if (/rock|metal|punk/i.test(value)) return 'rock';
  if (/pop/i.test(value)) return 'pop';
  return 'lain';
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fetchArtist(artist, index) {
  const cacheFile = path.join(cacheDir, index + '.json');
  if (fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (cached.artist === artist) return cached;
  }
  if (cachedOnly) throw new Error('Metadata not cached');
  const url = new URL('https://itunes.apple.com/search');
  url.search = new URLSearchParams({ term: artist, attribute: 'artistTerm', entity: 'song', limit: '200', country: 'US' });
  const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const data = await response.json();
  if (!Array.isArray(data.results)) throw new Error('Invalid catalogue response');
  const result = { artist, fetchedAt: new Date().toISOString(), results: data.results };
  fs.writeFileSync(cacheFile, JSON.stringify(result));
  return result;
}
async function main() {
  const rows = original.filter(song => isStudio({ title: song[0] }));
  const seen = new Set(rows.map(song => songKey(song[0], song[1])));
  let added = 0;
  const failures = [], perArtist = [];
  for (let index = 0; index < artists.length; index++) {
    const artist = artists[index], start = Date.now();
    let count = 0;
    try {
      const batch = await fetchArtist(artist, index);
      for (const track of batch.results) {
        if (track.wrapperType !== 'track' || track.kind !== 'song' || !track.previewUrl ||
            artistKey(track.artistName || '') !== artistKey(artist) || !isStudio(track)) continue;
        const key = songKey(track.trackName, artist);
        if (seen.has(key)) continue;
        const year = Number((track.releaseDate || '').slice(0, 4));
        if (!year) continue;
        seen.add(key);
        rows.push([track.trackName, artist, 4, 'gl', genre(track.primaryGenreName || ''), year,
          (track.artworkUrl100 || '').replace('100x100', '300x300'), track.trackId]);
        added++;
        count++;
      }
      perArtist.push({ artist, added: count });
    } catch (error) {
      failures.push({ artist, error: error.message });
    }
    if ((index + 1) % 10 === 0 || index === artists.length - 1) {
      const report = { original: original.length, removed: original.length - original.filter(song => isStudio({ title: song[0] })).length,
        processed: index + 1, artists: artists.length, added, total: rows.length, failures, perArtist };
      fs.writeFileSync(path.join(cacheDir, 'report.json'), JSON.stringify(report, null, 2));
      fs.writeFileSync(path.join(cacheDir, 'songs-expanded.js'),
        '/* Western catalogue. Format: [title, artist, tier, region, genre, year, artwork, optional iTunes ID]. */\nwindow.SONGS = [\n' +
        rows.map(row => '  ' + JSON.stringify(row)).join(',\n') + '\n];\n');
      console.log(JSON.stringify({ processed: index + 1, artists: artists.length, added, total: rows.length, failures: failures.length }));
    }
    // Keep below Apple's approximate 20-request/minute search limit.
    if (!cachedOnly) await sleep(Math.max(0, 3200 - (Date.now() - start)));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
