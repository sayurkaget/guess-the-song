# TuneUp

**Play live in your browser:** **<https://tuneup.pages.dev/>**

**TuneUp** is a free browser-based music game suite with no sign-up required. Test your ear on split-second audio intros, compare Spotify streams and release years, or deduce iconic global artists from 6 clues.

---

## Game Modes

- **Daily Challenge** — One shared mystery song every day drawn from a 365-song curated pool with 5 attempts (`0.1s → 0.5s → 2s → 8s → 15s`). Resets daily at **7:00 AM** in your device's local timezone and tracks your daily win streak.
- **Classic (5 Stages)** — Five escalating rounds (*Easy → Medium → Hard → Expert → Impossible*) drawn from a studio-only catalog of **33,500+ tracks**, calibrated by real Spotify stream tiers and filterable by **Genre** (*Pop, Rock, Hip-hop, R&B / Soul, Electronic, Indie, Other*) and **Era** (*Before 2000, 2000s, 2010s, 2020s*).
- **Custom Artist** — Switch to the **By Artist** tab inside Classic to search any artist and play a 5-song run of their studio tracks (with recent/popular quick chips, *Surprise me*, and local catalog fallback).
- **Playlists** — Paste any public **Spotify**, **Apple Music**, or **YouTube** playlist/album link (or multiple links / Ctrl+A Spotify tracks) to play your own custom tracks.
- **Music Duel** — Endless *Higher or Lower* battles across two decks: **Spotify Streams** (**6,089** curated hits) and **Release Year** (**6,095** tracks), featuring toggleable hover-to-play audio previews with seamless resume.
- **Artist Detective** — Deduce a mystery artist from a roster of **530 iconic global artists** (`#1–#530`) in up to 10 tries using 6 color-coded clues (*Debut Year, Solo/Duo/Group Type, Gender, Genre, Country/Continent, and Global Rank*) plus 2 unlockable hints. Automatically plays the artist's top hit on solve or reveal.

---

## Features

- **Spoiler-Free Friend Challenges & Score Cards** — Tap **Challenge your friend** to copy a spoiler-free replay link (`#challenge=`, `#run=`, `#duel=`, `#artist=`) or **Save score card** to export a shareable PNG summary (`score-card.js`).
- **Bilingual UI (EN / ID)** — Switch cleanly between **English** and **Bahasa Indonesia** in Settings (`i18n.js`).
- **Stats, Badges & Backup Transfer** — Track progress across **This filter**, **All Classic**, **Daily**, **Duel**, **Artist**, and **Badges** tabs (`badges.js`), and transfer progress across devices with an account-free backup code (`backup.js`).
- **Studio-Only Recording Policy** — Automatically filters out live recordings, karaoke tracks, radio sessions, unofficial covers, and non-studio mixes (`recordings.js`).
- **Installable PWA (Online-Only)** — Can be added to your mobile or desktop home screen while staying online-only (`no-cache` ETag validation via `sw.js`) so updates apply immediately without stale offline caches.

---

## Keyboard Shortcuts

| Context | Action | Shortcut |
|---|---|---|
| Lobby | Start active Classic tab | `Enter` |
| Song Arena (`#game`) | Play / pause clip | `Space` |
| Song Arena (`#game`) | Skip to longer clip | `Tab` |
| Search Dropdown | Navigate & pick suggestion | `↑` `↓` then `Enter` |
| Music Duel (`#duel`) | Guess Higher / Later | `↑` |
| Music Duel (`#duel`) | Guess Lower / Earlier | `↓` |
| Music Duel (`#duel`) | Toggle song preview | `Space` |
| Artist Detective (Solved) | Play / pause top hit | `Space` |
| Artist Detective (Solved) | Next artist | `Enter` |
| Any Modal | Close dialog | `Esc` |

---

## Project Structure

| File / Directory | Purpose |
|---|---|
| `index.html` | Main application markup, SEO metadata, and modals |
| `styles.css`, `layout.css`, `site-guide.css` | Visual styling, dark-glass UI, responsive desktop & mobile layouts |
| `app.js` | Core gameplay, audio engine, search, stats, challenges, and mode controllers |
| `songs.js` | Compacted Western studio track catalog (`33,500` songs with verified iTunes IDs) |
| `recordings.js` | Studio-only filtering rules for iTunes search & catalog resolution |
| `daily.js`, `daily-pool-v1.js` | Deterministic local-timezone Daily Challenge engine & 365-song curated pool |
| `challenge.js` | Encoding, decoding, and scoring for single-track (`#challenge=`) & 5-stage (`#run=`) links |
| `duel.js`, `duel-streams-v1.js` | Music Duel pairing engine & curated Spotify streams dataset (`6,089` hits) |
| `artist-game.js` | Artist Detective 530-artist roster, 6-clue comparison, hints, and opaque hash challenge links |
| `score-card.js`, `backup.js`, `badges.js`, `i18n.js` | Shareable PNG score cards, backup/transfer codes, unlockable badges, and EN/ID localization |
| `feedback.js`, `functions/api/` | Cloudflare Pages Functions for private D1 feedback & Spotify/Apple/YouTube playlist proxies |
| `analytics.js` | Privacy-respecting GA4 activity events (no search terms, guesses, emails, or PII) |
| `sw.js`, `app.webmanifest` | Online-only Service Worker (`no-cache` ETag) & PWA manifest |
| `tools/` | Cloudflare bundle builder (`build-cloudflare.cjs`) and catalog maintenance scripts |
| `tests/` | Automated Node test suite (`tests/*.test.cjs`) |

---

## Development, Testing & Deployment

### Local Preview
Serve the project over HTTP (avoid opening `index.html` directly via `file://`, as browsers block cross-origin API requests):

```powershell
# PowerShell static server included in the repo
powershell -File serve.ps1
# Then open http://localhost:8080
```

### Run Automated Tests
```bash
node --test tests/*.test.cjs
```

### Build & Deploy (Cloudflare Pages)
```bash
# Build production bundle into dist/ for https://tuneup.pages.dev
node tools/build-cloudflare.cjs

# Deploy dist/ and Pages Functions (with FEEDBACK_DB D1 binding from wrangler.toml)
npx wrangler pages deploy dist --project-name tuneup --branch main
```

---

## Technical Notes

- **Audio Previews**: Uses public 30-second previews from the US **iTunes Search / Lookup API** (no API key required). Resolved track metadata is cached in `localStorage` for 7 days.
- **Answer Matching**: Ignores accents, punctuation, remaster tags, and `feat.` credits, and recognizes shared album/duo credits (e.g., *Silk Sonic* / *Bruno Mars*) while keeping distinct songs and non-studio variants separate.
- **Privacy & Storage**: No user accounts or server-side profiles. Gameplay progress stays in `localStorage`; feedback submissions are stored privately in Cloudflare D1 (`FEEDBACK_DB`) without IPs or request headers.
