const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createModel, deliver, copy } = require('../result-image.js');
const ladder = [.1, .5, 2, 8, 15];
const win = { done: true, won: true, title: 'SECRET SONG', artist: 'SECRET ARTIST', guesses: [{t:'skip'}, {t:'wrong'}, {t:'right'}] };

test('score card uses completed outcomes and exact clip lengths without leaking songs', () => {
  const m = createModel({ mode:'regular', stages:[win, {done:true,won:false,guesses:[{t:'near'}]}, {done:false,won:true}], ladder, url:'https://namethetrack.pages.dev/' });
  assert.equal(m.score, 1);
  assert.equal(m.rows.length, 5);
  assert.equal(m.rows[0].result, '2s');
  assert.equal(m.rows[1].result, 'Missed');
  assert.equal(m.rows[2].result, 'Not played');
  assert.deepEqual(m.rows[0].attempts, ['skip','wrong','right','empty','empty']);
  assert.doesNotMatch(JSON.stringify(m), /SECRET/);
});
test('Daily has one song, its saved date and win streak, never the answer', () => {
  const m=createModel({mode:'daily',day:'2026-11-09',streak:3,stages:[win,win],ladder});
  assert.equal(m.total,1);assert.equal(m.score,1);assert.equal(m.rows.length,1);
  assert.equal(m.subtitle,'2026-11-09');assert.equal(m.streak,3);
  assert.doesNotMatch(JSON.stringify(m), /SECRET/);
});
test('Custom labels remain Song 1 through Song 5; snapshot does not change with state', () => {
  const stages=[structuredClone(win)];
  const m=createModel({mode:'custom',subtitle:'A favorite artist',stages,ladder});
  stages[0].guesses[2].t='wrong';
  assert.equal(m.rows[0].label,'Song 1');assert.equal(m.rows[4].label,'Song 5');
  assert.equal(m.rows[0].attempts[2],'right');
});
test('native sharing is called immediately with the prepared file', async () => {
  const file={name:'score.png'};let called=false;
  const result=deliver(file,{navigator:{canShare:({files})=>files[0]===file,share:({files})=>{called=true;assert.equal(files[0],file);return Promise.resolve();}},download(){assert.fail('No download');}});
  assert.ok(called);assert.equal(await result,'shared');
});
test('cancelled share never downloads an unwanted image', async () => {
  assert.equal(await deliver({}, {navigator:{canShare:()=>true,share:async()=>{throw Object.assign(new Error(),{name:'AbortError'});}},download(){assert.fail('No download on cancel');}}),'cancelled');
});
test('unsupported and failed sharing download the image', async () => {
  for (const navigator of [{}, {canShare:()=>false}, {canShare:()=>true,share:async()=>{throw new Error('Unavailable');}}]) {
    let count=0;assert.equal(await deliver({}, {navigator,download(){count++;}}),'downloaded');assert.equal(count,1);
  }
});

test('copy writes PNG image and text+link together via ClipboardItem', async () => {
  const file = { type: 'image/png', name: 'card.png' };
  const text = 'TuneUp · All songs · 4/5\nhttps://namethetrack.pages.dev/';
  let written = null;
  class FakeClipboardItem { constructor(data) { this.data = data; } }
  class FakeBlob { constructor(parts, opts) { this.parts = parts; this.type = opts.type; } }
  const res = await copy(file, text, {
    ClipboardItem: FakeClipboardItem,
    Blob: FakeBlob,
    navigator: { clipboard: { write: async (items) => { written = items; } } }
  });
  assert.equal(res, 'copied-both');
  assert.equal(written.length, 1);
  assert.equal(written[0].data['image/png'], file);
  assert.equal(written[0].data['text/plain'].parts[0], text);
  assert.equal(written[0].data['text/plain'].type, 'text/plain');
});

test('copy handles async image promise and retries resolved blob when browser rejects promises in ClipboardItem', async () => {
  const file = { type: 'image/png', name: 'card.png' };
  let writes = 0;
  class PromiseHostileClipboardItem {
    constructor(data) {
      if (typeof data['image/png'].then === 'function') throw new TypeError('Promise not allowed');
      this.data = data;
    }
  }
  class FakeBlob { constructor(parts, opts) { this.parts = parts; this.type = opts.type; } }
  const res = await copy(Promise.resolve(file), 'Score text https://namethetrack.pages.dev/', {
    ClipboardItem: PromiseHostileClipboardItem,
    Blob: FakeBlob,
    navigator: { clipboard: { write: async () => { writes++; } } }
  });
  assert.equal(res, 'copied-both');
  assert.equal(writes, 1);
});

test('copy falls back cleanly to writeText, legacy copyText, and failed state', async () => {
  const text = 'TuneUp · 5/5\nhttps://namethetrack.pages.dev/';
  class FakeClipboardItem { constructor(data) { this.data = data; } }
  class FakeBlob { constructor(parts, opts) { this.parts = parts; this.type = opts.type; } }
  let copiedText = '';
  const res1 = await copy({ type: 'image/png' }, text, {
    ClipboardItem: FakeClipboardItem,
    Blob: FakeBlob,
    navigator: {
      clipboard: {
        write: async () => { throw new Error('Multi-MIME rejected'); },
        writeText: async (v) => { copiedText = v; }
      }
    }
  });
  assert.equal(res1, 'copied-text');
  assert.equal(copiedText, text);

  let legacyCopied = '';
  const res2 = await copy(null, text, {
    navigator: {},
    copyText: (v) => { legacyCopied = v; return true; }
  });
  assert.equal(res2, 'copied-text');
  assert.equal(legacyCopied, text);

  assert.equal(await copy(null, text, { navigator: {}, copyText: () => false }), 'failed');
});
