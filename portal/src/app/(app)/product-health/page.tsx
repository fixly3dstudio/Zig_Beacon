import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  HeartPulse,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/card";
import { UploadsPanelServer } from "@/components/visual-review/uploads-panel-server";

export const dynamic = "force-dynamic";

type FactorMap = {
  satisfaction?: number;
  adoption?: number;
  retention?: number;
  competitorPosition?: number;
  businessImpact?: number;
  complaintSeverity?: number;
};

function asFactors(value: unknown): FactorMap {
  if (!value || typeof value !== "object") return {};
  return value as FactorMap;
}

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function healthLabel(score: number) {
  if (score >= 85) return "Healthy";
  if (score >= 70) return "Stable";
  if (score >= 55) return "Watch";
  return "At risk";
}

function healthClass(score: number) {
  if (score >= 85) return "text-brand bg-brand/10";
  if (score >= 70) return "text-foreground bg-elevated";
  if (score >= 55) return "text-[var(--warn)] bg-warn/15";
  return "text-[var(--danger)] bg-danger/10";
}

function barColor(score: number) {
  if (score >= 85) return "bg-brand";
  if (score >= 70) return "bg-foreground";
  if (score >= 55) return "bg-[var(--warn)]";
  return "bg-[var(--danger)]";
}

function severityWeight(severity?: string) {
  if (severity === "high") return 18;
  if (severity === "medium") return 10;
  if (severity === "low") return 4;
  return 0;
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

export default async function Page() {
  const [scoreRows, complaints, opportunities, signalGroups, zigFeatures] =
    await Promise.all([
      prisma.beaconScore.findMany({ orderBy: { recordedAt: "desc" } }),
      prisma.complaintCluster.findMany({ orderBy: { volume: "desc" } }),
      prisma.opportunity.findMany(),
      prisma.signal.groupBy({
        by: ["category", "sentiment"],
        _count: { _all: true },
      }),
      prisma.competitorFeature.findMany({
        where: { competitor: { name: "Zig" } },
        include: { feature: true },
      }),
    ]);

  const scoreByArea = new Map<string, typeof scoreRows>();
  for (const row of scoreRows) {
    scoreByArea.set(row.area, [...(scoreByArea.get(row.area) ?? []), row]);
  }

  const signalByCategory = new Map<
    string,
    { positive: number; neutral: number; negative: number; total: number }
  >();
  for (const group of signalGroups) {
    const current =
      signalByCategory.get(group.category) ??
      { positive: 0, neutral: 0, negative: 0, total: 0 };
    const count = group._count._all;
    if (group.sentiment === "positive") current.positive += count;
    if (group.sentiment === "neutral") current.neutral += count;
    if (group.sentiment === "negative") current.negative += count;
    current.total += count;
    signalByCategory.set(group.category, current);
  }

  const featureCoverageByCategory = new Map<
    string,
    { available: number; partial: number; none: number; total: number }
  >();
  for (const feature of zigFeatures) {
    const category = feature.feature.category;
    const current =
      featureCoverageByCategory.get(category) ??
      { available: 0, partial: 0, none: 0, total: 0 };
    if (feature.status === "available") current.available += 1;
    else if (feature.status === "partial") current.partial += 1;
    else current.none += 1;
    current.total += 1;
    featureCoverageByCategory.set(category, current);
  }

  const areas = Array.from(scoreByArea.entries())
    .map(([area, rows]) => {
      const latest = rows[0];
      const previous = rows[1] ?? rows[0];
      const factors = asFactors(latest.factors);
      const complaint = complaints.find((item) => item.category === area);
      const areaSignals = signalByCategory.get(area) ?? {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
      };
      const coverage = featureCoverageByCategory.get(area) ?? {
        available: 0,
        partial: 0,
        none: 0,
        total: 0,
      };
      const opportunitiesForArea = opportunities.filter(
        (opportunity) =>
          opportunity.problem.toLowerCase().includes(area.toLowerCase()) ||
          opportunity.evidence.toLowerCase().includes(area.toLowerCase())
      );
      const coverageScore =
        coverage.total > 0
          ? Math.round(
              ((coverage.available + coverage.partial * 0.5) / coverage.total) *
                100
            )
          : null;
      const complaintPenalty =
        (complaint ? Math.min(24, complaint.volume / 45) : 0) +
        severityWeight(complaint?.severity);
      const sentimentPenalty =
        areaSignals.total > 0
          ? pct(areaSignals.negative * 2 + areaSignals.neutral, areaSignals.total * 2)
          : 0;
      const health = Math.round(
        latest.score * 0.58 +
          (coverageScore ?? latest.score) * 0.18 +
          (100 - Math.min(100, complaintPenalty)) * 0.14 +
          (100 - sentimentPenalty) * 0.1
      );

      return {
        area,
        latest: latest.score,
        previous: previous.score,
        delta: latest.score - previous.score,
        factors,
        complaint,
        areaSignals,
        coverage,
        coverageScore,
        opportunities: opportunitiesForArea,
        health,
        actionScore:
          (100 - health) +
          opportunitiesForArea.length * 10 +
          (complaint ? Math.min(20, complaint.volume / 50) : 0),
      };
    })
    .sort((a, b) => a.health - b.health);

  const overallHealth =
    areas.length > 0
      ? Math.round(areas.reduce((sum, area) => sum + area.health, 0) / areas.length)
      : 0;
  const atRisk = areas.filter((area) => area.health < 70).length;
  const improving = areas.filter((area) => area.delta > 0).length;
  const totalOpenOpportunities = opportunities.filter(
    (opportunity) => opportunity.status !== "shipped"
  ).length;
  const actionRows = [...areas]
    .sort((a, b) => b.actionScore - a.actionScore)
    .slice(0, 5);

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Product Health
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            A practical operating view of Zig product areas, combining Beacon
            Score, customer complaints, feature readiness, and roadmap pressure.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted">
          <HeartPulse size={14} className="text-brand" />
          {areas.length} product areas
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-5">
          <CardLabel>Overall health</CardLabel>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {overallHealth}
          </p>
          <p className="mt-1 text-xs text-muted">Composite product health index</p>
        </Card>
        <Card className="p-5">
          <CardLabel>Areas at risk</CardLabel>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--danger)] tabular-nums">
            {atRisk}
          </p>
          <p className="mt-1 text-xs text-muted">Health score below 70</p>
        </Card>
        <Card className="p-5">
          <CardLabel>Improving areas</CardLabel>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-brand tabular-nums">
              {improving}
            </p>
            <TrendingUp size={22} className="text-muted" />
          </div>
          <p className="mt-1 text-xs text-muted">Up versus previous score snapshot</p>
        </Card>
        <Card className="p-5">
          <CardLabel>Open opportunities</CardLabel>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {totalOpenOpportunities}
          </p>
          <p className="mt-1 text-xs text-muted">Planned, in-progress, or backlog work</p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-5">
        <Card className="col-span-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardLabel>Area health</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Product areas ranked by attention needed
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted">
              <Activity size={14} />
              score + complaints + readiness
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {areas.map((area) => {
              const label = healthLabel(area.health);
              const deltaPositive = area.delta >= 0;
              return (
                <div
                  className="rounded-lg border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-background hover:shadow-sm"
                  key={area.area}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold tracking-tight text-foreground">
                          {area.area}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            healthClass(area.health)
                          )}
                        >
                          {label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Beacon {area.latest} · Health {area.health}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
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

                  <div className="mt-4">
                    <Bar value={area.health} color={barColor(area.health)} />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] text-muted">Satisfaction</p>
                      <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                        {area.factors.satisfaction ?? "n/a"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted">Retention</p>
                      <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                        {area.factors.retention ?? "n/a"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted">Feature fit</p>
                      <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                        {area.coverageScore ?? "n/a"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted">Complaints</p>
                      <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                        {area.complaint?.volume ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border bg-background p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted">
                        Customer signal
                      </p>
                      <p className="mt-2 text-[13px] leading-5 text-foreground">
                        {area.areaSignals.total > 0
                          ? `${area.areaSignals.negative} negative, ${area.areaSignals.neutral} neutral, ${area.areaSignals.positive} positive`
                          : "No direct signal volume in seed data"}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted">
                        Roadmap pressure
                      </p>
                      <p className="mt-2 text-[13px] leading-5 text-foreground">
                        {area.opportunities.length > 0
                          ? `${area.opportunities.length} linked opportunity`
                          : "No linked opportunity yet"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-7">
          <CardLabel>Priority actions</CardLabel>
          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-surface">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Area
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Why it matters
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Health
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Next move
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {actionRows.map((area) => (
                    <tr className="border-b border-border/70 last:border-0" key={area.area}>
                      <td className="px-4 py-4 font-medium text-foreground">
                        {area.area}
                      </td>
                      <td className="px-4 py-4 text-[13px] leading-5 text-muted">
                        {area.complaint
                          ? `${area.complaint.issue}; ${area.complaint.volume} complaints, ${Math.round(area.complaint.trendPct)}% trend`
                          : "Low complaint coverage; watch customer and feature signals"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
                            healthClass(area.health)
                          )}
                        >
                          {area.health}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-elevated px-2.5 py-1 text-xs font-medium text-foreground">
                          {area.health < 60
                            ? "Fix now"
                            : area.opportunities.length > 0
                              ? "Fund roadmap"
                              : "Monitor"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardLabel>Operating readout</CardLabel>
          <div className="mt-5 space-y-4">
            <div className="flex gap-3 border-b border-border/70 pb-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground">
                <ShieldAlert size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Promotions is the weakest area
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  Low Beacon Score and rising promo complaints make auto-apply a
                  clear near-term health intervention.
                </p>
              </div>
            </div>
            <div className="flex gap-3 border-b border-border/70 pb-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground">
                <Target size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Airport needs workflow clarity
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  Complaint volume is concentrated around pickup timing and
                  terminal coordination, not core booking reliability.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground">
                <CheckCircle2 size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Booking remains the strongest core
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  High Beacon Score and broad feature coverage indicate the next
                  gains should come from reducing cancellation friction.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <UploadsPanelServer section="product-health" title="Feature screens from Visual Trainer" />
      </div>
    </div>
  );
}
