"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ImageIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import type { VisualUploadItem } from "@/lib/visual-uploads";

function relativeTime(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function UploadEntry({ item }: { item: VisualUploadItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand">
          <Sparkles size={12} />
          {item.analysisType}
        </span>
        <span className="text-[11px] text-muted">
          {item.imageCount} image{item.imageCount === 1 ? "" : "s"}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-muted">
          {relativeTime(item.createdAt)}
        </span>
      </div>

      {item.images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {item.images.map((src) => (
            <a key={src} href={src} target="_blank" rel="noreferrer" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Uploaded screen"
                className="h-24 w-auto rounded-lg border border-border object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {item.context && (
        <p className="mt-3 text-xs leading-5 text-muted">
          <span className="font-medium text-foreground">Context:</span> {item.context}
        </p>
      )}

      {item.analysis.trim() && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            {open ? "Hide analysis" : "Show AI analysis"}
            <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 border-t border-border pt-3 text-foreground/90">
                  <Markdown content={item.analysis} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export function UploadsPanel({
  items,
  title = "From Visual Trainer",
}: {
  items: VisualUploadItem[];
  title?: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-brand" />
          <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
        </div>
        <Link
          href="/visual-review"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-brand"
        >
          Upload screens
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted">
        Screens you analyse in Visual Trainer are saved here with their AI breakdown.
      </p>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface p-6 text-center">
          <ImageIcon size={22} className="mx-auto text-muted" />
          <p className="mt-2 text-sm font-medium text-foreground">No uploads yet</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Open <Link href="/visual-review" className="font-medium text-brand">Visual Trainer</Link>,
            upload screens, and the analysis lands here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <UploadEntry key={item.id} item={item} />
          ))}
        </div>
      )}
    </Card>
  );
}
