"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { navGroups, settingsItem, isItemActive } from "./nav-config";

const STORAGE_KEY = "zig-beacon-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <aside
      className="relative flex h-full flex-col border-r border-border bg-background shrink-0 transition-[width] duration-200 ease-out"
      style={{ width: collapsed ? 64 : 256 }}
    >
      {/* Brand header */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground">
          <span className="h-2 w-2 rounded-full bg-background" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-sm font-normal tracking-tight whitespace-nowrap">
              Zig <span className="font-semibold">Beacon</span>
            </span>
            <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
              Internal
            </span>
          </div>
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={toggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted hover:text-foreground hover:bg-surface transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`} className={gi > 0 ? "mt-6" : ""}>
            {group.label && !collapsed && (
              <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
                {group.label}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item, ii) => {
                const active = isItemActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <motion.li
                    key={item.href}
                    initial={mounted ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (gi * 3 + ii) * 0.03, duration: 0.2 }}
                  >
                    <Link
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        collapsed ? "justify-center" : ""
                      } ${
                        active
                          ? "text-background"
                          : "text-muted hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="active-nav"
                          className="absolute inset-0 rounded-lg bg-foreground"
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      )}
                      <Icon size={18} className="relative z-10 shrink-0" />
                      {!collapsed && (
                        <span className="relative z-10 whitespace-nowrap">{item.name}</span>
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="mt-auto border-t border-border px-3 py-3">
        {(() => {
          const active = isItemActive(settingsItem.href, pathname);
          const Icon = settingsItem.icon;
          return (
            <Link
              href={settingsItem.href}
              title={collapsed ? settingsItem.name : undefined}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "text-background"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-lg bg-foreground"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Icon size={18} className="relative z-10 shrink-0" />
              {!collapsed && <span className="relative z-10">{settingsItem.name}</span>}
            </Link>
          );
        })()}

        <div
          className={`mt-2 flex items-center gap-3 rounded-lg px-3 py-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-[11px] font-semibold text-foreground">
            HS
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden leading-tight">
              <span className="text-sm font-medium text-foreground truncate">Harsai</span>
              <span className="text-[11px] text-muted truncate">Product Design</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
