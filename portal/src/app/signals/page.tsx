import {
  ArrowDownRight,
  ArrowUpRight,
  MessageSquareText,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/card";
import { AnimatedBar } from "@/components/dashboard/animated-bar";

export const dynamic = "force-dynamic";

const RED = "#dc2626";
const AMBER = "#f59e0b";

type Sentiment = "positive" | "neutral" | "negative";

const sentimentMeta: Record<
  Sentiment,
  { label: string; color: string; textClass: string }
> = {
  positive: {
    label: "Positive",
    color: "#0a0a0a",
    textClass: "text-foreground",
  },
  neutral: {
    label: "Neutral",
    color: "#d4d4d8",
    textClass: "text-muted",
  },
  negative: {
    label: "Negative",
    color: RED,
    textClass: "text-[#dc2626]",
  },
};

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function severityColor(severity: string) {
  if (severity === "high") return RED;
  if (severity === "medium") return AMBER;
  return "#a1a1aa";
}

function formatSource(source: string) {
  if (source === "App Store") return "App Store";
  if (source === "Play Store") return "Play Store";
  return source;
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days < 1) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export default async function Page() {
  const [signals, sentimentGroups, sourceGroups, categoryGroups, complaints] =
    await Promise.all([
      prisma.signal.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.signal.groupBy({
        by: ["sentiment"],
        _count: { _all: true },
      }),
      prisma.signal.groupBy({
        by: ["source"],
        _count: { _all: true },
      }),
      prisma.signal.groupBy({
        by: ["category", "sentiment"],
        _count: { _all: true },
      }),
      prisma.complaintCluster.findMany({
        orderBy: { volume: "desc" },
      }),
    ]);

  const totalSignals = signals.length;
  const sentimentCounts = new Map(
    sentimentGroups.map((group) => [group.sentiment, group._count._all])
  );
  const negative = sentimentCounts.get("negative") ?? 0;
  const negativeShare = pct(negative, totalSignals);

  const sources = sourceGroups
    .map((source) => ({
      source: source.source,
      count: source._count._all,
      share: pct(source._count._all, totalSignals),
    }))
    .sort((a, b) => b.count - a.count);

  const categoryMap = new Map<
    string,
    { category: string; positive: number; neutral: number; negative: number; total: number }
  >();
  for (const group of categoryGroups) {
    const current =
      categoryMap.get(group.category) ??
      {
        category: group.category,
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
      };
    const count = group._count._all;
    if (group.sentiment === "positive") current.positive += count;
    if (group.sentiment === "neutral") current.neutral += count;
    if (group.sentiment === "negative") current.negative += count;
    current.total += count;
    categoryMap.set(group.category, current);
  }

  const categories = Array.from(categoryMap.values()).sort((a, b) => {
    const aRisk = a.negative * 3 + a.neutral;
    const bRisk = b.negative * 3 + b.neutral;
    return bRisk - aRisk;
  });

  const totalComplaintVolume = complaints.reduce(
    (sum, complaint) => sum + complaint.volume,
    0
  );
  const risingComplaints = complaints.filter(
    (complaint) => complaint.trendPct > 0
  ).length;
  const highSeverity = complaints.filter(
    (complaint) => complaint.severity === "high"
  ).length;

  const weeklyBuckets = [0, 1, 2, 3].map((week) => {
    const start = week * 7;
    const end = start + 7;
    const bucketSignals = signals.filter((signal) => {
      const ageDays = Math.floor(
        (Date.now() - signal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      );
      return ageDays >= start && ageDays < end;
    });
    return {
      label: week === 0 ? "This week" : `${start}-${end - 1}d`,
      positive: bucketSignals.filter((signal) => signal.sentiment === "positive")
        .length,
      neutral: bucketSignals.filter((signal) => signal.sentiment === "neutral")
        .length,
      negative: bucketSignals.filter((signal) => signal.sentiment === "negative")
        .length,
      total: bucketSignals.length,
    };
  });

  const maxWeeklyTotal = Math.max(
    1,
    ...weeklyBuckets.map((bucket) => bucket.total)
  );
  const recentSignals = signals.slice(0, 7);

  const sentimentRows: Sentiment[] = ["positive", "neutral", "negative"];

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Customer Signals
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            Voice-of-customer intelligence across app reviews, social channels,
            support tickets, and complaint clusters.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted">
          <Radio size={14} className="text-brand" />
          {totalSignals} live signals
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <CardLabel>Signal volume</CardLabel>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {totalSignals}
            </p>
            <MessageSquareText size={22} className="text-muted" />
          </div>
          <p className="mt-1 text-xs text-muted">
            Customer comments seeded across the last 30 days
          </p>
        </Card>
        <Card className="p-5">
          <CardLabel>Negative share</CardLabel>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-[#dc2626] tabular-nums">
              {negativeShare}%
            </p>
            <ShieldAlert size={22} className="text-muted" />
          </div>
          <p className="mt-1 text-xs text-muted">
            {negative} negative signals requiring product attention
          </p>
        </Card>
        <Card className="p-5">
          <CardLabel>Complaint pressure</CardLabel>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {totalComplaintVolume.toLocaleString()}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#dc2626]">
              <ArrowUpRight size={14} />
              {risingComplaints} rising
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Total clustered complaint mentions; {highSeverity} high severity
          </p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-5">
        <Card className="col-span-12 lg:col-span-5">
          <CardLabel>Sentiment split</CardLabel>
          <div className="mt-6 space-y-5">
            {sentimentRows.map((sentiment, index) => {
              const count = sentimentCounts.get(sentiment) ?? 0;
              const meta = sentimentMeta[sentiment];
              return (
                <div key={sentiment}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span
                      className={cn("text-[13px] font-medium", meta.textClass)}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[13px] tabular-nums text-muted">
                      {count.toLocaleString()}{" "}
                      <span className="text-foreground">
                        {pct(count, totalSignals)}%
                      </span>
                    </span>
                  </div>
                  <AnimatedBar
                    pct={pct(count, totalSignals)}
                    color={meta.color}
                    delay={index * 0.12}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-7 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Main readout
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  Positive reliability comments still outnumber negative
                  feedback, but Promotions, Airport, and Rewards create visible
                  customer friction.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardLabel>Complaint clusters</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Volume and trend by issue
              </h2>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
              {complaints.length} clusters
            </span>
          </div>

          <div className="mt-5 space-y-1">
            {complaints.map((complaint, index) => {
              const rising = complaint.trendPct >= 0;
              return (
                <div
                  className="grid gap-3 border-b border-border/70 py-3 last:border-0 sm:grid-cols-[24px_1fr_130px_72px]"
                  key={complaint.id}
                >
                  <span className="text-[13px] tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: severityColor(complaint.severity),
                        }}
                      />
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {complaint.issue}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      {complaint.category} · {complaint.severity} severity
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right text-[13px] tabular-nums text-muted">
                      {complaint.volume}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-foreground"
                        style={{
                          width: `${pct(complaint.volume, complaints[0]?.volume ?? 1)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center justify-end gap-1 text-xs font-medium tabular-nums",
                      rising ? "text-[#dc2626]" : "text-brand"
                    )}
                  >
                    {rising ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    {rising ? "+" : ""}
                    {Math.round(complaint.trendPct)}%
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardLabel>Category hotspots</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Where sentiment is concentrating
              </h2>
            </div>
            <Search size={18} className="text-muted" />
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] border-collapse text-sm">
                <thead className="bg-surface">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Signals
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Sentiment mix
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Risk
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const risk = Math.round(
                      ((category.negative * 3 + category.neutral) /
                        Math.max(category.total * 3, 1)) *
                        100
                    );
                    return (
                      <tr
                        className="border-b border-border/70 last:border-0"
                        key={category.category}
                      >
                        <td className="px-4 py-4">
                          <p className="font-medium text-foreground">
                            {category.category}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-[13px] tabular-nums text-muted">
                          {category.total}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                            <div
                              className="bg-foreground"
                              style={{
                                width: `${pct(category.positive, category.total)}%`,
                              }}
                            />
                            <div
                              className="bg-zinc-300"
                              style={{
                                width: `${pct(category.neutral, category.total)}%`,
                              }}
                            />
                            <div
                              className="bg-[#dc2626]"
                              style={{
                                width: `${pct(category.negative, category.total)}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1.5 text-[11px] text-muted">
                            {category.positive} pos · {category.neutral} neu ·{" "}
                            {category.negative} neg
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
                              risk >= 45
                                ? "bg-[rgba(220,38,38,0.08)] text-[#dc2626]"
                                : "bg-zinc-100 text-muted"
                            )}
                          >
                            {risk}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardLabel>Source breakdown</CardLabel>
          <div className="mt-5 space-y-4">
            {sources.map((source, index) => (
              <div key={source.source}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-foreground">
                    {formatSource(source.source)}
                  </span>
                  <span className="text-[13px] tabular-nums text-muted">
                    {source.count}{" "}
                    <span className="text-foreground">{source.share}%</span>
                  </span>
                </div>
                <AnimatedBar
                  pct={source.share}
                  color={index === 0 ? "#0367fc" : "#0a0a0a"}
                  delay={index * 0.08}
                />
              </div>
            ))}
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <CardLabel>Review stores</CardLabel>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {sources
                  .filter((source) => source.source.includes("Store"))
                  .reduce((sum, source) => sum + source.count, 0)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <CardLabel>Social/support</CardLabel>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {sources
                  .filter((source) => !source.source.includes("Store"))
                  .reduce((sum, source) => sum + source.count, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardLabel>30-day pulse</CardLabel>
          <div className="mt-5 space-y-4">
            {weeklyBuckets.map((bucket) => (
              <div
                className="grid grid-cols-[76px_1fr_36px] items-center gap-3"
                key={bucket.label}
              >
                <span className="text-xs text-muted">{bucket.label}</span>
                <div className="flex h-8 items-end gap-1">
                  <div
                    className="w-3 rounded-t bg-foreground"
                    style={{
                      height: `${Math.max(10, (bucket.positive / maxWeeklyTotal) * 32)}px`,
                    }}
                    title={`${bucket.positive} positive`}
                  />
                  <div
                    className="w-3 rounded-t bg-zinc-300"
                    style={{
                      height: `${Math.max(10, (bucket.neutral / maxWeeklyTotal) * 32)}px`,
                    }}
                    title={`${bucket.neutral} neutral`}
                  />
                  <div
                    className="w-3 rounded-t bg-[#dc2626]"
                    style={{
                      height: `${Math.max(10, (bucket.negative / maxWeeklyTotal) * 32)}px`,
                    }}
                    title={`${bucket.negative} negative`}
                  />
                </div>
                <span className="text-right text-xs tabular-nums text-muted">
                  {bucket.total}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-foreground" />
              Positive
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-zinc-300" />
              Neutral
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#dc2626]" />
              Negative
            </span>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardLabel>Recent voice of customer</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Latest signal excerpts
              </h2>
            </div>
            <Star size={18} className="text-muted" />
          </div>
          <ul className="mt-4">
            {recentSignals.map((signal) => {
              const sentiment = signal.sentiment as Sentiment;
              const meta = sentimentMeta[sentiment] ?? sentimentMeta.neutral;
              return (
                <li
                  className="grid gap-3 border-b border-border/70 py-3 last:border-0 sm:grid-cols-[92px_1fr_68px]"
                  key={signal.id}
                >
                  <div>
                    <p className="text-[12px] font-medium text-foreground">
                      {signal.source}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {signal.category}
                    </p>
                  </div>
                  <p className="text-[13px] leading-5 text-foreground">
                    {signal.text}
                  </p>
                  <div className="text-left sm:text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                        meta.textClass,
                        sentiment === "negative"
                          ? "bg-[rgba(220,38,38,0.08)]"
                          : "bg-zinc-100"
                      )}
                    >
                      {signal.sentiment}
                    </span>
                    <p className="mt-1 text-[11px] text-muted">
                      {relativeTime(signal.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
