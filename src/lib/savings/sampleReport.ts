// ============================================================
// A realistic, typed SavingsReport fixture. The public site has
// no access to a viewer's Langfuse keys, so the savings sections
// render this sample by default ("every panel is live"), and swap
// to real telemetry when /api/savings-report is reachable.
//
// Unlike the phase-1 backend (which emits `unverified` verdicts),
// this sample shows the *full* experience: some slices have passed
// the quality gate, so routing + performance views are populated.
// ============================================================
import type { SavingsReport } from '../../server/savings/savingsReport';

const judged = (model: string, retained: number, passed: boolean) => ({
  candidateModel: model,
  method: 'llm_judge' as const,
  sampleSize: 120,
  winOrTieRate: retained,
  qualityRetained: retained,
  passed,
});

export const SAMPLE_REPORT: SavingsReport = {
  fromStartTime: undefined,
  toStartTime: undefined,
  generatedAt: new Date().toISOString(),
  spanDays: 30,
  totals: {
    observations: 302_200,
    actualCostUSD: 5376,
    potentialSavingsUSD: 3143,
    savingsPct: 3143 / 5376,
  },
  byAgent: [
    {
      agent: 'doc-summarizer',
      volume: 96_000,
      actualCostUSD: 1590,
      potentialSavingsUSD: 1424,
      byBucket: [
        { bucket: 'simple', candidate: 'small', volume: 84_000, tokens: 62_160_000, actualCostUSD: 1180, candidateCostUSD: 46, savingsUSD: 1134, quality: judged('gemini-2.0-flash', 0.97, true) },
        { bucket: 'moderate', candidate: 'open70b', volume: 12_000, tokens: 14_400_000, actualCostUSD: 410, candidateCostUSD: 120, savingsUSD: 290, quality: judged('gpt-4o-mini', 0.96, true) },
      ],
    },
    {
      agent: 'code-assistant',
      volume: 23_000,
      actualCostUSD: 1840,
      potentialSavingsUSD: 710,
      byBucket: [
        { bucket: 'complex', candidate: 'frontier', volume: 9_000, tokens: 46_800_000, actualCostUSD: 1320, candidateCostUSD: 880, savingsUSD: 440, quality: judged('gpt-4o', 0.95, true) },
        { bucket: 'moderate', candidate: 'balanced', volume: 14_000, tokens: 16_800_000, actualCostUSD: 520, candidateCostUSD: 250, savingsUSD: 270, quality: judged('gemini-2.5-flash', 0.96, true) },
      ],
    },
    {
      agent: 'support-chat',
      volume: 58_000,
      actualCostUSD: 870,
      potentialSavingsUSD: 552,
      byBucket: [
        { bucket: 'moderate', candidate: 'balanced', volume: 40_000, tokens: 32_000_000, actualCostUSD: 720, candidateCostUSD: 300, savingsUSD: 420, quality: judged('gemini-2.5-flash', 0.95, true) },
        { bucket: 'simple', candidate: 'small', volume: 18_000, tokens: 9_000_000, actualCostUSD: 150, candidateCostUSD: 18, savingsUSD: 132, quality: judged('gemini-2.0-flash', 0.98, true) },
      ],
    },
    {
      agent: 'contract-analyzer',
      volume: 5_200,
      actualCostUSD: 980,
      potentialSavingsUSD: 370,
      byBucket: [
        { bucket: 'complex', candidate: 'frontier', volume: 5_200, tokens: 27_040_000, actualCostUSD: 980, candidateCostUSD: 610, savingsUSD: 370, quality: judged('gpt-4o', 0.91, false) },
      ],
    },
    {
      agent: 'email-classifier',
      volume: 120_000,
      actualCostUSD: 96,
      potentialSavingsUSD: 87,
      byBucket: [
        { bucket: 'simple', candidate: 'small', volume: 120_000, tokens: 36_000_000, actualCostUSD: 96, candidateCostUSD: 9, savingsUSD: 87, quality: judged('gemini-2.0-flash', 0.99, true) },
      ],
    },
  ],
  offloadOpportunities: [
    { agent: 'email-classifier', bucket: 'simple', volumePerDay: 4000, tokensPerDay: 1_200_000, currentCostPerDayUSD: 3.2, localMarginalPerDayUSD: 0, dailySavingsUSD: 3.2, breakevenDays: 218.75, quality: judged('local-small-model', 0.97, true) },
    { agent: 'doc-summarizer', bucket: 'simple', volumePerDay: 2800, tokensPerDay: 2_072_000, currentCostPerDayUSD: 39.33, localMarginalPerDayUSD: 0, dailySavingsUSD: 39.33, breakevenDays: 17.8, quality: judged('local-small-model', 0.96, true) },
    { agent: 'support-chat', bucket: 'simple', volumePerDay: 600, tokensPerDay: 300_000, currentCostPerDayUSD: 5, localMarginalPerDayUSD: 0, dailySavingsUSD: 5, breakevenDays: 140, quality: judged('local-small-model', 0.98, true) },
  ],
  routingPolicy: {
    model_list: [
      { model_name: 'small', litellm_params: { model: 'gemini-2.0-flash' } },
      { model_name: 'open70b', litellm_params: { model: 'gpt-4o-mini' } },
      { model_name: 'balanced', litellm_params: { model: 'gemini-2.5-flash' } },
      { model_name: 'frontier', litellm_params: { model: 'gpt-4o' } },
    ],
    router_settings: { routing_strategy: 'simple-shuffle' },
    rules: [
      { agent: 'doc-summarizer', bucket: 'simple', target_model: 'small', deployment_mode: 'local' },
      { agent: 'doc-summarizer', bucket: 'moderate', target_model: 'open70b', deployment_mode: 'hosted' },
      { agent: 'email-classifier', bucket: 'simple', target_model: 'small', deployment_mode: 'local' },
      { agent: 'support-chat', bucket: 'simple', target_model: 'small', deployment_mode: 'local' },
      { agent: 'support-chat', bucket: 'moderate', target_model: 'balanced', deployment_mode: 'routed' },
      { agent: 'code-assistant', bucket: 'moderate', target_model: 'balanced', deployment_mode: 'routed' },
      { agent: 'code-assistant', bucket: 'complex', target_model: 'frontier', deployment_mode: 'routed' },
    ],
  },
  notes: [
    'Sample telemetry — connect a Langfuse project to see your own agents.',
    'Quality verdicts here are illustrative (method=llm_judge); the live phase-1 backend reports them as unverified until the gate is wired.',
  ],
};
