import type { BrandId, Target } from "@/types";

/**
 * ROAS targets are internal system data (they do not come from Meta,
 * Google or Shopify). They are editable in the UI via React state; this
 * file only provides the initial values.
 */
export const targets: Target[] = [
  { brandId: "yeoul", metric: "roas", targetROAS: 2.5, period: "Last 30 days" },
  { brandId: "giggle-pad", metric: "roas", targetROAS: 2.5, period: "Last 30 days" },
  { brandId: "nysh-warmee", metric: "roas", targetROAS: 2.5, period: "Last 30 days" },
  { brandId: "nysh-bluheat", metric: "roas", targetROAS: 2.2, period: "Last 30 days" },
  { brandId: "desividesi-india", metric: "roas", targetROAS: 2.5, period: "Last 30 days" },
  { brandId: "desividesi-dubai", metric: "roas", targetROAS: 2.2, period: "Last 30 days" },
];

export type TargetMap = Record<BrandId, number>;

export const initialTargetMap: TargetMap = Object.fromEntries(
  targets.map((t) => [t.brandId, t.targetROAS]),
) as TargetMap;
