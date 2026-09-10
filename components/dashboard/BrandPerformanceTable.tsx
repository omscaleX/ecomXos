"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BrandSummary } from "@/types";
import { usersById } from "@/data/users";
import { formatCurrency, formatROAS } from "@/lib/formatters";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { BrandChip } from "@/components/shared/BrandMark";
import { EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Brand Performance table. Every value comes from getBrandSummary():
 * Ad Spend = Meta + Google, Actual ROAS = Shopify Net Sales / Ad Spend.
 */
export function BrandPerformanceTable({ summaries, showOwners = true }: { summaries: BrandSummary[]; showOwners?: boolean }) {
  if (!summaries.length) return <EmptyState title="No brands match your filters." />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Brand</TableHead>
          {showOwners && <TableHead>Manager</TableHead>}
          {showOwners && <TableHead>Meta</TableHead>}
          {showOwners && <TableHead>Google</TableHead>}
          <TableHead className="text-right">Ad Spend</TableHead>
          <TableHead className="text-right">Shopify Net Sales</TableHead>
          <TableHead className="text-right">Actual ROAS</TableHead>
          <TableHead className="text-right">Target</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10"><span className="sr-only">Open</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summaries.map((s) => (
          <TableRow key={s.brand.id}>
            <TableCell>
              <Link href={`/brands/${s.brand.id}`} className="hover:underline">
                <BrandChip brand={s.brand} subtitle={s.currency === "AED" ? "Dubai · AED" : undefined} />
              </Link>
            </TableCell>
            {showOwners && <TableCell>{usersById[s.brand.managerId].name}</TableCell>}
            {showOwners && <TableCell>{usersById[s.brand.metaOwnerId].name}</TableCell>}
            {showOwners && <TableCell>{usersById[s.brand.googleOwnerId].name}</TableCell>}
            <TableCell className="tabular text-right">{formatCurrency(s.totalSpend, s.currency)}</TableCell>
            <TableCell className="tabular text-right">{formatCurrency(s.netSales, s.currency)}</TableCell>
            <TableCell className="tabular text-right font-semibold">{formatROAS(s.actualROAS)}</TableCell>
            <TableCell className="tabular text-right text-muted-foreground">{formatROAS(s.targetROAS)}</TableCell>
            <TableCell><TargetStatusBadge status={s.status} /></TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="icon-sm" aria-label={`Open ${s.brand.name}`}>
                <Link href={`/brands/${s.brand.id}`}><ArrowRight /></Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
