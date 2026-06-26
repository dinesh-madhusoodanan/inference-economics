import type { CostState, Gpu } from '../../lib/types';
import { gpuPrice, GPU_NAMES } from '../../lib/cloud/providers';

export interface GpuResult {
  gpu: Gpu;
  perMtok: number;
  fleetCost: number;
  monthlyTokens: number;
  breakeven: number; // utilization fraction to undercut $0.30/Mtok
}

export function computeGpu(state: CostState): GpuResult {
  const id = state.gpu.type;
  // $/hr for the selected provider + accelerator (real cloud list price)
  const price = gpuPrice(state.gpu.provider, id) ?? 0;
  const gpu: Gpu = { id, name: GPU_NAMES[id], price };

  const tokPerHr = state.gpu.tput * 3600 * (state.gpu.util / 100);
  const perMtok = tokPerHr > 0 ? (price / tokPerHr) * 1e6 : 0;
  const fleetCost = price * 730 * state.gpu.fleet;
  const monthlyTokens = state.gpu.fleet * state.gpu.tput * 3600 * 730 * (state.gpu.util / 100);
  const targetPerToken = 0.3 / 1e6;
  const breakeven = price > 0 ? price / (state.gpu.tput * 3600 * targetPerToken) : 0;
  return { gpu, perMtok, fleetCost, monthlyTokens, breakeven };
}
