import type { BrandId, Creative } from "@/types";

/**
 * Lightweight creative library for the brand "Creatives" tab.
 * Demo data only – there is no asset storage in the prototype.
 */
const seeds: Record<BrandId, Array<Omit<Creative, "id" | "brandId">>> = {
  yeoul: [
    { name: "Glow Serum – Before/After", format: "Image", platform: "meta", status: "Live", ctr: 0.0161 },
    { name: "Routine in 15s", format: "Video", platform: "meta", status: "Live", ctr: 0.0138 },
    { name: "Bestsellers Carousel", format: "Carousel", platform: "meta", status: "Paused", ctr: 0.0097 },
    { name: "Search RSA – Skincare", format: "Image", platform: "google", status: "Live", ctr: 0.041 },
  ],
  "giggle-pad": [
    { name: "Play Mat Unboxing", format: "Video", platform: "meta", status: "Live", ctr: 0.0129 },
    { name: "Parents Testimonial", format: "Video", platform: "meta", status: "In Review", ctr: 0 },
    { name: "Gift Bundle Static", format: "Image", platform: "meta", status: "Live", ctr: 0.0112 },
    { name: "Shopping Feed Images", format: "Image", platform: "google", status: "Live", ctr: 0.014 },
  ],
  "nysh-warmee": [
    { name: "Winter Layering Guide", format: "Carousel", platform: "meta", status: "Live", ctr: 0.0172 },
    { name: "Thermal Test – Cold Room", format: "Video", platform: "meta", status: "Live", ctr: 0.0158 },
    { name: "Combo Offer Static", format: "Image", platform: "meta", status: "Paused", ctr: 0.0101 },
  ],
  "nysh-bluheat": [
    { name: "Heated Jacket Launch Film", format: "Video", platform: "meta", status: "Paused", ctr: 0.0071 },
    { name: "Product Feature Static", format: "Image", platform: "meta", status: "Live", ctr: 0.0088 },
    { name: "UGC Review Clip", format: "Video", platform: "meta", status: "In Review", ctr: 0 },
  ],
  "desividesi-india": [
    { name: "Festive Collection Reel", format: "Video", platform: "meta", status: "Live", ctr: 0.0189 },
    { name: "Catalog Carousel – Kurtas", format: "Carousel", platform: "meta", status: "Live", ctr: 0.0244 },
    { name: "Shopping Feed Images", format: "Image", platform: "google", status: "Live", ctr: 0.019 },
  ],
  "desividesi-dubai": [
    { name: "UAE Festive Static", format: "Image", platform: "meta", status: "Live", ctr: 0.0124 },
    { name: "Delivery Promise Reel", format: "Video", platform: "meta", status: "Paused", ctr: 0.0086 },
  ],
};

export const creatives: Creative[] = (Object.keys(seeds) as BrandId[]).flatMap((brandId) =>
  seeds[brandId].map((c, i) => ({ id: `${brandId}-cr-${i + 1}`, brandId, ...c })),
);
