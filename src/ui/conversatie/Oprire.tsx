'use client';

// Oprirea blândă: motivul din motor, spus omenește, fără roșu agresiv, și o cale spre noi.

import { motion } from 'framer-motion';
import type { Element } from '@/scenariu/derulare';
import { CONTACT } from '@/scenariu/edrive';
import type { Optiune } from '@/scenariu/tipuri';
import { Text } from '../Text';
import { atinge, useMiscare } from '../miscare';
import { RandCalculator } from './Baloane';

type ElOprire = Extract<Element, { tip: 'oprire' }>;

export function Oprire({ el, laActiune }: { el: ElOprire; laActiune: (o: Optiune) => void }) {
  const { cascada, optiune, apasare } = useMiscare();
  return (
    <RandCalculator>
      <section className="card max-w-[560px] border-l-[3px] border-l-quinary p-4 sm:p-5" data-testid="oprire">
        <h2 className="text-mediu leading-snug">{el.titlu}</h2>
        {el.motive.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {el.motive.map((m) => <li key={m}><Text text={m} /></li>)}
          </ul>
        )}
        <p className="mt-3 text-senary"><Text text={el.text} /></p>
        <motion.div className="mt-4 flex flex-wrap gap-2" variants={cascada} initial="ascuns" animate="vizibil">
          {el.pas.butoane.map((b, i) =>
            b.actiune?.tip === 'suna' ? (
              <motion.a key={b.valoare} variants={optiune} whileTap={apasare} href={CONTACT.tel} className={i === 0 ? 'btn-plin' : 'btn-contur'}>
                {b.eticheta} · {CONTACT.telefon}
              </motion.a>
            ) : (
              <motion.button
                key={b.valoare}
                type="button"
                variants={optiune}
                whileTap={apasare}
                onClick={() => {
                  atinge();
                  laActiune(b);
                }}
                className={i === 0 ? 'btn-plin' : 'btn-contur'}
              >
                {b.eticheta}
              </motion.button>
            ),
          )}
        </motion.div>
      </section>
    </RandCalculator>
  );
}
