const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup(options = {}) {
  const notes = [], gains = [];
  let volume = 1, contexts = 0, resume;
  const param = () => ({ value: 0, setValueAtTime(v) { this.value = v; },
    linearRampToValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; } });
  class Context {
    constructor() { contexts++; this.currentTime = 0; this.state = options.suspended ? 'suspended' : 'running'; this.destination = {}; }
    resume() { return new Promise((resolve, reject) => { resume = () => { this.state = 'running'; options.reject ? reject(new Error('blocked')) : resolve(); }; }); }
    createGain() { const g = { gain: param(), connect() {}, disconnect() {} }; gains.push(g); return g; }
    createOscillator() { const n = { frequency: param(), connect() {}, disconnect() { this.disconnected = true; },
      start(t) { this.startTime = t; }, stop(t) { this.stopTime = t; } }; notes.push(n); return n; }
  }
  const window = { AudioContext: options.unsupported ? undefined : Context };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../sounds.js'), 'utf8'), { window, Date });
  const sound = window.GameSounds.create(() => volume);
  return { sound, notes, gains, volume: v => { volume = v; }, contexts: () => contexts, resume: () => resume() };
}

test('effects are lazy, brief and follow mute and volume immediately', async () => {
  const t = setup();
  assert.equal(t.contexts(), 0);
  t.volume(0); await t.sound.play('correct'); assert.equal(t.contexts(), 0);
  t.volume(0.5); await t.sound.play('correct');
  assert.ok(t.notes.length > 0);
  assert.ok(t.notes.every(n => n.stopTime < 1 && n.stopTime > n.startTime));
  assert.ok(t.gains[0].gain.value > 0 && t.gains[0].gain.value <= 0.1);
  t.volume(0); t.sound.sync(); assert.equal(t.gains[0].gain.value, 0);
  t.sound.stop(); assert.ok(t.notes.every(n => n.disconnected));
});

test('starting another effect replaces old notes', async () => {
  const t = setup(); await t.sound.play('wrong'); const old = [...t.notes];
  await t.sound.play('complete'); assert.ok(old.every(n => n.disconnected));
  assert.equal(t.contexts(), 1);
});

test('cancelled or muted pending playback never produces delayed sounds', async () => {
  for (const cancel of [t => t.sound.stop(), t => t.volume(0)]) {
    const t = setup({ suspended: true }); const pending = t.sound.play('correct');
    cancel(t); t.resume(); await pending; assert.equal(t.notes.length, 0);
  }
});

test('unsupported or blocked browser audio does not break the game', async () => {
  await setup({ unsupported: true }).sound.play('correct');
  const t = setup({ suspended: true, reject: true });
  const pending = t.sound.play('wrong'); t.resume(); await pending;
  assert.equal(t.notes.length, 0);
});
