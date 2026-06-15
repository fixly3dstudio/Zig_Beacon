import { prisma } from "@/lib/db";
import {
  ComplaintsView,
  type ComplaintClusterItem,
  type ComplaintSignal,
} from "@/components/complaint-heatmap/complaints-view";

export const dynamic = "force-dynamic";

export const metadata = { title: "Complaints — Zig Beacon" };

const sourceOrder = ["App Store", "Play Store", "Reddit", "Support", "Twitter"];

function sortByKnownOrder(values: string[]) {
  return [...values].sort((a, b) => {
    const aIndex = sourceOrder.indexOf(a);
    const bIndex = sourceOrder.indexOf(b);
    return (
      (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
      (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex)
    );
  });
}

export default async function Page() {
  const [signalsRaw, clustersRaw] = await Promise.all([
    prisma.signal.findMany({
      where: { sentiment: { in: ["negative", "neutral"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.complaintCluster.findMany({
      orderBy: [{ severity: "asc" }, { volume: "desc" }],
    }),
  ]);

  const signals: ComplaintSignal[] = signalsRaw.map((signal) => ({
    id: signal.id,
    source: signal.source,
    category: signal.category,
    sentiment: signal.sentiment,
    text: signal.text,
    createdAt: signal.createdAt.toISOString(),
  }));

  const clusters: ComplaintClusterItem[] = clustersRaw.map((cluster) => ({
    id: cluster.id,
    issue: cluster.issue,
    category: cluster.category,
    volume: cluster.volume,
    trendPct: cluster.trendPct,
    severity: cluster.severity,
  }));

  const sources = sortByKnownOrder(
    Array.from(new Set(signals.map((signal) => signal.source)))
  );
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Complaints
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
          What customers are saying across App Store, Play Store, Reddit, Support
          and Twitter — in their own words, with consolidated feature reports.
        </p>
      </div>

      <ComplaintsView clusters={clusters} signals={signals} sources={sources} />
    </div>
  );
}
