"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import type { ContentDepartment } from "@/types";
import type { ContentRequest, ContentRequestStatus } from "@/types/content";
import { useAppState, useContent } from "@/components/providers/AppStateProvider";
import { brandsById } from "@/data/brands";
import { isContentManager, isContentTeam } from "@/lib/permissions";
import {
  DEPARTMENTS,
  DEPARTMENT_LABEL,
  OPEN_STATUSES,
  STATUS_LABEL_NEUTRAL,
  getMyActions,
  getVisibleRequests,
  isOverdue,
  sortForQueue,
} from "@/lib/content";
import { buildContentOverview } from "@/lib/contentStats";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CountCard, RequestRow } from "@/components/content/ContentBits";
import { RaiseContentTaskButton } from "@/components/content/RaiseContentTaskModal";
import { canRaiseRequest } from "@/lib/content";

/**
 * The Content Desk.
 *
 * One page that reads differently depending on who you are:
 * - Marketing: what you asked for, and what is waiting for your review.
 * - Content manager: all three queues and what needs handing out.
 * - Script / video / design: your own jobs and your team's open queue.
 *
 * This is separate from the marketing task board and never changes it.
 */
export function ContentDesk() {
  const { currentUser: user, today } = useAppState();
  const { contentRequests } = useContent();

  const mine = React.useMemo(() => getVisibleRequests(user, contentRequests), [user, contentRequests]);
  const actions = React.useMemo(() => getMyActions(user, mine), [user, mine]);
  const overview = React.useMemo(() => buildContentOverview(mine, today), [mine, today]);

  const [status, setStatus] = React.useState<ContentRequestStatus | "all" | "open">("open");
  const [brandFilter, setBrandFilter] = React.useState<string>("all");

  const filtered = React.useMemo(() => {
    let rows = mine;
    if (status === "open") rows = rows.filter((r) => OPEN_STATUSES.includes(r.status));
    else if (status !== "all") rows = rows.filter((r) => r.status === status);
    if (brandFilter !== "all") rows = rows.filter((r) => r.brandId === brandFilter);
    return sortForQueue(rows, today);
  }, [mine, status, brandFilter, today]);

  const brandOptions = React.useMemo(
    () => [...new Set(mine.map((r) => r.brandId))].map((id) => brandsById[id]),
    [mine],
  );

  const showQueues = isContentManager(user) || !isContentTeam(user);

  const subtitle = isContentTeam(user)
    ? "Work that has come to you, and what your team has open."
    : "Content you have asked for, and anything waiting on you.";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isContentTeam(user) ? "My Work" : "Content Desk"}
        subtitle={subtitle}
        actions={canRaiseRequest(user) ? <RaiseContentTaskButton context={{ sourceLabel: "Content Desk", sourcePath: "/content" }} /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <CountCard label="Open" value={overview.open} hint="Not finished yet" />
        <CountCard label="Waiting for a person" value={overview.waitingForPerson} tone={overview.waitingForPerson ? "warning" : "default"} />
        <CountCard label="Being worked on" value={overview.beingWorkedOn} />
        <CountCard label="Waiting for review" value={overview.waitingForReview} tone={overview.waitingForReview ? "warning" : "default"} />
        <CountCard label="Late" value={overview.overdue} tone={overview.overdue ? "danger" : "success"} hint={overview.overdue ? "Past the date asked for" : "Nothing is late"} />
      </div>

      {actions.length > 0 && (
        <section className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Needs you</h3>
              <p className="text-xs text-muted-foreground">
                {actions.length === 1 ? "One thing is waiting on you." : `${actions.length} things are waiting on you.`}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {sortForQueue(actions, today).slice(0, 5).map((r) => (
              <RequestRow key={r.id} request={r} today={today} />
            ))}
          </div>
        </section>
      )}

      {showQueues ? (
        <QueueTabs requests={mine} today={today} />
      ) : (
        <MyQueue requests={mine} today={today} department={user.department} />
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold">Everything ({filtered.length})</h3>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as ContentRequestStatus | "all" | "open")}>
              <SelectTrigger className="w-48" aria-label="Filter by status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open only</SelectItem>
                <SelectItem value="all">Everything</SelectItem>
                {OPEN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL_NEUTRAL[s]}</SelectItem>
                ))}
                <SelectItem value="completed">Done</SelectItem>
              </SelectContent>
            </Select>
            {brandOptions.length > 1 && (
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-44" aria-label="Filter by brand"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  {brandOptions.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        {filtered.length ? (
          <div className="space-y-2">
            {filtered.map((r) => (
              <RequestRow key={r.id} request={r} today={today} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="Nothing here"
            description="No content requests match what you picked."
            action={
              <Button variant="outline" size="sm" onClick={() => { setStatus("all"); setBrandFilter("all"); }}>
                Show everything
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

/** All three department queues, side by side. */
function QueueTabs({ requests, today }: { requests: ContentRequest[]; today: string }) {
  const [tab, setTab] = React.useState<ContentDepartment>("script");
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">The three queues</h3>
      <Tabs value={tab} onValueChange={(v) => setTab(v as ContentDepartment)}>
        <TabsList>
          {DEPARTMENTS.map((d) => {
            const open = requests.filter((r) => r.department === d && r.status !== "completed");
            return (
              <TabsTrigger key={d} value={d}>
                {DEPARTMENT_LABEL[d]} ({open.length})
              </TabsTrigger>
            );
          })}
        </TabsList>
        {DEPARTMENTS.map((d) => (
          <TabsContent key={d} value={d} className="space-y-2 pt-3">
            {tab === d && <QueueList requests={requests.filter((r) => r.department === d)} today={today} />}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function MyQueue({ requests, today, department }: { requests: ContentRequest[]; today: string; department?: ContentDepartment }) {
  if (!department) return null;
  const open = requests.filter((r) => r.department === department && r.status !== "completed");
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{DEPARTMENT_LABEL[department]} queue</h3>
        <p className="text-xs text-muted-foreground">Your jobs, plus anything in your team nobody has picked up.</p>
      </div>
      <QueueList requests={open} today={today} />
    </section>
  );
}

function QueueList({ requests, today }: { requests: ContentRequest[]; today: string }) {
  const open = sortForQueue(requests.filter((r) => r.status !== "completed"), today);
  const late = open.filter((r) => isOverdue(r, today)).length;
  if (!open.length) {
    return (
      <EmptyState icon={Inbox} title="Queue is clear" description="Nothing open here right now." />
    );
  }
  return (
    <div className="space-y-2">
      {late > 0 && (
        <p className="text-xs font-medium text-red-600">
          {late === 1 ? "1 job is late." : `${late} jobs are late.`}
        </p>
      )}
      {open.map((r) => (
        <RequestRow key={r.id} request={r} today={today} />
      ))}
      <p className="pt-1 text-xs text-muted-foreground">
        Finished work stays on the brand page. <Link href="/brands" className="underline">Open Brands</Link>
      </p>
    </div>
  );
}
