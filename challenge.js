/* Versioned, title-free links for exact Apple Music recordings. */
(function () {
  'use strict';
  const lengths = [0.1, 0.5, 2, 8, 15];
  const maxStages = 5;
  const validId = (id) => /^[1-9]\d{0,15}$/.test(String(id));

  function parse(hash) {
    const match = /^#challenge=1\.([1-9]\d{0,15})\.([0-5])$/.exec(hash);
    return match ? { id: match[1], result: Number(match[2]) } : null;
  }

  function create(base, id, result) {
    if (!validId(id) || !Number.isInteger(result) || result < 0 || result > 5) throw new Error('Invalid challenge');
    return base.split('#')[0] + '#challenge=1.' + id + '.' + result;
  }

  function parseRun(hash) {
    const match = /^#run=1\.(c|a([1-9]\d{0,15}))\.([1-9]\d{0,15}(?:-[1-9]\d{0,15}){0,4})\.([0-5]{1,5})$/.exec(hash);
    if (!match) return null;
    const ids = match[3].split('-');
    const results = match[4].split('').map(Number);
    if (ids.length !== results.length || ids.length > maxStages) return null;
    return { ids, results, artistId: match[2] || null };
  }

  function createRun(base, ids, results, artistId) {
    if (!Array.isArray(ids) || !Array.isArray(results) ||
        !ids.length || ids.length > maxStages || ids.length !== results.length ||
        !ids.every(validId) ||
        !results.every((r) => Number.isInteger(r) && r >= 0 && r <= 5) ||
        (artistId != null && artistId !== '' && !validId(artistId))) {
      throw new Error('Invalid run challenge');
    }
    const mode = artistId != null && artistId !== '' ? 'a' + artistId : 'c';
    return base.split('#')[0] + '#run=1.' + mode + '.' + ids.join('-') + '.' + results.join('');
  }

  function describe(result) {
    return result === 0 ? 'missed the song' : 'guessed in ' + lengths[result - 1] + 's';
  }

  function runScore(results) {
    return (results || []).filter((r) => r > 0).length;
  }

  function describeRun(results) {
    const count = (results || []).length;
    return runScore(results) + '/' + count + ' ' + (count === 1 ? 'song' : 'songs');
  }

  function compare(friend, yours) {
    if (friend === yours) return "It's a tie!";
    if (yours && (!friend || yours < friend)) return 'You beat your friend!';
    return 'Your friend wins this round.';
  }

  function compareRun(friendResults, yourResults) {
    const friend = runScore(friendResults), yours = runScore(yourResults);
    if (yours === friend) return "It's a tie!";
    return yours > friend ? 'You beat your friend!' : 'Your friend wins this round.';
  }

  async function lookupTracks(ids) {
    if (!Array.isArray(ids) || !ids.length || ids.length > maxStages || !ids.every(validId)) {
      throw new Error('Invalid track');
    }
    const response = await fetch('https://itunes.apple.com/lookup?id=' + ids.join(',') + '&entity=song&country=US', {
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('Track lookup failed');
    const data = JSON.parse(await response.text());
    const byId = new Map();
    for (const r of (data.results || [])) {
      if (r && r.trackId != null && r.wrapperType === 'track' && r.kind === 'song') {
        byId.set(String(r.trackId), r);
      }
    }
    return ids.map((id) => {
      const track = byId.get(String(id));
      if (!track || !track.previewUrl || !track.trackName || !track.artistName) throw new Error('Preview unavailable');
      if (!window.RecordingPolicy.isStudio(track)) throw new Error('Studio recording unavailable');
      return track;
    });
  }

  async function lookup(id) {
    return (await lookupTracks([id]))[0];
  }

  window.TrackChallenge = {
    parse, create, describe, compare, lookup,
    parseRun, createRun, describeRun, compareRun, lookupRun: lookupTracks
  };
})();
