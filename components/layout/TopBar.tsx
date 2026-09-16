"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { UserSwitcher } from "@/components/layout/UserSwitcher";
import { SyncStatus } from "@/components/layout/SyncStatus";
import { SidebarBrand, SidebarFooter, SidebarNav } from "@/components/layout/Sidebar";
import { useAIDrawer } from "@/components/providers/AIDrawerProvider";
import { useAppState, useContent } from "@/components/providers/AppStateProvider";
import { canAccessSection, getNavItems, getSectionForPath } from "@/lib/permissions";
import { canRaiseRequest } from "@/lib/content";
import { RaiseContentTaskButton } from "@/components/content/RaiseContentTaskModal";
import { isBrandId } from "@/data/brands";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const { currentUser: user } = useAppState();
  const { openDrawer } = useAIDrawer();
  const section = getSectionForPath(pathname);
  const title = getNavItems(user).find((n) => n.key === section)?.label ?? "Agency OS";
  // On a brand page the top-bar buttons carry the brand as context.
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
        <NotificationBell />
        {canRaiseRequest(user) && (
          <RaiseContentTaskButton
            variant="outline"
            className="[&>span]:hidden sm:[&>span]:inline"
            context={{
              brandId: contextBrandId,
              sourceLabel: contextBrandId ? "Brand page" : title,
              sourcePath: pathname,
            }}
          />
        )}
        {canAccessSection(user, "ai") && (
          <Button variant="outline" size="sm" onClick={() => openDrawer({ brandId: contextBrandId })} className="hidden gap-1.5 sm:inline-flex">
            <Sparkles className="text-violet-600" />
            <span className="hidden sm:inline">Ask Agency AI</span>
          </Button>
        )}
        <UserSwitcher />
      </div>
    </header>
  );
}

/** What has happened on your content requests since you last looked. */
function NotificationBell() {
  const { currentUser: user } = useAppState();
  const { notifications, markNotificationsRead } = useContent();
  const mine = notifications.filter((n) => n.recipientIds.includes(user.id));
  const unread = mine.filter((n) => !n.read).length;

  return (
    <DropdownMenu onOpenChange={(open) => { if (open && unread) markNotificationsRead(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `${unread} new updates` : "Updates"}>
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Updates</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mine.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">Nothing new.</p>
        ) : (
          mine.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link href={`/content/${n.requestId}`} className="flex flex-col items-start gap-0.5">
                <span className="text-sm">{n.message}</span>
                <span className="text-[11px] text-muted-foreground">{n.createdAt} {n.createdTime}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
