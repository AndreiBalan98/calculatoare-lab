'use client';

// Vocea calculatorului (balonul cu monograma „DD”), indicatorul „scrie…” și răspunsurile omului.

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { FelMesaj } from '@/scenariu/tipuri';
import { TEXTE } from '@/scenariu/edrive';
import { Text } from '../Text';
import { atinge, useMiscare } from '../miscare';

export function Avatar({ ascuns }: { ascuns?: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-[13px] font-semibold tracking-wide text-accent ${ascuns ? 'invisible' : ''}`}
    >
      {TEXTE.monograma}
    </span>
  );
}

const STIL: Record<FelMesaj, string> = {
  normal: 'card px-4 py-3',
  antrenor: 'rounded-card border border-accent/60 border-l-[3px] border-l-accent bg-white px-4 py-3',
  avertisment: 'rounded-card bg-avertisment-fond px-4 py-3 text-avertisment',
  info: 'rounded-card bg-tertiary px-4 py-3 text-senary',
};

/** Un rând al calculatorului: avatarul + conținutul. */
export function RandCalculator({ children, avatar = true }: { children: ReactNode; avatar?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3">
      <Avatar ascuns={!avatar} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Balon({ text, fel = 'normal', eticheta }: { text: string; fel?: FelMesaj; eticheta?: string | null }) {
  return (
    <div className={`${STIL[fel]} max-w-[560px]`}>
      {fel === 'antrenor' && <p className="eticheta-mica mb-0.5">Antrenorul</p>}
      {eticheta && <p className="eticheta-mica mb-0.5">{eticheta}</p>}
      <p><Text text={text} /></p>
    </div>
  );
}

export function Scrie({ text }: { text?: string }) {
  const { redus } = useMiscare();
  return (
    <div className="flex items-center gap-2" role="status">
      <span className="card inline-flex h-10 items-center gap-1.5 px-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-senary"
            style={redus ? undefined : { animation: `scrie 1.1s ${i * 0.15}s infinite ease-in-out` }}
          />
        ))}
      </span>
      {text ? <span className="text-senary">{text}</span> : <span className="sr-only">{TEXTE.scrie}</span>}
    </div>
  );
}

/** Răspunsul omului: la atingere, întrebarea se redeschide. */
export function Pastila({ id, text, laSchimbare }: { id: string; text: string; laSchimbare?: () => void }) {
  const { layout, apasare } = useMiscare();
  return (
    <motion.button
      type="button"
      layoutId={id}
      transition={layout}
      whileTap={apasare}
      onClick={() => {
        atinge();
        laSchimbare?.();
      }}
      aria-label={`${TEXTE.schimba}: ${text}`}
      className="group inline-flex min-h-11 max-w-full shrink-0 items-center gap-2 rounded-card bg-primary px-3.5 py-2 text-left font-medium text-white hover:bg-secondary"
    >
      <span className="min-w-0 break-words">{text}</span>
      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 shrink-0 text-quinary opacity-70 group-hover:opacity-100">
        <path fill="currentColor" d="M11.7 1.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-8.6 8.6-3.5.9.9-3.5z" />
      </svg>
    </motion.button>
  );
}

/** Întrebarea trecută, comprimată într-un rând, cu răspunsul alături. */
export function RandComprimat({ scurt, children }: { scurt: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 pl-10 sm:pl-11">
      <span className="min-w-0 flex-1 truncate text-sm text-senary">{scurt}</span>
      {children}
    </div>
  );
}
