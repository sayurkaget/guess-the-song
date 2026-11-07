/* Versioned, title-free links for a single exact Apple Music recording. */
(function () {
  'use strict';
  const lengths = [0.1, 0.5, 2, 8, 15];
  const validId = (id) => /^[1-9]\d{0,15}$/.test(String(id));
  function parse(hash) {
    const match = /^#challenge=1\.([1-9]\d{0,15})\.([0-5])$/.exec(hash);
    return match ? { id: match[1], result: Number(match[2]) } : null;
  }
  function create(base, id, result) {
    if (!validId(id) || !Number.isInteger(result) || result < 0 || result > 5) throw new Error('Invalid challenge');
    return base.split('#')[0] + '#challenge=1.' + id + '.' + result;
  }
  function describe(result) {
    return result === 0 ? 'missed the song' : 'guessed in ' + lengths[result - 1] + 's';
  }
  function compare(friend, yours) {
    if (friend === yours) return "It's a tie!";
    if (yours && (!friend || yours < friend)) return 'You beat your friend!';
    return 'Your friend wins this round.';
  }
  async function lookup(id) {
    if (!validId(id)) throw new Error('Invalid track');
    const response = await fetch('https://itunes.apple.com/lookup?id=' + id + '&entity=song&country=US', { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Track lookup failed');
    const data = JSON.parse(await response.text());
    const track = (data.results || []).find((r) => String(r.trackId) === String(id) && r.wrapperType === 'track' && r.kind === 'song');
    if (!track || !track.previewUrl || !track.trackName || !track.artistName) throw new Error('Preview unavailable');
    if (!window.RecordingPolicy.isStudio(track)) throw new Error('Studio recording unavailable');
    return track;
  }
  window.TrackChallenge = { parse, create, describe, compare, lookup };
})();
