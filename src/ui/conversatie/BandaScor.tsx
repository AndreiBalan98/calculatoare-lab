'use client';

// Banda de scor, fixă sus: scorul din 100 care numără, bara subțire, eticheta, „+20” care urcă.

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Context } from '@/scenariu/context';
import { BANDA } from '@/scenariu/edrive';
import { NumarAnimat } from '../NumarAnimat';
import { RESORT, useMiscare } from '../miscare';

export function BandaScor({ ctx }: { ctx: Context }) {
  const { redus } = useMiscare();
  const total = ctx.rezultat.total;
  const eticheta = BANDA.eticheta(ctx);
  const bonus = BANDA.bonus(ctx);
  const inainte = useRef(total);
  const [castig, setCastig] = useState<{ id: number; valoare: number } | null>(null);

  useEffect(() => {
    const dif = total - inainte.current;
    inainte.current = total;
    if (dif > 0 && !redus) {
      setCastig({ id: Date.now(), valoare: dif });
      const t = setTimeout(() => setCastig(null), 1400);
      return () => clearTimeout(t);
    }
  }, [total, redus]);

  return (
    <motion.div
      initial={redus ? { opacity: 0 } : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0, transition: RESORT }}
      className="sticky top-0 z-30 border-b border-quaternary bg-white shadow-[0_1px_8px_rgb(20_33_61/0.06)]"
      data-testid="banda-scor"
    >
      <div className="mx-auto flex max-w-[720px] items-center gap-3 px-4 py-2 sm:py-3">
        <div className="relative flex items-baseline gap-0.5" aria-live="polite">
          <span className="sr-only">{BANDA.scor}: </span>
          <NumarAnimat valoare={total} className="font-serif text-[30px] font-semibold leading-none text-primary sm:text-[34px]" />
          <span className="text-sm text-senary">{BANDA.din}</span>
          <AnimatePresence>
            {castig && (
              <motion.span
                key={castig.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: -14 }}
                exit={{ opacity: 0, y: -26 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute -right-7 top-0 font-serif text-lg font-semibold text-accent-dark"
                aria-hidden
              >
                +{castig.valoare}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="min-w-0 flex-1 pl-2">
          <p className="truncate text-sm font-semibold text-primary">{eticheta}</p>
          {ctx.estimat && !bonus && <p className="truncate text-xs text-senary">{BANDA.estimat}</p>}
          <AnimatePresence initial={false}>
            {bonus && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="truncate text-xs font-semibold text-accent-dark"
              >
                {bonus}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-quaternary">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, total)}%` }}
              transition={redus ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 22 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
