import type { Brand, BrandId } from "@/types";

export const brands: Brand[] = [
  {
    id: "yeoul",
    name: "Yeoul",
    currency: "INR",
    market: "India",
    category: "Skincare",
    managerId: "lucky",
    metaOwnerId: "om",
    googleOwnerId: "sagar",
    shopifyStore: "yeoul.myshopify.com",
    colorClass: "bg-rose-500",
  },
  {
    id: "giggle-pad",
    name: "Giggle Pad",
    currency: "INR",
    market: "India",
    category: "Kids & Toys",
    managerId: "lucky",
    metaOwnerId: "om",
    googleOwnerId: "sagar",
    shopifyStore: "gigglepad.myshopify.com",
    colorClass: "bg-orange-500",
  },
  {
    id: "nysh-warmee",
    name: "Nysh - Warmee",
    currency: "INR",
    market: "India",
    category: "Winter Wear",
    managerId: "lucky",
    metaOwnerId: "anubhav",
    googleOwnerId: "sagar",
    shopifyStore: "nysh-warmee.myshopify.com",
    colorClass: "bg-violet-500",
  },
  {
    id: "nysh-bluheat",
    name: "Nysh - BluHeat",
    currency: "INR",
    market: "India",
    category: "Heated Apparel",
    managerId: "lucky",
    metaOwnerId: "anubhav",
    googleOwnerId: "sagar",
    shopifyStore: "nysh-bluheat.myshopify.com",
    colorClass: "bg-blue-600",
  },
  {
    id: "desividesi-india",
    name: "DesiVidesi - India",
    currency: "INR",
    market: "India",
    category: "Ethnic Fashion",
    managerId: "lucky",
    metaOwnerId: "om",
    googleOwnerId: "sagar",
    shopifyStore: "desividesi-in.myshopify.com",
    colorClass: "bg-emerald-600",
  },
  {
    id: "desividesi-dubai",
    name: "DesiVidesi - Dubai",
    currency: "AED",
    market: "Dubai",
    category: "Ethnic Fashion",
    managerId: "lucky",
    metaOwnerId: "anubhav",
    googleOwnerId: "sagar",
    shopifyStore: "desividesi-ae.myshopify.com",
    colorClass: "bg-teal-600",
  },
];

export const brandsById: Record<BrandId, Brand> = Object.fromEntries(
  brands.map((b) => [b.id, b]),
) as Record<BrandId, Brand>;

export const brandIds: BrandId[] = brands.map((b) => b.id);

export function getBrand(id: BrandId): Brand {
  return brandsById[id];
}

export function isBrandId(value: string): value is BrandId {
  return value in brandsById;
}

/** Resolve a brand from free text (used by the AI engine). */
export function findBrandInText(text: string): Brand | undefined {
  const t = text.toLowerCase();
  const aliases: Array<[BrandId, string[]]> = [
    ["nysh-bluheat", ["bluheat", "blu heat", "blue heat"]],
    ["nysh-warmee", ["warmee", "warmy"]],
    ["desividesi-dubai", ["dubai", "desividesi dubai", "desi videsi dubai"]],
    ["desividesi-india", ["desividesi india", "desi videsi india", "desividesi - india", "dvi"]],
    ["giggle-pad", ["giggle pad", "gigglepad", "giggle"]],
    ["yeoul", ["yeoul"]],
  ];
  for (const [id, names] of aliases) {
    if (names.some((n) => t.includes(n))) return brandsById[id];
  }
  // Bare "desividesi" without a market defaults to India.
  if (t.includes("desividesi") || t.includes("desi videsi")) {
    return brandsById["desividesi-india"];
  }
  return undefined;
}
