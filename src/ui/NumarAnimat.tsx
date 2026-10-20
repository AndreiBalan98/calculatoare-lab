'use client';

import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/** O cifră care numără de la valoarea veche la cea nouă (~600 ms, decelerat). */
export function useNumarAnimat(tinta: number, de = tinta, durata = 0.6): number {
  const redus = useReducedMotion();
  const [valoare, setValoare] = useState(de);
  const curent = useRef(de);
  useEffect(() => {
    if (redus) {
      curent.current = tinta;
      return;
    }
    const ctrl = animate(curent.current, tinta, {
      duration: durata,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        curent.current = v;
        setValoare(v);
      },
    });
    return () => ctrl.stop();
  }, [tinta, durata, redus]);
  return redus ? tinta : valoare;
}

export function NumarAnimat({
  valoare, format = (n) => String(Math.round(n)), de = 0, className,
}: { valoare: number; format?: (n: number) => string; de?: number; className?: string }) {
  const v = useNumarAnimat(valoare, de);
  return (
    <span className={className} aria-label={format(valoare)}>
      <span aria-hidden>{format(v)}</span>
    </span>
  );
}
