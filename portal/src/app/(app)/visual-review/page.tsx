import { GraduationCap } from "lucide-react";
import { VisualAnalyzer } from "@/components/visual-review/analyzer";

export const metadata = { title: "Visual Trainer — Zig Beacon" };

export default function VisualReviewPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
          <GraduationCap size={14} />
          Learn from any screen
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Visual Trainer
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
          A training space for UI/UX designers. Upload feature flows or screens
          from Zig or competitors, and the AI explains the journey, scores the
          feature against Beacon Score factors, and highlights what should change
          before build.
        </p>
      </div>

      <VisualAnalyzer />
    </div>
  );
}
