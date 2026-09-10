"use client";

import { Sparkles } from "lucide-react";
import type { BrandId, Task } from "@/types";
import { useAppState } from "@/components/providers/AppStateProvider";
import { useAIDrawer } from "@/components/providers/AIDrawerProvider";
import { generateAgencySummary } from "@/lib/agency";
import { formatROAS, pluralize } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Dashboard AI summary card. Reads generateAgencySummary() for the given
 * brand and task scope so the text always matches the numbers on screen.
 */
export function AIInsightCard({
  brandIds,
  tasks,
  scopeLabel,
  brandId,
}: {
  brandIds: BrandId[];
  tasks: Task[];
  scopeLabel?: string;
  /** When set, the "Ask Agency AI" button opens the drawer with brand context. */
  brandId?: BrandId;
}) {
  const { targets, today } = useAppState();
  const { openDrawer } = useAIDrawer();
  const a = generateAgencySummary(brandIds, targets, tasks, { today });

  const lines: string[] = [];
  if (a.belowTarget.length) {
    lines.push(`${pluralize(a.belowTarget.length, "brand")} ${a.belowTarget.length === 1 ? "is" : "are"} below ${a.belowTarget.length === 1 ? "its" : "their"} ROAS target.`);
  } else {
    lines.push(`All ${a.totalBrands} brands are on track.`);
  }
  if (a.mainConcern) {
    lines.push(`${a.mainConcern.brand.name} is the biggest gap (${formatROAS(a.mainConcern.actualROAS)} vs ${formatROAS(a.mainConcern.targetROAS)}).`);
  }
  if (a.onTrack.length) {
    lines.push(`${a.onTrack.map((s) => s.brand.name).join(", ")} ${a.onTrack.length === 1 ? "is" : "are"} currently above target.`);
  }
  lines.push(
    a.overdueTasks
      ? `${pluralize(a.overdueTasks, "task")} ${a.overdueTasks === 1 ? "is" : "are"} overdue${a.blockedTasks ? ` and ${a.blockedTasks} blocked` : ""}.`
      : "No tasks are overdue.",
  );

  return (
    <Card className="border-violet-200 bg-violet-50/40">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-violet-100 text-violet-700" aria-hidden>
            <Sparkles className="size-4" />
          </span>
          <p className="text-sm font-semibold">Agency AI</p>
          {scopeLabel && <span className="text-xs text-muted-foreground">· {scopeLabel}</span>}
        </div>
        <div className="space-y-1 text-sm">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        <div>
          <Button size="sm" variant="outline" className="bg-card" onClick={() => openDrawer({ brandId })}>
            <Sparkles className="text-violet-600" /> Ask Agency AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
