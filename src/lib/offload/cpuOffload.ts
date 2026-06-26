// ============================================================
// CPU-offload detection: which slices of traffic a small local
// model (1-3B, quantized) could serve on the box's CPU instead of
// paying per-token to a provider or burning GPU. Only worth it at
// volume, and only after the quality gate clears (a verdict is
// required before any slice is recommended).
// ============================================================
import type { BucketId } from '../types';
import type { QualityVerdict } from '../quality/verdict';

export interface OffloadOptions {
  /** local CPU marginal cost per 1k tokens (~electricity). Default 0. */
  localMarginalPer1kTokens?: number;
  /** one-time hardware capex for the box, for break-even. */
  hardwareCapexUSD?: number;
  /** minimum volume/day for a slice to be worth offloading. */
  minVolumePerDay?: number;
}

export const DEFAULT_OFFLOAD_OPTIONS: Required<OffloadOptions> = {
  localMarginalPer1kTokens: 0,
  hardwareCapexUSD: 700,
  minVolumePerDay: 500,
};

export interface OffloadOpportunity {
  agent: string;
  bucket: BucketId;
  volumePerDay: number;
  tokensPerDay: number;
  currentCostPerDayUSD: number;
  localMarginalPerDayUSD: number;
  dailySavingsUSD: number;
  breakevenDays: number | null;
  quality: QualityVerdict;
}

export function breakevenDays(capexUSD: number, dailySavingsUSD: number): number | null {
  if (dailySavingsUSD <= 0) return null;
  return capexUSD / dailySavingsUSD;
}
