import { useCost } from '../../lib/CostContext';
import { PAYLOADS } from '../../lib/config';
import type { PayloadId } from '../../lib/types';
import { fmtGB, fmtInt, fmtMoney } from '../../lib/format';
import { Slider } from '../../components/Slider';
import { SegGroup } from '../../components/SegGroup';
import { Panel } from '../../components/Panel';
import { Cards } from '../../components/Cards';
import { Reveal } from '../../components/Reveal';
import { computeEgress } from './networkModel';
import { computeStack } from '../../lib/stack';

export function NetworkSection() {
  const { state, patch } = useCost();
  const eg = computeEgress(state);
  const stack = computeStack(state);
  const sharePct = stack.total > 0 ? Math.round((stack.net / stack.total) * 100) : 0;

  return (
    <section className="section" id="network">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">04</span>Network · ingress &amp; egress</p>
          <h2 className="h-sec">Data in is free. Data <em>out</em> is the tax at the bottom of the bill.</h2>
          <p className="lead">Clouds wave data in (<b>ingress</b>) through the door for free, then meter every byte that leaves (<b>egress</b>). For text token streaming this is usually tiny — but flip the workload to images, audio, or video and egress can overtake everything above it. Cross-region replication is its own line.</p>
        </Reveal>

        <Reveal>
          <Cards items={[
            { k: 'Egress (data out)', v: <>$0.09<span className="u">/GB</span></>, delta: '▲ the metered direction', deltaKind: 'neg' },
            { k: 'Ingress (data in)', v: <>$0.00<span className="u">/GB</span></>, delta: '▼ typically free', deltaKind: 'pos' },
            { k: 'Cross-region', v: <>$0.02<span className="u">/GB</span></>, delta: '▪ replication & sync', deltaKind: 'mut' },
            { k: 'Egress share of bill', v: `${sharePct}%`, delta: sharePct >= 25 ? '▲ media-heavy workload' : '▪ light for text', deltaKind: 'mut' },
          ]} />
        </Reveal>

        <Reveal>
          <Panel title="Egress estimator" note="// illustrative payloads & rates">
            <div className="col-l">
              <div className="ro-line"><span className="l">Monthly responses</span><span className="v">{fmtInt(state.volume)}</span></div>
              <div className="field">
                <div className="field__top" style={{ marginBottom: 11 }}>
                  <span className="field__lab">Response payload <small>avg size out</small></span>
                </div>
                <SegGroup
                  items={PAYLOADS.map((p) => ({ id: p.id, label: p.name }))}
                  value={state.egress.payload}
                  onChange={(id) => patch({ egress: { ...state.egress, payload: id as PayloadId } })}
                />
              </div>
              <Slider label="Cross-region transfer" sub="GB / mo" valueLabel={`${fmtInt(state.egress.xregionGB)} GB`} min={0} max={5000} step={50}
                value={state.egress.xregionGB} onChange={(v) => patch({ egress: { ...state.egress, xregionGB: v } })} />
              <p className="note">Response count tracks your monthly prompts from layer 01 — change it there and this moves with it.</p>
            </div>
            <div className="col-r">
              <div className="readout">
                <p className="readout__k">Monthly egress</p>
                <p className="readout__v tnum">{fmtMoney(eg.cost)}</p>
              </div>
              <div className="mini-grid">
                <div className="mini"><p className="mini__k">Streaming out</p><p className="mini__v tnum">{fmtGB(eg.streamGB)}</p></div>
                <div className="mini"><p className="mini__k">Cross-region</p><p className="mini__v tnum">{fmtGB(eg.xregionGB)}</p></div>
                <div className="mini"><p className="mini__k">Ingress</p><p className="mini__v">free</p></div>
              </div>
              <p className="note" style={{ marginTop: 18 }}>Try switching the payload to Image or Video — text is bytes, media is megabytes, and egress scales with it.</p>
            </div>
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}
