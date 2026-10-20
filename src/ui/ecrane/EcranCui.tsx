'use client';

// S0 · Start + CUI: întrebarea, câmpul mare, „Caută firma”. Banda programului (doar pe S0)
// o pune Calculator deasupra progresului.

import { motion } from 'framer-motion';
import { useState } from 'react';
import { curataCui } from '@/motor/edrive/cui';
import type { Ecran } from '@/scenariu/derulare';
import { MOMENT, atinge, useMiscare } from '../miscare';
import { Coloana, Ecou, Intrebare } from './parti';

type EcranC = Extract<Ecran, { tip: 'cui' }>;

export function EcranCui({ ecran, initial, laRaspuns }: { ecran: EcranC; initial: string; laRaspuns: (v: string) => void }) {
  const [text, setText] = useState(initial);
  const [eroare, setEroare] = useState<string | null>(null);
  const [modificat, setModificat] = useState(false);
  const { intra, apasare } = useMiscare();
  const p = ecran.pas;
  const err = eroare ?? (modificat ? null : ecran.eroare);

  return (
    <div>
      <Coloana className="pb-6 pt-5 sm:pt-10">
        <Ecou text={ecran.ecou} />
        <Intrebare text={ecran.text} explicatie={ecran.explicatie} />
        <motion.form
          {...intra(MOMENT.optiuni)}
          className="mt-4 flex flex-col gap-2.5 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!curataCui(text)) {
              setEroare(p.eroare);
              return;
            }
            atinge();
            setModificat(false);
            laRaspuns(text);
          }}
        >
          <label htmlFor="cui" className="sr-only">{p.campEticheta}</label>
          <input
            id="cui"
            name="cui"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={p.placeholder}
            value={text}
            data-focus
            aria-invalid={!!err}
            aria-describedby={err ? 'cui-eroare' : undefined}
            onChange={(e) => {
              setText(e.target.value);
              setEroare(null);
              setModificat(true);
            }}
            className="camp h-[54px] min-w-0 flex-1 text-[20px] tracking-wide"
          />
          <motion.button type="submit" whileTap={apasare} className="btn-plin h-[54px] shrink-0 sm:px-8">
            {p.buton}
          </motion.button>
        </motion.form>
        {err && <p id="cui-eroare" role="alert" className="mt-2 text-[15px] text-eroare">{err}</p>}
      </Coloana>
    </div>
  );
}
