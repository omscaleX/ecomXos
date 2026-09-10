import type { Metadata } from "next";
import { BrandsView } from "@/components/brands/BrandsView";

export const metadata: Metadata = { title: "Brands" };

export default function BrandsPage() {
  return <BrandsView />;
}
