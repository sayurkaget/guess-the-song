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
test('opening a new result cancels the previous animation loop', () => {
  const t=setup(); t.context.animate('first','win'); t.context.animate('second','lose');
  assert.equal(t.pending.size,1);
});
test('hidden tabs stop drawing and scheduling confetti', () => {
  const t=setup(); t.context.animate('first','win'); const before=t.draws();
  t.document.hidden=true; t.frame(16.67);
  assert.equal(t.draws(),before); assert.equal(t.pending.size,0);
});
