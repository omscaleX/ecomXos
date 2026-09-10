import type { BrandId, MetaCampaign, MetaPerformance } from "@/types";
import { brandIds } from "@/data/brands";
import { brandDemoTotals } from "@/data/demo/totals";
import { createRng, demoDates, distributeTotal, hashString, round, roundCount } from "@/data/demo/series";

/**
 * Daily Meta Ads performance, one row per brand per day.
 *
 * In production these rows come from the Meta Marketing API via the backend
 * (normalised and stored in the database). The shape of each row matches the
 * MetaPerformance type so the UI does not need to change.
 */
function buildMetaSeries(brandId: BrandId): MetaPerformance[] {
  const t = brandDemoTotals[brandId];
  const spendByDay = distributeTotal(t.metaSpend, `meta-spend-${brandId}`, {
    noise: 0.22,
    weekendFactor: 1.12,
    trend: brandId === "nysh-bluheat" ? -0.2 : 0.1,
    decimals: 2,
  });
  const rng = createRng(hashString(`meta-metrics-${brandId}`));

  return demoDates.map((date, i) => {
    const spend = spendByDay[i];
    const cpm = t.meta.cpm * (1 + (rng() - 0.5) * 0.3);
    const ctr = t.meta.ctr * (1 + (rng() - 0.5) * 0.35);
    const impressions = Math.round((spend / cpm) * 1000);
    const reach = Math.round(impressions / (t.meta.frequency * (1 + (rng() - 0.5) * 0.2)));
    const clicks = Math.round(impressions * ctr);
    const purchases = roundCount(clicks * t.meta.conversionRate * (1 + (rng() - 0.5) * 0.5), rng);
    const reportedPurchaseValue = round(spend * t.metaReportedROAS * (1 + (rng() - 0.5) * 0.4), 2);
    return {
      brandId,
      date,
      spend,
      impressions,
      reach,
      clicks,
      ctr: round(clicks / Math.max(impressions, 1), 4),
      cpc: round(spend / Math.max(clicks, 1), 2),
      cpm: round((spend / Math.max(impressions, 1)) * 1000, 2),
      purchases,
      reportedPurchaseValue,
    };
  });
}

export const metaPerformance: MetaPerformance[] = brandIds.flatMap(buildMetaSeries);

/** Campaign-level Meta demo data. Spend adds up to the brand's Meta spend. */
interface CampaignSeed {
  name: string;
  objective: string;
  share: number;
  ctr: number;
  cpc: number;
  status: MetaCampaign["status"];
  purchaseShare: number;
}

const campaignSeeds: Record<BrandId, CampaignSeed[]> = {
  yeoul: [
    { name: "Yeoul | Prospecting | Broad | Sept", objective: "Sales", share: 0.45, ctr: 0.0138, cpc: 15.2, status: "active", purchaseShare: 0.4 },
    { name: "Yeoul | Retargeting | Website Visitors 30D", objective: "Sales", share: 0.25, ctr: 0.021, cpc: 11.4, status: "active", purchaseShare: 0.35 },
    { name: "Yeoul | Advantage+ Shopping", objective: "Sales", share: 0.2, ctr: 0.0125, cpc: 16.8, status: "learning", purchaseShare: 0.2 },
    { name: "Yeoul | Reels | Awareness", objective: "Awareness", share: 0.1, ctr: 0.0092, cpc: 22.5, status: "paused", purchaseShare: 0.05 },
  ],
  "giggle-pad": [
    { name: "Giggle Pad | Prospecting | Parents 25-40", objective: "Sales", share: 0.4, ctr: 0.0112, cpc: 17.9, status: "active", purchaseShare: 0.38 },
    { name: "Giggle Pad | Retargeting | Add to Cart", objective: "Sales", share: 0.22, ctr: 0.0195, cpc: 12.1, status: "active", purchaseShare: 0.32 },
    { name: "Giggle Pad | Advantage+ Shopping", objective: "Sales", share: 0.28, ctr: 0.0118, cpc: 16.2, status: "active", purchaseShare: 0.25 },
    { name: "Giggle Pad | New Creatives Test", objective: "Sales", share: 0.1, ctr: 0.0101, cpc: 19.4, status: "learning", purchaseShare: 0.05 },
  ],
  "nysh-warmee": [
    { name: "Warmee | Prospecting | Winter Interest", objective: "Sales", share: 0.42, ctr: 0.0149, cpc: 14.1, status: "active", purchaseShare: 0.4 },
    { name: "Warmee | Retargeting | 14D Engagers", objective: "Sales", share: 0.23, ctr: 0.0231, cpc: 10.2, status: "active", purchaseShare: 0.33 },
    { name: "Warmee | Advantage+ Shopping", objective: "Sales", share: 0.25, ctr: 0.0152, cpc: 13.8, status: "active", purchaseShare: 0.22 },
    { name: "Warmee | Catalog Sales", objective: "Sales", share: 0.1, ctr: 0.0118, cpc: 17.5, status: "paused", purchaseShare: 0.05 },
  ],
  "nysh-bluheat": [
    { name: "BluHeat | Prospecting | Broad", objective: "Sales", share: 0.5, ctr: 0.0084, cpc: 29.6, status: "active", purchaseShare: 0.42 },
    { name: "BluHeat | Retargeting | Website Visitors", objective: "Sales", share: 0.3, ctr: 0.0134, cpc: 19.8, status: "active", purchaseShare: 0.4 },
    { name: "BluHeat | Launch Video | Awareness", objective: "Awareness", share: 0.2, ctr: 0.0071, cpc: 34.2, status: "paused", purchaseShare: 0.18 },
  ],
  "desividesi-india": [
    { name: "DesiVidesi IN | Prospecting | Festive", objective: "Sales", share: 0.4, ctr: 0.0171, cpc: 11.4, status: "active", purchaseShare: 0.4 },
    { name: "DesiVidesi IN | Retargeting | Catalog", objective: "Sales", share: 0.25, ctr: 0.0248, cpc: 8.9, status: "active", purchaseShare: 0.32 },
    { name: "DesiVidesi IN | Advantage+ Shopping", objective: "Sales", share: 0.3, ctr: 0.0162, cpc: 12.1, status: "active", purchaseShare: 0.25 },
    { name: "DesiVidesi IN | Scaling Test | 20% Budget", objective: "Sales", share: 0.05, ctr: 0.0158, cpc: 12.6, status: "learning", purchaseShare: 0.03 },
  ],
  "desividesi-dubai": [
    { name: "DesiVidesi AE | Prospecting | UAE Broad", objective: "Sales", share: 0.55, ctr: 0.0121, cpc: 1.12, status: "active", purchaseShare: 0.5 },
    { name: "DesiVidesi AE | Retargeting | 30D", objective: "Sales", share: 0.3, ctr: 0.0188, cpc: 0.78, status: "active", purchaseShare: 0.4 },
    { name: "DesiVidesi AE | Reels | Awareness", objective: "Awareness", share: 0.15, ctr: 0.0086, cpc: 1.65, status: "paused", purchaseShare: 0.1 },
  ],
};

export const metaCampaigns: MetaCampaign[] = brandIds.flatMap((brandId) => {
  const totals = brandDemoTotals[brandId];
  const totalPurchases = metaPerformance
    .filter((r) => r.brandId === brandId)
    .reduce((s, r) => s + r.purchases, 0);
  const seeds = campaignSeeds[brandId];
  let spendLeft = totals.metaSpend;
  let purchasesLeft = totalPurchases;
  return seeds.map((seed, i) => {
    const last = i === seeds.length - 1;
    const spend = last ? round(spendLeft, 2) : round(totals.metaSpend * seed.share, 2);
    const purchases = last ? purchasesLeft : Math.round(totalPurchases * seed.purchaseShare);
    spendLeft -= spend;
    purchasesLeft -= purchases;
    return {
      id: `${brandId}-meta-${i + 1}`,
      brandId,
      name: seed.name,
      objective: seed.objective,
      spend,
      purchases,
      ctr: seed.ctr,
      cpc: seed.cpc,
      status: seed.status,
    };
  });
});
