// ============================================================
// The cross-layer total: compute (right-sized) + storage + net.
// GPU is the decomposition of compute, so it is NOT added here.
// ============================================================
import type { CostState } from './types';
import { computeInference } from '../features/compute/computeModel';
import { computeStorage } from '../features/storage/storageModel';
import { computeEgress } from '../features/network/networkModel';

export interface StackResult {
  compute: number;
  storage: number;
  net: number;
  total: number;
}

export function computeStack(state: CostState): StackResult {
  const compute = computeInference(state).rightMonthly;
  const storage = computeStorage(state).total;
  const net = computeEgress(state).cost;
  return { compute, storage, net, total: compute + storage + net };
}
