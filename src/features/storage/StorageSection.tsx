import { useCost } from '../../lib/CostContext';
import { fmtInt, fmtMoney } from '../../lib/format';
import { Slider } from '../../components/Slider';
import { Panel } from '../../components/Panel';
import { Cards } from '../../components/Cards';
import { Reveal } from '../../components/Reveal';
import { computeStorage } from './storageModel';

export function StorageSection() {
  const { state, set } = useCost();
  const st = computeStorage(state);
  const tot = st.total || 1;

  return (
    <section className="section" id="storage">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow"><span className="ix">03</span>Storage · weights, data &amp; retrieval</p>
          <h2 className="h-sec">Compute gets the headline. <em>Storage</em> gets the recurring bill.</h2>
          <p className="lead">The weights themselves are cheap to keep at rest. What bends the curve is the <b>retrieval index</b> behind RAG and the <b>logs</b> that grow with every request. Here's where those dollars sit, and a live estimate for your footprint.</p>
        </Reveal>

        <Reveal>
          <Cards items={[
            { k: 'Model weights at rest', v: <>$0.021<span className="u">/GB·mo</span></>, delta: '▪ object storage, ×replicas', deltaKind: 'mut' },
            { k: 'Vector store / RAG', v: <>$0.28<span className="u">/GB·mo</span></>, delta: '▲ 13× the at-rest rate', deltaKind: 'neg' },
            { k: 'Logs & traces', v: <>$0.021<span className="u">/GB·mo</span></>, delta: '▲ scales with volume', deltaKind: 'neg' },
            { k: 'Storage share of TCO', v: <>1–8<span className="u">%</span></>, delta: '▪ higher for RAG', deltaKind: 'mut' },
          ]} />
        </Reveal>

        <Reveal>
          <div className="split">
            <div className="split__col">
              <p className="split__tag">Model storage</p>
              <h3 className="split__h">Storing the brain</h3>
              <p className="split__p">Weights are cheap, but you pay for every copy — one per region, plus warm-load caches and rollback versions.</p>
              <ul className="ll">
                <li><span className="term">Weights at rest <small>70B · fp16 ≈ 140 GB</small></span><span className="num">~$2.94 / mo</span></li>
                <li><span className="term">Replication <small>×3 regions</small></span><span className="num">~$8.82 / mo</span></li>
                <li><span className="term">Version cache <small>previous checkpoints</small></span><span className="num">~$4–10 / mo</span></li>
                <li><span className="term">KV cache <small>ephemeral · billed as compute</small></span><span className="num">in GPU mem</span></li>
              </ul>
            </div>
            <div className="split__col">
              <p className="split__tag">Data storage</p>
              <h3 className="split__h">Storing the context</h3>
              <p className="split__p">This is where storage actually bites — retrieval indexes and logs are persistent, queried constantly, and grow with usage.</p>
              <ul className="ll">
                <li><span className="term">Customer data at rest <small>blobs, documents</small></span><span className="num">$0.021 / GB·mo</span></li>
                <li><span className="term">Vector index <small>embeddings for RAG</small></span><span className="num">$0.28 / GB·mo</span></li>
                <li><span className="term">Request / response logs <small>audit, eval, tuning</small></span><span className="num">$0.021 / GB·mo</span></li>
                <li><span className="term">Hot cache <small>dedup &amp; prompt cache</small></span><span className="num">$0.10 / GB·mo</span></li>
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <Panel title="Storage estimator" note="// illustrative rates">
            <div className="col-l">
              <Slider label="Model weights" sub="GB, all served" valueLabel={`${state.weights} GB`} min={10} max={700} step={5} value={state.weights} onChange={(v) => set('weights', v)} />
              <Slider label="Replicas / regions" valueLabel={`×${state.replicas}`} min={1} max={6} step={1} value={state.replicas} onChange={(v) => set('replicas', v)} />
              <Slider label="Data & logs at rest" sub="GB" valueLabel={`${fmtInt(state.data)} GB`} min={0} max={5000} step={50} value={state.data} onChange={(v) => set('data', v)} />
              <Slider label="Vector store" sub="GB, RAG index" valueLabel={`${fmtInt(state.vector)} GB`} min={0} max={1000} step={10} value={state.vector} onChange={(v) => set('vector', v)} />
            </div>
            <div className="col-r">
              <div className="stackbar">
                <div className="seg" style={{ width: `${(st.model / tot) * 100}%`, background: 'var(--c-storage)' }} />
                <div className="seg" style={{ width: `${(st.data / tot) * 100}%`, background: '#A9C3BC' }} />
                <div className="seg" style={{ width: `${(st.vector / tot) * 100}%`, background: '#C8A24B' }} />
              </div>
              <div className="legend">
                <span><i className="swatch" style={{ background: 'var(--c-storage)' }} /> Model <b className="mono" style={{ marginLeft: 4 }}>{fmtMoney(st.model)}</b></span>
                <span><i className="swatch" style={{ background: '#A9C3BC' }} /> Data &amp; logs <b className="mono" style={{ marginLeft: 4 }}>{fmtMoney(st.data)}</b></span>
                <span><i className="swatch" style={{ background: '#C8A24B' }} /> Vectors <b className="mono" style={{ marginLeft: 4 }}>{fmtMoney(st.vector)}</b></span>
              </div>
              <div className="est-total"><span className="lbl">Monthly storage</span><span className="amt tnum">{fmtMoney(st.total)} /mo</span></div>
            </div>
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}
