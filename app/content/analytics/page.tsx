import type { Metadata } from "next";
import { ContentAnalytics } from "@/components/content/ContentAnalytics";

export const metadata: Metadata = { title: "Content Reports · Agency OS" };

export default function ContentAnalyticsPage() {
  return <ContentAnalytics />;
}
