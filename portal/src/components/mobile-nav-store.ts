"use client";

import { useSyncExternalStore } from "react";

// Tiny shared store so the Topbar hamburger and the Sidebar drawer agree on
// whether the mobile navigation is open, without prop-drilling through the
// server-rendered layout.
let open = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function openMobileNav() {
  open = true;
  emit();
}

export function closeMobileNav() {
  open = false;
  emit();
}

export function toggleMobileNav() {
  open = !open;
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useMobileNavOpen() {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false
  );
}
