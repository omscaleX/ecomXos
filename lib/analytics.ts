import type {
  Brand,
  BrandId,
  BrandSummary,
  Currency,
  DateRange,
  DateRangeKey,
  GooglePerformance,
  GoogleTotals,
  Granularity,
  MetaPerformance,
  MetaTotals,
  PortfolioSummary,
  RangeInput,
  ShopifySales,
  ShopifyTotals,
} from "@/types";
import { DEMO_TODAY } from "@/data/config";
import { brands, brandsById } from "@/data/brands";
import { metaPerformance } from "@/data/meta";
import { googlePerformance } from "@/data/google";
import { shopifySales } from "@/data/shopify";
import type { TargetMap } from "@/data/targets";
import { addDays, demoDates } from "@/data/demo/series";
import { formatShortDate } from "@/lib/formatters";
import {
  calculateActualROAS,
  calculateAOV,
  calculateTargetGap,
  calculateTargetGapPercent,
  calculateTargetStatus,
  calculateTotalAdSpend,
} from "@/lib/calculations";

/**
 * Analytics layer.
 *
 * Reads the normalised daily rows from /data and turns them into the
 * aggregates the UI needs. In production this is the layer that would call
 * the backend (`getMetaPerformance()`, `getShopifySales()` …) instead of
 * importing static arrays; the function signatures are designed so that
 * swap is straightforward.
 */

export const DATE_RANGE_LABEL: Record<DateRangeKey, string> = {
  today: "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  this_week: "This Week",
  this_month: "This Month",
  "90d": "Last 90 Days",
};

/** Presets offered by the calendar, in the order they appear. */
export const DATE_RANGE_PRESETS: DateRangeKey[] = [
  "today",
  "this_week",
  "7d",
  "30d",
  "this_month",
  "90d",
];

/** Monday-based start of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday
  const back = day === 0 ? 6 : day - 1;
  return addDays(iso, -back);
}

/** First day of the month containing `iso`. */
export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function isDateRange(input: RangeInput): input is DateRange {
  return typeof input !== "string";
}

/** Turn any RangeInput into an explicit from/to window. */
export function resolveRange(input: RangeInput, today: string = DEMO_TODAY): DateRange {
  if (isDateRange(input)) {
    // Tolerate a reversed selection from the calendar.
    return input.from <= input.to ? input : { from: input.to, to: input.from };
  }
  switch (input) {
    case "today":
      return { from: today, to: today };
    case "this_week":
      return { from: startOfWeek(today), to: today };
    case "this_month":
      return { from: startOfMonth(today), to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "90d":
      return { from: addDays(today, -89), to: today };
    case "30d":
    default:
      return { from: addDays(today, -29), to: today };
  }
}

/** Kept for existing call sites. */
export function getRangeDates(range: RangeInput, today: string = DEMO_TODAY): DateRange {
  return resolveRange(range, today);
}

/** Number of days the range covers, inclusive. */
export function rangeLengthDays(range: RangeInput, today: string = DEMO_TODAY): number {
  const { from, to } = resolveRange(range, today);
  const ms = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** The granularity that reads best for a range: day, week or month. */
export function defaultGranularity(range: RangeInput, today: string = DEMO_TODAY): Granularity {
  const days = rangeLengthDays(range, today);
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

/** Granularities that produce at least two buckets for the range. */
export function availableGranularities(range: RangeInput, today: string = DEMO_TODAY): Granularity[] {
  const days = rangeLengthDays(range, today);
  const list: Granularity[] = ["day"];
  if (days >= 14) list.push("week");
  if (days >= 60) list.push("month");
  return list;
}

function inRange<T extends { date: string }>(rows: T[], range: RangeInput): T[] {
  const { from, to } = resolveRange(range);
  return rows.filter((r) => r.date >= from && r.date <= to);
}

function forBrands<T extends { brandId: BrandId }>(rows: T[], brandIds: BrandId[]): T[] {
  const set = new Set(brandIds);
  return rows.filter((r) => set.has(r.brandId));
}

/** Sum with 2-decimal rounding so currency totals never carry float drift. */
const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;

export function getMetaRows(brandIds: BrandId[], range: RangeInput = "30d"): MetaPerformance[] {
  return inRange(forBrands(metaPerformance, brandIds), range);
}

export function getGoogleRows(brandIds: BrandId[], range: RangeInput = "30d"): GooglePerformance[] {
  return inRange(forBrands(googlePerformance, brandIds), range);
}

export function getShopifyRows(brandIds: BrandId[], range: RangeInput = "30d"): ShopifySales[] {
  return inRange(forBrands(shopifySales, brandIds), range);
}

export function aggregateMeta(rows: MetaPerformance[]): MetaTotals {
  const spend = sum(rows.map((r) => r.spend));
  const impressions = sum(rows.map((r) => r.impressions));
  const reach = sum(rows.map((r) => r.reach));
  const clicks = sum(rows.map((r) => r.clicks));
  const purchases = sum(rows.map((r) => r.purchases));
  const reportedPurchaseValue = sum(rows.map((r) => r.reportedPurchaseValue));
  return {
    spend,
    impressions,
    reach,
    clicks,
    purchases,
    reportedPurchaseValue,
    ctr: impressions ? clicks / impressions : 0,
    cpc: clicks ? spend / clicks : 0,
    cpm: impressions ? (spend / impressions) * 1000 : 0,
    reportedROAS: spend ? reportedPurchaseValue / spend : 0,
  };
}

export function aggregateGoogle(rows: GooglePerformance[]): GoogleTotals {
  const spend = sum(rows.map((r) => r.spend));
  const impressions = sum(rows.map((r) => r.impressions));
  const clicks = sum(rows.map((r) => r.clicks));
  const conversions = sum(rows.map((r) => r.conversions));
  const conversionValue = sum(rows.map((r) => r.conversionValue));
  return {
    spend,
    impressions,
    clicks,
    conversions,
    conversionValue,
    ctr: impressions ? clicks / impressions : 0,
    cpc: clicks ? spend / clicks : 0,
    cpm: impressions ? (spend / impressions) * 1000 : 0,
    reportedROAS: spend ? conversionValue / spend : 0,
  };
}

export function aggregateShopify(rows: ShopifySales[]): ShopifyTotals {
  const netSales = sum(rows.map((r) => r.netSales));
  const orders = sum(rows.map((r) => r.orders));
  const returnedAmount = sum(rows.map((r) => r.returnedAmount));
  const returnedOrders = sum(rows.map((r) => r.returnedOrders));
  const salesBeforeReturns = netSales + returnedAmount;
  return {
    netSales,
    orders,
    aov: calculateAOV(netSales, orders),
    returnedAmount,
    returnedOrders,
    salesBeforeReturns,
    returnRate: salesBeforeReturns ? returnedAmount / salesBeforeReturns : 0,
  };
}

export function getMetaTotals(brandIds: BrandId[], range: RangeInput = "30d"): MetaTotals {
  return aggregateMeta(getMetaRows(brandIds, range));
}

export function getGoogleTotals(brandIds: BrandId[], range: RangeInput = "30d"): GoogleTotals {
  return aggregateGoogle(getGoogleRows(brandIds, range));
}

export function getShopifyTotals(brandIds: BrandId[], range: RangeInput = "30d"): ShopifyTotals {
  return aggregateShopify(getShopifyRows(brandIds, range));
}

/** Business summary for one brand: Meta + Google spend vs Shopify Net Sales. */
export function getBrandSummary(
  brandId: BrandId,
  targets: TargetMap,
  range: RangeInput = "30d",
): BrandSummary {
  const brand = brandsById[brandId];
  const meta = getMetaTotals([brandId], range);
  const google = getGoogleTotals([brandId], range);
  const shopify = getShopifyTotals([brandId], range);
  const totalSpend = calculateTotalAdSpend(meta.spend, google.spend);
  const actualROAS = calculateActualROAS(shopify.netSales, totalSpend);
  const targetROAS = targets[brandId];
  return {
    brand,
    currency: brand.currency,
    metaSpend: meta.spend,
    googleSpend: google.spend,
    totalSpend,
    netSales: shopify.netSales,
    orders: shopify.orders,
    aov: shopify.aov,
    returnedAmount: shopify.returnedAmount,
    returnedOrders: shopify.returnedOrders,
    salesBeforeReturns: shopify.salesBeforeReturns,
    returnRate: shopify.returnRate,
    metaReportedSales: meta.reportedPurchaseValue,
    salesGapVsMeta: meta.reportedPurchaseValue - shopify.netSales,
    actualROAS,
    targetROAS,
    gap: calculateTargetGap(actualROAS, targetROAS),
    gapPercent: calculateTargetGapPercent(actualROAS, targetROAS),
    status: calculateTargetStatus(actualROAS, targetROAS),
    meta,
    google,
  };
}

export function getBrandSummaries(
  brandIds: BrandId[],
  targets: TargetMap,
  range: RangeInput = "30d",
): BrandSummary[] {
  return brandIds.map((id) => getBrandSummary(id, targets, range));
}

export const PORTFOLIO_LABEL: Record<Currency, string> = {
  INR: "India Portfolio",
  AED: "Dubai Portfolio",
};

/**
 * Portfolio totals for one currency. INR and AED are never combined;
 * call this once per currency and show the results side by side.
 */
export function getPortfolioSummary(summaries: BrandSummary[], currency: Currency): PortfolioSummary {
  const group = summaries.filter((s) => s.currency === currency);
  const metaSpend = sum(group.map((s) => s.metaSpend));
  const googleSpend = sum(group.map((s) => s.googleSpend));
  const totalSpend = calculateTotalAdSpend(metaSpend, googleSpend);
  const netSales = sum(group.map((s) => s.netSales));
  const returnedAmount = sum(group.map((s) => s.returnedAmount));
  const salesBeforeReturns = netSales + returnedAmount;
  return {
    currency,
    label: PORTFOLIO_LABEL[currency],
    brandCount: group.length,
    metaSpend,
    googleSpend,
    totalSpend,
    netSales,
    orders: sum(group.map((s) => s.orders)),
    returnedAmount,
    returnedOrders: sum(group.map((s) => s.returnedOrders)),
    returnRate: salesBeforeReturns ? returnedAmount / salesBeforeReturns : 0,
    metaReportedSales: sum(group.map((s) => s.metaReportedSales)),
    actualROAS: calculateActualROAS(netSales, totalSpend),
  };
}

/** One PortfolioSummary per currency present in the summaries, INR first. */
export function getPortfolios(summaries: BrandSummary[]): PortfolioSummary[] {
  const currencies: Currency[] = ["INR", "AED"];
  return currencies
    .filter((c) => summaries.some((s) => s.currency === c))
    .map((c) => getPortfolioSummary(summaries, c));
}

export function brandsForCurrency(list: Brand[], currency: Currency): Brand[] {
  return list.filter((b) => b.currency === currency);
}

/* ------------------------------------------------------------------ *
 * Series and calendar bucketing
 * ------------------------------------------------------------------ */

/** A point on a KPI series. `date` is the bucket start. */
export interface BusinessPoint {
  date: string;
  /** Short axis label: "10 Sep", "8 Sep", "Sep". */
  label: string;
  /** Full tooltip label: "10 Sep", "8 – 14 Sep", "September 2026". */
  fullLabel: string;
  metaSpend: number;
  googleSpend: number;
  totalSpend: number;
  netSales: number;
  orders: number;
  returnedAmount: number;
  returnedOrders: number;
  /** Meta's own reported sales for the same period, for comparison. */
  metaReportedSales: number;
}

/** Kept as an alias so existing chart props keep compiling. */
export type DailyBusinessPoint = BusinessPoint;

export interface PlatformPoint {
  date: string;
  label: string;
  fullLabel: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  reportedValue: number;
}

export type DailyPlatformPoint = PlatformPoint;

/** The bucket a date belongs to, as the bucket's start date. */
export function bucketStart(iso: string, granularity: Granularity): string {
  if (granularity === "week") return startOfWeek(iso);
  if (granularity === "month") return startOfMonth(iso);
  return iso;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Bucket labels. The first and last buckets of a range are usually partial,
 * so both ends are clamped to the range to avoid promising days that are
 * not actually included in the total.
 */
function labelsFor(
  bucket: string,
  granularity: Granularity,
  rangeStart: string,
  rangeEnd: string,
): { label: string; fullLabel: string } {
  if (granularity === "day") {
    const d = formatShortDate(bucket);
    return { label: d, fullLabel: d };
  }
  const naturalEnd = granularity === "week" ? addDays(bucket, 6) : addDays(startOfMonth(addDays(`${bucket.slice(0, 7)}-28`, 7)), -1);
  const from = bucket < rangeStart ? rangeStart : bucket;
  const to = naturalEnd > rangeEnd ? rangeEnd : naturalEnd;
  if (granularity === "month") {
    const [y, m] = bucket.split("-").map(Number);
    const partial = from !== bucket || to !== naturalEnd;
    return {
      label: MONTH_NAMES[m - 1].slice(0, 3),
      fullLabel: partial ? `${formatShortDate(from)} – ${formatShortDate(to)}` : `${MONTH_NAMES[m - 1]} ${y}`,
    };
  }
  return { label: formatShortDate(from), fullLabel: `${formatShortDate(from)} – ${formatShortDate(to)}` };
}

/**
 * Group any numeric series into day, week or month buckets.
 * Every numeric field is summed; the returned points carry the bucket labels.
 */
function groupPoints<T extends { date: string }>(
  rows: T[],
  granularity: Granularity,
  rangeStart: string,
  rangeEnd: string,
  empty: () => Omit<T, "date">,
  add: (target: T, row: T) => void,
): Array<T & { label: string; fullLabel: string }> {
  const byBucket = new Map<string, T>();
  for (const row of rows) {
    const bucket = bucketStart(row.date, granularity);
    let point = byBucket.get(bucket);
    if (!point) {
      point = { date: bucket, ...empty() } as T;
      byBucket.set(bucket, point);
    }
    add(point, row);
  }
  return [...byBucket.values()]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((p) => ({ ...p, ...labelsFor(p.date, granularity, rangeStart, rangeEnd) }));
}

/**
 * Business series: ad spend, Shopify Net Sales, orders, reversals and
 * Meta-reported sales, bucketed by day, week or month.
 * Callers must pass brands that share one currency.
 */
export function getBusinessSeries(
  brandIds: BrandId[],
  range: RangeInput = "30d",
  granularity: Granularity = "day",
): BusinessPoint[] {
  const { from, to } = resolveRange(range);
  const meta = getMetaRows(brandIds, range);
  const google = getGoogleRows(brandIds, range);
  const shopify = getShopifyRows(brandIds, range);

  const byBucket = new Map<string, BusinessPoint>();
  const ensure = (date: string) => {
    const bucket = bucketStart(date, granularity);
    let p = byBucket.get(bucket);
    if (!p) {
      p = {
        date: bucket,
        label: "",
        fullLabel: "",
        metaSpend: 0,
        googleSpend: 0,
        totalSpend: 0,
        netSales: 0,
        orders: 0,
        returnedAmount: 0,
        returnedOrders: 0,
        metaReportedSales: 0,
      };
      byBucket.set(bucket, p);
    }
    return p;
  };

  for (const r of meta) {
    const p = ensure(r.date);
    p.metaSpend += r.spend;
    p.metaReportedSales += r.reportedPurchaseValue;
  }
  for (const r of google) ensure(r.date).googleSpend += r.spend;
  for (const r of shopify) {
    const p = ensure(r.date);
    p.netSales += r.netSales;
    p.orders += r.orders;
    p.returnedAmount += r.returnedAmount;
    p.returnedOrders += r.returnedOrders;
  }

  return [...byBucket.values()]
    .map((p) => ({
      ...p,
      metaSpend: round2(p.metaSpend),
      googleSpend: round2(p.googleSpend),
      metaReportedSales: round2(p.metaReportedSales),
      totalSpend: round2(calculateTotalAdSpend(p.metaSpend, p.googleSpend)),
      ...labelsFor(p.date, granularity, from, to),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Kept for existing call sites: the daily business series. */
export function getDailyBusinessSeries(brandIds: BrandId[], range: RangeInput = "30d"): BusinessPoint[] {
  return getBusinessSeries(brandIds, range, "day");
}

function emptyPlatformPoint() {
  return { label: "", fullLabel: "", spend: 0, clicks: 0, impressions: 0, conversions: 0, reportedValue: 0 };
}

export function getMetaSeries(
  brandIds: BrandId[],
  range: RangeInput = "30d",
  granularity: Granularity = "day",
): PlatformPoint[] {
  const { from, to } = resolveRange(range);
  return groupPoints<PlatformPoint>(
    getMetaRows(brandIds, range).map((r) => ({
      date: r.date,
      label: "",
      fullLabel: "",
      spend: r.spend,
      clicks: r.clicks,
      impressions: r.impressions,
      conversions: r.purchases,
      reportedValue: r.reportedPurchaseValue,
    })),
    granularity,
    from,
    to,
    emptyPlatformPoint,
    (target, row) => {
      target.spend = round2(target.spend + row.spend);
      target.clicks += row.clicks;
      target.impressions += row.impressions;
      target.conversions += row.conversions;
      target.reportedValue = round2(target.reportedValue + row.reportedValue);
    },
  );
}

export function getGoogleSeries(
  brandIds: BrandId[],
  range: RangeInput = "30d",
  granularity: Granularity = "day",
): PlatformPoint[] {
  const { from, to } = resolveRange(range);
  return groupPoints<PlatformPoint>(
    getGoogleRows(brandIds, range).map((r) => ({
      date: r.date,
      label: "",
      fullLabel: "",
      spend: r.spend,
      clicks: r.clicks,
      impressions: r.impressions,
      conversions: r.conversions,
      reportedValue: r.conversionValue,
    })),
    granularity,
    from,
    to,
    emptyPlatformPoint,
    (target, row) => {
      target.spend = round2(target.spend + row.spend);
      target.clicks += row.clicks;
      target.impressions += row.impressions;
      target.conversions += row.conversions;
      target.reportedValue = round2(target.reportedValue + row.reportedValue);
    },
  );
}

/** Kept for existing call sites. */
export function getDailyMetaSeries(brandIds: BrandId[], range: RangeInput = "30d"): PlatformPoint[] {
  return getMetaSeries(brandIds, range, "day");
}

export function getDailyGoogleSeries(brandIds: BrandId[], range: RangeInput = "30d"): PlatformPoint[] {
  return getGoogleSeries(brandIds, range, "day");
}

/* ------------------------------------------------------------------ *
 * Two sales figures per brand: Meta-reported vs Shopify
 * ------------------------------------------------------------------ */

export interface SalesComparisonRow {
  brand: Brand;
  currency: Currency;
  /** Meta's own attributed purchase value. */
  metaReportedSales: number;
  /** Shopify Net Sales, after returns. The source of truth. */
  shopifyNetSales: number;
  /** metaReportedSales - shopifyNetSales. Positive means Meta over-reports. */
  difference: number;
  /** difference / shopifyNetSales, as a ratio. */
  differencePercent: number;
  returnedAmount: number;
  returnedOrders: number;
  returnRate: number;
  salesBeforeReturns: number;
  orders: number;
}

/**
 * The two sales numbers side by side for each brand, plus the reversal
 * record. Meta's figure uses its own attribution window and will not match
 * Shopify; showing both is the point.
 */
export function getSalesComparison(brandIds: BrandId[], range: RangeInput = "30d"): SalesComparisonRow[] {
  return brandIds.map((id) => {
    const brand = brandsById[id];
    const meta = getMetaTotals([id], range);
    const shopify = getShopifyTotals([id], range);
    const difference = round2(meta.reportedPurchaseValue - shopify.netSales);
    return {
      brand,
      currency: brand.currency,
      metaReportedSales: meta.reportedPurchaseValue,
      shopifyNetSales: shopify.netSales,
      difference,
      differencePercent: shopify.netSales ? difference / shopify.netSales : 0,
      returnedAmount: shopify.returnedAmount,
      returnedOrders: shopify.returnedOrders,
      returnRate: shopify.returnRate,
      salesBeforeReturns: shopify.salesBeforeReturns,
      orders: shopify.orders,
    };
  });
}

/** The window the demo data actually covers. The calendar clamps to this. */
export const DATA_WINDOW: DateRange = { from: demoDates[0], to: DEMO_TODAY };

export function getAllBrands(): Brand[] {
  return brands;
}
