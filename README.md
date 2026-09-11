# Agency OS

One operating system for the marketing agency: brands, Meta Ads, Google Ads, Shopify sales, targets, tasks, team, reports and Agency AI in one place.

This is a **presentation-ready frontend prototype**. There is no backend, no authentication and no real API integration. Every screen runs on realistic demo data, and the code is structured so real APIs can be connected later without rebuilding the UI.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Checks:

```bash
npx tsc --noEmit   # types
npm run lint       # eslint
```

## Demo login and users

The app opens on a dummy login screen (`/login`) with four roles: Senior Manager, Manager, Meta Ads and Google Ads. Pick a role (and a person for Meta Ads), then continue. No password is checked. The session is remembered in `localStorage`; use "Log out" in the top-right menu to return to the login screen. Once signed in, the top-right switcher can still jump between users for the demo.

| User    | Role                          | Sees                                                        |
| ------- | ----------------------------- | ----------------------------------------------------------- |
| Bhupes  | Senior Manager                | Everything, agency-level                                    |
| Lucky   | Manager                       | All six brands, team tasks, targets, reports                |
| Om      | Meta Ads Performance Marketer | Yeoul, Giggle Pad, DesiVidesi - India (Meta + Shopify)      |
| Anubhav | Meta Ads Performance Marketer | Nysh - Warmee, Nysh - BluHeat, DesiVidesi - Dubai           |
| Sagar   | Google Ads Performance Marketer | All six brands (Google + Shopify)                         |

The selected user is remembered in `localStorage` so a page refresh during a presentation keeps the same view. Tasks and targets edited in the UI live in React state and reset on refresh.

## Core business logic

```
Meta Ad Spend + Google Ad Spend = Total Ad Spend
Shopify Net Sales                = Actual Sales
Shopify Net Sales ÷ Total Ad Spend = Actual ROAS
```

Meta-reported purchase value and Google-reported conversion value are shown for platform analysis only. They are never used for Actual ROAS. INR (India) and AED (Dubai) are never added together; agency totals are shown per portfolio.

All calculations live in `lib/calculations.ts` (`calculateTotalAdSpend`, `calculateActualROAS`, `calculateAOV`, `calculateTargetGap`, `calculateTargetStatus`, `getBrandsBelowTarget`, `getTopPerformingBrand`, `getTopPriorities`) and `lib/agency.ts` (`generateAgencySummary`). Dashboards, brand pages, reports and the AI all call the same functions.

Target status: On Track when Actual ≥ Target, Attention when Actual ≥ 80% of Target, Below Target otherwise (`ATTENTION_THRESHOLD` in `lib/calculations.ts`).

## Structure

```
app/                  Next.js App Router pages (dashboard, brands, performance, sales, targets, tasks, team, reports, ai)
components/
  layout/             Sidebar, TopBar, UserSwitcher, SyncStatus, AppShell
  dashboard/          Role dashboards, MetricCard, BrandPerformanceTable, NeedsAttention, TeamWorkload, PriorityList
  brands/             BrandCard, BrandHeader, BrandDetail + tabs
  performance/        PerformanceView (platform / date / brand selectors)
  sales/              Shopify Sales page
  targets/            TargetTable, TargetProgress, EditTargetModal
  tasks/              TaskTable, TaskModal, TaskFilters
  team/, reports/     Team and Reports pages
  charts/             Recharts components (spend vs sales, ROAS by brand, sales trend, spend trend)
  ai/                 AIChat, AIMessage, AISuggestion, AIInsightCard, AIDrawer
  providers/          AppStateProvider (user, tasks, targets), AIDrawerProvider
  ui/                 shadcn/ui primitives
data/                 Single source of truth demo data (brands, users, tasks, meta, google, shopify, targets)
lib/
  calculations.ts     Business formulas (only place ROAS / target logic lives)
  analytics.ts        Aggregations over the daily rows (the future API boundary)
  agency.ts           generateAgencySummary()
  permissions.ts      UI-only role simulation
  formatters.ts       Currency (INR lakh / AED), dates, labels
  ai/                 aiEngine.ts (deterministic router), aiContext.ts, aiResponses.ts
types/                Domain types shaped like future backend records
```

## Agency AI

`lib/ai/aiEngine.ts` is a deterministic demo engine, not an LLM. It classifies the question with keyword rules, resolves the brand / person / platform it refers to (using page context and conversation history for follow-ups such as "Why?"), and fills response templates from a permission-scoped context built by the same analytics functions the dashboards use. It refuses to invent campaign-level performance.

## What gets connected later

- **Meta API, Google Ads API, Shopify API** → backend → normalised rows (`MetaPerformance`, `GooglePerformance`, `ShopifySales`) → database. `lib/analytics.ts` is the boundary: swap the static imports for API calls and the UI stays the same.
- **Real authentication** replaces the user switcher; the backend enforces permissions. `lib/permissions.ts` is a UI convenience only.
- **Real AI** replaces `aiEngine.ts` with tool calls (`getAgencySummary`, `getBrandPerformance`, `getBrandTasks`, …) that check permissions before returning data.
- All Shopify, Meta and Google credentials stay server-side. Nothing is placed in `NEXT_PUBLIC_*` variables or sent to the browser.
