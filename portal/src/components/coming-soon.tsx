import { type LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  icon: Icon,
}: {
  title: string;
  icon: LucideIcon;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">This module ships in Phase 2.</p>

      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-8 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background text-muted">
          <Icon aria-hidden="true" size={22} />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-[13px] text-muted">Coming soon</p>
      </div>
    </div>
  );
}
