const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'functions/api/feedback.js'), 'utf8');
const handler = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const valid = { category: 'bug', message: 'Audio did not load', email: '', 'game-details': 'Daily', 'bot-field': '' };
async function submit(values = valid, overrides = {}, database) {
  const writes = [];
  const db = database || { prepare(sql) { return { bind(...args) { writes.push({ sql, args }); return { run: async () => ({ success: true }) }; } }; } };
  const request = new Request('https://example.pages.dev/api/feedback', {
    method: 'POST', headers: { Origin: 'https://example.pages.dev', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values), ...overrides
  });
  const response = await (await handler).onRequest({ request, env: { FEEDBACK_DB: db } });
  return { response, writes };
}
test('Cloudflare feedback saves only explicit fields and confirms durable receipt', async () => {
  const { response, writes } = await submit({ ...valid, message: "  It's a bug  " });
  assert.equal(response.status, 201); assert.equal((await response.json()).ok, true);
  assert.equal(writes.length, 1); assert.match(writes[0].sql, /VALUES \(\?, \?, \?, \?, \?, \?\)/);
  assert.deepEqual(writes[0].args.slice(2), ['bug', "It's a bug", '', 'Daily']);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
test('feedback rejects cross-origin, oversized and invalid submissions without writing', async () => {
  const cases = [
    [valid, { method: 'GET', body: undefined }, 405],
    [valid, { headers: { Origin: 'https://evil.example' } }, 403],
    [{ ...valid, message: 'x'.repeat(21000) }, {}, 413],
    [{ ...valid, 'bot-field': 'spam' }, {}, 400],
    [{ ...valid, message: '  ' }, {}, 400],
    [{ ...valid, email: 'invalid' }, {}, 400],
    [{ ...valid, category: 'unknown' }, {}, 400],
    [{ ...valid, 'game-details': 'x'.repeat(601) }, {}, 400]
  ];
  for (const [values, options, status] of cases) {
    const result = await submit(values, options);
    assert.equal(result.response.status, status); assert.equal(result.writes.length, 0);
  }
});
test('feedback storage failure is never reported as success', async () => {
  for (const run of [async () => ({ success: false }), async () => { throw new Error('offline'); }]) {
    const { response } = await submit(valid, {}, { prepare: () => ({ bind: () => ({ run }) }) });
    assert.equal(response.status, 503); assert.equal((await response.json()).ok, false);
  }
});
test('Cloudflare bundle uses its own URLs, isolates APIs, and preserves the original site', () => {
  const original = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  execFileSync(process.execPath, [path.join(root, 'tools/build-cloudflare.cjs')], { env: { ...process.env, SITE_URL: 'https://namethetrack.pages.dev' } });
  const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  assert.match(html, /action="\/api\/feedback" data-feedback-api="true"/);
  assert.ok(!html.includes('data-netlify=')); assert.ok(!html.includes('namethetrack.netlify.app'));
  assert.ok(fs.readFileSync(path.join(root, 'dist/analytics.js'), 'utf8').includes('location.hostname === "namethetrack.pages.dev"'));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'dist/_routes.json'))).include, ['/api/*']);
  assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), original);
  assert.deepEqual(fs.readFileSync(path.join(root, 'dist/songs.js')), fs.readFileSync(path.join(root, 'songs.js')));
  assert.deepEqual(fs.readFileSync(path.join(root, 'dist/daily-pool-v1.js')), fs.readFileSync(path.join(root, 'daily-pool-v1.js')));
  assert.ok(!fs.existsSync(path.join(root, 'dist/.catalog-cache')));
});
