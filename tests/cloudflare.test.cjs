const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
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
  const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), 'tuneup-cf-'));
  try {
    execFileSync(process.execPath, [path.join(root, 'tools/build-cloudflare.cjs')], {
      env: { ...process.env, SITE_URL: 'https://tuneup.pages.dev', OUT_DIR: tmpOut }
    });
    const html = fs.readFileSync(path.join(tmpOut, 'index.html'), 'utf8');
    assert.match(html, /action="\/api\/feedback" data-feedback-api="true"/);
    assert.ok(!html.includes('data-netlify='));
    assert.ok(!html.includes('namethetrack.netlify.app'));
    assert.ok(!html.includes('namethetrack.pages.dev'));
    assert.ok(html.includes('https://tuneup.pages.dev/'));
    assert.ok(fs.readFileSync(path.join(tmpOut, 'robots.txt'), 'utf8').includes('https://tuneup.pages.dev/sitemap.xml'));
    assert.ok(fs.readFileSync(path.join(tmpOut, 'sitemap.xml'), 'utf8').includes('https://tuneup.pages.dev/'));
    assert.ok(fs.readFileSync(path.join(tmpOut, 'analytics.js'), 'utf8').includes('location.hostname === "tuneup.pages.dev"'));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(tmpOut, '_routes.json'))).include, ['/api/*']);
    assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), original);
    assert.deepEqual(fs.readFileSync(path.join(tmpOut, 'songs.js')), fs.readFileSync(path.join(root, 'songs.js')));
    assert.deepEqual(fs.readFileSync(path.join(tmpOut, 'daily-pool-v1.js')), fs.readFileSync(path.join(root, 'daily-pool-v1.js')));
    assert.ok(!fs.existsSync(path.join(tmpOut, '.catalog-cache')));
    assert.ok(!/noindex/i.test(html), 'Production must remain indexable');
    const headers = path.join(tmpOut, '_headers');
    assert.ok(!fs.existsSync(headers) || !/noindex/i.test(fs.readFileSync(headers, 'utf8')));
    for (const asset of ['layout.css','site-guide.css','site-guide.js','fonts/GeneralSans-Variable.woff2','fonts/CabinetGrotesk-Variable.woff2']) {
      assert.ok(fs.statSync(path.join(tmpOut, asset)).size > 0, asset);
      assert.ok(fs.readFileSync(path.join(tmpOut, 'sw.js'),'utf8').includes(asset), 'Offline shell includes '+asset);
    }
    // Wave 68: verify 7 dedicated SEO landing pages + FAQPage JSON-LD + bidirectional hreflang + IndexNow key
    assert.ok(fs.readFileSync(path.join(tmpOut, '7b4e9c2a1f8d4e60b3c5a9d1e2f48076.txt'), 'utf8').trim() === '7b4e9c2a1f8d4e60b3c5a9d1e2f48076');
    const sitemap = fs.readFileSync(path.join(tmpOut, 'sitemap.xml'), 'utf8');
    assert.ok(sitemap.includes('https://tuneup.pages.dev/id</loc>'), 'sitemap includes /id');
    assert.ok(sitemap.includes('hreflang="id"'), 'sitemap includes xhtml hreflang');

    const slugs = ['', 'daily', 'classic', 'artist', 'spotify', 'duel', 'artist-detective', 'id'];
    const titles = new Set();
    const descs = new Set();
    for (const slug of slugs) {
      const fname = slug ? `${slug}.html` : 'index.html';
      const pageHtml = fs.readFileSync(path.join(tmpOut, fname), 'utf8');
      const expectedUrl = slug ? `https://tuneup.pages.dev/${slug}` : 'https://tuneup.pages.dev/';
      assert.ok(!/noindex/i.test(pageHtml), `${fname} must be indexable`);
      assert.ok(pageHtml.includes(`<link rel="canonical" href="${expectedUrl}">`), `${fname} must have self-canonical ${expectedUrl}`);
      assert.ok(pageHtml.includes(`<meta property="og:url" content="${expectedUrl}">`), `${fname} must have matching og:url`);
      const tMatch = pageHtml.match(/<title>([^<]+)<\/title>/);
      const dMatch = pageHtml.match(/<meta name="description" content="([^"]+)">/);
      assert.ok(tMatch && tMatch[1].length >= 25, `${fname} must have descriptive title`);
      assert.ok(dMatch && dMatch[1].length >= 80, `${fname} must have descriptive meta description`);
      assert.ok(!titles.has(tMatch[1]), `${fname} title must be unique: ${tMatch[1]}`);
      assert.ok(!descs.has(dMatch[1]), `${fname} description must be unique`);
      titles.add(tMatch[1]);
      descs.add(dMatch[1]);

      const ldMatch = pageHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      assert.ok(ldMatch, `${fname} must include JSON-LD`);
      const ld = JSON.parse(ldMatch[1]);
      assert.ok(Array.isArray(ld['@graph']), `${fname} JSON-LD must use @graph`);
      assert.ok(ld['@graph'].some((n) => n['@type'] === 'FAQPage' && Array.isArray(n.mainEntity) && n.mainEntity.length === 5), `${fname} must include 5-question FAQPage schema`);

      if (slug === '' || slug === 'id') {
        assert.ok(pageHtml.includes('hreflang="en"'), `${fname} must include hreflang="en"`);
        assert.ok(pageHtml.includes('hreflang="id"'), `${fname} must include hreflang="id"`);
        assert.ok(pageHtml.includes('hreflang="x-default"'), `${fname} must include hreflang="x-default"`);
      } else {
        assert.ok(!pageHtml.includes('hreflang="x-default"'), `${fname} must not leak homepage hreflang`);
        assert.ok(pageHtml.includes('href="/styles.css"') && pageHtml.includes('src="/app.js"'), `${fname} must use root-absolute assets`);
        assert.ok(pageHtml.includes('data-src="neutral"'), `${fname} must not corrupt data-src attribute`);
      }
      if (slug === 'id') {
        assert.ok(pageHtml.includes('<html lang="id">'), 'id.html must set lang="id"');
        assert.ok(pageHtml.includes('Game Tebak Lagu'), 'id.html must include Indonesian title/copy');
        assert.ok(pageHtml.includes('Apakah perlu bikin akun?'), 'id.html must include static Indonesian FAQ');
        assert.ok(pageHtml.includes('<a href="/" hreflang="en" lang="en" data-mode-link="lang-en">EN</a>'), 'id.html must link back to English /');
        assert.ok(pageHtml.includes('<a href="/id" hreflang="id" lang="id" data-mode-link="lang-id" aria-current="page">ID</a>'), 'id.html must mark ID active');
      }
    }
  } finally {
    fs.rmSync(tmpOut, { recursive: true, force: true });
  }
});
