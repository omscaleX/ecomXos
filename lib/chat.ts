import type { User, UserId } from "@/types";
import type { ChatMessage, Conversation } from "@/types/chat";
import { usersById } from "@/data/users";

/**
 * Chat helpers.
 *
 * Everyone can reach everyone: a direct chat is created the first time two
 * people open one. Groups are made by hand and can be pinned to a brand or
 * to a content request.
 */

/** The other person in a direct chat. */
export function otherMember(conversation: Conversation, me: UserId): User | undefined {
  const id = conversation.memberIds.find((m) => m !== me);
  return id ? usersById[id] : undefined;
}

/** What to show as the conversation title for this viewer. */
export function conversationTitle(conversation: Conversation, me: UserId): string {
  if (conversation.kind === "group") return conversation.name ?? "Group";
  return otherMember(conversation, me)?.name ?? "Chat";
}

/** Short line under the title, e.g. "Meta Ads" or "6 people". */
export function conversationSubtitle(conversation: Conversation, me: UserId): string {
  if (conversation.kind === "group") {
    return `${conversation.memberIds.length} people`;
  }
  return otherMember(conversation, me)?.roleLabel ?? "";
}

export function isMember(conversation: Conversation, userId: UserId): boolean {
  return conversation.memberIds.includes(userId);
}

/** Conversations this person belongs to. */
export function myConversations(conversations: Conversation[], me: UserId): Conversation[] {
  return conversations.filter((c) => isMember(c, me));
}

export function conversationMessages(messages: ChatMessage[], conversationId: string): ChatMessage[] {
  return messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => (a.createdAt === b.createdAt ? a.createdTime.localeCompare(b.createdTime) : a.createdAt < b.createdAt ? -1 : 1));
}

export function lastMessage(messages: ChatMessage[], conversationId: string): ChatMessage | undefined {
  const rows = conversationMessages(messages, conversationId);
  return rows.length ? rows[rows.length - 1] : undefined;
}

/** Most recent first, so the sidebar reads like a real inbox. */
export function sortByRecent(conversations: Conversation[], messages: ChatMessage[]): Conversation[] {
  const stamp = (c: Conversation) => {
    const last = lastMessage(messages, c.id);
    return last ? `${last.createdAt} ${last.createdTime}` : `${c.createdAt} 00:00`;
  };
  return [...conversations].sort((a, b) => (stamp(a) < stamp(b) ? 1 : -1));
}

/** "10:42" in the demo's fixed clock, used for anything typed now. */
export function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Everyone except the viewer, marketing side first, for the new-chat picker. */
export function contactList(me: UserId): User[] {
  return Object.values(usersById)
    .filter((u) => u.id !== me)
    .sort((a, b) => {
      const aContent = a.isContentTeam ? 1 : 0;
      const bContent = b.isContentTeam ? 1 : 0;
      if (aContent !== bContent) return aContent - bContent;
      return a.name.localeCompare(b.name);
    });
}
