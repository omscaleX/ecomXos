import type { UserId } from "@/types";
import type { ChatMessage, Conversation } from "@/types/chat";
import { DEMO_TODAY } from "@/data/config";
import { addDays } from "@/data/demo/series";
import { users } from "@/data/users";

/**
 * Demo chat history.
 *
 * A few group rooms plus a handful of direct chats, so the app opens with
 * something to read. Every other pair of people gets an empty direct chat
 * created the moment someone opens it.
 */

/** Direct chat ids are the two user ids, sorted, so the pair always matches. */
export function directConversationId(a: UserId, b: UserId): string {
  return `dm-${[a, b].sort().join("-")}`;
}

export function makeDirectConversation(a: UserId, b: UserId): Conversation {
  return {
    id: directConversationId(a, b),
    kind: "direct",
    memberIds: [a, b].sort() as UserId[],
    createdAt: DEMO_TODAY,
  };
}

const allUserIds = users.map((u) => u.id);

export const initialConversations: Conversation[] = [
  {
    id: "grp-agency",
    kind: "group",
    name: "Everyone",
    memberIds: allUserIds,
    createdAt: addDays(DEMO_TODAY, -120),
  },
  {
    id: "grp-marketing",
    kind: "group",
    name: "Marketing Team",
    memberIds: ["bhupes", "lucky", "om", "anubhav", "sagar"],
    createdAt: addDays(DEMO_TODAY, -120),
  },
  {
    id: "grp-content",
    kind: "group",
    name: "Content Team",
    memberIds: ["meera", "vikram", "tara", "kavya", "rahul", "zoya", "arjun"],
    createdAt: addDays(DEMO_TODAY, -120),
  },
  {
    id: "grp-bluheat",
    kind: "group",
    name: "BluHeat War Room",
    memberIds: ["bhupes", "lucky", "anubhav", "sagar", "vikram", "rahul"],
    brandId: "nysh-bluheat",
    createdAt: addDays(DEMO_TODAY, -9),
  },
  {
    id: "grp-festive",
    kind: "group",
    name: "Festive Launch",
    memberIds: ["lucky", "om", "sagar", "meera", "tara", "kavya", "arjun"],
    brandId: "desividesi-india",
    createdAt: addDays(DEMO_TODAY, -14),
  },
  {
    id: "grp-house-script",
    kind: "group",
    name: "Script Writing",
    memberIds: ["meera", "kavya"],
    createdAt: addDays(DEMO_TODAY, -120),
  },
  {
    id: "grp-house-video",
    kind: "group",
    name: "Video Editing",
    memberIds: ["vikram", "rahul", "zoya"],
    createdAt: addDays(DEMO_TODAY, -120),
  },
  {
    id: "grp-house-design",
    kind: "group",
    name: "Graphic Design",
    memberIds: ["tara", "arjun"],
    createdAt: addDays(DEMO_TODAY, -120),
  },
  makeDirectConversation("lucky", "om"),
  makeDirectConversation("lucky", "meera"),
  makeDirectConversation("vikram", "rahul"),
  makeDirectConversation("tara", "arjun"),
  makeDirectConversation("anubhav", "rahul"),
  makeDirectConversation("bhupes", "lucky"),
  makeDirectConversation("om", "kavya"),
];

interface MessageSeed {
  conversationId: string;
  authorId: UserId;
  body: string;
  /** Days before today. */
  age: number;
  time: string;
  system?: boolean;
}

const seeds: MessageSeed[] = [
  /* Everyone */
  { conversationId: "grp-agency", authorId: "bhupes", body: "Morning all. Month-end review is on Friday, please keep your brand numbers up to date.", age: 3, time: "09:12" },
  { conversationId: "grp-agency", authorId: "meera", body: "Script side is clear this week. Video is the queue under pressure.", age: 3, time: "09:20" },
  { conversationId: "grp-agency", authorId: "lucky", body: "Noted. I will push the BluHeat videos first.", age: 3, time: "09:24" },

  /* Marketing */
  { conversationId: "grp-marketing", authorId: "lucky", body: "BluHeat is the only brand under target right now. ROAS is 1.50 against a target of 2.20.", age: 2, time: "10:05" },
  { conversationId: "grp-marketing", authorId: "anubhav", body: "Meta side is spending fine but sales are not following. I think the creatives are tired.", age: 2, time: "10:11" },
  { conversationId: "grp-marketing", authorId: "sagar", body: "Google search is steady. Shopping is where the drop is.", age: 2, time: "10:18" },
  { conversationId: "grp-marketing", authorId: "lucky", body: "Right. I have raised a video request for 5 new BluHeat videos. Meera has it.", age: 2, time: "10:26" },
  { conversationId: "grp-marketing", authorId: "bhupes", body: "Good. Let us huddle tomorrow at 11 and go through it.", age: 1, time: "17:40" },

  /* Content */
  { conversationId: "grp-content", authorId: "meera", body: "Queue check from my side. Kavya has 3 scripts open, two go for review today.", age: 2, time: "09:30" },
  { conversationId: "grp-content", authorId: "vikram", body: "Video is the busy one. Rahul is on the 5 BluHeat cuts, Zoya has the Warmee set.", age: 2, time: "09:32" },
  { conversationId: "grp-content", authorId: "tara", body: "Design is clear apart from the festive creatives with Arjun.", age: 2, time: "09:34" },
  { conversationId: "grp-content", authorId: "kavya", body: "Two of my three are done, sending for review today.", age: 2, time: "09:33" },
  { conversationId: "grp-content", authorId: "rahul", body: "BluHeat cut one is up for review. Waiting on Anubhav.", age: 1, time: "12:02" },
  { conversationId: "grp-content", authorId: "arjun", body: "Festive creatives need the ad copy before I can start. Can someone drop it in?", age: 1, time: "12:14" },
  { conversationId: "grp-content", authorId: "meera", body: "Kavya will share it by end of day.", age: 1, time: "12:20" },

  /* Inside each production house */
  { conversationId: "grp-house-script", authorId: "meera", body: "Kavya, the BluHeat hooks are the priority today. Everything else can wait.", age: 2, time: "09:40" },
  { conversationId: "grp-house-script", authorId: "kavya", body: "Understood. Two drafts by lunch.", age: 2, time: "09:42" },
  { conversationId: "grp-house-video", authorId: "vikram", body: "Rahul on BluHeat, Zoya on Warmee. Shout if either slips.", age: 2, time: "10:00" },
  { conversationId: "grp-house-video", authorId: "zoya", body: "Warmee set is on track for Thursday.", age: 2, time: "10:04" },
  { conversationId: "grp-house-design", authorId: "tara", body: "Arjun, once the copy lands the festive creatives are all yours.", age: 1, time: "12:25" },

  /* BluHeat war room */
  { conversationId: "grp-bluheat", authorId: "lucky", body: "Putting everyone on BluHeat in one room so we stop repeating ourselves.", age: 9, time: "11:00" },
  { conversationId: "grp-bluheat", authorId: "anubhav", body: "Spend is ₹66,667 for the last 30 days. Shopify net sales ₹100,000. That is 1.50 actual ROAS.", age: 5, time: "15:10" },
  { conversationId: "grp-bluheat", authorId: "bhupes", body: "Meta is reporting higher than Shopify again. Always trust Shopify.", age: 5, time: "15:22" },
  { conversationId: "grp-bluheat", authorId: "vikram", body: "New videos are with Rahul. First cut tomorrow.", age: 4, time: "10:44" },
  { conversationId: "grp-bluheat", authorId: "rahul", body: "First cut is up. Hook is the change you asked for.", age: 1, time: "16:30" },
  { conversationId: "grp-bluheat", authorId: "lucky", body: "Started a huddle", age: 1, time: "16:35", system: true },

  /* Festive launch */
  { conversationId: "grp-festive", authorId: "lucky", body: "Festive sale goes live in two weeks. We need scripts, videos and creatives ready a week before.", age: 14, time: "09:00" },
  { conversationId: "grp-festive", authorId: "kavya", body: "Kurta and lehenga scripts are done and approved.", age: 6, time: "14:12" },
  { conversationId: "grp-festive", authorId: "arjun", body: "8 festive creatives in progress, 4 done.", age: 2, time: "11:50" },
  { conversationId: "grp-festive", authorId: "om", body: "Once they land I will put them live on Meta the same day.", age: 2, time: "11:58" },

  /* Direct chats */
  { conversationId: directConversationId("lucky", "om"), authorId: "lucky", body: "Can you check Yeoul CPM today? It looked high yesterday.", age: 1, time: "09:40" },
  { conversationId: directConversationId("lucky", "om"), authorId: "om", body: "Looking now. It settled overnight, back to normal.", age: 1, time: "09:52" },
  { conversationId: directConversationId("lucky", "om"), authorId: "lucky", body: "Perfect, thanks.", age: 1, time: "09:53" },

  { conversationId: directConversationId("lucky", "meera"), authorId: "lucky", body: "How are the BluHeat scripts looking?", age: 1, time: "11:05" },
  { conversationId: directConversationId("lucky", "meera"), authorId: "meera", body: "Kavya finished them yesterday. Vikram has the video side.", age: 1, time: "11:09" },
  { conversationId: directConversationId("lucky", "meera"), authorId: "lucky", body: "Great. Ping me if it slips.", age: 1, time: "11:10" },

  { conversationId: directConversationId("vikram", "rahul"), authorId: "vikram", body: "VID-26-09-014 is yours. Five videos, 9:16, Meta.", age: 2, time: "10:02" },
  { conversationId: directConversationId("vikram", "rahul"), authorId: "rahul", body: "On it. Raw footage link works.", age: 2, time: "10:06" },

  { conversationId: directConversationId("tara", "arjun"), authorId: "tara", body: "Festive creatives are yours once the copy is in. Eight of them.", age: 2, time: "11:15" },
  { conversationId: directConversationId("tara", "arjun"), authorId: "arjun", body: "Ready when the copy lands.", age: 2, time: "11:18" },

  { conversationId: directConversationId("anubhav", "rahul"), authorId: "anubhav", body: "Please change the opening hook, first two seconds are slow.", age: 1, time: "16:40" },
  { conversationId: directConversationId("anubhav", "rahul"), authorId: "rahul", body: "Done. Uploading the new version now.", age: 0, time: "10:15" },

  { conversationId: directConversationId("om", "kavya"), authorId: "om", body: "Do you have the Yeoul serum ad copy ready? Arjun needs it for the creatives.", age: 1, time: "12:30" },
  { conversationId: directConversationId("om", "kavya"), authorId: "kavya", body: "Yes, sharing it in the content room today.", age: 1, time: "12:35" },
];

export const initialMessages: ChatMessage[] = seeds.map((s, i) => ({
  id: `msg-${i + 1}`,
  conversationId: s.conversationId,
  authorId: s.authorId,
  body: s.body,
  createdAt: addDays(DEMO_TODAY, -s.age),
  createdTime: s.time,
  system: s.system,
}));
