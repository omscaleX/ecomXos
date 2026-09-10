"use client";

import { Sparkles } from "lucide-react";
import { brandsById } from "@/data/brands";
import { useAIDrawer } from "@/components/providers/AIDrawerProvider";
import { AIChat } from "@/components/ai/AIChat";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

/** Right-side context-aware Agency AI drawer, mounted once in the app shell. */
export function AIDrawer() {
  const { open, setOpen, context, closeDrawer } = useAIDrawer();
  const brand = context.brandId ? brandsById[context.brandId] : undefined;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <div className="flex items-center gap-3 border-b px-4 py-3 pr-12">
          <span className="flex size-8 items-center justify-center rounded-md bg-violet-100 text-violet-700" aria-hidden>
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-sm">Agency AI</SheetTitle>
            <SheetDescription className="truncate text-xs">
              {brand ? `Context: ${brand.name}` : "Ask about brands, performance, targets or tasks."}
            </SheetDescription>
          </div>
          {brand && <Badge variant="outline">{brand.name}</Badge>}
        </div>
        {open && (
          <AIChat
            variant="drawer"
            brandId={context.brandId}
            platform={context.platform}
            initialQuestion={context.initialQuestion}
            onNavigate={closeDrawer}
            className="flex-1"
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
