// ============================================================
// Counterfactual cost: what a generation WOULD have cost on the
// cheapest model that still meets its difficulty bucket's
// capability bar. Reuses the repo's model ladder (`cheapestFor`,
// `PRICED_FROM`) and per-token pricing (`costForUsage`). The cost
// half is arithmetic; the QUALITY GATE (see ../quality) decides
// whether the saving is real.
// ============================================================
import type { NormalizedUsage } from '../usage';
import type { ModelId, BucketId } from '../types';
import type { ModelPricing } from '../pricing/pricingTypes';
import type { CostBreakdown } from '../pricing/cost';
import { costForUsage } from '../pricing/cost';
import { BUCKETS, PRICED_FROM, cheapestFor, modelById } from '../config';

export type PriceLookup = (model: string) => ModelPricing | undefined;

export function bucketMinTier(bucket: BucketId): number {
  return BUCKETS.find((b) => b.id === bucket)?.minTier ?? 1;
}

// Cost of serving `usage` on a ladder rung: use the real per-token table
// when the rung resolves to a priced model, else the rung's blended $/Mtok.
export function ladderCost(usage: NormalizedUsage, modelId: ModelId, lookup: PriceLookup): number {
  const real = PRICED_FROM[modelId];
  const row = real ? lookup(real) : undefined;
  if (row) return costForUsage(usage, row).totalCost;
  return usage.totalTokens * (modelById(modelId).price / 1_000_000);
}

export interface CounterfactualLine {
  bucket: BucketId;
  /** cheapest model meeting the bucket's capability bar */
  candidate: ModelId;
  actualCostUSD: number;
  candidateCostUSD: number;
  /** never negative: if already at/under the cheapest viable rung, 0 */
  savingsUSD: number;
}

export function counterfactualForObservation(
  usage: NormalizedUsage,
  actual: CostBreakdown,
  bucket: BucketId,
  lookup: PriceLookup,
): CounterfactualLine {
  const candidate = cheapestFor(bucketMinTier(bucket));
  const candidateCostUSD = ladderCost(usage, candidate.id, lookup);
  const savingsUSD = Math.max(0, actual.totalCost - candidateCostUSD);
  return { bucket, candidate: candidate.id, actualCostUSD: actual.totalCost, candidateCostUSD, savingsUSD };
}
