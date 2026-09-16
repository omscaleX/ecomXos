import type { Brand, BrandSummary, Platform, User } from "@/types";
import { findBrandInText } from "@/data/brands";
import { users } from "@/data/users";
import {
  buildAIContext,
  type AIAnswer,
  type AIContext,
  type AIRequestContext,
} from "@/lib/ai/aiContext";
import * as R from "@/lib/ai/aiResponses";

/**
 * Deterministic demo AI engine.
 *
 * There is no LLM here. The engine classifies the question with simple
 * keyword rules, resolves the brand / person / platform it refers to (using
 * the page context and the conversation history for follow-ups), and then
 * fills a response template from the permission-scoped AIContext.
 *
 * When a real model is connected later, this file becomes the tool router:
 * the same intents map to backend tools (getAgencySummary, getBrandPerformance,
 * getBrandTasks, …) that check permissions before returning data.
 */

const has = (q: string, ...needles: string[]) => needles.some((n) => q.includes(n));

function normalise(question: string): string {
  return question
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s?%-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findUserInText(q: string): User | undefined {
  return users.find((u) => new RegExp(`\\b${u.name.toLowerCase()}s?\\b`).test(q));
}

function findPlatformInText(q: string): Platform | undefined {
  const meta = has(q, "meta", "facebook", "instagram");
  const google = has(q, "google", "search ads", "pmax", "performance max");
  if (meta && !google) return "meta";
  if (google && !meta) return "google";
  return undefined;
}

function summaryFor(ctx: AIContext, brand?: Brand): BrandSummary | undefined {
  if (!brand) return undefined;
  return ctx.summaries.find((s) => s.brand.id === brand.id);
}

/** Is this a short follow-up that relies on the previous answer? */
function isFollowUp(q: string): boolean {
  const words = q.replace("?", "").trim().split(" ");
  return (
    words.length <= 6 &&
    (has(q, "why", "what should we do", "what should i do", "what next", "how do we fix", "how to fix", "and google", "and meta", "what about", "tell me more", "more detail", "how", "fix it", "next steps"))
  );
}

function refersToSelf(q: string): boolean {
  return /\b(i|me|my|myself)\b/.test(q);
}

/** Resolve which brand the question is about. */
function resolveBrand(q: string, ctx: AIContext): { brand?: Brand; outOfScope?: Brand } {
  const mentioned = findBrandInText(q);
  if (mentioned) {
    const visible = ctx.visibleBrands.find((b) => b.id === mentioned.id);
    return visible ? { brand: visible } : { outOfScope: mentioned };
  }
  const usesPronoun = has(q, "this brand", " it ", " it?", "its ", "here", "this one") || q.endsWith(" it");
  if (ctx.currentBrand && (usesPronoun || isFollowUp(q) || !has(q, "agency", "all brands", "brands", "team", "portfolio", "we ", "our"))) {
    return { brand: ctx.currentBrand };
  }
  if (isFollowUp(q) && ctx.lastSubjectBrandId) {
    const last = ctx.visibleBrands.find((b) => b.id === ctx.lastSubjectBrandId);
    if (last) return { brand: last };
  }
  return {};
}

export function answerQuestion(question: string, request: AIRequestContext): AIAnswer {
  const ctx = buildAIContext(request);
  const q = ` ${normalise(question)} `;
  const { brand, outOfScope } = resolveBrand(q, ctx);
  const s = summaryFor(ctx, brand);
  const platform = findPlatformInText(q) ?? (isFollowUp(q) ? ctx.currentPlatform : undefined);
  const person = findUserInText(q);

  // Brand mentioned but not in the user's scope.
  if (outOfScope) {
    return {
      content: `${outOfScope.name} isn't one of your brands, so I can't show its data here. Your brands are ${ctx.visibleBrands.map((b) => b.name).join(", ")}.`,
      actions: [{ label: "View My Brands", href: "/brands" }],
    };
  }

  // Greetings / help
  if (/^\s*(hi|hello|hey|good morning|good evening)\b/.test(q)) return R.greeting(ctx);
  if (has(q, "what can you do", "help me", "what do you know", "how can you help")) return R.help(ctx);

  // Do not invent campaign / keyword / creative level performance.
  if (
    has(q, "campaign", "ad set", "adset", "keyword", "search term", "creative", "audience", "placement") &&
    has(q, "which", "best", "worst", "top", "perform", "why", "how is", "how are", "should", "scale", "pause", "fatigue")
  ) {
    return R.noCampaignData(ctx, s);
  }

  // Brand count
  if (has(q, "how many brands", "number of brands", "brands do we manage", "brands do i manage")) return R.brandCount(ctx);

  // Follow-up: "why?" about the last brand
  if (s && has(q, "why", "reason", "what is wrong", "whats wrong", "what happened")) return R.whyBrandBelowTarget(s, ctx);

  // Follow-up / brand: "what should we do / check"
  if (s && has(q, "what should we do", "what should i do", "what should we check", "what to check", "what next", "next steps", "how do we fix", "how to fix", "fix it", "recommend", "suggest", "improve")) {
    return R.whatToDoForBrand(s, ctx);
  }

  // Compare Meta and Google (brand or portfolio)
  if (has(q, "meta") && has(q, "google") && has(q, "compare", " vs ", "versus", "against", "difference", "or google", "or meta")) {
    if (s) return R.compareMetaGoogle(s, ctx);
    return R.platformSpendCompare(ctx);
  }
  if (has(q, "which platform", "which channel", "more spend", "spend more", "platform has")) return R.platformSpendCompare(ctx, s);

  // Platform spend / performance
  if (platform && has(q, "spend", "spent", "spending", "budget", "cost")) return R.platformSpend(platform, ctx, s);
  if (platform && has(q, "perform", "doing", "how is", "hows", "metrics", "results", "ctr", "cpc", "cpm", "purchases", "conversions")) {
    return R.platformPerformance(platform, ctx, s);
  }

  // Team member questions
  if (has(q, "team member", "who has", "which person", "whose") && has(q, "overdue", "late", "behind")) {
    if (!ctx.isManager) return R.notAllowedAboutOthers();
    return R.mostOverdueMember(ctx);
  }
  if (has(q, "workload", "team load", "how busy", "team capacity")) {
    if (!ctx.isManager) return R.notAllowedAboutOthers();
    return R.teamWorkload(ctx);
  }

  // Tasks
  if (has(q, "overdue", "late tasks", "past due")) return R.overdueTasks(ctx);
  if (has(q, "blocked")) return R.blockedTasks(ctx);
  if (has(q, "task")) {
    if (s && !person) return R.brandTasks(s, ctx);
    if (person && person.id !== ctx.user.id) {
      if (!ctx.isManager) return R.notAllowedAboutOthers();
      return R.tasksForUser(person, ctx);
    }
    if (has(q, "my task", "show my", "show me my") || refersToSelf(q)) return R.tasksForUser(ctx.user, ctx);
    if (ctx.isManager) return R.overdueTasks(ctx);
    return R.tasksForUser(ctx.user, ctx);
  }

  // Focus / priorities for a person
  if (has(q, "focus", "work on", "priorit", "review today", "check today", "look at today", "should i do", "should i check", "should we review", "should we check", "to do today", "start with", "plan for today", "what should")) {
    if (person && person.id !== ctx.user.id) {
      if (!ctx.isManager) return R.notAllowedAboutOthers();
      return R.focusForUser(person, ctx);
    }
    if (s && !refersToSelf(q) && !has(q, "today")) return R.whatToDoForBrand(s, ctx);
    return R.focusForUser(ctx.user, ctx);
  }

  // Problems
  if (has(q, "biggest problem", "problems", "issues", "whats wrong", "what is wrong", "concerns", "risks")) return R.biggestProblems(ctx);

  // Agency summary
  if (has(q, "agency performing", "how is the agency", "hows the agency", "summar", "overview", "how are we doing", "how are we performing", "state of the agency", "agency doing", "big picture", "how are my brands", "how are things")) {
    return R.agencySummary(ctx);
  }

  // Sales reversals: returns, refunds, cancellations
  if (has(q, "return", "returns", "refund", "reversal", "cancelled", "canceled", "cancellation", "sent back", "came back", "rto")) {
    return R.returnsSummary(ctx, s);
  }

  // The two sales figures: Meta-reported vs Shopify
  if (
    has(q, "meta") &&
    has(q, "sales", "revenue", "purchase value", "reported") &&
    has(q, "shopify", "vs", "versus", "compare", "different", "differ", "match", "doesnt match", "does not match", "gap")
  ) {
    return R.salesSourceComparison(ctx, s);
  }
  if (has(q, "two sales", "both sales", "sales figures", "sales numbers", "which sales number", "sales source")) {
    return R.salesSourceComparison(ctx, s);
  }

  // Sales (Shopify)
  if (has(q, "highest sales", "most sales", "highest shopify", "most shopify", "top selling", "highest net sales", "biggest seller", "sells the most")) return R.highestSales(ctx);
  if (has(q, "sales", "shopify", "orders", "sold", "selling", "aov", "order value")) return R.shopifySales(ctx, s);

  // ROAS / targets
  if (s && has(q, "target") && !has(q, "below", "under", "gap", "miss")) return R.brandTarget(s, ctx);
  if (has(q, "biggest gap", "largest gap", "furthest from target", "farthest from target", "most below")) return R.biggestGap(ctx);
  if (has(q, "below target", "under target", "not on track", "missing target", "behind target", "off target", "below their target", "below its target", "under performing", "underperforming")) {
    if (s) return R.whyBrandBelowTarget(s, ctx);
    return R.belowTargetList(ctx);
  }
  if (has(q, "on track", "above target", "hitting target", "meeting target", "over target", "ahead of target")) return R.onTrackList(ctx);
  if (has(q, "most attention", "needs attention", "need attention", "worst", "most concerning", "struggling", "weakest", "biggest concern", "attention")) {
    if (s && !has(q, "which")) return R.whyBrandBelowTarget(s, ctx);
    return R.brandNeedsAttention(ctx);
  }
  if (has(q, "performing best", "best performing", "best brand", "top brand", "strongest", "performing well", "doing best", "best roas", "highest roas")) return R.bestBrand(ctx);
  if (has(q, "compare", "rank", "ranking", "side by side")) return R.compareBrands(ctx);
  if (has(q, "roas")) {
    if (s) return R.brandROAS(s, ctx);
    return R.actualROAS(ctx);
  }
  if (has(q, "ad spend", "total spend", "spending", "how much are we spending", "how much did we spend", "spend")) {
    if (s) return R.platformSpendCompare(ctx, s);
    return R.totalAdSpend(ctx);
  }
  if (has(q, "target")) return R.belowTargetList(ctx);
  if (has(q, "team")) {
    if (!ctx.isManager) return R.notAllowedAboutOthers();
    return R.teamWorkload(ctx);
  }

  // Person only, e.g. "Om?" or "What about Sagar"
  if (person && person.id !== ctx.user.id) {
    if (!ctx.isManager) return R.notAllowedAboutOthers();
    return R.focusForUser(person, ctx);
  }

  // Brand only, e.g. "Yeoul" or "How is Yeoul doing?"
  if (s) return R.brandOverview(s, ctx);

  // Brands in general
  if (has(q, "brands", "brand")) return R.compareBrands(ctx);

  return R.fallback(ctx);
}
