'use client';

// Progresul, fix sus și mereu vizibil (docs/flux-edrive.md §2.1): 4 etape, linia care se umple
// pe un resort la fiecare răspuns, inelul care respiră pe etapa curentă, rândul cu rezultatul
// pe parcurs („80 de puncte · până la 25.000 €”) și „+20” auriu la câștig. ≤ 64px pe telefon.

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { PROGRES } from '@/scenariu/edrive';
import { euro } from '@/scenariu/format';
import type { Etapa } from '@/scenariu/tipuri';
import { NumarAnimat } from '../NumarAnimat';
import { Bifa } from './Raspunsuri';
import { useMiscare } from '../miscare';

export interface DateProgres {
  /** 0…1 */
  umplere: number;
  curenta: Etapa;
  /** toate etapele bifate (pe rezultat) */
  gata: boolean;
  /** null = nu arătăm încă rezultatul pe parcurs */
  scor: number | null;
  bani: number;
  /** etapele trecute pe care se poate sări */
  laEtapa?: (e: Etapa) => void;
}

export function Progres({ umplere, curenta, gata, scor, bani, laEtapa }: DateProgres) {
  const { redus } = useMiscare();
  const idx = PROGRES.etape.findIndex((e) => e.cheie === curenta);
  const inainte = useRef(scor);
  const [castig, setCastig] = useState<{ id: number; valoare: number } | null>(null);

  useEffect(() => {
    const vechi = inainte.current;
    inainte.current = scor;
    if (scor !== null && vechi !== null && scor > vechi && !redus) {
      const t0 = setTimeout(() => setCastig({ id: Date.now(), valoare: scor - vechi }), 0);
      const t = setTimeout(() => setCastig(null), 1300);
      return () => {
        clearTimeout(t0);
        clearTimeout(t);
      };
    }
  }, [scor, redus]);

  return (
    <div data-progres className="sticky top-0 z-30 border-b border-quaternary bg-white">
      <div className="mx-auto max-w-[640px] px-3 pb-1 pt-1.5 sm:px-6 sm:pb-2.5 sm:pt-3">
        <div className="relative grid grid-cols-4">
          {/* linia: de la centrul primei etape la centrul ultimei */}
          <div className="absolute left-[12.5%] right-[12.5%] top-[7px] h-0.5 rounded-full bg-quaternary" aria-hidden>
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${Math.round(Math.min(1, Math.max(0, umplere)) * 1000) / 10}%` }}
              transition={redus ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 24 }}
            />
          </div>
          {PROGRES.etape.map((e, i) => {
            const trecuta = gata || i < idx;
            const curent = !gata && i === idx;
            const continut = (
              <>
                <span className="relative flex size-4 items-center justify-center">
                  {/* inelul care respiră; cu prefers-reduced-motion îl oprește CSS-ul (fără diferențe la hidratare) */}
                  {curent && (
                    <span className="inel-respira absolute inset-[-3px] rounded-full bg-primary/25" aria-hidden />
                  )}
                  <span
                    className={`relative flex size-4 items-center justify-center rounded-full border-2 ${
                      trecuta ? 'border-accent bg-accent text-primary' : curent ? 'border-primary bg-primary' : 'border-quaternary bg-white'
                    }`}
                  >
                    {trecuta && <Bifa className="size-3" />}
                  </span>
                </span>
                <span className={`mt-0.5 text-[11px] leading-[14px] sm:text-[13px] sm:leading-5 ${curent ? 'font-semibold text-primary' : trecuta ? 'text-primary' : 'text-senary'}`}>
                  {e.nume}
                </span>
              </>
            );
            return trecuta && laEtapa && !gata ? (
              <button
                key={e.cheie}
                type="button"
                onClick={() => laEtapa(e.cheie)}
                aria-label={PROGRES.etapaTrecuta(e.nume)}
                className="relative z-10 flex flex-col items-center"
              >
                {continut}
              </button>
            ) : (
              <div key={e.cheie} className="relative z-10 flex flex-col items-center" aria-current={curent ? 'step' : undefined}>
                {continut}
              </div>
            );
          })}
        </div>
        <div className="flex h-[18px] items-center justify-center text-[13px] leading-[18px] sm:mt-0.5 sm:h-6 sm:text-[15px]" aria-live="polite">
          <AnimatePresence>
            {scor !== null && (
              <motion.p key="rand" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative text-primary" data-rand-rezultat>
                <NumarAnimat valoare={scor} className="font-semibold" /> {PROGRES.puncte(scor)}
                {bani > 0 && (
                  <>
                    {' · '}{PROGRES.panaLa} <NumarAnimat valoare={bani} format={euro} className="font-semibold" />
                  </>
                )}
                <AnimatePresence>
                  {castig && (
                    <motion.span
                      key={castig.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: -8 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="absolute left-full top-0 ml-1.5 font-semibold text-accent-dark"
                      aria-hidden
                    >
                      +{castig.valoare}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
