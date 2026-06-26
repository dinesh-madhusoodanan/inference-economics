import type { CSSProperties } from 'react';

// CSS custom properties aren't in React.CSSProperties by default.
type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

interface SliderProps {
  label: string;
  sub?: string;
  valueLabel: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

export function Slider({ label, sub, valueLabel, min, max, step = 1, value, onChange }: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100;
  const style: CSSVars = { '--fill': `${fill}%` };
  return (
    <div className="field">
      <div className="field__top">
        <span className="field__lab">{label}{sub && <small>{sub}</small>}</span>
        <span className="field__val">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={style}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
