"use client";

import { Sparkles } from "lucide-react";
import type { BrandId, Platform } from "@/types";
import { useAIDrawer } from "@/components/providers/AIDrawerProvider";
import { Button } from "@/components/ui/button";

export function AskAIButton({
  brandId,
  platform,
  question,
  label = "Ask Agency AI",
  variant = "outline",
  size = "sm",
}: {
  brandId?: BrandId;
  platform?: Platform;
  question?: string;
  label?: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "sm" | "default";
}) {
  const { openDrawer } = useAIDrawer();
  return (
    <Button variant={variant} size={size} onClick={() => openDrawer({ brandId, platform, initialQuestion: question })}>
      <Sparkles className="text-violet-600" /> {label}
    </Button>
  );
}
