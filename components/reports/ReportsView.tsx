"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, Printer, Sparkles } from "lucide-react";
import type { BrandId } from "@/types";
import { brandsById } from "@/data/brands";
import { usersById } from "@/data/users";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getBrandSummaries, getPortfolios, getRangeDates } from "@/lib/analytics";
import { generateAgencySummary } from "@/lib/agency";
import { getVisibleBrands } from "@/lib/permissions";
import { formatCurrency, formatLongDate, formatNumber, formatROAS, TARGET_STATUS_LABEL } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/PageHeader";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/States";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BrandFilter = "all" | BrandId;

/** /reports – Weekly Performance Report with a simulated "Generate Report" flow. */
export function ReportsView() {
  const { currentUser, today } = useAppState();
  const params = useSearchParams();
  const brands = getVisibleBrands(currentUser);
  const requested = params.get("brand");
  const [brandFilter, setBrandFilter] = React.useState<BrandFilter>(
    requested && brands.some((b) => b.id === requested) ? (requested as BrandId) : "all",
  );
  const [range, setRange] = React.useState<"7d" | "30d">("7d");
  const [status, setStatus] = React.useState<"idle" | "generating" | "done">("idle");
  const timer = React.useRef<number | null>(null);

  const selected = brandFilter === "all" ? brands : brands.filter((b) => b.id === brandFilter);
  const dates = getRangeDates(range, today);

  const generate = () => {
    setStatus("generating");
    timer.current = window.setTimeout(() => setStatus("done"), 700);
  };
  React.useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Weekly Performance Report built from the same data as the dashboards."
        actions={<AskAIButton question="Summarize the agency." />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance Report</CardTitle>
          <CardDescription>Choose the brand and date range, then generate a preview. No PDF is produced in the prototype.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="report-brand">Brand</Label>
            <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v as BrandFilter); setStatus("idle"); }}>
              <SelectTrigger id="report-brand" className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="report-range">Date range</Label>
            <Select value={range} onValueChange={(v) => { setRange(v as "7d" | "30d"); setStatus("idle"); }}>
              <SelectTrigger id="report-range" className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={status === "generating"}>
            <FileText /> {status === "generating" ? "Generating…" : "Generate Report"}
          </Button>
          {status === "done" && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700" role="status">
              <CheckCircle2 className="size-4" /> Report generated successfully.
            </span>
          )}
        </CardContent>
      </Card>

      {status !== "done" ? (
        <EmptyState
          icon={FileText}
          title="No report generated yet"
          description="Pick a brand and date range and click Generate Report to see the preview."
        />
      ) : (
        <ReportPreview brandIds={selected.map((b) => b.id)} range={range} from={dates.from} to={dates.to} generatedBy={currentUser.name} />
      )}
    </div>
  );
}

function ReportPreview({ brandIds, range, from, to, generatedBy }: { brandIds: BrandId[]; range: "7d" | "30d"; from: string; to: string; generatedBy: string }) {
  const { targets, tasks, today } = useAppState();
  const summaries = getBrandSummaries(brandIds, targets, range);
  const portfolios = getPortfolios(summaries);
  // Target status always uses the 30-day window so it matches the dashboards.
  const agency = generateAgencySummary(brandIds, targets, tasks, { today });
  const topBrands = [...summaries].sort((a, b) => b.gapPercent - a.gapPercent).slice(0, 3);
  const singleBrand = brandIds.length === 1 ? brandsById[brandIds[0]] : undefined;
  const teamTasks = tasks.filter((t) => brandIds.includes(t.brandId) && t.status !== "completed");

  return (
    <Card className="print:border-0 print:shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Weekly Performance Report{singleBrand ? ` · ${singleBrand.name}` : " · All brands"}</CardTitle>
            <CardDescription>
              {formatLongDate(from)} – {formatLongDate(to)} · generated by {generatedBy} · <Badge variant="neutral">Demo Data</Badge>
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer /> Print preview</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h4 className="mb-2 text-sm font-semibold">Summary</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {portfolios.map((p) => (
              <dl key={p.currency} className="grid grid-cols-2 gap-2 rounded-md border p-3 text-sm sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-4"><span className="text-xs font-medium text-muted-foreground">{p.label} ({p.currency})</span></div>
                <div><dt className="text-[11px] text-muted-foreground">Total Ad Spend</dt><dd className="tabular font-semibold">{formatCurrency(p.totalSpend, p.currency)}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Shopify Net Sales</dt><dd className="tabular font-semibold">{formatCurrency(p.netSales, p.currency)}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Actual ROAS</dt><dd className="tabular font-semibold">{formatROAS(p.actualROAS)}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Orders</dt><dd className="tabular font-semibold">{formatNumber(p.orders)}</dd></div>
              </dl>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-sm font-semibold">Brand performance</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Total Ad Spend</TableHead>
                <TableHead className="text-right">Shopify Net Sales</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Actual ROAS</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead>Status (30d)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => {
                const status30 = agency.summaries.find((x) => x.brand.id === s.brand.id)?.status ?? s.status;
                return (
                  <TableRow key={s.brand.id}>
                    <TableCell className="font-medium">{s.brand.name}</TableCell>
                    <TableCell className="tabular text-right">{formatCurrency(s.totalSpend, s.currency)}</TableCell>
                    <TableCell className="tabular text-right">{formatCurrency(s.netSales, s.currency)}</TableCell>
                    <TableCell className="tabular text-right">{formatNumber(s.orders)}</TableCell>
                    <TableCell className="tabular text-right font-semibold">{formatROAS(s.actualROAS)}</TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">{formatROAS(s.targetROAS)}</TableCell>
                    <TableCell><TargetStatusBadge status={status30} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h4 className="mb-2 text-sm font-semibold">Top brands</h4>
            <ol className="space-y-1.5 text-sm">
              {topBrands.map((s, i) => (
                <li key={s.brand.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{i + 1}. {s.brand.name}</span>
                  <span className="tabular text-muted-foreground">ROAS {formatROAS(s.actualROAS)} vs {formatROAS(s.targetROAS)}</span>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h4 className="mb-2 text-sm font-semibold">Brands below target (30-day)</h4>
            {agency.belowTarget.length === 0 ? (
              <p className="text-sm text-muted-foreground">All brands are on track.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {agency.belowTarget.map((s) => (
                  <li key={s.brand.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span>{s.brand.name}</span>
                    <span className="tabular text-muted-foreground">{formatROAS(s.actualROAS)} vs {formatROAS(s.targetROAS)} · {TARGET_STATUS_LABEL[s.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section>
          <h4 className="mb-2 text-sm font-semibold">Team tasks</h4>
          <p className="mb-2 text-xs text-muted-foreground">{teamTasks.length} open · {agency.overdueTasks} overdue · {agency.blockedTasks} blocked · {agency.completedThisWeek} completed this week</p>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {teamTasks.slice(0, 8).map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="truncate">{t.title} · {brandsById[t.brandId].name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{usersById[t.assigneeId].name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-violet-200 bg-violet-50/40 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="size-4 text-violet-600" /> AI summary</p>
          <p className="text-sm">
            {agency.mainConcern
              ? `${agency.belowTarget.length} of ${agency.totalBrands} brands are under target. ${agency.mainConcern.brand.name} is the biggest gap (${formatROAS(agency.mainConcern.actualROAS)} vs ${formatROAS(agency.mainConcern.targetROAS)}).`
              : `All ${agency.totalBrands} brands are on track.`}
            {agency.strongestBrand && ` ${agency.strongestBrand.brand.name} is the strongest brand at ${formatROAS(agency.strongestBrand.actualROAS)}.`}
            {agency.overdueTasks > 0 && ` ${agency.overdueTasks} tasks are overdue.`}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
