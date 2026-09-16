import type { Metadata } from "next";
import { RequestDetail } from "@/components/content/RequestDetail";

export async function generateMetadata({ params }: { params: Promise<{ requestId: string }> }): Promise<Metadata> {
  const { requestId } = await params;
  return { title: `${requestId} · Agency OS` };
}

export default async function ContentRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  return <RequestDetail requestId={requestId} />;
}
