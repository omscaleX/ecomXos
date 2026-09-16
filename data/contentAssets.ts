import type { BrandId, UserId } from "@/types";
import type { ContentAsset, ContentAssetKind, ProductId } from "@/types/content";
import { DEMO_TODAY } from "@/data/config";
import { addDays } from "@/data/demo/series";

/**
 * The brand content library.
 *
 * Every asset is filed against a brand, and against the product, campaign
 * and request it belongs to where those are known. That is what lets a
 * requester pick "select existing asset" instead of pasting the same link
 * again, and what builds the brand's content history automatically.
 */

interface AssetSeed {
  id: string;
  kind: ContentAssetKind;
  title: string;
  brandId: BrandId;
  productIds: ProductId[];
  campaignId?: string;
  addedById: UserId;
  /** Days before DEMO_TODAY. */
  age: number;
  host?: "drive" | "frame" | "canva" | "figma" | "dropbox" | "docs";
}

const HOST_URL: Record<NonNullable<AssetSeed["host"]>, string> = {
  drive: "https://drive.google.com/file/d/",
  frame: "https://f.io/",
  canva: "https://canva.com/design/",
  figma: "https://figma.com/file/",
  dropbox: "https://dropbox.com/s/",
  docs: "https://docs.google.com/document/d/",
};

const DEFAULT_HOST: Record<ContentAssetKind, NonNullable<AssetSeed["host"]>> = {
  script: "docs",
  raw_video: "drive",
  reference: "drive",
  ad_copy: "docs",
  creative: "canva",
  final_video: "frame",
  final_creative: "canva",
};

const seeds: AssetSeed[] = [
  /* ---------------- Yeoul ---------------- */
  { id: "a-yeo-s1", kind: "script", title: "Yuja Serum · Ingredient deep-dive script", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales", addedById: "kavya", age: 38 },
  { id: "a-yeo-s2", kind: "script", title: "Yuja Serum · Before/after testimonial script", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales", addedById: "kavya", age: 31 },
  { id: "a-yeo-s3", kind: "script", title: "Morning routine UGC script", brandId: "yeoul", productIds: ["yeoul-cleanser", "yeoul-sunscreen"], campaignId: "yeoul-routine-awareness", addedById: "kavya", age: 22 },
  { id: "a-yeo-r1", kind: "raw_video", title: "Serum b-roll · studio pack", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], addedById: "om", age: 44 },
  { id: "a-yeo-r2", kind: "raw_video", title: "Creator footage · Aanya, 12 clips", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales", addedById: "om", age: 19 },
  { id: "a-yeo-r3", kind: "raw_video", title: "Cleanser texture shots", brandId: "yeoul", productIds: ["yeoul-cleanser"], addedById: "om", age: 27 },
  { id: "a-yeo-f1", kind: "reference", title: "Reference · competitor serum ad", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], addedById: "lucky", age: 48 },
  { id: "a-yeo-f2", kind: "reference", title: "Reference · clean beauty static set", brandId: "yeoul", productIds: [], addedById: "lucky", age: 40 },
  { id: "a-yeo-c1", kind: "ad_copy", title: "Serum sales copy bank · 12 variants", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales", addedById: "om", age: 24 },
  { id: "a-yeo-v1", kind: "final_video", title: "Serum ingredient reel · FINAL", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales", addedById: "rahul", age: 26, host: "frame" },
  { id: "a-yeo-g1", kind: "final_creative", title: "Serum before/after static set · FINAL", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales", addedById: "arjun", age: 20 },

  /* ---------------- Giggle Pad ---------------- */
  { id: "a-gig-s1", kind: "script", title: "Play mat unboxing script", brandId: "giggle-pad", productIds: ["gigglepad-play-mat"], campaignId: "gigglepad-playmat-launch", addedById: "kavya", age: 35 },
  { id: "a-gig-s2", kind: "script", title: "Parent testimonial script", brandId: "giggle-pad", productIds: ["gigglepad-play-mat", "gigglepad-blocks"], addedById: "kavya", age: 18 },
  { id: "a-gig-r1", kind: "raw_video", title: "Play mat lifestyle footage", brandId: "giggle-pad", productIds: ["gigglepad-play-mat"], campaignId: "gigglepad-playmat-launch", addedById: "om", age: 33 },
  { id: "a-gig-r2", kind: "raw_video", title: "Gift box packing footage", brandId: "giggle-pad", productIds: ["gigglepad-gift-box"], campaignId: "gigglepad-festive", addedById: "om", age: 14 },
  { id: "a-gig-f1", kind: "reference", title: "Reference · festive gifting carousels", brandId: "giggle-pad", productIds: ["gigglepad-gift-box"], campaignId: "gigglepad-festive", addedById: "lucky", age: 16 },
  { id: "a-gig-c1", kind: "ad_copy", title: "Festive gifting copy · 8 variants", brandId: "giggle-pad", productIds: ["gigglepad-gift-box"], campaignId: "gigglepad-festive", addedById: "om", age: 12 },
  { id: "a-gig-g1", kind: "final_creative", title: "Play mat launch statics · FINAL", brandId: "giggle-pad", productIds: ["gigglepad-play-mat"], campaignId: "gigglepad-playmat-launch", addedById: "arjun", age: 29 },

  /* ---------------- Nysh - Warmee ---------------- */
  { id: "a-war-s1", kind: "script", title: "Thermal layering explainer script", brandId: "nysh-warmee", productIds: ["warmee-thermal-set"], campaignId: "warmee-winter-push", addedById: "kavya", age: 30 },
  { id: "a-war-s2", kind: "script", title: "Cold room thermal test script", brandId: "nysh-warmee", productIds: ["warmee-thermal-set"], campaignId: "warmee-winter-push", addedById: "kavya", age: 21 },
  { id: "a-war-r1", kind: "raw_video", title: "Cold room test footage", brandId: "nysh-warmee", productIds: ["warmee-thermal-set"], campaignId: "warmee-winter-push", addedById: "anubhav", age: 25 },
  { id: "a-war-r2", kind: "raw_video", title: "Sherpa hoodie model shoot", brandId: "nysh-warmee", productIds: ["warmee-hoodie"], addedById: "anubhav", age: 17 },
  { id: "a-war-f1", kind: "reference", title: "Reference · winter wear hooks", brandId: "nysh-warmee", productIds: [], addedById: "lucky", age: 34 },
  { id: "a-war-v1", kind: "final_video", title: "Layering guide carousel video · FINAL", brandId: "nysh-warmee", productIds: ["warmee-thermal-set"], campaignId: "warmee-winter-push", addedById: "zoya", age: 23, host: "frame" },

  /* ---------------- Nysh - BluHeat ---------------- */
  { id: "a-blu-s1", kind: "script", title: "Heated jacket demo script", brandId: "nysh-bluheat", productIds: ["bluheat-jacket"], campaignId: "bluheat-launch", addedById: "kavya", age: 41 },
  { id: "a-blu-s2", kind: "script", title: "New hook test · 3 openings", brandId: "nysh-bluheat", productIds: ["bluheat-jacket"], campaignId: "bluheat-rescue", addedById: "kavya", age: 9 },
  { id: "a-blu-r1", kind: "raw_video", title: "Jacket heat-level demo footage", brandId: "nysh-bluheat", productIds: ["bluheat-jacket"], campaignId: "bluheat-launch", addedById: "anubhav", age: 43 },
  { id: "a-blu-r2", kind: "raw_video", title: "Gloves outdoor footage", brandId: "nysh-bluheat", productIds: ["bluheat-gloves"], addedById: "anubhav", age: 15 },
  { id: "a-blu-f1", kind: "reference", title: "Reference · heated apparel ads that convert", brandId: "nysh-bluheat", productIds: ["bluheat-jacket"], campaignId: "bluheat-rescue", addedById: "anubhav", age: 11 },
  { id: "a-blu-c1", kind: "ad_copy", title: "Turnaround copy angles · 6 variants", brandId: "nysh-bluheat", productIds: ["bluheat-jacket"], campaignId: "bluheat-rescue", addedById: "anubhav", age: 8 },
  { id: "a-blu-v1", kind: "final_video", title: "Launch film · FINAL", brandId: "nysh-bluheat", productIds: ["bluheat-jacket"], campaignId: "bluheat-launch", addedById: "rahul", age: 37, host: "frame" },

  /* ---------------- DesiVidesi - India ---------------- */
  { id: "a-dvi-s1", kind: "script", title: "Festive collection reel script", brandId: "desividesi-india", productIds: ["dvi-kurta-set"], campaignId: "dvi-festive-sale", addedById: "kavya", age: 28 },
  { id: "a-dvi-s2", kind: "script", title: "Wedding edit founder-led script", brandId: "desividesi-india", productIds: ["dvi-lehenga"], campaignId: "dvi-wedding-edit", addedById: "kavya", age: 13 },
  { id: "a-dvi-s3", kind: "script", title: "Nehru jacket styling script", brandId: "desividesi-india", productIds: ["dvi-menswear"], campaignId: "dvi-festive-sale", addedById: "kavya", age: 7 },
  { id: "a-dvi-r1", kind: "raw_video", title: "Festive shoot · full day footage", brandId: "desividesi-india", productIds: ["dvi-kurta-set", "dvi-menswear"], campaignId: "dvi-festive-sale", addedById: "om", age: 32 },
  { id: "a-dvi-r2", kind: "raw_video", title: "Lehenga detail shots", brandId: "desividesi-india", productIds: ["dvi-lehenga"], campaignId: "dvi-wedding-edit", addedById: "om", age: 10 },
  { id: "a-dvi-f1", kind: "reference", title: "Reference · festive campaign moodboard", brandId: "desividesi-india", productIds: [], campaignId: "dvi-festive-sale", addedById: "lucky", age: 36, host: "figma" },
  { id: "a-dvi-c1", kind: "ad_copy", title: "Festive Sale copy bank", brandId: "desividesi-india", productIds: ["dvi-kurta-set", "dvi-lehenga"], campaignId: "dvi-festive-sale", addedById: "om", age: 18 },
  { id: "a-dvi-v1", kind: "final_video", title: "Festive collection reel · FINAL", brandId: "desividesi-india", productIds: ["dvi-kurta-set"], campaignId: "dvi-festive-sale", addedById: "zoya", age: 24, host: "frame" },
  { id: "a-dvi-g1", kind: "final_creative", title: "Festive carousel set · FINAL", brandId: "desividesi-india", productIds: ["dvi-kurta-set"], campaignId: "dvi-festive-sale", addedById: "arjun", age: 15 },

  /* ---------------- DesiVidesi - Dubai ---------------- */
  { id: "a-dvd-s1", kind: "script", title: "UAE festive abaya script", brandId: "desividesi-dubai", productIds: ["dvd-abaya-fusion"], campaignId: "dvd-uae-festive", addedById: "kavya", age: 20 },
  { id: "a-dvd-r1", kind: "raw_video", title: "Dubai rooftop shoot footage", brandId: "desividesi-dubai", productIds: ["dvd-abaya-fusion", "dvd-kaftan"], campaignId: "dvd-uae-festive", addedById: "anubhav", age: 26 },
  { id: "a-dvd-f1", kind: "reference", title: "Reference · UAE market creatives", brandId: "desividesi-dubai", productIds: [], addedById: "anubhav", age: 30 },
  { id: "a-dvd-c1", kind: "ad_copy", title: "UAE festive copy · EN and AR", brandId: "desividesi-dubai", productIds: ["dvd-kaftan"], campaignId: "dvd-uae-festive", addedById: "anubhav", age: 12 },
];

function buildAsset(seed: AssetSeed): ContentAsset {
  const host = seed.host ?? DEFAULT_HOST[seed.kind];
  return {
    id: seed.id,
    kind: seed.kind,
    title: seed.title,
    url: `${HOST_URL[host]}${seed.id}`,
    brandId: seed.brandId,
    productIds: seed.productIds,
    campaignId: seed.campaignId,
    addedById: seed.addedById,
    addedAt: addDays(DEMO_TODAY, -seed.age),
    isFinal: seed.kind === "final_video" || seed.kind === "final_creative",
  };
}

export const initialContentAssets: ContentAsset[] = seeds.map(buildAsset);

/** Build the URL a newly pasted or picked asset should carry. */
export function assetUrlFor(kind: ContentAssetKind, id: string): string {
  return `${HOST_URL[DEFAULT_HOST[kind]]}${id}`;
}
