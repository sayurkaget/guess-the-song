/* Build a separate Pages bundle; the Netlify/GitHub source remains usable. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const output = path.join(root, 'dist');
const site = new URL(process.env.SITE_URL || 'https://namethetrack.pages.dev');
if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash) {
  throw new Error('SITE_URL must be an HTTPS site origin');
}
fs.mkdirSync(output, { recursive: true });
const files = ['index.html', 'styles.css', 'app.js', 'songs.js', 'recordings.js',
  'daily.js', 'daily-pool-v1.js', 'challenge.js', 'feedback.js', 'analytics.js',
  'app.webmanifest', 'sw.js', 'robots.txt', 'sitemap.xml',
  'googlebc29a838b567dfc0.html',
  'icon-32.png', 'icon-96.png', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
for (const file of files) {
  let contents = fs.readFileSync(path.join(root, file));
  if (/\.(html|xml|txt|js)$/.test(file)) {
    contents = contents.toString().replaceAll('https://namethetrack.netlify.app', site.origin);
    if (file === 'index.html') contents = contents
      .replace('action="/feedback-received.html" data-netlify="true"', 'action="/api/feedback" data-feedback-api="true"');
    if (file === 'analytics.js') contents = contents
      .replace("location.hostname === 'namethetrack.netlify.app'", 'location.hostname === ' + JSON.stringify(site.hostname));
    if (file === 'sw.js') contents = contents.replace(/const CACHE = '[^']+'/, "const CACHE = 'gts-cf-v4-no-effects'");
  }
  fs.writeFileSync(path.join(output, file), contents);
}
fs.cpSync(path.join(root, 'fonts'), path.join(output, 'fonts'), { recursive: true });
fs.writeFileSync(path.join(output, '_routes.json'), JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }));
console.log('Built Cloudflare Pages assets for ' + site.origin);
