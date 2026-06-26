import type { CostState, Model, Bucket, BucketId } from '../../lib/types';
import { BUCKETS, MODELS, cheapestFor, modelById } from '../../lib/config';

export interface RoutingRow { bucket: Bucket; share: number; model: Model; cost: number; }

export interface ComputeResult {
  share: Record<BucketId, number>;
  currentMonthly: number;
  rightMonthly: number;
  rows: RoutingRow[];
  defaultModel: Model;
  savings: number;
  savingsPct: number;
  cur: Model;
  cheaperShare: number;
  leadModel: Model;
}

export function computeInference(state: CostState): ComputeResult {
  const raw = state.mix;
  const sum = raw.simple + raw.moderate + raw.complex || 1;
  const share: Record<BucketId, number> = {
    simple: raw.simple / sum,
    moderate: raw.moderate / sum,
    complex: raw.complex / sum,
  };
  const per = state.tokens / 1e6;
  const cur = modelById(state.current);
  const currentMonthly = state.volume * per * cur.price;

  const rows: RoutingRow[] = BUCKETS.map((bucket) => {
    const model = cheapestFor(bucket.minTier);
    const vol = state.volume * share[bucket.id];
    return { bucket, share: share[bucket.id], model, cost: vol * per * model.price };
  });
  const rightMonthly = rows.reduce((a, r) => a + r.cost, 0);

  const byModel: Record<string, number> = {};
  rows.forEach((r) => { byModel[r.model.id] = (byModel[r.model.id] ?? 0) + r.share; });
  const defaultId = Object.keys(byModel).sort((a, b) => byModel[b] - byModel[a])[0];
  const defaultModel = MODELS.find((m) => m.id === defaultId)!;

  // share that can route to something cheaper than the current model
  const cheaperRows = rows.filter((r) => r.model.price < cur.price);
  const cheaperShare = cheaperRows.reduce((a, r) => a + r.share, 0);
  let leadModel = cur;
  if (cheaperRows.length) {
    const byCheap: Record<string, number> = {};
    cheaperRows.forEach((r) => { byCheap[r.model.id] = (byCheap[r.model.id] ?? 0) + r.share; });
    const topId = Object.keys(byCheap).sort((a, b) => byCheap[b] - byCheap[a])[0];
    leadModel = MODELS.find((m) => m.id === topId)!;
  }

  const savings = currentMonthly - rightMonthly;
  return {
    share, currentMonthly, rightMonthly, rows, defaultModel,
    savings, savingsPct: currentMonthly > 0 ? savings / currentMonthly : 0,
    cur, cheaperShare, leadModel,
  };
}
