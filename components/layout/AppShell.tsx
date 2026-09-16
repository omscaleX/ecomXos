"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AIDrawer } from "@/components/ai/AIDrawer";
import { HuddleBar } from "@/components/chat/HuddleBar";
import { useAppState } from "@/components/providers/AppStateProvider";
import { canAccessSection, getHomePath, getSectionForPath } from "@/lib/permissions";
import { EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Application frame: sidebar, top bar, AI drawer and a UI-level route guard.
 * The guard hides sections the current role should not see. It is a demo
 * convenience only – production access control lives in the backend.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser: user, session } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const section = getSectionForPath(pathname);
  const allowed = !section || canAccessSection(user, section);
  const isLoginPage = pathname === "/login";

  // Demo session guard: signed-out visitors go to the login screen,
  // signed-in visitors on /login go to the dashboard.
  React.useEffect(() => {
    if (session === "out" && !isLoginPage) router.replace("/login");
    if (session === "in" && isLoginPage) router.replace(getHomePath(user));
    // The content team never lands on the marketing dashboard.
    if (session === "in" && pathname === "/dashboard" && !allowed) router.replace(getHomePath(user));
  }, [session, isLoginPage, router, user, pathname, allowed]);

  if (isLoginPage) return <>{children}</>;
  if (session !== "in") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground" aria-busy="true">
        Loading Agency OS…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {allowed ? (
              children
            ) : (
              <EmptyState
                icon={Lock}
                title="This part is not for your role"
                description={`${user.name} (${user.roleLabel}) cannot open this area. Switch person from the top right to see it as someone else.`}
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href={getHomePath(user)}>Go back</Link>
                  </Button>
                }
              />
            )}
          </div>
        </main>
      </div>
      <AIDrawer />
      <HuddleBar />
    </div>
  );
}
