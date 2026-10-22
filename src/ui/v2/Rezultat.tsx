'use client';

// Rezultatul variantei 2 (docs/flux-v2.md §2.6): fără ecran nou. Cardul rămâne sus, cu cifra finală;
// dedesubt, în cascadă, aceleași date ca în v1 (program.rezultat): propozițiile, bara banilor,
// „De știut”, drumul până la bani, nota. Butoanele: fixe jos pe telefon, sub drum pe desktop.

import { AnimatePresence, motion } from 'framer-motion';
import { CONTACT, TEXTE } from '@/scenariu/comun';
import type { DateDrum, VedereRezultat } from '@/scenariu/program';
import { Text } from '../Text';
import { Drum } from '../ecrane/Drum';
import { BaraBani, DeStiut } from '../ecrane/EcranRezultat';
import { Inapoi } from '../ecrane/parti';
import { useMiscare } from '../miscare';

const PAS = 0.12;

export function RezultatV2({
  vedere: v, drum, trimisa, laTrimite, laInapoi,
}: { vedere: VedereRezultat; drum: DateDrum; trimisa: boolean; laTrimite: () => void; laInapoi?: () => void }) {
  const { intra, apasare } = useMiscare();
  return (
    <div data-testid="rezultat" data-varianta={v.varianta}>
      <div className="pb-4 pt-5" aria-live="polite">
        <AnimatePresence initial={false}>
          {trimisa && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-3 font-semibold text-accent-dark" role="status">
              {TEXTE.primita}
            </motion.p>
          )}
        </AnimatePresence>
        {v.titlu && (
          <motion.p {...intra(0.15)} className="font-serif text-[22px] font-semibold leading-snug text-primary">{v.titlu}</motion.p>
        )}
        {v.propozitii.length > 0 && (
          <div className="flex flex-col gap-1 text-[19px] leading-snug sm:text-mediu" data-propozitii>
            {v.propozitii.map((p, i) => (
              <motion.p key={p} {...intra(0.15 + i * PAS)}><Text text={p} /></motion.p>
            ))}
          </div>
        )}
        {v.probleme.length > 0 && (
          <motion.ul {...intra(0.15 + PAS)} className="mt-4 flex flex-col gap-2">
            {v.probleme.map((p) => <li key={p} className="rounded-card bg-avertisment-fond px-3.5 py-2.5 text-[15px] text-avertisment"><Text text={p} /></li>)}
          </motion.ul>
        )}
        {v.bara && (
          <motion.div {...intra(0.15 + 3 * PAS)} className="mt-6">
            <BaraBani bara={v.bara} rand={v.rand} intarziere={0.55} />
          </motion.div>
        )}
        {v.deStiut.length > 0 && (
          <motion.div {...intra(0.15 + 4 * PAS)} className="mt-6">
            <DeStiut casete={v.deStiut} />
          </motion.div>
        )}
        {v.drum && (
          <div className="mt-6">
            <Drum drum={drum} facuti={trimisa ? 2 : 1} intarziere={0.15 + 5 * PAS} />
          </div>
        )}
        <motion.p {...intra(1)} className="mt-5 text-xs leading-relaxed text-senary">{v.nota}</motion.p>
        <Inapoi laInapoi={laInapoi} />
      </div>

      {/* Butoanele: fixe jos pe telefon, în pagină pe desktop */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-quaternary bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgb(20_33_61/0.08)] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-10 sm:pt-0 sm:shadow-none">
        <div className="flex flex-col gap-2 sm:flex-row">
          {v.trimite && (
            <motion.button
              type="button"
              whileTap={trimisa ? undefined : apasare}
              onClick={laTrimite}
              disabled={trimisa}
              className="btn-plin w-full sm:w-auto sm:flex-1"
              data-focus
            >
              {trimisa ? TEXTE.trimisa : TEXTE.trimite}
            </motion.button>
          )}
          <motion.a whileTap={apasare} href={CONTACT.tel} className="btn-contur w-full sm:w-auto sm:flex-1">
            {TEXTE.suna}
          </motion.a>
        </div>
      </div>
    </div>
  );
}
