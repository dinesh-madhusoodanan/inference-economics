# Savings / cost-optimization layer

This adds a recommendation layer on top of the existing cost model. The repo already
answers **"what did we spend"** (`/api/usage-cost`, grouped by model). This layer answers
**"where could we have saved, and how"** (`/api/savings-report`, grouped by agent), reusing
the existing Langfuse client, normalized usage, pricing table, and model ladder — no new
dependencies.

## Governing principle

Cost savings without a quality bound is meaningless. Every counterfactual carries a
`QualityVerdict`. **Phase 1 emits `unverified` verdicts** (cost computed, quality not yet
validated), so `routingPolicy.rules` is intentionally empty until the quality gate is wired —
the report is advisory, never auto-routing on unproven claims.

## New modules (`src/lib`, `src/server`)

| Path | Role |
|---|---|
| `lib/quality/verdict.ts` | `QualityVerdict` type + `gate()`. The thing that makes a savings number honest. |
| `lib/sizing/classify.ts` | Classify each generation into `simple/moderate/complex` by **difficulty** (heuristic seed; replace with a learned/judged classifier). |
| `lib/attribution/perAgent.ts` | `agentKey(obs)` — group by trace/agent, not by model. |
| `lib/counterfactual/savings.ts` | Price each call against the cheapest ladder rung meeting its bucket's tier (`cheapestFor`), via the real per-token table (`costForUsage`). |
| `lib/offload/cpuOffload.ts` | Detect simple, high-volume slices a small local model could serve on CPU; break-even math. |
| `lib/routing/policy.ts` | Build a LiteLLM config from quality-PASSED rules; deployment-mode aware (routed/hosted/local). |
| `server/savings/savingsReport.ts` | Orchestrator: stream → classify → attribute → counterfactual → offload → policy. Mirrors `server/langfuse/usageCost.ts`. |

## Endpoint

`netlify/functions/savings-report.mts` → `GET /api/savings-report?from=ISO&to=ISO`

```
Required env: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY
Optional env: LANGFUSE_HOST, OFFLOAD_CAPEX_USD,
              OFFLOAD_MIN_VOLUME_PER_DAY, LOCAL_MARGINAL_PER_1K_TOKENS
```

Returns: `totals` (actual cost, potential savings, savings %), `byAgent` (per-bucket slices
with candidate model + savings), `offloadOpportunities`, and `routingPolicy` (LiteLLM config).

## Roadmap

1. **(done)** Read-only analytics: per-agent savings + offload, cost-only / unverified.
2. **Quality validation** — wire `lib/quality`: read Langfuse scores first (free signal), then
   replay a stratified sample + LLM-judge. Verdicts begin to pass → `routingPolicy.rules` fills.
3. **CPU-offload validation** — replay the simple slice through a local small model before recommending.
4. **Enforcement** — consume `routingPolicy` via LiteLLM (or a thin pre-router shim).

## Two design notes carried over

- **Sizing is difficulty, not token length.** The heuristic in `classify.ts` is a seed; the real
  classifier learns from `(prompt → cheapest sufficient tier)` labels from the replay harness.
- **Hosted vs routed flips the cost function.** A routed provider API is linear $/token; a
  self-hosted/local model is fixed cost (minimize tokens vs. maximize utilization).
  `routing/policy.ts` tags each rung with its deployment mode.
