import type { BrandId, ShopifySales } from "@/types";
import { brandIds, brandsById } from "@/data/brands";
import { brandDemoTotals } from "@/data/demo/totals";
import { demoDates, distributeTotal } from "@/data/demo/series";

/**
 * Daily Shopify sales, one row per brand per day.
 *
 * Shopify is the source of truth for "how much did we actually sell?".
 * For this prototype only Net Sales and Orders are used. In production these
 * rows come from the Shopify Admin API via the backend (credentials stay
 * server-side).
 */
function buildShopifySeries(brandId: BrandId): ShopifySales[] {
  const t = brandDemoTotals[brandId];
  const currency = brandsById[brandId].currency;
  const netSalesByDay = distributeTotal(t.netSales, `shopify-sales-${brandId}`, {
    noise: 0.3,
    weekendFactor: 1.2,
    trend: brandId === "nysh-bluheat" ? -0.25 : brandId === "desividesi-india" ? 0.25 : 0.08,
    decimals: 0,
  });
  const ordersByDay = distributeTotal(t.orders, `shopify-orders-${brandId}`, {
    noise: 0.3,
    weekendFactor: 1.2,
    trend: brandId === "nysh-bluheat" ? -0.25 : brandId === "desividesi-india" ? 0.25 : 0.08,
    decimals: 0,
  });
  return demoDates.map((date, i) => ({
    brandId,
    date,
    currency,
    netSales: netSalesByDay[i],
    orders: ordersByDay[i],
  }));
}

export const shopifySales: ShopifySales[] = brandIds.flatMap(buildShopifySeries);
