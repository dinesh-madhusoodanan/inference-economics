// 07 · Performance comparison across providers / open-weights → shadow-replay harness.
import { useState } from 'react';
import { Reveal } from '../../components/Reveal';
import { SegGroup } from '../../components/SegGroup';
import { fmtMoney } from '../../lib/format';
import { useSavings } from './SavingsContext';
import { WidePanel } from './WidePanel';

const BARS = [{ id: '0.90', label: '90%' }, { id: '0.95', label: '95%' }, { id: '0.98', label: '98%' }];

// Plot area in viewBox units.
const W = 620, H = 320, PAD = 46;
const xCost = (rel: number) => PAD + Math.min(1.15, Math.max(0, rel)) / 1.15 * (W - PAD * 2);
const yQual = (q: number) => H - PAD - (Math.min(1, Math.max(0.8, q)) - 0.8) / 0.2 * (H - PAD * 2);

export function PerformanceSection() {
  const { report } = useSavings();
  const [bar, setBar] = useState(0.95);

  const points = report.byAgent.flatMap((a) =>
    a.byBucket.map((b) => ({
      key: `${a.agent}-${b.bucket}`,
      rel: b.actualCostUSD > 0 ? b.candidateCostUSD / b.actualCostUSD : 1,
      q: b.quality.qualityRetained,
      savings: b.savingsUSD,
    })),
  );

  const validated = points.filter((p) => p.q >= bar);
  const validatedSavings = validated.reduce((s, p) => s + p.savings, 0);
  const allSavings = points.reduce((s, p) => s + p.savings, 0) || 1;
  const pctValidated = Math.round((validatedSavings / allSavings) * 100);

  return (
    <section className="section" id="performance">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">07</span>Performance · savings vs quality</p>
          <h2 className="h-sec">A cheaper model only counts if it <em>holds quality</em>.</h2>
          <p className="lead">This is the gate. A stratified sample of real prompts is replayed through each candidate and judged against the original answer. Every dot is a candidate slice: <b>left</b> is cheaper, <b>up</b> is higher quality retained. Only dots above your quality bar are savings you can actually bank.</p>
        </Reveal>

        <Reveal>
          <WidePanel title="Cost vs quality — every candidate, replayed">
            <div className="panel-controls">
              <div className="verdict" style={{ margin: 0, flex: 1 }} aria-live="polite">
                <p className="verdict__tag">{pctValidated}% of savings clears the bar</p>
                <p className="verdict__txt"><b>{fmtMoney(validatedSavings)}</b> of <b>{fmtMoney(allSavings)}</b> potential monthly savings holds ≥ <b>{Math.round(bar * 100)}%</b> quality on replay. The rest needs a stronger target or stays put.</p>
              </div>
              <div className="bar-pick">
                <span className="field__lab">Quality bar</span>
                <SegGroup items={BARS} value={bar.toFixed(2)} onChange={(id) => setBar(Number(id))} />
              </div>
            </div>

            <svg className="frontier-plot" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="cost versus quality scatter">
              <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="axis" />
              <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} className="axis" />
              <line x1={PAD} y1={yQual(bar)} x2={W - PAD} y2={yQual(bar)} className="bar-line" />
              <text x={W - PAD} y={yQual(bar) - 6} className="plot-lab r">quality bar {Math.round(bar * 100)}%</text>
              {/* baseline: current model at (rel cost 1, quality 1) */}
              <circle cx={xCost(1)} cy={yQual(1)} r={6} className="dot dot--base" />
              <text x={xCost(1) + 9} y={yQual(1) + 4} className="plot-lab">current</text>
              {points.map((p) => (
                <circle key={p.key} cx={xCost(p.rel)} cy={yQual(p.q)} r={6}
                  className={`dot ${p.q >= bar ? 'dot--ok' : 'dot--risk'}`}>
                  <title>{p.key} · {Math.round(p.q * 100)}% quality · {Math.round(p.rel * 100)}% of cost</title>
                </circle>
              ))}
              <text x={W - PAD} y={H - 16} className="plot-lab r">relative cost →</text>
              <text x={PAD - 10} y={PAD - 14} className="plot-lab">quality retained ↑</text>
            </svg>
          </WidePanel>
        </Reveal>

        <p className="note">Live phase-1 reports verdicts as <span className="mono">unverified</span> (cost-only) until this replay harness runs; the sample above shows judged results so the experience is visible.</p>
      </div>
    </section>
  );
}
