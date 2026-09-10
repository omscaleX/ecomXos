import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SourceLabel } from "@/components/shared/SourceLabel";
import { cn } from "@/lib/utils";

/**
 * Headline metric with its data source underneath. `secondary` is used for
 * the separate Dubai (AED) figure so INR and AED are never added together.
 */
export function MetricCard({
  label,
  value,
  source,
  hint,
  secondary,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  source?: string;
  hint?: string;
  secondary?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardContent className="flex flex-col gap-1 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon && <Icon className="size-4 text-muted-foreground/70" aria-hidden />}
        </div>
        <p
          className={cn(
            "tabular text-2xl font-semibold tracking-tight",
            tone === "success" && "text-emerald-700",
            tone === "warning" && "text-amber-700",
            tone === "danger" && "text-red-700",
          )}
        >
          {value}
        </p>
        {secondary && <div className="tabular text-xs text-muted-foreground">{secondary}</div>}
        {source && <SourceLabel source={source} hint={hint} className="mt-1" />}
      </CardContent>
    </Card>
  );
}

export function MetricGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", className)}>{children}</div>;
}
