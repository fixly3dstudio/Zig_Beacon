import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-medium uppercase tracking-wider text-muted",
        className
      )}
    >
      {children}
    </p>
  );
}
