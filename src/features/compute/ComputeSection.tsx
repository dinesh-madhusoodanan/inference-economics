import type { ReactNode } from 'react';
import { useCost } from '../../lib/CostContext';
import { MODELS } from '../../lib/config';
import type { ModelId, BucketId } from '../../lib/types';
import { fmtInt, fmtMoney, sliderToVolume, volumeToSlider } from '../../lib/format';
import { Slider } from '../../components/Slider';
import { SegGroup } from '../../components/SegGroup';
import { Panel } from '../../components/Panel';
import { Reveal } from '../../components/Reveal';
import { Frontier } from './Frontier';
import { computeInference } from './computeModel';
import type { ComputeResult } from './computeModel';

function verdict(r: ComputeResult): { tag: string; isOver: boolean; body: ReactNode } {
  const curName = r.cur.name;
  const pct = Math.round(r.savingsPct * 100);
  const cheaperPct = Math.round(r.cheaperShare * 100);
  if (r.savings < -0.5) {
    return { tag: 'Quality risk', isOver: true, body: (
      <>Careful — <b>{curName}</b> sits below the tier your complex slice needs. Matching quality there means routing those prompts to a stronger model, which would <b>raise</b> the bill to about <b>{fmtMoney(r.rightMonthly)}</b>/mo. Here the cheap default is costing accuracy, not dollars.</>
    ) };
  }
  if (r.cheaperShare >= 0.5 && r.savings > 0.5) {
    return { tag: 'Cut your bill', isOver: false, body: (
      <>Yes — most of your traffic (<b>~{cheaperPct}%</b>) doesn't need <b>{curName}</b>. Route the simple and moderate prompts to cheaper models (mostly <b>{r.leadModel.name}</b>) and keep {curName} for the rest: blended cost falls from <b>{fmtMoney(r.currentMonthly)}</b> to <b>{fmtMoney(r.rightMonthly)}</b> a month — <b>{pct}% less</b>.</>
    ) };
  }
  if (r.savings > 0.5) {
    return { tag: 'Room to trim', isOver: false, body: (
      <>About <b>{cheaperPct}%</b> of prompts can move to cheaper models, taking you from <b>{fmtMoney(r.currentMonthly)}</b> to <b>{fmtMoney(r.rightMonthly)}</b> a month — a <b>{pct}%</b> saving — without touching the hard prompts.</>
    ) };
  }
  return { tag: 'Well matched', isOver: false, body: (
    <>Your current choice already sits near the efficient frontier for this mix. A cheaper default would start dropping quality on the prompts you actually have.</>
  ) };
}

export function ComputeSection() {
  const { state, set, patch } = useCost();
  const r = computeInference(state);
  const v = verdict(r);
  const msum = state.mix.simple + state.mix.moderate + state.mix.complex || 1;

  const setMix = (id: BucketId, value: number) =>
    patch({ mix: { ...state.mix, [id]: value } });

  const mixRow = (id: BucketId, label: string, sub: string) => (
    <div className="mix-row">
      <span className="mix-row__lab">{label}<small>{sub}</small></span>
      <input type="range" min={0} max={100} step={1} value={state.mix[id]}
        onChange={(e) => setMix(id, Number(e.target.value))} />
      <span className="mix-row__pct">{Math.round((state.mix[id] / msum) * 100)}%</span>
    </div>
  );

  return (
    <section className="section" id="compute">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">01</span>Compute &amp; model · price per token</p>
          <h2 className="h-sec">Most teams overpay by running <em>every prompt</em> on one frontier model.</h2>
          <p className="lead">This is the top-line bill: what you pay per token for the model to think. Describe your traffic, and this routes each slice of prompts to the cheapest model that can still handle it — then shows what you'd save versus running everything on your current choice.</p>
        </Reveal>

        <Reveal>
          <Panel title="Model right-sizing" note="// blended $/Mtok — illustrative ladder">
            <div className="col-l">
              <Slider label="Monthly prompts" valueLabel={fmtInt(state.volume)} min={0} max={100} step={1}
                value={volumeToSlider(state.volume)} onChange={(t) => set('volume', sliderToVolume(t))} />
              <Slider label="Avg tokens / prompt" sub="in + out" valueLabel={fmtInt(state.tokens)} min={200} max={8000} step={100}
                value={state.tokens} onChange={(val) => set('tokens', val)} />
              <div className="field">
                <div className="field__top" style={{ marginBottom: 12 }}>
                  <span className="field__lab">Prompt mix <small>relative share</small></span>
                </div>
                {mixRow('simple', 'Simple', 'classify · extract · short Q&A')}
                {mixRow('moderate', 'Moderate', 'summaries · drafting · chat')}
                {mixRow('complex', 'Complex', 'reasoning · hard code · analysis')}
              </div>
              <div className="field">
                <div className="field__top" style={{ marginBottom: 11 }}>
                  <span className="field__lab">Current model <small>used for everything today</small></span>
                </div>
                <SegGroup
                  items={MODELS.map((m) => ({ id: m.id, label: `${m.name} · $${m.price.toFixed(2)}` }))}
                  value={state.current}
                  onChange={(id) => set('current', id as ModelId)}
                />
              </div>
            </div>

            <div className="col-r" style={{ background: 'linear-gradient(180deg, color-mix(in srgb,var(--accent) 4%,var(--surface)), var(--surface))' }}>
              <div className={`verdict ${v.isOver ? 'is-over' : ''}`} aria-live="polite">
                <p className="verdict__tag">{v.tag}</p>
                <p className="verdict__txt">{v.body}</p>
              </div>
              <div className="res-grid">
                <div className="res"><p className="res__k">Current / mo</p><p className="res__v tnum">{fmtMoney(r.currentMonthly)}</p></div>
                <div className="res"><p className="res__k">Right-sized / mo</p><p className="res__v tnum">{fmtMoney(r.rightMonthly)}</p></div>
                <div className="res res--save"><p className="res__k">You'd save</p><p className="res__v tnum">{r.savings > 0.5 ? `${fmtMoney(r.savings)} · ${Math.round(r.savingsPct * 100)}%` : 'already lean'}</p></div>
              </div>
              <table className="rt">
                <thead><tr><th>Slice</th><th>Routed to</th><th className="r">Share</th><th className="r">Cost / mo</th></tr></thead>
                <tbody>
                  {r.rows.map((row) => (
                    <tr key={row.bucket.id}>
                      <td>{row.bucket.label}</td>
                      <td className="model">{row.model.name}{row.model.id === r.defaultModel.id && <span className="pill pill--def">default</span>}</td>
                      <td className="r tnum">{Math.round(row.share * 100)}%</td>
                      <td className="r tnum">{fmtMoney(row.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Frontier currentId={state.current} defaultId={r.defaultModel.id} />
            </div>
          </Panel>
        </Reveal>

        <p className="note">This per-token figure is your compute bill if you buy API tokens. If you self-host, the same number is produced by GPU economics — that's layer 02.</p>
      </div>
    </section>
  );
}
