# Zig Product Intelligence Portal

Internal UI/UX research dashboard for ComfortDelGro Zig taxi product work.

## What it includes

- Singapore competitor feature scan for Grab, Gojek, TADA, and Zig
- Voice-of-customer signal feed for App Store, Play Store, Reddit, social, support, and news themes
- Current Zig capability and training-section map
- Prioritized opportunity board for product design focus areas
- Brand styling using `#0367FC` and the provided Zig logo

## Run

Open `index.html` directly in a browser, or run a local static server:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173/zig-intelligence-portal/`.

## Next data step

Replace the seeded data in `script.js` with real ingestion from approved sources:

- App Store and Play Store review exports
- Reddit keyword monitoring
- Social listening tool exports
- News/RSS feeds
- Internal support-ticket tags
- Competitor release notes and public help pages
