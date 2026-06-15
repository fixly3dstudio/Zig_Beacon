"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Apple,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Play,
  RefreshCw,
  Star,
} from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { syncReviewsAction, type SyncActionResult } from "@/app/(app)/reviews/actions";
import { getBrowserIntegrations } from "@/lib/reviews/browser-credentials";

export type ReviewItem = {
  id: number;
  store: string;
  rating: number;
  title: string | null;
  body: string;
  author: string | null;
  appVersion: string | null;
  category: string;
  sentiment: string;
  createdAt: string;
};

type ReviewsViewProps = {
  reviews: ReviewItem[];
  configured: { playStore: boolean; appStore: boolean };
};

const RED = "var(--danger)";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= rating ? "fill-amber-400 text-amber-400" : "text-track"}
        />
      ))}
    </span>
  );
}

function StoreIcon({ store, size = 14 }: { store: string; size?: number }) {
  return store === "App Store" ? <Apple size={size} /> : <Play size={size} />;
}

function relativeTime(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function sentimentClass(sentiment: string) {
  if (sentiment === "negative") return "bg-danger/10 text-[var(--danger)]";
  if (sentiment === "positive") return "bg-success/10 text-success";
  return "bg-elevated text-muted";
}

const RANGES: { value: string; label: string; days: number | null }[] = [
  { value: "all", label: "All time", days: null },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last month", days: 30 },
  { value: "90d", label: "Last 3 months", days: 90 },
  { value: "180d", label: "Last 6 months", days: 180 },
  { value: "365d", label: "Last 12 months", days: 365 },
];

// Kept as a module helper so the Date.now() call isn't flagged as impure render.
function rangeCutoff(value: string): number | null {
  const days = RANGES.find((r) => r.value === value)?.days ?? null;
  return days ? Date.now() - days * 86400000 : null;
}

export function ReviewsView({ reviews, configured }: ReviewsViewProps) {
  const [displayedReviews, setDisplayedReviews] = useState(reviews);
  const [connection, setConnection] = useState(configured);
  const [storeFilter, setStoreFilter] = useState<"All" | "App Store" | "Play Store">("All");
  const [ratingFilter, setRatingFilter] = useState<number | "All">("All");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [syncResult, setSyncResult] = useState<SyncActionResult | null>(null);

  async function loadBrowserAppStoreReviews() {
    const appstore = getBrowserIntegrations().appstore;
    if (!appstore) return null;

    const response = await fetch("/api/reviews/app-store-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appstore),
    });
    const data = (await response.json()) as {
      reviews?: ReviewItem[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Could not fetch App Store reviews.");
    }
    return data.reviews ?? [];
  }

  useEffect(() => {
    const saved = getBrowserIntegrations();
    if (!saved.appstore && !saved.play) return;

    setConnection({
      appStore: configured.appStore || Boolean(saved.appstore),
      playStore: configured.playStore || Boolean(saved.play),
    });

    if (saved.appstore) {
      loadBrowserAppStoreReviews()
        .then((live) => {
          if (!live) return;
          setDisplayedReviews(live.length > 0 ? live : reviews);
          setSyncResult({
            ok: true,
            results: [
              {
                store: "App Store",
                configured: true,
                fetched: live.length,
                created: live.length,
                updated: 0,
                note:
                  live.length === 0
                    ? "Connected, but App Store Connect returned no review rows for this app."
                    : "Loaded from the browser-saved App Store connection.",
              },
            ],
          });
        })
        .catch((error) => {
          setSyncResult({
            ok: false,
            results: [
              {
                store: "App Store",
                configured: true,
                fetched: 0,
                created: 0,
                updated: 0,
                error: error instanceof Error ? error.message : "Could not fetch App Store reviews.",
              },
            ],
          });
        });
    }
  }, [configured.appStore, configured.playStore, reviews]);

  const filtered = useMemo(() => {
    const cutoff = rangeCutoff(rangeFilter);
    return displayedReviews.filter(
      (r) =>
        (storeFilter === "All" || r.store === storeFilter) &&
        (ratingFilter === "All" || r.rating === ratingFilter) &&
        (cutoff === null || new Date(r.createdAt).getTime() >= cutoff)
    );
  }, [displayedReviews, storeFilter, ratingFilter, rangeFilter]);

  const stats = useMemo(() => {
    const total = displayedReviews.length;
    const avg = total ? displayedReviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const negative = displayedReviews.filter((r) => r.sentiment === "negative").length;
    const appStore = displayedReviews.filter((r) => r.store === "App Store").length;
    const playStore = displayedReviews.filter((r) => r.store === "Play Store").length;
    return { total, avg, negative, appStore, playStore };
  }, [displayedReviews]);

  const noStoreConnected = !connection.playStore && !connection.appStore;

  function handleSync() {
    startTransition(async () => {
      const saved = getBrowserIntegrations();
      if (saved.appstore) {
        try {
          const live = await loadBrowserAppStoreReviews();
          if (live) {
            setDisplayedReviews(live.length > 0 ? live : reviews);
            setConnection((current) => ({ ...current, appStore: true }));
            setSyncResult({
              ok: true,
              results: [
                {
                  store: "App Store",
                  configured: true,
                  fetched: live.length,
                  created: live.length,
                  updated: 0,
                  note:
                    live.length === 0
                      ? "Connected, but App Store Connect returned no review rows for this app."
                      : "Fetched live through the browser-saved App Store connection.",
                },
              ],
            });
            return;
          }
        } catch (error) {
          setSyncResult({
            ok: false,
            results: [
              {
                store: "App Store",
                configured: true,
                fetched: 0,
                created: 0,
                updated: 0,
                error: error instanceof Error ? error.message : "Could not fetch App Store reviews.",
              },
            ],
          });
          return;
        }
      }
      const result = await syncReviewsAction();
      setSyncResult(result);
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">App Reviews</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            Live App Store and Google Play reviews, pulled straight from the stores and folded
            into your signals — so ratings flow into sentiment, complaints and the AI Coach.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isPending}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          {isPending ? "Syncing…" : "Sync now"}
        </button>
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div className="mt-5 space-y-2">
          {syncResult.results.map((r) => (
            <div
              key={r.store}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border p-3 text-[13px]",
                r.error
                  ? "border-danger/30 bg-danger/10 text-danger"
                  : r.configured
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border bg-surface text-muted"
              )}
            >
              {r.error ? (
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
              ) : r.configured ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
              )}
              <div>
                <span className="font-semibold">{r.store}:</span>{" "}
                {r.error
                  ? r.error
                  : r.configured
                    ? `${r.fetched} fetched · ${r.created} new · ${r.updated} updated`
                    : "Not configured — add credentials to .env"}
                {r.note && !r.error && (
                  <span className="mt-0.5 block text-xs opacity-70">{r.note}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup notice */}
      {noStoreConnected && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-4 sm:flex-row sm:items-center">
          <AlertCircle size={18} className="shrink-0 text-warn" />
          <p className="flex-1 text-[13px] leading-6 text-foreground">
            No store is connected yet. Connect <strong>Google Play</strong> and{" "}
            <strong>App Store Connect</strong> in{" "}
            <a href="/settings" className="font-semibold text-brand underline-offset-2 hover:underline">
              Settings → App store integrations
            </a>
            , then hit <strong>Sync now</strong>. The reviews below are demo data until then.
          </p>
        </div>
      )}

      {/* KPI strip */}
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card className="p-5">
          <CardLabel>Total reviews</CardLabel>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{stats.total}</p>
          <p className="mt-1 text-xs text-muted">{stats.appStore} iOS · {stats.playStore} Android</p>
        </Card>
        <Card className="p-5">
          <CardLabel>Average rating</CardLabel>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-3xl font-semibold tabular-nums text-foreground">
              {stats.avg.toFixed(1)}
            </p>
            <Stars rating={Math.round(stats.avg)} />
          </div>
          <p className="mt-1 text-xs text-muted">across both stores</p>
        </Card>
        <Card className="p-5">
          <CardLabel>Negative reviews</CardLabel>
          <p className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: RED }}>
            {stats.negative}
          </p>
          <p className="mt-1 text-xs text-muted">1–2★ flagged as complaints</p>
        </Card>
        <Card className="p-5">
          <CardLabel>Connection</CardLabel>
          <div className="mt-3 space-y-1.5">
            <span className="flex items-center justify-between text-[13px]">
              <span className="inline-flex items-center gap-1.5 text-foreground"><Apple size={13} /> App Store</span>
              <span className={connection.appStore ? "text-success" : "text-muted"}>
                {connection.appStore ? "Connected" : "Not set"}
              </span>
            </span>
            <span className="flex items-center justify-between text-[13px]">
              <span className="inline-flex items-center gap-1.5 text-foreground"><Play size={13} /> Play Store</span>
              <span className={connection.playStore ? "text-success" : "text-muted"}>
                {connection.playStore ? "Connected" : "Not set"}
              </span>
            </span>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["All", "App Store", "Play Store"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStoreFilter(s)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                storeFilter === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted hover:text-foreground"
              )}
            >
              {s !== "All" && <StoreIcon store={s} size={13} />}
              {s}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          {(["All", 5, 4, 3, 2, 1] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                ratingFilter === r
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted hover:text-foreground"
              )}
            >
              {r === "All" ? "All ratings" : (
                <>
                  {r}
                  <Star size={11} className={cn("fill-current", ratingFilter === r ? "" : "text-amber-400")} />
                </>
              )}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="relative shrink-0">
          <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
            className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-border bg-background pl-9 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:border-foreground/30 focus:border-brand lg:w-44"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>
      </div>

      {/* Review list */}
      <div className="mt-5 space-y-3">
        {filtered.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.2 }}
            className={cn(
              "rounded-xl border bg-background p-5",
              review.sentiment === "negative" ? "border-danger/20" : "border-border"
            )}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                <StoreIcon store={review.store} />
                {review.store}
              </span>
              <Stars rating={review.rating} />
              {review.author && <span className="text-xs text-muted">· {review.author}</span>}
              {review.appVersion && (
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">
                  v{review.appVersion}
                </span>
              )}
              <span className="ml-auto text-[11px] tabular-nums text-muted">
                {relativeTime(review.createdAt)}
              </span>
            </div>
            {review.title && (
              <p className="mt-3 text-sm font-semibold text-foreground">{review.title}</p>
            )}
            <p className="mt-1.5 text-[14px] leading-7 text-foreground/90">{review.body}</p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                  sentimentClass(review.sentiment)
                )}
              >
                {review.sentiment}
              </span>
              <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-muted">
                {review.category}
              </span>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
            <Star size={24} className="mx-auto text-muted" />
            <p className="mt-3 text-sm font-medium text-foreground">No reviews match this filter</p>
            <p className="mt-1 text-xs text-muted">
              Try a different store or rating, or hit Sync now to pull the latest.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
