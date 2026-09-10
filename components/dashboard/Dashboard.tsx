"use client";

import { useCurrentUser } from "@/components/providers/AppStateProvider";
import { useDemoLoading, MetricCardSkeleton, TableSkeleton } from "@/components/shared/States";
import { SeniorManagerDashboard } from "@/components/dashboard/SeniorManagerDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { TeamMemberDashboard } from "@/components/dashboard/TeamMemberDashboard";
import { MetricGrid } from "@/components/dashboard/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <MetricGrid>
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </MetricGrid>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><TableSkeleton rows={6} columns={6} /></Card>
        <Card><TableSkeleton rows={4} columns={2} /></Card>
      </div>
    </div>
  );
}

/** Routes to the role-specific dashboard; shows a brief skeleton on user switch. */
export function Dashboard() {
  const user = useCurrentUser();
  const loading = useDemoLoading(user.id);
  if (loading) return <DashboardSkeleton />;
  if (user.role === "senior_manager") return <SeniorManagerDashboard />;
  if (user.role === "manager") return <ManagerDashboard />;
  return <TeamMemberDashboard />;
}
