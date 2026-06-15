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
  Target,
  Wrench,
  ChevronDown,
  Download,
  Star,
  Flame,
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
  rating?: number | null;
  createdAt: string;
};

export type ComplaintClusterItem = {
  id: number;
  issue: string;
  category: string;
  volume: number;
  trendPct: number;
  severity: string;
  rootCause?: string | null;
  fix?: string | null;
};

const STORE_SOURCES = ["App Store", "Play Store"];

// Fallback "what to fix" per module, used when a cluster has no curated fix
// (e.g. clusters derived live from App Store reviews).
const CATEGORY_FIX: Record<string, string> = {
  Promotions: "Auto-apply the best eligible promo at checkout and show it in the fare breakdown.",
  Booking: "Clarify ride options before confirm and make cancellations / re-allocation transparent.",
  Payments: "Streamline checkout to one tap with a default saved card and in-app receipts.",
  Airport: "Add a terminal-aware airport pickup flow that captures the terminal up front.",
  Rewards: "Add points-expiry reminders and surface the balance and redemption clearly.",
  Technical: "Prioritise crash fixes and ship a lightweight mode for older devices.",
  Account: "Simplify login, verification and account recovery.",
  Reviews: "Triage the recurring review themes and route them to the owning squad.",
};

type ComplaintsViewProps = {
  signals: ComplaintSignal[];
  clusters: ComplaintClusterItem[];
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

function severityLabel(severity: string) {
  return severity === "high" ? "High" : severity === "medium" ? "Medium" : "Low";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** One complaint issue with an expandable root cause + recommended fix. */
function IssueDetail({
  issue,
  maxVolume,
  defaultOpen = false,
}: {
  issue: ComplaintClusterItem;
  maxVolume: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rising = issue.trendPct >= 0;
  const fix = issue.fix ?? CATEGORY_FIX[issue.category] ?? null;

  return (
    <div className="rounded-xl border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: severityColor(issue.severity) }}
          title={`${severityLabel(issue.severity)} severity`}
        />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
          {issue.issue}
        </span>
        <span className="hidden text-[13px] tabular-nums text-muted sm:inline">
          {issue.volume.toLocaleString()}
        </span>
        <span
          className={cn(
            "inline-flex w-12 items-center justify-end gap-0.5 text-xs font-medium tabular-nums",
            rising ? "text-[var(--danger)]" : "text-brand"
          )}
        >
          {rising ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {rising ? "+" : ""}
          {Math.round(issue.trendPct)}%
        </span>
        <ChevronDown
          size={15}
          className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${(issue.volume / maxVolume) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-muted">
                  {issue.volume.toLocaleString()} reports · {severityLabel(issue.severity)}
                </span>
              </div>

              {issue.rootCause && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Root cause
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-foreground/90">
                    {issue.rootCause}
                  </p>
                </div>
              )}

              {fix && (
                <div className="rounded-lg border border-brand/20 bg-brand/5 p-3">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand">
                    <Wrench size={12} />
                    Recommended fix
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-foreground">{fix}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ComplaintsView({
  signals,
  clusters,
}: ComplaintsViewProps) {
  const [tab, setTab] = useState<"voices" | "reports">("voices");
  const [activeSource, setActiveSource] = useState("All");
  const [appStoreSignals, setAppStoreSignals] = useState<ComplaintSignal[]>([]);
  const [appStoreClusters, setAppStoreClusters] = useState<ComplaintClusterItem[]>([]);
  const [redditSignals, setRedditSignals] = useState<ComplaintSignal[]>([]);
  const [redditClusters, setRedditClusters] = useState<ComplaintClusterItem[]>([]);

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
        if (nextSignals.length > 0) setAppStoreSignals(nextSignals);
        if (nextClusters.length > 0) setAppStoreClusters(nextClusters);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch("/api/reddit-signals")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load Reddit signals.");
        return (await response.json()) as {
          signals?: ComplaintSignal[];
          clusters?: ComplaintClusterItem[];
        };
      })
      .then((data) => {
        setRedditSignals(data.signals ?? []);
        setRedditClusters(data.clusters ?? []);
      })
      .catch(() => undefined);
  }, []);

  const activeSignals = useMemo(() => {
    const byId = new Map<string, ComplaintSignal>();
    for (const signal of [...signals, ...appStoreSignals, ...redditSignals]) {
      byId.set(`${signal.source}:${signal.id}:${signal.text}`, signal);
    }
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [appStoreSignals, redditSignals, signals]);

  const activeClusters = useMemo(
    () => [...clusters, ...appStoreClusters, ...redditClusters].sort((a, b) => b.volume - a.volume),
    [appStoreClusters, clusters, redditClusters]
  );
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

  // Reports tab: modules ranked by a focus score (volume × trend + severity),
  // grounded in how many App Store / Play reviews mention each module.
  const reportGroups = useMemo(() => {
    const groups = new Map<string, ComplaintClusterItem[]>();
    for (const c of activeClusters) {
      const arr = groups.get(c.category) ?? [];
      arr.push(c);
      groups.set(c.category, arr);
    }

    const storeByCategory = new Map<string, { count: number; ratingSum: number; rated: number }>();
    for (const s of activeSignals) {
      if (!STORE_SOURCES.includes(s.source)) continue;
      const entry = storeByCategory.get(s.category) ?? { count: 0, ratingSum: 0, rated: 0 };
      entry.count += 1;
      if (typeof s.rating === "number" && s.rating > 0) {
        entry.ratingSum += s.rating;
        entry.rated += 1;
      }
      storeByCategory.set(s.category, entry);
    }

    return Array.from(groups.entries())
      .map(([category, items]) => {
        const volume = items.reduce((sum, i) => sum + i.volume, 0);
        const trend = Math.round(
          items.reduce((sum, i) => sum + i.trendPct * i.volume, 0) / Math.max(volume, 1)
        );
        const high = items.filter((i) => i.severity === "high").length;
        const store = storeByCategory.get(category);
        const reviewMentions = store?.count ?? 0;
        const avgRating = store && store.rated > 0 ? store.ratingSum / store.rated : null;
        const focusScore = Math.round(volume * (1 + Math.max(trend, 0) / 100) + high * 150);
        return {
          category,
          items: [...items].sort((a, b) => b.volume - a.volume),
          volume,
          trend,
          high,
          reviewMentions,
          avgRating,
          focusScore,
        };
      })
      .sort((a, b) => b.focusScore - a.focusScore);
  }, [activeClusters, activeSignals]);

  const focusModule = reportGroups[0];
  const maxClusterVolume = Math.max(1, ...activeClusters.map((c) => c.volume));
  const maxFocusScore = Math.max(1, ...reportGroups.map((g) => g.focusScore));

  function downloadReport(group: (typeof reportGroups)[number], rank: number) {
    const generatedAt = new Date().toLocaleString("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const highestVolume = group.items[0]?.volume ?? 0;
    const severityMix = group.items.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] ?? 0) + 1;
      return acc;
    }, {});
    const topFix =
      group.items[0]?.fix ?? CATEGORY_FIX[group.category] ?? "Review the highest-volume comments and route the fix to the owning product squad.";
    const issueRows = group.items
      .map((issue, index) => {
        const fix = issue.fix ?? CATEGORY_FIX[issue.category] ?? "Needs product triage.";
        return `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>${escapeHtml(issue.issue)}</strong>
              ${
                issue.rootCause
                  ? `<div class="muted small">Root cause: ${escapeHtml(issue.rootCause)}</div>`
                  : ""
              }
            </td>
            <td>${issue.volume.toLocaleString()}</td>
            <td>${issue.trendPct >= 0 ? "+" : ""}${Math.round(issue.trendPct)}%</td>
            <td><span class="pill ${issue.severity}">${severityLabel(issue.severity)}</span></td>
            <td>${escapeHtml(fix)}</td>
          </tr>
        `;
      })
      .join("");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(group.category)} complaint report</title>
  <style>
    body { color: #111; font: 14px/1.55 Arial, Helvetica, sans-serif; margin: 40px; }
    h1 { font-size: 30px; line-height: 1.15; margin: 0 0 6px; }
    h2 { border-top: 1px solid #ddd; font-size: 18px; margin-top: 28px; padding-top: 20px; }
    .muted { color: #676b73; }
    .small { font-size: 12px; margin-top: 4px; }
    .eyebrow { color: #0b66ff; font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    .summary { background: #f3f7ff; border: 1px solid #b8d2ff; border-radius: 12px; margin: 22px 0; padding: 18px; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(4, 1fr); margin: 18px 0; }
    .metric { border: 1px solid #ddd; border-radius: 10px; padding: 14px; }
    .metric span { color: #676b73; display: block; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    .metric strong { display: block; font-size: 24px; margin-top: 5px; }
    table { border-collapse: collapse; margin-top: 12px; width: 100%; }
    th, td { border-bottom: 1px solid #e5e5e5; padding: 11px; text-align: left; vertical-align: top; }
    th { color: #676b73; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    .pill { border-radius: 999px; display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 8px; text-transform: uppercase; }
    .high { background: #fee2e2; color: #b91c1c; }
    .medium { background: #fef3c7; color: #92400e; }
    .low { background: #f1f5f9; color: #475569; }
    .fix { background: #f6f9ff; border: 1px solid #cfe0ff; border-radius: 10px; padding: 14px; }
    @media print { body { margin: 24px; } .grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <p class="eyebrow">Zig Beacon complaint report</p>
  <h1>${escapeHtml(group.category)} module</h1>
  <p class="muted">Generated ${escapeHtml(generatedAt)} · Ranked priority ${rank}</p>

  <div class="summary">
    <strong>Executive summary</strong>
    <p>${escapeHtml(group.category)} has ${group.volume.toLocaleString()} complaint reports with a ${group.trend >= 0 ? "+" : ""}${group.trend}% trend. ${group.high} high-severity issue${group.high === 1 ? "" : "s"} require attention, and ${group.reviewMentions.toLocaleString()} App Store / Play Store review${group.reviewMentions === 1 ? "" : "s"} mention this module.</p>
  </div>

  <div class="grid">
    <div class="metric"><span>Total reports</span><strong>${group.volume.toLocaleString()}</strong></div>
    <div class="metric"><span>Store mentions</span><strong>${group.reviewMentions.toLocaleString()}</strong></div>
    <div class="metric"><span>High severity</span><strong>${group.high}</strong></div>
    <div class="metric"><span>Focus score</span><strong>${group.focusScore.toLocaleString()}</strong></div>
  </div>

  <h2>Severity and impact</h2>
  <p>Severity mix: ${severityLabel("high")} ${severityMix.high ?? 0}, ${severityLabel("medium")} ${severityMix.medium ?? 0}, ${severityLabel("low")} ${severityMix.low ?? 0}. The largest issue alone accounts for ${highestVolume.toLocaleString()} report${highestVolume === 1 ? "" : "s"}.</p>
  ${group.avgRating ? `<p>Average rating from related store comments: ${group.avgRating.toFixed(1)} / 5.</p>` : ""}

  <h2>Recommended action</h2>
  <div class="fix">${escapeHtml(topFix)}</div>

  <h2>Issue breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Complaint theme</th>
        <th>Reports</th>
        <th>Trend</th>
        <th>Severity</th>
        <th>Recommended fix</th>
      </tr>
    </thead>
    <tbody>${issueRows}</tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zig-beacon-${safeFileName(group.category)}-complaint-report.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

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
            className="mt-5 space-y-6"
          >
            {focusModule ? (
              <>
                {/* Where to focus — hero */}
                <Card className="border-brand/30 bg-brand/5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-background">
                      <Target size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">
                          Where to focus
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                          Priority 1
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">
                          {focusModule.category}
                        </h2>
                        <button
                          type="button"
                          onClick={() => downloadReport(focusModule, 1)}
                          className="inline-flex w-fit items-center gap-2 rounded-lg border border-brand/30 bg-background px-3 py-2 text-xs font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/10"
                        >
                          <Download size={14} />
                          Download report
                        </button>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-6 text-foreground/90">
                        <span className="font-semibold">{focusModule.category}</span> is the module
                        to focus on — {focusModule.volume.toLocaleString()} complaint reports, trend{" "}
                        {focusModule.trend >= 0 ? "+" : ""}
                        {focusModule.trend}%, {focusModule.high} high-severity issue
                        {focusModule.high === 1 ? "" : "s"}
                        {focusModule.reviewMentions > 0
                          ? `, echoed by ${focusModule.reviewMentions} app store review${focusModule.reviewMentions === 1 ? "" : "s"}`
                          : ""}
                        . Fix these first.
                      </p>
                    </div>
                  </div>

                  {/* Driver chips */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {[
                      { label: "Reports", value: focusModule.volume.toLocaleString(), icon: Flame },
                      {
                        label: "Trend",
                        value: `${focusModule.trend >= 0 ? "+" : ""}${focusModule.trend}%`,
                        icon: focusModule.trend >= 0 ? ArrowUpRight : ArrowDownRight,
                      },
                      { label: "High severity", value: `${focusModule.high}`, icon: Target },
                      {
                        label: "App store",
                        value:
                          focusModule.reviewMentions > 0
                            ? `${focusModule.reviewMentions}${focusModule.avgRating ? ` · ${focusModule.avgRating.toFixed(1)}★` : ""}`
                            : "—",
                        icon: Star,
                      },
                    ].map((d) => {
                      const Icon = d.icon;
                      return (
                        <div key={d.label} className="rounded-xl border border-border bg-background p-3">
                          <p className="inline-flex items-center gap-1 text-[11px] text-muted">
                            <Icon size={12} />
                            {d.label}
                          </p>
                          <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
                            {d.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Top fixes for the focus module */}
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      What to fix first
                    </p>
                    <div className="space-y-2.5">
                      {focusModule.items.slice(0, 3).map((issue, i) => (
                        <IssueDetail
                          key={issue.id}
                          issue={issue}
                          maxVolume={maxClusterVolume}
                          defaultOpen={i === 0}
                        />
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Every module, ranked by focus */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <FileBarChart size={16} className="text-muted" />
                    <h3 className="text-[15px] font-medium text-foreground">
                      Every module, ranked by focus
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {reportGroups.map((group, idx) => {
                      const rising = group.trend >= 0;
                      return (
                        <Card key={group.category}>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <span
                              className={cn(
                                "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                                idx === 0
                                  ? "bg-brand text-background"
                                  : "bg-elevated text-muted"
                              )}
                            >
                              {idx + 1}
                            </span>
                            <h2 className="text-base font-semibold tracking-tight text-foreground">
                              {group.category}
                            </h2>
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                                rising ? "text-[var(--danger)]" : "text-brand"
                              )}
                            >
                              {rising ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              {rising ? "+" : ""}
                              {group.trend}%
                            </span>
                            {group.high > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-[var(--danger)]">
                                {group.high} high
                              </span>
                            )}
                            {group.reviewMentions > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-[11px] text-muted">
                                <Smartphone size={11} />
                                {group.reviewMentions} review{group.reviewMentions === 1 ? "" : "s"}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => downloadReport(group, idx + 1)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-brand/40 hover:text-brand"
                            >
                              <Download size={12} />
                              Download
                            </button>
                            <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                              {group.volume.toLocaleString()}
                              <span className="ml-1 text-xs font-normal text-muted">reports</span>
                            </span>
                          </div>

                          {/* Focus-score bar */}
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                              <div
                                className="h-full rounded-full bg-foreground"
                                style={{ width: `${(group.focusScore / maxFocusScore) * 100}%` }}
                              />
                            </div>
                            <span className="text-[11px] tabular-nums text-muted">
                              focus {group.focusScore.toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2.5">
                            {group.items.map((issue) => (
                              <IssueDetail
                                key={issue.id}
                                issue={issue}
                                maxVolume={maxClusterVolume}
                              />
                            ))}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
                <p className="text-sm font-medium text-foreground">No complaint data yet</p>
                <p className="mt-1 text-xs text-muted">
                  Connect a store in Settings and sync reviews to build the focus report.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
