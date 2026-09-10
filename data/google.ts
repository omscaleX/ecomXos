import type { BrandId, GoogleCampaign, GooglePerformance } from "@/types";
import { brandIds } from "@/data/brands";
import { brandDemoTotals } from "@/data/demo/totals";
import { createRng, demoDates, distributeTotal, hashString, round, roundCount } from "@/data/demo/series";

/**
 * Daily Google Ads performance, one row per brand per day.
 *
 * In production these rows come from the Google Ads API via the backend.
 */
function buildGoogleSeries(brandId: BrandId): GooglePerformance[] {
  const t = brandDemoTotals[brandId];
  const spendByDay = distributeTotal(t.googleSpend, `google-spend-${brandId}`, {
    noise: 0.18,
    weekendFactor: 0.9,
    trend: 0.05,
    decimals: 2,
  });
  const rng = createRng(hashString(`google-metrics-${brandId}`));

  return demoDates.map((date, i) => {
    const spend = spendByDay[i];
    const cpm = t.google.cpm * (1 + (rng() - 0.5) * 0.3);
    const ctr = t.google.ctr * (1 + (rng() - 0.5) * 0.3);
    const impressions = Math.round((spend / cpm) * 1000);
    const clicks = Math.round(impressions * ctr);
    const conversions = roundCount(clicks * t.google.conversionRate * (1 + (rng() - 0.5) * 0.5), rng);
    const conversionValue = round(spend * t.googleReportedROAS * (1 + (rng() - 0.5) * 0.4), 2);
    return {
      brandId,
      date,
      spend,
      impressions,
      clicks,
      ctr: round(clicks / Math.max(impressions, 1), 4),
      cpc: round(spend / Math.max(clicks, 1), 2),
      cpm: round((spend / Math.max(impressions, 1)) * 1000, 2),
      conversions,
      conversionValue,
    };
  });
}

export const googlePerformance: GooglePerformance[] = brandIds.flatMap(buildGoogleSeries);

interface CampaignSeed {
  name: string;
  type: string;
  share: number;
  ctr: number;
  cpc: number;
  status: GoogleCampaign["status"];
  conversionShare: number;
}

const campaignSeeds: Record<BrandId, CampaignSeed[]> = {
  yeoul: [
    { name: "Yeoul | Brand Search", type: "Search", share: 0.3, ctr: 0.082, cpc: 6.4, status: "active", conversionShare: 0.42 },
    { name: "Yeoul | Generic Skincare Search", type: "Search", share: 0.35, ctr: 0.031, cpc: 12.8, status: "active", conversionShare: 0.28 },
    { name: "Yeoul | Performance Max", type: "Performance Max", share: 0.35, ctr: 0.018, cpc: 9.1, status: "active", conversionShare: 0.3 },
  ],
  "giggle-pad": [
    { name: "Giggle Pad | Brand Search", type: "Search", share: 0.25, ctr: 0.078, cpc: 5.9, status: "active", conversionShare: 0.4 },
    { name: "Giggle Pad | Toys Generic Search", type: "Search", share: 0.35, ctr: 0.027, cpc: 11.2, status: "active", conversionShare: 0.25 },
    { name: "Giggle Pad | Shopping", type: "Shopping", share: 0.4, ctr: 0.014, cpc: 8.4, status: "active", conversionShare: 0.35 },
  ],
  "nysh-warmee": [
    { name: "Warmee | Brand Search", type: "Search", share: 0.28, ctr: 0.091, cpc: 5.2, status: "active", conversionShare: 0.45 },
    { name: "Warmee | Thermal Wear Search", type: "Search", share: 0.37, ctr: 0.034, cpc: 10.6, status: "active", conversionShare: 0.3 },
    { name: "Warmee | Performance Max", type: "Performance Max", share: 0.35, ctr: 0.02, cpc: 8.8, status: "active", conversionShare: 0.25 },
  ],
  "nysh-bluheat": [
    { name: "BluHeat | Brand Search", type: "Search", share: 0.3, ctr: 0.064, cpc: 7.8, status: "active", conversionShare: 0.5 },
    { name: "BluHeat | Heated Jacket Search", type: "Search", share: 0.45, ctr: 0.021, cpc: 18.4, status: "active", conversionShare: 0.35 },
    { name: "BluHeat | Performance Max", type: "Performance Max", share: 0.25, ctr: 0.012, cpc: 14.9, status: "learning", conversionShare: 0.15 },
  ],
  "desividesi-india": [
    { name: "DesiVidesi IN | Brand Search", type: "Search", share: 0.3, ctr: 0.095, cpc: 4.6, status: "active", conversionShare: 0.42 },
    { name: "DesiVidesi IN | Ethnic Wear Search", type: "Search", share: 0.3, ctr: 0.038, cpc: 9.8, status: "active", conversionShare: 0.28 },
    { name: "DesiVidesi IN | Shopping", type: "Shopping", share: 0.4, ctr: 0.019, cpc: 7.2, status: "active", conversionShare: 0.3 },
  ],
  "desividesi-dubai": [
    { name: "DesiVidesi AE | Brand Search", type: "Search", share: 0.4, ctr: 0.088, cpc: 0.42, status: "active", conversionShare: 0.5 },
    { name: "DesiVidesi AE | Ethnic Wear UAE Search", type: "Search", share: 0.35, ctr: 0.029, cpc: 0.86, status: "active", conversionShare: 0.3 },
    { name: "DesiVidesi AE | Performance Max", type: "Performance Max", share: 0.25, ctr: 0.016, cpc: 0.71, status: "paused", conversionShare: 0.2 },
  ],
};

export const googleCampaigns: GoogleCampaign[] = brandIds.flatMap((brandId) => {
  const totals = brandDemoTotals[brandId];
  const totalConversions = googlePerformance
    .filter((r) => r.brandId === brandId)
    .reduce((s, r) => s + r.conversions, 0);
  const seeds = campaignSeeds[brandId];
  let spendLeft = totals.googleSpend;
  let conversionsLeft = totalConversions;
  return seeds.map((seed, i) => {
    const last = i === seeds.length - 1;
    const spend = last ? round(spendLeft, 2) : round(totals.googleSpend * seed.share, 2);
    const conversions = last ? conversionsLeft : Math.round(totalConversions * seed.conversionShare);
    spendLeft -= spend;
    conversionsLeft -= conversions;
    return {
      id: `${brandId}-google-${i + 1}`,
      brandId,
      name: seed.name,
      type: seed.type,
      spend,
      conversions,
      ctr: seed.ctr,
      cpc: seed.cpc,
      status: seed.status,
    };
  });
});
