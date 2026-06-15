"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getBrowserIntegrations } from "@/lib/reviews/browser-credentials";
import {
  complaintClustersFromReviews,
  type DerivedComplaintCluster,
  type ReviewComplaintSource,
} from "@/lib/reviews/complaint-derive";

const RED = "var(--danger)";
const AMBER = "var(--warn)";

function ViewLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-brand"
    >
      View
      <ArrowRight size={13} />
    </Link>
  );
}

export function LiveTopComplaints({
  fallback,
}: {
  fallback: DerivedComplaintCluster[];
}) {
  const [live, setLive] = useState<DerivedComplaintCluster[] | null>(null);

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
        const clusters = complaintClustersFromReviews(data.reviews ?? []);
        if (clusters.length > 0) setLive(clusters);
      })
      .catch(() => undefined);
  }, []);

  const complaints = live ?? fallback;
  const totalComplaintVolume = useMemo(
    () => complaints.reduce((sum, item) => sum + item.volume, 0),
    [complaints]
  );
  const topComplaints = complaints.slice(0, 5);

  return (
    <Card className="col-span-12 lg:col-span-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-medium text-foreground">Top complaints</h2>
          {live && (
            <p className="mt-1 text-[11px] text-muted">
              Updated from latest App Store reviews
            </p>
          )}
        </div>
        <ViewLink href="/complaint-heatmap" />
      </div>
      <ul className="mt-4 space-y-1">
        {topComplaints.map((c, i) => {
          const rising = c.trendPct >= 0;
          const sevColor =
            c.severity === "high" ? RED : c.severity === "medium" ? AMBER : "var(--muted)";
          const share = totalComplaintVolume
            ? Math.round((c.volume / totalComplaintVolume) * 100)
            : 0;
          return (
            <li
              key={c.id}
              className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0"
            >
              <span className="w-4 text-[13px] tabular-nums text-muted">{i + 1}</span>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: sevColor }}
                title={`${c.severity} severity`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{c.issue}</p>
                <span className="text-[11px] text-muted">
                  {c.category} · {share}% of all volume
                </span>
              </div>
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
}
