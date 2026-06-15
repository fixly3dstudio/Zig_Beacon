import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calculator,
  Gauge,
  LineChart,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type FactorMap = {
  satisfaction?: number;
  adoption?: number;
  retention?: number;
  competitorPosition?: number;
  businessImpact?: number;
  complaintSeverity?: number;
};

type FactorKey = keyof FactorMap;

const factors: {
  key: FactorKey;
  label: string;
  weight: number;
  description: string;
}[] = [
  {
    key: "satisfaction",
    label: "Satisfaction",
    weight: 22,
    description: "Customer sentiment, app reviews, and support tone.",
  },
  {
    key: "adoption",
    label: "Adoption",
    weight: 18,
    description: "Usage readiness and feature uptake potential.",
  },
  {
    key: "retention",
    label: "Retention",
    weight: 16,
    description: "Likelihood the area keeps riders returning.",
  },
  {
    key: "competitorPosition",
    label: "Competitor position",
    weight: 16,
    description: "Zig's relative parity versus market alternatives.",
  },
  {
    key: "businessImpact",
    label: "Business impact",
    weight: 18,
    description: "Revenue, cost, trust, or strategic leverage.",
  },
  {
    key: "complaintSeverity",
    label: "Complaint severity",
    weight: 10,
    description: "Penalty-adjusted customer pain in this area.",
  },
];

function asFactors(value: unknown): FactorMap {
  if (!value || typeof value !== "object") return {};
  return value as FactorMap;
}

function scoreBand(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 65) return "Stable";
  if (score >= 50) return "Watch";
  return "At risk";
}

function scoreClass(score: number) {
  if (score >= 85) return "text-brand bg-brand/10";
  if (score >= 75) return "text-foreground bg-elevated";
  if (score >= 65) return "text-foreground bg-elevated";
  if (score >= 50) return "text-[var(--warn)] bg-warn/15";
  return "text-[var(--danger)] bg-danger/10";
}

function barColor(score: number) {
  if (score >= 85) return "bg-brand";
  if (score >= 70) return "bg-foreground";
  if (score >= 50) return "bg-[var(--warn)]";
  return "bg-[var(--danger)]";
}

function factorColor(value: number) {
  if (value >= 85) return "bg-brand";
  if (value >= 70) return "bg-foreground";
  if (value >= 50) return "bg-[var(--warn)]";
  return "bg-[var(--danger)]";
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-track">
      <div
        className={cn("h-full rounded-full", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function weightedScore(factorValues: FactorMap) {
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  const total = factors.reduce(
    (sum, factor) => sum + (factorValues[factor.key] ?? 0) * factor.weight,
    0
  );
  return Math.round(total / totalWeight);
}

export default async function Page() {
  const [scoreRows, complaints] = await Promise.all([
    prisma.beaconScore.findMany({ orderBy: { recordedAt: "desc" } }),
    prisma.complaintCluster.findMany({ orderBy: { volume: "desc" } }),
  ]);

  const byArea = new Map<string, typeof scoreRows>();
  for (const row of scoreRows) {
    byArea.set(row.area, [...(byArea.get(row.area) ?? []), row]);
  }

  const areas = Array.from(byArea.entries())
    .map(([area, rows]) => {
      const latest = rows[0];
      const previous = rows[1] ?? rows[0];
      const latestFactors = asFactors(latest.factors);
      const previousFactors = asFactors(previous.factors);
      const complaint = complaints.find((item) => item.category === area);
      const weakestFactor = factors
        .map((factor) => ({
          ...factor,
          value: latestFactors[factor.key] ?? 0,
          previous: previousFactors[factor.key] ?? latestFactors[factor.key] ?? 0,
        }))
        .sort((a, b) => a.value - b.value)[0];

      return {
        area,
        latest: latest.score,
        previous: previous.score,
        delta: latest.score - previous.score,
        latestFactors,
        previousFactors,
        complaint,
        computed: weightedScore(latestFactors),
        weakestFactor,
      };
    })
    .sort((a, b) => a.latest - b.latest);

  const overall =
    areas.length > 0
      ? Math.round(areas.reduce((sum, area) => sum + area.latest, 0) / areas.length)
      : 0;
  const previousOverall =
    areas.length > 0
      ? Math.round(areas.reduce((sum, area) => sum + area.previous, 0) / areas.length)
      : 0;
  const overallDelta = overall - previousOverall;
  const strongest = [...areas].sort((a, b) => b.latest - a.latest)[0];
  const weakest = areas[0];
  const watchCount = areas.filter((area) => area.latest < 70).length;
  const totalComplaintVolume = complaints.reduce(
    (sum, complaint) => sum + complaint.volume,
    0
  );

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Beacon Score
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            Explainable product scoring across satisfaction, adoption,
            retention, competitive position, business impact, and complaint
            severity.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted">
          <Gauge size={14} className="text-brand" />
          {areas.length} scored areas
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-5 md:col-span-2">
          <CardLabel>Overall Beacon Score</CardLabel>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div className="flex items-baseline">
              <p className="text-6xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                {overall}
              </p>
              <span className="ml-1.5 text-xl font-medium text-muted">/100</span>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
                overallDelta >= 0
                  ? "bg-brand/10 text-brand"
                  : "bg-danger/10 text-[var(--danger)]"
              )}
            >
              {overallDelta >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {overallDelta >= 0 ? "+" : ""}
              {overallDelta} vs 30d
            </span>
          </div>
          <div className="mt-5">
            <Bar value={overall} color={barColor(overall)} />
          </div>
        </Card>
        <Card className="p-5">
          <CardLabel>Strongest area</CardLabel>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {strongest?.area ?? "n/a"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {strongest ? `${strongest.latest}/100 score` : "No score data"}
          </p>
        </Card>
        <Card className="p-5">
          <CardLabel>Watch areas</CardLabel>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--danger)] tabular-nums">
            {watchCount}
          </p>
          <p className="mt-1 text-xs text-muted">Areas scoring below 70</p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-5">
        <Card className="col-span-12 lg:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardLabel>Area scorecards</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Factor breakdown by product area
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted">
              <LineChart size={14} />
              current and 30-day delta
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4">
            {areas.map((area) => {
              const deltaPositive = area.delta >= 0;
              return (
                <div
                  className="rounded-lg border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-background hover:shadow-sm"
                  key={area.area}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground">
                          {area.area}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            scoreClass(area.latest)
                          )}
                        >
                          {scoreBand(area.latest)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Weakest factor: {area.weakestFactor.label}{" "}
                        {area.weakestFactor.value}/100
                      </p>
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="text-right">
                        <p className="text-4xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                          {area.latest}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          computed {area.computed}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "mb-1 inline-flex items-center gap-1 text-xs font-medium tabular-nums",
                          deltaPositive ? "text-brand" : "text-[var(--danger)]"
                        )}
                      >
                        {deltaPositive ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownRight size={14} />
                        )}
                        {deltaPositive ? "+" : ""}
                        {area.delta}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {factors.map((factor) => {
                      const value = area.latestFactors[factor.key] ?? 0;
                      const previous =
                        area.previousFactors[factor.key] ?? value;
                      const factorDelta = value - previous;
                      return (
                        <div
                          className="rounded-md border border-border bg-background p-3"
                          key={`${area.area}-${factor.key}`}
                        >
                          <div className="mb-2 flex items-baseline justify-between gap-3">
                            <span className="text-[13px] font-medium text-foreground">
                              {factor.label}
                            </span>
                            <span className="text-[12px] tabular-nums text-muted">
                              {value}{" "}
                              <span
                                className={cn(
                                  factorDelta >= 0
                                    ? "text-brand"
                                    : "text-[var(--danger)]"
                                )}
                              >
                                {factorDelta >= 0 ? "+" : ""}
                                {factorDelta}
                              </span>
                            </span>
                          </div>
                          <Bar value={value} color={factorColor(value)} />
                        </div>
                      );
                    })}
                  </div>

                  {area.complaint ? (
                    <div className="mt-4 rounded-md border border-border bg-background p-3">
                      <div className="flex items-start gap-3">
                        <ShieldAlert
                          className="mt-0.5 text-[var(--danger)]"
                          size={16}
                        />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">
                            {area.complaint.issue}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {area.complaint.volume} complaints ·{" "}
                            {Math.round(area.complaint.trendPct)}% trend ·{" "}
                            {area.complaint.severity} severity
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="col-span-12 space-y-5 lg:col-span-4">
          <Card>
            <CardLabel>Formula</CardLabel>
            <div className="mt-4 flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground">
                <Calculator size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Weighted product score
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  Each area is scored from six factors, weighted for product and
                  business impact. Complaint severity lowers the final picture.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {factors.map((factor) => (
                <div key={factor.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-foreground">
                      {factor.label}
                    </span>
                    <span className="text-xs tabular-nums text-muted">
                      {factor.weight}%
                    </span>
                  </div>
                  <Bar value={factor.weight * 4} color="bg-foreground" />
                  <p className="mt-1 text-[11px] leading-4 text-muted">
                    {factor.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardLabel>Score distribution</CardLabel>
            <div className="mt-5 space-y-4">
              {["Excellent", "Strong", "Stable", "Watch", "At risk"].map(
                (band) => {
                  const count = areas.filter(
                    (area) => scoreBand(area.latest) === band
                  ).length;
                  return (
                    <div
                      className="flex items-center justify-between gap-3"
                      key={band}
                    >
                      <span className="text-[13px] font-medium text-foreground">
                        {band}
                      </span>
                      <div className="flex flex-1 items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{
                              width: `${areas.length > 0 ? (count / areas.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="w-5 text-right text-xs tabular-nums text-muted">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </Card>

          <Card>
            <CardLabel>Executive readout</CardLabel>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3 border-b border-border/70 pb-4">
                <BarChart3 className="mt-0.5 text-brand" size={17} />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Overall score is improving
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-muted">
                    Beacon is {overall}, up {overallDelta} points versus the
                    previous snapshot.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 border-b border-border/70 pb-4">
                <Scale className="mt-0.5 text-muted" size={17} />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {weakest?.area ?? "No area"} needs attention
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-muted">
                    Lowest area score is {weakest?.latest ?? 0}; strongest is{" "}
                    {strongest?.area ?? "n/a"} at {strongest?.latest ?? 0}.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldAlert className="mt-0.5 text-[var(--danger)]" size={17} />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Complaint pressure remains material
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-muted">
                    {totalComplaintVolume.toLocaleString()} clustered complaint
                    mentions are represented in the score context.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
