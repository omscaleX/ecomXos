"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import type { BrandId, ContentDepartment } from "@/types";
import type {
  AspectRatio,
  ContentAsset,
  CreativeType,
  FunnelStage,
  RequestDetails,
  ScriptType,
  VideoPlatform,
} from "@/types/content";
import {
  CREATIVE_TYPES,
  DESIGN_DIMENSIONS,
  FUNNEL_STAGES,
  SCRIPT_TYPES,
  VIDEO_FORMATS,
  VIDEO_PLATFORMS,
} from "@/types/content";
import { brandsById } from "@/data/brands";
import { getBrandCampaigns, getBrandProducts } from "@/data/products";
import { addDays } from "@/data/demo/series";
import { useAppState, useContent } from "@/components/providers/AppStateProvider";
import { getVisibleBrands } from "@/lib/permissions";
import { DEPARTMENTS, DEPARTMENT_BLURB, DEPARTMENT_LABEL, suggestAssets } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrandMark } from "@/components/shared/BrandMark";
import { DepartmentBadge } from "@/components/content/ContentBits";
import { cn } from "@/lib/utils";

/**
 * Raise a content request.
 *
 * Everything that can be filled in for you already is: the brand, the
 * product, the campaign, who is asking, and today's date. You only choose
 * the department, say what you need and set a date.
 */

export function RaiseContentTaskModal({
  open,
  onOpenChange,
  context,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: { brandId?: BrandId; productIds?: string[]; campaignId?: string; sourceLabel?: string; sourcePath?: string };
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        {/* Remount on open so the form always starts clean. */}
        {open && <RequestForm key="form" onDone={() => onOpenChange(false)} context={context} />}
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({
  onDone,
  context,
}: {
  onDone: () => void;
  context?: { brandId?: BrandId; productIds?: string[]; campaignId?: string; sourceLabel?: string; sourcePath?: string };
}) {
  const router = useRouter();
  const { currentUser, today } = useAppState();
  const { raiseContentRequest, contentAssets } = useContent();
  const brandOptions = getVisibleBrands(currentUser);

  const [department, setDepartment] = React.useState<ContentDepartment>("script");
  const [brandId, setBrandId] = React.useState<BrandId>(context?.brandId ?? brandOptions[0].id);
  const [productIds, setProductIds] = React.useState<string[]>(context?.productIds ?? []);
  const [campaignId, setCampaignId] = React.useState<string>(context?.campaignId ?? "none");
  const [brief, setBrief] = React.useState("");
  const [eta, setEta] = React.useState(addDays(today, 5));
  const [pickedAssets, setPickedAssets] = React.useState<string[]>([]);

  // Department-specific answers.
  const [count, setCount] = React.useState(3);
  const [scriptType, setScriptType] = React.useState<ScriptType>("UGC");
  const [platform, setPlatform] = React.useState<VideoPlatform>("Meta");
  const [videoFormat, setVideoFormat] = React.useState<AspectRatio>("9:16");
  const [creativeType, setCreativeType] = React.useState<CreativeType>("Static");
  const [dimensions, setDimensions] = React.useState<AspectRatio>("1:1");
  const [funnel, setFunnel] = React.useState<FunnelStage>("BOF");

  const brand = brandsById[brandId];
  const products = getBrandProducts(brandId);
  const campaigns = getBrandCampaigns(brandId);

  // Which existing files are worth offering for this department.
  const assetKinds: Record<ContentDepartment, ContentAsset["kind"][]> = {
    script: ["reference", "ad_copy", "creative"],
    video: ["script", "raw_video", "reference"],
    design: ["ad_copy", "creative", "reference"],
  };
  const suggestions = suggestAssets(contentAssets, {
    brandId,
    productIds,
    campaignId: campaignId === "none" ? undefined : campaignId,
    kinds: assetKinds[department],
  }).slice(0, 8);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const buildDetails = (): RequestDetails => {
    if (department === "script") return { department: "script", scriptCount: count, scriptType };
    if (department === "video")
      return { department: "video", videoCount: count, scriptAssetIds: pickedAssets, platform, format: videoFormat };
    return {
      department: "design",
      creativeCount: count,
      adCopyAssetIds: pickedAssets,
      funnel,
      creativeType,
      dimensions,
    };
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const request = raiseContentRequest({
      department,
      brandId,
      productIds,
      campaignId: campaignId === "none" ? undefined : campaignId,
      details: buildDetails(),
      brief: brief.trim() || "No extra notes.",
      eta,
      referenceAssetIds: department === "script" ? pickedAssets : [],
      rawAssetIds: department === "video" ? pickedAssets : [],
      source: {
        label: context?.sourceLabel ?? "Content Desk",
        path: context?.sourcePath ?? "/content",
      },
    });
    onDone();
    router.push(`/content/${request.id}`);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>Ask for content</DialogTitle>
        <DialogDescription>
          Choose the team, say what you need and when. Everything else is filled in for you.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label>Which team?</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDepartment(d);
                setPickedAssets([]);
              }}
              aria-pressed={department === d}
              className={cn(
                "rounded-lg border bg-card p-3 text-left transition-colors cursor-pointer hover:border-primary/40",
                department === d && "border-primary ring-2 ring-primary/20",
              )}
            >
              <span className="mb-1 flex items-center justify-between">
                <DepartmentBadge department={d} full />
                {department === d && <Check className="size-4 text-primary" />}
              </span>
              <span className="block text-xs text-muted-foreground">{DEPARTMENT_BLURB[d]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Context: already known, editable if wrong. */}
      <div className="rounded-lg border bg-muted/40 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Filled in for you</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="req-brand">Brand</Label>
            <Select value={brandId} onValueChange={(v) => { setBrandId(v as BrandId); setProductIds([]); setCampaignId("none"); setPickedAssets([]); }}>
              <SelectTrigger id="req-brand"><SelectValue /></SelectTrigger>
              <SelectContent>
                {brandOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="req-campaign">Campaign</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger id="req-campaign"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not for a campaign</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label>Products (tap to pick)</Label>
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(productIds, setProductIds, p.id)}
                aria-pressed={productIds.includes(p.id)}
                className={cn(
                  "rounded-md border bg-card px-2.5 py-1 text-xs cursor-pointer hover:border-primary/40",
                  productIds.includes(p.id) && "border-primary bg-primary/5 font-medium",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <BrandMark brand={brand} size="sm" />
          Asked by {currentUser.name} · {today} · goes to the {DEPARTMENT_LABEL[department]} queue
        </p>
      </div>

      {/* What you need */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="req-count">How many?</Label>
          <Input
            id="req-count"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="req-eta">Needed by</Label>
          <Input id="req-eta" type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
        </div>

        {department === "script" && (
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="req-script-type">Kind of script</Label>
            <Select value={scriptType} onValueChange={(v) => setScriptType(v as ScriptType)}>
              <SelectTrigger id="req-script-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCRIPT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {department === "video" && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="req-platform">Where will it run?</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as VideoPlatform)}>
                <SelectTrigger id="req-platform"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIDEO_PLATFORMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="req-format">Shape</Label>
              <Select value={videoFormat} onValueChange={(v) => setVideoFormat(v as AspectRatio)}>
                <SelectTrigger id="req-format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIDEO_FORMATS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {department === "design" && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="req-creative-type">Kind of creative</Label>
              <Select value={creativeType} onValueChange={(v) => setCreativeType(v as CreativeType)}>
                <SelectTrigger id="req-creative-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CREATIVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="req-dimensions">Size</Label>
              <Select value={dimensions} onValueChange={(v) => setDimensions(v as AspectRatio)}>
                <SelectTrigger id="req-dimensions"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DESIGN_DIMENSIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="req-funnel">Funnel stage</Label>
              <Select value={funnel} onValueChange={(v) => setFunnel(v as FunnelStage)}>
                <SelectTrigger id="req-funnel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUNNEL_STAGES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="req-brief">What do you need? </Label>
        <Textarea
          id="req-brief"
          rows={3}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Say it plainly. Example: five short videos for the winter push, lead with the heat setting."
        />
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <Label>
            {department === "video" ? "Scripts and footage to use" : department === "design" ? "Ad copy to design around" : "Anything to look at first"}
          </Label>
          <p className="text-xs text-muted-foreground">Already on file for {brand.name}. Tap to attach, no need to upload again.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(pickedAssets, setPickedAssets, a.id)}
                aria-pressed={pickedAssets.includes(a.id)}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-md border bg-card px-3 py-2 text-left text-xs cursor-pointer hover:border-primary/40",
                  pickedAssets.includes(a.id) && "border-primary bg-primary/5",
                )}
              >
                <span className={cn("flex size-4 shrink-0 items-center justify-center rounded border", pickedAssets.includes(a.id) && "border-primary bg-primary text-primary-foreground")}>
                  {pickedAssets.includes(a.id) && <Check className="size-3" />}
                </span>
                <span className="truncate">{a.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit">
          <Plus /> Send to {DEPARTMENT_LABEL[department]}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** The button that opens the form. Put it anywhere; context comes with it. */
export function RaiseContentTaskButton({
  context,
  variant = "default",
  size = "sm",
  label = "Ask for content",
  className,
}: {
  context?: { brandId?: BrandId; productIds?: string[]; campaignId?: string; sourceLabel?: string; sourcePath?: string };
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant={variant} size={size} className={cn("gap-1.5", className)} onClick={() => setOpen(true)}>
        <Plus /> <span>{label}</span>
      </Button>
      <RaiseContentTaskModal open={open} onOpenChange={setOpen} context={context} />
    </>
  );
}
