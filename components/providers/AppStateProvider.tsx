"use client";

import * as React from "react";
import type { BrandId, ContentDepartment, Task, User, UserId } from "@/types";
import type {
  ContentAsset,
  ContentNotification,
  ContentNotificationKind,
  ContentRequest,
  RequestDetails,
  RequestSource,
} from "@/types/content";
import type { ChatMessage, Conversation, Huddle } from "@/types/chat";
import { CONTENT_MANAGER_BY_DEPARTMENT, usersById } from "@/data/users";
import { getSessionServerSnapshot, getSessionSnapshot, getUserServerSnapshot, getUserSnapshot, loginAs, logout as logoutStore, setStoredUserId, subscribeUser, type SessionState } from "@/lib/userStore";
import { initialTasks } from "@/data/tasks";
import { initialTargetMap, type TargetMap } from "@/data/targets";
import { DEMO_TODAY } from "@/data/config";
import { brandsById } from "@/data/brands";
import { initialContentRequests, makeQueueId, nextSequence } from "@/data/contentRequests";
import { initialContentAssets } from "@/data/contentAssets";
import { initialConversations, initialMessages, directConversationId, makeDirectConversation } from "@/data/messages";
import { notificationRecipients } from "@/lib/content";
import { nowTime } from "@/lib/chat";

/**
 * Global demo state.
 *
 * - currentUser: simulated login (the user switcher). Demo only – in
 *   production the role comes from real authentication.
 * - tasks / targets: editable in-memory copies of the marketing data.
 * - content requests / assets: the content production desk.
 * - conversations / messages / huddle: chat and calls, all simulated.
 *
 * When a backend exists this provider becomes the place where data is
 * fetched and mutations are sent; consumers keep the same hooks.
 */

export type NewTaskInput = Omit<Task, "id" | "createdAt" | "completedAt">;

/** Everything a requester fills in (or that the page fills in for them). */
export interface NewContentRequestInput {
  department: ContentDepartment;
  brandId: BrandId;
  productIds: string[];
  campaignId?: string;
  details: RequestDetails;
  brief: string;
  eta: string;
  referenceAssetIds?: string[];
  rawAssetIds?: string[];
  relatedTaskId?: string;
  source: RequestSource;
}

interface AppState {
  currentUser: User;
  setCurrentUserId: (id: UserId) => void;
  /** Demo session: "unknown" before hydration, then "in" or "out". */
  session: SessionState;
  login: (id: UserId) => void;
  logout: () => void;

  tasks: Task[];
  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  completeTask: (id: string) => void;
  targets: TargetMap;
  setTarget: (brandId: BrandId, targetROAS: number) => void;
  today: string;

  /* Content production */
  contentRequests: ContentRequest[];
  contentAssets: ContentAsset[];
  notifications: ContentNotification[];
  raiseContentRequest: (input: NewContentRequestInput) => ContentRequest;
  assignRequest: (requestId: string, assigneeId: UserId) => void;
  pickUpRequest: (requestId: string) => void;
  submitVersion: (requestId: string, input: { outputUrl: string; note?: string }) => void;
  approveVersion: (requestId: string, note?: string) => void;
  requestChanges: (requestId: string, note: string) => void;
  addContentComment: (requestId: string, body: string) => void;
  addContentAsset: (asset: Omit<ContentAsset, "id" | "addedById" | "addedAt">) => ContentAsset;
  markNotificationsRead: () => void;

  /* Chat and huddle */
  conversations: Conversation[];
  messages: ChatMessage[];
  sendMessage: (conversationId: string, body: string) => void;
  openDirectChat: (otherId: UserId) => string;
  createGroup: (name: string, memberIds: UserId[], extra?: { brandId?: BrandId; requestId?: string }) => string;
  huddle: Huddle | null;
  startHuddle: (conversationId: string) => void;
  joinHuddle: () => void;
  leaveHuddle: () => void;
  endHuddle: () => void;
  toggleMute: () => void;
  toggleScreenShare: () => void;
}

const AppStateContext = React.createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  // Persisted across refreshes (demo convenience only).
  const currentUserId = React.useSyncExternalStore(subscribeUser, getUserSnapshot, getUserServerSnapshot);
  const setCurrentUserId = React.useCallback((id: UserId) => setStoredUserId(id), []);
  const session = React.useSyncExternalStore(subscribeUser, getSessionSnapshot, getSessionServerSnapshot);
  const login = React.useCallback((id: UserId) => loginAs(id), []);
  const logout = React.useCallback(() => logoutStore(), []);
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [targets, setTargets] = React.useState<TargetMap>(initialTargetMap);
  const counter = React.useRef(100);

  const currentUser = usersById[currentUserId];

  const addTask = React.useCallback((input: NewTaskInput) => {
    counter.current += 1;
    const task: Task = { ...input, id: `t-new-${counter.current}`, createdAt: DEMO_TODAY };
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const updateTask = React.useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        if (patch.status === "completed" && !next.completedAt) next.completedAt = DEMO_TODAY;
        if (patch.status && patch.status !== "completed") next.completedAt = undefined;
        return next;
      }),
    );
  }, []);

  const completeTask = React.useCallback(
    (id: string) => updateTask(id, { status: "completed", completedAt: DEMO_TODAY }),
    [updateTask],
  );

  const setTarget = React.useCallback((brandId: BrandId, targetROAS: number) => {
    setTargets((prev) => ({ ...prev, [brandId]: targetROAS }));
  }, []);

  /* ---------------------------------------------------------------- *
   * Content production
   * ---------------------------------------------------------------- */

  const [contentRequests, setContentRequests] = React.useState<ContentRequest[]>(initialContentRequests);
  const [contentAssets, setContentAssets] = React.useState<ContentAsset[]>(initialContentAssets);
  const [notifications, setNotifications] = React.useState<ContentNotification[]>([]);
  const sequences = React.useRef({ ...nextSequence });
  const assetCounter = React.useRef(1);
  const notifyCounter = React.useRef(1);

  const pushNotification = React.useCallback(
    (request: ContentRequest, kind: ContentNotificationKind, actorId: UserId, message: string) => {
      notifyCounter.current += 1;
      const note: ContentNotification = {
        id: `cn-${notifyCounter.current}`,
        kind,
        requestId: request.id,
        recipientIds: notificationRecipients(request, kind).filter((id) => id !== actorId),
        actorId,
        message,
        createdAt: DEMO_TODAY,
        createdTime: nowTime(),
        read: false,
      };
      setNotifications((prev) => [note, ...prev]);
    },
    [],
  );

  const raiseContentRequest = React.useCallback(
    (input: NewContentRequestInput) => {
      const seq = sequences.current[input.department];
      sequences.current[input.department] = seq + 1;
      const request: ContentRequest = {
        id: makeQueueId(input.department, DEMO_TODAY, seq),
        department: input.department,
        status: "pending_assignment",
        brandId: input.brandId,
        clientId: brandsById[input.brandId].clientId,
        productIds: input.productIds,
        campaignId: input.campaignId,
        funnel: input.details.department === "design" ? input.details.funnel : undefined,
        relatedTaskId: input.relatedTaskId,
        source: input.source,
        requesterId: currentUserId,
        createdAt: DEMO_TODAY,
        createdTime: nowTime(),
        departmentManagerId: CONTENT_MANAGER_BY_DEPARTMENT[input.department],
        details: input.details,
        brief: input.brief,
        eta: input.eta,
        referenceAssetIds: input.referenceAssetIds ?? [],
        rawAssetIds: input.rawAssetIds ?? [],
        submissions: [],
        comments: [],
      };
      setContentRequests((prev) => [request, ...prev]);
      pushNotification(request, "new_request", currentUserId, `${currentUser.name} raised ${request.id}`);
      return request;
    },
    [currentUserId, currentUser, pushNotification],
  );

  /** Small helper so every workflow action updates one request the same way. */
  const patchRequest = React.useCallback(
    (requestId: string, patch: (r: ContentRequest) => ContentRequest) => {
      setContentRequests((prev) => prev.map((r) => (r.id === requestId ? patch(r) : r)));
    },
    [],
  );

  const assignRequest = React.useCallback(
    (requestId: string, assigneeId: UserId) => {
      let updated: ContentRequest | undefined;
      patchRequest(requestId, (r) => {
        updated = {
          ...r,
          assigneeId,
          assignedAt: DEMO_TODAY,
          assignedTime: nowTime(),
          pickedUp: false,
          status: r.status === "pending_assignment" ? "in_production" : r.status,
        };
        return updated;
      });
      if (updated) {
        pushNotification(updated, "assigned", currentUserId, `${updated.id} was given to ${usersById[assigneeId].name}`);
      }
    },
    [patchRequest, pushNotification, currentUserId],
  );

  const pickUpRequest = React.useCallback(
    (requestId: string) => {
      let updated: ContentRequest | undefined;
      patchRequest(requestId, (r) => {
        updated = {
          ...r,
          assigneeId: currentUserId,
          assignedAt: DEMO_TODAY,
          assignedTime: nowTime(),
          pickedUp: true,
          status: "in_production",
        };
        return updated;
      });
      if (updated) {
        pushNotification(updated, "picked_up", currentUserId, `${currentUser.name} picked up ${updated.id}`);
      }
    },
    [patchRequest, pushNotification, currentUserId, currentUser],
  );

  const submitVersion = React.useCallback(
    (requestId: string, input: { outputUrl: string; note?: string }) => {
      let updated: ContentRequest | undefined;
      patchRequest(requestId, (r) => {
        const version = r.submissions.length + 1;
        updated = {
          ...r,
          status: "in_review",
          // Versions are appended, never replaced.
          submissions: [
            ...r.submissions,
            {
              version,
              outputUrl: input.outputUrl,
              note: input.note,
              submittedById: currentUserId,
              submittedAt: DEMO_TODAY,
              submittedTime: nowTime(),
            },
          ],
        };
        return updated;
      });
      if (updated) {
        const version = updated.submissions.length;
        pushNotification(updated, "submitted", currentUserId, `${updated.id} version ${version} is ready for review`);
      }
    },
    [patchRequest, pushNotification, currentUserId],
  );

  const approveVersion = React.useCallback(
    (requestId: string, note?: string) => {
      let updated: ContentRequest | undefined;
      patchRequest(requestId, (r) => {
        const submissions = r.submissions.map((s, i) =>
          i === r.submissions.length - 1
            ? { ...s, outcome: "approved" as const, outcomeNote: note, outcomeAt: DEMO_TODAY }
            : s,
        );
        updated = { ...r, status: "completed", submissions, completedAt: DEMO_TODAY };
        return updated;
      });
      if (updated) {
        const final = updated.submissions[updated.submissions.length - 1];
        // The approved output joins the brand's content library automatically.
        if (final) {
          assetCounter.current += 1;
          const kindByDepartment = {
            script: "script",
            video: "final_video",
            design: "final_creative",
          } as const;
          const asset: ContentAsset = {
            id: `ca-new-${assetCounter.current}`,
            kind: kindByDepartment[updated.department],
            title: `${updated.id} final`,
            url: final.outputUrl,
            brandId: updated.brandId,
            productIds: updated.productIds,
            campaignId: updated.campaignId,
            requestId: updated.id,
            version: final.version,
            addedById: final.submittedById,
            addedAt: DEMO_TODAY,
            isFinal: true,
          };
          setContentAssets((prev) => [asset, ...prev]);
        }
        pushNotification(updated, "approved", currentUserId, `${updated.id} was approved`);
      }
    },
    [patchRequest, pushNotification, currentUserId],
  );

  const requestChanges = React.useCallback(
    (requestId: string, note: string) => {
      let updated: ContentRequest | undefined;
      patchRequest(requestId, (r) => {
        const submissions = r.submissions.map((s, i) =>
          i === r.submissions.length - 1
            ? { ...s, outcome: "changes_required" as const, outcomeNote: note, outcomeAt: DEMO_TODAY }
            : s,
        );
        updated = {
          ...r,
          status: "changes_required",
          submissions,
          comments: [
            ...r.comments,
            {
              id: `cc-${r.id}-${r.comments.length + 1}`,
              authorId: currentUserId,
              body: note,
              createdAt: DEMO_TODAY,
              createdTime: nowTime(),
            },
          ],
        };
        return updated;
      });
      if (updated) {
        pushNotification(updated, "changes_requested", currentUserId, `Changes were asked for on ${updated.id}`);
      }
    },
    [patchRequest, pushNotification, currentUserId],
  );

  const addContentComment = React.useCallback(
    (requestId: string, body: string) => {
      patchRequest(requestId, (r) => ({
        ...r,
        comments: [
          ...r.comments,
          {
            id: `cc-${r.id}-${r.comments.length + 1}`,
            authorId: currentUserId,
            body,
            createdAt: DEMO_TODAY,
            createdTime: nowTime(),
          },
        ],
      }));
    },
    [patchRequest, currentUserId],
  );

  const addContentAsset = React.useCallback(
    (asset: Omit<ContentAsset, "id" | "addedById" | "addedAt">) => {
      assetCounter.current += 1;
      const full: ContentAsset = {
        ...asset,
        id: `ca-new-${assetCounter.current}`,
        addedById: currentUserId,
        addedAt: DEMO_TODAY,
      };
      setContentAssets((prev) => [full, ...prev]);
      return full;
    },
    [currentUserId],
  );

  const markNotificationsRead = React.useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.recipientIds.includes(currentUserId) ? { ...n, read: true } : n)),
    );
  }, [currentUserId]);

  /* ---------------------------------------------------------------- *
   * Chat and huddle
   * ---------------------------------------------------------------- */

  const [conversations, setConversations] = React.useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [huddle, setHuddle] = React.useState<Huddle | null>(null);
  const messageCounter = React.useRef(1000);

  const appendMessage = React.useCallback((conversationId: string, authorId: UserId, body: string, system = false) => {
    messageCounter.current += 1;
    const message: ChatMessage = {
      id: `msg-${messageCounter.current}`,
      conversationId,
      authorId,
      body,
      createdAt: DEMO_TODAY,
      createdTime: nowTime(),
      system,
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = React.useCallback(
    (conversationId: string, body: string) => {
      const text = body.trim();
      if (!text) return;
      appendMessage(conversationId, currentUserId, text);
    },
    [appendMessage, currentUserId],
  );

  /** Opens the direct chat with someone, creating it the first time. */
  const openDirectChat = React.useCallback(
    (otherId: UserId) => {
      const id = directConversationId(currentUserId, otherId);
      setConversations((prev) => (prev.some((c) => c.id === id) ? prev : [...prev, makeDirectConversation(currentUserId, otherId)]));
      return id;
    },
    [currentUserId],
  );

  const createGroup = React.useCallback(
    (name: string, memberIds: UserId[], extra?: { brandId?: BrandId; requestId?: string }) => {
      messageCounter.current += 1;
      const id = `grp-new-${messageCounter.current}`;
      const members = Array.from(new Set<UserId>([currentUserId, ...memberIds]));
      setConversations((prev) => [
        ...prev,
        { id, kind: "group", name, memberIds: members, createdAt: DEMO_TODAY, ...extra },
      ]);
      return id;
    },
    [currentUserId],
  );

  const startHuddle = React.useCallback(
    (conversationId: string) => {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation) return;
      setHuddle({
        conversationId,
        status: "live",
        startedById: currentUserId,
        participantIds: [currentUserId],
        invitedIds: conversation.memberIds.filter((m) => m !== currentUserId),
        seconds: 0,
        muted: false,
        sharingScreen: false,
        startedAt: DEMO_TODAY,
      });
      appendMessage(conversationId, currentUserId, "Started a huddle", true);
    },
    [conversations, currentUserId, appendMessage],
  );

  /** Demo: other people drift in a few seconds after the huddle starts. */
  React.useEffect(() => {
    if (!huddle || huddle.status !== "live") return;
    const timer = window.setInterval(() => {
      setHuddle((prev) => {
        if (!prev || prev.status !== "live") return prev;
        const seconds = prev.seconds + 1;
        // One invited person joins every 3 seconds, up to everyone.
        const shouldJoin = seconds % 3 === 0 && prev.invitedIds.length > 0;
        if (!shouldJoin) return { ...prev, seconds };
        const [next, ...rest] = prev.invitedIds;
        return { ...prev, seconds, participantIds: [...prev.participantIds, next], invitedIds: rest };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [huddle?.status, huddle]);

  const joinHuddle = React.useCallback(() => {
    setHuddle((prev) =>
      prev && !prev.participantIds.includes(currentUserId)
        ? { ...prev, participantIds: [...prev.participantIds, currentUserId], invitedIds: prev.invitedIds.filter((i) => i !== currentUserId) }
        : prev,
    );
  }, [currentUserId]);

  const leaveHuddle = React.useCallback(() => {
    setHuddle((prev) => {
      if (!prev) return prev;
      const participantIds = prev.participantIds.filter((p) => p !== currentUserId);
      return participantIds.length ? { ...prev, participantIds } : null;
    });
  }, [currentUserId]);

  const endHuddle = React.useCallback(() => {
    setHuddle((prev) => {
      if (prev) appendMessage(prev.conversationId, prev.startedById, "Huddle ended", true);
      return null;
    });
  }, [appendMessage]);

  const toggleMute = React.useCallback(() => {
    setHuddle((prev) => (prev ? { ...prev, muted: !prev.muted } : prev));
  }, []);

  const toggleScreenShare = React.useCallback(() => {
    setHuddle((prev) => (prev ? { ...prev, sharingScreen: !prev.sharingScreen } : prev));
  }, []);

  const value = React.useMemo<AppState>(
    () => ({
      currentUser,
      setCurrentUserId,
      session,
      login,
      logout,
      tasks,
      addTask,
      updateTask,
      completeTask,
      targets,
      setTarget,
      today: DEMO_TODAY,
      contentRequests,
      contentAssets,
      notifications,
      raiseContentRequest,
      assignRequest,
      pickUpRequest,
      submitVersion,
      approveVersion,
      requestChanges,
      addContentComment,
      addContentAsset,
      markNotificationsRead,
      conversations,
      messages,
      sendMessage,
      openDirectChat,
      createGroup,
      huddle,
      startHuddle,
      joinHuddle,
      leaveHuddle,
      endHuddle,
      toggleMute,
      toggleScreenShare,
    }),
    [
      currentUser, setCurrentUserId, session, login, logout,
      tasks, addTask, updateTask, completeTask, targets, setTarget,
      contentRequests, contentAssets, notifications, raiseContentRequest, assignRequest,
      pickUpRequest, submitVersion, approveVersion, requestChanges, addContentComment,
      addContentAsset, markNotificationsRead,
      conversations, messages, sendMessage, openDirectChat, createGroup,
      huddle, startHuddle, joinHuddle, leaveHuddle, endHuddle, toggleMute, toggleScreenShare,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

export function useCurrentUser(): User {
  return useAppState().currentUser;
}

export function useTargets() {
  const { targets, setTarget } = useAppState();
  return { targets, setTarget };
}

export function useTasks() {
  const { tasks, addTask, updateTask, completeTask } = useAppState();
  return { tasks, addTask, updateTask, completeTask };
}

export function useContent() {
  const {
    contentRequests, contentAssets, notifications, raiseContentRequest, assignRequest,
    pickUpRequest, submitVersion, approveVersion, requestChanges, addContentComment,
    addContentAsset, markNotificationsRead,
  } = useAppState();
  return {
    contentRequests, contentAssets, notifications, raiseContentRequest, assignRequest,
    pickUpRequest, submitVersion, approveVersion, requestChanges, addContentComment,
    addContentAsset, markNotificationsRead,
  };
}

export function useChat() {
  const {
    conversations, messages, sendMessage, openDirectChat, createGroup,
    huddle, startHuddle, joinHuddle, leaveHuddle, endHuddle, toggleMute, toggleScreenShare,
  } = useAppState();
  return {
    conversations, messages, sendMessage, openDirectChat, createGroup,
    huddle, startHuddle, joinHuddle, leaveHuddle, endHuddle, toggleMute, toggleScreenShare,
  };
}
