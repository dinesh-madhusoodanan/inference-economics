import type { CostState, Payload } from '../../lib/types';
import { PAYLOADS, RATES } from '../../lib/config';

export interface EgressResult { payload: Payload; streamGB: number; xregionGB: number; cost: number; }

export function computeEgress(state: CostState): EgressResult {
  const payload = PAYLOADS.find((x) => x.id === state.egress.payload)!;
  const streamGB = (state.volume * payload.bytes) / 1e9;
  const cost = streamGB * RATES.egress + state.egress.xregionGB * RATES.xregion;
  return { payload, streamGB, xregionGB: state.egress.xregionGB, cost };
}
