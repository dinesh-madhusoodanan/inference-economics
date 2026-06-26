// ============================================================
// CONFIG — illustrative defaults for the cost model. Token prices
// for the model ladder are overlaid from real provider rates
// (see ladder-prices.generated.json, produced by
// `npm run prices:update`). Everything else stays illustrative
// until you swap in your own figures.
// ============================================================
import type { Model, Bucket, Gpu, Payload, ModelId } from './types';
import ladder from './pricing/ladder-prices.generated.json';
import { gpusForProvider } from './cloud/providers';

export const RATES = { object: 0.021, vector: 0.28, egress: 0.09, xregion: 0.02 } as const; // $/GB(-mo)

type LadderEntry = { model: string; priceMtok: number };
const LADDER = ladder as Partial<Record<ModelId, LadderEntry>>;

// Model ladder: capability tier (1..5) + a fallback illustrative $/Mtok.
// `price` is replaced below with a real, source-derived blended rate when available.
const BASE_MODELS: Model[] = [
  { id: 'small', name: 'Open · Small (8B)', price: 0.05, tier: 1 },
  { id: 'open70b', name: 'Open · 70B', price: 0.09, tier: 2 },
  { id: 'balanced', name: 'Balanced', price: 0.30, tier: 3 },
  { id: 'frontier', name: 'Frontier', price: 0.90, tier: 4 },
  { id: 'reasoning', name: 'Frontier · Reason', price: 1.80, tier: 5 },
];

// blended $/Mtok pulled from real provider pricing; illustrative value is the fallback
export const MODELS: Model[] = BASE_MODELS.map((m) => {
  const real = LADDER[m.id];
  return real ? { ...m, price: Number(real.priceMtok.toFixed(3)) } : m;
});

// the real model each rung is priced from, for labels/tooltips
export const PRICED_FROM: Partial<Record<ModelId, string>> = Object.fromEntries(
  (Object.keys(LADDER) as ModelId[]).map((k) => [k, LADDER[k]!.model]),
);

// Each traffic slice needs at least this capability tier
export const BUCKETS: Bucket[] = [
  { id: 'simple', label: 'Simple', minTier: 1 },
  { id: 'moderate', label: 'Moderate', minTier: 2 },
  { id: 'complex', label: 'Complex', minTier: 4 },
];

// GPU $/hr now comes from real cloud pricing, selectable per provider.
// This default (AWS) is what the page loads with; see src/lib/cloud/providers.ts.
export const GPUS: Gpu[] = gpusForProvider('aws');

export const PAYLOADS: Payload[] = [
  { id: 'text', name: 'Text', bytes: 2_000 },
  { id: 'image', name: 'Image', bytes: 300_000 },
  { id: 'audio', name: 'Audio', bytes: 1_200_000 },
  { id: 'video', name: 'Video', bytes: 15_000_000 },
];

export const cheapestFor = (tier: number): Model =>
  MODELS.filter((m) => m.tier >= tier).sort((a, b) => a.price - b.price)[0];

export const modelById = (id: ModelId): Model => MODELS.find((m) => m.id === id)!;
