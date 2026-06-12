"use client";

import { Fragment } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CardLabel } from "@/components/ui/card";

export type CompetitorProfile = {
  id: number;
  name: string;
  country: string;
  overview: string;
  strengths: string[];
  weaknesses: string[];
  notes: string[];
  availability: {
    available: number;
    partial: number;
    none: number;
  };
};

export type MatrixFeature = {
  id: number;
  name: string;
  category: string;
  competitors: Record<number, { status: string; notes: string | null }>;
};

type CompetitorMatrixProps = {
  competitors: CompetitorProfile[];
  featureGroups: { category: string; features: MatrixFeature[] }[];
};

type SelectedFeature = {
  feature: MatrixFeature;
  competitorId?: number;
};

const statusDisplay: Record<
  string,
  { label: string; mark: string; className: string }
> = {
  available: {
    label: "Available",
    mark: "✓",
    className: "bg-foreground text-background border-foreground",
  },
  partial: {
    label: "Partial",
    mark: "◐",
    className: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
  none: {
    label: "None",
    mark: "—",
    className: "bg-transparent text-zinc-300 border-zinc-200",
  },
};

const featureDescriptions: Record<
  string,
  { what: string; why: string; zigAction: string }
> = {
  "Flight tracking pickup": {
    what: "Connects an airport booking to live flight status so pickup timing, terminal guidance, and driver waiting expectations adjust around the actual arrival.",
    why: "Airport pickup is high-stress and time-sensitive. This feature reduces passenger-driver coordination, missed pickups, and support contacts.",
    zigAction: "Start with Changi terminal selection, flight number capture, and arrival-delay messaging before automating dispatch rules.",
  },
  "Promo auto-apply at checkout": {
    what: "Automatically finds and applies the best valid promo, voucher, wallet credit, or corporate benefit during checkout.",
    why: "Manual promo entry creates friction exactly when users are about to book. Auto-apply improves conversion and reduces complaints about missed discounts.",
    zigAction: "Prioritise a clear best-price treatment with a visible savings line and an audit trail for why a promo did or did not apply.",
  },
  "Multi-stop rides": {
    what: "Lets riders add one or more stops inside a single booking instead of creating separate trips.",
    why: "It supports real-life errands, shared rides, family pickup, and corporate trips while making fare expectations clearer.",
    zigAction: "Keep stop editing simple: show stop order, estimated fare impact, and driver visibility before confirmation.",
  },
  "Fare splitting": {
    what: "Allows multiple passengers to divide a trip fare through the app after or during booking.",
    why: "This removes social payment friction and makes group travel more convenient, especially for younger riders and event trips.",
    zigAction: "Treat it as a retention feature after core wallet and payment reliability are strong.",
  },
  "Loyalty tiers": {
    what: "Creates member levels based on ride activity, with benefits such as priority support, vouchers, or partner perks.",
    why: "Loyalty tiers give frequent riders a reason to consolidate trips instead of choosing only by lowest fare.",
    zigAction: "Anchor benefits around taxi reliability, airport usage, and corporate repeat riders rather than generic points alone.",
  },
  "Ride subscription plan": {
    what: "A paid or bundled plan that gives regular riders predictable ride benefits, discounts, or priority features.",
    why: "Subscriptions can improve repeat usage, but only work when benefits feel frequent, visible, and easy to redeem.",
    zigAction: "Validate with commuter corridors or airport users before launching a broad consumer plan.",
  },
  "In-app safety center": {
    what: "A dedicated safety surface for trip sharing, emergency actions, driver details, support access, and trust cues.",
    why: "Safety is table stakes in mobility. A visible center increases confidence, especially for late-night and family rides.",
    zigAction: "Make safety actions available at the right trip moments instead of hiding them in settings.",
  },
  "Driver preference memory": {
    what: "Remembers rider preferences such as quiet ride, accessibility needs, luggage, or driver notes.",
    why: "Preference memory makes repeat rides feel more personal and reduces repeated manual instructions.",
    zigAction: "Begin with low-risk preferences that drivers can act on clearly, then expand after measuring acceptance.",
  },
  "Street hail e-payment": {
    what: "Lets riders pay digitally for a taxi hailed on the street, connecting offline taxi usage to the app wallet.",
    why: "This bridges ComfortDelGro's taxi fleet advantage with app convenience and can increase wallet engagement.",
    zigAction: "Make receipt retrieval and wallet rewards obvious so street hail trips feed back into app loyalty.",
  },
  "Family accounts": {
    what: "Allows a primary user to manage family members, payment methods, trip visibility, and safety controls.",
    why: "Families need trust, oversight, and easier booking for dependents or older relatives.",
    zigAction: "Focus on child/elder trip monitoring, trusted contacts, and simplified payment control.",
  },
  "Corporate billing": {
    what: "Supports company-paid rides, policy controls, receipts, and employee trip management.",
    why: "Corporate trips are high-value and repeatable; billing clarity can make Zig sticky for business users.",
    zigAction: "Lean into ComfortDelGro's reliability and receipts, then add policy-based booking nudges.",
  },
  "EV ride option": {
    what: "Lets users choose or prefer electric vehicles for lower-emission trips.",
    why: "EV options signal sustainability and can attract riders who care about environmental impact or corporate ESG reporting.",
    zigAction: "Show wait-time and fare tradeoffs clearly so EV choice does not feel like a hidden constraint.",
  },
  "Pet-friendly rides": {
    what: "Lets riders request drivers who accept pets and understand pet transport expectations.",
    why: "Pet trips are stressful when acceptance is uncertain; a clear option reduces cancellations and awkward driver negotiation.",
    zigAction: "Pair the option with pet guidelines, cleaning expectations, and transparent fees if needed.",
  },
  "Advance booking 7+ days": {
    what: "Allows riders to schedule trips more than a week ahead for airport, medical, event, or business travel.",
    why: "Longer booking windows support planned journeys where reliability matters more than immediate price.",
    zigAction: "Use confirmation reminders and supply confidence cues so advance booking feels dependable.",
  },
};

function fallbackDescription(feature: MatrixFeature) {
  return {
    what: `${feature.name} is a ${feature.category.toLowerCase()} capability that shapes how riders complete or manage a trip inside a mobility app.`,
    why: "It matters because feature depth influences conversion, repeat usage, support volume, and perceived parity against competing ride-hailing apps.",
    zigAction: "Compare Zig's current support against the strongest competitor implementation, then decide whether to close the gap, differentiate, or deliberately ignore it.",
  };
}

function statusTone(status: string) {
  if (status === "available") return "Ready";
  if (status === "partial") return "Needs depth";
  return "Gap";
}

function statusScore(status: string) {
  if (status === "available") return 1;
  if (status === "partial") return 0.5;
  return 0;
}

function FeatureExplanationCard({
  selection,
  competitors,
  onClose,
}: {
  selection: SelectedFeature | null;
  competitors: CompetitorProfile[];
  onClose: () => void;
}) {
  if (!selection) {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background text-muted">
            <Info size={17} />
          </div>
          <div>
            <CardLabel>Feature explanation</CardLabel>
            <p className="mt-2 text-sm leading-6 text-muted">
              Click any feature name or availability marker in the matrix to see
              what the feature does, why it matters, Zig&apos;s current position,
              and competitor notes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { feature, competitorId } = selection;
  const description = featureDescriptions[feature.name] ?? fallbackDescription(feature);
  const rows = competitors.map((competitor) => {
    const cell = feature.competitors[competitor.id] ?? { status: "none", notes: null };
    return { competitor, cell };
  });
  const selectedCompetitor = competitorId
    ? rows.find((row) => row.competitor.id === competitorId)
    : null;
  const zig = rows.find((row) => row.competitor.name === "Zig");
  const leaders = rows
    .filter((row) => row.cell.status === "available" && row.competitor.name !== "Zig")
    .map((row) => row.competitor.name);
  const maturity = Math.round(
    (rows.reduce((sum, row) => sum + statusScore(row.cell.status), 0) / rows.length) * 100
  );

  return (
    <motion.section
      key={`${feature.id}-${competitorId ?? "feature"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-lg border border-border bg-background p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardLabel>{feature.category} feature</CardLabel>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {feature.name}
          </h2>
          {selectedCompetitor ? (
            <p className="mt-1 text-sm text-muted">
              Focus: {selectedCompetitor.competitor.name} is{" "}
              <span className="font-medium text-foreground">
                {statusDisplay[selectedCompetitor.cell.status]?.label.toLowerCase() ??
                  selectedCompetitor.cell.status}
              </span>
              {selectedCompetitor.cell.notes ? ` — ${selectedCompetitor.cell.notes}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Market maturity
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
              {maturity}%
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition hover:border-foreground hover:text-foreground"
            aria-label="Hide feature explanation"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <CardLabel>What it is</CardLabel>
          <p className="mt-2 text-sm leading-6 text-foreground">{description.what}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <CardLabel>Why it matters</CardLabel>
          <p className="mt-2 text-sm leading-6 text-foreground">{description.why}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <CardLabel>Zig action</CardLabel>
          <p className="mt-2 text-sm leading-6 text-foreground">{description.zigAction}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-border p-4">
          <CardLabel>Zig position</CardLabel>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {statusTone(zig?.cell.status ?? "none")}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                zig?.cell.status === "available" && "bg-foreground text-background",
                zig?.cell.status === "partial" && "bg-zinc-100 text-foreground",
                (!zig || zig.cell.status === "none") && "bg-red-50 text-red-700"
              )}
            >
              {statusDisplay[zig?.cell.status ?? "none"]?.label ?? "None"}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            {zig?.cell.notes ??
              (zig?.cell.status === "available"
                ? "Zig already supports this capability in the current matrix."
                : "No Zig-specific implementation note is available yet.")}
          </p>
        </div>

        <div className="rounded-lg border border-border p-4">
          <CardLabel>Competitive read</CardLabel>
          <p className="mt-2 text-sm leading-6 text-muted">
            {leaders.length > 0
              ? `${leaders.join(", ")} ${leaders.length === 1 ? "has" : "have"} full availability.`
              : "No competitor has full availability in this matrix."}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                className="rounded-lg border border-border/70 bg-surface px-3 py-2"
                key={row.competitor.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {row.competitor.name}
                  </span>
                  <span className="text-xs text-muted">
                    {statusDisplay[row.cell.status]?.label ?? row.cell.status}
                  </span>
                </div>
                {row.cell.notes ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                    {row.cell.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ProfileDrawer({
  competitor,
  onClose,
}: {
  competitor: CompetitorProfile | null;
  onClose: () => void;
}) {
  const total =
    (competitor?.availability.available ?? 0) +
    (competitor?.availability.partial ?? 0) +
    (competitor?.availability.none ?? 0);
  const coverage =
    competitor && total > 0
      ? Math.round(
          ((competitor.availability.available +
            competitor.availability.partial * 0.5) /
            total) *
            100
        )
      : 0;

  return (
    <AnimatePresence>
      {competitor ? (
        <>
          <motion.button
            aria-label="Close competitor profile"
            className="fixed inset-0 z-40 cursor-default bg-black/10 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            type="button"
          />
          <motion.aside
            aria-label={`${competitor.name} profile`}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[430px] flex-col border-l border-border bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <CardLabel>Competitor profile</CardLabel>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {competitor.name}
                </h2>
                <p className="mt-1 text-sm text-muted">{competitor.country}</p>
              </div>
              <button
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition hover:border-foreground hover:text-foreground"
                onClick={onClose}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <CardLabel>Feature coverage</CardLabel>
                    <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                      {coverage}%
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p>{competitor.availability.available} available</p>
                    <p>{competitor.availability.partial} partial</p>
                    <p>{competitor.availability.none} absent</p>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${coverage}%` }}
                  />
                </div>
              </div>

              <section className="mt-6">
                <CardLabel>Overview</CardLabel>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  {competitor.overview}
                </p>
              </section>

              <section className="mt-7">
                <CardLabel>Strengths</CardLabel>
                <ul className="mt-3 space-y-2">
                  {competitor.strengths.map((strength) => (
                    <li
                      className="border-b border-border/70 pb-2 text-sm leading-5 text-foreground last:border-0"
                      key={strength}
                    >
                      {strength}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-7">
                <CardLabel>Weaknesses</CardLabel>
                <ul className="mt-3 space-y-2">
                  {competitor.weaknesses.map((weakness) => (
                    <li
                      className="border-b border-border/70 pb-2 text-sm leading-5 text-foreground last:border-0"
                      key={weakness}
                    >
                      {weakness}
                    </li>
                  ))}
                </ul>
              </section>

              {competitor.notes.length > 0 ? (
                <section className="mt-7">
                  <CardLabel>Watch notes</CardLabel>
                  <ul className="mt-3 space-y-2">
                    {competitor.notes.slice(0, 4).map((note) => (
                      <li
                        className="rounded-lg border border-border bg-background p-3 text-sm leading-5 text-muted"
                        key={note}
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function CompetitorMatrix({
  competitors,
  featureGroups,
}: CompetitorMatrixProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(
    null
  );
  const selected = useMemo(
    () => competitors.find((competitor) => competitor.id === selectedId) ?? null,
    [competitors, selectedId]
  );

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="sticky left-0 z-20 w-[250px] bg-surface px-5 py-4 text-left text-[11px] font-medium uppercase tracking-wider text-muted">
                  Feature
                </th>
                {competitors.map((competitor) => {
                  const isZig = competitor.name === "Zig";
                  return (
                    <th
                      className={cn(
                        "min-w-[132px] px-3 py-3 text-center",
                        isZig && "bg-[rgba(3,103,252,0.08)]"
                      )}
                      key={competitor.id}
                    >
                      <button
                        className={cn(
                          "mx-auto block rounded-md px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-background hover:shadow-sm",
                          isZig && "text-brand"
                        )}
                        onClick={() => setSelectedId(competitor.id)}
                        type="button"
                      >
                        <span className="block">{competitor.name}</span>
                        <span className="mt-0.5 block text-[11px] font-normal text-muted">
                          {competitor.country}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {featureGroups.map((group) => (
                <Fragment key={group.category}>
                  <tr key={`${group.category}-group`}>
                    <td
                      className="sticky left-0 z-10 border-b border-border bg-background px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted"
                      colSpan={competitors.length + 1}
                    >
                      {group.category}
                    </td>
                  </tr>
                  {group.features.map((feature) => (
                    <tr
                      className="border-b border-border/70 transition hover:bg-surface/70"
                      key={feature.id}
                    >
                      <th className="sticky left-0 z-10 bg-background px-5 py-4 text-left text-[13px] font-medium text-foreground">
                        <button
                          type="button"
                          onClick={() => setSelectedFeature({ feature })}
                          className="text-left font-medium text-foreground underline-offset-4 transition hover:text-brand hover:underline"
                        >
                          {feature.name}
                        </button>
                      </th>
                      {competitors.map((competitor) => {
                        const cell = feature.competitors[competitor.id] ?? {
                          status: "none",
                          notes: null,
                        };
                        const display =
                          statusDisplay[cell.status] ?? statusDisplay.none;
                        return (
                          <td
                            className={cn(
                              "px-3 py-4 text-center",
                              competitor.name === "Zig" &&
                                "bg-[rgba(3,103,252,0.035)]"
                            )}
                            key={`${feature.id}-${competitor.id}`}
                          >
                            <button
                              aria-label={`${competitor.name}: ${display.label}`}
                              className={cn(
                                "mx-auto grid h-8 w-8 place-items-center rounded-full border text-base font-semibold",
                                display.className,
                                "transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand/30"
                              )}
                              onClick={() =>
                                setSelectedFeature({
                                  feature,
                                  competitorId: competitor.id,
                                })
                              }
                              type="button"
                              title={cell.notes ?? display.label}
                            >
                              {display.mark}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        {Object.values(statusDisplay).map((display) => (
          <span className="inline-flex items-center gap-1.5" key={display.label}>
            <span
              className={cn(
                "grid h-5 w-5 place-items-center rounded-full border text-[11px] font-semibold",
                display.className
              )}
            >
              {display.mark}
            </span>
            {display.label}
          </span>
        ))}
      </div>

      <FeatureExplanationCard
        selection={selectedFeature}
        competitors={competitors}
        onClose={() => setSelectedFeature(null)}
      />

      <ProfileDrawer competitor={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
