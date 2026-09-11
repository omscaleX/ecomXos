"use client";

import * as React from "react";
import Link from "next/link";
import { useAppState } from "@/components/providers/AppStateProvider";
import { brandIds } from "@/data/brands";
import { getBrandSummaries } from "@/lib/analytics";
import { generateAgencySummary } from "@/lib/agency";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortfolioMetrics } from "@/components/dashboard/PortfolioMetrics";
import { BrandCard } from "@/components/brands/BrandCard";
import { PriorityList } from "@/components/dashboard/PriorityList";
import { TeamWorkloadCards } from "@/components/dashboard/TeamWorkload";
import { TaskSummary } from "@/components/dashboard/TaskSummary";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TargetTable } from "@/components/targets/TargetTable";
import { EditTargetModal } from "@/components/targets/EditTargetModal";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { TargetOverview } from "@/components/charts/TargetRing";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BrandId } from "@/types";

const TEAM: Array<"om" | "anubhav" | "sagar"> = ["om", "anubhav", "sagar"];

/** Lucky – "What needs to be managed today?" */
export function ManagerDashboard() {
  const { currentUser, targets, tasks, today } = useAppState();
  const summaries = getBrandSummaries(brandIds, targets);
  const teamTasks = tasks.filter((t) => TEAM.includes(t.assigneeId as (typeof TEAM)[number]));
  const agency = generateAgencySummary(brandIds, targets, tasks, { today, teamUserIds: TEAM });
  const [editTarget, setEditTarget] = React.useState<BrandId | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good morning, ${currentUser.name}`}
        subtitle="Operational view · last 30 days · India in INR, Dubai in AED (never combined)"
        actions={<QuickActions />}
      />

      <PortfolioMetrics summaries={summaries} tasks={teamTasks} brandsLabel="My Brands" tasksLabel="Team Open Tasks" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Priorities</CardTitle>
            <CardDescription>Ranked by ROAS gap, target status, overdue and blocked tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <PriorityList items={agency.priorities.slice(0, 6)} />
          </CardContent>
        </Card>
        <AIInsightCard brandIds={brandIds} tasks={tasks} scopeLabel="All brands" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target vs Actual ROAS</CardTitle>
          <CardDescription>Each ring fills to Actual ÷ Target. The line under each brand says exactly how far it is from its target.</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" asChild><Link href="/targets">All targets</Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TargetOverview summaries={summaries} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Brands</h3>
            <p className="text-xs text-muted-foreground">Six brands managed by {currentUser.name}.</p>
          </div>
          <Button variant="ghost" size="sm" asChild><Link href="/brands">All brands</Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map((s) => (
            <BrandCard key={s.brand.id} summary={s} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Target Tracking</CardTitle>
            <CardDescription>ROAS target vs Actual ROAS (Shopify Net Sales ÷ total ad spend).</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild><Link href="/targets">All targets</Link></Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0 sm:px-4">
            <TargetTable summaries={summaries} onEdit={setEditTarget} showProgress={false} compact />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
            <CardDescription>Task volume only – not a performance score.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild><Link href="/team">Team</Link></Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <TeamWorkloadCards workloads={agency.workloads} columns={1} />
          </CardContent>
        </Card>
      </div>

      <TaskSummary tasks={tasks} title="Tasks" description="Whole team, including your own. Overdue and due-today first." />

      <EditTargetModal open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} brandId={editTarget ?? undefined} />
    </div>
  );
}
