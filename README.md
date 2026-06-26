# InferenceEconomics

The cost of serving a model, top to bottom — compute & model (per token) → GPU → storage → network egress, each one live and summing to a total cost to serve.

Refactored from a single HTML file into a **Vite + React 18 + TypeScript** app. Each cost layer is its own folder with a React component (the markup) and a typed cost-model module (the math). All styling lives in one `styles/` folder.

## Run it

```bash
npm install
npm run dev      # local dev server (Vite) with hot reload
npm run build    # typecheck (tsc --noEmit) + production build to dist/
npm run preview  # serve the production build locally
```

Requires Node 18+.

## Folder structure

Your four experiences each get a folder under `src/features/`, and the CSS is broken out into its own folder under `src/styles/`:

```
inference-economics/
├── index.html                  # the single HTML entry (see note below)
├── package.json · tsconfig.json · vite.config.ts
└── src/
    ├── main.tsx                # React entry — mounts <App>, imports styles/index.css
    ├── App.tsx                 # composes Header → sections → Footer, wrapped in CostProvider
    │
    ├── features/               # ── ONE FOLDER PER EXPERIENCE ──
    │   ├── compute/            # 1. Compute & Model (per token)
    │   │   ├── ComputeSection.tsx   # the section's markup (JSX) + interactions
    │   │   ├── computeModel.ts       # right-sizing / routing math
    │   │   └── Frontier.tsx          # the price-vs-capability SVG chart
    │   ├── gpu/                # 2. GPU
    │   │   ├── GpuSection.tsx
    │   │   └── gpuModel.ts            # $/Mtok = $/hr ÷ (tok/s × 3600 × util)
    │   ├── storage/            # 3. Storage
    │   │   ├── StorageSection.tsx
    │   │   └── storageModel.ts
    │   ├── network/            # 4. Network (ingress & egress)
    │   │   ├── NetworkSection.tsx
    │   │   └── networkModel.ts
    │   └── total/
    │       └── TotalSection.tsx       # the combined cost-stack total
    │
    ├── styles/                 # ── ALL CSS, SEPARATED OUT ──
    │   ├── index.css                  # @imports the rest, in order
    │   ├── tokens.css                 # design tokens (:root variables)
    │   ├── base.css · layout.css      # reset/utilities · header/hero/section/footer
    │   ├── components.css             # shared chrome (cards, panels, sliders, …)
    │   ├── compute.css · gpu.css · storage.css · network.css · total.css
    │
    ├── components/             # shared UI used across features
    │   ├── Slider.tsx · SegGroup.tsx · Panel.tsx · Cards.tsx · StackBar.tsx
    │   ├── Reveal.tsx                  # scroll-into-view animation
    │   └── Header.tsx · Hero.tsx · Footer.tsx
    │
    └── lib/                    # shared logic + state
        ├── types.ts                   # all domain types
        ├── config.ts                  # ◀── ALL ILLUSTRATIVE NUMBERS LIVE HERE
        ├── format.ts                  # money/GB formatting + volume-slider mapping
        ├── CostContext.tsx            # shared state the four layers read & write
        ├── stack.ts                   # the cross-layer total
        └── useCountUp.ts              # number count-up animation hook
```

## Two things worth knowing

**Where the numbers are.** Every figure on the page is illustrative and traces back to `src/lib/config.ts` (`RATES`, `MODELS`, `BUCKETS`, `GPUS`, `PAYLOADS`). Swap in your live dataset there and the whole page updates — no component edits needed.

**Why there's only one `index.html`.** A React/Vite app has a single HTML entry at the project root; Vite requires it there. There are no separate per-section `.html` files because in React each section's *markup* is the JSX inside its `*Section.tsx` component — that's the React equivalent of the HTML for that experience. So markup lives with each feature, logic sits beside it in the `*Model.ts` file, and all styling is consolidated in `styles/`. If you ever do want the entry HTML somewhere other than root, Vite's `root` / `build.rollupOptions.input` options allow it, but root is the convention.

## Deploying a preview (Netlify)

Don't push straight to your production branch. Open a PR and Netlify builds an isolated **Deploy Preview** at `deploy-preview-<PR#>--<sitename>.netlify.app`, separate from production. The build command is `npm run build` and the publish directory is `dist`. Merge the PR only when the preview looks right.

## Token pricing & measured cost (Langfuse → cost)

Two capabilities were added:

### 1. Real token pricing

Model prices come from the **LiteLLM** price list (or **OpenRouter**), not hand-typed numbers.

```bash
npm run prices:update                  # default: LiteLLM
node scripts/update-prices.mjs --source openrouter
```

This writes two files under `src/lib/pricing/`:

- `model-prices.generated.json` — the full normalized table (Anthropic / OpenAI / Google), **server-side only**.
- `ladder-prices.generated.json` — five rungs the website imports. The displayed `$/Mtok` for each model rung is a blend of that model's real input & output rates (`BLEND_INPUT_SHARE`, default `0.5`). Anchors are set in `scripts/update-prices.mjs` (`LADDER_REFS`) and are easy to edit.

The full table is deliberately kept out of the browser bundle; the site only ships the small ladder.

### 2. Measured cost from Langfuse telemetry

`GET /api/usage-cost?from=<ISO>&to=<ISO>` (Netlify function) streams your Langfuse `GENERATION` observations, normalizes each provider's usage into one `NormalizedUsage` record, prices it with the table above, and returns a per-model cost report.

Environment variables:

```
LANGFUSE_PUBLIC_KEY   # pk-lf-...
LANGFUSE_SECRET_KEY   # sk-lf-...
LANGFUSE_HOST         # optional, default https://cloud.langfuse.com
```

From the browser:

```ts
import { fetchMeasuredCost } from './lib/measuredCost';
const report = await fetchMeasuredCost();           // last 30 days
// report.totals.costUSD, report.byModel[...], report.unpriced[...]
```

**`NormalizedUsage` normalization rules** (categories are non-overlapping and additive, so `total = input + output + cacheRead + cacheWrite + reasoning`):

- **Anthropic** — `input_tokens` / `cache_read_input_tokens` / `cache_creation_input_tokens` / `output_tokens` are already separate; mapped directly.
- **OpenAI** — `prompt_tokens` *includes* cached, `completion_tokens` *includes* reasoning, so cached and reasoning are subtracted out into their own buckets.
- **Gemini** — `promptTokenCount` *includes* `cachedContentTokenCount`; `thoughtsTokenCount` becomes reasoning. Subtracted likewise.
- **Langfuse** — `usageDetails` categories are additive, so they're read directly (with small key-alias handling).

Cost per row: `input·inRate + output·outRate + cacheRead·(cacheReadRate ?? inRate) + cacheWrite·(cacheWriteRate ?? inRate) + reasoning·(reasoningRate ?? outRate)`.

Code map: pricing in `src/lib/pricing/`, usage normalization in `src/lib/usage/`, Langfuse client + aggregator in `src/server/langfuse/`.

## Cloud GPU pricing & provider selector (compute / GPU section)

The GPU section (02) now prices hardware from a chosen cloud provider instead of a single illustrative rate. A **Cloud provider** selector (AWS / Azure / Oracle) sits above the accelerator picker; switching providers reprices the per-GPU `$/hr`, which flows through the existing `$/hr ÷ throughput ÷ utilization` math into the effective `$/Mtok`.

```bash
npm run gpu-prices:update     # regenerate src/lib/cloud/gpu-prices.generated.json
```

Prices are **per-GPU $/hr** (instance price ÷ GPU count) at public on-demand / pay-as-you-go list rates, captured in `src/lib/cloud/gpu-prices.generated.json` with the source and instance type for each. Current snapshot (as of `2026-06-25`):

| GPU | AWS (us-east-1) | Azure (East US) | Oracle (flat) |
|---|---|---|---|
| L40S | $1.86 (g6e.xlarge) | — | — |
| A100-80G | $3.43 (p4de.24xlarge) | $4.10 (ND96amsr A100 v4) | $3.05 (BM.GPU.A100-v2.8) |
| H100-80G | $6.88 (p5.48xlarge) | $12.29 (ND96isr H100 v5) | $10.00 (BM.GPU.H100.8) |
| H200 | $7.91 (p5en.48xlarge) | — | $10.00~ (BM.GPU.H200.8) |
| B200 | $14.24 (p6-b200.48xlarge) | — | $15.00~ (BM.GPU.B200.8) |

Notes:
- Providers expose different accelerators; the picker only shows what each one prices. If you switch to a provider that doesn't offer the currently selected GPU, it falls back to that provider's cheapest option.
- `~` marks figures the provider doesn't fully publish (Oracle H200/B200) — treat as estimates.
- These are list prices and **change frequently**. To refresh, edit the `CURATED` table in `scripts/update-gpu-prices.mjs` (sources noted inline: AWS via vantage/AWS pricing, Azure via the Retail Prices API at `prices.azure.com`, Oracle via the OCI price list) and re-run. Per-GPU normalization ignores that hyperscalers usually rent whole multi-GPU instances.

Code map: data in `src/lib/cloud/`, selector + provenance in `src/features/gpu/GpuSection.tsx`, repricing in `src/features/gpu/gpuModel.ts`, provider added to `gpu` state in `src/lib/CostContext.tsx`.
