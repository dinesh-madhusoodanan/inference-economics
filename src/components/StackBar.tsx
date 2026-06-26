import { fmtMoney } from '../lib/format';

export interface StackSeg { label: string; value: number; color: string; }

export function StackBar({ segs }: { segs: StackSeg[] }) {
  const total = segs.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <>
      <div className="stackbar">
        {segs.map((s) => (
          <div className="seg" key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="legend">
        {segs.map((s) => (
          <span key={s.label}>
            <i className="swatch" style={{ background: s.color }} /> {s.label}{' '}
            <b className="mono" style={{ marginLeft: 4 }}>{fmtMoney(s.value)}</b>
          </span>
        ))}
      </div>
    </>
  );
}
