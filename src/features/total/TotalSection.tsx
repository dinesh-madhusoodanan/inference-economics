import { useCost } from '../../lib/CostContext';
import { fmtMoney } from '../../lib/format';
import { StackBar } from '../../components/StackBar';
import { Reveal } from '../../components/Reveal';
import { useCountUp } from '../../lib/useCountUp';
import { computeStack } from '../../lib/stack';

export function TotalSection() {
  const { state } = useCost();
  const stack = computeStack(state);
  const animated = useCountUp(stack.total);

  return (
    <section className="section" id="total" style={{ borderTop: 'none' }}>
      <div className="wrap">
        <Reveal>
          <p className="eyebrow">The whole stack</p>
          <h2 className="h-sec">Top to bottom, one number.</h2>
          <p className="lead">Compute (right-sized), storage, and network, summed for the traffic you described above. Move any slider and watch the layer mix shift.</p>
        </Reveal>
        <Reveal>
          <div className="total-band">
            <p className="eyebrow">Monthly cost to serve</p>
            <StackBar segs={[
              { label: 'Compute', value: stack.compute, color: 'var(--c-compute)' },
              { label: 'Storage', value: stack.storage, color: 'var(--c-storage)' },
              { label: 'Network', value: stack.net, color: 'var(--c-net)' },
            ]} />
            <div className="tb-grand">
              <span className="lbl">Total to serve <b>your traffic</b>, per month</span>
              <span className="amt tnum">{fmtMoney(animated)}</span>
            </div>
            <p className="tb-note">GPU costs (layer 02) aren't added on top — they're the supply-side decomposition of the compute line. Self-hosting swaps the compute number for your GPU fleet cost; everything else stays.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
