import type { Brand, BrandSummary, Platform, Task, User } from "@/types";
import { usersById } from "@/data/users";
import { brands, brandsById } from "@/data/brands";
import {
  formatCurrency,
  formatDueDate,
  formatGap,
  formatNumber,
  formatPercent,
  formatROAS,
  pluralize,
  TARGET_STATUS_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/formatters";
import { isBlocked, isDueToday, isOverdue, sortTasks } from "@/lib/tasks";
import { getBrandWithHighestSales } from "@/lib/calculations";
import { canViewPlatform } from "@/lib/permissions";
import type { AIAction, AIAnswer, AIContext } from "@/lib/ai/aiContext";

/**
 * Response templates for the demo AI engine.
 *
 * Every number here is read from the AIContext, which is built from the
 * same analytics functions as the dashboards. Nothing is invented.
 */

const PLATFORM_LABEL: Record<Platform, string> = { meta: "Meta", google: "Google" };

function money(value: number, currency: Brand["currency"]) {
  return formatCurrency(value, currency);
}

/** Unit costs such as CPC always show decimals. */
function unitCost(value: number, currency: Brand["currency"]) {
  return formatCurrency(value, currency, 2);
}

const STATUS_PHRASE: Record<BrandSummary["status"], string> = {
  on_track: "on track",
  attention: "needs attention",
  below_target: "below target",
};

function pct(value: number) {
  return `${Math.round(Math.abs(value) * 100)}%`;
}

export function brandActions(brand: Brand, ctx: AIContext, extra: AIAction[] = []): AIAction[] {
  const actions: AIAction[] = [{ label: "Open Brand", href: `/brands/${brand.id}` }];
  if (canViewPlatform(ctx.user, "meta")) actions.push({ label: "View Meta", href: `/brands/${brand.id}?tab=meta` });
  if (canViewPlatform(ctx.user, "google")) actions.push({ label: "View Google", href: `/brands/${brand.id}?tab=google` });
  actions.push({ label: "View Tasks", href: `/brands/${brand.id}?tab=tasks` });
  return [...actions, ...extra];
}

function targetLine(s: BrandSummary) {
  return `${s.brand.name} — ${formatROAS(s.actualROAS)} vs ${formatROAS(s.targetROAS)} (${TARGET_STATUS_LABEL[s.status]})`;
}

function scopeWord(ctx: AIContext) {
  return ctx.isManager ? "" : " in your brands";
}

export function greeting(ctx: AIContext): AIAnswer {
  return {
    content: `Hi ${ctx.user.name}. I can answer questions about ${ctx.isManager ? "the agency, brands, targets, tasks and the team" : "your brands, your tasks and targets"}. Try "What should I focus on today?"`,
  };
}

export function help(ctx: AIContext): AIAnswer {
  return {
    content:
      `I work from the same data as the dashboards. You can ask me about:\n` +
      `- Brand performance and Actual ROAS (Shopify Net Sales ÷ total ad spend)\n` +
      `- Targets and which brands are below target\n` +
      `- Tasks: overdue, blocked and what to focus on today\n` +
      (ctx.isManager ? `- Team workload\n` : "") +
      `- ${ctx.visiblePlatforms.map((p) => PLATFORM_LABEL[p]).join(" and ")} performance and spend\n` +
      `- Shopify Net Sales and orders`,
  };
}

export function brandNeedsAttention(ctx: AIContext): AIAnswer {
  const worst = ctx.agency.mainConcern;
  if (!worst) {
    return {
      content: `No brand${scopeWord(ctx)} is below target right now. All ${ctx.visibleBrands.length} are on track.`,
      actions: [{ label: "View Targets", href: ctx.isManager ? "/targets" : "/brands" }],
    };
  }
  const others = ctx.agency.belowTarget.filter((s) => s.brand.id !== worst.brand.id);
  const platforms = ctx.visiblePlatforms.map((p) => PLATFORM_LABEL[p]).join(" and ");
  return {
    content:
      `**${worst.brand.name}** needs the most attention${scopeWord(ctx)}.\n\n` +
      `Actual ROAS: ${formatROAS(worst.actualROAS)}\n` +
      `Target: ${formatROAS(worst.targetROAS)}\n` +
      `Gap: ${formatGap(worst.gap)}\n\n` +
      `It is about ${pct(worst.gapPercent)} below target.\n\n` +
      `I'd review the ${platforms} campaigns before increasing spend.` +
      (others.length
        ? `\n\nAlso under target: ${others.map((s) => `${s.brand.name} (${formatROAS(s.actualROAS)} vs ${formatROAS(s.targetROAS)})`).join(", ")}.`
        : ""),
    actions: brandActions(worst.brand, ctx),
    subjectBrandId: worst.brand.id,
  };
}

export function belowTargetList(ctx: AIContext): AIAnswer {
  const list = ctx.agency.belowTarget;
  if (!list.length) {
    return { content: `No brands${scopeWord(ctx)} are below target. Everything is on track.` };
  }
  const strictly = list.filter((s) => s.status === "below_target").length;
  return {
    content:
      `${pluralize(list.length, "brand")} ${list.length === 1 ? "is" : "are"} under target${scopeWord(ctx)}` +
      (strictly ? ` (${strictly} clearly below, ${list.length - strictly} needing attention)` : "") +
      `:\n\n` +
      list.map((s) => `- ${targetLine(s)}`).join("\n") +
      `\n\nActual ROAS is Shopify Net Sales ÷ total ad spend.`,
    actions: [
      ...(ctx.isManager ? [{ label: "View Targets", href: "/targets" }] : []),
      { label: "Open Brand", href: `/brands/${list[0].brand.id}` },
    ],
    subjectBrandId: list[0].brand.id,
  };
}

export function onTrackList(ctx: AIContext): AIAnswer {
  const list = ctx.agency.onTrack;
  if (!list.length) {
    return {
      content: `No brands${scopeWord(ctx)} are on track right now. The closest is ${ctx.agency.belowTarget.at(-1)?.brand.name ?? "—"}.`,
      actions: ctx.isManager ? [{ label: "View Targets", href: "/targets" }] : [],
    };
  }
  return {
    content:
      `${pluralize(list.length, "brand")} ${list.length === 1 ? "is" : "are"} on track${scopeWord(ctx)}:\n\n` +
      list.map((s) => `- ${s.brand.name} — ${formatROAS(s.actualROAS)} vs ${formatROAS(s.targetROAS)} (${formatGap(s.gap)})`).join("\n"),
    actions: [{ label: "Open Brand", href: `/brands/${list[0].brand.id}` }],
    subjectBrandId: list[0].brand.id,
  };
}

export function agencySummary(ctx: AIContext): AIAnswer {
  const a = ctx.agency;
  const scopeLabel = ctx.isManager ? "Agency summary" : `Summary for your ${a.totalBrands} brands`;
  const portfolioLines = a.portfolios
    .map(
      (p) =>
        `**${p.label}** (${pluralize(p.brandCount, "brand")})\n` +
        `Total Ad Spend: ${money(p.totalSpend, p.currency)}\n` +
        `Shopify Net Sales: ${money(p.netSales, p.currency)}\n` +
        `Actual ROAS: ${formatROAS(p.actualROAS)}`,
    )
    .join("\n\n");
  const concern = a.mainConcern
    ? `**Main concern:** ${a.mainConcern.brand.name} — ${formatROAS(a.mainConcern.actualROAS)} vs target ${formatROAS(a.mainConcern.targetROAS)} (${pct(a.mainConcern.gapPercent)} below).`
    : `**Main concern:** none — all brands are on track.`;
  const strongest = a.strongestBrand
    ? `**Strongest brand:** ${a.strongestBrand.brand.name} — ${formatROAS(a.strongestBrand.actualROAS)} vs target ${formatROAS(a.strongestBrand.targetROAS)}.`
    : "";
  return {
    content:
      `**${scopeLabel}**\n\n` +
      `Total Brands: ${a.totalBrands}\n\n` +
      portfolioLines +
      `\n\nBrands Below Target: ${a.belowTarget.length}\n` +
      `Brands On Track: ${a.onTrack.length}\n` +
      `Open Tasks: ${a.openTasks}\n` +
      `Overdue Tasks: ${a.overdueTasks}\n\n` +
      `${concern}\n${strongest}` +
      (a.portfolios.length > 1 ? `\n\nINR and AED totals are shown separately and are not combined.` : ""),
    actions: [
      { label: "View Dashboard", href: "/dashboard" },
      ...(a.mainConcern ? [{ label: "Open Brand", href: `/brands/${a.mainConcern.brand.id}` }] : []),
      ...(ctx.isManager ? [{ label: "Generate Report", href: "/reports" }] : []),
    ],
    subjectBrandId: a.mainConcern?.brand.id,
  };
}

export function bestBrand(ctx: AIContext): AIAnswer {
  const best = ctx.agency.strongestBrand;
  if (!best) return { content: "I don't have any brand data in your view." };
  return {
    content:
      `**${best.brand.name}** is performing best${scopeWord(ctx)}.\n\n` +
      `Actual ROAS: ${formatROAS(best.actualROAS)}\n` +
      `Target: ${formatROAS(best.targetROAS)}\n` +
      `Gap: ${formatGap(best.gap)}\n` +
      `Shopify Net Sales: ${money(best.netSales, best.currency)} on ${money(best.totalSpend, best.currency)} ad spend.\n\n` +
      (best.status === "on_track"
        ? `It is the only brand above target, so it is a candidate for careful scaling.`
        : `It is still slightly under target, so I would not scale spend yet.`),
    actions: brandActions(best.brand, ctx),
    subjectBrandId: best.brand.id,
  };
}

export function biggestGap(ctx: AIContext): AIAnswer {
  const worst = ctx.agency.mainConcern;
  if (!worst) return { content: `No brands${scopeWord(ctx)} are below target.` };
  return {
    content:
      `**${worst.brand.name}** has the biggest gap from target.\n\n` +
      `Actual ROAS ${formatROAS(worst.actualROAS)} vs target ${formatROAS(worst.targetROAS)} — a gap of ${formatGap(worst.gap)}, about ${pct(worst.gapPercent)} below.`,
    actions: brandActions(worst.brand, ctx),
    subjectBrandId: worst.brand.id,
  };
}

function averageOf(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function whyBrandBelowTarget(s: BrandSummary, ctx: AIContext): AIAnswer {
  if (s.status === "on_track") {
    return {
      content:
        `${s.brand.name} is not below target. Actual ROAS is ${formatROAS(s.actualROAS)} against a target of ${formatROAS(s.targetROAS)} (${formatGap(s.gap)}).`,
      actions: brandActions(s.brand, ctx),
      subjectBrandId: s.brand.id,
    };
  }
  const peers = ctx.summaries.filter((p) => p.currency === s.currency && p.brand.id !== s.brand.id);
  const reasons: string[] = [];
  if (canViewPlatform(ctx.user, "meta")) {
    const avgCpc = averageOf(peers.map((p) => p.meta.cpc));
    const avgCtr = averageOf(peers.map((p) => p.meta.ctr));
    if (avgCpc && s.meta.cpc > avgCpc * 1.25) {
      reasons.push(`Meta CPC is ${unitCost(s.meta.cpc, s.currency)} vs about ${unitCost(avgCpc, s.currency)} for the other ${s.brand.market} brands.`);
    }
    if (avgCtr && s.meta.ctr < avgCtr * 0.8) {
      reasons.push(`Meta CTR is ${formatPercent(s.meta.ctr)} vs about ${formatPercent(avgCtr)} for peers, which points to creative fatigue.`);
    }
    if (s.meta.reportedROAS < 2.2) {
      reasons.push(`Even Meta's own reported ROAS is only ${formatROAS(s.meta.reportedROAS)}, so the campaigns are weak on the platform side too.`);
    }
  }
  if (canViewPlatform(ctx.user, "google")) {
    const avgCpc = averageOf(peers.map((p) => p.google.cpc));
    if (avgCpc && s.google.cpc > avgCpc * 1.25) {
      reasons.push(`Google CPC is ${unitCost(s.google.cpc, s.currency)} vs about ${unitCost(avgCpc, s.currency)} for peers.`);
    }
  }
  const orders = `Shopify shows ${formatNumber(s.orders)} orders and ${money(s.netSales, s.currency)} net sales on ${money(s.totalSpend, s.currency)} total ad spend.`;
  const openTasks = ctx.visibleTasks.filter((t) => t.brandId === s.brand.id && t.status !== "completed");
  const overdue = openTasks.filter((t) => isOverdue(t, ctx.today));

  return {
    content:
      `${s.brand.name} ${s.status === "attention" ? "needs attention" : "is below target"} because its Actual ROAS is ${formatROAS(s.actualROAS)} against a target of ${formatROAS(s.targetROAS)} — ${pct(s.gapPercent)} below.\n\n` +
      orders +
      (reasons.length ? `\n\nWhat the data shows:\n${reasons.map((r) => `- ${r}`).join("\n")}` : "") +
      (openTasks.length
        ? `\n\n${pluralize(openTasks.length, "open task")} on this brand${overdue.length ? `, ${overdue.length} overdue` : ""}.`
        : ""),
    actions: brandActions(s.brand, ctx),
    subjectBrandId: s.brand.id,
  };
}

export function whatToDoForBrand(s: BrandSummary, ctx: AIContext): AIAnswer {
  const steps: string[] = [];
  if (s.status === "on_track") {
    steps.push("Keep the current structure and scale the best campaign by 10–20% at a time.");
    steps.push("Watch Actual ROAS daily after each budget change.");
  } else {
    if (canViewPlatform(ctx.user, "meta")) {
      steps.push(`Review Meta campaign performance, CPC (${unitCost(s.meta.cpc, s.currency)}) and CTR (${formatPercent(s.meta.ctr)}).`);
      steps.push("Check creative performance and pause fatigued ads before adding budget.");
    }
    if (canViewPlatform(ctx.user, "google")) {
      steps.push(`Review Google search terms and CPC (${unitCost(s.google.cpc, s.currency)}); add negatives where needed.`);
    }
    steps.push("Check the Shopify conversion rate and AOV before increasing spend.");
    steps.push("Do not increase spend until Actual ROAS moves back toward target.");
  }
  const tasks = sortTasks(ctx.visibleTasks.filter((t) => t.brandId === s.brand.id && t.status !== "completed"), ctx.today);
  return {
    content:
      `For ${s.brand.name} I'd:\n\n` +
      steps.map((st, i) => `${i + 1}. ${st}`).join("\n") +
      (tasks.length
        ? `\n\nOpen tasks on this brand:\n${tasks.slice(0, 4).map((t) => `- ${t.title} · ${usersById[t.assigneeId].name} · ${formatDueDate(t.dueDate, ctx.today)}`).join("\n")}`
        : ""),
    actions: brandActions(s.brand, ctx),
    subjectBrandId: s.brand.id,
  };
}

export function brandOverview(s: BrandSummary, ctx: AIContext): AIAnswer {
  return {
    content:
      `**${s.brand.name}** — ${TARGET_STATUS_LABEL[s.status]}\n\n` +
      `Total Ad Spend: ${money(s.totalSpend, s.currency)}\n` +
      `Shopify Net Sales: ${money(s.netSales, s.currency)}\n` +
      `Orders: ${formatNumber(s.orders)}\n` +
      `Actual ROAS: ${formatROAS(s.actualROAS)} (target ${formatROAS(s.targetROAS)}, ${formatGap(s.gap)})`,
    actions: brandActions(s.brand, ctx),
    subjectBrandId: s.brand.id,
  };
}

export function brandROAS(s: BrandSummary, ctx: AIContext): AIAnswer {
  return {
    content:
      `${s.brand.name}'s Actual ROAS is **${formatROAS(s.actualROAS)}**.\n\n` +
      `${money(s.netSales, s.currency)} Shopify Net Sales ÷ ${money(s.totalSpend, s.currency)} total ad spend (Meta ${money(s.metaSpend, s.currency)} + Google ${money(s.googleSpend, s.currency)}).\n\n` +
      `Target is ${formatROAS(s.targetROAS)}, so it ${s.status === "attention" ? "" : "is "}${STATUS_PHRASE[s.status]} (${formatGap(s.gap)}).`,
    actions: brandActions(s.brand, ctx),
    subjectBrandId: s.brand.id,
  };
}

export function brandTarget(s: BrandSummary, ctx: AIContext): AIAnswer {
  return {
    content: `${s.brand.name}'s ROAS target is **${formatROAS(s.targetROAS)}**. Actual ROAS is ${formatROAS(s.actualROAS)} (${formatGap(s.gap)}), which means it ${s.status === "attention" ? "" : "is "}${STATUS_PHRASE[s.status]}.`,
    actions: brandActions(s.brand, ctx, ctx.isManager ? [{ label: "Edit Target", href: "/targets" }] : []),
    subjectBrandId: s.brand.id,
  };
}

export function actualROAS(ctx: AIContext): AIAnswer {
  const lines = ctx.portfolios.map(
    (p) =>
      `**${p.label}** — Actual ROAS ${formatROAS(p.actualROAS)}\n${money(p.netSales, p.currency)} Shopify Net Sales ÷ ${money(p.totalSpend, p.currency)} total ad spend`,
  );
  return {
    content:
      lines.join("\n\n") +
      `\n\nActual ROAS uses Shopify Net Sales, not Meta or Google reported revenue.` +
      (ctx.portfolios.length > 1 ? ` INR and AED are kept separate.` : ""),
    actions: [{ label: "View Performance", href: "/performance" }],
  };
}

export function totalAdSpend(ctx: AIContext): AIAnswer {
  const lines = ctx.portfolios.map(
    (p) =>
      `**${p.label}**: ${money(p.totalSpend, p.currency)} (Meta ${money(p.metaSpend, p.currency)} + Google ${money(p.googleSpend, p.currency)})`,
  );
  return {
    content: `Total ad spend for the last 30 days${scopeWord(ctx)}:\n\n${lines.join("\n")}` + (ctx.portfolios.length > 1 ? `\n\nINR and AED are not combined.` : ""),
    actions: [{ label: "View Performance", href: "/performance" }],
  };
}

export function brandCount(ctx: AIContext): AIAnswer {
  const list = ctx.visibleBrands.map((b) => b.name).join(", ");
  return {
    content: ctx.isManager
      ? `We manage **${brands.length} brands**: ${list}. Five are in India (INR) and one is in Dubai (AED).`
      : `You are responsible for **${ctx.visibleBrands.length} brands**: ${list}.`,
    actions: [{ label: "View Brands", href: "/brands" }],
  };
}

export function compareBrands(ctx: AIContext): AIAnswer {
  const sorted = [...ctx.summaries].sort((a, b) => b.gapPercent - a.gapPercent);
  return {
    content:
      `Brands ranked by gap to target${scopeWord(ctx)}:\n\n` +
      sorted
        .map(
          (s, i) =>
            `${i + 1}. ${s.brand.name} — ROAS ${formatROAS(s.actualROAS)} vs ${formatROAS(s.targetROAS)} (${formatGap(s.gap)}) · Net Sales ${money(s.netSales, s.currency)} · Spend ${money(s.totalSpend, s.currency)}`,
        )
        .join("\n") +
      `\n\nDesiVidesi - Dubai is in AED and is compared on ROAS only.`,
    actions: [{ label: "View Performance", href: "/performance" }, ...(ctx.isManager ? [{ label: "View Targets", href: "/targets" }] : [])],
    subjectBrandId: sorted.at(-1)?.brand.id,
  };
}

function taskLine(t: Task, ctx: AIContext, withAssignee = true) {
  const brand = brandsById[t.brandId].name;
  const who = withAssignee ? ` · ${usersById[t.assigneeId].name}` : "";
  return `- ${t.title} · ${brand}${who} · ${formatDueDate(t.dueDate, ctx.today)} · ${TASK_STATUS_LABEL[t.status]}`;
}

export function overdueTasks(ctx: AIContext): AIAnswer {
  const list = sortTasks(ctx.visibleTasks.filter((t) => isOverdue(t, ctx.today)), ctx.today);
  if (!list.length) return { content: "No overdue tasks. You're all caught up.", actions: [{ label: "View Tasks", href: "/tasks" }] };
  return {
    content: `${pluralize(list.length, "overdue task")}:\n\n${list.map((t) => taskLine(t, ctx, ctx.isManager)).join("\n")}`,
    actions: [{ label: "View Overdue Tasks", href: "/tasks?view=overdue" }],
  };
}

export function blockedTasks(ctx: AIContext): AIAnswer {
  const list = ctx.visibleTasks.filter(isBlocked);
  if (!list.length) return { content: "No blocked tasks right now." };
  return {
    content: `${pluralize(list.length, "blocked task")}:\n\n${list.map((t) => taskLine(t, ctx, ctx.isManager) + (t.notes ? `\n  ${t.notes}` : "")).join("\n")}`,
    actions: [{ label: "View Blocked Tasks", href: "/tasks?status=blocked" }],
  };
}

export function tasksForUser(target: User, ctx: AIContext): AIAnswer {
  const list = sortTasks(ctx.visibleTasks.filter((t) => t.assigneeId === target.id && t.status !== "completed"), ctx.today);
  const who = target.id === ctx.user.id ? "You have" : `${target.name} has`;
  if (!list.length) return { content: `${who} no open tasks.` };
  const overdue = list.filter((t) => isOverdue(t, ctx.today)).length;
  return {
    content:
      `${who} ${pluralize(list.length, "open task")}${overdue ? ` (${overdue} overdue)` : ""}:\n\n` +
      list.map((t) => taskLine(t, ctx, false)).join("\n"),
    actions: [{ label: "View Tasks", href: "/tasks" }],
    subjectUserId: target.id,
  };
}

export function brandTasks(s: BrandSummary, ctx: AIContext): AIAnswer {
  const list = sortTasks(ctx.visibleTasks.filter((t) => t.brandId === s.brand.id && t.status !== "completed"), ctx.today);
  if (!list.length) return { content: `No open tasks for ${s.brand.name}${ctx.isManager ? "" : " assigned to you"}.`, subjectBrandId: s.brand.id };
  return {
    content: `${pluralize(list.length, "open task")} for ${s.brand.name}:\n\n${list.map((t) => taskLine(t, ctx, ctx.isManager)).join("\n")}`,
    actions: [{ label: "View Tasks", href: `/brands/${s.brand.id}?tab=tasks` }],
    subjectBrandId: s.brand.id,
  };
}

export function mostOverdueMember(ctx: AIContext): AIAnswer {
  const ranked = [...ctx.workloads].sort((a, b) => b.overdueTasks - a.overdueTasks || b.openTasks - a.openTasks);
  const top = ranked[0];
  if (!top || top.overdueTasks === 0) return { content: "Nobody has overdue tasks right now." };
  const name = usersById[top.userId].name;
  const overdue = sortTasks(ctx.visibleTasks.filter((t) => t.assigneeId === top.userId && isOverdue(t, ctx.today)), ctx.today);
  return {
    content:
      `**${name}** has the most overdue tasks: ${top.overdueTasks} of ${top.openTasks} open.\n\n` +
      overdue.map((t) => taskLine(t, ctx, false)).join("\n") +
      `\n\nOthers: ${ranked.slice(1).map((w) => `${usersById[w.userId].name} ${w.overdueTasks}`).join(", ")}.`,
    actions: [{ label: "View Team", href: "/team" }, { label: "View Overdue Tasks", href: "/tasks?view=overdue" }],
    subjectUserId: top.userId,
  };
}

export function teamWorkload(ctx: AIContext): AIAnswer {
  return {
    content:
      `Team workload (tasks only, not a performance score):\n\n` +
      ctx.workloads
        .map((w) => `- ${usersById[w.userId].name} — ${w.brandCount} brands · ${w.openTasks} open · ${w.overdueTasks} overdue`)
        .join("\n"),
    actions: [{ label: "View Team", href: "/team" }],
  };
}

export function focusForUser(target: User, ctx: AIContext): AIAnswer {
  const isSelf = target.id === ctx.user.id;
  const brandIds = new Set(
    brands
      .filter((b) => {
        if (target.role === "manager" || target.role === "senior_manager") return true;
        if (target.role === "meta_marketer") return b.metaOwnerId === target.id;
        return b.googleOwnerId === target.id;
      })
      .map((b) => b.id),
  );
  const brandIssues = ctx.summaries
    .filter((s) => brandIds.has(s.brand.id) && s.status !== "on_track")
    .sort((a, b) => a.gapPercent - b.gapPercent);
  const myTasks = sortTasks(
    ctx.visibleTasks.filter((t) => t.status !== "completed" && (target.role === "manager" || target.role === "senior_manager" ? true : t.assigneeId === target.id)),
    ctx.today,
  );
  const overdue = myTasks.filter((t) => isOverdue(t, ctx.today));
  const dueToday = myTasks.filter((t) => isDueToday(t, ctx.today));
  const blocked = myTasks.filter(isBlocked);

  const items: string[] = [];
  if (brandIssues.length) {
    const b = brandIssues[0];
    items.push(`**${b.brand.name}** — Actual ROAS ${formatROAS(b.actualROAS)} vs target ${formatROAS(b.targetROAS)} (${pct(b.gapPercent)} below). ${target.platform ? `Review the ${PLATFORM_LABEL[target.platform]} campaigns first.` : "Review Meta and Google before adding spend."}`);
  }
  if (overdue.length) {
    items.push(`**${pluralize(overdue.length, "overdue task")}** — ${overdue.slice(0, 3).map((t) => `${t.title} (${brandsById[t.brandId].name}${ctx.isManager && !isSelf ? "" : target.role === "manager" ? `, ${usersById[t.assigneeId].name}` : ""})`).join("; ")}.`);
  }
  if (dueToday.length) {
    items.push(`**Due today** — ${dueToday.slice(0, 4).map((t) => `${t.title} (${brandsById[t.brandId].name})`).join("; ")}.`);
  }
  if (blocked.length) {
    items.push(`**Blocked** — ${blocked.map((t) => `${t.title} (${brandsById[t.brandId].name})`).join("; ")}. Unblock or reassign.`);
  }
  if (brandIssues.length > 1) {
    items.push(`**Also watch** — ${brandIssues.slice(1, 4).map((s) => `${s.brand.name} (${formatROAS(s.actualROAS)} vs ${formatROAS(s.targetROAS)})`).join(", ")}.`);
  }
  const onTrack = ctx.summaries.filter((s) => brandIds.has(s.brand.id) && s.status === "on_track");
  if (onTrack.length && target.role !== "google_marketer") {
    items.push(`**Scaling** — ${onTrack.map((s) => s.brand.name).join(", ")} ${onTrack.length === 1 ? "is" : "are"} above target and can be scaled carefully.`);
  }

  const who = isSelf ? "Here's what I'd focus on today" : `Here's what ${target.name} should focus on today`;
  return {
    content:
      `${who}:\n\n` +
      (items.length ? items.map((it, i) => `${i + 1}. ${it}`).join("\n") : "Nothing urgent. All brands are on track and there are no overdue tasks."),
    actions: [
      ...(brandIssues[0] ? [{ label: "Open Brand", href: `/brands/${brandIssues[0].brand.id}` }] : []),
      { label: "View Tasks", href: "/tasks" },
      { label: "View Performance", href: "/performance" },
    ],
    subjectBrandId: brandIssues[0]?.brand.id,
    subjectUserId: target.id,
  };
}

export function biggestProblems(ctx: AIContext): AIAnswer {
  const list = ctx.priorities.slice(0, 6);
  if (!list.length) return { content: "No major problems right now. All brands are on track and no tasks are overdue." };
  return {
    content:
      `The biggest problems right now${scopeWord(ctx)}:\n\n` +
      list.map((p) => `${p.rank}. ${p.title} — ${p.detail}`).join("\n"),
    actions: [
      ...(list[0].brandId ? [{ label: "Open Brand", href: `/brands/${list[0].brandId}` }] : []),
      { label: "View Tasks", href: "/tasks?view=overdue" },
    ],
    subjectBrandId: list.find((p) => p.brandId)?.brandId,
  };
}

export function shopifySales(ctx: AIContext, s?: BrandSummary): AIAnswer {
  if (s) {
    return {
      content: `${s.brand.name} Shopify Net Sales: **${money(s.netSales, s.currency)}** from ${formatNumber(s.orders)} orders (AOV ${money(s.aov, s.currency)}) in the last 30 days.`,
      actions: [{ label: "View Sales", href: `/brands/${s.brand.id}?tab=sales` }],
      subjectBrandId: s.brand.id,
    };
  }
  const lines = ctx.portfolios.map((p) => `**${p.label}**: ${money(p.netSales, p.currency)} Shopify Net Sales from ${formatNumber(p.orders)} orders`);
  const byBrand = ctx.summaries.map((b) => `- ${b.brand.name}: ${money(b.netSales, b.currency)} (${formatNumber(b.orders)} orders)`);
  return {
    content: `${lines.join("\n")}\n\nBy brand:\n${byBrand.join("\n")}\n\nThese are Shopify Net Sales, not platform-reported revenue.`,
    actions: [{ label: "View Sales", href: "/sales" }],
  };
}

export function highestSales(ctx: AIContext): AIAnswer {
  const inr = getBrandWithHighestSales(ctx.summaries.filter((s) => s.currency === "INR"));
  const aed = getBrandWithHighestSales(ctx.summaries.filter((s) => s.currency === "AED"));
  const top = inr ?? aed;
  if (!top) return { content: "I don't have any sales data in your view." };
  return {
    content:
      `**${top.brand.name}** has the highest Shopify Net Sales${scopeWord(ctx)}: ${money(top.netSales, top.currency)} from ${formatNumber(top.orders)} orders.` +
      (inr && aed ? `\n\n${aed.brand.name} is the only AED brand (${money(aed.netSales, "AED")}), so it is not ranked against INR brands.` : ""),
    actions: brandActions(top.brand, ctx),
    subjectBrandId: top.brand.id,
  };
}

export function platformSpendCompare(ctx: AIContext, s?: BrandSummary): AIAnswer {
  if (s) {
    const more = s.metaSpend >= s.googleSpend ? "Meta" : "Google";
    return {
      content:
        `For ${s.brand.name}, **${more}** has more spend.\n\n` +
        `Meta: ${money(s.metaSpend, s.currency)}\nGoogle: ${money(s.googleSpend, s.currency)}\nTotal: ${money(s.totalSpend, s.currency)}`,
      actions: brandActions(s.brand, ctx),
      subjectBrandId: s.brand.id,
    };
  }
  const lines = ctx.portfolios.map((p) => {
    const more = p.metaSpend >= p.googleSpend ? "Meta" : "Google";
    const share = p.totalSpend ? Math.round((Math.max(p.metaSpend, p.googleSpend) / p.totalSpend) * 100) : 0;
    return `**${p.label}**: ${more} has more spend (${share}%). Meta ${money(p.metaSpend, p.currency)} vs Google ${money(p.googleSpend, p.currency)}.`;
  });
  return { content: lines.join("\n\n"), actions: [{ label: "View Performance", href: "/performance" }] };
}

export function compareMetaGoogle(s: BrandSummary, ctx: AIContext): AIAnswer {
  const parts: string[] = [];
  if (canViewPlatform(ctx.user, "meta")) {
    parts.push(`**Meta** — Spend ${money(s.metaSpend, s.currency)} · ${formatNumber(s.meta.purchases)} purchases · CTR ${formatPercent(s.meta.ctr)} · CPC ${unitCost(s.meta.cpc, s.currency)} · Meta-reported ROAS ${formatROAS(s.meta.reportedROAS)}`);
  }
  if (canViewPlatform(ctx.user, "google")) {
    parts.push(`**Google** — Spend ${money(s.googleSpend, s.currency)} · ${formatNumber(s.google.conversions)} conversions · CTR ${formatPercent(s.google.ctr)} · CPC ${unitCost(s.google.cpc, s.currency)} · Google-reported ROAS ${formatROAS(s.google.reportedROAS)}`);
  }
  const hidden = (["meta", "google"] as Platform[]).filter((p) => !canViewPlatform(ctx.user, p));
  return {
    content:
      `${s.brand.name} — Meta vs Google (last 30 days)\n\n` +
      parts.join("\n\n") +
      (hidden.length ? `\n\n${hidden.map((p) => PLATFORM_LABEL[p]).join(", ")} details are outside your view; only total spend is shown.` : "") +
      `\n\n**Business** — Total spend ${money(s.totalSpend, s.currency)} · Shopify Net Sales ${money(s.netSales, s.currency)} · Actual ROAS ${formatROAS(s.actualROAS)}\n\n` +
      `Platform-reported values are not used for Actual ROAS.`,
    actions: brandActions(s.brand, ctx),
    subjectBrandId: s.brand.id,
  };
}

export function platformNotVisible(platform: Platform): AIAnswer {
  const owner = platform === "google" ? "Sagar" : "the Meta team";
  return {
    content: `${PLATFORM_LABEL[platform]} performance isn't part of your view — ${owner} manages ${PLATFORM_LABEL[platform]} Ads for these brands. I can still show total ad spend and Actual ROAS for your brands.`,
    actions: [{ label: "View Performance", href: "/performance" }],
  };
}

export function platformPerformance(platform: Platform, ctx: AIContext, s?: BrandSummary): AIAnswer {
  if (!canViewPlatform(ctx.user, platform)) return platformNotVisible(platform);
  const scope = s ? [s] : ctx.summaries;
  const groups = ctx.portfolios.filter((p) => scope.some((x) => x.currency === p.currency));
  const lines = groups.map((p) => {
    const rows = scope.filter((x) => x.currency === p.currency);
    const spend = rows.reduce((a, x) => a + (platform === "meta" ? x.metaSpend : x.googleSpend), 0);
    const conv = rows.reduce((a, x) => a + (platform === "meta" ? x.meta.purchases : x.google.conversions), 0);
    const value = rows.reduce((a, x) => a + (platform === "meta" ? x.meta.reportedPurchaseValue : x.google.conversionValue), 0);
    const clicks = rows.reduce((a, x) => a + (platform === "meta" ? x.meta.clicks : x.google.clicks), 0);
    const imps = rows.reduce((a, x) => a + (platform === "meta" ? x.meta.impressions : x.google.impressions), 0);
    const label = s ? s.brand.name : p.label;
    return (
      `**${label}**\n` +
      `${PLATFORM_LABEL[platform]} Spend: ${money(spend, p.currency)}\n` +
      `${platform === "meta" ? "Purchases" : "Conversions"}: ${formatNumber(conv)}\n` +
      `${PLATFORM_LABEL[platform]}-reported value: ${money(value, p.currency)} (reported ROAS ${formatROAS(spend ? value / spend : 0)})\n` +
      `CTR ${formatPercent(imps ? clicks / imps : 0)} · CPC ${unitCost(clicks ? spend / clicks : 0, p.currency)}`
    );
  });
  const best = [...scope].sort((a, b) => (platform === "meta" ? b.meta.reportedROAS - a.meta.reportedROAS : b.google.reportedROAS - a.google.reportedROAS))[0];
  const worst = [...scope].sort((a, b) => (platform === "meta" ? a.meta.reportedROAS - b.meta.reportedROAS : a.google.reportedROAS - b.google.reportedROAS))[0];
  return {
    content:
      lines.join("\n\n") +
      (!s && scope.length > 1
        ? `\n\nStrongest on ${PLATFORM_LABEL[platform]}: ${best.brand.name} (reported ROAS ${formatROAS(platform === "meta" ? best.meta.reportedROAS : best.google.reportedROAS)}). Weakest: ${worst.brand.name} (${formatROAS(platform === "meta" ? worst.meta.reportedROAS : worst.google.reportedROAS)}).`
        : "") +
      `\n\nPlatform-reported value is for channel analysis only. Actual ROAS uses Shopify Net Sales.`,
    actions: s ? brandActions(s.brand, ctx) : [{ label: `View ${PLATFORM_LABEL[platform]} Performance`, href: `/performance?platform=${platform}` }],
    subjectBrandId: s?.brand.id,
  };
}

export function platformSpend(platform: Platform, ctx: AIContext, s?: BrandSummary): AIAnswer {
  if (!canViewPlatform(ctx.user, platform)) return platformNotVisible(platform);
  if (s) {
    const spend = platform === "meta" ? s.metaSpend : s.googleSpend;
    return {
      content: `${PLATFORM_LABEL[platform]} spend for ${s.brand.name}: **${money(spend, s.currency)}** in the last 30 days (${Math.round((spend / s.totalSpend) * 100)}% of total ad spend).`,
      actions: brandActions(s.brand, ctx),
      subjectBrandId: s.brand.id,
    };
  }
  const lines = ctx.portfolios.map((p) => `**${p.label}**: ${money(platform === "meta" ? p.metaSpend : p.googleSpend, p.currency)}`);
  const byBrand = ctx.summaries.map((b) => `- ${b.brand.name}: ${money(platform === "meta" ? b.metaSpend : b.googleSpend, b.currency)}`);
  return {
    content: `${PLATFORM_LABEL[platform]} spend, last 30 days${scopeWord(ctx)}:\n\n${lines.join("\n")}\n\nBy brand:\n${byBrand.join("\n")}`,
    actions: [{ label: `View ${PLATFORM_LABEL[platform]} Performance`, href: `/performance?platform=${platform}` }],
  };
}

export function noCampaignData(ctx: AIContext, s?: BrandSummary): AIAnswer {
  const platforms = ctx.visiblePlatforms.map((p) => PLATFORM_LABEL[p]).join(" and ");
  return {
    content:
      `I don't have enough campaign-level data in the current demo to answer that accurately.\n\n` +
      (s
        ? `I can show you the brand-level ${platforms} performance for ${s.brand.name}: total spend ${money(s.totalSpend, s.currency)}, Shopify Net Sales ${money(s.netSales, s.currency)}, Actual ROAS ${formatROAS(s.actualROAS)}.`
        : `I can show you brand-level ${platforms} performance, Shopify Net Sales and Actual ROAS.`),
    actions: s ? brandActions(s.brand, ctx) : [{ label: "View Performance", href: "/performance" }],
    subjectBrandId: s?.brand.id,
  };
}

export function notAllowedAboutOthers(): AIAnswer {
  return {
    content: `In your view I can only see your own brands and tasks, so I can't answer for other team members. Ask ${usersById.lucky.name} or ${usersById.bhupes.name} for the team view.`,
  };
}

export function fallback(ctx: AIContext): AIAnswer {
  return {
    content:
      `I'm not sure how to answer that from the data I have.\n\n` +
      `Try one of these:\n` +
      `- Which brand needs the most attention?\n` +
      `- Which brands are below target?\n` +
      `- What should I focus on today?\n` +
      `- What is our actual ROAS?\n` +
      (ctx.isManager ? `- Which team member has the most overdue tasks?` : `- Show my tasks.`),
  };
}
