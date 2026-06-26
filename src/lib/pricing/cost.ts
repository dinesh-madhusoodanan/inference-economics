// ============================================================
// Turn normalized usage + pricing into a cost breakdown (USD).
// ============================================================
import type { ModelPricing } from './pricingTypes';
import type { NormalizedUsage } from '../usage/normalizedUsage';

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  reasoningCost: number;
  totalCost: number;
  currency: 'USD';
  /** false when no pricing row matched the model */
  priced: boolean;
}

export function zeroCost(): CostBreakdown {
  return { inputCost: 0, outputCost: 0, cacheReadCost: 0, cacheWriteCost: 0, reasoningCost: 0, totalCost: 0, currency: 'USD', priced: false };
}

export function costForUsage(u: NormalizedUsage, p: ModelPricing | undefined): CostBreakdown {
  if (!p) return zeroCost();
  const inputCost = u.inputTokens * p.inputCostPerToken;
  const outputCost = u.outputTokens * p.outputCostPerToken;
  const cacheReadCost = u.cacheReadTokens * (p.cacheReadCostPerToken ?? p.inputCostPerToken);
  const cacheWriteCost = u.cacheWriteTokens * (p.cacheWriteCostPerToken ?? p.inputCostPerToken);
  const reasoningCost = u.reasoningTokens * (p.reasoningCostPerToken ?? p.outputCostPerToken);
  const totalCost = inputCost + outputCost + cacheReadCost + cacheWriteCost + reasoningCost;
  return { inputCost, outputCost, cacheReadCost, cacheWriteCost, reasoningCost, totalCost, currency: 'USD', priced: true };
}

export function addCost(a: CostBreakdown, b: CostBreakdown): CostBreakdown {
  return {
    inputCost: a.inputCost + b.inputCost,
    outputCost: a.outputCost + b.outputCost,
    cacheReadCost: a.cacheReadCost + b.cacheReadCost,
    cacheWriteCost: a.cacheWriteCost + b.cacheWriteCost,
    reasoningCost: a.reasoningCost + b.reasoningCost,
    totalCost: a.totalCost + b.totalCost,
    currency: 'USD',
    priced: a.priced || b.priced,
  };
}
