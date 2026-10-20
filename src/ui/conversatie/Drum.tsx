'use client';

// Drumul până la bani: pasul 1 bifat auriu, următorul pulsează discret, restul estompați.

import { AnimatePresence, motion } from 'framer-motion';
import { DRUM } from '@/scenariu/edrive';
import { RESORT, useMiscare } from '../miscare';

function Bifa() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Drum({ facuti }: { facuti: number }) {
  const { cascada, intrare, redus } = useMiscare();
  return (
    <section className="card p-4 sm:p-6" aria-labelledby="drum-titlu" data-testid="drum">
      <h2 id="drum-titlu" className="text-mediu">{DRUM.titlu}</h2>
      <motion.ol className="relative mt-4" variants={cascada} initial="ascuns" animate="vizibil">
        {DRUM.pasi.map((p, i) => {
          const facut = i < facuti;
          const urmator = i === facuti;
          return (
            <motion.li
              key={p.titlu}
              variants={intrare}
              className={`relative flex gap-3 pb-4 last:pb-0 ${!facut && !urmator ? 'opacity-55' : ''}`}
              data-stare={facut ? 'facut' : urmator ? 'urmator' : 'viitor'}
              aria-current={urmator ? 'step' : undefined}
            >
              {i < DRUM.pasi.length - 1 && (
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
                    <motion.span key="bifa" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0, transition: RESORT }}>
                      <Bifa />
                    </motion.span>
                  ) : (
                    <motion.span key="nr" exit={{ scale: 0, opacity: 0 }}>{i + 1}</motion.span>
                  )}
                </AnimatePresence>
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`font-semibold leading-snug ${facut || urmator ? 'text-primary' : ''}`}>
                  {p.titlu}
                  {urmator && <span className="eticheta-mica ml-2 align-middle text-[11px]">{DRUM.urmatorul}</span>}
                </p>
                {p.text && <p className="text-[15px] leading-snug text-senary">{p.text}</p>}
              </div>
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}
