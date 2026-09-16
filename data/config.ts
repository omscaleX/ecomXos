/**
 * Demo configuration.
 *
 * The prototype uses a fixed "today" so that every dashboard, chart and AI
 * answer is deterministic and renders identically on the server and client.
 * When a real backend is connected this will come from the server clock.
 */
export const DEMO_TODAY = "2026-09-10";

/**
 * Days of daily demo data generated for each source. The window is long
 * enough that the calendar's week and month views have several buckets.
 */
export const DEMO_DAYS = 120;

/**
 * The canonical reporting window. The brand totals in data/demo/totals.ts
 * are the totals for exactly these last days, so "Last 30 Days" always
 * matches the agreed demo figures. Earlier days are generated separately.
 */
export const CANONICAL_DAYS = 30;

export const DEMO_LAST_SYNCED = "Today, 10:42 AM";
