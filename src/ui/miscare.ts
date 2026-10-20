'use client';

// Mișcarea pentru ecrane (docs/design.md §2): ecranul pleacă în sus și vine de jos (invers la
// Înapoi), resorturi scurte, intrări în ordine (ecou → întrebare → opțiuni în cascadă → antrenor);
// cu prefers-reduced-motion doar estompări scurte.

import { useReducedMotion, type Transition, type Variants } from 'framer-motion';

export const RESORT: Transition = { type: 'spring', stiffness: 300, damping: 28, mass: 0.9 };
export const RAPID: Transition = { duration: 0.15, ease: 'easeOut' };
/** cât stă butonul ales plin, înainte să plece ecranul */
export const AVANS_MS = 350;

/** Momentele intrării pe ecran (secunde). */
export const MOMENT = { ecou: 0, intrebare: 0.15, optiuni: 0.22, cascada: 0.05, dupa: 0.45 };

export function useMiscare() {
  const redus = !!useReducedMotion();
  /** tranziția ecranelor; `custom` = direcția (1 înainte, -1 înapoi) */
  const ecran: Variants = redus
    ? {
        intra: { opacity: 0 },
        centru: { opacity: 1, transition: { duration: 0.12 } },
        iese: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        intra: (dir: number) => ({ opacity: 0, y: dir > 0 ? 20 : -20, filter: 'blur(4px)' }),
        centru: { opacity: 1, y: 0, filter: 'blur(0px)', transition: RESORT },
        iese: (dir: number) => ({ opacity: 0, y: dir > 0 ? -20 : 20, filter: 'blur(4px)', transition: { duration: 0.22, ease: 'easeIn' } }),
      };
  /** o bucată a ecranului care intră după `intarziere` secunde */
  const intra = (intarziere = 0) =>
    redus
      ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.12 } } }
      : {
          initial: { opacity: 0, y: 10, filter: 'blur(3px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...RESORT, delay: intarziere } },
        };
  return {
    redus,
    ecran,
    intra,
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
