// ============================================================
// Consume the Langfuse telemetry stream, normalize each
// generation's usage, price it from the pricing table, and
// aggregate into a per-model cost report.
// ============================================================
import type { LangfuseObservation } from './client';
import type { PricingTable } from '../../lib/pricing/pricingTypes';
import { createPricingLookup } from '../../lib/pricing/resolveModel';
import { costForUsage, addCost, zeroCost, type CostBreakdown } from '../../lib/pricing/cost';
import { normalizeObservation, addUsage, emptyUsage, type NormalizedUsage } from '../../lib/usage';

export interface ModelCostRow {
  model: string;
  vendor: string;
  observations: number;
  usage: NormalizedUsage;
  cost: CostBreakdown;
  /** the pricing row that matched, if any */
  pricedAs?: string;
}

export interface UsageCostReport {
  fromStartTime?: string;
  toStartTime?: string;
  generatedAt: string;
  totals: {
    observations: number;
    pricedObservations: number;
    tokens: number;
    costUSD: number;
  };
  byModel: ModelCostRow[];
  /** models seen in telemetry that had no pricing match */
  unpriced: string[];
}

/** Anything that can stream observations (LangfuseClient, or a stub in tests). */
export interface ObservationSource {
  streamGenerations(opts?: { fromStartTime?: string; toStartTime?: string; pageLimit?: number }): AsyncIterable<LangfuseObservation>;
}

export async function computeUsageCost(
  source: ObservationSource,
  window: { fromStartTime?: string; toStartTime?: string; pageLimit?: number },
  pricing: PricingTable,
): Promise<UsageCostReport> {
  const lookup = createPricingLookup(pricing);
  const rows = new Map<string, ModelCostRow>();
  const unpriced = new Set<string>();
  let observations = 0;
  let pricedObservations = 0;
  let tokens = 0;
  let costUSD = 0;

  for await (const obs of source.streamGenerations(window)) {
    const model = obs.model ?? 'unknown';
    const usage = normalizeObservation(obs);
    const priceRow = lookup(model);
    const cost = costForUsage(usage, priceRow);

    observations += 1;
    tokens += usage.totalTokens;
    costUSD += cost.totalCost;
    if (cost.priced) pricedObservations += 1;
    else unpriced.add(model);

    const existing = rows.get(model);
    if (existing) {
      existing.observations += 1;
      existing.usage = addUsage(existing.usage, usage);
      existing.cost = addCost(existing.cost, cost);
    } else {
      rows.set(model, {
        model,
        vendor: usage.vendor,
        observations: 1,
        usage: addUsage(emptyUsage(usage.vendor, model), usage),
        cost: addCost(zeroCost(), cost),
        pricedAs: priceRow?.model,
      });
    }
  }

  const byModel = [...rows.values()].sort((a, b) => b.cost.totalCost - a.cost.totalCost);
  return {
    fromStartTime: window.fromStartTime,
    toStartTime: window.toStartTime,
    generatedAt: new Date().toISOString(),
    totals: { observations, pricedObservations, tokens, costUSD },
    byModel,
    unpriced: [...unpriced],
  };
}
