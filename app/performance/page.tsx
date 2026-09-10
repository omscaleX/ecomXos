import * as React from "react";
import type { Metadata } from "next";
import { PerformanceView } from "@/components/performance/PerformanceView";

export const metadata: Metadata = { title: "Performance" };

export default function PerformancePage() {
  return (
    <React.Suspense fallback={null}>
      <PerformanceView />
    </React.Suspense>
  );
}
