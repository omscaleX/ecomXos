import type { BrandId } from "@/types";
import type { MarketingCampaign, Product } from "@/types/content";

/**
 * Products per brand, and the agency's own marketing campaigns.
 *
 * Content requests hang off these: Brand → Product → Campaign → Request.
 * They are separate from the Meta and Google ad campaigns in data/meta.ts
 * and data/google.ts, which describe ad delivery rather than agency work.
 */
export const products: Product[] = [
  // Yeoul, skincare
  { id: "yeoul-yuja-serum", brandId: "yeoul", name: "Yuja Serum", description: "Vitamin C brightening serum, 30ml" },
  { id: "yeoul-cleanser", brandId: "yeoul", name: "Rice Cleanser", description: "Gentle daily foaming cleanser" },
  { id: "yeoul-sunscreen", brandId: "yeoul", name: "Daily Sunscreen SPF50", description: "Lightweight no-white-cast sunscreen" },

  // Giggle Pad, kids and toys
  { id: "gigglepad-play-mat", brandId: "giggle-pad", name: "Foldable Play Mat", description: "Reversible non-toxic play mat" },
  { id: "gigglepad-blocks", brandId: "giggle-pad", name: "Soft Building Blocks", description: "48-piece silicone block set" },
  { id: "gigglepad-gift-box", brandId: "giggle-pad", name: "Newborn Gift Box", description: "Curated gifting bundle" },

  // Nysh - Warmee, winter wear
  { id: "warmee-thermal-set", brandId: "nysh-warmee", name: "Thermal Inner Set", description: "Fleece-lined thermal top and bottom" },
  { id: "warmee-hoodie", brandId: "nysh-warmee", name: "Sherpa Hoodie", description: "Oversized sherpa-lined hoodie" },

  // Nysh - BluHeat, heated apparel
  { id: "bluheat-jacket", brandId: "nysh-bluheat", name: "Heated Jacket", description: "USB-C heated jacket, 3 heat levels" },
  { id: "bluheat-gloves", brandId: "nysh-bluheat", name: "Heated Gloves", description: "Rechargeable touchscreen gloves" },

  // DesiVidesi - India, ethnic fashion
  { id: "dvi-kurta-set", brandId: "desividesi-india", name: "Festive Kurta Set", description: "Cotton silk kurta with dupatta" },
  { id: "dvi-lehenga", brandId: "desividesi-india", name: "Embroidered Lehenga", description: "Hand-embroidered wedding lehenga" },
  { id: "dvi-menswear", brandId: "desividesi-india", name: "Nehru Jacket", description: "Raw silk Nehru jacket" },

  // DesiVidesi - Dubai
  { id: "dvd-abaya-fusion", brandId: "desividesi-dubai", name: "Abaya Fusion Set", description: "Indo-Arabic fusion abaya" },
  { id: "dvd-kaftan", brandId: "desividesi-dubai", name: "Embellished Kaftan", description: "Occasion-wear kaftan" },
];

export const productsById: Record<string, Product> = Object.fromEntries(products.map((p) => [p.id, p]));

export function getBrandProducts(brandId: BrandId): Product[] {
  return products.filter((p) => p.brandId === brandId);
}

export const marketingCampaigns: MarketingCampaign[] = [
  { id: "yeoul-serum-sales", brandId: "yeoul", name: "Serum Sales", productIds: ["yeoul-yuja-serum"], funnel: "BOF", status: "live" },
  { id: "yeoul-routine-awareness", brandId: "yeoul", name: "Skincare Routine Awareness", productIds: ["yeoul-cleanser", "yeoul-sunscreen"], funnel: "TOF", status: "live" },

  { id: "gigglepad-festive", brandId: "giggle-pad", name: "Festive Gifting", productIds: ["gigglepad-gift-box", "gigglepad-blocks"], funnel: "MOF", status: "live" },
  { id: "gigglepad-playmat-launch", brandId: "giggle-pad", name: "Play Mat Launch", productIds: ["gigglepad-play-mat"], funnel: "TOF", status: "live" },

  { id: "warmee-winter-push", brandId: "nysh-warmee", name: "Winter Push", productIds: ["warmee-thermal-set", "warmee-hoodie"], funnel: "BOF", status: "live" },

  { id: "bluheat-rescue", brandId: "nysh-bluheat", name: "BluHeat Turnaround", productIds: ["bluheat-jacket", "bluheat-gloves"], funnel: "BOF", status: "live" },
  { id: "bluheat-launch", brandId: "nysh-bluheat", name: "Heated Jacket Launch", productIds: ["bluheat-jacket"], funnel: "TOF", status: "ended" },

  { id: "dvi-festive-sale", brandId: "desividesi-india", name: "Festive Sale", productIds: ["dvi-kurta-set", "dvi-lehenga", "dvi-menswear"], funnel: "MOF", status: "live" },
  { id: "dvi-wedding-edit", brandId: "desividesi-india", name: "Wedding Edit", productIds: ["dvi-lehenga"], funnel: "BOF", status: "planning" },

  { id: "dvd-uae-festive", brandId: "desividesi-dubai", name: "UAE Festive", productIds: ["dvd-abaya-fusion", "dvd-kaftan"], funnel: "MOF", status: "live" },
];

export const campaignsById: Record<string, MarketingCampaign> = Object.fromEntries(
  marketingCampaigns.map((c) => [c.id, c]),
);

export function getBrandCampaigns(brandId: BrandId): MarketingCampaign[] {
  return marketingCampaigns.filter((c) => c.brandId === brandId);
}
