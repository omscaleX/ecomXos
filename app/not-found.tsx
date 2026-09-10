"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      description="The page you're looking for doesn't exist in Agency OS."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      }
    />
  );
}
