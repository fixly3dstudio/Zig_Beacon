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
  operatingDetail: string;
  demandSignals: string[];
  zigImplication: string;
  watchouts: string[];
};

type Playbook = {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  benchmark: string;
  insight: string;
  readiness: number;
  whyItMatters: string;
  leadingMarkets: string[];
  zigMoves: string[];
  evidence: string[];
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
    operatingDetail:
      "Dense regulated taxi supply, strong brand trust, and high payment readiness create a strong base, but booking convenience and promo clarity decide whether riders stay inside Zig.",
    demandSignals: [
      "Taxi trust remains high for safety-sensitive and business trips.",
      "Airport and rainy-day demand expose supply allocation gaps quickly.",
      "Riders compare Zig against super-app convenience, not just taxi reliability.",
    ],
    zigImplication:
      "Use Singapore as the control market: every regional lesson should translate into faster booking, clearer taxi availability, and stronger airport confidence.",
    watchouts: [
      "Avoid treating fleet trust as enough on its own.",
      "Promo friction and app reliability complaints can weaken a strong taxi base.",
    ],
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
    operatingDetail:
      "Seoul shows how taxi-first mobility can still feel modern when dispatch depth, safety, local maps, and payment rails are tightly integrated.",
    demandSignals: [
      "Riders expect reliable dispatch visibility before accepting wait time.",
      "Local wallet and card rails reduce payment anxiety.",
      "Safety and driver standards are visible parts of the product story.",
    ],
    zigImplication:
      "Benchmark Seoul for dispatch transparency, driver confidence cues, and local payment affordances inside high-frequency taxi flows.",
    watchouts: [
      "Deep local integrations are hard to copy without operational ownership.",
      "Taxi-first does not mean low-feature; the product layer still needs depth.",
    ],
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
    operatingDetail:
      "Tokyo is a restricted, licensed-taxi benchmark where reliability, service quality, and airport handoff discipline matter more than aggressive subsidy mechanics.",
    demandSignals: [
      "Premium riders value licensed supply and predictable pickup discipline.",
      "Airport users need terminal, queue, and vehicle guidance more than novelty.",
      "Reliability is a willingness-to-pay lever.",
    ],
    zigImplication:
      "Use Tokyo as a model for airport guidance, premium taxi positioning, and visible driver/service standards.",
    watchouts: [
      "Restricted markets may hide weak consumer UX behind supply scarcity.",
      "High reliability expectations raise the cost of small app failures.",
    ],
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
    operatingDetail:
      "Taipei is a hybrid market where taxi networks, ride-hail style UX, stored value, and loyalty mechanics increasingly converge.",
    demandSignals: [
      "Stored value makes promotions, refunds, and repeat use feel simpler.",
      "Hybrid supply creates expectations for both taxi trust and app flexibility.",
      "Loyalty becomes more meaningful when riders use multiple transport modes.",
    ],
    zigImplication:
      "Benchmark Taipei for wallet-linked loyalty, refund visibility, and cross-mode habit loops that can strengthen Zig beyond single taxi bookings.",
    watchouts: [
      "Hybrid products can become confusing if ride types are not clearly compared.",
      "Wallet features need visible balance, refund, and expiry communication.",
    ],
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
    operatingDetail:
      "Sydney represents an open PHC market where transparent price comparison, subscriptions, scheduled rides, and airport reliability reduce churn.",
    demandSignals: [
      "Riders are comfortable comparing fares across apps before booking.",
      "Subscription or membership value can soften price switching.",
      "Scheduled airport trips are a meaningful retention moment.",
    ],
    zigImplication:
      "Use Sydney to pressure-test fare transparency, subscription value, and scheduled ride confidence against open-market alternatives.",
    watchouts: [
      "Open markets train users to switch quickly.",
      "A weak value explanation makes subscriptions feel like another fee.",
    ],
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
    operatingDetail:
      "Bangkok is a tourism-led super-app environment where airport conversion, wallet onboarding, language support, and cash-to-digital behavior shape adoption.",
    demandSignals: [
      "Tourists need pickup certainty, translation, and payment clarity.",
      "Cash-to-wallet conversion can unlock repeated app use.",
      "Airport trips are high-intent moments for first-time users.",
    ],
    zigImplication:
      "Benchmark Bangkok for tourist onboarding, airport pickup education, and lightweight wallet conversion patterns.",
    watchouts: [
      "Tourism spikes can mask inconsistent daily commuter value.",
      "Airport pickup complexity can create high-visibility complaints.",
    ],
  },
];

const playbooks: Playbook[] = [
  {
    title: "Airport arrival orchestration",
    icon: Plane,
    benchmark: "Tokyo, Seoul",
    insight: "Flight-aware pickup, terminal guidance, and licensed taxi queues reduce arrival anxiety.",
    readiness: 74,
    whyItMatters:
      "Airport rides are high-stakes journeys: uncertainty around terminal, pickup point, driver coordination, and luggage timing quickly turns into complaints.",
    leadingMarkets: ["Tokyo", "Seoul", "Sydney"],
    zigMoves: [
      "Add terminal-specific pickup instructions and landmark photos.",
      "Show flight-aware pickup timing and waiting expectations.",
      "Create a dedicated airport issue taxonomy for complaint tracking.",
    ],
    evidence: [
      "Tokyo scores 81 on airport readiness with licensed taxi discipline.",
      "Seoul pairs managed taxi supply with stronger airport handoff maturity.",
      "Zig complaints already mention airport pickup confusion.",
    ],
  },
  {
    title: "Taxi-first trust layer",
    icon: ShieldCheck,
    benchmark: "Singapore, Tokyo",
    insight: "Safety reputation becomes more valuable when paired with visible driver standards.",
    readiness: 86,
    whyItMatters:
      "Taxi trust is Zig's strongest regional advantage, but riders need to see that trust inside the app through driver quality, safety cues, and trip controls.",
    leadingMarkets: ["Singapore", "Tokyo", "Seoul"],
    zigMoves: [
      "Surface driver standards and verified taxi supply in booking flows.",
      "Make safety actions available during the ride, not buried in settings.",
      "Use review themes to track trust erosion by ride type.",
    ],
    evidence: [
      "Singapore scores 94 on taxi integration.",
      "Tokyo scores 96 on licensed taxi integration.",
      "Safety-positive reviews can be turned into product proof points.",
    ],
  },
  {
    title: "Stored-value mobility wallet",
    icon: CircleDollarSign,
    benchmark: "Seoul, Taipei",
    insight: "Wallet rails make refunds, corporate budgets, loyalty, and promo redemption feel native.",
    readiness: 68,
    whyItMatters:
      "Payment confidence reduces support load. Stored value is especially useful when it makes refunds, promo redemption, and corporate travel budgets easier to understand.",
    leadingMarkets: ["Seoul", "Taipei", "Singapore"],
    zigMoves: [
      "Make wallet refunds and credits visible immediately after support actions.",
      "Unify promo redemption, points, and stored value into one checkout explanation.",
      "Add payment complaint tags for refund delay, charge clarity, and promo failure.",
    ],
    evidence: [
      "Taipei shows hybrid mobility and stored-value convergence.",
      "Seoul has strong local payment rail maturity.",
      "Payments appear in Zig complaint clusters around refund visibility.",
    ],
  },
  {
    title: "EV fleet visibility",
    icon: Zap,
    benchmark: "Sydney, Singapore",
    insight: "Dedicated EV choice works best when supply, wait time, and price deltas are explicit.",
    readiness: 57,
    whyItMatters:
      "EV options can strengthen brand perception, but only if riders understand availability, wait-time tradeoff, and price difference before selecting it.",
    leadingMarkets: ["Sydney", "Singapore"],
    zigMoves: [
      "Show EV availability only where supply confidence is high.",
      "Compare EV wait time and fare delta against standard taxi options.",
      "Track whether EV intent converts or creates abandonment.",
    ],
    evidence: [
      "Sydney has high digital payment maturity and open-market rider comparison behavior.",
      "Singapore can pair EV visibility with trusted regulated fleet supply.",
      "EV readiness is lower than taxi trust, so expectations need careful framing.",
    ],
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
  if (regulation === "Open") return "border-track bg-background text-foreground";
  if (regulation === "Managed") return "border-brand/20 bg-brand/10 text-brand";
  return "border-track bg-elevated text-muted";
}

function maturityDot(maturity: Market["maturity"]) {
  if (maturity === "Leader") return "bg-foreground";
  if (maturity === "Scaling") return "bg-brand";
  return "bg-track";
}

function Bar({
  value,
  color = "bg-foreground",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-track">
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
                    <Bar value={market.airportReadiness} color="bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardLabel>Regional pulse details</CardLabel>
                <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                  What each market teaches Zig
                </h3>
              </div>
              <span className="text-xs text-muted">
                Operating model · demand signals · Zig implication · watchouts
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              {markets.map((market) => (
                <div
                  className="rounded-lg border border-border bg-background p-4"
                  key={`${market.city}-details`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn("h-2 w-2 rounded-full", maturityDot(market.maturity))}
                        />
                        <h4 className="text-sm font-semibold text-foreground">
                          {market.city}
                        </h4>
                        <span className="text-xs text-muted">
                          {market.region} · {market.maturity}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-muted">
                        {market.operatingDetail}
                      </p>
                    </div>
                    <div className="grid min-w-[220px] grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-surface p-2">
                        <span className="text-muted">Payment</span>
                        <p className="mt-1 font-semibold tabular-nums text-foreground">
                          {market.digitalPayments}
                        </p>
                      </div>
                      <div className="rounded-md bg-surface p-2">
                        <span className="text-muted">Composite</span>
                        <p className="mt-1 font-semibold tabular-nums text-foreground">
                          {
                            scanRows.find((row) => row.city === market.city)
                              ?.composite
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <div className="rounded-md border border-border bg-surface p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Demand signals
                      </p>
                      <ul className="mt-2 space-y-2">
                        {market.demandSignals.map((signal) => (
                          <li
                            className="flex gap-2 text-[13px] leading-5 text-foreground"
                            key={signal}
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                            {signal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Zig implication
                      </p>
                      <p className="mt-2 text-[13px] leading-6 text-foreground">
                        {market.zigImplication}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Watchouts
                      </p>
                      <ul className="mt-2 space-y-2">
                        {market.watchouts.map((watchout) => (
                          <li
                            className="flex gap-2 text-[13px] leading-5 text-foreground"
                            key={watchout}
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-track" />
                            {watchout}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                <span className="h-2 w-2 rounded-full bg-track" />
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

          <div className="mt-6 border-t border-border pt-5">
            <CardLabel>Priority benchmark details</CardLabel>
            <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">
              How to translate each benchmark into product work
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {playbooks.map((playbook) => {
                const Icon = playbook.icon;
                return (
                  <div
                    className="rounded-lg border border-border bg-surface p-5"
                    key={`${playbook.title}-details`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {playbook.title}
                        </h4>
                        <p className="mt-1 text-xs text-muted">
                          Benchmarks: {playbook.benchmark}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-[13px] leading-6 text-muted">
                      {playbook.whyItMatters}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                          Leading markets
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {playbook.leadingMarkets.map((market) => (
                            <span
                              className="rounded-full border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                              key={market}
                            >
                              {market}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                          Zig moves
                        </p>
                        <ul className="mt-2 space-y-2">
                          {playbook.zigMoves.map((move) => (
                            <li className="flex gap-2 text-[12px] leading-5 text-foreground" key={move}>
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                              {move}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                          Evidence
                        </p>
                        <ul className="mt-2 space-y-2">
                          {playbook.evidence.map((item) => (
                            <li className="flex gap-2 text-[12px] leading-5 text-foreground" key={item}>
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
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
