import type { ReactNode } from 'react';
import { SourceBadge } from './SourceBadge';

// Full-width panel chrome for the data-heavy savings views
// (the cost-stack sections use the two-column Panel instead).
export function WidePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel">
      <div className="panel__bar">
        <span className="panel__title">{title}</span>
        <SourceBadge />
      </div>
      <div className="panel__body">{children}</div>
    </div>
  );
}
