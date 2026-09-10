import type { DataSourceStatus } from "@/types";
import { DEMO_LAST_SYNCED } from "@/data/config";

/**
 * Static sync status for the prototype. Nothing is actually connected;
 * these values are placeholders for the future backend sync status.
 */
export const dataSources: DataSourceStatus[] = [
  { id: "meta", name: "Meta Ads", status: "connected", lastSynced: DEMO_LAST_SYNCED },
  { id: "google", name: "Google Ads", status: "connected", lastSynced: DEMO_LAST_SYNCED },
  { id: "shopify", name: "Shopify", status: "connected", lastSynced: DEMO_LAST_SYNCED },
];
