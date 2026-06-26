// 05 · Per-agent expense by query size → attribution + a real sizing signal.
import { Reveal } from '../../components/Reveal';
import { SegGroup } from '../../components/SegGroup';
import { fmtInt, fmtMoney } from '../../lib/format';
import { BUCKET_COLOR, BUCKET_LABEL } from '../../lib/savings/palette';
import type { BucketId } from '../../lib/types';
import { useSavings } from './SavingsContext';
import { WidePanel } from './WidePanel';

const WINDOWS = [{ id: '7', label: '7d' }, { id: '30', label: '30d' }, { id: '90', label: '90d' }];
const ORDER: BucketId[] = ['simple', 'moderate', 'complex'];

export function AttributionSection() {
  const { report, days, setDays } = useSavings();
  const total = report.totals.actualCostUSD || 1;

  return (
    <section className="section" id="attribution">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">05</span>Attribution · spend per agent × size</p>
          <h2 className="h-sec">Not all spend is equal — <em>which agent</em> burns it, on <em>what</em>?</h2>
          <p className="lead">Cost reports group by model. That hides the real lever. Here every generation is attributed to the <b>agent</b> that made it and bucketed by <b>difficulty</b> — not token length — so you can see that one summariser running simple prompts on a frontier model is most of the bill.</p>
        </Reveal>

        <Reveal>
          <WidePanel title="Spend by agent × difficulty">
            <div className="panel-controls">
              <div className="mini-grid">
                <div className="mini"><p className="mini__k">Agents</p><p className="mini__v">{report.byAgent.length}</p></div>
                <div className="mini"><p className="mini__k">Calls / {days}d</p><p className="mini__v">{fmtInt(report.totals.observations)}</p></div>
                <div className="mini"><p className="mini__k">Spend / {days}d</p><p className="mini__v">{fmtMoney(report.totals.actualCostUSD)}</p></div>
              </div>
              <SegGroup items={WINDOWS} value={String(days)} onChange={(id) => setDays(Number(id))} />
            </div>

            <div className="agent-list">
              {report.byAgent.map((a) => {
                const segs = ORDER
                  .map((b) => ({ b, cost: a.byBucket.find((x) => x.bucket === b)?.actualCostUSD ?? 0 }))
                  .filter((s) => s.cost > 0);
                const aTotal = a.actualCostUSD || 1;
                return (
                  <div className="agent-row" key={a.agent}>
                    <div className="agent-row__id">
                      <span className="agent-row__name">{a.agent}</span>
                      <span className="agent-row__sub">{fmtInt(a.volume)} calls</span>
                    </div>
                    <div className="agent-row__bar">
                      <div className="stackbar">
                        {segs.map((s) => (
                          <div className="seg" key={s.b} style={{ width: `${(s.cost / aTotal) * 100}%`, background: BUCKET_COLOR[s.b] }} title={`${BUCKET_LABEL[s.b]} · ${fmtMoney(s.cost)}`} />
                        ))}
                      </div>
                    </div>
                    <div className="agent-row__amt">
                      <span className="tnum">{fmtMoney(a.actualCostUSD)}</span>
                      <small>{Math.round((a.actualCostUSD / total) * 100)}% of spend</small>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="legend" style={{ marginTop: 18 }}>
              {ORDER.map((b) => (
                <span key={b}><i className="swatch" style={{ background: BUCKET_COLOR[b] }} /> {BUCKET_LABEL[b]}</span>
              ))}
            </div>
          </WidePanel>
        </Reveal>

        <p className="note">Difficulty here is a heuristic seed (reasoning tokens, output length); phase 2 replaces it with a classifier trained on which prompts a cheaper model actually handled.</p>
      </div>
    </section>
  );
}
