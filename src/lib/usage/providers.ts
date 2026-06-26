// ============================================================
// Per-vendor adapters into NormalizedUsage, plus a Langfuse
// observation mapper. The tricky bit each adapter handles:
//   - OpenAI:  prompt_tokens INCLUDES cached; completion INCLUDES reasoning
//   - Gemini:  promptTokenCount INCLUDES cached
//   - Anthropic: input/cache_read/cache_creation are already separate
// We subtract so the normalized categories never overlap.
// ============================================================
import { withTotal, emptyUsage, type NormalizedUsage, type UsageVendor } from './normalizedUsage';

export interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}
export interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number } | null;
  completion_tokens_details?: { reasoning_tokens?: number } | null;
}
export interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  cachedContentTokenCount?: number;
  thoughtsTokenCount?: number;
}

const nn = (x: number | undefined | null): number => Math.max(0, Number(x ?? 0) || 0);

export function detectVendor(model: string): UsageVendor {
  const m = (model || '').toLowerCase();
  if (m.includes('claude') || m.includes('anthropic')) return 'anthropic';
  if (/(^|\/)(gpt|o1|o3|o4|chatgpt|text-davinci|davinci)/.test(m) || m.includes('openai')) return 'openai';
  if (m.includes('gemini') || m.includes('google')) return 'google';
  return 'unknown';
}

export function fromAnthropic(u: AnthropicUsage, model = ''): NormalizedUsage {
  return withTotal({
    vendor: 'anthropic', model,
    inputTokens: nn(u.input_tokens),
    outputTokens: nn(u.output_tokens),
    cacheReadTokens: nn(u.cache_read_input_tokens),
    cacheWriteTokens: nn(u.cache_creation_input_tokens),
    reasoningTokens: 0, // extended-thinking tokens are already counted in output_tokens
  });
}

export function fromOpenAI(u: OpenAIUsage, model = ''): NormalizedUsage {
  const cached = nn(u.prompt_tokens_details?.cached_tokens);
  const reasoning = nn(u.completion_tokens_details?.reasoning_tokens);
  return withTotal({
    vendor: 'openai', model,
    inputTokens: Math.max(0, nn(u.prompt_tokens) - cached),
    outputTokens: Math.max(0, nn(u.completion_tokens) - reasoning),
    cacheReadTokens: cached,
    cacheWriteTokens: 0,
    reasoningTokens: reasoning,
  });
}

export function fromGemini(u: GeminiUsage, model = ''): NormalizedUsage {
  const cached = nn(u.cachedContentTokenCount);
  const reasoning = nn(u.thoughtsTokenCount);
  return withTotal({
    vendor: 'google', model,
    inputTokens: Math.max(0, nn(u.promptTokenCount) - cached),
    outputTokens: nn(u.candidatesTokenCount),
    cacheReadTokens: cached,
    cacheWriteTokens: 0,
    reasoningTokens: reasoning,
  });
}

// ---- Langfuse ----
// Langfuse stores usageDetails as additive categories (the same model
// we use), so we read the known keys directly. Key names vary slightly
// by integration, hence the small alias lists.
export interface LangfuseUsageLike {
  model?: string | null;
  usage?: { input?: number; output?: number; total?: number } | null;
  usageDetails?: Record<string, number> | null;
}

const pick = (d: Record<string, number>, keys: string[]): number => {
  for (const k of keys) if (typeof d[k] === 'number') return d[k];
  return 0;
};

export function fromLangfuseUsageDetails(model: string, details: Record<string, number>): NormalizedUsage {
  const cacheRead = nn(pick(details, ['cache_read_input_tokens', 'cached_tokens', 'input_cached_tokens', 'cache_read']));
  const cacheWrite = nn(pick(details, ['cache_creation_input_tokens', 'cache_write']));
  const reasoning = nn(pick(details, ['reasoning_tokens', 'output_reasoning_tokens', 'thoughts_tokens']));
  const input = nn(pick(details, ['input', 'input_tokens', 'prompt_tokens']));
  const output = nn(pick(details, ['output', 'output_tokens', 'completion_tokens']));
  return withTotal({ vendor: detectVendor(model), model, inputTokens: input, outputTokens: output, cacheReadTokens: cacheRead, cacheWriteTokens: cacheWrite, reasoningTokens: reasoning });
}

/** Normalize a single Langfuse generation observation. */
export function normalizeObservation(obs: LangfuseUsageLike): NormalizedUsage {
  const model = obs.model ?? '';
  if (obs.usageDetails && Object.keys(obs.usageDetails).length > 0) {
    return fromLangfuseUsageDetails(model, obs.usageDetails);
  }
  if (obs.usage) {
    const u = obs.usage;
    return withTotal({ vendor: detectVendor(model), model, inputTokens: nn(u.input), outputTokens: nn(u.output), cacheReadTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0 });
  }
  return emptyUsage(detectVendor(model), model);
}
