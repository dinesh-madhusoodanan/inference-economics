import { Reveal } from '../../components/Reveal';
import { fmtMoney } from '../../lib/format';
import { useSavings } from './SavingsContext';

const acts = [
  { id: 'attribution', n: '05', nm: 'Attribution', sub: 'spend per agent × size' },
  { id: 'counterfactual', n: '06', nm: 'Counterfactual', sub: 'what you could save' },
  { id: 'performance', n: '07', nm: 'Performance', sub: 'savings vs quality' },
  { id: 'routing', n: '08', nm: 'Routing', sub: 'hosted vs routed' },
  { id: 'offload', n: '09', nm: 'Local offload', sub: 'move it to the box' },
];

export function SavingsIntro() {
  const { report } = useSavings();
  const pct = Math.round(report.totals.savingsPct * 100);
  return (
    <section className="section savings-intro" id="savings">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">02</span>From cost to savings</p>
          <h2 className="h-sec">You've seen the bill. Now <em>cut it</em> — without dropping quality.</h2>
          <p className="lead">The stack above tells you what inference <b>costs</b>. This half reads your live Langfuse telemetry and finds where it's <b>overspent</b>: which agents run heavy prompts on frontier models, what a cheaper or open-weights model would have cost at the same quality, and which traffic could leave the provider entirely. On the sample below that's <b>{fmtMoney(report.totals.potentialSavingsUSD)}/mo — {pct}% — </b>recoverable.</p>
          <ol className="layer-index">
            {acts.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`}><b>{a.n}</b><div className="nm">{a.nm}</div><small>{a.sub}</small></a>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
