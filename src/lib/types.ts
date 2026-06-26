// ============================================================
// Shared domain types for the inference cost model.
// ============================================================
export type ModelId = 'small' | 'open70b' | 'balanced' | 'frontier' | 'reasoning';
export type GpuId = 'l40s' | 'a100' | 'h100' | 'h200' | 'b200';
export type CloudProviderId = 'aws' | 'azure' | 'oracle';
export type PayloadId = 'text' | 'image' | 'audio' | 'video';
export type BucketId = 'simple' | 'moderate' | 'complex';

export interface Model { id: ModelId; name: string; price: number; tier: number; }
export interface Bucket { id: BucketId; label: string; minTier: number; }
export interface Gpu { id: GpuId; name: string; price: number; }
export interface Payload { id: PayloadId; name: string; bytes: number; }

export interface CostState {
  // 01 · compute & model
  volume: number;
  tokens: number;
  mix: Record<BucketId, number>;
  current: ModelId;
  // 02 · gpu (priced from the selected cloud provider)
  gpu: { provider: CloudProviderId; type: GpuId; tput: number; util: number; fleet: number };
  // 03 · storage
  weights: number;
  replicas: number;
  data: number;
  vector: number;
  // 04 · network
  egress: { payload: PayloadId; xregionGB: number };
}
