// 06 · Counterfactual savings → a cross-provider pricing database is the moat.
import { Reveal } from '../../components/Reveal';
import { fmtMoney } from '../../lib/format';
import { useSavings } from './SavingsContext';
import { WidePanel } from './WidePanel';

export function CounterfactualSection() {
  const { report } = useSavings();
  const t = report.totals;
  const rows = report.byAgent.flatMap((a) =>
    a.byBucket.map((b) => ({ agent: a.agent, ...b })),
  ).sort((x, y) => y.savingsUSD - x.savingsUSD);

  return (
    <section className="section" id="counterfactual">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">06</span>Counterfactual · what you could save</p>
          <h2 className="h-sec">The same work, priced against <em>every other model</em>.</h2>
          <p className="lead">Computing what a slice <b>would</b> have cost on a cheaper or open-weights model is just arithmetic — if you have the prices. Model providers only know their own. The moat is a <b>cross-provider price book</b> (the LiteLLM map + OpenRouter, refreshed continuously) so each call can be re-priced against the cheapest model that still clears its difficulty bar.</p>
        </Reveal>

        <Reveal>
          <WidePanel title="What the same work would cost elsewhere">
            <div className="res-grid" style={{ marginBottom: 22 }}>
              <div className="res"><p className="res__k">Actual / {report.spanDays}d</p><p className="res__v tnum">{fmtMoney(t.actualCostUSD)}</p></div>
              <div className="res"><p className="res__k">Right-sized / {report.spanDays}d</p><p className="res__v tnum">{fmtMoney(t.actualCostUSD - t.potentialSavingsUSD)}</p></div>
              <div className="res res--save"><p className="res__k">Recoverable</p><p className="res__v tnum">{fmtMoney(t.potentialSavingsUSD)} · {Math.round(t.savingsPct * 100)}%</p></div>
            </div>

            <table className="rt">
              <thead><tr><th>Agent</th><th>Slice</th><th>Re-priced to</th><th className="r">Now</th><th className="r">Could be</th><th className="r">Saved</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.agent}-${r.bucket}`}>
                    <td>{r.agent}</td>
                    <td>{r.bucket}</td>
                    <td className="model">
                      {r.quality.candidateModel}
                      <span className={`q-chip ${r.quality.passed ? 'q-chip--ok' : 'q-chip--wait'}`}>{r.quality.passed ? 'validated' : 'pending'}</span>
                    </td>
                    <td className="r tnum">{fmtMoney(r.actualCostUSD)}</td>
                    <td className="r tnum">{fmtMoney(r.candidateCostUSD)}</td>
                    <td className="r tnum">{r.savingsUSD > 0.5 ? fmtMoney(r.savingsUSD) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </WidePanel>
        </Reveal>

        <p className="note">Savings shown are cost-only until each candidate clears the quality gate (next section). A cheaper price you can't safely take isn't a saving.</p>
      </div>
    </section>
  );
}
