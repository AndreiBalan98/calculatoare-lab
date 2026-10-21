'use client';

// Alegerea multiplă (SME Eco-Tech, C1): butoane-comutator în stilul răspunsurilor. Un buton ales
// se umple cu bifă, ca la alegere, dar ecranul nu pleacă singur; „Continuă” e activ doar cu cel
// puțin o alegere. Alegerile de dinainte apar bifate.

import { motion } from 'framer-motion';
import { useState } from 'react';
import { alese } from '@/scenariu/derulare';
import type { Optiune } from '@/scenariu/tipuri';
import { MOMENT, atinge, useMiscare } from '../miscare';
import { Buton } from './Raspunsuri';

export function AlegereMultipla({
  optiuni, raspuns, continua, laRaspuns,
}: {
  optiuni: Optiune[];
  /** alegerile de dinainte („verde,alte”) */
  raspuns: string | null;
  continua: string;
  laRaspuns: (valoare: string) => void;
}) {
  const { intra, apasare } = useMiscare();
  const [bifate, setBifate] = useState<string[]>(() => alese(raspuns ?? undefined));
  const comuta = (v: string) => {
    atinge();
    setBifate((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v]));
  };
  // în ordinea opțiunilor, ca răspunsul să nu depindă de ordinea apăsărilor
  const valoare = optiuni.filter((o) => bifate.includes(o.valoare)).map((o) => o.valoare).join(',');

  return (
    <div>
      <div className="grid grid-cols-1 gap-2.5" role="group">
        {optiuni.map((o, i) => (
          <Buton
            key={o.valoare}
            index={i}
            comutator
            stare={bifate.includes(o.valoare) ? 'ales' : 'normal'}
            detaliu={o.detaliu}
            focus={i === 0}
            onClick={() => comuta(o.valoare)}
          >
            {o.eticheta}
          </Buton>
        ))}
      </div>
      <motion.div {...intra(MOMENT.optiuni + optiuni.length * MOMENT.cascada)} className="mt-3">
        <motion.button
          type="button"
          whileTap={valoare ? apasare : undefined}
          disabled={!valoare}
          onClick={() => {
            if (!valoare) return;
            atinge();
            laRaspuns(valoare);
          }}
          className="btn-plin w-full"
          data-continua
        >
          {continua}
        </motion.button>
      </motion.div>
    </div>
  );
}
