# Cloudflare Pages

The Pages version is built separately. The root HTML keeps its Netlify form and
URLs so existing Netlify and GitHub Pages installations remain compatible.

## Publish

1. Use the official Wrangler CLI and sign in to the owner's Cloudflare account.
2. Run `node tools/build-cloudflare.cjs`. Set `SITE_URL` to the final HTTPS origin
   if it differs from `https://namethetrack.pages.dev`.
3. Apply `migrations/0001_feedback.sql` to the D1 database configured as
   `FEEDBACK_DB`. The schema creation is safe to repeat.
4. Run `wrangler pages deploy dist --project-name namethetrack --branch main`.

The output only contains public game assets. Local metadata, tests, deployment
tools, and account credentials must never be uploaded. `functions/api/feedback.js`
is compiled separately by Wrangler. Only `/api/*` invokes Functions; the game
assets are static. Feedback uses the separate Functions/D1 free quotas.

## Feedback

Open Cloudflare's D1 dashboard, select the project's feedback database, and open
the `feedback` table. It stores category, message, optional email/game details,
ID, and receipt time. There is no public endpoint that reads submissions and no
email forwarding. Existing feedback stays in Netlify's Forms inbox.

## Data and rollback

The song catalogue, fixed Daily pool, game rules and GA4 measurement ID remain the
same. Canonical URLs, social images, sitemap and the analytics production hostname
are adjusted in the Pages bundle. Local and temporary preview hosts do not send
analytics. Browser streaks and preferences are scoped to the website origin; old
history remains available on the old address, not automatically on the new one.

The owner requested deletion of the original Netlify project after the Cloudflare
deployment was verified. Netlify project `namethetrack` was deleted on 2026-11-07;
its old URL no longer serves the game. The local `.netlify-backup/` folder contains
the old form backup and is excluded from Git. GitHub Pages remains a separate copy.
To roll back Pages, republish the previous successful deployment through the
Cloudflare dashboard. Retain the D1 database to preserve incoming feedback.
