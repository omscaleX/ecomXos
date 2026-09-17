"use client";

import * as React from "react";
import type { ContentDepartment } from "@/types";
import { brands } from "@/data/brands";
import { contentProducers, getContentManager } from "@/data/users";
import { useAppState, useContent } from "@/components/providers/AppStateProvider";
import { DEPARTMENTS, DEPARTMENT_LABEL, getVisibleRequests } from "@/lib/content";
import { isContentManager } from "@/lib/permissions";
import {
  buildDepartmentStats,
  buildBrandContentStats,
  buildContentOverview,
  buildPersonLoad,
  filterByRange,
} from "@/lib/contentStats";
import { PageHeader } from "@/components/layout/PageHeader";
import { PeriodControls, usePeriod } from "@/components/shared/PeriodPicker";
import { DonutChart, SLICE_COLORS } from "@/components/charts/DonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { BrandMark } from "@/components/shared/BrandMark";
import { Badge } from "@/components/ui/badge";
import { CountCard } from "@/components/content/ContentBits";

/**
 * Content reports.
 *
 * Counts of work only — how much was asked for, how much is done, how long
 * it takes and how often it needs a second try. No money figures appear
 * here, so nothing can be confused with ROAS or sales.
 */
export function ContentAnalytics() {
  const { currentUser: user, today } = useAppState();
  const { contentRequests } = useContent();
  const period = usePeriod("30d");

  // A house manager reports on their own house. Marketing sees all three.
  const houses = React.useMemo(
    () => (isContentManager(user) && user.department ? [user.department] : DEPARTMENTS),
    [user],
  );
  const visible = React.useMemo(() => getVisibleRequests(user, contentRequests), [user, contentRequests]);
  const rows = React.useMemo(() => filterByRange(visible, period.range), [visible, period.range]);
  const overview = React.useMemo(() => buildContentOverview(rows, today), [rows, today]);
  const stats = React.useMemo(() => houses.map((d) => buildDepartmentStats(rows, d, today)), [rows, houses, today]);
  const producers = React.useMemo(
    () => contentProducers.filter((u) => u.department && houses.includes(u.department)),
    [houses],
  );

  const mix = stats
    .map((s, i) => ({ name: DEPARTMENT_LABEL[s.department], value: s.requested, color: SLICE_COLORS[i] }))
    .filter((s) => s.value > 0);
  const state = [
    { name: "Done", value: overview.done, color: "#1baf7a" },
    { name: "Being worked on", value: overview.beingWorkedOn, color: "#2a78d6" },
    { name: "Waiting for review", value: overview.waitingForReview, color: "#eda100" },
    { name: "Waiting for a person", value: overview.waitingForPerson, color: "#eb6834" },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Reports"
        subtitle={
          houses.length === 1
            ? `How much ${DEPARTMENT_LABEL[houses[0]]} was asked for, how much is finished, and how long it takes.`
            : "How much content was asked for, how much is finished, and how long it takes."
        }
        actions={<PeriodControls period={period} onRangeChange={period.setRange} onGranularityChange={period.setGranularity} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CountCard label="Asked for" value={overview.total} hint="Requests raised in this period" />
        <CountCard label="Finished" value={overview.done} tone="success" />
        <CountCard label="Still open" value={overview.open} />
        <CountCard
          label="Finished on time"
          value={`${Math.round(overview.onTimeRate * 100)}%`}
          tone={overview.onTimeRate >= 0.8 ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {houses.length > 1 && (
          <Card className="min-w-0">
            <CardHeader><CardTitle className="text-sm">Which team gets the work</CardTitle></CardHeader>
            <CardContent>
              <DonutChart slices={mix} centerLabel="Requests" centerValue={String(overview.total)} />
            </CardContent>
          </Card>
        )}
        <Card className="min-w-0">
          <CardHeader><CardTitle className="text-sm">Where everything stands</CardTitle></CardHeader>
          <CardContent>
            <DonutChart slices={state} centerLabel="Requests" centerValue={String(overview.total)} />
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader><CardTitle className="text-sm">By team</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Asked for</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Finished</TableHead>
                <TableHead className="text-right">Late</TableHead>
                <TableHead className="text-right">Days to make</TableHead>
                <TableHead className="text-right">Days to review</TableHead>
                <TableHead className="text-right">Needed a redo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((s) => (
                <TableRow key={s.department}>
                  <TableCell className="font-medium">{DEPARTMENT_LABEL[s.department]}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <UserAvatar user={getContentManager(s.department)} size="sm" />
                      {getContentManager(s.department).name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.requested}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.deliverablesRequested}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.completed}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.overdue > 0 ? <Badge variant="danger">{s.overdue}</Badge> : "0"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.avgProductionDays || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.avgReviewDays || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(s.revisionRate * 100)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">
            &quot;Days to make&quot; is from the day someone got the job to the day they uploaded it.
            &quot;Days to review&quot; is from upload to the requester replying.
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader><CardTitle className="text-sm">Who is busy</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Open jobs</TableHead>
                <TableHead className="text-right">Items to make</TableHead>
                <TableHead className="text-right">Waiting on review</TableHead>
                <TableHead className="text-right">Late</TableHead>
                <TableHead className="text-right">Finished</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {producers
                .map((u) => {
                  const load = buildPersonLoad(rows, u.id, u.department as ContentDepartment, today);
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <UserAvatar user={u} size="sm" /> {u.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{DEPARTMENT_LABEL[load.department]}</TableCell>
                      <TableCell className="text-right tabular-nums">{load.open}</TableCell>
                      <TableCell className="text-right tabular-nums">{load.deliverablesOpen}</TableCell>
                      <TableCell className="text-right tabular-nums">{load.awaitingReview}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {load.overdue > 0 ? <Badge variant="danger">{load.overdue}</Badge> : "0"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{load.completed}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader><CardTitle className="text-sm">By brand</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Asked for</TableHead>
                {houses.map((d) => (
                  <TableHead key={d} className="text-right">{DEPARTMENT_LABEL[d]}</TableHead>
                ))}
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">Late</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((b) => {
                const s = buildBrandContentStats(rows, b.id, today);
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <BrandMark brand={b} size="sm" /> {b.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.total}</TableCell>
                    {houses.map((d) => (
                      <TableCell key={d} className="text-right tabular-nums">{s.byDepartment[d]}</TableCell>
                    ))}
                    <TableCell className="text-right tabular-nums">{s.open}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.overdue > 0 ? <Badge variant="danger">{s.overdue}</Badge> : "0"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
