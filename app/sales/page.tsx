import type { Metadata } from "next";
import { SalesView } from "@/components/sales/SalesView";

export const metadata: Metadata = { title: "Shopify Sales" };

export default function SalesPage() {
  return <SalesView />;
}
