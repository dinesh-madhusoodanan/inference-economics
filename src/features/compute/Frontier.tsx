import { MODELS } from '../../lib/config';
import type { ModelId } from '../../lib/types';

// Price (log) vs capability scatter, highlighting current + recommended.
export function Frontier({ currentId, defaultId }: { currentId: ModelId; defaultId: ModelId }) {
  const W = 520, H = 200, padL = 26, padR = 22, padT = 20, padB = 30;
  const xs = MODELS.map((_, i) => padL + i * ((W - padL - padR) / (MODELS.length - 1)));
  const pMin = Math.log(0.04), pMax = Math.log(2.0);
  const y = (price: number) => padT + (1 - (Math.log(price) - pMin) / (pMax - pMin)) * (H - padT - padB);
  const pts = MODELS.map((m, i) => `${xs[i].toFixed(1)},${y(m.price).toFixed(1)}`).join(' ');

  return (
    <figure className="frontier" style={{ margin: '6px 0 0' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Price versus capability per model">
        <polyline points={pts} style={{ fill: 'none', stroke: 'var(--rule-2)', strokeWidth: 1.5 }} />
        {MODELS.map((m, i) => {
          const cx = xs[i], cy = y(m.price);
          const isCur = m.id === currentId, isDef = m.id === defaultId;
          return (
            <g key={m.id}>
              {isCur && <circle cx={cx} cy={cy} r={11} style={{ fill: 'none', stroke: 'var(--neg)', strokeWidth: 2 }} />}
              <circle cx={cx} cy={cy} r={5.5} style={{ fill: isDef ? 'var(--accent)' : 'var(--surface)', stroke: isDef ? 'var(--accent)' : 'var(--muted)', strokeWidth: 2 }} />
              <text x={cx} y={H - 12} textAnchor="middle" fontSize={9} style={{ fontFamily: 'var(--mono)', fill: 'var(--faint)' }}>{m.name.split('·')[0].trim()}</text>
              <text x={cx} y={cy - 15} textAnchor="middle" fontSize={9} style={{ fontFamily: 'var(--mono)', fill: isDef ? 'var(--accent)' : 'var(--faint)' }}>${m.price.toFixed(2)}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>Price (log) vs capability · ◯ current · ● recommended default</figcaption>
    </figure>
  );
}
