import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  note?: string;
  children: ReactNode;
}

// Two-column interactive panel: a full-width title bar, then the
// caller supplies a .col-l (controls) and .col-r (results).
export function Panel({ title, note, children }: PanelProps) {
  return (
    <div className="two-col panel">
      <div className="panel__bar">
        <span className="panel__title">{title}</span>
        {note && <span className="panel__note">{note}</span>}
      </div>
      {children}
    </div>
  );
}
