'use client';

// X1, X2 · Opririle: ecran calm, fără roșu agresiv, cu motivul din motor și o cale spre noi.

import { motion } from 'framer-motion';
import type { Ecran } from '@/scenariu/derulare';
import { CONTACT } from '@/scenariu/edrive';
import type { Optiune } from '@/scenariu/tipuri';
import { Text } from '../Text';
import { MOMENT, atinge, useMiscare } from '../miscare';
import { Coloana, Inapoi } from './parti';

type EcranX = Extract<Ecran, { tip: 'oprire' }>;

export function EcranOprire({ ecran, laActiune, laInapoi }: { ecran: EcranX; laActiune: (o: Optiune) => void; laInapoi?: () => void }) {
  const { intra, apasare } = useMiscare();
  return (
    <Coloana className="pb-6 pt-8 sm:pt-14">
      <motion.h2 {...intra(0)} className="text-[25px] leading-[1.18] sm:text-[34px]" data-oprire>
        {ecran.titlu}
      </motion.h2>
      {ecran.motive.length > 0 && (
        <motion.ul {...intra(MOMENT.intrebare)} className="mt-3 flex flex-col gap-1.5">
          {ecran.motive.map((m) => <li key={m} className="leading-snug"><Text text={m} /></li>)}
        </motion.ul>
      )}
      <motion.p {...intra(MOMENT.intrebare + 0.05)} className="mt-3 leading-snug text-senary"><Text text={ecran.text} /></motion.p>
      <motion.div {...intra(MOMENT.optiuni)} className="mt-6 flex flex-col gap-2.5">
        {ecran.pas.butoane.map((b, i) =>
          b.actiune?.tip === 'suna' ? (
            <motion.a key={b.valoare} whileTap={apasare} href={CONTACT.tel} data-focus={i === 0 || undefined} className={i === 0 ? 'btn-plin' : 'btn-contur'}>
              {b.eticheta} · {CONTACT.telefon}
            </motion.a>
          ) : (
            <motion.button
              key={b.valoare}
              type="button"
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
      <Inapoi laInapoi={laInapoi} />
    </Coloana>
  );
}
