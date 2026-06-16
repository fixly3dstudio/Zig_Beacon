# Zig Beacon Tech Stack

This document is the engineering reference for the Zig Beacon portal. It explains what the app is built with, where the main code lives, how to run it locally, and which integrations power the product intelligence workflows.

## Product Surface

Zig Beacon is a Next.js portal for product intelligence across:

- Dashboard and navigation shell
- Competitor feature benchmarking
- Global mobility benchmarks
- Innovation watch
- Customer signals and App Reviews
- Complaint heatmap and downloadable complaint reports
- Product health
- Beacon Score
- Opportunity Hub
- AI Coach
- Visual review / screen analysis
- Transport news
- Settings and store integrations

## Application Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Web framework | Next.js `16.2.9` | App Router under `portal/src/app` |
| UI runtime | React `19.2.4`, React DOM `19.2.4` | Client components used for interactive dashboards and modals |
| Language | TypeScript `5` | Strict mode enabled in `portal/tsconfig.json` |
| Styling | Tailwind CSS `4`, `@tailwindcss/postcss`, CSS variables | Global theme in `portal/src/app/globals.css` |
| Icons | `lucide-react` | Navigation, controls, metrics, report actions |
| Animation | `framer-motion` | Tab transitions, expandable sections, modals |
| Data access | Prisma `7.8.0` | Schema in `portal/prisma/schema.prisma` |
| Database | PostgreSQL | Local Postgres via Docker Compose; production uses `DATABASE_URL` |
| Postgres driver | `pg`, `@prisma/adapter-pg` | Used by Prisma 7 setup |
| AI provider | Local Ollama HTTP API | Used by AI Coach and visual review flows |
| Video/visual library | Remotion `4` | Available for richer visual workflows |
| Deployment | Vercel | Production alias currently points to the Vercel app |

## Repository Layout

```text
Zig_Beacon/
├── docker-compose.yml              # Local PostgreSQL service
├── docs/
│   ├── TECH_STACK.md               # This document
│   └── superpowers/                # Planning and design docs
└── portal/
    ├── package.json                # App scripts and dependencies
    ├── next.config.ts              # Next.js config
    ├── prisma.config.ts            # Prisma 7 config
    ├── prisma/
    │   ├── schema.prisma           # Database models
    │   └── seed.ts                 # Seed data
    └── src/
        ├── app/                    # Next.js routes, API routes, layouts
        ├── components/             # Reusable and page-specific UI
        └── lib/                    # Auth, database, integrations, review sync
```

## Important Folders

| Path | Purpose |
| --- | --- |
| `portal/src/app/(app)` | Authenticated portal pages |
| `portal/src/app/api` | Server API routes for AI, reviews, news, visual review, feedback |
| `portal/src/app/login` | Login page and server actions |
| `portal/src/components/ui` | Shared UI primitives |
| `portal/src/components/reviews` | App Reviews UI, Jira ticket modal, story modal |
| `portal/src/components/complaint-heatmap` | Complaints UI and report export logic |
| `portal/src/lib/reviews` | App Store / Google Play sync, credentials, classification, complaint derivation |
| `portal/src/lib/auth.ts` | Portal auth/session helpers |
| `portal/src/lib/db.ts` | Prisma client access |
| `portal/src/lib/jira.ts` | Jira issue creation integration |
| `portal/src/lib/ollama.ts` | Ollama model calls |

## Local Development

Run commands from the `portal` directory unless noted.

```bash
cd portal
npm install
npm run dev
```

The dev server starts with Next.js. Use the printed localhost URL, typically:

```text
http://localhost:3000
```

### Local Database

From the project root:

```bash
docker compose up -d
```

The local Postgres service runs on port `5433`.

Default local connection:

```text
postgresql://beacon:beacon@localhost:5433/beacon
```

Generate Prisma client:

```bash
cd portal
npx prisma generate
```

Seed local data:

```bash
cd portal
npx prisma db seed
```

## Build and Verification

Production build:

```bash
cd portal
npm run build
```

Start a production build locally:

```bash
cd portal
npm start
```

Lint:

```bash
cd portal
npm run lint
```

## Environment Variables

Use `portal/.env.example` as the source of truth for local setup. Do not commit real secrets.

### Core

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORTAL_USERNAME` | Portal login username |
| `PORTAL_PASSWORD` | Portal login password |
| `AUTH_SECRET` | HMAC/session signing secret |
| `CREDENTIALS_SECRET` | Encrypts store credentials saved from Settings |

### AI

| Variable | Purpose |
| --- | --- |
| `OLLAMA_URL` | Local or hosted Ollama endpoint |
| `OLLAMA_MODEL` | Text model for AI Coach |
| `OLLAMA_VISION_MODEL` | Vision model for Visual Review |

### Feedback Email

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key for feedback email |
| `FEEDBACK_FROM_EMAIL` | Sender identity for UI/UX feedback |

### App Reviews

| Variable | Purpose |
| --- | --- |
| `GOOGLE_PLAY_PACKAGE_NAME` | Android app package, currently `com.cdg.zig` |
| `GOOGLE_PLAY_CLIENT_EMAIL` | Google service account client email |
| `GOOGLE_PLAY_PRIVATE_KEY` | Google service account private key |
| `APP_STORE_APP_ID` | App Store app ID |
| `APP_STORE_KEY_ID` | App Store Connect API key ID |
| `APP_STORE_ISSUER_ID` | App Store Connect issuer ID |
| `APP_STORE_PRIVATE_KEY` | App Store Connect private key |
| `REVIEWS_SYNC_SECRET` | Optional secret for protected review sync calls |

### Jira

| Variable | Purpose |
| --- | --- |
| `JIRA_BASE_URL` | Atlassian site URL |
| `JIRA_EMAIL` | Jira API user email |
| `JIRA_API_TOKEN` | Jira API token |
| `JIRA_PROJECT_KEY` | Target Jira project key |
| `JIRA_ISSUE_TYPE` | Jira issue type, default is `Story` |

## Database Models

The Prisma schema lives in `portal/prisma/schema.prisma`.

| Model | Purpose |
| --- | --- |
| `Competitor` | Market competitor profiles |
| `Feature` | Benchmarkable feature definitions |
| `CompetitorFeature` | Competitor feature availability matrix |
| `ComplaintCluster` | Grouped complaint themes, volume, severity, fixes |
| `BeaconScore` | Score snapshots and factor payloads |
| `Opportunity` | Product opportunities with impact/frequency/reach/effort |
| `Signal` | Customer signals and app store reviews |
| `VisualUpload` | Uploaded screen assets and AI analysis output |
| `StoreIntegration` | Encrypted App Store / Google Play credentials |
| `ChatMessage` | AI Coach conversation history |

## Integrations

### App Store Connect

Code:

- `portal/src/lib/reviews/app-store.ts`
- `portal/src/app/api/reviews/app-store-live/route.ts`

Used for:

- Fetching App Store customer reviews
- Fetching App Store public rating summary
- Feeding App Reviews, Complaints, Product Health, Opportunity Hub, and AI Coach

Required access:

- App Store Connect API key from Users and Access → Integrations
- App ID, Key ID, Issuer ID, and private key

### Google Play

Code:

- `portal/src/lib/reviews/google-play.ts`
- `portal/src/lib/reviews/sync.ts`

Used for:

- Fetching Play Store reviews through Android Publisher API
- Folding Android reviews into customer signals and complaints

Required access:

- Google Cloud service account
- Android Publisher API enabled
- Service account granted app access in Play Console

### Jira

Code:

- `portal/src/lib/jira.ts`
- `portal/src/app/(app)/reviews/jira-actions.ts`
- `portal/src/components/reviews/jira-ticket-modal.tsx`

Used for:

- Creating Jira tickets from individual app reviews
- Linking created Jira keys back to review rows

### Transport News

Code:

- `portal/src/app/api/transport-news/route.ts`
- `portal/src/components/transport-news`

Used for:

- Singapore transport news
- International mobility news
- News-source links that open the publisher site

### AI Coach and Visual Review

Code:

- `portal/src/app/api/coach/route.ts`
- `portal/src/app/api/visual-review/route.ts`
- `portal/src/lib/ollama.ts`
- `portal/src/lib/visual-uploads.ts`

Used for:

- AI product coaching
- Screen / UI flow analysis
- Feature scoring and product recommendations

## App Architecture

The app uses Next.js App Router.

- Server components load database-backed page data.
- Client components handle filters, tabs, modals, downloads, and browser-saved integrations.
- Server actions are used for App Review sync and Jira ticket creation.
- API routes handle external service calls that should not run directly in client code.

Typical data flow for app reviews:

```text
Settings credentials
  → StoreIntegration encrypted config
  → Review sync API / server action
  → App Store / Google Play APIs
  → Signal rows
  → Reviews, Complaints, Product Health, Opportunities, AI Coach
```

Browser-saved credentials are also supported for quick App Store live review fetches during portal use.

## Feature Pages

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `portal/src/app/(app)/page.tsx` | Dashboard |
| `/competitors` | `portal/src/app/(app)/competitors/page.tsx` | Competitor benchmarking |
| `/global-mobility` | `portal/src/app/(app)/global-mobility/page.tsx` | Regional mobility benchmarks |
| `/innovation-watch` | `portal/src/app/(app)/innovation-watch/page.tsx` | Innovation patterns |
| `/reviews` | `portal/src/app/(app)/reviews/page.tsx` | App Store / Play Store review analysis |
| `/complaint-heatmap` | `portal/src/app/(app)/complaint-heatmap/page.tsx` | Complaints by module, source, severity, reports |
| `/product-health` | `portal/src/app/(app)/product-health/page.tsx` | Product health signals |
| `/beacon-score` | `portal/src/app/(app)/beacon-score/page.tsx` | Feature scoring |
| `/opportunities` | `portal/src/app/(app)/opportunities/page.tsx` | Opportunity sizing and revenue estimates |
| `/coach` | `portal/src/app/(app)/coach/page.tsx` | AI Coach |
| `/visual-review` | `portal/src/app/(app)/visual-review/page.tsx` | UI/UX screen analysis |
| `/transport-news` | `portal/src/app/(app)/transport-news/page.tsx` | Singapore and global transport news |
| `/settings` | `portal/src/app/(app)/settings/page.tsx` | Credentials, feedback, portal settings |

## Deployment

The app is deployed from the `portal` directory to Vercel.

Production deploy:

```bash
cd portal
npx vercel --prod --yes
```

Production build command:

```bash
npm run build
```

The Vercel project must have production environment variables configured. Avoid relying on committed `.env` files in production.

## Engineering Guidelines

- Keep page-specific UI in `portal/src/components/<feature>` when it grows beyond a small page.
- Keep service integrations in `portal/src/lib`.
- Use Prisma for database reads/writes rather than ad hoc SQL unless there is a clear reason.
- Treat App Store and Google Play review data as source signals, not as the same thing as public aggregate ratings.
- Keep browser-only logic inside client components.
- Keep external API credentials server-side or encrypted in `StoreIntegration`.
- Run `npm run build` before pushing production changes.
- Do not commit `.env`, real private keys, API tokens, or local metadata files.

## Common Commands

```bash
# Start local Postgres from project root
docker compose up -d

# Install app dependencies
cd portal && npm install

# Run local dev server
cd portal && npm run dev

# Generate Prisma client
cd portal && npx prisma generate

# Seed database
cd portal && npx prisma db seed

# Build production bundle
cd portal && npm run build

# Deploy production to Vercel
cd portal && npx vercel --prod --yes
```

## Notes for Future Engineers

- The portal currently combines seeded/product intelligence data with live review and news feeds.
- Public store ratings should be displayed separately from fetched written-review averages because live review pulls often overrepresent complaints.
- Complaint reports are generated client-side as HTML documents from the current module report data.
- Settings supports saved store integrations; ensure `CREDENTIALS_SECRET` is stable in production so encrypted credentials remain readable after deploys.
- If AI features fail locally, check that Ollama is running and that the configured text and vision models are installed.
