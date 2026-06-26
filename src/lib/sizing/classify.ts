// ============================================================
// Classify an observed generation into a difficulty bucket
// (simple / moderate / complex) — DIFFICULTY, not token length.
// This default is a HEURISTIC SEED so the pipeline runs end to
// end; replace it with a learned classifier trained on
// (prompt -> cheapest sufficient tier) labels harvested from the
// replay harness (phase 2). Token counts are weak features here,
// never the label.
// ============================================================
import type { LangfuseObservation } from '../../server/langfuse/client';
import type { NormalizedUsage } from '../usage';
import type { BucketId } from '../types';

export interface SizeClassifier {
  classify(obs: LangfuseObservation, usage: NormalizedUsage): BucketId;
}

export const heuristicClassifier: SizeClassifier = {
  classify(_obs, usage): BucketId {
    // Reasoning tokens or long generations => the task needed a capable model.
    if (usage.reasoningTokens > 0) return 'complex';
    if (usage.outputTokens >= 600) return 'complex';
    // Short, bounded output on a small prompt => likely a simple/structured task.
    if (usage.outputTokens <= 64 && usage.inputTokens <= 800) return 'simple';
    return 'moderate';
  },
};
