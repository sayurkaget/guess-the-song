const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const Backup = require(path.join(ROOT, 'backup.js'));

function makeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    get length() { return map.size; },
    key(i) { return [...map.keys()][i] ?? null; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(String(k), String(v)); },
    removeItem(k) { map.delete(k); },
    dump() { return Object.fromEntries(map.entries()); }
  };
}

test('TuneUpBackup.collect includes user tl:* entries and excludes preview cache & foreign keys', () => {
  const st = makeStorage({
    'tl:stats:gl:all:all': JSON.stringify({ runs: 4, total: 18, best: 5, perfect: 2, dist: [0, 0, 0, 1, 1, 2] }),
    'tl:daily:completed': JSON.stringify(['2026-11-18', '2026-11-19']),
    'tl:set:sfx': 'false',
    'tl:trk5:some-song': JSON.stringify({ preview: 'https://x/p.m4a', exp: 9999999999999 }),
    'other:key': '"ignore"'
  });
  const got = Backup.collect(st);
  assert.deepEqual(Object.keys(got).sort(), ['tl:daily:completed', 'tl:set:sfx', 'tl:stats:gl:all:all']);
});

test('TuneUpBackup encode/decode round-trip handles Unicode & rejects tampered or empty codes', () => {
  const entries = {
    'tl:custom:recent': JSON.stringify([{ id: '1', name: 'Beyoncé' }, { id: '2', name: 'Céline Dion' }]),
    'tl:song:streak': JSON.stringify({ current: 7, best: 12 }),
    'tl:set:autoplay': 'false'
  };
  const code = Backup.encode(entries, 1700000000000);
  assert.ok(code.startsWith('TUNEUP1.'));

  // Tolerates whitespace/newlines added when pasting from chat apps
  const decoded = Backup.decode('  ' + code.slice(0, 20) + '\n' + code.slice(20) + '  ');
  assert.equal(decoded.ok, true);
  assert.equal(decoded.count, 3);
  assert.equal(decoded.createdAt, 1700000000000);
  assert.deepEqual(decoded.entries, entries);

  // Tampered checksum/body rejected
  const tampered = code.slice(0, -1) + (code.endsWith('a') ? 'b' : 'a');
  assert.match(Backup.decode(tampered).error, /damaged|incomplete/i);

  // Wrong prefix or empty rejected
  assert.match(Backup.decode('').error, /paste/i);
  assert.match(Backup.decode('OTHER1.abc.def').error, /TuneUp backup/i);
  assert.match(Backup.decode(Backup.encode({})).error, /empty/i);
});

test('TuneUpBackup.restore replaces user keys while keeping preview cache, and clear removes all tl:* keys', () => {
  const st = makeStorage({
    'tl:stats:gl:all:all': JSON.stringify({ runs: 1 }),
    'tl:daily:v2:2026-11-18': JSON.stringify({ runDone: true }),
    'tl:trk5:cached': JSON.stringify({ preview: 'https://p' }),
    'unrelated': '"keep"'
  });
  const written = Backup.restore(st, {
    'tl:stats:gl:pop:all': JSON.stringify({ runs: 9, best: 5 }),
    'tl:set:hover': 'false',
    'tl:duel:hoverPlay': 'false'
  });
  assert.equal(written, 3);
  const afterRestore = st.dump();
  assert.equal(afterRestore['tl:stats:gl:all:all'], undefined);
  assert.equal(afterRestore['tl:daily:v2:2026-11-18'], undefined);
  assert.equal(afterRestore['tl:stats:gl:pop:all'], JSON.stringify({ runs: 9, best: 5 }));
  assert.equal(afterRestore['tl:trk5:cached'], JSON.stringify({ preview: 'https://p' }));
  assert.equal(afterRestore['unrelated'], '"keep"');

  const cleared = Backup.clear(st);
  assert.equal(cleared, 4); // 3 restored user keys + 1 tl:trk5 cache key
  assert.deepEqual(st.dump(), { unrelated: '"keep"' });
});

test('Settings modal, backup script, SW shell, and Cloudflare build are wired', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /id="openSettings"/);
  assert.match(html, /id="settingsModal"/);
  assert.match(html, /id="setAutoplay"/);
  assert.match(html, /id="setSfx"/);
  assert.match(html, /id="setHover"/);
  assert.match(html, /id="backupCode"/);
  assert.match(html, /id="backupCopy"/);
  assert.match(html, /id="backupRestore"/);
  assert.match(html, /id="resetAllData"/);
  assert.match(html, /<script src="backup\.js"(?:\s+defer)?><\/script>/);

  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /'\.\/backup\.js'/);

  const build = fs.readFileSync(path.join(ROOT, 'tools/build-cloudflare.cjs'), 'utf8');
  assert.match(build, /'backup\.js'/);
});
