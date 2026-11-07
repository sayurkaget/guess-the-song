/* Short, quiet game cues. No recording downloads or background music. */
(function () {
  'use strict';
  const cues = {
    correct: [[660, 0, .13], [880, .1, .22]],
    wrong: [[220, 0, .12], [165, .09, .16]],
    complete: [[523.25, 0, .15], [659.25, .12, .15], [783.99, .24, .28]],
    missed: [[261.63, 0, .18], [196, .15, .25]]
  };

  function create(getVolume) {
    let context, master, generation = 0;
    const voices = new Set();
    const volume = () => Math.min(1, Math.max(0, Number(getVolume()) || 0));
    function stop() {
      generation++;
      for (const voice of voices) {
        try { voice.osc.stop(); } catch (_) {}
        voice.osc.disconnect(); voice.gain.disconnect();
      }
      voices.clear();
    }
    function sync() {
      if (master) master.gain.setTargetAtTime(volume() * .12, context.currentTime, .01);
    }
    async function play(name) {
      stop();
      const notes = cues[name];
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!notes || !volume() || !AudioContext) return;
      const request = generation, requestedAt = Date.now();
      try {
        if (!context) {
          context = new AudioContext();
          master = context.createGain();
          master.connect(context.destination);
        }
        if (context.state !== 'running') await context.resume();
        // Never replay a stale cue after a tab switch or blocked autoplay.
        if (generation !== request || !volume() || context.state !== 'running' || Date.now() - requestedAt > 500) return;
        master.gain.setValueAtTime(volume() * .12, context.currentTime);
        for (const [frequency, offset, duration] of notes) {
          const osc = context.createOscillator(), gain = context.createGain();
          const start = context.currentTime + offset;
          const voice = { osc, gain };
          voices.add(voice);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency, start);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(.7, start + .012);
          gain.gain.linearRampToValueAtTime(0, start + duration);
          osc.connect(gain); gain.connect(master);
          osc.onended = () => { osc.disconnect(); gain.disconnect(); voices.delete(voice); };
          osc.start(start); osc.stop(start + duration + .02);
        }
      } catch (_) {
        // Audio support or autoplay restrictions must never interrupt a guess.
        stop();
      }
    }
    return { play, stop, sync };
  }
  window.GameSounds = { create };
})();
