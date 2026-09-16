import type { BrandId, ShopifySales } from "@/types";
import { brandIds, brandsById } from "@/data/brands";
import { brandDemoTotals } from "@/data/demo/totals";
import { buildFullSeries, demoDates } from "@/data/demo/series";

/**
 * Daily Shopify sales, one row per brand per day.
 *
 * Shopify is the source of truth for "how much did we actually sell?".
 * Each row carries Net Sales and Orders plus the sales reversal record
 * (value and orders returned, refunded or cancelled) for the same day.
 *
 * Net Sales already has returns deducted, exactly as Shopify reports it.
 * The reversal fields are shown alongside so the team can see how much went
 * back, without changing the sales figure Actual ROAS is built on.
 *
 * In production these rows come from the Shopify Admin API via the backend
 * (credentials stay server-side).
 */
function buildShopifySeries(brandId: BrandId): ShopifySales[] {
  const t = brandDemoTotals[brandId];
  const currency = brandsById[brandId].currency;
  const trend = brandId === "nysh-bluheat" ? -0.25 : brandId === "desividesi-india" ? 0.25 : 0.08;

  const netSalesByDay = buildFullSeries(t.netSales, `shopify-sales-${brandId}`, {
    noise: 0.3,
    weekendFactor: 1.2,
    trend,
    decimals: 0,
  });
  const ordersByDay = buildFullSeries(t.orders, `shopify-orders-${brandId}`, {
    noise: 0.3,
    weekendFactor: 1.2,
    trend,
    decimals: 0,
  });

  // returnedAmount / (netSales + returnedAmount) === returnRate.
  const returnedTotal = (t.netSales * t.returnRate) / (1 - t.returnRate);
  const returnedOrdersTotal = (t.orders * t.returnRate) / (1 - t.returnRate);
  // Returns lag the sale, so they get their own noise and no weekend spike.
  const returnedByDay = buildFullSeries(returnedTotal, `shopify-returns-${brandId}`, {
    noise: 0.55,
    weekendFactor: 1,
    trend,
    decimals: 0,
  });
  const returnedOrdersByDay = buildFullSeries(returnedOrdersTotal, `shopify-return-orders-${brandId}`, {
    noise: 0.55,
    weekendFactor: 1,
    trend,
    decimals: 0,
  });

  return demoDates.map((date, i) => ({
    brandId,
    date,
    currency,
    netSales: netSalesByDay[i],
    orders: ordersByDay[i],
    returnedAmount: returnedByDay[i],
    returnedOrders: returnedOrdersByDay[i],
  }));
}

export const shopifySales: ShopifySales[] = brandIds.flatMap(buildShopifySeries);
