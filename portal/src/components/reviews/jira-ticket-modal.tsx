"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Ticket, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTicketForReview, type CreateTicketResult } from "@/app/(app)/reviews/jira-actions";

export type TicketReview = {
  id: number;
  store: string;
  rating: number;
  title: string | null;
  body: string;
  author: string | null;
  appVersion: string | null;
  category: string;
  createdAt: string;
};

const SEVERITIES = ["High", "Medium", "Low"];

function severityForRating(rating: number) {
  if (rating <= 2) return "High";
  if (rating === 3) return "Medium";
  return "Low";
}

function summarise(review: TicketReview) {
  const base = review.title?.trim() || review.body.trim();
  const words = base.split(/\s+/).slice(0, 9).join(" ");
  return words + (base.split(/\s+/).length > 9 ? "…" : "");
}

function draftDescription(review: TicketReview, severity: string) {
  const date = new Date(review.createdAt).toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return [
    "Problem",
    review.title ? `${review.title} — ${review.body}` : review.body,
    "",
    "User story",
    `As a Zig rider, I want ${review.category} to work reliably so that I don't run into this issue.`,
    "",
    "Evidence",
    `- Source: ${review.store} review${review.author ? ` by ${review.author}` : ""}`,
    `- Rating: ${review.rating}/5`,
    `- App version: v${review.appVersion ?? "n/a"}`,
    `- Date: ${date}`,
    `- Severity: ${severity}`,
  ].join("\n");
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand";

export function JiraTicketModal({
  review,
  onClose,
  onCreated,
}: {
  review: TicketReview;
  onClose: () => void;
  onCreated: (key: string) => void;
}) {
  const initialSeverity = severityForRating(review.rating);
  const [title, setTitle] = useState(`[${review.store}] ${review.category}: ${summarise(review)}`);
  const [severity, setSeverity] = useState(initialSeverity);
  const [description, setDescription] = useState(draftDescription(review, initialSeverity));
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CreateTicketResult | null>(null);

  function handleSeverityChange(next: string) {
    // keep the "Severity:" line in the draft in sync if the user hasn't edited it heavily
    setDescription((prev) =>
      prev.replace(/- Severity: (High|Medium|Low)/, `- Severity: ${next}`)
    );
    setSeverity(next);
  }

  function submit() {
    startTransition(async () => {
      const res = await createTicketForReview({
        reviewId: review.id,
        title,
        description,
        severity,
      });
      setResult(res);
      if (res.ok && res.key) onCreated(res.key);
    });
  }

  const created = result?.ok;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
              <Ticket size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Create Jira ticket</h2>
              <p className="text-xs text-muted">PM story drafted from this review</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {created ? (
          <div className="mt-5 rounded-xl border border-success/30 bg-success/10 p-4 text-center">
            <CheckCircle2 size={26} className="mx-auto text-success" />
            <p className="mt-2 text-sm font-semibold text-foreground">{result?.message}</p>
            {result?.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-sm font-semibold text-background"
              >
                Open {result.key}
                <ExternalLink size={14} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-2 block w-full text-xs font-medium text-muted hover:text-foreground"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Title</label>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Severity</label>
              <div className="flex gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSeverityChange(s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      severity === s
                        ? s === "High"
                          ? "border-danger bg-danger/10 text-danger"
                          : s === "Medium"
                            ? "border-warn bg-warn/10 text-warn"
                            : "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Description (PM story)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={11}
                className={cn(inputClass, "resize-none font-mono text-xs leading-5")}
              />
            </div>

            {result && !result.ok && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-2.5 text-[13px]",
                  result.notConfigured
                    ? "border-warn/30 bg-warn/10 text-warn"
                    : "border-danger/30 bg-danger/10 text-danger"
                )}
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{result.message}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? <Loader2 size={15} className="animate-spin" /> : <Ticket size={15} />}
                {pending ? "Creating…" : "Create ticket"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
