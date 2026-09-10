import type { Brand } from "@/types";
import { cn } from "@/lib/utils";

export function BrandMark({ brand, size = "md", className }: { brand: Brand; size?: "sm" | "md" | "lg"; className?: string }) {
  const initials = brand.name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white",
        size === "sm" && "size-6 text-[10px]",
        size === "md" && "size-8 text-xs",
        size === "lg" && "size-12 text-base",
        brand.colorClass,
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function BrandChip({ brand, subtitle }: { brand: Brand; subtitle?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <BrandMark brand={brand} size="sm" />
      <span className="leading-tight">
        <span className="block text-sm font-medium">{brand.name}</span>
        {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}
