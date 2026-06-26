// ============================================================
// Animate a number toward a target; respects reduced motion.
// ============================================================
import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 420): number {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * e);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return val;
}
