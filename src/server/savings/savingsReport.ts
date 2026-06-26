// ============================================================
// Savings report: stream Langfuse GENERATION telemetry, classify
// each generation into a difficulty bucket, attribute it to an
// agent, price the counterfactual against the cheapest viable
// ladder rung, and aggregate. Mirrors usageCost.ts but answers
// "where could we have saved, and how" instead of "what did we
// spend". Phase 1: savings are cost-only and labelled UNVERIFIED
// until the quality gate is wired.
// ============================================================
import type { ObservationSource } from '../langfuse/usageCost';
import type { PricingTable } from '../../lib/pricing/pricingTypes';
import type { BucketId, ModelId } from '../../lib/types';
import type { QualityVerdict } from '../../lib/quality/verdict';
import type { OffloadOpportunity, OffloadOptions } from '../../lib/offload/cpuOffload';
import type { LiteLLMConfig, RouteRule } from '../../lib/routing/policy';
import type { SizeClassifier } from '../../lib/sizing/classify';

import { createPricingLookup } from '../../lib/pricing/resolveModel';
import { costForUsage } from '../../lib/pricing/cost';
import { normalizeObservation } from '../../lib/usage';
import { heuristicClassifier } from '../../lib/sizing/classify';
import { agentKey } from '../../lib/attribution/perAgent';
import { counterfactualForObservation } from '../../lib/counterfactual/savings';
import { unverifiedVerdict } from '../../lib/quality/verdict';
import { breakevenDays, DEFAULT_OFFLOAD_OPTIONS } from '../../lib/offload/cpuOffload';
import { buildLiteLLMConfig, deploymentModeFor } from '../../lib/routing/policy';
import { PRICED_FROM } from '../../lib/config';

export interface BucketSlice {
  bucket: BucketId;
  candidate: ModelId;
  volume: number;
  tokens: number;
  actualCostUSD: number;
  candidateCostUSD: number;
  savingsUSD: number;
  quality: QualityVerdict;
}

export interface AgentSavings {
  agent: string;
  volume: number;
  actualCostUSD: number;
  potentialSavingsUSD: number;
  byBucket: BucketSlice[];
}

export interface SavingsReport {
  fromStartTime?: string;
  toStartTime?: string;
  generatedAt: string;
  spanDays: number;
  totals: {
    observations: number;
    actualCostUSD: number;
    potentialSavingsUSD: number;
    savingsPct: number;
  };
  byAgent: AgentSavings[];
  offloadOpportunities: OffloadOpportunity[];
  routingPolicy: LiteLLMConfig;
  notes: string[];
}

export interface SavingsOptions {
  classifier?: SizeClassifier;
  offload?: OffloadOptions;
}

interface Acc {
  agent: string;
  bucket: BucketId;
  candidate: ModelId;
  volume: number;
  tokens: number;
  actualCostUSD: number;
  candidateCostUSD: number;
  savingsUSD: number;
}

function spanDaysOf(from?: string, to?: string): number {
  if (!from || !to) return 1;
  const ms = Date.parse(to) - Date.parse(from);
  return ms > 0 ? Math.max(1, ms / (24 * 60 * 60 * 1000)) : 1;
}

export async function computeSavingsReport(
  source: ObservationSource,
  window: { fromStartTime?: string; toStartTime?: string; pageLimit?: number },
  pricing: PricingTable,
  options: SavingsOptions = {},
): Promise<SavingsReport> {
  const lookup = createPricingLookup(pricing);
  const classifier = options.classifier ?? heuristicClassifier;
  const o = options.offload ?? {};
  const offloadOpts = {
    localMarginalPer1kTokens: o.localMarginalPer1kTokens ?? DEFAULT_OFFLOAD_OPTIONS.localMarginalPer1kTokens,
    hardwareCapexUSD: o.hardwareCapexUSD ?? DEFAULT_OFFLOAD_OPTIONS.hardwareCapexUSD,
    minVolumePerDay: o.minVolumePerDay ?? DEFAULT_OFFLOAD_OPTIONS.minVolumePerDay,
  };

  const slices = new Map<string, Acc>();
  let observations = 0;

  for await (const obs of source.streamGenerations(window)) {
    const usage = normalizeObservation(obs);
    const actual = costForUsage(usage, lookup(obs.model ?? 'unknown'));
    const bucket = classifier.classify(obs, usage);
    const cf = counterfactualForObservation(usage, actual, bucket, lookup);
    const agent = agentKey(obs);

    observations += 1;
    const key = `${agent}::${bucket}`;
    const acc = slices.get(key);
    if (acc) {
      acc.volume += 1;
      acc.tokens += usage.totalTokens;
      acc.actualCostUSD += cf.actualCostUSD;
      acc.candidateCostUSD += cf.candidateCostUSD;
      acc.savingsUSD += cf.savingsUSD;
    } else {
      slices.set(key, {
        agent,
        bucket,
        candidate: cf.candidate,
        volume: 1,
        tokens: usage.totalTokens,
        actualCostUSD: cf.actualCostUSD,
        candidateCostUSD: cf.candidateCostUSD,
        savingsUSD: cf.savingsUSD,
      });
    }
  }

  const spanDays = spanDaysOf(window.fromStartTime, window.toStartTime);

  // --- roll slices up by agent ---
  const agents = new Map<string, AgentSavings>();
  const routeRules: RouteRule[] = [];
  const offloadOpportunities: OffloadOpportunity[] = [];

  for (const s of slices.values()) {
    const quality = unverifiedVerdict(PRICED_FROM[s.candidate] ?? s.candidate);
    const slice: BucketSlice = {
      bucket: s.bucket,
      candidate: s.candidate,
      volume: s.volume,
      tokens: s.tokens,
      actualCostUSD: s.actualCostUSD,
      candidateCostUSD: s.candidateCostUSD,
      savingsUSD: s.savingsUSD,
      quality,
    };

    const ag = agents.get(s.agent);
    if (ag) {
      ag.volume += s.volume;
      ag.actualCostUSD += s.actualCostUSD;
      ag.potentialSavingsUSD += s.savingsUSD;
      ag.byBucket.push(slice);
    } else {
      agents.set(s.agent, {
        agent: s.agent,
        volume: s.volume,
        actualCostUSD: s.actualCostUSD,
        potentialSavingsUSD: s.savingsUSD,
        byBucket: [slice],
      });
    }

    routeRules.push({
      agent: s.agent,
      bucket: s.bucket,
      target: s.candidate,
      targetModel: PRICED_FROM[s.candidate],
      deploymentMode: deploymentModeFor(s.candidate),
      qualityPassed: quality.passed,
    });

    // --- CPU-offload candidates: simple, high-volume slices ---
    const volumePerDay = s.volume / spanDays;
    if (s.bucket === 'simple' && volumePerDay >= offloadOpts.minVolumePerDay) {
      const tokensPerDay = s.tokens / spanDays;
      const currentCostPerDayUSD = s.actualCostUSD / spanDays;
      const localMarginalPerDayUSD = (tokensPerDay / 1000) * offloadOpts.localMarginalPer1kTokens;
      const dailySavingsUSD = currentCostPerDayUSD - localMarginalPerDayUSD;
      offloadOpportunities.push({
        agent: s.agent,
        bucket: s.bucket,
        volumePerDay,
        tokensPerDay,
        currentCostPerDayUSD,
        localMarginalPerDayUSD,
        dailySavingsUSD,
        breakevenDays: breakevenDays(offloadOpts.hardwareCapexUSD, dailySavingsUSD),
        quality: unverifiedVerdict('local-small-model'),
      });
    }
  }

  let actualCostUSD = 0;
  let potentialSavingsUSD = 0;
  for (const a of agents.values()) {
    actualCostUSD += a.actualCostUSD;
    potentialSavingsUSD += a.potentialSavingsUSD;
    a.byBucket.sort((x, y) => y.savingsUSD - x.savingsUSD);
  }

  const byAgent = [...agents.values()].sort((a, b) => b.potentialSavingsUSD - a.potentialSavingsUSD);

  return {
    fromStartTime: window.fromStartTime,
    toStartTime: window.toStartTime,
    generatedAt: new Date().toISOString(),
    spanDays,
    totals: {
      observations,
      actualCostUSD,
      potentialSavingsUSD,
      savingsPct: actualCostUSD > 0 ? potentialSavingsUSD / actualCostUSD : 0,
    },
    byAgent,
    offloadOpportunities: offloadOpportunities.sort((a, b) => b.dailySavingsUSD - a.dailySavingsUSD),
    routingPolicy: buildLiteLLMConfig(routeRules),
    notes: [
      'Savings are COST-ONLY and NOT yet quality-validated (verdict.method=unverified).',
      'Difficulty buckets come from a heuristic seed classifier — replace with a learned/judged classifier (phase 2).',
      'routingPolicy.rules is empty until verdicts pass the quality gate; this is intended.',
    ],
  };
}
