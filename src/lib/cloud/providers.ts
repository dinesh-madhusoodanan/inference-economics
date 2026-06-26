// ============================================================
// Cloud GPU pricing — lets the compute/GPU section price hardware
// from a chosen provider (AWS / Azure / Oracle). Prices are
// per-GPU $/hr at public list rates; see gpu-prices.generated.json
// (produced by `npm run gpu-prices:update`).
// ============================================================
import type { Gpu, GpuId, CloudProviderId } from '../types';
import data from './gpu-prices.generated.json';

interface GpuEntry {
  usdPerGpuHour: number;
  instance: string;
  gpuCount: number;
  approx: boolean;
  source: string;
}
interface ProviderEntry {
  id: CloudProviderId;
  name: string;
  region: string;
  pricingModel: string;
  gpus: Partial<Record<GpuId, GpuEntry>>;
}
interface GpuPriceData {
  asOf: string;
  currency: string;
  unit: string;
  note?: string;
  providers: ProviderEntry[];
}

const DATA = data as unknown as GpuPriceData;

export const GPU_PRICES_AS_OF = DATA.asOf;

/** display names for each accelerator id */
export const GPU_NAMES: Record<GpuId, string> = {
  l40s: 'L40S',
  a100: 'A100 80G',
  h100: 'H100 80G',
  h200: 'H200',
  b200: 'B200',
};

/** stable display order (cheapest/oldest → priciest/newest) */
const GPU_ORDER: GpuId[] = ['l40s', 'a100', 'h100', 'h200', 'b200'];

const byId = new Map<CloudProviderId, ProviderEntry>(DATA.providers.map((p) => [p.id, p]));

export interface CloudProviderMeta {
  id: CloudProviderId;
  name: string;
  region: string;
  pricingModel: string;
}

export const CLOUD_PROVIDERS: CloudProviderMeta[] = DATA.providers.map(
  ({ id, name, region, pricingModel }) => ({ id, name, region, pricingModel }),
);

export function providerMeta(id: CloudProviderId): CloudProviderMeta {
  const p = byId.get(id);
  return p
    ? { id: p.id, name: p.name, region: p.region, pricingModel: p.pricingModel }
    : { id, name: id, region: '', pricingModel: '' };
}

export function gpuEntry(provider: CloudProviderId, gpuId: GpuId): GpuEntry | undefined {
  return byId.get(provider)?.gpus[gpuId];
}

export function gpuPrice(provider: CloudProviderId, gpuId: GpuId): number | undefined {
  return gpuEntry(provider, gpuId)?.usdPerGpuHour;
}

export function providerOffers(provider: CloudProviderId, gpuId: GpuId): boolean {
  return Boolean(gpuEntry(provider, gpuId));
}

/** the accelerators a provider prices, in display order, as Gpu records */
export function gpusForProvider(provider: CloudProviderId): Gpu[] {
  const p = byId.get(provider);
  if (!p) return [];
  return GPU_ORDER.filter((id) => p.gpus[id]).map((id) => ({
    id,
    name: GPU_NAMES[id],
    price: p.gpus[id]!.usdPerGpuHour,
  }));
}

/** cheapest accelerator a provider offers (used as a fallback default) */
export function defaultGpuFor(provider: CloudProviderId): GpuId {
  const list = gpusForProvider(provider);
  if (list.length === 0) return 'h100';
  return list.reduce((a, b) => (b.price < a.price ? b : a)).id;
}

/** keep the current GPU when the new provider offers it, else fall back */
export function reconcileGpu(provider: CloudProviderId, current: GpuId): GpuId {
  return providerOffers(provider, current) ? current : defaultGpuFor(provider);
}
