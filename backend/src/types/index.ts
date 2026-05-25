// Shared types used across the backend.

export interface BomItem {
  itemId: string;
  itemRevision: string;
  findNumber: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitCost: number | null;
  extendedCost: number | null;
  currency: string | null;
  level: number;
  parentItemId: string | null;
  fetchedAt: string; // ISO 8601
}

export interface BomSummary {
  totalItems: number;
  totalExtendedCost: number | null;
  currency: string | null;
  itemsMissingCost: number;
  maxLevel: number;
  computedAt: string; // ISO 8601
}

export interface SyncResult {
  ok: boolean;
  rows: number;
  exportPath: string;
  durationMs: number;
}

export interface ConfigRow {
  url: string;
  username: string;
  updatedAt: string;
}
