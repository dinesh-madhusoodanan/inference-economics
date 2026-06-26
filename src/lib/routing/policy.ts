// ============================================================
// Routing policy + LiteLLM config emitter. We do NOT build a
// gateway — we render a config that LiteLLM (or a thin shim)
// enforces. Deployment mode matters: a routed provider API is
// linear $/token, while a self-hosted/local model is a fixed cost
// (minimise tokens vs. maximise utilisation). Only quality-PASSED
// rules drive the emitted config.
// ============================================================
import type { BucketId, ModelId } from '../types';
import { modelById } from '../config';

export type DeploymentMode = 'routed' | 'hosted' | 'local';

export function deploymentModeFor(modelId: ModelId): DeploymentMode {
  if (modelId === 'small') return 'local';   // small open weights -> CPU/box
  if (modelId === 'open70b') return 'hosted'; // open weights -> self-hosted GPU
  return 'routed';                            // frontier/balanced -> provider API
}

export interface RouteRule {
  agent: string;
  bucket: BucketId;
  target: ModelId;
  /** real model the rung prices from, if known */
  targetModel?: string;
  deploymentMode: DeploymentMode;
  qualityPassed: boolean;
}

export interface LiteLLMConfig {
  model_list: Array<{ model_name: string; litellm_params: { model: string } }>;
  router_settings: { routing_strategy: string };
  /** our agent/bucket -> rung map; consumed by a thin pre-router shim */
  rules: Array<{ agent: string; bucket: BucketId; target_model: string; deployment_mode: DeploymentMode }>;
}

export function buildLiteLLMConfig(rules: RouteRule[]): LiteLLMConfig {
  const passed = rules.filter((r) => r.qualityPassed);
  const models = new Map<ModelId, string>();
  for (const r of passed) models.set(r.target, r.targetModel ?? modelById(r.target).name);

  return {
    model_list: [...models.entries()].map(([rung, real]) => ({
      model_name: rung,
      litellm_params: { model: real },
    })),
    router_settings: { routing_strategy: 'simple-shuffle' },
    rules: passed.map((r) => ({
      agent: r.agent,
      bucket: r.bucket,
      target_model: r.target,
      deployment_mode: r.deploymentMode,
    })),
  };
}
