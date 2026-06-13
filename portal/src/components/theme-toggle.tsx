"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "zig-beacon-theme";
const EVENT = "zig-beacon-theme-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

export function toggleTheme() {
  const next = !isDark();
  document.documentElement.classList.toggle("dark", next);
  try {
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  } catch {
    // ignore storage failures
  }
  window.dispatchEvent(new Event(EVENT));
}

export function ThemeToggle() {
  // Server + first client paint render the light icon; corrected on hydration.
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

/** Inline, blocking script that sets the theme class before first paint. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
