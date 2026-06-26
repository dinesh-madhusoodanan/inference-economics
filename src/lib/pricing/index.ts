// ============================================================
// Pricing entrypoint. Imports the generated table (server-side
// usage). Keep this out of the browser bundle — the website
// reads the small ladder file instead (see config.ts).
// ============================================================
import type { PricingTable } from './pricingTypes';
import generated from './model-prices.generated.json';
import { createPricingLookup } from './resolveModel';

export type { ModelPricing, PricingTable, Vendor } from './pricingTypes';
export { costForUsage, zeroCost, addCost } from './cost';
export type { CostBreakdown } from './cost';
export { createPricingLookup } from './resolveModel';

export const PRICING_TABLE = generated as unknown as PricingTable;
export const lookupPrice = createPricingLookup(PRICING_TABLE);
export const getPricing = (model: string) => lookupPrice(model);
