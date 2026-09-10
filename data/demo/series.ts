/**
 * Small deterministic helpers used to turn brand-level demo totals into
 * daily series. Everything here is seeded so that server and client render
 * exactly the same numbers.
 */

import { DEMO_DAYS, DEMO_TODAY } from "@/data/config";

/** mulberry32 – tiny seeded PRNG. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The demo date range: DEMO_DAYS days ending on DEMO_TODAY (inclusive). */
export const demoDates: string[] = Array.from({ length: DEMO_DAYS }, (_, i) =>
  addDays(DEMO_TODAY, i - (DEMO_DAYS - 1)),
);

export function isWeekend(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Distribute a total across the demo dates with mild noise, a weekend
 * factor and an optional trend, so that the daily values sum EXACTLY to the
 * requested total (after rounding).
 */
export function distributeTotal(
  total: number,
  seedKey: string,
  options: { noise?: number; weekendFactor?: number; trend?: number; decimals?: number } = {},
): number[] {
  const { noise = 0.25, weekendFactor = 1.15, trend = 0, decimals = 0 } = options;
  const rng = createRng(hashString(seedKey));
  const n = demoDates.length;
  const weights = demoDates.map((date, i) => {
    const base = 1 + (rng() - 0.5) * 2 * noise;
    const weekend = isWeekend(date) ? weekendFactor : 1;
    const trendFactor = 1 + trend * (i / (n - 1) - 0.5);
    return Math.max(0.15, base * weekend * trendFactor);
  });
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const factor = Math.pow(10, decimals);
  const values = weights.map((w) => Math.round((total * w) / weightSum * factor) / factor);
  // Fix rounding drift on the last day so the sum is exact.
  const drift = Math.round((total - values.reduce((a, b) => a + b, 0)) * factor) / factor;
  values[n - 1] = Math.round((values[n - 1] + drift) * factor) / factor;
  return values;
}

export function round(value: number, decimals = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

/**
 * Round a small expected count so that daily values below 1 still add up
 * correctly over the period (e.g. 0.3 conversions/day → ~9 per month).
 */
export function roundCount(value: number, rng: () => number): number {
  const base = Math.floor(value);
  return base + (rng() < value - base ? 1 : 0);
}
