const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(width = 1920, height = 1080, dpr = 2) {
  let draws = 0, next = 0;
  const pending = new Map();
  const ctx = { clearRect() {}, save() {}, translate() {}, rotate() {}, restore() {}, fillRect() { draws++; } };
  const canvases = { first: { getContext: () => ctx }, second: { getContext: () => ctx } };
  const document = { hidden: false };
  const context = vm.createContext({ $, document, window: { devicePixelRatio: dpr }, innerWidth: width, innerHeight: height,
    matchMedia: () => ({ matches: false }), performance: { now: () => 0 },
    requestAnimationFrame(fn) { pending.set(++next, fn); return next; }, cancelAnimationFrame(id) { pending.delete(id); } });
  function $(sel) { return canvases[sel]; }
  const app = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
  const source = app.slice(app.indexOf('  let confettiStop = null;'), app.indexOf('  /* ================= modal & toast'));
  vm.runInContext(source + '\nglobalThis.animate = confetti;', context);
  return { context, pending, canvases, document, draws: () => draws,
    frame(time) { const [id, fn] = pending.entries().next().value; pending.delete(id); fn(time); } };
}

test('large desktop canvases stay within a bounded pixel budget', () => {
  for (const [w, h, dpr] of [[1920,1080,2],[3840,2160,2],[390,844,3]]) {
    const t = setup(w,h,dpr); t.context.animate('first','win');
    const cv=t.canvases.first;
    assert.ok(cv.width*cv.height<=1200000, `${w}x${h}: ${cv.width*cv.height} pixels`);
    assert.ok(Math.abs(cv.width/cv.height-w/h)<.01);
    assert.equal(t.draws(),120);
  }
});
test('opening a new result cancels the previous animation loop and skips confetti on lose', () => {
  const t = setup();
  t.context.animate('first', 'win');
  t.context.animate('second', 'win');
  assert.equal(t.pending.size, 1);
  t.context.animate('second', 'lose');
  assert.equal(t.pending.size, 0);
});
test('hidden tabs stop drawing and scheduling confetti', () => {
  const t=setup(); t.context.animate('first','win'); const before=t.draws();
  t.document.hidden=true; t.frame(16.67);
  assert.equal(t.draws(),before); assert.equal(t.pending.size,0);
});

test('audio clock writes only when its displayed tenth changes', () => {
  const app = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
  const source = app.slice(app.indexOf('    readout(t) {'), app.indexOf('    status(msg, err) {'));
  const ui = vm.runInNewContext('({' + source + '})', {
    S: { done: false }, fmt: n => n + 's', limit: () => 0.1, maxLen: () => 15
  });
  let value = '', writes = 0;
  ui.out = { get textContent() { return value; }, set textContent(v) { value = v; writes++; } };
  for (let frame = 0; frame < 60; frame++) ui.readout(frame / 60);
  assert.equal(value, '1.0s');
  assert.equal(writes, 11);
  ui.readout(null);
  assert.equal(value, '0.1s');
});

test('playhead moves without changing layout and clamps at both ends', () => {
  const app = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
  const source = app.slice(app.indexOf('    readout(t) {'), app.indexOf('    status(msg, err) {'));
  const ui = vm.runInNewContext('({' + source + '})');
  const classes = new Set();
  ui.headEl = { style: {}, classList: { add: s => classes.add(s), remove: s => classes.delete(s) } };
  for (const [f, percent] of [[-1, 0], [0.5, 50], [2, 100]]) {
    ui.head(f);
    assert.equal(ui.headEl.style.transform, `translate3d(${percent}%, -50%, 0)`);
    assert.equal(ui.headEl.style.left, undefined);
  }
  ui.head(null);
  assert.equal(classes.has('on'), false);
});

test('playSweep updates played progress bar via GPU scaleX without layout width writes', () => {
  const app = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
  const source = app.slice(app.indexOf('    playSweep(f, t) {'), app.indexOf('    // Lobi hanya menghitung ulang'));
  const pEl = { style: {} };
  const curEl = { textContent: '' };
  const ui = vm.runInNewContext('({' + source + '})', {
    $: (sel) => (sel === '#trackPlayed' ? pEl : sel === '#trackCur' ? curEl : null)
  });
  ui.playSweep(0.45, 3.24);
  assert.equal(pEl.style.transform, 'scaleX(0.45)');
  assert.equal(pEl.style.width, undefined);
  assert.equal(curEl.textContent, '3.2s');
  ui.playSweep(null, null);
  assert.equal(pEl.style.transform, 'scaleX(0)');
  assert.equal(curEl.textContent, '0.0s');
});
