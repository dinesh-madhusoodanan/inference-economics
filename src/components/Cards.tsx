import type { ReactNode } from 'react';

export interface CardItem {
  k: string;
  v: ReactNode;
  delta?: ReactNode;
  deltaKind?: 'pos' | 'neg' | 'mut';
}

export function Cards({ items }: { items: CardItem[] }) {
  return (
    <div className="cards">
      {items.map((c, i) => (
        <div className="card" key={i}>
          <p className="card__k">{c.k}</p>
          <p className="card__v">{c.v}</p>
          {c.delta && <span className={`delta delta--${c.deltaKind ?? 'mut'}`}>{c.delta}</span>}
        </div>
      ))}
    </div>
  );
}
