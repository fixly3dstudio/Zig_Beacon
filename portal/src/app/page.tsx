import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/card";
import { CountUp } from "@/components/dashboard/count-up";
import { AnimatedBar } from "@/components/dashboard/animated-bar";

export const dynamic = "force-dynamic";

const RED = "#dc2626";
const AMBER = "#f59e0b";

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function scoreColor(score: number) {
  if (score >= 85) return "text-foreground font-semibold";
  if (score < 50) return "font-semibold";
  return "text-muted";
}

export default async function Home() {
  const [scores, signals, complaints, opportunities, recent] =
    await Promise.all([
      prisma.beaconScore.findMany({ orderBy: { recordedAt: "desc" } }),
      prisma.signal.groupBy({
        by: ["sentiment"],
        _count: { _all: true },
      }),
      prisma.complaintCluster.findMany({
        orderBy: { volume: "desc" },
        take: 5,
      }),
      prisma.opportunity.findMany(),
      prisma.signal.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  // Latest + previous score per area
  const byArea = new Map<string, number[]>();
  for (const s of scores) {
    const arr = byArea.get(s.area) ?? [];
    arr.push(s.score);
    byArea.set(s.area, arr);
  }
  const areas = Array.from(byArea.entries()).map(([area, arr]) => ({
    area,
    latest: arr[0] ?? 0,
    previous: arr[1] ?? arr[0] ?? 0,
  }));

  const overall =
    areas.length > 0
      ? Math.round(areas.reduce((a, x) => a + x.latest, 0) / areas.length)
      : 0;
  const overallPrev =
    areas.length > 0
      ? Math.round(areas.reduce((a, x) => a + x.previous, 0) / areas.length)
      : 0;
  const delta = overall - overallPrev;

  // Sentiment
  const sentMap = new Map(signals.map((g) => [g.sentiment, g._count._all]));
  const positive = sentMap.get("positive") ?? 0;
  const neutral = sentMap.get("neutral") ?? 0;
  const negative = sentMap.get("negative") ?? 0;
  const totalSignals = positive + neutral + negative;
  const pct = (n: number) =>
    totalSignals > 0 ? Math.round((n / totalSignals) * 100) : 0;

  const sentimentRows = [
    { label: "Positive", count: positive, color: "#0a0a0a" },
    { label: "Neutral", count: neutral, color: "#d4d4d8" },
    { label: "Negative", count: negative, color: RED },
  ];

  // Opportunities ranked by impact * frequency * reach / effort
  const rankedOpps = [...opportunities]
    .map((o) => ({
      ...o,
      computed: Math.round(
        (o.impact * o.frequency * o.reach) / Math.max(o.effort, 1)
      ),
    }))
    .sort((a, b) => b.computed - a.computed)
    .slice(0, 4);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Dashboard
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Product intelligence overview across all areas.
      </p>

      <div className="mt-8 grid grid-cols-12 gap-5">
        {/* Row 1: Score hero */}
        <Card className="col-span-12 lg:col-span-7">
          <div className="flex items-start justify-between">
            <CardLabel>Overall Beacon Score</CardLabel>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                delta >= 0 ? "text-brand" : "text-[#dc2626]"
              )}
              style={{
                backgroundColor:
                  delta >= 0 ? "rgba(3,103,252,0.08)" : "rgba(220,38,38,0.08)",
              }}
            >
              {delta >= 0 ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}
              {delta >= 0 ? "+" : ""}
              {delta} vs 30d
            </span>
          </div>

          <div className="mt-5 flex items-baseline">
            <CountUp
              value={overall}
              className="text-[72px] font-semibold leading-none tracking-tight text-foreground tabular-nums"
            />
            <span className="ml-2 text-2xl font-medium text-muted">/100</span>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
            {areas.map((a) => (
              <div
                key={a.area}
                className="flex items-center justify-between border-b border-border/60 pb-2"
              >
                <span className="text-[13px] text-foreground">{a.area}</span>
                <span
                  className={cn(
                    "text-[13px] tabular-nums",
                    scoreColor(a.latest)
                  )}
                  style={a.latest < 50 ? { color: RED } : undefined}
                >
                  {a.latest}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Row 1: Sentiment */}
        <Card className="col-span-12 lg:col-span-5">
          <CardLabel>Customer sentiment</CardLabel>
          <div className="mt-6 space-y-5">
            {sentimentRows.map((row, i) => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-foreground">
                    {row.label}
                  </span>
                  <span className="text-[13px] tabular-nums text-muted">
                    {row.count.toLocaleString()}{" "}
                    <span className="text-foreground">{pct(row.count)}%</span>
                  </span>
                </div>
                <AnimatedBar
                  pct={pct(row.count)}
                  color={row.color}
                  delay={i * 0.12}
                />
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted">
            Based on {totalSignals.toLocaleString()} signals across all sources.
          </p>
        </Card>

        {/* Row 2: Top complaints */}
        <Card className="col-span-12 lg:col-span-7">
          <h2 className="text-[15px] font-medium text-foreground">
            Top complaints
          </h2>
          <ul className="mt-5 space-y-1">
            {complaints.map((c, i) => {
              const rising = c.trendPct >= 0;
              const sevColor =
                c.severity === "high"
                  ? RED
                  : c.severity === "medium"
                    ? AMBER
                    : "#a1a1aa";
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0"
                >
                  <span className="w-4 text-[13px] tabular-nums text-muted">
                    {i + 1}
                  </span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: sevColor }}
                    title={`${c.severity} severity`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {c.issue}
                    </p>
                    <span className="text-[11px] text-muted">{c.category}</span>
                  </div>
                  <span className="text-[13px] tabular-nums text-muted">
                    {c.volume.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "inline-flex w-14 items-center justify-end gap-0.5 text-xs font-medium tabular-nums",
                      rising ? "text-[#dc2626]" : "text-brand"
                    )}
                  >
                    {rising ? (
                      <ArrowUpRight size={13} />
                    ) : (
                      <ArrowDownRight size={13} />
                    )}
                    {rising ? "+" : ""}
                    {Math.round(c.trendPct)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Row 2: Priority opportunities */}
        <Card className="col-span-12 lg:col-span-5">
          <h2 className="text-[15px] font-medium text-foreground">
            Priority opportunities
          </h2>
          <ul className="mt-5 space-y-4">
            {rankedOpps.map((o) => (
              <li
                key={o.id}
                className="border-b border-border/60 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-foreground px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-background">
                    {o.computed}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-snug text-foreground">
                      {o.problem}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted">
                      <span>Impact {o.impact}</span>
                      <span>Effort {o.effort}</span>
                      <span className="inline-flex items-center rounded-full border border-border px-1.5 py-0.5 capitalize">
                        {o.status}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Row 3: Recent activity */}
        <Card className="col-span-12">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-foreground">
              Recent activity
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              Live
            </span>
          </div>
          <ul className="mt-4">
            {recent.map((s) => {
              const dot =
                s.sentiment === "positive"
                  ? "#0a0a0a"
                  : s.sentiment === "negative"
                    ? RED
                    : "#d4d4d8";
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dot }}
                  />
                  <p className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                    {s.text}
                  </p>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
                    {s.source}
                  </span>
                  <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted">
                    {relativeTime(s.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
