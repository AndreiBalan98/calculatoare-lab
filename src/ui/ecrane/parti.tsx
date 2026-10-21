'use client';

// Bucățile unui ecran de întrebare, în ordinea din docs/flux-edrive.md §3:
// ecoul, eticheta, întrebarea, explicația, (răspunsurile), antrenorul, nota, „← Înapoi”.

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { TEXTE } from '@/scenariu/comun';
import { Text } from '../Text';
import { MOMENT, useMiscare } from '../miscare';

/** Coloana ecranului: ~640px pe desktop, toată lățimea pe telefon. */
export function Coloana({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[640px] px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Ecou({ text }: { text: string | null }) {
  const { intra } = useMiscare();
  if (!text) return null;
  return (
    <motion.p {...intra(MOMENT.ecou)} className="mb-2 text-[15px] font-medium leading-snug text-accent-dark sm:text-base" data-ecou>
      <Text text={text} />
    </motion.p>
  );
}

export function Intrebare({ eticheta, text, explicatie }: { eticheta?: string | null; text: string; explicatie?: string | null }) {
  const { intra } = useMiscare();
  return (
    <motion.div {...intra(MOMENT.intrebare)}>
      {eticheta && <p className="eticheta-mica mb-1">{eticheta}</p>}
      <h2 className="text-[25px] leading-[1.18] sm:text-[34px]" data-intrebare>
        <Text text={text} />
      </h2>
      {explicatie && <p className="mt-2 text-[15px] leading-snug text-senary sm:text-base"><Text text={explicatie} /></p>}
    </motion.div>
  );
}

export function Antrenor({ text }: { text: string | null }) {
  const { intra } = useMiscare();
  if (!text) return null;
  return (
    <motion.div {...intra(MOMENT.dupa)} className="mt-4 rounded-r-card border-l-[3px] border-accent bg-white px-3.5 py-2.5 text-[15px] leading-snug" data-antrenor>
      <Text text={text} />
    </motion.div>
  );
}

export function Nota({ text }: { text: string | null }) {
  const { intra } = useMiscare();
  if (!text) return null;
  return (
    <motion.p {...intra(MOMENT.dupa)} className="mt-3 text-[13px] leading-snug text-senary sm:text-sm">
      <Text text={text} />
    </motion.p>
  );
}

export function Inapoi({ laInapoi }: { laInapoi?: () => void }) {
  const { intra } = useMiscare();
  if (!laInapoi) return null;
  return (
    <motion.div {...intra(MOMENT.dupa)} className="mt-4">
      <button type="button" onClick={laInapoi} className="-ml-2 min-h-11 px-2 text-[15px] text-senary hover:text-primary hover:underline">
        {TEXTE.inapoi}
      </button>
    </motion.div>
  );
}
