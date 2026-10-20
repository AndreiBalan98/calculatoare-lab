'use client';

// Principiile mișcării (docs/design.md §2): resorturi scurte, intrări din jos cu estompare,
// cascade de 50 ms; cu prefers-reduced-motion doar estompări scurte.

import { useReducedMotion, type Transition, type Variants } from 'framer-motion';

export const RESORT: Transition = { type: 'spring', stiffness: 300, damping: 28, mass: 0.9 };
export const RAPID: Transition = { duration: 0.15, ease: 'easeOut' };
export const CASCADA_MS = 50;

export function useMiscare() {
  const redus = !!useReducedMotion();
  const intrare: Variants = redus
    ? {
        ascuns: { opacity: 0 },
        vizibil: { opacity: 1, transition: { duration: 0.15 } },
        iesire: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        ascuns: { opacity: 0, y: 10, filter: 'blur(4px)' },
        vizibil: { opacity: 1, y: 0, filter: 'blur(0px)', transition: RESORT },
        iesire: { opacity: 0, y: -4, filter: 'blur(4px)', transition: RAPID },
      };
  const cascada: Variants = {
    ascuns: {},
    vizibil: { transition: { staggerChildren: redus ? 0 : CASCADA_MS / 1000 } },
    iesire: {},
  };
  const optiune: Variants = redus
    ? { ascuns: { opacity: 0 }, vizibil: { opacity: 1 }, iesire: { opacity: 0, transition: { duration: 0.1 } } }
    : {
        ascuns: { opacity: 0, y: 8, filter: 'blur(3px)' },
        vizibil: { opacity: 1, y: 0, filter: 'blur(0px)', transition: RESORT },
        iesire: { opacity: 0, scale: 0.92, filter: 'blur(3px)', transition: RAPID },
      };
  return {
    redus,
    intrare,
    cascada,
    optiune,
    layout: redus ? { duration: 0 } : RESORT,
    apasare: redus ? undefined : { scale: 0.97 },
  };
}

/** O vibrație foarte scurtă, unde există. */
export function atinge() {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* nu toate browserele o permit */
  }
}
