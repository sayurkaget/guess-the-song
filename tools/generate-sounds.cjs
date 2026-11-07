/* Original synthesized game cues; 16-bit mono PCM, no third-party recordings. */
const fs = require('node:fs');
const path = require('node:path');
const sampleRate = 22050;
const cues = {
  correct: [[659.25, 0, .18], [880, .13, .28]],
  wrong: [[330, 0, .16], [261.63, .12, .22]],
  complete: [[523.25, 0, .2], [659.25, .15, .2], [783.99, .3, .32]],
  missed: [[349.23, 0, .2], [261.63, .17, .3]]
};
const out = path.join(__dirname, '../sounds');
fs.mkdirSync(out, { recursive: true });
for (const [name, notes] of Object.entries(cues)) {
  const duration = Math.max(...notes.map(([, start, length]) => start + length)) + .03;
  const count = Math.ceil(sampleRate * duration);
  const samples = new Float64Array(count);
  for (const [frequency, start, length] of notes) {
    for (let i = Math.ceil(start * sampleRate); i < Math.min(count, (start + length) * sampleRate); i++) {
      const t = i / sampleRate - start;
      const envelope = Math.min(1, t / .012) * Math.pow(Math.max(0, 1 - t / length), .6);
      const phase = 2 * Math.PI * frequency * t;
      samples[i] += envelope * (Math.sin(phase) + .18 * Math.sin(2 * phase));
    }
  }
  const peak = samples.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
  const wav = Buffer.alloc(44 + count * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
  wav.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) wav.writeInt16LE(Math.round(samples[i] / peak * .72 * 32767), 44 + i * 2);
  fs.writeFileSync(path.join(out, name + '.wav'), wav);
}
