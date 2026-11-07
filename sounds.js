/* Use the same media playback path as the song clips. */
(function () {
  'use strict';
  const cues = new Set(['correct', 'wrong', 'complete', 'missed']);
  function create(getVolume) {
    let player = null, generation = 0, timeout;
    const volume = () => Math.min(1, Math.max(0, Number(getVolume()) || 0));
    function stop() {
      generation++;
      clearTimeout(timeout);
      if (player) { player.pause(); player = null; }
    }
    function sync() {
      if (!volume()) stop();
      else if (player) player.volume = volume() * .65;
    }
    async function play(name) {
      stop();
      if (!cues.has(name) || !volume() || !window.Audio) return;
      const request = generation;
      try {
        const audio = new window.Audio('sounds/' + name + '.wav');
        player = audio;
        audio.volume = volume() * .65;
        audio.onended = audio.onerror = () => { if (player === audio) stop(); };
        // A failed download must not leave the song ducked or play a late cue.
        timeout = setTimeout(() => { if (player === audio) stop(); }, 2000);
        await audio.play();
        if (request !== generation) audio.pause();
      } catch (_) {
        if (request === generation) stop();
      }
    }
    return { play, stop, sync, active: () => player !== null };
  }
  window.GameSounds = { create };
})();
