export interface SegItem { id: string; label: string; }

interface SegGroupProps {
  items: SegItem[];
  value: string;
  onChange: (id: string) => void;
}

export function SegGroup({ items, value, onChange }: SegGroupProps) {
  return (
    <div className="seg-group">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className="seg-btn"
          aria-pressed={it.id === value}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
