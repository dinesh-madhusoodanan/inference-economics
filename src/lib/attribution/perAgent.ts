// ============================================================
// Per-agent attribution key. The existing usage-cost report
// groups by MODEL; savings analysis groups by AGENT (the feature
// / use case). Prefer a trace-level name when present, else fall
// back to the observation name, else the trace id.
// ============================================================
import type { LangfuseObservation } from '../../server/langfuse/client';

export function agentKey(obs: LangfuseObservation): string {
  const traceName = (obs as { traceName?: unknown }).traceName;
  if (typeof traceName === 'string' && traceName.length > 0) return traceName;
  return obs.name ?? obs.traceId ?? 'unknown';
}
