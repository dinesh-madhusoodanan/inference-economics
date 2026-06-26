// ============================================================
// NormalizedUsage: one record that Anthropic / OpenAI / Gemini
// all collapse into. Categories are NON-overlapping and additive
// so they map cleanly onto pricing without double counting:
//   total = input + output + cacheRead + cacheWrite + reasoning
// ============================================================
export type UsageVendor = 'anthropic' | 'openai' | 'google' | 'unknown';

export interface NormalizedUsage {
  vendor: UsageVendor;
  model: string;
  /** prompt tokens billed at the full input rate (cache excluded) */
  inputTokens: number;
  /** completion tokens billed at the output rate (reasoning excluded) */
  outputTokens: number;
  /** prompt tokens served from cache (discounted read) */
  cacheReadTokens: number;
  /** prompt tokens written to cache (Anthropic; premium) */
  cacheWriteTokens: number;
  /** reasoning / "thinking" tokens, billed at the output rate */
  reasoningTokens: number;
  totalTokens: number;
}

export function emptyUsage(vendor: UsageVendor = 'unknown', model = ''): NormalizedUsage {
  return { vendor, model, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0, totalTokens: 0 };
}

export function withTotal(u: Omit<NormalizedUsage, 'totalTokens'>): NormalizedUsage {
  return { ...u, totalTokens: u.inputTokens + u.outputTokens + u.cacheReadTokens + u.cacheWriteTokens + u.reasoningTokens };
}

export function addUsage(a: NormalizedUsage, b: NormalizedUsage): NormalizedUsage {
  return withTotal({
    vendor: a.vendor,
    model: a.model,
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
    reasoningTokens: a.reasoningTokens + b.reasoningTokens,
  });
}
