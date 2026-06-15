"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Headphones,
  MessageSquareText,
  MessagesSquare,
  Smartphone,
  AtSign,
  Quote,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getBrowserIntegrations } from "@/lib/reviews/browser-credentials";
import {
  complaintClustersFromReviews,
  complaintSignalsFromReviews,
  type ReviewComplaintSource,
} from "@/lib/reviews/complaint-derive";

export type ComplaintSignal = {
  id: number;
  source: string;
  category: string;
  sentiment: string;
  text: string;
  createdAt: string;
};

export type ComplaintClusterItem = {
  id: number;
  issue: string;
  category: string;
  volume: number;
  trendPct: number;
  severity: string;
};

type ComplaintsViewProps = {
  signals: ComplaintSignal[];
  clusters: ComplaintClusterItem[];
  sources: string[];
};

const RED = "var(--danger)";
const AMBER = "var(--warn)";

const sourceIcons: Record<string, LucideIcon> = {
  "App Store": Smartphone,
  "Play Store": Smartphone,
  Reddit: MessagesSquare,
  Support: Headphones,
  Twitter: AtSign,
};

function severityColor(severity: string) {
  if (severity === "high") return RED;
  if (severity === "medium") return AMBER;
  return "var(--muted)";
}

function ageLabel(value: string) {
  const date = new Date(value);
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 1) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export function ComplaintsView({
  signals,
  clusters,
  sources,
}: ComplaintsViewProps) {
  const [tab, setTab] = useState<"voices" | "reports">("voices");
  const [activeSource, setActiveSource] = useState("All");
  const [liveSignals, setLiveSignals] = useState<ComplaintSignal[] | null>(null);
  const [liveClusters, setLiveClusters] = useState<ComplaintClusterItem[] | null>(null);

  useEffect(() => {
    const appstore = getBrowserIntegrations().appstore;
    if (!appstore) return;

    fetch("/api/reviews/app-store-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appstore),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load App Store reviews.");
        return (await response.json()) as { reviews?: ReviewComplaintSource[] };
      })
      .then((data) => {
        const reviews = data.reviews ?? [];
        const nextSignals = complaintSignalsFromReviews(reviews);
        const nextClusters = complaintClustersFromReviews(reviews);
        if (nextSignals.length > 0) setLiveSignals(nextSignals);
        if (nextClusters.length > 0) setLiveClusters(nextClusters);
      })
      .catch(() => undefined);
  }, []);

  const activeSignals = liveSignals ?? signals;
  const activeClusters = liveClusters ?? clusters;
  const activeSources = useMemo(
    () => Array.from(new Set(activeSignals.map((signal) => signal.source))),
    [activeSignals]
  );

  const filteredSignals = useMemo(
    () =>
      activeSignals.filter(
        (s) => activeSource === "All" || s.source === activeSource
      ),
    [activeSource, activeSignals]
  );

  // Top themes ranked by cluster volume
  const themes = useMemo(
    () => [...activeClusters].sort((a, b) => b.volume - a.volume).slice(0, 5),
    [activeClusters]
  );

  // Reports tab: clusters grouped by feature area
  const reportGroups = useMemo(() => {
    const groups = new Map<string, ComplaintClusterItem[]>();
    for (const c of activeClusters) {
      const arr = groups.get(c.category) ?? [];
      arr.push(c);
      groups.set(c.category, arr);
    }
    return Array.from(groups.entries())
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => b.volume - a.volume),
        volume: items.reduce((sum, i) => sum + i.volume, 0),
        trend: Math.round(
          items.reduce((sum, i) => sum + i.trendPct * i.volume, 0) /
            Math.max(items.reduce((sum, i) => sum + i.volume, 0), 1)
        ),
        high: items.filter((i) => i.severity === "high").length,
      }))
      .sort((a, b) => b.volume - a.volume);
  }, [activeClusters]);

  const maxClusterVolume = Math.max(1, ...activeClusters.map((c) => c.volume));
  const maxGroupVolume = Math.max(1, ...reportGroups.map((g) => g.volume));

  return (
    <div>
      {/* Top-level tabs */}
      <div className="inline-flex rounded-xl border border-border bg-surface p-1">
        {(
          [
            { id: "voices", label: "What people are saying", icon: Quote },
            { id: "reports", label: "Reports", icon: FileBarChart },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "voices" ? (
          <motion.div
            key="voices"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {/* Medium tabs */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {["All", ...activeSources].map((source) => {
                const active = activeSource === source;
                const count =
                  source === "All"
                    ? activeSignals.length
                    : activeSignals.filter((s) => s.source === source).length;
                const Icon = sourceIcons[source] ?? MessageSquareText;
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setActiveSource(source)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted hover:text-foreground"
                    )}
                  >
                    {source !== "All" && <Icon size={13} />}
                    {source}
                    <span className="tabular-nums opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-12 gap-5">
              {/* Voices feed */}
              <div className="col-span-12 space-y-3 xl:col-span-8">
                {filteredSignals.map((signal, i) => {
                  const Icon = sourceIcons[signal.source] ?? MessageSquareText;
                  const negative = signal.sentiment === "negative";
                  return (
                    <motion.div
                      key={signal.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
                      className={cn(
                        "rounded-xl border bg-background p-5",
                        negative ? "border-danger/20" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full",
                            negative ? "bg-danger/10 text-[var(--danger)]" : "bg-surface text-muted"
                          )}
                        >
                          <Icon size={14} />
                        </span>
                        <span className="text-[13px] font-semibold text-foreground">
                          {signal.source}
                        </span>
                        <span className="text-[11px] text-muted">·</span>
                        <span className="text-[11px] text-muted">{signal.category}</span>
                        <span className="ml-auto text-[11px] tabular-nums text-muted">
                          {ageLabel(signal.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-[15px] leading-7 text-foreground">
                        “{signal.text}”
                      </p>
                      <div className="mt-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                            negative
                              ? "bg-danger/10 text-[var(--danger)]"
                              : "bg-elevated text-muted"
                          )}
                        >
                          {signal.sentiment}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                {filteredSignals.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
                    <p className="text-sm font-medium text-foreground">
                      Nothing matches this combination
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Try another medium or feature filter.
                    </p>
                  </div>
                )}
              </div>

              {/* Top themes rail */}
              <div className="col-span-12 xl:col-span-4">
                <Card className="sticky top-4">
                  <h2 className="text-[15px] font-medium text-foreground">
                    Top themes
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    What the volume of complaints is really about.
                  </p>
                  <ul className="mt-4 space-y-4">
                    {themes.map((c) => {
                      const rising = c.trendPct >= 0;
                      return (
                        <li key={c.id}>
                          <div className="flex items-start gap-2.5">
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: severityColor(c.severity) }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium leading-5 text-foreground">
                                {c.issue}
                              </p>
                              <span className="text-[11px] text-muted">{c.category}</span>
                            </div>
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums",
                                rising ? "text-[var(--danger)]" : "text-brand"
                              )}
                            >
                              {rising ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              {rising ? "+" : ""}
                              {Math.round(c.trendPct)}%
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3 pl-[18px]">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                              <div
                                className="h-full rounded-full bg-foreground"
                                style={{ width: `${(c.volume / maxClusterVolume) * 100}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs tabular-nums text-muted">
                              {c.volume}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mt-5 space-y-5"
          >
            {reportGroups.map((group) => {
              const groupRising = group.trend >= 0;
              return (
                <Card key={group.category}>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      {group.category}
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                        groupRising ? "text-[var(--danger)]" : "text-brand"
                      )}
                    >
                      {groupRising ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {groupRising ? "+" : ""}
                      {group.trend}% overall
                    </span>
                    {group.high > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-[var(--danger)]">
                        {group.high} high severity
                      </span>
                    )}
                    <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                      {group.volume.toLocaleString()}
                      <span className="ml-1 text-xs font-normal text-muted">reports</span>
                    </span>
                  </div>

                  {/* Share-of-total bar */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${(group.volume / maxGroupVolume) * 100}%` }}
                    />
                  </div>

                  <ul className="mt-4">
                    {group.items.map((c) => {
                      const rising = c.trendPct >= 0;
                      return (
                        <li
                          key={c.id}
                          className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0 last:pb-0"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: severityColor(c.severity) }}
                            title={`${c.severity} severity`}
                          />
                          <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                            {c.issue}
                          </p>
                          <span className="text-[13px] tabular-nums text-muted">
                            {c.volume.toLocaleString()}
                          </span>
                          <span
                            className={cn(
                              "inline-flex w-14 items-center justify-end gap-0.5 text-xs font-medium tabular-nums",
                              rising ? "text-[var(--danger)]" : "text-brand"
                            )}
                          >
                            {rising ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {rising ? "+" : ""}
                            {Math.round(c.trendPct)}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
