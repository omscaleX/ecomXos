"use client";

import { ErrorState } from "@/components/shared/States";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Something went wrong." description="This page could not be rendered. Try again." onRetry={reset} />;
}
