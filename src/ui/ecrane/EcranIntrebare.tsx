'use client';

// Un ecran de întrebare (S3, F1–F5, M1–M5, P1–P3, C1): ecou, etichetă, întrebare, explicație,
// răspunsuri (sau alegerea multiplă), antrenor, notă, „← Înapoi”.

import { motion } from 'framer-motion';
import type { EcranIntrebareT } from '@/scenariu/derulare';
import type { Optiune } from '@/scenariu/tipuri';
import { MOMENT, useMiscare } from '../miscare';
import { AlegereMultipla } from './AlegereMultipla';
import { Raspunsuri } from './Raspunsuri';
import { Antrenor, Coloana, Ecou, Inapoi, Intrebare, Nota } from './parti';

export function EcranIntrebare<C>({
  ecran, laRaspuns, laActiune, laInapoi,
}: {
  ecran: EcranIntrebareT<C>;
  laRaspuns: (pas: string, valoare: string) => void;
  laActiune: (o: Optiune) => void;
  laInapoi?: () => void;
}) {
  const { intra } = useMiscare();
  const p = ecran.pas;
  return (
    <Coloana className="pb-6 pt-5 sm:pt-12">
      <Ecou text={ecran.ecou} />
      <Intrebare eticheta={ecran.eticheta} text={ecran.text} explicatie={ecran.explicatie} />
      <motion.div {...intra(MOMENT.optiuni)} className="mt-5">
        {p.tip === 'multipla' ? (
          <AlegereMultipla
            optiuni={ecran.optiuni}
            raspuns={ecran.raspuns}
            continua={p.continua}
            laRaspuns={(v) => laRaspuns(ecran.cheie, v)}
            laInapoi={laInapoi}
          />
        ) : (
          <Raspunsuri
            optiuni={ecran.optiuni}
            raspuns={ecran.raspuns}
            grila={p.tip === 'alegere' && p.grila}
            sume={p.tip === 'suma'}
            maiMulte={p.tip === 'alegere' ? p.maiMulte : undefined}
            altaSuma={p.tip === 'suma' ? p.altaSuma : undefined}
            laAlegere={(o) => (o.actiune ? laActiune(o) : laRaspuns(ecran.cheie, o.valoare))}
            laSuma={(v) => laRaspuns(ecran.cheie, v)}
          />
        )}
      </motion.div>
      <Antrenor text={ecran.antrenor} />
      <Nota text={ecran.nota} />
      {/* la alegerea multiplă, „Înapoi” stă lângă „Continuă” */}
      <Inapoi laInapoi={p.tip === 'multipla' ? undefined : laInapoi} />
    </Coloana>
  );
}
