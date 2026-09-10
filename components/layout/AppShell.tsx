"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AIDrawer } from "@/components/ai/AIDrawer";
import { useCurrentUser } from "@/components/providers/AppStateProvider";
import { canAccessSection, getSectionForPath } from "@/lib/permissions";
import { EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Application frame: sidebar, top bar, AI drawer and a UI-level route guard.
 * The guard hides sections the current role should not see. It is a demo
 * convenience only – production access control lives in the backend.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const section = getSectionForPath(pathname);
  const allowed = !section || canAccessSection(user, section);

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
                title="This section isn't available for your role"
                description={`${user.name} (${user.roleLabel}) doesn't have access to this area. Switch user from the top-right to view it as a manager.`}
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                }
              />
            )}
          </div>
        </main>
      </div>
      <AIDrawer />
    </div>
  );
}
