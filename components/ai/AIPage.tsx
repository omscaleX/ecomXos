"use client";

import { Sparkles } from "lucide-react";
import { useCurrentUser } from "@/components/providers/AppStateProvider";
import { getVisibleBrands, isManager } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { AIChat } from "@/components/ai/AIChat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/** /ai – full-page Agency AI chat. */
export function AIPage() {
  const user = useCurrentUser();
  const manager = isManager(user);
  const brands = getVisibleBrands(user);
  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-violet-100 text-violet-700" aria-hidden>
              <Sparkles className="size-4" />
            </span>
            Agency AI
          </span>
        }
        subtitle="Ask anything about your brands, performance, targets or tasks."
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">Answering as {user.name} · {user.shortRoleLabel}</Badge>
            <Badge variant="neutral">{manager ? "All brands" : `${brands.length} brands`}</Badge>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="gap-0 py-0 lg:col-span-3">
          <CardContent className="h-[calc(100vh-15rem)] min-h-[520px] p-0">
            <AIChat variant="page" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="gap-0 py-0">
            <CardContent className="space-y-3 p-4 text-sm">
              <p className="font-semibold">What it knows</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>Brands and owners</li>
                <li>Meta and Google performance{!manager && user.platform ? ` (${user.platform === "meta" ? "Meta" : "Google"} for you)` : ""}</li>
                <li>Shopify Net Sales and orders</li>
                <li>ROAS targets and status</li>
                <li>Tasks{manager ? " and team workload" : " assigned to you"}</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                Answers are computed from the same demo data and calculation functions as the dashboards. No campaign-level guesses are made.
              </p>
            </CardContent>
          </Card>
          <Card className="gap-0 py-0">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="font-semibold">Try follow-ups</p>
              <p className="text-xs text-muted-foreground">Ask &ldquo;Which brand is worst?&rdquo;, then &ldquo;Why?&rdquo;, then &ldquo;What should we do?&rdquo; – the conversation keeps its context.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
