"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Clock3,
  Globe2,
  Loader2,
  Newspaper,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Region = "singapore" | "international";

type TransportNewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  sourceUrl: string;
  publishedAt: string | null;
  summary: string;
  region: Region;
  topics: string[];
  relevance: number;
};

type NewsResponse = {
  refreshedAt: string;
  items: TransportNewsItem[];
  counts: Record<Region, number>;
  failedSources: { source: string; error: string }[];
  sources: { name: string; region: Region }[];
};

const samplePrompts = [
  "platform fee",
  "driverless taxi",
  "cross-border taxi",
  "Changi pickup",
  "ride-hailing",
];

function freshnessLabel(value: string | null) {
  if (!value) return "Unknown";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}


export function TransportNewsPortal() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region>("singapore");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/transport-news?ts=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`News refresh failed (${response.status})`);
      const nextData = (await response.json()) as NewsResponse;
      setData(nextData);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "News refresh failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadNews();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadNews]);

  const filteredItems = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();
    return (data?.items ?? []).filter((item) => {
      if (item.region !== activeRegion) return false;
      if (!normalisedQuery) return true;
      const haystack = `${item.title} ${item.summary} ${item.source} ${item.topics.join(" ")}`.toLowerCase();
      return haystack.includes(normalisedQuery);
    });
  }, [activeRegion, data?.items, query]);

  const remaining = filteredItems;
  const topSources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of filteredItems) {
      counts.set(item.source, (counts.get(item.source) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredItems]);

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-[rgba(3,103,252,0.08)] px-3 py-1.5 text-xs font-medium text-brand">
            <Newspaper size={14} />
            Daily mobility news portal
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Transport News
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted">
            Track Singapore transport stories like platform fees, driverless taxi
            trials, cross-border taxi movement, airport pickup changes, and global
            mobility updates from multiple news sources.
          </p>
        </div>
        <button
          onClick={() => void loadNews()}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh news
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-full rounded-xl border border-border bg-surface p-1 lg:w-fit">
          {(["singapore", "international"] as Region[]).map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors lg:flex-none",
                activeRegion === region
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              )}
            >
              {region === "singapore" ? "Singapore" : "International"}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topic, source, keyword..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Could not refresh the news feeds.</p>
            <p className="mt-1 text-red-600">{error}</p>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="min-h-80 animate-pulse bg-surface">
            <span />
          </Card>
          <Card className="min-h-80 animate-pulse bg-surface">
            <span />
          </Card>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            {remaining.length === 0 ? (
              <Card className="p-8 text-center">
                <Globe2 size={28} className="mx-auto text-muted" />
                <h2 className="mt-3 text-base font-semibold text-foreground">
                  No matching transport stories
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                  Try a broader topic or refresh the feed. Some publishers may be
                  temporarily unavailable.
                </p>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {remaining.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-xl border border-border bg-background p-5 transition-colors hover:border-foreground/20 hover:bg-surface"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
                      <span className="truncate font-medium text-foreground">
                        {item.source}
                      </span>
                      <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                      <span className="shrink-0">{freshnessLabel(item.publishedAt)}</span>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                    />
                  </div>
                  <h3 className="mt-3 line-clamp-3 text-base font-semibold leading-snug text-foreground">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                      {item.summary}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.topics.slice(0, 3).map((itemTopic) => (
                      <span
                        key={itemTopic}
                        className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium text-muted"
                      >
                        {itemTopic}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <CardLabel>Topic shortcuts</CardLabel>
              <div className="mt-4 flex flex-wrap gap-2">
                {samplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setQuery(prompt)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand/30 hover:text-brand"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <CardLabel>Top sources in view</CardLabel>
              <div className="mt-4 space-y-3">
                {topSources.length > 0 ? (
                  topSources.map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-foreground">
                        {source}
                      </span>
                      <span className="rounded-full bg-surface px-2 py-1 text-xs text-muted">
                        {count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-muted">No sources for this filter.</p>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <CardLabel>Refresh behaviour</CardLabel>
              <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
                <div className="flex gap-3">
                  <Clock3 size={16} className="mt-1 shrink-0 text-brand" />
                  <p>Every page load requests fresh feed data with no server cache.</p>
                </div>
                <div className="flex gap-3">
                  <Sparkles size={16} className="mt-1 shrink-0 text-brand" />
                  <p>Stories are automatically tagged by mobility theme and region.</p>
                </div>
              </div>
            </Card>

            {data?.failedSources.length ? (
              <Card className="p-5">
                <CardLabel>Unavailable feeds</CardLabel>
                <div className="mt-4 space-y-2">
                  {data.failedSources.slice(0, 5).map((source) => (
                    <p key={source.source} className="text-xs leading-5 text-muted">
                      <span className="font-medium text-foreground">{source.source}</span>:{" "}
                      {source.error}
                    </p>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
