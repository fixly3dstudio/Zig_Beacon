"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  ScanEye,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";

const ANALYSIS_TYPES = [
  { id: "Beacon Score review", description: "Score an uploaded feature flow against Beacon Score factors" },
  { id: "Explain this flow", description: "Guided walkthrough of what the screens do and why" },
  { id: "Zig deep-dive", description: "Learn how a Zig feature works and where it can go next" },
  { id: "Competitor teardown", description: "Break down a rival app and what Zig can learn" },
  { id: "Pattern lessons", description: "UI/UX patterns on screen and when to use them" },
];

type UploadedImage = {
  id: string;
  file: File;
  preview: string;
  name: string;
};

type AnalysisState = "idle" | "loading" | "streaming" | "done" | "error";

export function VisualAnalyzer() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [analysisType, setAnalysisType] = useState("Beacon Score review");
  const [context, setContext] = useState("");
  const [state, setState] = useState<AnalysisState>("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 8);
    const newImages: UploadedImage[] = valid.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 8));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const analyse = async () => {
    if (images.length === 0) return;
    setState("loading");
    setResult("");
    setError("");

    const fd = new FormData();
    images.forEach((img) => fd.append("images", img.file));
    fd.append("analysisType", analysisType);
    fd.append("context", context);

    try {
      const res = await fetch("/api/visual-review", { method: "POST", body: fd });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({ error: "Unknown error" }))) as {
          error?: string;
        };
        setError(data.error ?? `Request failed (${res.status})`);
        setState("error");
        return;
      }

      setState("streaming");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value, { stream: true }));
        resultRef.current?.scrollTo({ top: resultRef.current.scrollHeight, behavior: "smooth" });
      }

      setState("done");
    } catch {
      setError("Network error — is the dev server running?");
      setState("error");
    }
  };

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setResult("");
    setError("");
    setState("idle");
    setContext("");
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
      {/* Left: Upload + Config */}
      <div className="space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-colors",
            isDragOver
              ? "border-brand bg-brand/10"
              : "border-border bg-surface hover:border-brand/40 hover:bg-brand/5"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
            isDragOver ? "bg-brand/10" : "bg-elevated"
          )}>
            <Upload size={22} className={isDragOver ? "text-brand" : "text-muted"} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drop screenshots here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted">
              PNG, JPG, WebP · up to 8 images · flows, features, competitor apps
            </p>
          </div>
          {images.length > 0 && (
            <div className="absolute right-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
              {images.length} / 8
            </div>
          )}
        </div>

        {/* Image thumbnails */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-2">
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.preview}
                      alt={img.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={12} className="text-background" />
                    </button>
                  </motion.div>
                ))}
                {images.length < 8 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border bg-surface text-muted transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    <ImagePlus size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis type */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            Training mode
          </p>
          <div className="flex flex-wrap gap-2">
            {ANALYSIS_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setAnalysisType(type.id)}
                title={type.description}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  analysisType === type.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted hover:text-foreground"
                )}
              >
                {type.id}
              </button>
            ))}
          </div>
        </div>

        {/* Context input */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
            Context (optional)
          </p>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={`e.g. "These are Grab's airport pickup screens — I want to understand how their terminal selection works"`}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => void analyse()}
            disabled={images.length === 0 || state === "loading" || state === "streaming"}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === "loading" || state === "streaming" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {state === "loading" ? "Sending to AI…" : "Analysing…"}
              </>
            ) : (
              <>
                <ScanEye size={16} />
                Start training session
              </>
            )}
          </button>
          {(state !== "idle" || images.length > 0) && (
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <Trash2 size={15} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Right: Results */}
      <div className="flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Beacon analysis
          </p>
          {state === "done" && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-success">
              <CheckCircle2 size={13} />
              Complete
            </div>
          )}
          {(state === "loading" || state === "streaming") && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-brand">
              <Loader2 size={13} className="animate-spin" />
              {state === "streaming" ? "Streaming…" : "Processing…"}
            </div>
          )}
        </div>

        <div
          ref={resultRef}
          className={cn(
            "flex-1 overflow-y-auto rounded-2xl border border-border bg-surface p-6 transition-colors",
            state === "idle" && "flex flex-col items-center justify-center text-center",
            "min-h-[480px] xl:min-h-0"
          )}
        >
          {state === "idle" && (
            <div className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated">
                <Sparkles size={24} className="text-muted" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Upload a feature flow to score it
              </p>
              <p className="mx-auto max-w-xs text-xs leading-5 text-muted">
                Drop screens from Zig or a competitor. The AI will explain the flow
                and estimate how the feature should affect Beacon Score.
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
              <div>
                <p className="font-medium text-danger">Analysis failed</p>
                <p className="mt-1 leading-5 text-danger">{error}</p>
                <p className="mt-3 text-xs text-danger">
                  Make sure Ollama is running: <code className="font-mono">ollama serve</code> and the
                  vision model is pulled: <code className="font-mono">ollama pull qwen2.5vl:3b</code>
                </p>
              </div>
            </div>
          )}

          {(state === "streaming" || state === "done") && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Markdown content={result} />
              {state === "streaming" && (
                <span className="inline-block h-4 w-0.5 animate-pulse bg-brand align-middle" />
              )}
            </motion.div>
          )}

          {state === "loading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
                  <ScanEye size={22} className="text-brand" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Studying the screens
                </p>
                <p className="mt-1 text-xs text-muted">
                  This may take 15–60 seconds depending on image count
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
