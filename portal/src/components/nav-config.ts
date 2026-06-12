import {
  LayoutDashboard,
  Swords,
  Globe2,
  Lightbulb,
  MessageSquareText,
  Flame,
  HeartPulse,
  Gauge,
  Target,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string | null;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  { label: null, items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }] },
  {
    label: "Intelligence",
    items: [
      { name: "Competitors", href: "/competitors", icon: Swords },
      { name: "Global Mobility", href: "/global-mobility", icon: Globe2 },
      { name: "Innovation Watch", href: "/innovation-watch", icon: Lightbulb },
    ],
  },
  {
    label: "Customers",
    items: [
      { name: "Customer Signals", href: "/signals", icon: MessageSquareText },
      { name: "Complaint Heatmap", href: "/complaint-heatmap", icon: Flame },
    ],
  },
  {
    label: "Product",
    items: [
      { name: "Product Health", href: "/product-health", icon: HeartPulse },
      { name: "Beacon Score", href: "/beacon-score", icon: Gauge },
      { name: "Opportunity Hub", href: "/opportunities", icon: Target },
    ],
  },
  { label: "AI", items: [{ name: "AI Coach", href: "/coach", icon: Sparkles }] },
];

export const settingsItem: NavItem = { name: "Settings", href: "/settings", icon: Settings };

const allItems: NavItem[] = [
  ...navGroups.flatMap((g) => g.items),
  settingsItem,
];

export function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const match = allItems
    .filter((i) => i.href !== "/")
    .find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  return match?.name ?? "Zig Beacon";
}

export function isItemActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
