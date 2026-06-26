// ============================================================
// Normalized model pricing — one shape for every source.
// All *PerToken fields are USD per single token.
// ============================================================
export type Vendor = 'anthropic' | 'openai' | 'google' | 'other';

export interface ModelPricing {
  /** lowercased model id we index under */
  key: string;
  /** model id exactly as the source reported it */
  model: string;
  vendor: Vendor;
  inputCostPerToken: number;
  outputCostPerToken: number;
  /** cached prompt read (discounted). Falls back to input rate if absent. */
  cacheReadCostPerToken?: number;
  /** cache write / creation (Anthropic; premium). Falls back to input rate. */
  cacheWriteCostPerToken?: number;
  /** reasoning / thinking tokens. Falls back to output rate. */
  reasoningCostPerToken?: number;
  contextWindow?: number;
  maxOutputTokens?: number;
  source: 'litellm' | 'openrouter' | 'manual';
}

/** keyed by ModelPricing.key */
export type PricingTable = Record<string, ModelPricing>;
