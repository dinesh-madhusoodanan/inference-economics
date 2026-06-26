import type { CostState } from '../../lib/types';
import { RATES } from '../../lib/config';

export interface StorageResult { model: number; data: number; vector: number; total: number; }

export function computeStorage(state: CostState): StorageResult {
  const model = state.weights * state.replicas * RATES.object;
  const data = state.data * RATES.object;
  const vector = state.vector * RATES.vector;
  return { model, data, vector, total: model + data + vector };
}
