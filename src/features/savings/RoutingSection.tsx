// 08 · Model selection / routing with hosted-vs-routed awareness.
import { Reveal } from '../../components/Reveal';
import { DEPLOY_COLOR, DEPLOY_LABEL } from '../../lib/savings/palette';
import { useSavings } from './SavingsContext';
import { WidePanel } from './WidePanel';

export function RoutingSection() {
  const { report } = useSavings();
  const policy = report.routingPolicy;

  return (
    <section className="section" id="routing">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">08</span>Routing · hosted vs routed</p>
          <h2 className="h-sec">Turn the validated wins into a <em>routing policy</em>.</h2>
          <p className="lead">Every slice that cleared the gate becomes a rule. The cost function knows the difference between a <b>routed</b> provider API — linear $/token, so minimise tokens — and a <b>self-hosted or local</b> model, a fixed cost you want to <b>fill</b> up to capacity. The output is a LiteLLM config; we render the policy, we don't rebuild the gateway.</p>
        </Reveal>

        <Reveal>
          <WidePanel title="The routing policy this produces">
            {policy.rules.length === 0 ? (
              <div className="verdict" style={{ margin: 0 }}>
                <p className="verdict__tag">Awaiting validation</p>
                <p className="verdict__txt">No rules yet — candidates haven't cleared the quality gate. This is the live phase-1 default: the policy stays empty until replay verdicts pass, so nothing routes on an unproven claim.</p>
              </div>
            ) : (
              <table className="rt">
                <thead><tr><th>Agent</th><th>Slice</th><th>Routes to</th><th>Real model</th><th>Deployment</th></tr></thead>
                <tbody>
                  {policy.rules.map((r) => {
                    const real = policy.model_list.find((m) => m.model_name === r.target_model)?.litellm_params.model ?? r.target_model;
                    return (
                      <tr key={`${r.agent}-${r.bucket}`}>
                        <td>{r.agent}</td>
                        <td>{r.bucket}</td>
                        <td className="model">{r.target_model}</td>
                        <td className="model">{real}</td>
                        <td>
                          <span className="dep-pill" style={{ '--dep': DEPLOY_COLOR[r.deployment_mode] } as React.CSSProperties}>
                            {DEPLOY_LABEL[r.deployment_mode]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <p className="codeblock__lab">litellm config · drop-in</p>
            <pre className="codeblock"><code>{JSON.stringify(policy, null, 2)}</code></pre>
          </WidePanel>
        </Reveal>

        <p className="note">Local rungs price at ~electricity and have a capacity ceiling; routed rungs scale linearly but meter every token. The policy assigns each slice accordingly.</p>
      </div>
    </section>
  );
}
