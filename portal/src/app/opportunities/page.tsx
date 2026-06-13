import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  Gauge,
  Target,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const ENGINEER_MONTH_COST = 22000;
const DESIGN_MONTH_COST = 16000;
const QA_MONTH_COST = 12000;
const PROGRAM_MONTH_COST = 14000;
const MONTHLY_ACTIVE_RIDER_BASE = 420000;
const AVG_MARGIN_PER_INCREMENTAL_TRIP = 2.4;

type OpportunityWithBusiness = {
  id: number;
  problem: string;
  evidence: string;
  impact: number;
  frequency: number;
  reach: number;
  effort: number;
  status: string;
  owner: string | null;
  priorityScore: number;
  devSpend: number;
  annualRevenue: number;
  netUpside: number;
  roi: number;
  paybackMonths: number;
  confidence: number;
  teamMonths: number;
  action: string;
};

function currency(value: number) {
  if (value >= 1_000_000) return `S$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `S$${Math.round(value / 1000)}K`;
  return `S$${Math.round(value)}`;
}

function statusClass(status: string) {
  if (status === "shipped") return "bg-foreground text-background";
  if (status === "in-progress") return "bg-brand/10 text-brand";
  if (status === "planned") return "bg-elevated text-foreground";
  return "bg-elevated text-muted";
}

function roiClass(roi: number) {
  if (roi >= 4) return "text-brand bg-brand/10";
  if (roi >= 2) return "text-foreground bg-elevated";
  if (roi >= 1) return "text-[var(--warn)] bg-warn/15";
  return "text-[var(--danger)] bg-danger/10";
}

function barColor(value: number) {
  if (value >= 75) return "bg-brand";
  if (value >= 50) return "bg-foreground";
  if (value >= 30) return "bg-[var(--warn)]";
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

function estimateBusinessCase(opportunity: {
  impact: number;
  frequency: number;
  reach: number;
  effort: number;
  status: string;
}): Pick<
  OpportunityWithBusiness,
  | "priorityScore"
  | "devSpend"
  | "annualRevenue"
  | "netUpside"
  | "roi"
  | "paybackMonths"
  | "confidence"
  | "teamMonths"
  | "action"
> {
  const priorityScore = Math.round(
    (opportunity.impact * opportunity.frequency * opportunity.reach) /
      Math.max(opportunity.effort, 1)
  );
  const teamMonths = Math.max(1.2, opportunity.effort * 0.85);
  const devSpend = Math.round(
    teamMonths *
      (ENGINEER_MONTH_COST * 1.7 +
        DESIGN_MONTH_COST * 0.45 +
        QA_MONTH_COST * 0.35 +
        PROGRAM_MONTH_COST * 0.25)
  );

  const affectedRiders =
    MONTHLY_ACTIVE_RIDER_BASE * (opportunity.reach / 10) * 0.42;
  const conversionLift =
    (opportunity.impact * 0.0035 + opportunity.frequency * 0.002) *
    (opportunity.status === "shipped" ? 0.65 : 1);
  const monthlyIncrementalTrips = affectedRiders * conversionLift * 1.8;
  const retentionUpside =
    affectedRiders * (opportunity.frequency / 10) * (opportunity.impact / 10) * 0.14;
  const annualRevenue = Math.round(
    (monthlyIncrementalTrips * AVG_MARGIN_PER_INCREMENTAL_TRIP +
      retentionUpside) *
      12
  );
  const netUpside = annualRevenue - devSpend;
  const roi = annualRevenue / Math.max(devSpend, 1);
  const paybackMonths = Math.max(1, Math.ceil(devSpend / Math.max(annualRevenue / 12, 1)));
  const confidence = Math.round(
    Math.min(
      92,
      42 +
        opportunity.frequency * 3.2 +
        opportunity.reach * 2.1 -
        opportunity.effort * 1.4
    )
  );
  const action =
    opportunity.status === "shipped"
      ? "Measure impact"
      : roi >= 1.5 && priorityScore >= 70
        ? "Fund now"
        : roi >= 1.1
          ? "Shape next"
          : "Validate first";

  return {
    priorityScore,
    devSpend,
    annualRevenue,
    netUpside,
    roi,
    paybackMonths,
    confidence,
    teamMonths: Math.round(teamMonths * 10) / 10,
    action,
  };
}

export default async function Page() {
  const opportunities = await prisma.opportunity.findMany();

  const enriched: OpportunityWithBusiness[] = opportunities
    .map((opportunity) => ({
      ...opportunity,
      ...estimateBusinessCase(opportunity),
    }))
    .sort((a, b) => {
      if (a.status === "shipped" && b.status !== "shipped") return 1;
      if (a.status !== "shipped" && b.status === "shipped") return -1;
      return b.priorityScore - a.priorityScore;
    });

  const open = enriched.filter((opportunity) => opportunity.status !== "shipped");
  const totalSpend = open.reduce((sum, opportunity) => sum + opportunity.devSpend, 0);
  const totalRevenue = open.reduce(
    (sum, opportunity) => sum + opportunity.annualRevenue,
    0
  );
  const totalNet = totalRevenue - totalSpend;
  const avgRoi = totalRevenue / Math.max(totalSpend, 1);
  const fundNow = open.filter((opportunity) => opportunity.action === "Fund now");
  const fastestPayback = [...open].sort(
    (a, b) => a.paybackMonths - b.paybackMonths
  )[0];

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Opportunity Hub
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            Prioritised product opportunities with planning estimates for build
            spend, annual revenue upside, ROI, payback, and delivery ownership.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted">
          <Target size={14} className="text-brand" />
          {open.length} open opportunities
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-5">
          <CardLabel>Estimated build spend</CardLabel>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {currency(totalSpend)}
          </p>
          <p className="mt-1 text-xs text-muted">Open roadmap portfolio</p>
        </Card>
        <Card className="p-5">
          <CardLabel>Annual upside</CardLabel>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-brand tabular-nums">
            {currency(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-muted">Modeled margin/revenue impact</p>
        </Card>
        <Card className="p-5">
          <CardLabel>Net upside</CardLabel>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {currency(totalNet)}
            </p>
            <TrendingUp size={22} className="text-muted" />
          </div>
          <p className="mt-1 text-xs text-muted">Annual upside minus build spend</p>
        </Card>
        <Card className="p-5">
          <CardLabel>Portfolio ROI</CardLabel>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {avgRoi.toFixed(1)}x
          </p>
          <p className="mt-1 text-xs text-muted">
            {fundNow.length} high-conviction opportunities
          </p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-5">
        <Card className="col-span-12">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardLabel>Opportunity portfolio</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Ranked by product value and commercial return
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted">
              <Gauge size={14} />
              Impact x Frequency x Reach / Effort
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-sm">
                <thead className="bg-surface">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Opportunity
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Spend
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Annual upside
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      ROI
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Payback
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((opportunity, index) => (
                    <tr
                      className="border-b border-border/70 last:border-0"
                      key={opportunity.id}
                    >
                      <td className="px-4 py-4">
                        <div className="max-w-[320px]">
                          <p className="font-medium text-foreground">
                            {index + 1}. {opportunity.problem}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                            {opportunity.evidence}
                          </p>
                          <p className="mt-2 text-[11px] text-muted">
                            Owner: {opportunity.owner ?? "Unassigned"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-9 text-sm font-semibold tabular-nums text-foreground">
                            {opportunity.priorityScore}
                          </span>
                          <div className="w-24">
                            <Bar
                              value={Math.min(100, opportunity.priorityScore)}
                              color={barColor(opportunity.priorityScore)}
                            />
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          I{opportunity.impact} F{opportunity.frequency} R
                          {opportunity.reach} E{opportunity.effort}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium tabular-nums text-foreground">
                          {currency(opportunity.devSpend)}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          {opportunity.teamMonths} team-months
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium tabular-nums text-foreground">
                          {currency(opportunity.annualRevenue)}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          {currency(opportunity.netUpside)} net
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
                            roiClass(opportunity.roi)
                          )}
                        >
                          {opportunity.roi.toFixed(1)}x
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[13px] tabular-nums text-muted">
                        {opportunity.paybackMonths} mo
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                            statusClass(opportunity.status)
                          )}
                        >
                          {opportunity.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-elevated px-2.5 py-1 text-xs font-medium text-foreground">
                          {opportunity.action}
                        </span>
                        <p className="mt-1 text-[11px] tabular-nums text-muted">
                          {opportunity.confidence}% confidence
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-7">
          <CardLabel>Funding recommendation</CardLabel>
          <div className="mt-5 grid gap-3">
            {fundNow.slice(0, 4).map((opportunity) => (
              <div
                className="rounded-lg border border-border bg-surface p-4"
                key={`${opportunity.id}-fund`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {opportunity.problem}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {opportunity.owner ?? "Unassigned"} · {opportunity.status}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                    <ArrowUpRight size={14} />
                    {opportunity.roi.toFixed(1)}x ROI
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-muted">Spend</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                      {currency(opportunity.devSpend)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Upside</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                      {currency(opportunity.annualRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Payback</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                      {opportunity.paybackMonths} mo
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardLabel>Business model assumptions</CardLabel>
          <div className="mt-5 space-y-4">
            <div className="flex gap-3 border-b border-border/70 pb-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground">
                <BriefcaseBusiness size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Spend model
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  Effort is converted into blended team-months across
                  engineering, design, QA, and programme delivery.
                </p>
              </div>
            </div>
            <div className="flex gap-3 border-b border-border/70 pb-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground">
                <CircleDollarSign size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Revenue model
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  Upside estimates use affected rider reach, expected conversion
                  lift, retention value, and S$2.40 incremental trip margin.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground">
                <Clock3 size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Fastest payback
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  {fastestPayback
                    ? `${fastestPayback.problem} pays back in about ${fastestPayback.paybackMonths} months.`
                    : "No open opportunities available."}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="col-span-12">
          <div className="grid gap-5 md:grid-cols-[260px_1fr] md:items-center">
            <div>
              <CardLabel>Portfolio economics</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Spend versus upside
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                These are planning estimates for roadmap comparison. Actual
                revenue should be validated through experiment design and
                post-launch measurement.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Spend</p>
                  <Banknote size={16} className="text-muted" />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                  {currency(totalSpend)}
                </p>
                <Bar value={45} color="bg-foreground" />
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Upside</p>
                  <ArrowUpRight size={16} className="text-brand" />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-brand tabular-nums">
                  {currency(totalRevenue)}
                </p>
                <Bar value={80} color="bg-brand" />
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Risk buffer</p>
                  <ArrowDownRight size={16} className="text-muted" />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                  {currency(totalNet)}
                </p>
                <Bar value={65} color="bg-foreground" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
