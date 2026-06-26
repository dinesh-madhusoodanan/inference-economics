#!/usr/bin/env node
/**
 * Fetch model pricing and emit a slim, app-bundled table.
 *
 *   node scripts/update-prices.mjs                 # default: LiteLLM
 *   node scripts/update-prices.mjs --source openrouter
 *
 * Output: src/lib/pricing/model-prices.generated.json  (keyed by lowercased model id)
 * Only chat-capable Anthropic / OpenAI / Google(Gemini) models are kept.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'lib', 'pricing', 'model-prices.generated.json');
const LADDER_OUT = join(__dirname, '..', 'src', 'lib', 'pricing', 'ladder-prices.generated.json');

const LITELLM_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/models';

const args = process.argv.slice(2);
const source = args.includes('--source') ? args[args.indexOf('--source') + 1] : 'litellm';

/** classify a model into one of our three vendors, or null to drop it */
function vendorOf(key, provider = '') {
  const k = key.toLowerCase();
  const p = provider.toLowerCase();
  if (k.includes('claude') || p.includes('anthropic')) return 'anthropic';
  if (/^(gpt|o1|o3|o4|chatgpt|text-davinci|davinci|babbage)/.test(k) || p === 'openai' || p === 'text-completion-openai' || p.includes('openai')) return 'openai';
  if (k.includes('gemini') || p === 'gemini') return 'google';
  return null;
}

const CHAT_MODES = new Set(['chat', 'responses', 'completion']);

async function fromLiteLLM() {
  const res = await fetch(LITELLM_URL);
  if (!res.ok) throw new Error(`LiteLLM fetch failed: ${res.status}`);
  const raw = await res.json();
  const out = {};
  for (const [key, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue;
    if (key === 'sample_spec') continue;
    const inTok = v.input_cost_per_token;
    const outTok = v.output_cost_per_token;
    if (typeof inTok !== 'number' || typeof outTok !== 'number') continue;
    if (v.mode && !CHAT_MODES.has(v.mode)) continue;
    const vendor = vendorOf(key, v.litellm_provider);
    if (!vendor) continue;
    const id = key.toLowerCase();
    out[id] = {
      key: id,
      model: key,
      vendor,
      inputCostPerToken: inTok,
      outputCostPerToken: outTok,
      ...(typeof v.cache_read_input_token_cost === 'number' ? { cacheReadCostPerToken: v.cache_read_input_token_cost } : {}),
      ...(typeof v.cache_creation_input_token_cost === 'number' ? { cacheWriteCostPerToken: v.cache_creation_input_token_cost } : {}),
      ...(typeof v.output_cost_per_reasoning_token === 'number' ? { reasoningCostPerToken: v.output_cost_per_reasoning_token } : {}),
      ...(typeof v.max_input_tokens === 'number' ? { contextWindow: v.max_input_tokens } : {}),
      ...(typeof v.max_output_tokens === 'number' ? { maxOutputTokens: v.max_output_tokens } : {}),
      source: 'litellm',
    };
  }
  return out;
}

async function fromOpenRouter() {
  const res = await fetch(OPENROUTER_URL, { headers: { 'User-Agent': 'inference-economics-price-sync' } });
  if (!res.ok) throw new Error(`OpenRouter fetch failed: ${res.status}`);
  const { data } = await res.json();
  const out = {};
  for (const m of data ?? []) {
    const pr = m.pricing ?? {};
    const inTok = Number(pr.prompt);
    const outTok = Number(pr.completion);
    if (!Number.isFinite(inTok) || !Number.isFinite(outTok)) continue;
    const vendor = vendorOf(m.id, (m.id.split('/')[0] || ''));
    if (!vendor) continue;
    const id = m.id.toLowerCase();
    const num = (x) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : undefined; };
    out[id] = {
      key: id,
      model: m.id,
      vendor,
      inputCostPerToken: inTok,
      outputCostPerToken: outTok,
      ...(num(pr.input_cache_read) ? { cacheReadCostPerToken: num(pr.input_cache_read) } : {}),
      ...(num(pr.input_cache_write) ? { cacheWriteCostPerToken: num(pr.input_cache_write) } : {}),
      ...(num(pr.internal_reasoning) ? { reasoningCostPerToken: num(pr.internal_reasoning) } : {}),
      ...(m.context_length ? { contextWindow: m.context_length } : {}),
      ...(m.top_provider?.max_completion_tokens ? { maxOutputTokens: m.top_provider.max_completion_tokens } : {}),
      source: 'openrouter',
    };
  }
  return out;
}

const table = source === 'openrouter' ? await fromOpenRouter() : await fromLiteLLM();
const sorted = Object.fromEntries(Object.entries(table).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(OUT, JSON.stringify(sorted, null, 0) + '\n');

// ---- ladder: the tiny file the website imports for accurate displayed prices ----
// Each editorial rung is anchored to a representative real model. The displayed
// $/Mtok is a blend of that model's input and output rates. Edit refs/blend freely.
const LADDER_REFS = {
  small: 'gemini-2.0-flash',
  open70b: 'gpt-4o-mini',
  balanced: 'gemini-2.5-flash',
  frontier: 'gpt-4o',
  reasoning: 'claude-3-7-sonnet-20250219',
};
const BLEND_INPUT_SHARE = 0.5;
const dateStrip = (s) => s.replace(/[-@:](\d{8}|\d{4}-\d{2}-\d{2})$/, '');

function findRef(ref) {
  const r = ref.toLowerCase();
  if (sorted[r]) return sorted[r];
  const stripped = dateStrip(r);
  for (const [k, v] of Object.entries(sorted)) {
    if (k === r || k === stripped || k.endsWith('/' + r) || dateStrip(k) === stripped) return v;
  }
  return undefined;
}

const ladder = {};
for (const [rung, ref] of Object.entries(LADDER_REFS)) {
  const p = findRef(ref);
  if (!p) { console.warn(`  ladder: no pricing match for ${rung} -> ${ref} (keeping illustrative)`); continue; }
  const perToken = BLEND_INPUT_SHARE * p.inputCostPerToken + (1 - BLEND_INPUT_SHARE) * p.outputCostPerToken;
  ladder[rung] = { model: p.model, priceMtok: Number((perToken * 1e6).toFixed(4)) };
}
writeFileSync(LADDER_OUT, JSON.stringify(ladder, null, 2) + '\n');

const counts = Object.values(sorted).reduce((a, m) => ((a[m.vendor] = (a[m.vendor] || 0) + 1), a), {});
console.log(`source: ${source}`);
console.log(`wrote ${Object.keys(sorted).length} models -> ${OUT.replace(/.*\/ie\//, '')}`);
console.log(`wrote ladder (${Object.keys(ladder).length} rungs) -> ${LADDER_OUT.replace(/.*\/ie\//, '')}`);
console.log('by vendor:', counts);
