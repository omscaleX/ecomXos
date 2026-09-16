"use client";

import * as React from "react";
import { Mic, MicOff, MonitorUp, PhoneOff } from "lucide-react";
import { usersById } from "@/data/users";
import { useAppState, useChat } from "@/components/providers/AppStateProvider";
import { conversationTitle, formatDuration } from "@/lib/chat";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The live huddle bar. It floats above everything so you can keep working
 * while you talk, the same way a real huddle does.
 *
 * Demo only: no microphone is used and no audio is sent anywhere.
 */
export function HuddleBar() {
  const { currentUser } = useAppState();
  const { huddle, conversations, leaveHuddle, endHuddle, toggleMute, toggleScreenShare, joinHuddle } = useChat();
  if (!huddle) return null;

  const conversation = conversations.find((c) => c.id === huddle.conversationId);
  const title = conversation ? conversationTitle(conversation, currentUser.id) : "Huddle";
  const inRoom = huddle.participantIds.includes(currentUser.id);
  const isHost = huddle.startedById === currentUser.id;

  return (
    <div
      role="region"
      aria-label="Live huddle"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 shadow-lg sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative flex size-2.5 shrink-0" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-600" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-emerald-900">Huddle · {title}</p>
          <p className="text-xs text-emerald-800">
            {formatDuration(huddle.seconds)} ·{" "}
            {huddle.participantIds.length === 1 ? "just you so far" : `${huddle.participantIds.length} people talking`}
            {huddle.invitedIds.length > 0 && ` · ringing ${huddle.invitedIds.length}`}
            {huddle.sharingScreen && " · sharing screen"}
          </p>
        </div>
        <div className="ml-auto flex -space-x-1.5 sm:ml-0">
          {huddle.participantIds.slice(0, 5).map((id) => (
            <UserAvatar key={id} user={usersById[id]} size="sm" className="ring-2 ring-emerald-50" />
          ))}
          {huddle.invitedIds.slice(0, 3).map((id) => (
            <UserAvatar key={id} user={usersById[id]} size="sm" className="opacity-40 ring-2 ring-emerald-50" />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {inRoom ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className={cn("gap-1.5 bg-white", huddle.muted && "border-red-300 text-red-700")}
              onClick={toggleMute}
              aria-pressed={huddle.muted}
            >
              {huddle.muted ? <MicOff /> : <Mic />} {huddle.muted ? "Muted" : "Mic on"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={cn("gap-1.5 bg-white", huddle.sharingScreen && "border-primary text-primary")}
              onClick={toggleScreenShare}
              aria-pressed={huddle.sharingScreen}
            >
              <MonitorUp /> <span className="hidden sm:inline">Share screen</span>
            </Button>
            <Button size="sm" variant="destructive" className="gap-1.5" onClick={isHost ? endHuddle : leaveHuddle}>
              <PhoneOff /> {isHost ? "End" : "Leave"}
            </Button>
          </>
        ) : (
          <Button size="sm" className="gap-1.5" onClick={joinHuddle}>Join huddle</Button>
        )}
      </div>
    </div>
  );
}
