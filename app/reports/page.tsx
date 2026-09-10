import * as React from "react";
import type { Metadata } from "next";
import { ReportsView } from "@/components/reports/ReportsView";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <React.Suspense fallback={null}>
      <ReportsView />
    </React.Suspense>
  );
}
