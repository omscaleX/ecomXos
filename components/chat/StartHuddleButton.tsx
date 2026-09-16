"use client";

import * as React from "react";
import { Headphones } from "lucide-react";
import type { BrandId, UserId } from "@/types";
import { useAppState, useChat } from "@/components/providers/AppStateProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Start a huddle about something, from anywhere in the app.
 *
 * If a group for these people does not exist yet it is made on the spot,
 * so nobody has to set up a room first. Calls are simulated in this demo.
 */
export function StartHuddleButton({
  memberIds,
  label = "Huddle",
  groupName,
  brandId,
  requestId,
  className,
}: {
  memberIds: UserId[];
  label?: string;
  groupName: string;
  brandId?: BrandId;
  requestId?: string;
  className?: string;
}) {
  const { currentUser } = useAppState();
  const { conversations, createGroup, startHuddle, openDirectChat, huddle } = useChat();

  const others = Array.from(new Set(memberIds.filter((id) => id !== currentUser.id)));
  if (!others.length) return null;

  const start = () => {
    let conversationId: string;
    if (others.length === 1) {
      conversationId = openDirectChat(others[0]);
    } else {
      const existing = conversations.find(
        (c) =>
          (requestId && c.requestId === requestId) ||
          (c.kind === "group" &&
            c.memberIds.length === others.length + 1 &&
            [...others, currentUser.id].every((m) => c.memberIds.includes(m))),
      );
      conversationId = existing ? existing.id : createGroup(groupName, others, { brandId, requestId });
    }
    startHuddle(conversationId);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-1.5", className)}
      onClick={start}
      disabled={!!huddle}
      title={huddle ? "You are already in a huddle" : undefined}
    >
      <Headphones className="text-emerald-600" /> {label}
    </Button>
  );
}
