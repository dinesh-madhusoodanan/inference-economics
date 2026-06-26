// ============================================================
// QualityVerdict — the gate that makes a savings number honest.
// Cost savings without a quality bound is meaningless: every
// counterfactual must carry one of these. Phase 1 emits
// `unverified` verdicts (cost-only, clearly labelled); phases 2+
// replace them with langfuse-scores or replay+judge results.
// ============================================================
export type QualityMethod = 'unverified' | 'langfuse_scores' | 'llm_judge';

export interface QualityVerdict {
  /** the cheaper/alternative model being judged */
  candidateModel: string;
  method: QualityMethod;
  sampleSize: number;
  /** fraction where candidate >= baseline (0..1) */
  winOrTieRate: number;
  /** fraction of baseline quality retained (0..1), e.g. 0.95 */
  qualityRetained: number;
  /** met the configured threshold — only `true` verdicts may drive routing */
  passed: boolean;
}

/** Phase-1 placeholder: cost computed, quality NOT yet validated. */
export function unverifiedVerdict(candidateModel: string): QualityVerdict {
  return {
    candidateModel,
    method: 'unverified',
    sampleSize: 0,
    winOrTieRate: 0,
    qualityRetained: 0,
    passed: false,
  };
}

/** Apply a quality threshold; an unverified verdict can never pass. */
export function gate(verdict: QualityVerdict, threshold: number): QualityVerdict {
  return {
    ...verdict,
    passed: verdict.method !== 'unverified' && verdict.qualityRetained >= threshold,
  };
}
