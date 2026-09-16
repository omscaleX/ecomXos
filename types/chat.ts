import type { BrandId, UserId } from "@/types";

/**
 * Chat and Huddle.
 *
 * Anyone in the agency can message anyone, and anyone can start a huddle
 * (a quick voice room) with the people in that conversation.
 *
 * This is a prototype. Messages live in memory for the session and calls
 * are simulated — nothing is sent anywhere and no audio is recorded.
 */

export type ConversationKind = "direct" | "group";

export interface Conversation {
  id: string;
  kind: ConversationKind;
  /** Only for groups. Direct chats are named after the other person. */
  name?: string;
  /** Everyone in the conversation, including the creator. */
  memberIds: UserId[];
  /** Groups can be pinned to a brand so the context is obvious. */
  brandId?: BrandId;
  /** Groups can be pinned to a content request. */
  requestId?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  authorId: UserId;
  body: string;
  /** ISO date. */
  createdAt: string;
  /** "10:42" */
  createdTime: string;
  /** Set on the short system lines a huddle leaves behind. */
  system?: boolean;
}

export type HuddleStatus = "idle" | "ringing" | "live" | "ended";

/** A live huddle in one conversation. Simulated: no real audio. */
export interface Huddle {
  conversationId: string;
  status: HuddleStatus;
  startedById: UserId;
  /** People currently in the room. */
  participantIds: UserId[];
  /** People who were invited and have not joined yet. */
  invitedIds: UserId[];
  /** Seconds since the huddle started. */
  seconds: number;
  muted: boolean;
  /** Screen sharing is simulated too. */
  sharingScreen: boolean;
  startedAt: string;
}
