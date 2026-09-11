import type { BrandSummary, Currency } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { CHART_COLORS } from "@/components/charts/chartConfig";
import { SLICE_COLORS, type DonutSlice } from "@/components/charts/DonutChart";

/**
 * Builders that turn brand summaries into pie slices. Every builder works
 * within ONE currency so INR and AED are never mixed in a single pie.
 */

export function spendByPlatformSlices(summaries: BrandSummary[], currency: Currency): DonutSlice[] {
  const rows = summaries.filter((s) => s.currency === currency);
  const meta = rows.reduce((a, s) => a + s.metaSpend, 0);
  const google = rows.reduce((a, s) => a + s.googleSpend, 0);
  return [
    { name: "Meta Spend", value: meta, color: CHART_COLORS.meta, label: formatCurrency(meta, currency) },
    { name: "Google Spend", value: google, color: CHART_COLORS.google, label: formatCurrency(google, currency) },
  ];
}

export function spendByBrandSlices(summaries: BrandSummary[], currency: Currency): DonutSlice[] {
  return summaries
    .filter((s) => s.currency === currency)
    .map((s, i) => ({ name: s.brand.name, value: s.totalSpend, color: SLICE_COLORS[i % SLICE_COLORS.length], label: formatCurrency(s.totalSpend, currency) }));
}

export function salesByBrandSlices(summaries: BrandSummary[], currency: Currency): DonutSlice[] {
  return summaries
    .filter((s) => s.currency === currency)
    .map((s, i) => ({ name: s.brand.name, value: s.netSales, color: SLICE_COLORS[i % SLICE_COLORS.length], label: formatCurrency(s.netSales, currency) }));
}

export function ordersByBrandSlices(summaries: BrandSummary[], currency: Currency): DonutSlice[] {
  return summaries
    .filter((s) => s.currency === currency)
    .map((s, i) => ({ name: s.brand.name, value: s.orders, color: SLICE_COLORS[i % SLICE_COLORS.length], label: `${s.orders} orders` }));
}

/** On Track / Attention / Below Target counts. */
export function statusSlices(summaries: BrandSummary[]): DonutSlice[] {
  const count = (status: BrandSummary["status"]) => summaries.filter((s) => s.status === status).length;
  const label = (n: number) => `${n} ${n === 1 ? "brand" : "brands"}`;
  return [
    { name: "On Track", value: count("on_track"), color: CHART_COLORS.onTrack, label: label(count("on_track")) },
    { name: "Attention", value: count("attention"), color: CHART_COLORS.attention, label: label(count("attention")) },
    { name: "Below Target", value: count("below_target"), color: CHART_COLORS.belowTarget, label: label(count("below_target")) },
  ].filter((s) => s.value > 0);
}
