// 09 · CPU / local-offload detection → the most novel, defensible feature.
import { useState } from 'react';
import { Reveal } from '../../components/Reveal';
import { Slider } from '../../components/Slider';
import { fmtInt, fmtMoney } from '../../lib/format';
import { useSavings } from './SavingsContext';

export function OffloadSection() {
  const { report } = useSavings();
  const [capex, setCapex] = useState(700);
  const [marginalPer1k, setMarginalPer1k] = useState(0);

  const rows = report.offloadOpportunities.map((o) => {
    const localPerDay = (o.tokensPerDay / 1000) * marginalPer1k;
    const dailySavings = o.currentCostPerDayUSD - localPerDay;
    const breakeven = dailySavings > 0 ? capex / dailySavings : null;
    return { ...o, localPerDay, dailySavings, breakeven };
  }).sort((a, b) => (a.breakeven ?? Infinity) - (b.breakeven ?? Infinity));

  const totalDaily = rows.reduce((s, r) => s + Math.max(0, r.dailySavings), 0);

  return (
    <section className="section" id="offload">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">09</span>Local offload · move it to the box</p>
          <h2 className="h-sec">Some traffic shouldn't hit a provider <em>at all</em>.</h2>
          <p className="lead">A large share of production "LLM" calls are classification, extraction, and short rewrites — work a quantised 1–3B model handles on a CPU at roughly the cost of electricity. The detector finds the <b>simple, high-volume</b> slices, validates them on replay, and works out when the hardware pays for itself.</p>
        </Reveal>

        <Reveal>
          <div className="two-col panel">
            <div className="panel__bar">
              <span className="panel__title">Offload break-even</span>
            </div>
            <div className="col-l">
              <Slider label="Hardware capex" sub="one-time, for the box" valueLabel={fmtMoney(capex)} min={0} max={5000} step={50} value={capex} onChange={setCapex} />
              <Slider label="Local cost / 1k tokens" sub="≈ electricity" valueLabel={`$${marginalPer1k.toFixed(4)}`} min={0} max={0.02} step={0.0005} value={marginalPer1k} onChange={setMarginalPer1k} />
              <p className="note" style={{ marginTop: 8 }}>Only <b>simple</b> slices above a volume floor qualify, and only after they clear the quality gate. Marginal cost on a box you already own is effectively electricity — set it to zero to see the ceiling.</p>
            </div>
            <div className="col-r">
              <div className="readout">
                <p className="readout__k">If all offloaded · saved / day</p>
                <p className="readout__v tnum">{fmtMoney(totalDaily)}<span className="u">/day</span></p>
              </div>
              <table className="rt">
                <thead><tr><th>Agent</th><th className="r">Calls/day</th><th className="r">$/day now</th><th className="r">Break-even</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.agent}>
                      <td>{r.agent}</td>
                      <td className="r tnum">{fmtInt(r.volumePerDay)}</td>
                      <td className="r tnum">{fmtMoney(r.currentCostPerDayUSD)}</td>
                      <td className="r tnum">
                        {r.breakeven === null ? '—'
                          : <span className={r.breakeven <= 30 ? 'be-fast' : ''}>{Math.ceil(r.breakeven)} days</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <p className="note">This is the most defensible piece: providers building routers won't tell you to stop paying them. The break-even falls out of your own telemetry.</p>
      </div>
    </section>
  );
}
