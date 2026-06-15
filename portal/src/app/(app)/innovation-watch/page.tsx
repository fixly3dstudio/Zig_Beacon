import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  Brain,
  CreditCard,
  Gauge,
  Lightbulb,
  Plane,
  Radar,
  Route,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Stage = "Live" | "Pilot" | "Emerging" | "Watch";
type Horizon = "Now" | "Next" | "Later";

type Innovation = {
  title: string;
  category: string;
  stage: Stage;
  horizon: Horizon;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  signal: string;
  zigAngle: string;
  impact: number;
  confidence: number;
  effort: number;
  competitors: string[];
};

type WatchItem = {
  source: string;
  finding: string;
  category: string;
  intensity: number;
  direction: "up" | "down";
};

const innovations: Innovation[] = [
  {
    title: "Flight-aware airport pickup",
    category: "Airport",
    stage: "Pilot",
    horizon: "Now",
    icon: Plane,
    signal: "Arrival-time pickup flows are becoming a premium reliability marker in taxi-heavy markets.",
    zigAngle: "Pair Changi flight status with taxi queue guidance and driver wait-time messaging.",
    impact: 92,
    confidence: 82,
    effort: 48,
    competitors: ["Grab", "Go Taxi", "Kakao T"],
  },
  {
    title: "AI dispatch assistant",
    category: "Operations",
    stage: "Emerging",
    horizon: "Next",
    icon: Brain,
    signal: "Dispatch copilots are moving from back-office optimisation into rider-facing ETA promises.",
    zigAngle: "Use historical taxi supply, weather, events, and booking density to explain ETA confidence.",
    impact: 88,
    confidence: 71,
    effort: 78,
    competitors: ["Uber", "Grab", "Didi"],
  },
  {
    title: "Auto-applied loyalty wallet",
    category: "Payments",
    stage: "Live",
    horizon: "Now",
    icon: CreditCard,
    signal: "Riders expect the best available voucher, points balance, and refund credit to apply automatically.",
    zigAngle: "Remove promo-code hunting and turn GoBusiness balances into a visible wallet pattern.",
    impact: 84,
    confidence: 87,
    effort: 42,
    competitors: ["Grab", "Kakao T", "LINE Taxi"],
  },
  {
    title: "EV preference routing",
    category: "Sustainability",
    stage: "Pilot",
    horizon: "Next",
    icon: Zap,
    signal: "EV tiers work better when the app shows price, wait, and carbon tradeoffs before booking.",
    zigAngle: "Expose EV taxi availability without fragmenting the core taxi booking path.",
    impact: 67,
    confidence: 64,
    effort: 55,
    competitors: ["Ryde", "Uber Green", "GrabGreen"],
  },
  {
    title: "Proactive disruption alerts",
    category: "Reliability",
    stage: "Emerging",
    horizon: "Now",
    icon: BellRing,
    signal: "Airport, weather, MRT disruption, and event spikes are becoming context-aware booking prompts.",
    zigAngle: "Trigger pre-book nudges when taxis are likely to outperform PHC wait times.",
    impact: 79,
    confidence: 76,
    effort: 36,
    competitors: ["Uber", "Bolt", "Grab"],
  },
  {
    title: "Verified safety moments",
    category: "Safety",
    stage: "Live",
    horizon: "Now",
    icon: ShieldCheck,
    signal: "Safety centers are table stakes; visible verification moments now differentiate trust.",
    zigAngle: "Surface taxi licence, driver tenure, trip monitoring, and emergency actions at the right moment.",
    impact: 73,
    confidence: 90,
    effort: 31,
    competitors: ["Grab", "Kakao T", "Uber"],
  },
  {
    title: "Commute subscription bundles",
    category: "Retention",
    stage: "Watch",
    horizon: "Later",
    icon: BadgeCheck,
    signal: "Subscription value is shifting from generic discounts to corridor-specific commute assurance.",
    zigAngle: "Bundle advance booking, airport priority, and corporate credits for repeat commuter segments.",
    impact: 69,
    confidence: 58,
    effort: 63,
    competitors: ["Ryde", "GrabUnlimited", "Uber One"],
  },
  {
    title: "Multimodal trip stitching",
    category: "Journey",
    stage: "Watch",
    horizon: "Later",
    icon: Route,
    signal: "Mobility apps are experimenting with taxi, rail, walking, and micro-mobility itinerary assembly.",
    zigAngle: "Start with taxi-to-MRT fallback recommendations during peak-hour supply constraints.",
    impact: 61,
    confidence: 52,
    effort: 82,
    competitors: ["Moovit", "Citymapper", "Grab"],
  },
];

const watchItems: WatchItem[] = [
  {
    source: "Airport reviews",
    finding: "Riders mention terminal confusion and driver coordination as a repeated arrival pain point.",
    category: "Airport",
    intensity: 86,
    direction: "up",
  },
  {
    source: "Competitor releases",
    finding: "Super-app competitors continue shipping automatic voucher and wallet redemption patterns.",
    category: "Payments",
    intensity: 78,
    direction: "up",
  },
  {
    source: "Driver ops",
    finding: "Supply reliability improvements are increasingly framed as explainable ETA confidence.",
    category: "Operations",
    intensity: 72,
    direction: "up",
  },
  {
    source: "App store notes",
    finding: "Safety features are now expected, but users respond strongly to visible verification cues.",
    category: "Safety",
    intensity: 64,
    direction: "down",
  },
];

const stageOrder: Stage[] = ["Live", "Pilot", "Emerging", "Watch"];
const horizonOrder: Horizon[] = ["Now", "Next", "Later"];

const rankedInnovations = [...innovations].sort((a, b) => {
  const aScore = a.impact * a.confidence - a.effort * 35;
  const bScore = b.impact * b.confidence - b.effort * 35;
  return bScore - aScore;
});

function stageClass(stage: Stage) {
  if (stage === "Live") return "border-foreground bg-foreground text-background";
  if (stage === "Pilot") {
    return "border-brand/20 bg-brand/10 text-brand";
  }
  if (stage === "Emerging") return "border-track bg-background text-foreground";
  return "border-track bg-elevated text-muted";
}

function horizonClass(horizon: Horizon) {
  if (horizon === "Now") return "bg-brand";
  if (horizon === "Next") return "bg-foreground";
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

function scoreInnovation(item: Innovation) {
  return Math.round((item.impact * item.confidence) / Math.max(item.effort, 1));
}

export default function Page() {
  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Innovation Watch
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            A product radar for ride-hailing, taxi, airport, wallet, safety,
            and AI patterns that could shape Zig&apos;s next roadmap decisions.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted">
          <Radar size={14} className="text-brand" />
          {innovations.length} signals tracked
        </div>
      </div>

      <div className="mt-8 grid grid-cols-12 gap-5">
        <Card className="col-span-12 lg:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardLabel>Trend radar</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Innovation themes by maturity
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              {horizonOrder.map((horizon) => (
                <span className="inline-flex items-center gap-1.5" key={horizon}>
                  <span
                    className={cn("h-2 w-2 rounded-full", horizonClass(horizon))}
                  />
                  {horizon}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {innovations.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  className="rounded-lg border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:bg-background hover:shadow-sm"
                  key={item.title}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-5 text-foreground">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-muted">{item.category}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        stageClass(item.stage)
                      )}
                    >
                      {item.stage}
                    </span>
                  </div>

                  <p className="mt-4 min-h-10 text-[13px] leading-5 text-foreground">
                    {item.signal}
                  </p>
                  <p className="mt-3 text-[13px] leading-5 text-muted">
                    {item.zigAngle}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] text-muted">Impact</p>
                      <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                        {item.impact}
                      </p>
                      <Bar value={item.impact} color="bg-brand" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted">Confidence</p>
                      <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                        {item.confidence}
                      </p>
                      <Bar value={item.confidence} />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted">Effort</p>
                      <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                        {item.effort}
                      </p>
                      <Bar value={item.effort} color="bg-muted" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardLabel>Live watchlist</CardLabel>
          <div className="mt-5 space-y-4">
            {watchItems.map((item) => {
              const rising = item.direction === "up";
              return (
                <div
                  className="border-b border-border/70 pb-4 last:border-0 last:pb-0"
                  key={`${item.source}-${item.category}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.source}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
                        {item.category}
                      </p>
                    </div>
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
                      {item.intensity}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-5 text-muted">
                    {item.finding}
                  </p>
                  <div className="mt-3">
                    <Bar
                      value={item.intensity}
                      color={rising ? "bg-brand" : "bg-muted"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="col-span-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardLabel>Roadmap triage</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Prioritised innovation bets
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted">
              <Gauge size={14} />
              Impact x confidence / effort
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead className="bg-surface">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Bet
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Stage
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Horizon
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Competitor hints
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                      Suggested action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rankedInnovations.map((item, index) => {
                    const score = scoreInnovation(item);
                    const topBet = index < 3;
                    return (
                      <tr
                        className="border-b border-border/70 last:border-0"
                        key={`${item.title}-rank`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "mt-1 h-2 w-2 shrink-0 rounded-full",
                                horizonClass(item.horizon)
                              )}
                            />
                            <div>
                              <p className="font-medium text-foreground">
                                {index + 1}. {item.title}
                              </p>
                              <p className="mt-1 text-xs text-muted">
                                {item.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              stageClass(item.stage)
                            )}
                          >
                            {item.stage}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[13px] text-foreground">
                          {item.horizon}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-9 text-sm font-semibold tabular-nums text-foreground">
                              {score}
                            </span>
                            <div className="w-28">
                              <Bar
                                value={Math.min(score, 100)}
                                color={topBet ? "bg-brand" : "bg-foreground"}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[13px] text-muted">
                          {item.competitors.join(", ")}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                              topBet
                                ? "bg-brand/10 text-brand"
                                : "bg-elevated text-muted"
                            )}
                          >
                            {topBet ? "Prototype next" : "Keep watching"}
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
              <CardLabel>Stage coverage</CardLabel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Maturity distribution
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Keep near-term product bets grounded in live market behavior
                while maintaining a small watchlist for bigger platform shifts.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {stageOrder.map((stage) => {
                const count = innovations.filter((item) => item.stage === stage).length;
                return (
                  <div
                    className="rounded-lg border border-border bg-surface p-4"
                    key={stage}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{stage}</p>
                      <Lightbulb size={16} className="text-muted" />
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                      {count}
                    </p>
                    <Bar value={(count / innovations.length) * 100} color="bg-brand" />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
