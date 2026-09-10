import type { Metadata } from "next";
import { AIPage } from "@/components/ai/AIPage";

export const metadata: Metadata = { title: "Agency AI" };

export default function AgencyAIPage() {
  return <AIPage />;
}
