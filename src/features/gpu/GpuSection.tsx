import { useCost } from '../../lib/CostContext';
import type { GpuId } from '../../lib/types';
import { fmtInt, fmtMoney } from '../../lib/format';
import {
  CLOUD_PROVIDERS,
  gpusForProvider,
  gpuEntry,
  providerMeta,
  reconcileGpu,
  GPU_PRICES_AS_OF,
} from '../../lib/cloud/providers';
import { Slider } from '../../components/Slider';
import { SegGroup } from '../../components/SegGroup';
import { Panel } from '../../components/Panel';
import { Reveal } from '../../components/Reveal';
import { computeGpu } from './gpuModel';

export function GpuSection() {
  const { state, patch } = useCost();
  const g = computeGpu(state);
  const gpu = state.gpu;

  const provider = gpu.provider;
  const meta = providerMeta(provider);
  const available = gpusForProvider(provider);
  const entry = gpuEntry(provider, gpu.type);
  const anyApprox = available.some((x) => gpuEntry(provider, x.id)?.approx);

  return (
    <section className="section" id="gpu">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">02</span>GPU · the supply side</p>
          <h2 className="h-sec">Every per-token price is just a <em>GPU-hour</em> divided by throughput.</h2>
          <p className="lead">Behind the token price is a rented accelerator billed by the hour — and that hourly rate depends on <b>which cloud you rent it from</b>. Pick a provider below and the math reprices against its real list rate. What turns $/hour into $/token is <b>throughput</b> (tokens per second) and <b>utilization</b>: an idle GPU still bills full price.</p>
        </Reveal>

        <Reveal>
          <Panel title="GPU → token cost" note="// per-GPU $/hr · cloud list prices">
            <div className="col-l">
              <div className="field">
                <div className="field__top" style={{ marginBottom: 11 }}>
                  <span className="field__lab">Cloud provider <small>where you rent</small></span>
                </div>
                <SegGroup
                  items={CLOUD_PROVIDERS.map((p) => ({ id: p.id, label: p.name }))}
                  value={provider}
                  onChange={(id) =>
                    patch({ gpu: { ...gpu, provider: id as typeof provider, type: reconcileGpu(id as typeof provider, gpu.type) } })
                  }
                />
                <p className="note" style={{ marginTop: 8 }}>
                  {meta.name} · {meta.region} · {meta.pricingModel} · as of {GPU_PRICES_AS_OF}
                </p>
              </div>

              <div className="field">
                <div className="field__top" style={{ marginBottom: 11 }}>
                  <span className="field__lab">Accelerator <small>per-GPU $/hr</small></span>
                </div>
                <SegGroup
                  items={available.map((x) => ({
                    id: x.id,
                    label: `${x.name} · $${x.price.toFixed(2)}${gpuEntry(provider, x.id)?.approx ? '~' : ''}`,
                  }))}
                  value={gpu.type}
                  onChange={(id) => patch({ gpu: { ...gpu, type: id as GpuId } })}
                />
                {entry && (
                  <p className="note" style={{ marginTop: 8 }}>
                    {entry.instance} · {entry.gpuCount}× GPU{entry.approx ? ' · approx.' : ''}
                  </p>
                )}
              </div>

              <Slider label="Throughput" sub="tokens / sec, your model" valueLabel={`${fmtInt(gpu.tput)} tok/s`} min={200} max={20000} step={100}
                value={gpu.tput} onChange={(v) => patch({ gpu: { ...gpu, tput: v } })} />
              <Slider label="Utilization" sub="share of time serving" valueLabel={`${gpu.util}%`} min={5} max={95} step={1}
                value={gpu.util} onChange={(v) => patch({ gpu: { ...gpu, util: v } })} />
              <Slider label="Fleet size" sub="GPUs, always-on" valueLabel={`×${gpu.fleet}`} min={1} max={64} step={1}
                value={gpu.fleet} onChange={(v) => patch({ gpu: { ...gpu, fleet: v } })} />
            </div>
            <div className="col-r">
              <div className="readout">
                <p className="readout__k">Effective cost per token · {meta.name}</p>
                <p className="readout__v tnum">{fmtMoney(g.perMtok)}<span className="u">/Mtok</span></p>
              </div>
              <div className="formula">$/Mtok = <b>GPU $/hr</b> ÷ ( <b>tok/s</b> × 3600 × <b>utilization</b> ) × 10⁶</div>
              <div className="mini-grid">
                <div className="mini"><p className="mini__k">Fleet / mo</p><p className="mini__v tnum">{fmtMoney(g.fleetCost)}</p></div>
                <div className="mini"><p className="mini__k">Capacity</p><p className="mini__v tnum">{fmtInt(g.monthlyTokens / 1e6)} Mtok</p></div>
                <div className="mini"><p className="mini__k">Break-even util*</p><p className="mini__v tnum">{g.breakeven > 1 ? '>100%' : `${Math.round(g.breakeven * 100)}%`}</p></div>
              </div>
              <p className="note" style={{ marginTop: 18 }}>*Utilization needed to undercut a $0.30/Mtok API price at this throughput. Below it, renting tokens is cheaper than self-hosting.{anyApprox ? ' · ~ provider list not fully public; treat as estimate.' : ''}</p>
            </div>
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}
