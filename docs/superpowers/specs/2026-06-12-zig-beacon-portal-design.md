# Zig Beacon Portal — Design Spec

Date: 2026-06-12
Status: Approved by user

## Summary

Convert the static Zig Beacon marketing site into a real internal portal covering the full Phase 1 scope of the PRD: Dashboard, Competitor Intelligence, Customer Signals, Beacon Score, UX Opportunity Hub, and AI Product Coach. Self-hosted internally via Docker. AI powered by local Ollama.

## Visual system

- Clean white background (`#FFFFFF`), near-black text (`#0A0A0A`), light gray card surfaces (`#FAFAFA` / `#F4F4F5`), hairline borders (`#E4E4E7`).
- Black active states: selected side-nav item is a solid black pill with white text. All primary CTAs are solid black buttons with white text.
- Brand color `#0367FC` used sparingly: live indicators, links, chart accents, focus rings, positive trends. Never as a background wash.
- Typography: Geist (UI grotesk) with generous letter-spacing on uppercase labels. Editorial feel, not "dashboard-y".
- Motion (Framer Motion): side-nav items stagger in on load; page content fades/slides on route change; cards lift on hover; metric numbers count up; AI Coach streams with typing cursor.
- Remotion installed in the project; used for an animated "weekly scorecard" video preview on the Dashboard. Kept separate from UI animation concerns.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion (UI motion), Remotion (rendered scorecard animation)
- TanStack Query for client data fetching where needed
- PostgreSQL + Prisma ORM
- Ollama (local, `http://localhost:11434`) for AI Coach — streaming chat completions, model e.g. `llama3.1` / `qwen2.5`
- Docker + docker-compose (app + postgres) for internal hosting
- Auth deferred to a later phase (internal network assumption for v1)

## Side navigation

Fixed left sidebar, white, hairline right border, collapsible to icon-only.

- Dashboard
- Intelligence: Competitors, Global Mobility, Innovation Watch
- Customers: Customer Signals, Complaint Heatmap
- Product: Product Health, Beacon Score, Opportunity Hub
- AI: AI Coach
- Bottom: Settings, signed-in user chip

Note: Global Mobility, Innovation Watch, Complaint Heatmap, Product Health, and Settings render as stub pages in v1 (nav present, "coming soon" body) — the six Phase 1 pages below are fully built.

## Pages (Phase 1, fully built)

1. **Dashboard** — Beacon Score hero number (count-up), sentiment split (positive/neutral/negative), top complaints list, competitor activity feed, priority opportunities, Remotion weekly-scorecard preview.
2. **Competitors** — feature matrix table (Zig vs Grab, Gojek, TADA, Ryde) with availability states; clicking a competitor opens a profile drawer (overview, strengths, weaknesses, recent updates).
3. **Customer Signals** — sentiment trend chart, complaint clusters by category (Pricing, Promotions, Payments, Booking, Airport, etc.), source breakdown (App Store, Play Store, Reddit, support tickets).
4. **Beacon Score** — per-product-area scores with formula factor breakdown (satisfaction, adoption, retention, competitor position, business impact, complaint severity) and score history.
5. **Opportunity Hub** — prioritized opportunity list scored Impact × Frequency × Reach ÷ Effort; each row: problem, evidence, affected users, effort, priority, owner, status.
6. **AI Coach** — light-theme chat: streaming Ollama responses, suggested query chips, "analysing N sources" status line, source citations footer. API route composes a context prompt from DB data (top complaints, scores, competitor features) before calling Ollama.

## Data model (Prisma)

- `Competitor` (name, country, overview, strengths, weaknesses)
- `Feature` (name, category) + `CompetitorFeature` join (status: available/partial/none, notes)
- `Signal` (source, category, sentiment, text, createdAt)
- `ComplaintCluster` (issue, category, volume, trendPct, severity)
- `BeaconScore` (area, score, factors JSON, recordedAt)
- `Opportunity` (problem, evidence, impact, frequency, reach, effort, score, status, owner)
- `ChatMessage` (role, content, sessionId, createdAt) — Coach history

Seeded with realistic demo data so every page renders meaningfully on first run.

## Architecture notes

- Server components for page data (direct Prisma reads); API routes only where interactivity demands it (Coach streaming endpoint, opportunity status updates).
- Coach streaming: `POST /api/coach` → builds context from DB → calls Ollama `/api/chat` with `stream: true` → proxies tokens via ReadableStream to the client.
- Graceful Ollama failure: if Ollama is unreachable, Coach returns a friendly offline message; rest of portal unaffected.
- Single Docker image (standalone Next.js build); docker-compose with postgres:16 and optional ollama service.

## Out of scope (v1)

- SSO/auth, real data ingestion pipelines (App Store scraping etc.), report exports, integrations (Jira, Figma…), Phases 2–3 modules.

## Success criteria

- All six pages render with seeded data; nav and route transitions animated.
- AI Coach streams a real Ollama answer grounded in seeded DB context.
- `docker compose up` brings up the full portal internally.
