"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { getPageTitle } from "./nav-config";
import { openMobileNav } from "./mobile-nav-store";
import { ThemeToggle } from "./theme-toggle";

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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={openMobileNav}
          aria-label="Open navigation"
          className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-foreground transition-colors hover:bg-surface lg:hidden"
        >
          <Menu size={18} />
        </button>
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span aria-hidden="true" className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
            <span aria-hidden="true" className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
          </span>
          <span className="text-xs text-muted">Live</span>
        </div>
        <span suppressHydrationWarning className="hidden text-[13px] text-muted sm:inline">
          {today}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
