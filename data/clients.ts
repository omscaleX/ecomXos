import type { Client, ClientId } from "@/types";
import { brands } from "@/data/brands";

/**
 * The accounts the agency works for. A client can own more than one brand,
 * which is why Nysh - Warmee and Nysh - BluHeat share a client.
 */
export const clients: Client[] = [
  { id: "yeoul", name: "Yeoul", accountManagerId: "lucky" },
  { id: "giggle-pad", name: "Giggle Pad", accountManagerId: "lucky" },
  { id: "nysh", name: "Nysh", accountManagerId: "lucky" },
  { id: "desividesi", name: "DesiVidesi", accountManagerId: "lucky" },
];

export const clientsById: Record<ClientId, Client> = Object.fromEntries(
  clients.map((c) => [c.id, c]),
) as Record<ClientId, Client>;

export function getClient(id: ClientId): Client {
  return clientsById[id];
}

/** All brands belonging to one client. */
export function getClientBrands(id: ClientId) {
  return brands.filter((b) => b.clientId === id);
}
