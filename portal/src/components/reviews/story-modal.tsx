"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ClipboardList, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type StoryReview = {
  store: string;
  rating: number;
  title: string | null;
  body: string;
  author: string | null;
  appVersion: string | null;
  category: string;
  createdAt: string;
};

function severityForRating(rating: number) {
  if (rating <= 2) return "High";
  if (rating === 3) return "Medium";
  return "Low";
}

function shortIssue(review: StoryReview) {
  const base = (review.title?.trim() || review.body.trim()).split(/\s+/);
  return base.slice(0, 12).join(" ") + (base.length > 12 ? "…" : "");
}

function buildStory(review: StoryReview) {
  const severity = severityForRating(review.rating);
  const date = new Date(review.createdAt).toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const title = `[${review.store}] ${review.category}: ${shortIssue(review)}`;
  const problem = review.title ? `${review.title} — ${review.body}` : review.body;
  const userStory = `As a Zig rider, I want ${review.category} to work reliably so that I don't run into this issue.`;
  const acceptance = [
    `Riders using ${review.category} on ${review.store} no longer experience: "${shortIssue(review)}".`,
    `The fix is verified on app version v${review.appVersion ?? "current"} and the affected flow.`,
    `No new reviews report this issue after release; ${review.category} sentiment trends up.`,
  ];
  const evidence = [
    `Source: ${review.store} review${review.author ? ` by ${review.author}` : ""}`,
    `Rating: ${review.rating}/5`,
    `App version: v${review.appVersion ?? "n/a"}`,
    `Date: ${date}`,
    `Severity: ${severity}`,
  ];

  const plainText = [
    title,
    "",
    "Problem",
    problem,
    "",
    "User story",
    userStory,
    "",
    "Acceptance criteria",
    ...acceptance.map((a) => `- ${a}`),
    "",
    "Evidence",
    ...evidence.map((e) => `- ${e}`),
  ].join("\n");

  return { title, problem, userStory, acceptance, evidence, severity, plainText };
}

function severityBadge(severity: string) {
  if (severity === "High") return "bg-danger/10 text-danger";
  if (severity === "Medium") return "bg-warn/10 text-warn";
  return "bg-elevated text-muted";
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-1.5 text-[13px] leading-6 text-foreground/90">{children}</div>
    </div>
  );
}

export function StoryModal({
  review,
  onClose,
}: {
  review: StoryReview;
  onClose: () => void;
}) {
  const story = buildStory(review);
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(story.plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — ignore
    }
  }

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
              <ClipboardList size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">PM story</h2>
              <p className="text-xs text-muted">Copy-paste ready, drafted from this review</p>
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

        <div className="mt-4 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {story.title}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
              severityBadge(story.severity)
            )}
          >
            {story.severity} severity
          </span>
        </div>

        <div className="mt-4 space-y-4 rounded-xl border border-border bg-surface p-4">
          <Section label="Problem">{story.problem}</Section>
          <Section label="User story">{story.userStory}</Section>
          <Section label="Acceptance criteria">
            <ul className="space-y-1.5">
              {story.acceptance.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section label="Evidence">
            <ul className="space-y-1">
              {story.evidence.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <button
          type="button"
          onClick={copyAll}
          className={cn(
            "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
            copied
              ? "bg-success/10 text-success"
              : "bg-foreground text-background hover:opacity-90"
          )}
        >
          {copied ? <Check size={16} /> : <Copy size={15} />}
          {copied ? "Copied to clipboard" : "Copy story"}
        </button>
      </motion.div>
    </div>
  );
}
