'use client';

// Drumul până la bani: pașii făcuți cu bifă aurie, următorul pulsează discret, restul estompați;
// pașii apar în cascadă.

import { AnimatePresence, motion } from 'framer-motion';
import type { DateDrum } from '@/scenariu/program';
import { Text } from '../Text';
import { RESORT, useMiscare } from '../miscare';
import { Bifa } from './Raspunsuri';

export function Drum({ drum, facuti, intarziere = 0 }: { drum: DateDrum; facuti: number; intarziere?: number }) {
  const { intra, redus } = useMiscare();
  return (
    <section className="card p-4 sm:p-6" aria-labelledby="drum-titlu" data-testid="drum">
      <h3 id="drum-titlu" className="text-mediu">{drum.titlu}</h3>
      <ol className="mt-4">
        {drum.pasi.map((p, i) => {
          const facut = i < facuti;
          const urmator = i === facuti;
          return (
            <motion.li
              key={p.titlu}
              {...intra(intarziere + i * 0.06)}
              className={`relative flex gap-3 pb-4 last:pb-0 ${!facut && !urmator ? 'opacity-55' : ''}`}
              data-stare={facut ? 'facut' : urmator ? 'urmator' : 'viitor'}
              aria-current={urmator ? 'step' : undefined}
            >
              {i < drum.pasi.length - 1 && (
                <span aria-hidden className={`absolute left-[13px] top-7 h-[calc(100%-24px)] w-0.5 ${facut ? 'bg-accent' : 'bg-quaternary'}`} />
              )}
              <span
                className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  facut ? 'border-accent bg-accent text-primary' : urmator ? 'border-accent bg-white text-accent-dark' : 'border-quaternary bg-white text-senary'
                }`}
                style={urmator && !redus ? { animation: 'puls-urmator 2.2s ease-in-out infinite' } : undefined}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {facut ? (
                    <motion.span key="bifa" initial={{ scale: 0 }} animate={{ scale: 1, transition: RESORT }}>
                      <Bifa className="size-4" />
                    </motion.span>
                  ) : (
                    <motion.span key="nr" exit={{ scale: 0, opacity: 0 }}>{i + 1}</motion.span>
                  )}
                </AnimatePresence>
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`font-semibold leading-snug ${facut || urmator ? 'text-primary' : ''}`}>
                  {p.titlu}
                  {urmator && <span className="eticheta-mica ml-2 align-middle text-[11px]">{drum.urmatorul}</span>}
                </p>
                {p.text && <p className="text-[15px] leading-snug text-senary"><Text text={p.text} /></p>}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
