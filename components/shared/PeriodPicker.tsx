"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { DateRange, DateRangeKey, Granularity, RangeInput } from "@/types";
import { addDays } from "@/data/demo/series";
import {
  availableGranularities,
  DATA_WINDOW,
  DATE_RANGE_LABEL,
  DATE_RANGE_PRESETS,
  defaultGranularity,
  isDateRange,
  resolveRange,
  startOfMonth,
} from "@/lib/analytics";
import { formatShortDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Period state
 * ------------------------------------------------------------------ */

export interface Period {
  range: RangeInput;
  granularity: Granularity;
}

/**
 * Keeps a range and a granularity in step. When the range changes, the
 * granularity falls back to something the new range can actually show,
 * so a week view is never offered for a three-day window.
 */
export function usePeriod(initialRange: RangeInput = "30d", initialGranularity?: Granularity) {
  const [range, setRangeState] = React.useState<RangeInput>(initialRange);
  const [granularity, setGranularity] = React.useState<Granularity>(
    initialGranularity ?? defaultGranularity(initialRange),
  );

  const setRange = React.useCallback((next: RangeInput) => {
    setRangeState(next);
    setGranularity((current) =>
      availableGranularities(next).includes(current) ? current : defaultGranularity(next),
    );
  }, []);

  return { range, granularity, setRange, setGranularity };
}

/** Human label for whatever is selected, e.g. "Last 30 Days" or "12 Aug – 10 Sep". */
export function describeRange(range: RangeInput): string {
  if (!isDateRange(range)) return DATE_RANGE_LABEL[range];
  const { from, to } = resolveRange(range);
  if (from === to) return formatShortDate(from);
  return `${formatShortDate(from)} – ${formatShortDate(to)}`;
}

/* ------------------------------------------------------------------ *
 * Calendar
 * ------------------------------------------------------------------ */

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function daysInMonth(monthStart: string): string[] {
  const [y, m] = monthStart.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${monthStart.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`);
}

/** Blank cells before the 1st so the month starts on the right weekday. */
function leadingBlanks(monthStart: string): number {
  const day = new Date(`${monthStart}T00:00:00Z`).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

/** One month grid with range selection. */
function MonthGrid({
  monthStart,
  selection,
  pendingStart,
  onPick,
  min,
  max,
}: {
  monthStart: string;
  selection: DateRange;
  pendingStart: string | null;
  onPick: (iso: string) => void;
  min: string;
  max: string;
}) {
  const days = daysInMonth(monthStart);
  const [y, m] = monthStart.split("-").map(Number);
  return (
    <div>
      <p className="mb-2 text-center text-sm font-medium">{MONTHS[m - 1]} {y}</p>
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-1 text-center text-[10px] font-medium text-muted-foreground">{d}</span>
        ))}
        {Array.from({ length: leadingBlanks(monthStart) }).map((_, i) => (
          <span key={`b${i}`} />
        ))}
        {days.map((iso) => {
          const disabled = iso < min || iso > max;
          const inSelection = !pendingStart && iso >= selection.from && iso <= selection.to;
          const isEdge = !pendingStart && (iso === selection.from || iso === selection.to);
          const isPending = pendingStart === iso;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onPick(iso)}
              aria-label={formatShortDate(iso)}
              aria-pressed={isEdge || isPending}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-xs tabular transition-colors",
                disabled && "cursor-not-allowed text-muted-foreground/35",
                !disabled && "cursor-pointer hover:bg-accent",
                inSelection && !isEdge && "bg-accent",
                (isEdge || isPending) && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Date range picker
 * ------------------------------------------------------------------ */

export function DateRangePicker({
  range,
  onChange,
  className,
}: {
  range: RangeInput;
  onChange: (range: RangeInput) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pendingStart, setPendingStart] = React.useState<string | null>(null);
  const selection = resolveRange(range);
  const [month, setMonth] = React.useState(() => startOfMonth(selection.to));

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Start each visit from a clean selection, on the month being viewed.
      setPendingStart(null);
      setMonth(startOfMonth(resolveRange(range).to));
    }
    setOpen(next);
  };

  const pick = (iso: string) => {
    if (!pendingStart) {
      setPendingStart(iso);
      return;
    }
    const next: DateRange = pendingStart <= iso ? { from: pendingStart, to: iso } : { from: iso, to: pendingStart };
    setPendingStart(null);
    onChange(next);
    setOpen(false);
  };

  const prevMonth = startOfMonth(addDays(month, -1));
  const nextMonth = startOfMonth(addDays(`${month.slice(0, 7)}-28`, 7));
  const canGoBack = prevMonth >= startOfMonth(DATA_WINDOW.from);
  const canGoForward = nextMonth <= startOfMonth(DATA_WINDOW.to);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)} aria-label="Choose a date range">
          <CalendarDays />
          {describeRange(range)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex shrink-0 flex-row flex-wrap gap-1 border-b p-2 sm:w-40 sm:flex-col sm:border-r sm:border-b-0">
            {DATE_RANGE_PRESETS.map((preset: DateRangeKey) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onChange(preset);
                  setOpen(false);
                }}
                aria-pressed={range === preset}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer hover:bg-accent",
                  range === preset && "bg-accent text-accent-foreground",
                )}
              >
                {DATE_RANGE_LABEL[preset]}
              </button>
            ))}
          </div>
          <div className="p-3">
            <div className="mb-1 flex items-center justify-between">
              <Button variant="ghost" size="icon-sm" disabled={!canGoBack} onClick={() => setMonth(prevMonth)} aria-label="Previous month">
                <ChevronLeft />
              </Button>
              <p className="text-xs text-muted-foreground">
                {pendingStart ? `Start ${formatShortDate(pendingStart)}. Pick the end date.` : "Pick a start and end date"}
              </p>
              <Button variant="ghost" size="icon-sm" disabled={!canGoForward} onClick={() => setMonth(nextMonth)} aria-label="Next month">
                <ChevronRight />
              </Button>
            </div>
            <MonthGrid
              monthStart={month}
              selection={selection}
              pendingStart={pendingStart}
              onPick={pick}
              min={DATA_WINDOW.from}
              max={DATA_WINDOW.to}
            />
            <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
              Demo data covers {formatShortDate(DATA_WINDOW.from)} to {formatShortDate(DATA_WINDOW.to)}.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ *
 * Granularity toggle
 * ------------------------------------------------------------------ */

const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

export function GranularityToggle({
  range,
  granularity,
  onChange,
}: {
  range: RangeInput;
  granularity: Granularity;
  onChange: (g: Granularity) => void;
}) {
  const options = availableGranularities(range);
  if (options.length < 2) return null;
  return (
    <Tabs value={granularity} onValueChange={(v) => onChange(v as Granularity)}>
      <TabsList aria-label="Group by">
        {options.map((g) => (
          <TabsTrigger key={g} value={g}>{GRANULARITY_LABEL[g]}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/** Calendar plus the day / week / month toggle, as one control bar. */
export function PeriodControls({
  period,
  onRangeChange,
  onGranularityChange,
  className,
}: {
  period: Period;
  onRangeChange: (range: RangeInput) => void;
  onGranularityChange: (g: Granularity) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <DateRangePicker range={period.range} onChange={onRangeChange} />
      <GranularityToggle range={period.range} granularity={period.granularity} onChange={onGranularityChange} />
    </div>
  );
}
