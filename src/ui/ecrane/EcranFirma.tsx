'use client';

// S2 · Firma găsită: cardul firmei (singurul card din flux), cu avertismentele de la ANAF,
// și „Asta e firma ta?”.

import { motion } from 'framer-motion';
import type { Ecran } from '@/scenariu/derulare';
import { localitate } from '@/scenariu/format';
import type { Optiune } from '@/scenariu/tipuri';
import { Text } from '../Text';
import { MOMENT, useMiscare } from '../miscare';
import { Raspunsuri } from './Raspunsuri';
import { Coloana, Ecou, Inapoi, Intrebare } from './parti';

type EcranF = Extract<Ecran, { tip: 'cardFirma' }>;

export function EcranFirma({
  ecran, laRaspuns, laInapoi,
}: { ecran: EcranF; laRaspuns: (pas: string, valoare: string) => void; laInapoi?: () => void }) {
  const { intra } = useMiscare();
  const { firma, pas, ctx } = ecran;
  const e = pas.etichete;
  const inc = ctx.incadrareAnaf;
  const categoria = inc?.status === 'imm' ? inc.marime.nume : inc?.status === 'neimm' ? e.neImm : e.necunoscut;
  const angajati = firma.bilant?.angajati;
  const avert = ctx.evaluare.avert;

  return (
    <Coloana className="pb-6 pt-5 sm:pt-12">
      <Ecou text={ecran.ecou} />
      <motion.section {...intra(0.08)} className="card p-4 sm:p-5" aria-label={firma.denumire ?? undefined} data-card-firma>
        <h3 className="text-[21px] leading-snug sm:text-mediu">{firma.denumire || `CUI ${firma.cui}`}</h3>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 text-[15px] leading-relaxed">
          <dt className="text-senary">{e.localitatea}</dt>
          <dd>{localitate(firma.adresa, firma.judet) || '—'}</dd>
          <dt className="text-senary">{e.categoria}</dt>
          <dd className="font-semibold text-primary">{categoria}</dd>
          {angajati != null && (
            <>
              <dt className="text-senary">{e.angajatii}</dt>
              <dd>{angajati}</dd>
            </>
          )}
        </dl>
        {avert.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {avert.map((a) => (
              <li key={a} className="rounded-[4px] bg-avertisment-fond px-3 py-1.5 text-[13px] leading-snug text-avertisment">
                <Text text={a} />
              </li>
            ))}
          </ul>
        )}
      </motion.section>
      <div className="mt-5">
        <Intrebare text={ecran.text} />
      </div>
      <motion.div {...intra(MOMENT.optiuni)} className="mt-4">
        <Raspunsuri optiuni={ecran.optiuni} raspuns={ecran.raspuns} laAlegere={(o: Optiune) => laRaspuns(ecran.cheie, o.valoare)} />
      </motion.div>
      <Inapoi laInapoi={laInapoi} />
    </Coloana>
  );
}
