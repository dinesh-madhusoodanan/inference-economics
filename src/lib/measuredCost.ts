// ============================================================
// Browser helper: fetch the measured cost report from the
// Netlify function (/api/usage-cost). Imports only the TYPE of
// the report, so no server code is pulled into the client bundle.
// ============================================================
import type { UsageCostReport } from '../server/langfuse/usageCost';

export type { UsageCostReport } from '../server/langfuse/usageCost';

export interface FetchMeasuredCostParams {
  from?: string; // ISO timestamp
  to?: string;   // ISO timestamp
  endpoint?: string;
}

export async function fetchMeasuredCost(params: FetchMeasuredCostParams = {}): Promise<UsageCostReport> {
  const endpoint = params.endpoint ?? '/api/usage-cost';
  const q = new URLSearchParams();
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  const qs = q.toString();
  const res = await fetch(qs ? `${endpoint}?${qs}` : endpoint);
  if (!res.ok) throw new Error(`usage-cost request failed: ${res.status}`);
  return (await res.json()) as UsageCostReport;
}
