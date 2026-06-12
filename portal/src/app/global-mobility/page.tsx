import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CarTaxiFront,
  CircleDollarSign,
  Globe2,
  Landmark,
  Plane,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Market = {
  city: string;
  country: string;
  region: string;
  maturity: "Leader" | "Scaling" | "Emerging";
  regulation: "Open" | "Managed" | "Restricted";
  signal: string;
  model: string;
  momentum: number;
  taxiIntegration: number;
  digitalPayments: number;
  airportReadiness: number;
};

type Playbook = {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  benchmark: string;
  insight: string;
  readiness: number;
};

const markets: Market[] = [
  {
    city: "Singapore",
    country: "Singapore",
    region: "Southeast Asia",
    maturity: "Leader",
    regulation: "Managed",
    signal: "Regulated fleets are trusted; app experience must carry the next growth leg.",
    model: "Taxi + PHC super-app",
    momentum: 72,
    taxiIntegration: 94,
    digitalPayments: 88,
    airportReadiness: 66,
  },
  {
    city: "Seoul",
    country: "South Korea",
    region: "North Asia",
    maturity: "Leader",
    regulation: "Managed",
    signal: "Taxi platforms win through dispatch depth, safety, and local payment rails.",
    model: "Taxi-first platform",
    momentum: 79,
    taxiIntegration: 91,
    digitalPayments: 84,
    airportReadiness: 74,
  },
  {
    city: "Tokyo",
    country: "Japan",
    region: "North Asia",
    maturity: "Leader",
    regulation: "Restricted",
    signal: "Premium reliability and airport handoffs matter more than aggressive subsidies.",
    model: "Licensed taxi marketplace",
    momentum: 63,
    taxiIntegration: 96,
    digitalPayments: 73,
    airportReadiness: 81,
  },
  {
    city: "Taipei",
    country: "Taiwan",
    region: "North Asia",
    maturity: "Scaling",
    regulation: "Managed",
    signal: "Hybrid taxi and ride-hail products are converging around loyalty and stored value.",
    model: "Hybrid taxi network",
    momentum: 68,
    taxiIntegration: 82,
    digitalPayments: 78,
    airportReadiness: 62,
  },
  {
    city: "Sydney",
    country: "Australia",
    region: "Oceania",
    maturity: "Scaling",
    regulation: "Open",
    signal: "Riders compare price transparently; subscription and scheduled rides reduce churn.",
    model: "Open PHC marketplace",
    momentum: 70,
    taxiIntegration: 54,
    digitalPayments: 91,
    airportReadiness: 76,
  },
  {
    city: "Bangkok",
    country: "Thailand",
    region: "Southeast Asia",
    maturity: "Emerging",
    regulation: "Managed",
    signal: "Tourism and cash-to-wallet conversion create a large airport pickup opportunity.",
    model: "Tourism-led super-app",
    momentum: 84,
    taxiIntegration: 48,
    digitalPayments: 69,
    airportReadiness: 58,
  },
];

const playbooks: Playbook[] = [
  {
    title: "Airport arrival orchestration",
    icon: Plane,
    benchmark: "Tokyo, Seoul",
    insight: "Flight-aware pickup, terminal guidance, and licensed taxi queues reduce arrival anxiety.",
    readiness: 74,
  },
  {
    title: "Taxi-first trust layer",
    icon: ShieldCheck,
    benchmark: "Singapore, Tokyo",
    insight: "Safety reputation becomes more valuable when paired with visible driver standards.",
    readiness: 86,
  },
  {
    title: "Stored-value mobility wallet",
    icon: CircleDollarSign,
    benchmark: "Seoul, Taipei",
    insight: "Wallet rails make refunds, corporate budgets, loyalty, and promo redemption feel native.",
    readiness: 68,
  },
  {
    title: "EV fleet visibility",
    icon: Zap,
    benchmark: "Sydney, Singapore",
    insight: "Dedicated EV choice works best when supply, wait time, and price deltas are explicit.",
    readiness: 57,
  },
];

const scanRows = markets
  .map((market) => ({
    ...market,
    composite: Math.round(
      market.momentum * 0.3 +
        market.taxiIntegration * 0.3 +
        market.digitalPayments * 0.2 +
        market.airportReadiness * 0.2
    ),
  }))
  .sort((a, b) => b.composite - a.composite);

const regionCounts = markets.reduce<Record<string, number>>((acc, market) => {
  acc[market.region] = (acc[market.region] ?? 0) + 1;
  return acc;
}, {});

const averageMomentum = Math.round(
  markets.reduce((sum, market) => sum + market.momentum, 0) / markets.length
);

function regulationClass(regulation: Market["regulation"]) {
  if (regulation === "Open") return "border-zinc-300 bg-background text-foreground";
  if (regulation === "Managed") return "border-brand/20 bg-[rgba(3,103,252,0.08)] text-brand";
  return "border-zinc-200 bg-zinc-100 text-muted";
}

function maturityDot(maturity: Market["maturity"]) {
  if (maturity === "Leader") return "bg-foreground";
  if (maturity === "Scaling") return "bg-brand";
  return "bg-zinc-300";
}

function Bar({
  value,
  color = "bg-foreground",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
      <div
        className={cn("h-full rounded-full", color)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Global Mobility
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            Market benchmarks for ride-hailing, licensed taxi platforms,
            airport mobility, and regional operating models relevant to Zig.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted">
          <Globe2 size={14} className="text-brand" />
          {Object.keys(regionCounts).length} regions tracked
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <CardLabel>Market momentum</CardLabel>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {averageMomentum}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
              <ArrowUpRight size={14} />
              rising
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Average demand and product activity index
          </p>
        </Card>
        <Card className="p-5">
          <CardLabel>Taxi-integrated leaders</CardLabel>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {markets.filter((market) => market.taxiIntegration >= 85).length}
            </p>
            <CarTaxiFront size={22} className="text-muted" />
          </div>
          <p className="mt-1 text-xs text-muted">
            Markets where licensed fleets anchor supply
          </p>
        </Card>
        <Card className="p-5">
          <CardLabel>Managed regulation</CardLabel>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-brand tabular-nums">
              {markets.filter((market) => market.regulation === "Managed").length}
            </p>
            <Landmark size={22} className="text-muted" />
          </div>
          <p className="mt-1 text-xs text-muted">
            Comparable environments for Zig expansion logic
          </p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-5">
        <Card className="col-span-12 lg:col-span-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardLabel>Regional pulse</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Mobility markets by operating model
              </h2>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
              {markets.length} city scan
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {markets.map((market) => (
              <div
                className="rounded-lg border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:bg-background hover:shadow-sm"
                key={`${market.city}-${market.country}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-2 w-2 rounded-full", maturityDot(market.maturity))}
                      />
                      <p className="text-sm font-semibold text-foreground">
                        {market.city}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {market.country} · {market.model}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      regulationClass(market.regulation)
                    )}
                  >
                    {market.regulation}
                  </span>
                </div>
                <p className="mt-4 min-h-10 text-[13px] leading-5 text-foreground">
                  {market.signal}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-muted">Momentum</p>
                    <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                      {market.momentum}
                    </p>
                    <Bar value={market.momentum} color="bg-brand" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Taxi</p>
                    <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                      {market.taxiIntegration}
                    </p>
                    <Bar value={market.taxiIntegration} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">Airport</p>
                    <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                      {market.airportReadiness}
                    </p>
                    <Bar value={market.airportReadiness} color="bg-zinc-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardLabel>Zig transfer opportunities</CardLabel>
          <div className="mt-5 space-y-4">
            {playbooks.map((playbook) => {
              const Icon = playbook.icon;
              return (
                <div
                  className="border-b border-border/70 pb-4 last:border-0 last:pb-0"
                  key={playbook.title}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground">
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-5 text-foreground">
                        {playbook.title}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
                        {playbook.benchmark}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] leading-5 text-muted">
                    {playbook.insight}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <Bar value={playbook.readiness} color="bg-brand" />
                    </div>
                    <span className="w-8 text-right text-xs font-medium tabular-nums text-foreground">
                      {playbook.readiness}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="col-span-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardLabel>Market scan</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Priority benchmarks
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-foreground" />
                Leader
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" />
                Scaling
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-300" />
                Emerging
              </span>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead className="bg-surface">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Market
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Regulation
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Composite
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Direction
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scanRows.map((market, index) => {
                    const rising = market.momentum >= 70;
                    return (
                      <tr
                        className="border-b border-border/70 last:border-0"
                        key={`${market.city}-scan`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                maturityDot(market.maturity)
                              )}
                            />
                            <div>
                              <p className="font-medium text-foreground">
                                {index + 1}. {market.city}
                              </p>
                              <p className="text-xs text-muted">{market.region}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[13px] text-foreground">
                          {market.model}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              regulationClass(market.regulation)
                            )}
                          >
                            {market.regulation}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 text-sm font-semibold tabular-nums text-foreground">
                              {market.composite}
                            </span>
                            <div className="w-28">
                              <Bar value={market.composite} color="bg-foreground" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 text-sm tabular-nums text-muted">
                              {market.digitalPayments}
                            </span>
                            <div className="w-24">
                              <Bar value={market.digitalPayments} color="bg-brand" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium",
                              rising ? "text-brand" : "text-muted"
                            )}
                          >
                            {rising ? (
                              <ArrowUpRight size={14} />
                            ) : (
                              <ArrowDownRight size={14} />
                            )}
                            {rising ? "accelerating" : "steady"}
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

        <Card className="col-span-12">
          <div className="grid gap-5 md:grid-cols-[240px_1fr] md:items-center">
            <div>
              <CardLabel>Regional balance</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Coverage by region
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                North Asia provides taxi-operating benchmarks; Southeast Asia
                provides super-app and airport demand signals.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(regionCounts).map(([region, count]) => (
                <div className="rounded-lg border border-border bg-surface p-4" key={region}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{region}</p>
                    <Building2 size={16} className="text-muted" />
                  </div>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                    {count}
                  </p>
                  <Bar value={(count / markets.length) * 100} color="bg-brand" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
