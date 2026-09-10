import type {
  Brand,
  BrandId,
  BrandSummary,
  Currency,
  DateRangeKey,
  GooglePerformance,
  GoogleTotals,
  MetaPerformance,
  MetaTotals,
  PortfolioSummary,
  ShopifySales,
  ShopifyTotals,
} from "@/types";
import { DEMO_TODAY } from "@/data/config";
import { brands, brandsById } from "@/data/brands";
import { metaPerformance } from "@/data/meta";
import { googlePerformance } from "@/data/google";
import { shopifySales } from "@/data/shopify";
import type { TargetMap } from "@/data/targets";
import { addDays } from "@/data/demo/series";
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
};

export function getRangeDates(range: DateRangeKey, today: string = DEMO_TODAY): { from: string; to: string } {
  const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
  return { from: addDays(today, -(days - 1)), to: today };
}

function inRange<T extends { date: string }>(rows: T[], range: DateRangeKey): T[] {
  const { from, to } = getRangeDates(range);
  return rows.filter((r) => r.date >= from && r.date <= to);
}

function forBrands<T extends { brandId: BrandId }>(rows: T[], brandIds: BrandId[]): T[] {
  const set = new Set(brandIds);
  return rows.filter((r) => set.has(r.brandId));
}

/** Sum with 2-decimal rounding so currency totals never carry float drift. */
const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;

export function getMetaRows(brandIds: BrandId[], range: DateRangeKey = "30d"): MetaPerformance[] {
  return inRange(forBrands(metaPerformance, brandIds), range);
}

export function getGoogleRows(brandIds: BrandId[], range: DateRangeKey = "30d"): GooglePerformance[] {
  return inRange(forBrands(googlePerformance, brandIds), range);
}

export function getShopifyRows(brandIds: BrandId[], range: DateRangeKey = "30d"): ShopifySales[] {
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
  return { netSales, orders, aov: calculateAOV(netSales, orders) };
}

export function getMetaTotals(brandIds: BrandId[], range: DateRangeKey = "30d"): MetaTotals {
  return aggregateMeta(getMetaRows(brandIds, range));
}

export function getGoogleTotals(brandIds: BrandId[], range: DateRangeKey = "30d"): GoogleTotals {
  return aggregateGoogle(getGoogleRows(brandIds, range));
}

export function getShopifyTotals(brandIds: BrandId[], range: DateRangeKey = "30d"): ShopifyTotals {
  return aggregateShopify(getShopifyRows(brandIds, range));
}

/** Business summary for one brand: Meta + Google spend vs Shopify Net Sales. */
export function getBrandSummary(
  brandId: BrandId,
  targets: TargetMap,
  range: DateRangeKey = "30d",
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
  range: DateRangeKey = "30d",
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
  return {
    currency,
    label: PORTFOLIO_LABEL[currency],
    brandCount: group.length,
    metaSpend,
    googleSpend,
    totalSpend,
    netSales,
    orders: sum(group.map((s) => s.orders)),
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

export interface DailyBusinessPoint {
  date: string;
  metaSpend: number;
  googleSpend: number;
  totalSpend: number;
  netSales: number;
  orders: number;
}

/**
 * Daily series for charts. Callers must pass brands that share one currency.
 */
export function getDailyBusinessSeries(brandIds: BrandId[], range: DateRangeKey = "30d"): DailyBusinessPoint[] {
  const meta = getMetaRows(brandIds, range);
  const google = getGoogleRows(brandIds, range);
  const shopify = getShopifyRows(brandIds, range);
  const byDate = new Map<string, DailyBusinessPoint>();
  const ensure = (date: string) => {
    let p = byDate.get(date);
    if (!p) {
      p = { date, metaSpend: 0, googleSpend: 0, totalSpend: 0, netSales: 0, orders: 0 };
      byDate.set(date, p);
    }
    return p;
  };
  for (const r of meta) ensure(r.date).metaSpend += r.spend;
  for (const r of google) ensure(r.date).googleSpend += r.spend;
  for (const r of shopify) {
    const p = ensure(r.date);
    p.netSales += r.netSales;
    p.orders += r.orders;
  }
  return [...byDate.values()]
    .map((p) => ({ ...p, totalSpend: calculateTotalAdSpend(p.metaSpend, p.googleSpend) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export interface DailyPlatformPoint {
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  reportedValue: number;
}

export function getDailyMetaSeries(brandIds: BrandId[], range: DateRangeKey = "30d"): DailyPlatformPoint[] {
  const byDate = new Map<string, DailyPlatformPoint>();
  for (const r of getMetaRows(brandIds, range)) {
    const p = byDate.get(r.date) ?? { date: r.date, spend: 0, clicks: 0, impressions: 0, conversions: 0, reportedValue: 0 };
    p.spend += r.spend;
    p.clicks += r.clicks;
    p.impressions += r.impressions;
    p.conversions += r.purchases;
    p.reportedValue += r.reportedPurchaseValue;
    byDate.set(r.date, p);
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function getDailyGoogleSeries(brandIds: BrandId[], range: DateRangeKey = "30d"): DailyPlatformPoint[] {
  const byDate = new Map<string, DailyPlatformPoint>();
  for (const r of getGoogleRows(brandIds, range)) {
    const p = byDate.get(r.date) ?? { date: r.date, spend: 0, clicks: 0, impressions: 0, conversions: 0, reportedValue: 0 };
    p.spend += r.spend;
    p.clicks += r.clicks;
    p.impressions += r.impressions;
    p.conversions += r.conversions;
    p.reportedValue += r.conversionValue;
    byDate.set(r.date, p);
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function getAllBrands(): Brand[] {
  return brands;
}
