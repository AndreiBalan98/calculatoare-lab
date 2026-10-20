'use client';

// S1 · Căutarea (o stare, nu o întrebare): „Caut firma la ANAF…” cu o linie care curge.

import { motion } from 'framer-motion';
import { useMiscare } from '../miscare';
import { Coloana } from './parti';

export function EcranCautare({ text }: { text: string }) {
  const { redus } = useMiscare();
  return (
    <Coloana className="flex flex-col items-start pb-6 pt-16 sm:pt-24">
      <p className="font-serif text-[25px] font-semibold text-primary sm:text-[30px]" role="status">{text}</p>
      <div className="mt-5 h-1 w-full max-w-[320px] overflow-hidden rounded-full bg-quaternary" aria-hidden>
        <motion.div
          className="h-full w-1/3 rounded-full bg-accent"
          initial={{ x: '-100%' }}
          animate={redus ? { x: '100%' } : { x: ['-100%', '300%'] }}
          transition={redus ? { duration: 0 } : { duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>
    </Coloana>
  );
}
