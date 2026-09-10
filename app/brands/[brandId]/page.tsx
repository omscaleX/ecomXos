import * as React from "react";
import type { Metadata } from "next";
import { BrandDetail } from "@/components/brands/BrandDetail";
import { brandsById, isBrandId } from "@/data/brands";

export async function generateMetadata({ params }: { params: Promise<{ brandId: string }> }): Promise<Metadata> {
  const { brandId } = await params;
  return { title: isBrandId(brandId) ? brandsById[brandId].name : "Brand" };
}

export default async function BrandPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  return (
    <React.Suspense fallback={null}>
      <BrandDetail brandId={brandId} />
    </React.Suspense>
  );
}
