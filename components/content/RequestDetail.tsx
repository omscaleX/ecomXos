"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, MessageSquare, RotateCcw, Send, UserPlus } from "lucide-react";
import type { ContentRequest } from "@/types/content";
import { ASSET_KIND_LABEL } from "@/types/content";
import type { UserId } from "@/types";
import { brandsById } from "@/data/brands";
import { clientsById } from "@/data/clients";
import { usersById, getDepartmentMembers } from "@/data/users";
import { campaignsById, productsById } from "@/data/products";
import { useAppState, useContent } from "@/components/providers/AppStateProvider";
import {
  DEPARTMENT_LABEL,
  canAssign,
  canComment,
  canPickUp,
  canReview,
  canSubmit,
  deliverableLabel,
  nextStepLine,
  requestSummaryLine,
} from "@/lib/content";
import { formatLongDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/shared/BrandMark";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { DepartmentBadge, DueLabel, RequestStatusBadge } from "@/components/content/ContentBits";
import { StartHuddleButton } from "@/components/chat/StartHuddleButton";

/**
 * One content request, start to finish.
 *
 * The whole history stays on this page: every version, every comment,
 * every decision. Versions are never deleted or replaced.
 */
export function RequestDetail({ requestId }: { requestId: string }) {
  const { currentUser: user, today } = useAppState();
  const { contentRequests, contentAssets } = useContent();
  const request = contentRequests.find((r) => r.id === requestId);

  if (!request) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">No request with the number {requestId}.</p>
        <Button asChild variant="outline" size="sm"><Link href="/content">Back to Content Desk</Link></Button>
      </div>
    );
  }

  const brand = brandsById[request.brandId];
  const client = clientsById[request.clientId];
  const requester = usersById[request.requesterId];
  const manager = usersById[request.departmentManagerId];
  const assignee = request.assigneeId ? usersById[request.assigneeId] : undefined;
  const campaign = request.campaignId ? campaignsById[request.campaignId] : undefined;
  const attachedIds = [...request.referenceAssetIds, ...request.rawAssetIds];
  const attached = contentAssets.filter((a) => attachedIds.includes(a.id));
  const produced = contentAssets.filter((a) => a.requestId === request.id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5">
        <Link href="/content"><ArrowLeft className="size-4" /> Content Desk</Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <BrandMark brand={brand} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-lg font-semibold">{request.id}</h2>
              <DepartmentBadge department={request.department} full />
              <RequestStatusBadge request={request} />
            </div>
            <p className="mt-1 text-sm font-medium">{requestSummaryLine(request)}</p>
            <p className="text-xs text-muted-foreground">
              {brand.name} · {client.name}
              {campaign ? ` · ${campaign.name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <DueLabel request={request} today={today} />
          <StartHuddleButton
            memberIds={[request.requesterId, request.assigneeId, request.departmentManagerId].filter(Boolean) as UserId[]}
            label={`Talk about ${request.id}`}
            groupName={`${request.id} huddle`}
            requestId={request.id}
          />
        </div>
      </div>

      <p className="rounded-lg border bg-muted/40 p-3 text-sm">
        <span className="font-medium">What happens next: </span>
        {nextStepLine(request, user)}
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card className="min-w-0">
            <CardHeader><CardTitle className="text-sm">What was asked for</CardTitle></CardHeader>
            <CardContent className="min-w-0 space-y-3">
              <p className="text-sm break-words">{request.brief}</p>
              <dl className="grid min-w-0 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Fact label="How many" value={deliverableLabel(request.details)} />
                <Fact label="Needed by" value={formatLongDate(request.eta)} />
                {request.details.department === "script" && <Fact label="Kind of script" value={request.details.scriptType} />}
                {request.details.department === "video" && (
                  <>
                    <Fact label="Where it runs" value={request.details.platform} />
                    <Fact label="Shape" value={request.details.format} />
                  </>
                )}
                {request.details.department === "design" && (
                  <>
                    <Fact label="Kind of creative" value={request.details.creativeType} />
                    <Fact label="Size" value={request.details.dimensions} />
                    <Fact label="Funnel stage" value={request.details.funnel} />
                  </>
                )}
                {request.productIds.length > 0 && (
                  <Fact label="Products" value={request.productIds.map((p) => productsById[p]?.name).filter(Boolean).join(", ")} />
                )}
              </dl>
              {attached.length > 0 && (
                <div className="space-y-1.5 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Files attached to work from</p>
                  {attached.map((a) => (
                    <AssetLink key={a.id} title={a.title} kind={ASSET_KIND_LABEL[a.kind]} url={a.url} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <VersionHistory request={request} />

          <Comments request={request} />
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0">
            <CardHeader><CardTitle className="text-sm">Who is on this</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Person label="Asked by" userId={requester.id} />
              <Person label={`${DEPARTMENT_LABEL[request.department]} manager`} userId={manager.id} />
              {assignee ? (
                <Person label={request.pickedUp ? "Picked it up" : "Doing the work"} userId={assignee.id} />
              ) : (
                <p className="text-sm text-muted-foreground">Nobody has this yet.</p>
              )}
            </CardContent>
          </Card>

          <ActionPanel request={request} />

          <Card className="min-w-0">
            <CardHeader><CardTitle className="text-sm">Trail</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Raised {formatLongDate(request.createdAt)} at {request.createdTime} from {request.source.label}.</p>
              {request.assignedAt && (
                <p>
                  {request.pickedUp ? "Picked up" : "Given out"} {formatLongDate(request.assignedAt)}
                  {request.assignedTime ? ` at ${request.assignedTime}` : ""}.
                </p>
              )}
              {request.completedAt && <p>Approved {formatLongDate(request.completedAt)}.</p>}
              {produced.length > 0 && (
                <p>{produced.length === 1 ? "1 file" : `${produced.length} files`} added to the {brand.name} library.</p>
              )}
              {request.relatedTaskId && <p>Linked to marketing task {request.relatedTaskId}. That task is not changed by this request.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}

function Person({ label, userId }: { label: string; userId: UserId }) {
  const u = usersById[userId];
  return (
    <div className="flex items-center gap-2.5">
      <UserAvatar user={u} size="md" />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-medium">{u.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function AssetLink({ title, kind, url }: { title: string; kind: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex min-w-0 items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:border-primary/40"
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <Badge variant="neutral">{kind}</Badge>
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
    </a>
  );
}

/** Every version ever uploaded, oldest first. Nothing is ever removed. */
function VersionHistory({ request }: { request: ContentRequest }) {
  return (
    <Card className="min-w-0">
      <CardHeader><CardTitle className="text-sm">Versions ({request.submissions.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {request.submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing has been uploaded yet.</p>
        ) : (
          request.submissions.map((s) => {
            const by = usersById[s.submittedById];
            return (
              <div key={s.version} className="min-w-0 space-y-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">Version {s.version}</Badge>
                  {s.outcome === "approved" && <Badge variant="success">Approved</Badge>}
                  {s.outcome === "changes_required" && <Badge variant="danger">Changes asked for</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {by.name} · {formatLongDate(s.submittedAt)} {s.submittedTime}
                  </span>
                </div>
                <AssetLink title={s.outputUrl.replace(/^https?:\/\//, "")} kind="Output" url={s.outputUrl} />
                {s.note && <p className="text-sm">{s.note}</p>}
                {s.outcomeNote && (
                  <p className="rounded-md bg-muted/60 p-2 text-sm">
                    <span className="font-medium">Reply: </span>{s.outcomeNote}
                  </p>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function Comments({ request }: { request: ContentRequest }) {
  const { currentUser: user } = useAppState();
  const { addContentComment } = useContent();
  const [body, setBody] = React.useState("");
  const allowed = canComment(user, request);

  return (
    <Card className="min-w-0">
      <CardHeader><CardTitle className="text-sm">Conversation</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {request.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing said yet.</p>
        ) : (
          request.comments.map((c) => {
            const author = usersById[c.authorId];
            return (
              <div key={c.id} className="flex min-w-0 gap-2.5">
                <UserAvatar user={author} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{author.name}</span> · {formatLongDate(c.createdAt)} {c.createdTime}
                  </p>
                  <p className="text-sm">{c.body}</p>
                </div>
              </div>
            );
          })
        )}
        {allowed && (
          <form
            className="flex gap-2 border-t pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!body.trim()) return;
              addContentComment(request.id, body.trim());
              setBody("");
            }}
          >
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message" aria-label="Write a message" />
            <Button type="submit" size="icon" aria-label="Send message"><MessageSquare /></Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/** The one box that shows only the buttons this person can actually press. */
function ActionPanel({ request }: { request: ContentRequest }) {
  const { currentUser: user } = useAppState();
  const { assignRequest, pickUpRequest, submitVersion, approveVersion, requestChanges } = useContent();
  const [assignee, setAssignee] = React.useState<string>("");
  const [outputUrl, setOutputUrl] = React.useState("");
  const [note, setNote] = React.useState("");
  const [changeNote, setChangeNote] = React.useState("");

  const showAssign = canAssign(user, request) && request.status !== "completed";
  const showPickUp = canPickUp(user, request);
  const showSubmit = canSubmit(user, request);
  const showReview = canReview(user, request);

  if (!showAssign && !showPickUp && !showSubmit && !showReview) {
    return (
      <Card className="min-w-0">
        <CardHeader><CardTitle className="text-sm">Your part</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Nothing for you to do here right now.</p></CardContent>
      </Card>
    );
  }

  const members = getDepartmentMembers(request.department);

  return (
    <Card className="min-w-0 border-primary/30">
      <CardHeader><CardTitle className="text-sm">Your part</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {showAssign && (
          <div className="space-y-2">
            <Label htmlFor="assign-to">Give this to</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger id="assign-to"><SelectValue placeholder="Pick a person" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="w-full gap-1.5"
              disabled={!assignee}
              onClick={() => assignee && assignRequest(request.id, assignee as UserId)}
            >
              <UserPlus /> {request.assigneeId ? "Move to this person" : "Give it out"}
            </Button>
          </div>
        )}

        {showPickUp && (
          <Button size="sm" className="w-full gap-1.5" onClick={() => pickUpRequest(request.id)}>
            <UserPlus /> Pick this up
          </Button>
        )}

        {showSubmit && (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!outputUrl.trim()) return;
              submitVersion(request.id, { outputUrl: outputUrl.trim(), note: note.trim() || undefined });
              setOutputUrl("");
              setNote("");
            }}
          >
            <Label htmlFor="submit-url">Link to the finished work</Label>
            <Input
              id="submit-url"
              value={outputUrl}
              onChange={(e) => setOutputUrl(e.target.value)}
              placeholder="https://drive.google.com/…"
            />
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything they should know (optional)" aria-label="Note for the reviewer" />
            <Button type="submit" size="sm" className="w-full gap-1.5" disabled={!outputUrl.trim()}>
              <Send /> Send version {request.submissions.length + 1} for review
            </Button>
          </form>
        )}

        {showReview && (
          <div className="space-y-2">
            <Button size="sm" className="w-full gap-1.5" onClick={() => approveVersion(request.id)}>
              <CheckCircle2 /> Approve and finish
            </Button>
            <Label htmlFor="change-note">Or say what needs changing</Label>
            <Textarea
              id="change-note"
              rows={2}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Example: change the opening hook, the first two seconds are slow."
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
              disabled={!changeNote.trim()}
              onClick={() => {
                requestChanges(request.id, changeNote.trim());
                setChangeNote("");
              }}
            >
              <RotateCcw /> Ask for changes
            </Button>
            <p className="text-xs text-muted-foreground">Asking for changes keeps this version. A new one is added on top.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
