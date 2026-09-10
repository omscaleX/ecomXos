import type { BrandId } from "@/types";

/**
 * Canonical brand-level demo totals for the 30-day demo window.
 *
 * Everything else (daily series, campaign tables, dashboards, AI answers)
 * is derived from these numbers, so they only need to be changed here.
 *
 * Meta spend + Google spend = Total Ad Spend
 * Shopify Net Sales / Total Ad Spend = Actual ROAS
 */
export interface BrandDemoTotals {
  metaSpend: number;
  googleSpend: number;
  netSales: number;
  orders: number;
  /** Meta-reported purchase ROAS on Meta spend (platform-reported, not business ROAS). */
  metaReportedROAS: number;
  /** Google-reported conversion value ROAS on Google spend. */
  googleReportedROAS: number;
  meta: { cpm: number; ctr: number; conversionRate: number; frequency: number };
  google: { cpm: number; ctr: number; conversionRate: number };
}

export const brandDemoTotals: Record<BrandId, BrandDemoTotals> = {
  yeoul: {
    metaSpend: 154_545,
    googleSpend: 50_000,
    netSales: 450_000,
    orders: 100,
    metaReportedROAS: 3.1,
    googleReportedROAS: 2.6,
    meta: { cpm: 210, ctr: 0.0142, conversionRate: 0.0067, frequency: 1.8 },
    google: { cpm: 300, ctr: 0.036, conversionRate: 0.006 },
  },
  "giggle-pad": {
    metaSpend: 215_000,
    googleSpend: 60_000,
    netSales: 550_000,
    orders: 110,
    metaReportedROAS: 2.7,
    googleReportedROAS: 2.4,
    meta: { cpm: 185, ctr: 0.0118, conversionRate: 0.0055, frequency: 2.1 },
    google: { cpm: 260, ctr: 0.031, conversionRate: 0.0055 },
  },
  "nysh-warmee": {
    metaSpend: 210_000,
    googleSpend: 62_727,
    netSales: 600_000,
    orders: 120,
    metaReportedROAS: 3.0,
    googleReportedROAS: 2.8,
    meta: { cpm: 230, ctr: 0.0155, conversionRate: 0.006, frequency: 1.9 },
    google: { cpm: 330, ctr: 0.041, conversionRate: 0.0065 },
  },
  "nysh-bluheat": {
    metaSpend: 46_667,
    googleSpend: 20_000,
    netSales: 100_000,
    orders: 35,
    metaReportedROAS: 1.9,
    googleReportedROAS: 1.7,
    meta: { cpm: 265, ctr: 0.0091, conversionRate: 0.0075, frequency: 2.6 },
    google: { cpm: 400, ctr: 0.024, conversionRate: 0.005 },
  },
  "desividesi-india": {
    metaSpend: 245_000,
    googleSpend: 55_000,
    netSales: 780_000,
    orders: 130,
    metaReportedROAS: 3.6,
    googleReportedROAS: 3.1,
    meta: { cpm: 195, ctr: 0.0168, conversionRate: 0.0045, frequency: 1.7 },
    google: { cpm: 280, ctr: 0.044, conversionRate: 0.0065 },
  },
  "desividesi-dubai": {
    metaSpend: 7_500,
    googleSpend: 2_500,
    netSales: 20_000,
    orders: 45,
    metaReportedROAS: 2.5,
    googleReportedROAS: 2.2,
    meta: { cpm: 14, ctr: 0.0125, conversionRate: 0.0045, frequency: 2.0 },
    google: { cpm: 25, ctr: 0.034, conversionRate: 0.007 },
  },
};
