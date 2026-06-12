"use client";

import { usePathname } from "next/navigation";
import { getPageTitle } from "./nav-config";

function formatToday(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

export function Topbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  // Rendered on both server and client; suppressHydrationWarning on the span
  // covers any timezone difference between the two.
  const today = formatToday();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-8">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span aria-hidden="true" className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
            <span aria-hidden="true" className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
          </span>
          <span className="text-xs text-muted">Live</span>
        </div>
        <span suppressHydrationWarning className="text-[13px] text-muted">{today}</span>
      </div>
    </header>
  );
}
