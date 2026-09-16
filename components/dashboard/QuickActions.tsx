"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, CheckSquare, Clapperboard, FileText, MessageSquare, Plus, Sparkles, Target } from "lucide-react";
import type { BrandId } from "@/types";
import { useAIDrawer } from "@/components/providers/AIDrawerProvider";
import { useCurrentUser } from "@/components/providers/AppStateProvider";
import { isManager } from "@/lib/permissions";
import { TaskModal } from "@/components/tasks/TaskModal";
import { EditTargetModal } from "@/components/targets/EditTargetModal";
import { Button } from "@/components/ui/button";
import { RaiseContentTaskButton } from "@/components/content/RaiseContentTaskModal";

/** Dashboard quick actions. Every button works. */
export function QuickActions({ brandId }: { brandId?: BrandId }) {
  const user = useCurrentUser();
  const manager = isManager(user);
  const { openDrawer } = useAIDrawer();
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [targetOpen, setTargetOpen] = React.useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/tasks"><CheckSquare /> View Tasks</Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/performance"><BarChart3 /> View Performance</Link>
      </Button>
      <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)}>
        <Plus /> Add Task
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/content"><Clapperboard /> Content Desk</Link>
      </Button>
      <RaiseContentTaskButton
        variant="outline"
        context={{ brandId, sourceLabel: "Dashboard", sourcePath: "/dashboard" }}
      />
      <Button variant="outline" size="sm" asChild>
        <Link href="/chat"><MessageSquare /> Chat & Huddle</Link>
      </Button>
      {manager && (
        <Button variant="outline" size="sm" onClick={() => setTargetOpen(true)}>
          <Target /> Edit Target
        </Button>
      )}
      {manager && (
        <Button variant="outline" size="sm" asChild>
          <Link href="/reports"><FileText /> Generate Report</Link>
        </Button>
      )}
      <Button size="sm" onClick={() => openDrawer({ brandId })}>
        <Sparkles /> Ask Agency AI
      </Button>
      <TaskModal open={taskOpen} onOpenChange={setTaskOpen} defaults={brandId ? { brandId } : undefined} />
      {manager && <EditTargetModal open={targetOpen} onOpenChange={setTargetOpen} brandId={brandId} />}
    </div>
  );
}
