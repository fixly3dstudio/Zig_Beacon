import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/card";
import { CountUp } from "@/components/dashboard/count-up";
import { AnimatedBar } from "@/components/dashboard/animated-bar";
import { Sparkline } from "@/components/dashboard/sparkline";
import { ImpactEffortMatrix } from "@/components/dashboard/impact-effort-matrix";
import { LiveTopComplaints } from "@/components/dashboard/live-top-complaints";
import { UploadsPanelServer } from "@/components/visual-review/uploads-panel-server";

export const dynamic = "force-dynamic";

const RED = "var(--danger)";
const AMBER = "var(--warn)";

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

function ViewLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-brand"
    >
      View
      <ArrowRight size={13} />
    </Link>
  );
}

function Delta({ value, suffix = "" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        positive ? "text-brand" : "text-[var(--danger)]"
      )}
    >
      {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

export default async function Home() {
  const [scores, signals, complaints, opportunities, recent, competitors] =
    await Promise.all([
      prisma.beaconScore.findMany({ orderBy: { recordedAt: "asc" } }),
      prisma.signal.groupBy({ by: ["sentiment"], _count: { _all: true } }),
      prisma.complaintCluster.findMany({ orderBy: { volume: "desc" } }),
      prisma.opportunity.findMany(),
      prisma.signal.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.competitor.findMany({
        include: { features: { include: { feature: true } } },
      }),
    ]);

  // ── Score history per area (chronological) ──────────────────────────────
  const historyByArea = new Map<string, number[]>();
  for (const s of scores) {
    const arr = historyByArea.get(s.area) ?? [];
    arr.push(s.score);
    historyByArea.set(s.area, arr);
  }
  const areas = Array.from(historyByArea.entries())
    .map(([area, history]) => ({
      area,
      history,
      latest: history[history.length - 1] ?? 0,
      previous: history[history.length - 2] ?? history[history.length - 1] ?? 0,
      monthAgo: history[Math.max(history.length - 5, 0)] ?? 0,
    }))
    .sort((a, b) => a.latest - b.latest);

  const weeks = Math.max(...areas.map((a) => a.history.length), 0);
  const overallHistory = Array.from({ length: weeks }, (_, w) =>
    Math.round(
      areas.reduce((sum, a) => sum + (a.history[w] ?? a.latest), 0) /
        Math.max(areas.length, 1)
    )
  );
  const overall = overallHistory[overallHistory.length - 1] ?? 0;
  const overallMonthAgo =
    overallHistory[Math.max(overallHistory.length - 5, 0)] ?? overall;
  const overallDelta = overall - overallMonthAgo;

  // ── Sentiment ────────────────────────────────────────────────────────────
  const sentMap = new Map(signals.map((g) => [g.sentiment, g._count._all]));
  const positive = sentMap.get("positive") ?? 0;
  const neutral = sentMap.get("neutral") ?? 0;
  const negative = sentMap.get("negative") ?? 0;
  const totalSignals = positive + neutral + negative;
  const pct = (n: number) =>
    totalSignals > 0 ? Math.round((n / totalSignals) * 100) : 0;

  const sentimentRows = [
    { label: "Positive", count: positive, color: "var(--foreground)" },
    { label: "Neutral", count: neutral, color: "var(--track)" },
    { label: "Negative", count: negative, color: RED },
  ];

  // ── Complaints ───────────────────────────────────────────────────────────
  const totalComplaintVolume = complaints.reduce((a, c) => a + c.volume, 0);
  const weightedTrend =
    totalComplaintVolume > 0
      ? Math.round(
          complaints.reduce((a, c) => a + c.trendPct * c.volume, 0) /
            totalComplaintVolume
        )
      : 0;
  const fastestRising = [...complaints].sort((a, b) => b.trendPct - a.trendPct)[0];
  const topComplaints = complaints.slice(0, 5);

  // ── Opportunities ────────────────────────────────────────────────────────
  const ranked = opportunities
    .map((o) => ({
      ...o,
      computed: Math.round(
        (o.impact * o.frequency * o.reach) / Math.max(o.effort, 1)
      ),
    }))
    .sort((a, b) => b.computed - a.computed);
  const inProgress = ranked.filter((o) => o.status === "in-progress").length;
  const topOpportunity = ranked[0];

  // ── Competitor gaps: features rivals ship that Zig doesn't ──────────────
  const zig = competitors.find((c) => c.name === "Zig");
  const rivals = competitors.filter((c) => c.name !== "Zig");
  const zigStatus = new Map(
    (zig?.features ?? []).map((f) => [f.featureId, f.status])
  );
  const gapCounts = new Map<number, { name: string; category: string; rivals: string[] }>();
  for (const rival of rivals) {
    for (const f of rival.features) {
      if (f.status !== "available") continue;
      const ours = zigStatus.get(f.featureId);
      if (ours === "available") continue;
      const entry = gapCounts.get(f.featureId) ?? {
        name: f.feature.name,
        category: f.feature.category,
        rivals: [],
      };
      entry.rivals.push(rival.name);
      gapCounts.set(f.featureId, entry);
    }
  }
  const topGaps = Array.from(gapCounts.values())
    .sort((a, b) => b.rivals.length - a.rivals.length)
    .slice(0, 5);

  // ── Attention narrative ──────────────────────────────────────────────────
  const weakest = areas[0];

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Product intelligence overview · updated weekly from {totalSignals} signals,{" "}
            {complaints.length} complaint clusters and {rivals.length} tracked competitors.
          </p>
        </div>
      </div>

      {/* Attention banner */}
      {weakest && fastestRising && topOpportunity && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-4 sm:flex-row sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warn/20">
            <AlertTriangle size={17} className="text-warn" />
          </div>
          <p className="flex-1 text-[13px] leading-6 text-foreground">
            <span className="font-semibold">{weakest.area}</span> is the weakest area at{" "}
            <span className="font-semibold tabular-nums">{weakest.latest}/100</span>, and{" "}
            <span className="font-semibold">“{fastestRising.issue}”</span> is the
            fastest-growing complaint ({fastestRising.trendPct >= 0 ? "+" : ""}
            {Math.round(fastestRising.trendPct)}% · {fastestRising.volume.toLocaleString()}{" "}
            reports). Highest-leverage response:{" "}
            <span className="font-semibold">{topOpportunity.problem}</span> (score{" "}
            {topOpportunity.computed}).
          </p>
          <Link
            href="/opportunities"
            className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background"
          >
            Open Opportunity Hub
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* KPI strip */}
      <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <CardLabel>Beacon Score</CardLabel>
            <Delta value={overallDelta} suffix=" /30d" />
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="flex items-baseline">
              <CountUp
                value={overall}
                className="text-4xl font-semibold tracking-tight text-foreground tabular-nums"
              />
              <span className="ml-1 text-sm text-muted">/100</span>
            </div>
            <Sparkline values={overallHistory} color="var(--brand)" fill />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <CardLabel>Negative sentiment</CardLabel>
            <span className="text-xs text-muted tabular-nums">{negative} signals</span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="flex items-baseline">
              <CountUp
                value={pct(negative)}
                className="text-4xl font-semibold tracking-tight text-foreground tabular-nums"
              />
              <span className="ml-1 text-sm text-muted">%</span>
            </div>
            <span className="text-xs leading-5 text-muted">
              of {totalSignals} signals
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <CardLabel>Complaint volume</CardLabel>
            <Delta value={weightedTrend} suffix="%" />
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <CountUp
              value={totalComplaintVolume}
              className="text-4xl font-semibold tracking-tight text-foreground tabular-nums"
            />
            <span className="text-xs leading-5 text-muted">
              across {complaints.length} clusters
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <CardLabel>Bets in delivery</CardLabel>
            <ViewLink href="/opportunities" />
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="flex items-baseline">
              <CountUp
                value={inProgress}
                className="text-4xl font-semibold tracking-tight text-foreground tabular-nums"
              />
              <span className="ml-1 text-sm text-muted">/ {ranked.length}</span>
            </div>
            <span className="text-xs leading-5 text-muted">in progress</span>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-12 gap-5">
        {/* Score by area with trends */}
        <Card className="col-span-12 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-foreground">
              Beacon Score by area · 10-week trend
            </h2>
          </div>
          <ul className="mt-4">
            {areas.map((a) => {
              const delta = a.latest - a.monthAgo;
              const critical = a.latest < 50;
              return (
                <li
                  key={a.area}
                  className="flex items-center gap-4 border-b border-border/60 py-2.5 last:border-0"
                >
                  <span className="w-24 shrink-0 text-[13px] font-medium text-foreground">
                    {a.area}
                  </span>
                  <Sparkline
                    values={a.history}
                    width={120}
                    height={24}
                    color={critical ? RED : "var(--foreground)"}
                  />
                  <div className="flex flex-1 items-center justify-end gap-4">
                    <Delta value={delta} />
                    <span
                      className={cn(
                        "w-10 text-right text-[15px] font-semibold tabular-nums",
                        critical ? "" : "text-foreground"
                      )}
                      style={critical ? { color: RED } : undefined}
                    >
                      {a.latest}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] text-muted">
            Sorted weakest first — the top rows are where attention pays off most.
          </p>
        </Card>

        {/* Sentiment */}
        <Card className="col-span-12 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-foreground">Customer sentiment</h2>
            <ViewLink href="/complaint-heatmap" />
          </div>
          <div className="mt-6 space-y-5">
            {sentimentRows.map((row, i) => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-foreground">{row.label}</span>
                  <span className="text-[13px] tabular-nums text-muted">
                    {row.count.toLocaleString()}{" "}
                    <span className="text-foreground">{pct(row.count)}%</span>
                  </span>
                </div>
                <AnimatedBar pct={pct(row.count)} color={row.color} delay={i * 0.12} />
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-surface p-3.5">
            <p className="text-xs leading-5 text-muted">
              {pct(negative)}% negative across {totalSignals} signals.{" "}
              {fastestRising
                ? `Most of the recent negativity maps to “${fastestRising.issue}” (${fastestRising.category}).`
                : ""}
            </p>
          </div>
        </Card>

        <LiveTopComplaints
          fallback={topComplaints.map((complaint) => ({
            id: complaint.id,
            issue: complaint.issue,
            category: complaint.category,
            volume: complaint.volume,
            trendPct: complaint.trendPct,
            severity: complaint.severity,
          }))}
        />

        {/* Impact / effort matrix */}
        <Card className="col-span-12 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-foreground">Where the bets sit</h2>
            <ViewLink href="/opportunities" />
          </div>
          <p className="mt-1 text-xs text-muted">
            All {ranked.length} opportunities by impact vs effort. Bubble size = priority score.
          </p>
          <div className="mt-4">
            <ImpactEffortMatrix
              opportunities={ranked.map((o) => ({
                id: o.id,
                problem: o.problem,
                impact: o.impact,
                effort: o.effort,
                score: o.computed,
                status: o.status,
              }))}
            />
          </div>
        </Card>

        {/* Competitor gaps */}
        <Card className="col-span-12 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-foreground">Competitor gaps</h2>
            <ViewLink href="/competitors" />
          </div>
          <p className="mt-1 text-xs text-muted">
            Features rivals ship that Zig doesn&apos;t have fully live.
          </p>
          <ul className="mt-4">
            {topGaps.map((gap) => (
              <li
                key={gap.name}
                className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{gap.name}</p>
                  <span className="text-[11px] text-muted">{gap.category}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {gap.rivals.slice(0, 4).map((r) => (
                    <span
                      key={r}
                      title={r}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-semibold text-muted"
                    >
                      {r.slice(0, 2).toUpperCase()}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent activity */}
        <Card className="col-span-12 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-foreground">Recent signals</h2>
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
                  ? "var(--foreground)"
                  : s.sentiment === "negative"
                    ? RED
                    : "var(--track)";
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dot }}
                    title={s.sentiment}
                  />
                  <p className="min-w-0 flex-1 truncate text-[13px] text-foreground">{s.text}</p>
                  <span className="hidden shrink-0 items-center rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted sm:inline-flex">
                    {s.category}
                  </span>
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

        <div className="col-span-12">
          <UploadsPanelServer title="Recent visual uploads" />
        </div>
      </div>
    </div>
  );
}
