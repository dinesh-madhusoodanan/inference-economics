// ============================================================
// Single source of truth for all four layers. Sections read
// state and call set()/patch(); the total recomputes from it.
// ============================================================
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { CostState } from './types';

const initialState: CostState = {
  volume: 2_000_000,
  tokens: 1500,
  mix: { simple: 45, moderate: 40, complex: 15 },
  current: 'frontier',
  gpu: { provider: 'aws', type: 'h100', tput: 3000, util: 40, fleet: 8 },
  weights: 140,
  replicas: 3,
  data: 600,
  vector: 80,
  egress: { payload: 'text', xregionGB: 200 },
};

interface CostContextValue {
  state: CostState;
  set: <K extends keyof CostState>(key: K, value: CostState[K]) => void;
  patch: (partial: Partial<CostState>) => void;
}

const Ctx = createContext<CostContextValue | null>(null);

export function CostProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CostState>(initialState);
  const set: CostContextValue['set'] = (key, value) =>
    setState((s) => ({ ...s, [key]: value }));
  const patch: CostContextValue['patch'] = (partial) =>
    setState((s) => ({ ...s, ...partial }));
  return <Ctx.Provider value={{ state, set, patch }}>{children}</Ctx.Provider>;
}

export function useCost(): CostContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCost must be used within a CostProvider');
  return c;
}
