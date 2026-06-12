# Zig Beacon Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 Zig Beacon internal portal — Dashboard, Competitors, Customer Signals, Beacon Score, Opportunity Hub, AI Coach — as a Next.js 15 app with Postgres/Prisma and Ollama-powered chat, in a clean white/black design with `#0367FC` accents and Framer Motion.

**Architecture:** Single Next.js App Router app in `portal/`. Server components read Prisma directly; the AI Coach uses a streaming API route that proxies Ollama. SQLite is NOT used — Postgres via docker-compose (with a local fallback DATABASE_URL). Remotion is installed with one composition (weekly scorecard) embedded via `@remotion/player` on the Dashboard.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion, TanStack Query, Prisma + PostgreSQL, Ollama, Remotion + @remotion/player, Docker.

---

### Task 1: Scaffold the Next.js app

**Files:** Create `portal/` via create-next-app.

- [ ] Step 1: `cd "/Users/harsai/CDG Zig/Apps/Zig_Beacon" && npx create-next-app@latest portal --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm --yes`
- [ ] Step 2: Install deps: `cd portal && npm i framer-motion @tanstack/react-query prisma @prisma/client remotion @remotion/player lucide-react clsx tailwind-merge`
- [ ] Step 3: Verify dev build: `npm run build` — expect success.
- [ ] Step 4: Commit: `git add -A && git commit -m "chore: scaffold Next.js portal"`

### Task 2: Design tokens & base layout

**Files:**
- Modify: `portal/src/app/globals.css` — white bg, `#0A0A0A` text, brand `#0367FC` CSS vars, Geist font already included by create-next-app.
- Modify: `portal/src/app/layout.tsx` — metadata "Zig Beacon", body classes.
- Create: `portal/src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).

Design tokens in `globals.css`:

```css
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --muted: #71717a;
  --surface: #fafafa;
  --border: #e4e4e7;
  --brand: #0367fc;
}
```

- [ ] Step 1: Write tokens + base styles, set up layout shell.
- [ ] Step 2: `npm run build` passes. Commit.

### Task 3: Prisma schema + seed

**Files:**
- Create: `portal/prisma/schema.prisma` — models: Competitor, Feature, CompetitorFeature, Signal, ComplaintCluster, BeaconScore, Opportunity, ChatMessage (as per spec).
- Create: `portal/prisma/seed.ts` — realistic seed data: 5 competitors (Zig, Grab, Gojek, TADA, Ryde), ~14 features with per-competitor availability, ~8 complaint clusters, beacon scores for 7 areas with factor JSON, ~8 opportunities, sentiment signals.
- Create: `portal/.env` — `DATABASE_URL="postgresql://beacon:beacon@localhost:5432/beacon"`.
- Create: `docker-compose.yml` at repo root — postgres:16 service (user/pass/db `beacon`), app service (added in Task 10).

Schema core (key models):

```prisma
model Competitor {
  id        Int    @id @default(autoincrement())
  name      String @unique
  country   String
  overview  String
  strengths String[]
  weaknesses String[]
  features  CompetitorFeature[]
}
model Feature {
  id       Int    @id @default(autoincrement())
  name     String @unique
  category String
  competitors CompetitorFeature[]
}
model CompetitorFeature {
  competitorId Int
  featureId    Int
  status       String // available | partial | none
  notes        String?
  competitor   Competitor @relation(fields: [competitorId], references: [id])
  feature      Feature    @relation(fields: [featureId], references: [id])
  @@id([competitorId, featureId])
}
model ComplaintCluster {
  id Int @id @default(autoincrement())
  issue String
  category String
  volume Int
  trendPct Float
  severity String // low | medium | high
}
model BeaconScore {
  id Int @id @default(autoincrement())
  area String
  score Int
  factors Json
  recordedAt DateTime @default(now())
}
model Opportunity {
  id Int @id @default(autoincrement())
  problem String
  evidence String
  impact Int
  frequency Int
  reach Int
  effort Int
  status String @default("backlog") // backlog | planned | in-progress | shipped
  owner String?
}
model Signal {
  id Int @id @default(autoincrement())
  source String
  category String
  sentiment String // positive | neutral | negative
  text String
  createdAt DateTime @default(now())
}
model ChatMessage {
  id Int @id @default(autoincrement())
  sessionId String
  role String
  content String
  createdAt DateTime @default(now())
}
```

- [ ] Step 1: Write schema, env, docker-compose (postgres only for now).
- [ ] Step 2: `docker compose up -d postgres` (or verify local postgres) then `npx prisma migrate dev --name init`.
- [ ] Step 3: Write seed.ts with realistic data; register `prisma.seed` in package.json; run `npx prisma db seed`.
- [ ] Step 4: Verify with `npx prisma studio` or a quick script query. Commit.

### Task 4: App shell — sidebar + motion

**Files:**
- Create: `portal/src/components/sidebar.tsx` — grouped nav (Dashboard; Intelligence: Competitors, Global Mobility, Innovation Watch; Customers: Customer Signals, Complaint Heatmap; Product: Product Health, Beacon Score, Opportunity Hub; AI: AI Coach; bottom: Settings + user chip). Active item = black pill, white text. Staggered entrance via Framer Motion. Collapsible.
- Create: `portal/src/components/page-transition.tsx` — wraps page content, fade/slide on route change.
- Create: `portal/src/components/topbar.tsx` — page title, live indicator dot (`#0367FC`), date.
- Modify: `portal/src/app/layout.tsx` — grid: sidebar + main.
- Create: stub pages for Global Mobility, Innovation Watch, Complaint Heatmap, Product Health, Settings (`coming soon` body, consistent layout).

- [ ] Step 1: Build sidebar with nav config array + `usePathname` active state.
- [ ] Step 2: Build transition + topbar; wire layout.
- [ ] Step 3: Create stub routes. `npm run build` passes. Commit.

### Task 5: Dashboard page

**Files:**
- Create: `portal/src/app/page.tsx` (server component: Prisma reads) and `portal/src/components/dashboard/*` client components: `score-hero.tsx` (count-up Beacon Score), `sentiment-card.tsx`, `complaints-card.tsx`, `activity-feed.tsx`, `opportunities-card.tsx`.
- Metric count-up via framer-motion `animate()`.

- [ ] Step 1: Server queries: average beacon score, sentiment split from signals, top complaint clusters, top opportunities.
- [ ] Step 2: Build cards with white surfaces, hairline borders, hover lift; numbers count up.
- [ ] Step 3: Build + visual check via preview. Commit.

### Task 6: Competitors page

**Files:**
- Create: `portal/src/app/competitors/page.tsx` — feature matrix grouped by category; cells: ✓ available (black), ◐ partial (gray), — none (light gray); Zig column highlighted with brand-tinted header.
- Create: `portal/src/components/competitors/profile-drawer.tsx` — client drawer with overview/strengths/weaknesses, opened by clicking a competitor column header. Framer Motion slide-in.

- [ ] Step 1: Server component renders matrix from Prisma.
- [ ] Step 2: Drawer client component. Build passes, visual check. Commit.

### Task 7: Customer Signals page

**Files:**
- Create: `portal/src/app/signals/page.tsx` — sentiment split bars, complaint clusters by category (volume + trend arrows), source breakdown grid.

- [ ] Step 1: Server queries + layout. Animated bar widths on mount.
- [ ] Step 2: Build + visual check. Commit.

### Task 8: Beacon Score + Opportunity Hub pages

**Files:**
- Create: `portal/src/app/beacon-score/page.tsx` — per-area score cards with factor breakdown bars (factors JSON), formula explainer strip.
- Create: `portal/src/app/opportunities/page.tsx` — table sorted by computed score `impact * frequency * reach / effort`, status badges, priority chips.

- [ ] Step 1: Beacon Score page. Step 2: Opportunity Hub page. Step 3: Build + visual check. Commit.

### Task 9: AI Coach with Ollama streaming

**Files:**
- Create: `portal/src/lib/ollama.ts` — `streamChat(messages)` helper calling `${OLLAMA_URL}/api/chat` with `stream:true`, model from `OLLAMA_MODEL` env (default `llama3.1`).
- Create: `portal/src/app/api/coach/route.ts` — POST: builds system prompt with DB context (top complaints, beacon scores, competitor feature gaps), streams NDJSON tokens back as a ReadableStream. If Ollama unreachable → 503 JSON with friendly message.
- Create: `portal/src/app/coach/page.tsx` + `portal/src/components/coach/chat.tsx` — light-theme chat: message list, suggested query chips, streaming render with cursor, "Analysing N sources" status, sources footer.

Core streaming route:

```ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  const context = await buildContext(); // Prisma reads
  const upstream = await fetch(`${process.env.OLLAMA_URL ?? "http://localhost:11434"}/api/chat`, {
    method: "POST",
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL ?? "llama3.1",
      stream: true,
      messages: [{ role: "system", content: context }, ...messages],
    }),
  });
  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: "AI Coach is offline — is Ollama running?" }, { status: 503 });
  }
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const json = JSON.parse(line);
          if (json.message?.content) controller.enqueue(new TextEncoder().encode(json.message.content));
        }
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
```

- [ ] Step 1: ollama lib + route. Step 2: chat UI with streaming fetch reader. Step 3: Test with Ollama running (`ollama serve` + model pulled); verify offline fallback. Commit.

### Task 10: Remotion weekly scorecard

**Files:**
- Create: `portal/src/remotion/scorecard.tsx` — composition animating the 7 beacon scores (bars grow, numbers count, brand-blue accents on white).
- Create: `portal/src/components/dashboard/scorecard-player.tsx` — `@remotion/player` embed on Dashboard, client component, controls hidden, loop.

- [ ] Step 1: Composition + player embed. Step 2: Build + visual check. Commit.

### Task 11: Docker packaging

**Files:**
- Create: `portal/Dockerfile` — multi-stage standalone Next build.
- Modify: `docker-compose.yml` — add app service (depends on postgres), env vars, optional ollama service comment.
- Modify: `portal/next.config.ts` — `output: "standalone"`.

- [ ] Step 1: Dockerfile + compose. Step 2: `docker compose build` succeeds. Commit.

### Task 12: Final verification

- [ ] `npm run build` clean; all routes render with seeded data via preview screenshots (Dashboard, Competitors, Signals, Beacon Score, Opportunities, Coach).
- [ ] Coach streams from Ollama; offline path shows friendly message.
- [ ] Commit final state.
