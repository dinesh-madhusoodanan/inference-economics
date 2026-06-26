// ============================================================
// Colours + labels for the savings experiences, drawn from the
// existing editorial palette (tokens.css) so they sit natively
// alongside the cost-stack sections.
// ============================================================
import type { BucketId } from '../types';
import type { DeploymentMode } from '../routing/policy';

export const BUCKET_COLOR: Record<BucketId, string> = {
  simple: '#7FA9A0',   // --c-storage (calm teal)
  moderate: '#9C6B2E', // --c-gpu (amber)
  complex: '#0E5A66',  // --accent (deep teal)
};

export const BUCKET_LABEL: Record<BucketId, string> = {
  simple: 'Simple',
  moderate: 'Moderate',
  complex: 'Complex',
};

export const DEPLOY_COLOR: Record<DeploymentMode, string> = {
  routed: '#5B6B8C',  // --c-net
  hosted: '#9C6B2E',  // --c-gpu
  local: '#2E7D52',   // --pos
};

export const DEPLOY_LABEL: Record<DeploymentMode, string> = {
  routed: 'Routed API',
  hosted: 'Self-hosted GPU',
  local: 'Local · CPU',
};
