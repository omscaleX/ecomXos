"use client";

import * as React from "react";
import type { BrandId } from "@/types";
import { brandsById } from "@/data/brands";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getBrandSummary } from "@/lib/analytics";
import { calculateTargetGap, calculateTargetStatus } from "@/lib/calculations";
import { formatGap, formatROAS } from "@/lib/formatters";
import { getVisibleBrands } from "@/lib/permissions";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Edit a brand's ROAS target. React state only – the whole app updates. */
export function EditTargetModal({
  open,
  onOpenChange,
  brandId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId?: BrandId;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {/* The form is mounted fresh each time the dialog opens so its state starts from the current target. */}
        {open && <EditTargetForm key={brandId ?? "any"} brandId={brandId} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EditTargetForm({ brandId, onClose }: { brandId?: BrandId; onClose: () => void }) {
  const { currentUser, targets, setTarget } = useAppState();
  const brands = getVisibleBrands(currentUser);
  const [selected, setSelected] = React.useState<BrandId>(brandId ?? brands[0].id);
  const [value, setValue] = React.useState(() => String(targets[brandId ?? brands[0].id]));
  const [error, setError] = React.useState<string | null>(null);

  const summary = getBrandSummary(selected, targets);
  const parsed = Number(value);
  const valid = Number.isFinite(parsed) && parsed > 0 && parsed < 20;
  const previewGap = valid ? calculateTargetGap(summary.actualROAS, parsed) : summary.gap;
  const previewStatus = valid ? calculateTargetStatus(summary.actualROAS, parsed) : summary.status;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError("Enter a ROAS target between 0 and 20, e.g. 2.50");
      return;
    }
    setTarget(selected, Number(parsed.toFixed(2)));
    onClose();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Edit ROAS target</DialogTitle>
        <DialogDescription>Targets are checked against Actual ROAS, which is Shopify sales divided by total ad spend.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="target-brand">Brand</Label>
        <Select
          value={selected}
          onValueChange={(v) => {
            setSelected(v as BrandId);
            setValue(String(targets[v as BrandId]));
          }}
          disabled={!!brandId}
        >
          <SelectTrigger id="target-brand" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="target-value">ROAS target</Label>
        <Input id="target-value" type="number" step="0.05" min="0.1" max="20" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-md bg-muted/60 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{brandsById[selected].name} · Actual ROAS</span>
          <span className="tabular font-semibold">{formatROAS(summary.actualROAS)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground">Gap with new target</span>
          <span className="tabular flex items-center gap-2 font-medium">
            {formatGap(previewGap)}
            <TargetStatusBadge status={previewStatus} />
          </span>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save target</Button>
      </DialogFooter>
    </form>
  );
}
