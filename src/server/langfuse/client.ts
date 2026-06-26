// ============================================================
// Minimal, dependency-free Langfuse client. Streams GENERATION
// observations (the telemetry) via the public Observations API
// using HTTP Basic auth (public key : secret key).
//
// Uses only web-standard globals (fetch, btoa, URLSearchParams)
// so it runs in a Netlify Function, a Node 18+ script, or an edge
// runtime without extra dependencies.
// ============================================================

export interface LangfuseObservation {
  id: string;
  traceId?: string;
  type?: string;
  name?: string;
  model?: string | null;
  startTime?: string;
  endTime?: string;
  usage?: { input?: number; output?: number; total?: number; unit?: string } | null;
  usageDetails?: Record<string, number> | null;
  costDetails?: Record<string, number> | null;
  calculatedTotalCost?: number | null;
  [k: string]: unknown;
}

export interface LangfuseClientOptions {
  /** e.g. https://cloud.langfuse.com (EU) or https://us.cloud.langfuse.com */
  baseUrl?: string;
  publicKey: string;
  secretKey: string;
  /** override for testing */
  fetchImpl?: typeof fetch;
}

export interface StreamGenerationsOptions {
  /** ISO timestamp, inclusive lower bound on startTime */
  fromStartTime?: string;
  /** ISO timestamp, exclusive upper bound on startTime */
  toStartTime?: string;
  /** rows per page (Langfuse default 50; v1 max 100) */
  pageLimit?: number;
  /** safety cap on pages fetched */
  maxPages?: number;
}

function basicAuth(publicKey: string, secretKey: string): string {
  return 'Basic ' + btoa(`${publicKey}:${secretKey}`);
}

export class LangfuseClient {
  private readonly baseUrl: string;
  private readonly auth: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: LangfuseClientOptions) {
    this.baseUrl = (opts.baseUrl ?? 'https://cloud.langfuse.com').replace(/\/+$/, '');
    this.auth = basicAuth(opts.publicKey, opts.secretKey);
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  /**
   * Async generator over GENERATION observations, newest first.
   * Pages through the v1 Observations API (works on Cloud and self-hosted).
   */
  async *streamGenerations(opts: StreamGenerationsOptions = {}): AsyncGenerator<LangfuseObservation> {
    const limit = opts.pageLimit ?? 100;
    const maxPages = opts.maxPages ?? 100_000;
    let page = 1;

    while (page <= maxPages) {
      const params = new URLSearchParams({ type: 'GENERATION', page: String(page), limit: String(limit) });
      if (opts.fromStartTime) params.set('fromStartTime', opts.fromStartTime);
      if (opts.toStartTime) params.set('toStartTime', opts.toStartTime);

      const res = await this.fetchImpl(`${this.baseUrl}/api/public/observations?${params.toString()}`, {
        headers: { Authorization: this.auth, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Langfuse request failed (${res.status}): ${body.slice(0, 300)}`);
      }

      const json = (await res.json()) as { data?: LangfuseObservation[]; meta?: { totalPages?: number } };
      const rows = json.data ?? [];
      for (const row of rows) yield row;

      const totalPages = json.meta?.totalPages ?? 1;
      if (rows.length === 0 || page >= totalPages) break;
      page += 1;
    }
  }
}
