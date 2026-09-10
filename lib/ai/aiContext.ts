import type {
  Brand,
  BrandId,
  BrandSummary,
  Platform,
  PortfolioSummary,
  PriorityItem,
  Task,
  User,
  Workload,
} from "@/types";
import { DEMO_TODAY } from "@/data/config";
import type { TargetMap } from "@/data/targets";
import { users } from "@/data/users";
import { generateAgencySummary, type AgencySummary } from "@/lib/agency";
import {
  getVisibleBrands,
  getVisiblePlatforms,
  getVisibleTasks,
  isManager,
} from "@/lib/permissions";

/**
 * AI context.
 *
 * The engine never reads raw datasets directly. It receives a context
 * built from the same analytics functions the dashboards use, already
 * filtered by the current user's permissions. This mirrors the future
 * production design where a backend exposes permission-checked tools such
 * as getAgencySummary() / getBrandPerformance() to a real LLM.
 */

export interface AIAction {
  label: string;
  href: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AIAction[];
  /** Brand this message was about, used for follow-up questions. */
  subjectBrandId?: BrandId;
  /** User this message was about, used for follow-up questions. */
  subjectUserId?: User["id"];
}

export interface AIAnswer {
  content: string;
  actions?: AIAction[];
  subjectBrandId?: BrandId;
  subjectUserId?: User["id"];
}

/** Raw inputs the UI passes to the engine. */
export interface AIRequestContext {
  user: User;
  /** Brand the user is currently looking at (brand page drawer). */
  brandId?: BrandId;
  /** Platform tab the user is currently looking at, if any. */
  platform?: Platform;
  targets: TargetMap;
  tasks: Task[];
  history: AIMessage[];
  today?: string;
}

/** Fully resolved, permission-scoped context used by the engine. */
export interface AIContext {
  user: User;
  isManager: boolean;
  today: string;
  currentBrand?: Brand;
  currentPlatform?: Platform;
  visibleBrands: Brand[];
  visiblePlatforms: Platform[];
  summaries: BrandSummary[];
  portfolios: PortfolioSummary[];
  visibleTasks: Task[];
  agency: AgencySummary;
  workloads: Workload[];
  priorities: PriorityItem[];
  history: AIMessage[];
  lastSubjectBrandId?: BrandId;
  lastSubjectUserId?: User["id"];
  targets: TargetMap;
  allTasks: Task[];
}

export function buildAIContext(request: AIRequestContext): AIContext {
  const { user, targets, tasks, history } = request;
  const today = request.today ?? DEMO_TODAY;
  const visibleBrands = getVisibleBrands(user);
  const visibleTasks = getVisibleTasks(user, tasks);
  const manager = isManager(user);

  const agency = generateAgencySummary(
    visibleBrands.map((b) => b.id),
    targets,
    visibleTasks,
    {
      today,
      platform: user.platform,
      teamUserIds: manager
        ? users.filter((u) => u.role !== "senior_manager").map((u) => u.id)
        : [user.id],
    },
  );

  const lastAssistant = [...history].reverse().find((m) => m.role === "assistant");
  const currentBrand = request.brandId
    ? visibleBrands.find((b) => b.id === request.brandId)
    : undefined;

  return {
    user,
    isManager: manager,
    today,
    currentBrand,
    currentPlatform: request.platform,
    visibleBrands,
    visiblePlatforms: getVisiblePlatforms(user),
    summaries: agency.summaries,
    portfolios: agency.portfolios,
    visibleTasks,
    agency,
    workloads: agency.workloads,
    priorities: agency.priorities,
    history,
    lastSubjectBrandId: lastAssistant?.subjectBrandId,
    lastSubjectUserId: lastAssistant?.subjectUserId,
    targets,
    allTasks: tasks,
  };
}

/** Suggested questions, tailored to the user and the page they are on. */
export function getSuggestedQuestions(user: User, brand?: Brand): string[] {
  if (brand) {
    return [
      "Why is ROAS low?",
      "What should we check?",
      "Show my tasks.",
      "Compare Meta and Google.",
    ];
  }
  if (user.role === "senior_manager") {
    return [
      "How is the agency performing?",
      "Which brand needs the most attention?",
      "Which brands are below target?",
      "Which team member has the most overdue tasks?",
      "What is our actual ROAS?",
      "Which brand has the highest Shopify sales?",
    ];
  }
  if (user.role === "manager") {
    return [
      "What should I focus on today?",
      "Which brand needs the most attention?",
      "Which brands are below target?",
      "Which team member has the most overdue tasks?",
      "What should Om work on?",
      "Show me overdue tasks.",
    ];
  }
  if (user.role === "meta_marketer") {
    return [
      "What should I work on today?",
      "Which of my brands needs attention?",
      "How is Meta performing?",
      "What is the ROAS of my brands?",
      "Show my tasks.",
    ];
  }
  return [
    "What should I check today?",
    "How is Google performing?",
    "Which brands are below target?",
    "How much did Google spend?",
    "Show my tasks.",
  ];
}
