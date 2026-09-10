"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { UserSwitcher } from "@/components/layout/UserSwitcher";
import { SyncStatus } from "@/components/layout/SyncStatus";
import { SidebarBrand, SidebarFooter, SidebarNav } from "@/components/layout/Sidebar";
import { useAIDrawer } from "@/components/providers/AIDrawerProvider";
import { useCurrentUser } from "@/components/providers/AppStateProvider";
import { getNavItems, getSectionForPath } from "@/lib/permissions";
import { isBrandId } from "@/data/brands";

export function TopBar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const user = useCurrentUser();
  const { openDrawer } = useAIDrawer();
  const section = getSectionForPath(pathname);
  const title = getNavItems(user).find((n) => n.key === section)?.label ?? "Agency OS";
  // On a brand page the top-bar AI button carries the brand as context.
  const brandSegment = pathname.startsWith("/brands/") ? pathname.split("/")[2] : undefined;
  const contextBrandId = brandSegment && isBrandId(brandSegment) ? brandSegment : undefined;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
          <Menu />
        </Button>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBrand />
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
          <SidebarFooter />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-base font-semibold">{title}</h1>
        <Badge variant="neutral" className="hidden sm:inline-flex">Demo Data</Badge>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <SyncStatus />
        <Button variant="outline" size="sm" onClick={() => openDrawer({ brandId: contextBrandId })} className="gap-1.5">
          <Sparkles className="text-violet-600" />
          <span className="hidden sm:inline">Ask Agency AI</span>
        </Button>
        <UserSwitcher />
      </div>
    </header>
  );
}
