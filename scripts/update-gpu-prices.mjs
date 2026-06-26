#!/usr/bin/env node
/**
 * Cloud GPU price table for the compute/GPU section.
 *
 *   node scripts/update-gpu-prices.mjs   ->  src/lib/cloud/gpu-prices.generated.json
 *
 * Values are PER-GPU $/hr (instance $/hr ÷ GPU count) at public on-demand /
 * pay-as-you-go list rates. Edit CURATED below and re-run to refresh, or wire
 * a live source in your own environment:
 *   - AWS:    EC2 on-demand (sources: instances.vantage.sh, aws.amazon.com/ec2/pricing)
 *   - Azure:  Retail Prices API  https://prices.azure.com/api/retail/prices
 *   - Oracle: OCI price list     https://www.oracle.com/cloud/price-list/
 *
 * `approx: true` marks figures the provider does not fully publish (treat as estimates).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'cloud', 'gpu-prices.generated.json');
const ASOF = '2026-06-25';

const CURATED = {
  asOf: ASOF,
  currency: 'USD',
  unit: 'usd-per-gpu-hour',
  note: 'Per-GPU on-demand/list price = instance price ÷ GPU count. Verify against live pricing before planning.',
  providers: [
    {
      id: 'aws', name: 'AWS', region: 'us-east-1', pricingModel: 'on-demand',
      gpus: {
        l40s: { usdPerGpuHour: 1.861, instance: 'g6e.xlarge',        gpuCount: 1, approx: false, source: 'instances.vantage.sh' },
        a100: { usdPerGpuHour: 3.431, instance: 'p4de.24xlarge',     gpuCount: 8, approx: false, source: 'instances.vantage.sh' },
        h100: { usdPerGpuHour: 6.880, instance: 'p5.48xlarge',       gpuCount: 8, approx: false, source: 'instances.vantage.sh' },
        h200: { usdPerGpuHour: 7.912, instance: 'p5en.48xlarge',     gpuCount: 8, approx: false, source: 'calculator.holori.com' },
        b200: { usdPerGpuHour: 14.242, instance: 'p6-b200.48xlarge', gpuCount: 8, approx: false, source: 'instances.vantage.sh' },
      },
    },
    {
      id: 'azure', name: 'Azure', region: 'East US', pricingModel: 'pay-as-you-go',
      gpus: {
        a100: { usdPerGpuHour: 4.096, instance: 'ND96amsr A100 v4', gpuCount: 8, approx: false, source: 'instances.vantage.sh' },
        h100: { usdPerGpuHour: 12.290, instance: 'ND96isr H100 v5', gpuCount: 8, approx: false, source: 'instances.vantage.sh' },
      },
    },
    {
      id: 'oracle', name: 'Oracle (OCI)', region: 'flat / global', pricingModel: 'on-demand',
      gpus: {
        a100: { usdPerGpuHour: 3.05,  instance: 'BM.GPU.A100-v2.8', gpuCount: 8, approx: false, source: 'oracle.com / easecloud' },
        h100: { usdPerGpuHour: 10.00, instance: 'BM.GPU.H100.8',    gpuCount: 8, approx: false, source: 'blogs.oracle.com' },
        h200: { usdPerGpuHour: 10.00, instance: 'BM.GPU.H200.8',    gpuCount: 8, approx: true,  source: 'blogs.oracle.com (approx)' },
        b200: { usdPerGpuHour: 15.00, instance: 'BM.GPU.B200.8',    gpuCount: 8, approx: true,  source: 'spheron.network ($14–16)' },
      },
    },
  ],
};

writeFileSync(OUT, JSON.stringify(CURATED, null, 2) + '\n');
const rows = CURATED.providers.flatMap((p) => Object.keys(p.gpus).map((g) => `${p.id}/${g}`));
console.log(`wrote ${CURATED.providers.length} providers, ${rows.length} price points -> ${OUT.replace(/.*\/ie\//, '')}`);
console.log('as of', ASOF);
