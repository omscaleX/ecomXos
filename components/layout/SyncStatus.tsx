"use client";

import { RefreshCw } from "lucide-react";
import { dataSources } from "@/data/sources";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

/** Static sync indicators. Demo values – nothing is actually connected. */
export function SyncStatus({ compact = false }: { compact?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size={compact ? "icon-sm" : "sm"} className="text-muted-foreground" aria-label="Data source sync status">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          {!compact && <span className="hidden md:inline">Synced {dataSources[0].lastSynced}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">Data sources</p>
          <Badge variant="neutral">Demo Data</Badge>
        </div>
        <ul className="divide-y">
          {dataSources.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
                {s.name}
              </span>
              <span className="text-xs text-muted-foreground">Connected</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span>Last synced: {dataSources[0].lastSynced}</span>
          <RefreshCw className="size-3.5" aria-hidden />
        </div>
        <p className="border-t bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          Sync status is simulated. Real API connections will be added with the backend.
        </p>
      </PopoverContent>
    </Popover>
  );
}
