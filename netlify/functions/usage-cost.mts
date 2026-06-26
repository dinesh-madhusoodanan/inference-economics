// ============================================================
// GET /api/usage-cost?from=ISO&to=ISO
// Streams Langfuse GENERATION telemetry, prices it with the
// LiteLLM-derived table, and returns an aggregated cost report.
//
// Required env: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY
// Optional env: LANGFUSE_HOST (default https://cloud.langfuse.com)
// ============================================================
import type { Config, Context } from '@netlify/functions';
import { LangfuseClient } from '../../src/server/langfuse/client';
import { computeUsageCost } from '../../src/server/langfuse/usageCost';
import { PRICING_TABLE } from '../../src/lib/pricing';

const DAY_MS = 24 * 60 * 60 * 1000;

export default async (req: Request, _context: Context): Promise<Response> => {
  const env = (globalThis as { Netlify?: { env?: { get(k: string): string | undefined } } }).Netlify?.env;
  const read = (k: string): string | undefined => env?.get(k) ?? (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env?.[k];

  const baseUrl = read('LANGFUSE_HOST') || 'https://cloud.langfuse.com';
  const publicKey = read('LANGFUSE_PUBLIC_KEY');
  const secretKey = read('LANGFUSE_SECRET_KEY');

  if (!publicKey || !secretKey) {
    return Response.json(
      { error: 'Missing LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY environment variables.' },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const now = Date.now();
  const from = url.searchParams.get('from') ?? new Date(now - 30 * DAY_MS).toISOString();
  const to = url.searchParams.get('to') ?? new Date(now).toISOString();

  try {
    const client = new LangfuseClient({ baseUrl, publicKey, secretKey });
    const report = await computeUsageCost(
      client,
      { fromStartTime: from, toStartTime: to, pageLimit: 100 },
      PRICING_TABLE,
    );
    return Response.json(report, {
      headers: { 'cache-control': 'public, max-age=300' },
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
};

export const config: Config = { path: '/api/usage-cost' };
