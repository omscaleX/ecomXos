"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  CheckSquare,
  FileText,
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/AppStateProvider";
import { getNavItems, type SectionKey } from "@/lib/permissions";
import { dataSources } from "@/data/sources";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ICONS: Record<SectionKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  brands: Briefcase,
  performance: BarChart3,
  sales: ShoppingBag,
  targets: Target,
  tasks: CheckSquare,
  team: Users,
  reports: FileText,
  ai: Sparkles,
};

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const items = getNavItems(user);

  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 px-3">
      {items.map((item) => {
        const Icon = ICONS[item.key];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
              item.key === "ai" && "mt-2",
            )}
          >
            <Icon className={cn("size-4", item.key === "ai" && !active && "text-violet-600")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <div className="flex h-16 items-center gap-2.5 px-5">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <span className="text-sm font-bold">A</span>
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">Agency OS</span>
        <span className="block text-[11px] text-muted-foreground">Marketing operations</span>
      </span>
    </div>
  );
}

export function SidebarFooter() {
  return (
    <div className="mt-auto border-t px-5 py-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sources</span>
        <Badge variant="neutral" className="text-[10px]">Demo Data</Badge>
      </div>
      <ul className="space-y-1.5">
        {dataSources.map((s) => (
          <li key={s.id} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{s.name}</span>
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              Connected
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground">Last synced: {dataSources[0].lastSynced}</p>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <SidebarBrand />
      <SidebarNav />
      <SidebarFooter />
    </aside>
  );
}
