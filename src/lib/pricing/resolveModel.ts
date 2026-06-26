// ============================================================
// Match a model name (e.g. from a Langfuse generation) to a
// pricing row. Handles provider prefixes, dated suffixes, and
// OpenRouter ":variant" suffixes by indexing many forms.
// ============================================================
import type { ModelPricing, PricingTable } from './pricingTypes';

function stripVariants(s: string): string[] {
  const out = new Set<string>([s]);
  out.add(s.replace(/[-@:](\d{8}|\d{4}-\d{2}-\d{2})$/, '')); // trailing date
  out.add(s.replace(/-latest$/, ''));
  out.add(s.replace(/:.*$/, '')); // openrouter variant (:free, :thinking, ...)
  out.add(s.replace(/-v\d+$/, ''));
  return [...out].filter(Boolean);
}

function forms(model: string): string[] {
  const m = model.toLowerCase().trim();
  const bases = new Set<string>([m]);
  if (m.includes('/')) bases.add(m.slice(m.lastIndexOf('/') + 1)); // drop provider prefix
  const all = new Set<string>();
  for (const b of bases) for (const v of stripVariants(b)) all.add(v);
  return [...all];
}

/** Build an index once, return a fast lookup closure. */
export function createPricingLookup(table: PricingTable): (model: string) => ModelPricing | undefined {
  const index = new Map<string, ModelPricing>();
  const put = (k: string, v: ModelPricing) => { if (k && !index.has(k)) index.set(k, v); };
  for (const entry of Object.values(table)) {
    for (const f of forms(entry.key)) put(f, entry);
    if (entry.model.toLowerCase() !== entry.key) for (const f of forms(entry.model)) put(f, entry);
  }
  return (model: string) => {
    for (const q of forms(model)) {
      const hit = index.get(q);
      if (hit) return hit;
    }
    return undefined;
  };
}
