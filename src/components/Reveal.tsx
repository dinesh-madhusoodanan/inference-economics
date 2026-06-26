import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

// Fade/slide a block in once it scrolls into view.
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { setShown(true); io.unobserve(en.target); }
      }),
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} className={`reveal ${shown ? 'in' : ''} ${className}`.trim()}>{children}</div>;
}
