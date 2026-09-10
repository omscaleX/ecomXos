import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Small label telling the reader where a number comes from, e.g.
 * "Shopify Net Sales" or "Meta + Google Ad Spend". Shown under every
 * important metric for trust.
 */
export function SourceLabel({ source, hint, className }: { source: string; hint?: string; className?: string }) {
  const label = <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>{source}{hint && <Info className="size-3" aria-hidden />}</span>;
  if (!hint) return label;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="cursor-help text-left" aria-label={`${source}. ${hint}`}>
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

export const SOURCE = {
  shopify: "Shopify Net Sales",
  totalSpend: "Meta + Google Ad Spend",
  metaSpend: "Meta Ads",
  googleSpend: "Google Ads",
  actualROAS: "Shopify Net Sales ÷ Total Ad Spend",
  target: "Internal target",
  tasks: "Internal tasks",
  orders: "Shopify Orders",
  aov: "Shopify Net Sales ÷ Orders",
} as const;
