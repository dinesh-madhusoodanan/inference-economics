// ============================================================
// Shared savings data for all five experiences. Fetches the
// real /api/savings-report once; if it isn't reachable (e.g. the
// public marketing site with no Langfuse keys), it falls back to
// the bundled sample so every panel stays live.
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { SavingsReport } from '../../server/savings/savingsReport';
import { SAMPLE_REPORT } from '../../lib/savings/sampleReport';

export type ReportSource = 'live' | 'sample';

interface SavingsCtx {
  report: SavingsReport;
  source: ReportSource;
  loading: boolean;
  days: number;
  setDays: (d: number) => void;
}

const Ctx = createContext<SavingsCtx | null>(null);
const DAY_MS = 24 * 60 * 60 * 1000;

async function fetchReport(days: number, signal: AbortSignal): Promise<SavingsReport | null> {
  const to = new Date().toISOString();
  const from = new Date(Date.now() - days * DAY_MS).toISOString();
  const res = await fetch(`/api/savings-report?from=${from}&to=${to}`, { signal });
  if (!res.ok) return null;
  const json = (await res.json()) as Partial<SavingsReport>;
  if (!json || !Array.isArray(json.byAgent) || json.byAgent.length === 0) return null;
  return json as SavingsReport;
}

export function SavingsProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<SavingsReport>(SAMPLE_REPORT);
  const [source, setSource] = useState<ReportSource>('sample');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 4000); // don't hang the page
    setLoading(true);
    fetchReport(days, ac.signal)
      .then((live) => {
        if (live) { setReport(live); setSource('live'); }
        else { setReport(SAMPLE_REPORT); setSource('sample'); }
      })
      .catch(() => { setReport(SAMPLE_REPORT); setSource('sample'); })
      .finally(() => { clearTimeout(timer); setLoading(false); });
    return () => { clearTimeout(timer); ac.abort(); };
  }, [days]);

  return <Ctx.Provider value={{ report, source, loading, days, setDays }}>{children}</Ctx.Provider>;
}

export function useSavings(): SavingsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSavings must be used within a SavingsProvider');
  return c;
}
