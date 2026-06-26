import { Reveal } from './Reveal';

const layers = [
  { id: 'compute', n: '01', nm: 'Compute & model', sub: 'price per token' },
  { id: 'gpu', n: '02', nm: 'GPU', sub: 'the supply side' },
  { id: 'storage', n: '03', nm: 'Storage', sub: 'weights · data · RAG' },
  { id: 'network', n: '04', nm: 'Network', sub: 'ingress & egress' },
];

export function Hero() {
  return (
    <section className="hero">
      <Reveal className="wrap">
        <p className="eyebrow">Total cost of inference</p>
        <h1>The price of serving a model, <em>top to bottom</em>.</h1>
        <p className="lead">The number most teams watch is the <b>per-token</b> price. But that's only the top of the stack. Underneath sit the <b>GPUs</b> that produce it, the <b>storage</b> for weights and retrieval, and the <b>network</b> moving bytes in and out. Walk down each layer — every panel is live, and they sum to a full cost to serve at the bottom.</p>
        <ol className="layer-index">
          {layers.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`}><b>{l.n}</b><div className="nm">{l.nm}</div><small>{l.sub}</small></a>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
