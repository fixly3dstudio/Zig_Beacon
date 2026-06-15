import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const now = new Date("2026-06-12T08:00:00.000Z");

const demoCompetitors = [
  {
    id: 1,
    name: "Zig",
    country: "Singapore",
    overview:
      "ComfortDelGro Zig anchors on taxi reliability, safety, and corporate readiness, with room to deepen consumer-facing convenience features.",
    strengths: ["Largest taxi fleet trust", "Strong corporate billing", "Regulated safety perception"],
    weaknesses: ["Promo discovery friction", "Airport pickup clarity gaps", "Limited lifestyle ecosystem"],
  },
  {
    id: 2,
    name: "Grab",
    country: "Singapore",
    overview:
      "Grab leads on super-app breadth, wallet depth, loyalty, and automated discount behaviour.",
    strengths: ["Deep wallet and rewards", "Auto-applied promotions", "Broad consumer habit"],
    weaknesses: ["Higher fee sensitivity", "Complex surface area", "Driver supply volatility"],
  },
  {
    id: 3,
    name: "Gojek",
    country: "Singapore",
    overview:
      "Gojek competes on value, simplicity, and targeted ride-hailing flows in Singapore.",
    strengths: ["Simple booking UX", "Competitive pricing", "Clear ride status"],
    weaknesses: ["Smaller ecosystem", "Less corporate depth", "Limited airport differentiation"],
  },
  {
    id: 4,
    name: "TADA",
    country: "Singapore",
    overview:
      "TADA positions around driver-friendly economics and transparent fares.",
    strengths: ["No-commission positioning", "Transparent fare model", "Driver goodwill"],
    weaknesses: ["Feature depth trails leaders", "Smaller rider base", "Limited loyalty patterns"],
  },
  {
    id: 5,
    name: "Ryde",
    country: "Singapore",
    overview:
      "Ryde differentiates with carpooling heritage, subscriptions, and EV/sustainability cues.",
    strengths: ["Subscription hooks", "EV positioning", "Niche loyal users"],
    weaknesses: ["Lower mainstream habit", "Limited premium trust", "Patchy feature parity"],
  },
];

const demoFeatures = [
  { id: 1, name: "Flight tracking pickup", category: "Airport" },
  { id: 2, name: "Promo auto-apply at checkout", category: "Promotions" },
  { id: 3, name: "Multi-stop rides", category: "Booking" },
  { id: 4, name: "Fare splitting", category: "Payments" },
  { id: 5, name: "Loyalty tiers", category: "Rewards" },
  { id: 6, name: "In-app safety center", category: "Safety" },
  { id: 7, name: "Corporate billing", category: "Booking" },
  { id: 8, name: "EV ride option", category: "Booking" },
  { id: 9, name: "Pet-friendly rides", category: "Booking" },
  { id: 10, name: "Advance booking 7+ days", category: "Booking" },
];

const statusGrid: Record<number, Record<number, { status: string; notes?: string }>> = {
  1: {
    1: { status: "none", notes: "No real-time flight integration yet." },
    2: { status: "available", notes: "Flight-linked Changi arrival handling." },
    3: { status: "none" },
    4: { status: "none" },
    5: { status: "none" },
  },
  2: {
    1: { status: "partial", notes: "Some corporate codes apply automatically; consumer promos need manual entry." },
    2: { status: "available", notes: "Best available promo is highlighted and applied." },
    3: { status: "available" },
    4: { status: "none" },
    5: { status: "partial", notes: "Subscription discount applies; one-off promos need manual entry." },
  },
  3: {
    1: { status: "available" },
    2: { status: "available" },
    3: { status: "partial", notes: "Supports one intermediate stop." },
    4: { status: "none" },
    5: { status: "none" },
  },
  4: {
    1: { status: "none" },
    2: { status: "available" },
    3: { status: "none" },
    4: { status: "none" },
    5: { status: "none" },
  },
  5: {
    1: { status: "partial" },
    2: { status: "available" },
    3: { status: "partial" },
    4: { status: "none" },
    5: { status: "available" },
  },
  6: {
    1: { status: "available" },
    2: { status: "available" },
    3: { status: "available" },
    4: { status: "partial" },
    5: { status: "partial" },
  },
  7: {
    1: { status: "available", notes: "Strong GoBusiness and receipt support." },
    2: { status: "available" },
    3: { status: "partial" },
    4: { status: "none" },
    5: { status: "partial" },
  },
  8: {
    1: { status: "partial" },
    2: { status: "available" },
    3: { status: "none" },
    4: { status: "none" },
    5: { status: "available" },
  },
  9: {
    1: { status: "none" },
    2: { status: "partial" },
    3: { status: "none" },
    4: { status: "none" },
    5: { status: "partial" },
  },
  10: {
    1: { status: "available" },
    2: { status: "available" },
    3: { status: "none" },
    4: { status: "none" },
    5: { status: "none" },
  },
};

const demoCompetitorFeatures = Object.entries(statusGrid).flatMap(
  ([featureId, competitors]) =>
    Object.entries(competitors).map(([competitorId, value]) => ({
      featureId: Number(featureId),
      competitorId: Number(competitorId),
      status: value.status,
      notes: value.notes ?? null,
      feature: demoFeatures.find((feature) => feature.id === Number(featureId)),
      competitor: demoCompetitors.find(
        (competitor) => competitor.id === Number(competitorId)
      ),
    }))
);

const demoComplaints = [
  { id: 1, issue: "Manual promo entry fails or feels hidden", category: "Promotions", volume: 420, trendPct: 18, severity: "high" },
  { id: 2, issue: "Airport pickup terminal confusion", category: "Airport", volume: 315, trendPct: 12, severity: "high" },
  { id: 3, issue: "Cancellation fee explanation unclear", category: "Booking", volume: 210, trendPct: 6, severity: "medium" },
  { id: 4, issue: "Ride selection copy is hard to compare", category: "Booking", volume: 172, trendPct: -4, severity: "medium" },
  { id: 5, issue: "Wallet and refund visibility", category: "Payments", volume: 148, trendPct: 9, severity: "medium" },
];

type DemoSignal = {
  id: number;
  source: string;
  category: string;
  sentiment: string;
  text: string;
  createdAt: Date;
  externalId: string | null;
  rating: number | null;
  appVersion: string | null;
  author: string | null;
  title: string | null;
};

let demoSignals: DemoSignal[] = [
  {
    id: 1,
    source: "App Store",
    category: "Promotions",
    sentiment: "negative",
    text: "Promo codes are hard to find and do not apply automatically.",
    createdAt: now,
    externalId: "demo_as_1",
    rating: 2,
    appVersion: "7.4.0",
    author: "iOS rider",
    title: "Promo did not apply",
  },
  {
    id: 2,
    source: "Play Store",
    category: "Airport",
    sentiment: "negative",
    text: "Airport pickup instructions are confusing after landing.",
    createdAt: now,
    externalId: "demo_gp_1",
    rating: 2,
    appVersion: "7.4.0",
    author: "Android rider",
    title: "Could not find pickup point",
  },
  {
    id: 3,
    source: "Support",
    category: "Booking",
    sentiment: "neutral",
    text: "Customer asked why cancellation fee changed.",
    createdAt: now,
    externalId: null,
    rating: null,
    appVersion: null,
    author: null,
    title: null,
  },
  {
    id: 4,
    source: "App Store",
    category: "Safety",
    sentiment: "positive",
    text: "Trip sharing and taxi trust make late rides feel safe.",
    createdAt: now,
    externalId: "demo_as_2",
    rating: 5,
    appVersion: "7.3.9",
    author: "Daily commuter",
    title: "Reliable and safe",
  },
  {
    id: 5,
    source: "Twitter",
    category: "Payments",
    sentiment: "negative",
    text: "Refund credit is not visible enough in wallet.",
    createdAt: now,
    externalId: null,
    rating: null,
    appVersion: null,
    author: null,
    title: null,
  },
  {
    id: 6,
    source: "Support",
    category: "Booking",
    sentiment: "positive",
    text: "Advance booking worked well for airport trip.",
    createdAt: now,
    externalId: null,
    rating: null,
    appVersion: null,
    author: null,
    title: null,
  },
  {
    id: 7,
    source: "Play Store",
    category: "Payments",
    sentiment: "neutral",
    text: "Payment went through, but the receipt took too long to appear.",
    createdAt: new Date("2026-06-10T08:00:00.000Z"),
    externalId: "demo_gp_2",
    rating: 3,
    appVersion: "7.3.8",
    author: "Play reviewer",
    title: "Receipt delay",
  },
];

const demoScores = [
  { id: 1, area: "Promotions", score: 58, factors: { usability: 48, reliability: 61, sentiment: 44, parity: 52, opportunity: 88, complaints: 38 }, recordedAt: now },
  { id: 2, area: "Airport", score: 64, factors: { usability: 56, reliability: 59, sentiment: 50, parity: 45, opportunity: 82, complaints: 42 }, recordedAt: now },
  { id: 3, area: "Booking", score: 78, factors: { usability: 76, reliability: 83, sentiment: 72, parity: 70, opportunity: 68, complaints: 65 }, recordedAt: now },
  { id: 4, area: "Payments", score: 72, factors: { usability: 68, reliability: 75, sentiment: 63, parity: 69, opportunity: 70, complaints: 59 }, recordedAt: now },
  { id: 5, area: "Safety", score: 86, factors: { usability: 82, reliability: 88, sentiment: 84, parity: 80, opportunity: 61, complaints: 78 }, recordedAt: now },
  { id: 6, area: "Promotions", score: 54, factors: { usability: 45, reliability: 58, sentiment: 41, parity: 49, opportunity: 84, complaints: 35 }, recordedAt: new Date("2026-06-05T08:00:00.000Z") },
  { id: 7, area: "Airport", score: 61, factors: { usability: 53, reliability: 56, sentiment: 47, parity: 43, opportunity: 79, complaints: 39 }, recordedAt: new Date("2026-06-05T08:00:00.000Z") },
  { id: 8, area: "Booking", score: 76, factors: { usability: 73, reliability: 82, sentiment: 70, parity: 68, opportunity: 66, complaints: 63 }, recordedAt: new Date("2026-06-05T08:00:00.000Z") },
];

const demoOpportunities = [
  { id: 1, problem: "Promo auto-apply MVP", evidence: "Largest complaint cluster and weak Promotions score.", impact: 9, frequency: 8, reach: 8, effort: 4, status: "planned", owner: "Product" },
  { id: 2, problem: "Airport pickup guidance", evidence: "Terminal confusion and driver coordination complaints.", impact: 8, frequency: 7, reach: 7, effort: 5, status: "backlog", owner: "UX" },
  { id: 3, problem: "Ride selection redesign", evidence: "Users struggle to compare taxi, fixed fare, and premium options.", impact: 7, frequency: 7, reach: 8, effort: 4, status: "backlog", owner: "Design" },
  { id: 4, problem: "Wallet refund visibility", evidence: "Payments complaints mention missing credit clarity.", impact: 6, frequency: 6, reach: 6, effort: 3, status: "backlog", owner: "Payments" },
];

const demoVisualUploads = [
  {
    id: "demo-upload-1",
    section: "product-health",
    analysisType: "Beacon Score review",
    context: "Promo checkout flow review",
    analysis:
      "Beacon Score impact: improves satisfaction and adoption if promo discovery is made automatic at checkout.",
    images: [],
    imageCount: 0,
    createdAt: now,
  },
  {
    id: "demo-upload-2",
    section: "competitors",
    analysisType: "Competitor teardown",
    context: "Grab promo placement benchmark",
    analysis:
      "Competitor signal: clearer discount state and fewer manual entry steps reduce booking friction.",
    images: [],
    imageCount: 0,
    createdAt: new Date("2026-06-11T08:00:00.000Z"),
  },
];

function sortRows<T extends Record<string, unknown>>(rows: T[], orderBy: unknown) {
  const order = Array.isArray(orderBy) ? orderBy[0] : orderBy;
  if (!order || typeof order !== "object") return rows;
  const [[key, direction]] = Object.entries(order as Record<string, string>);
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av instanceof Date && bv instanceof Date) {
      return direction === "desc"
        ? bv.getTime() - av.getTime()
        : av.getTime() - bv.getTime();
    }
    if (typeof av === "number" && typeof bv === "number") {
      return direction === "desc" ? bv - av : av - bv;
    }
    return 0;
  });
}

function takeRows<T>(rows: T[], take?: number) {
  return typeof take === "number" ? rows.slice(0, take) : rows;
}

function groupByRows<T extends Record<string, unknown>>(rows: T[], by: string[]) {
  const key = by[0];
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(String(row[key]), (counts.get(String(row[key])) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([value, count]) => ({
    [key]: value,
    _count: { _all: count },
  }));
}

function matchesField(value: unknown, condition: unknown) {
  if (condition && typeof condition === "object") {
    const lookup = condition as Record<string, unknown>;
    if (Array.isArray(lookup.in)) return lookup.in.includes(value);
    if ("not" in lookup) return value !== lookup.not;
  }
  return value === condition;
}

function filterRows<T extends Record<string, unknown>>(rows: T[], where: unknown) {
  if (!where || typeof where !== "object") return rows;
  return rows.filter((row) =>
    Object.entries(where as Record<string, unknown>).every(([key, condition]) =>
      matchesField(row[key], condition)
    )
  );
}

function createDemoClient() {
  return {
    competitor: {
      findMany: async (args?: { include?: unknown }) =>
        demoCompetitors.map((competitor) => ({
          ...competitor,
          features:
            args?.include && typeof args.include === "object"
              ? demoCompetitorFeatures.filter(
                  (item) => item.competitorId === competitor.id
                )
              : undefined,
        })),
    },
    feature: {
      findMany: async (args?: { include?: unknown; orderBy?: unknown }) =>
        sortRows(
          demoFeatures.map((feature) => ({
            ...feature,
            competitors:
              args?.include && typeof args.include === "object"
                ? demoCompetitorFeatures.filter((item) => item.featureId === feature.id)
                : undefined,
          })),
          args?.orderBy
        ),
    },
    competitorFeature: {
      findMany: async () => demoCompetitorFeatures,
    },
    complaintCluster: {
      findMany: async (args?: { orderBy?: unknown; take?: number }) =>
        takeRows(sortRows(demoComplaints, args?.orderBy), args?.take),
    },
    signal: {
      findMany: async (args?: { where?: unknown; orderBy?: unknown; take?: number }) =>
        takeRows(sortRows(filterRows(demoSignals, args?.where), args?.orderBy), args?.take),
      findUnique: async (args: { where?: { externalId?: string } }) =>
        demoSignals.find((signal) => signal.externalId === args.where?.externalId) ?? null,
      update: async (args: { where: { externalId?: string }; data: Record<string, unknown> }) => {
        const index = demoSignals.findIndex(
          (signal) => signal.externalId === args.where.externalId
        );
        if (index === -1) return null;
        demoSignals[index] = { ...demoSignals[index], ...args.data };
        return demoSignals[index];
      },
      create: async (args: { data: Record<string, unknown> }) => {
        const row = {
          id: Math.max(0, ...demoSignals.map((signal) => signal.id)) + 1,
          source: String(args.data.source ?? "App Store"),
          category: String(args.data.category ?? "Reviews"),
          sentiment: String(args.data.sentiment ?? "neutral"),
          text: String(args.data.text ?? ""),
          createdAt:
            args.data.createdAt instanceof Date ? args.data.createdAt : new Date(),
          externalId: (args.data.externalId as string | null) ?? null,
          rating: (args.data.rating as number | null) ?? null,
          appVersion: (args.data.appVersion as string | null) ?? null,
          author: (args.data.author as string | null) ?? null,
          title: (args.data.title as string | null) ?? null,
        };
        demoSignals = [row, ...demoSignals];
        return row;
      },
      deleteMany: async (args?: { where?: { externalId?: { startsWith?: string } } }) => {
        const startsWith = args?.where?.externalId?.startsWith;
        if (!startsWith) return { count: 0 };
        const before = demoSignals.length;
        demoSignals = demoSignals.filter(
          (signal) => !signal.externalId?.startsWith(startsWith)
        );
        return { count: before - demoSignals.length };
      },
      groupBy: async (args: { by: string[] }) => groupByRows(demoSignals, args.by),
    },
    storeIntegration: {
      findMany: async () => [],
      findUnique: async () => null,
      upsert: async () => null,
      update: async () => null,
      delete: async () => null,
    },
    beaconScore: {
      findMany: async (args?: { orderBy?: unknown }) =>
        sortRows(demoScores, args?.orderBy),
    },
    opportunity: {
      findMany: async () => demoOpportunities,
    },
    visualUpload: {
      findMany: async (args?: { where?: unknown; orderBy?: unknown; take?: number }) =>
        takeRows(
          sortRows(filterRows(demoVisualUploads, args?.where), args?.orderBy),
          args?.take
        ),
      count: async () => demoVisualUploads.length,
      create: async (args: { data: Record<string, unknown> }) => ({
        id: "demo-upload-created",
        section: String(args.data.section ?? "product-health"),
        analysisType: String(args.data.analysisType ?? "Beacon Score review"),
        context: (args.data.context as string | null) ?? null,
        analysis: String(args.data.analysis ?? ""),
        images: Array.isArray(args.data.images) ? (args.data.images as string[]) : [],
        imageCount: Number(args.data.imageCount ?? 0),
        createdAt: new Date(),
      }),
    },
    chatMessage: {
      create: async () => null,
    },
  };
}

function shouldUseDemoData() {
  const url = process.env.DATABASE_URL;
  return (
    process.env.VERCEL === "1" &&
    (!url || url.includes("localhost") || url.includes("127.0.0.1"))
  );
}

function createPrismaClient() {
  if (shouldUseDemoData()) return createDemoClient() as unknown as PrismaClient;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
