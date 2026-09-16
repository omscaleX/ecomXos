"use client";

import * as React from "react";
import { Headphones, Plus, Search, Send, Users } from "lucide-react";
import type { UserId } from "@/types";
import type { Conversation } from "@/types/chat";
import { usersById } from "@/data/users";
import { brandsById } from "@/data/brands";
import { useAppState, useChat } from "@/components/providers/AppStateProvider";
import {
  contactList,
  conversationMessages,
  conversationSubtitle,
  conversationTitle,
  lastMessage,
  myConversations,
  sortByRecent,
} from "@/lib/chat";
import { formatLongDate } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Chat and Huddle.
 *
 * Anyone can message anyone. Pick a person or a room on the left, type on
 * the right. Press Huddle to talk instead of typing.
 *
 * Demo only: messages live for this session and calls are simulated.
 */
export function ChatView() {
  const { currentUser } = useAppState();
  const { conversations, messages, sendMessage, openDirectChat, createGroup, startHuddle, huddle } = useChat();

  const rooms = React.useMemo(
    () => sortByRecent(myConversations(conversations, currentUser.id), messages),
    [conversations, messages, currentUser.id],
  );
  const [activeId, setActiveId] = React.useState<string>(rooms[0]?.id ?? "");
  const [search, setSearch] = React.useState("");
  const [newGroupOpen, setNewGroupOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const active = rooms.find((r) => r.id === activeId) ?? rooms[0];
  const thread = React.useMemo(
    () => (active ? conversationMessages(messages, active.id) : []),
    [messages, active],
  );

  const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, activeId]);

  const filteredRooms = rooms.filter((r) =>
    conversationTitle(r, currentUser.id).toLowerCase().includes(search.toLowerCase()),
  );
  const people = contactList(currentUser.id).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !draft.trim()) return;
    sendMessage(active.id, draft);
    setDraft("");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Chat & Huddle"
        subtitle="Message anyone in the agency, or press Huddle to talk instead of typing."
        actions={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setNewGroupOpen(true)}>
            <Users /> New room
          </Button>
        }
      />

      <div className="grid min-h-0 gap-4 lg:grid-cols-[18rem_1fr]">
        {/* Left: people and rooms */}
        <aside className="min-w-0 space-y-3 rounded-lg border bg-card p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a person or room"
              aria-label="Find a person or room"
              className="pl-8"
            />
          </div>

          <div className="max-h-[28rem] space-y-3 overflow-y-auto">
            <div className="space-y-0.5">
              <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Your chats</p>
              {filteredRooms.map((room) => (
                <RoomButton
                  key={room.id}
                  room={room}
                  me={currentUser.id}
                  active={room.id === active?.id}
                  preview={lastMessage(messages, room.id)?.body}
                  onClick={() => setActiveId(room.id)}
                />
              ))}
              {!filteredRooms.length && <p className="px-1 py-2 text-xs text-muted-foreground">No chats match.</p>}
            </div>

            <div className="space-y-0.5">
              <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Start a new chat</p>
              {people.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setActiveId(openDirectChat(u.id))}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-accent cursor-pointer"
                >
                  <UserAvatar user={u} size="sm" />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm">{u.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{u.shortRoleLabel}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: the conversation */}
        <section className="flex min-h-[32rem] min-w-0 flex-col rounded-lg border bg-card">
          {active ? (
            <>
              <header className="flex items-center gap-3 border-b px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{conversationTitle(active, currentUser.id)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {conversationSubtitle(active, currentUser.id)}
                    {active.brandId ? ` · ${brandsById[active.brandId].name}` : ""}
                    {active.requestId ? ` · ${active.requestId}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto gap-1.5"
                  onClick={() => startHuddle(active.id)}
                  disabled={!!huddle}
                >
                  <Headphones className="text-emerald-600" /> Huddle
                </Button>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: "28rem" }}>
                {thread.map((m, i) => {
                  const author = usersById[m.authorId];
                  const mine = m.authorId === currentUser.id;
                  const newDay = i === 0 || thread[i - 1].createdAt !== m.createdAt;
                  if (m.system) {
                    return (
                      <p key={m.id} className="text-center text-xs text-muted-foreground">
                        {author.name} · {m.body}
                      </p>
                    );
                  }
                  return (
                    <React.Fragment key={m.id}>
                      {newDay && (
                        <p className="text-center text-[11px] text-muted-foreground">{formatLongDate(m.createdAt)}</p>
                      )}
                      <div className={cn("flex min-w-0 gap-2.5", mine && "flex-row-reverse")}>
                        <UserAvatar user={author} size="sm" />
                        <div className={cn("min-w-0 max-w-[80%]", mine && "text-right")}>
                          <p className="text-[11px] text-muted-foreground">
                            {mine ? "You" : author.name} · {m.createdTime}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 inline-block rounded-lg px-3 py-2 text-left text-sm",
                              mine ? "bg-primary text-primary-foreground" : "bg-muted",
                            )}
                          >
                            {m.body}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                {!thread.length && (
                  <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello.</p>
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={send} className="flex gap-2 border-t p-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message ${conversationTitle(active, currentUser.id)}`}
                  aria-label="Write a message"
                />
                <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send">
                  <Send />
                </Button>
              </form>
            </>
          ) : (
            <p className="p-10 text-center text-sm text-muted-foreground">Pick someone on the left to start.</p>
          )}
        </section>
      </div>

      <NewGroupDialog
        open={newGroupOpen}
        onOpenChange={setNewGroupOpen}
        onCreate={(name, ids) => setActiveId(createGroup(name, ids))}
      />
    </div>
  );
}

function RoomButton({
  room,
  me,
  active,
  preview,
  onClick,
}: {
  room: Conversation;
  me: UserId;
  active: boolean;
  preview?: string;
  onClick: () => void;
}) {
  const other = room.kind === "direct" ? room.memberIds.find((m) => m !== me) : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left cursor-pointer hover:bg-accent",
        active && "bg-accent",
      )}
    >
      {other ? (
        <UserAvatar user={usersById[other]} size="sm" />
      ) : (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
          <Users className="size-3.5" />
        </span>
      )}
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm font-medium">{conversationTitle(room, me)}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{preview ?? "No messages yet"}</span>
      </span>
      {room.kind === "group" && <Badge variant="neutral" className="text-[10px]">{room.memberIds.length}</Badge>}
    </button>
  );
}

function NewGroupDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (name: string, ids: UserId[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {open && <NewGroupForm onDone={() => onOpenChange(false)} onCreate={onCreate} />}
      </DialogContent>
    </Dialog>
  );
}

function NewGroupForm({ onDone, onCreate }: { onDone: () => void; onCreate: (name: string, ids: UserId[]) => void }) {
  const { currentUser } = useAppState();
  const [name, setName] = React.useState("");
  const [picked, setPicked] = React.useState<UserId[]>([]);
  const people = contactList(currentUser.id);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !picked.length) return;
        onCreate(name.trim(), picked);
        onDone();
      }}
      className="space-y-4"
    >
      <DialogHeader><DialogTitle>New room</DialogTitle></DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="group-name">Room name</Label>
        <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Example: BluHeat War Room" />
      </div>
      <div className="space-y-2">
        <Label>Who is in it?</Label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {people.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setPicked((p) => (p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]))}
              aria-pressed={picked.includes(u.id)}
              className={cn(
                "flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-left text-sm cursor-pointer hover:border-primary/40",
                picked.includes(u.id) && "border-primary bg-primary/5",
              )}
            >
              <UserAvatar user={u} size="sm" />
              <span className="min-w-0 truncate">{u.name}</span>
            </button>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={!name.trim() || !picked.length} className="gap-1.5"><Plus /> Create room</Button>
      </DialogFooter>
    </form>
  );
}
