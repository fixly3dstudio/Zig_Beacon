"use client";

import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, type LucideIcon } from "lucide-react";
import { navGroups, settingsItem, isItemActive } from "./nav-config";
import { useMobileNavOpen, closeMobileNav } from "./mobile-nav-store";

interface NavLinkProps {
  item: { href: string; name: string; icon: LucideIcon };
  active: boolean;
  collapsed: boolean;
}

function NavLink({ item, active, collapsed }: NavLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.name : undefined}
      onClick={closeMobileNav}
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
  );
}

const STORAGE_KEY = "zig-beacon-sidebar-collapsed";
const COLLAPSE_EVENT = "zig-beacon-sidebar-toggle";

function subscribeToCollapse(callback: () => void) {
  window.addEventListener(COLLAPSE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function readCollapsed() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function Sidebar() {
  const pathname = usePathname();
  // Server snapshot is always "expanded"; localStorage is read once the client
  // hydrates, without a setState-in-effect cascade.
  const collapsed = useSyncExternalStore(subscribeToCollapse, readCollapsed, () => false);
  const mobileOpen = useMobileNavOpen();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    closeMobileNav();
  }, [pathname]);

  const toggle = () => {
    localStorage.setItem(STORAGE_KEY, String(!collapsed));
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={closeMobileNav}
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-background shrink-0 transition-transform duration-200 ease-out max-lg:!w-64 lg:static lg:z-auto lg:translate-x-0 lg:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: collapsed ? 64 : 256 }}
      >
        {/* Brand header */}
        <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-white bg-background">
            <Image
              src="/zig-logo.png"
              alt="Zig"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
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
          {/* Mobile close button */}
          <button
            onClick={closeMobileNav}
            aria-label="Close navigation"
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground lg:hidden"
          >
            <X size={17} />
          </button>
        </div>

        {/* Collapse button (desktop only) */}
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-16 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted hover:text-foreground hover:bg-surface transition-colors lg:flex"
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
                return (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (gi * 3 + ii) * 0.03, duration: 0.2 }}
                  >
                    <NavLink item={item} active={active} collapsed={collapsed} />
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

        {/* Bottom */}
        <div className="mt-auto border-t border-border px-3 py-3">
          <NavLink
            item={settingsItem}
            active={isItemActive(settingsItem.href, pathname)}
            collapsed={collapsed}
          />
        </div>
      </aside>
    </>
  );
}
