import type { Metadata } from "next";
import { ContentDesk } from "@/components/content/ContentDesk";

export const metadata: Metadata = { title: "Content Desk · Agency OS" };

export default function ContentPage() {
  return <ContentDesk />;
}
