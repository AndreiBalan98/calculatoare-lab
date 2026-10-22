'use client';

// R · Rezultatul (singurul ecran care se derulează): cifra mare care numără, propozițiile (sau
// titlul și problemele), bara banilor, antrenorul cu „Aplică”, „De știut”, drumul până la bani,
// nota. Butoanele de acțiune: fixe jos pe telefon, sub drum pe desktop. Ce arată vine din
// program (VedereRezultat); la o altă variantă (ex. proiect → ok), conținutul se schimbă animat,
// în același ecran, iar cifra numără la noua valoare.

import { AnimatePresence, motion } from 'framer-motion';
import { CONTACT, TEXTE } from '@/scenariu/comun';
import type { CasetaDeStiut, DateDrum, VedereRezultat } from '@/scenariu/program';
import { Text } from '../Text';
import { NumarAnimat } from '../NumarAnimat';
import { RAPID, RESORT, atinge, useMiscare } from '../miscare';
import { Drum } from './Drum';
import { Coloana } from './parti';

const PAS = 0.12;

const TON: Record<CasetaDeStiut['ton'], string> = {
  avertisment: 'bg-avertisment-fond text-avertisment',
  sfat: 'bg-sfat-fond text-primary',
  info: 'border border-quaternary bg-tertiary text-senary',
};

export function EcranRezultat({
  vedere: v, drum, trimisa, laTrimite, laAplica, laSchimba,
}: { vedere: VedereRezultat; drum: DateDrum; trimisa: boolean; laTrimite: () => void; laAplica: () => void; laSchimba: () => void }) {
  const { intra, apasare } = useMiscare();

  return (
    <div data-testid="rezultat" data-varianta={v.varianta}>
      <Coloana className="pb-4 pt-6 sm:pt-10">
        <motion.div {...intra(0)}>
          <p className="eticheta-mica">{v.eticheta}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <NumarAnimat
              valoare={v.cifra}
              format={v.format}
              className={`font-serif font-semibold leading-none transition-colors duration-500 ${v.gri ? 'text-senary' : 'text-primary'} ${
                v.cifraMica ? 'text-[56px] sm:text-[80px]' : 'text-[72px] sm:text-[88px]'
              }`}
            />
            <span className="text-senary">{v.din}</span>
          </div>
          {v.estimat && <p className="mt-1 text-sm text-senary">{v.estimat}</p>}
          <AnimatePresence initial={false}>
            {trimisa && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 font-semibold text-accent-dark"
                role="status"
              >
                {TEXTE.primita}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={v.varianta} exit={{ opacity: 0, transition: RAPID }} data-continut>
            {v.titlu && (
              <motion.p {...intra(0.3)} className="mt-4 font-serif text-[22px] font-semibold leading-snug text-primary sm:text-mare" data-titlu-rezultat>
                {v.titlu}
              </motion.p>
            )}
            {v.propozitii.length > 0 && (
              <div className="mt-4 flex flex-col gap-1 text-[19px] leading-snug sm:text-mediu">
                {v.propozitii.map((p, i) => (
                  <motion.p key={p} {...intra(0.3 + i * PAS)}><Text text={p} /></motion.p>
                ))}
              </div>
            )}
            {v.probleme.length > 0 && (
              <motion.ul {...intra(0.3 + PAS)} className="mt-4 flex flex-col gap-2" data-probleme>
                {v.probleme.map((p) => <li key={p} className="rounded-card bg-avertisment-fond px-3.5 py-2.5 text-[15px] text-avertisment"><Text text={p} /></li>)}
              </motion.ul>
            )}

            {v.bara && (
              <motion.div {...intra(0.3 + 3 * PAS)} className="mt-6">
                <BaraBani bara={v.bara} rand={v.rand} />
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {v.antrenor && (
                <motion.div
                  key="antrenor"
                  {...intra(0.3 + 4 * PAS)}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                  className="mt-6 rounded-r-card border-l-[3px] border-accent bg-white px-4 py-3"
                  data-testid="antrenor-rezultat"
                >
                  <p className="eticheta-mica">{TEXTE.antrenor}</p>
                  <p className="mt-0.5"><Text text={v.antrenor.text} /></p>
                  {v.antrenor.detaliu && <p className="mt-1 text-[15px] text-senary">{v.antrenor.detaliu}</p>}
                  {v.antrenor.aplica && (
                    <motion.button
                      type="button"
                      whileTap={apasare}
                      onClick={() => {
                        atinge();
                        laAplica();
                      }}
                      className="btn-contur mt-3"
                    >
                      {TEXTE.aplica}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {v.deStiut.length > 0 && (
              <motion.div {...intra(0.3 + 5 * PAS)} className="mt-6">
                <DeStiut casete={v.deStiut} />
              </motion.div>
            )}

            {v.drum && (
              <div className="mt-6">
                <Drum drum={drum} facuti={trimisa ? 2 : 1} intarziere={0.3 + 6 * PAS} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.p {...intra(1.2)} className="mt-5 text-xs leading-relaxed text-senary">{v.nota}</motion.p>
        <motion.div {...intra(1.2)}>
          <button type="button" onClick={laSchimba} className="-ml-2 mt-2 min-h-11 px-2 text-[15px] text-senary hover:text-primary hover:underline">
            {v.schimba}
          </button>
        </motion.div>
      </Coloana>

      {/* Butoanele: fixe jos pe telefon, în pagină pe desktop */}
      <div className="sticky bottom-0 z-20 border-t border-quaternary bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgb(20_33_61/0.08)] sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:pb-10 sm:pt-0 sm:shadow-none">
        <div className="mx-auto flex max-w-[640px] flex-col gap-2 sm:flex-row sm:px-6">
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

/** Bara banilor („Banii, pe scurt”): segmentele care cresc, legenda cu cifrele și rândul de sub ea. */
export function BaraBani({ bara, rand, intarziere = 0.7 }: { bara: NonNullable<VedereRezultat['bara']>; rand: string | null; intarziere?: number }) {
  const { redus } = useMiscare();
  return (
    <>
      <p className="eticheta-mica">{bara.titlu}</p>
      <div className="mt-2 flex h-4 w-full overflow-hidden rounded-[4px] bg-quaternary/60" aria-hidden>
        {bara.segmente.map((s, i) => (
          <motion.div
            key={s.cheie}
            className={`${s.culoare} h-full`}
            initial={{ width: 0 }}
            animate={{ width: `${(s.valoare / (bara.total ?? 1)) * 100}%` }}
            transition={redus ? { duration: 0 } : { ...RESORT, delay: intarziere + i * PAS }}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-1.5 text-[15px] sm:grid-cols-3 sm:gap-3">
        {bara.segmente.map((s) => (
          <li key={s.cheie} className="flex items-baseline gap-2">
            <span aria-hidden className={`${s.culoare} inline-block size-2.5 shrink-0 translate-y-[1px] rounded-[2px]`} />
            <span className="text-senary">{s.eticheta}</span>
            <NumarAnimat valoare={s.valoare} format={bara.format} className="ml-auto font-semibold tabular-nums text-primary sm:ml-0" />
          </li>
        ))}
      </ul>
      {rand && <p className="mt-3 text-[15px]" data-rand-sub-bara><Text text={rand} /></p>}
    </>
  );
}

/** „De știut”: casetele cu culorile mesajelor de stare. */
export function DeStiut({ casete }: { casete: CasetaDeStiut[] }) {
  return (
    <>
      <p className="eticheta-mica">{TEXTE.deStiut}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {casete.map((a) => (
          <li key={a.text} className={`rounded-card px-3.5 py-2.5 text-[15px] ${TON[a.ton]}`}><Text text={a.text} /></li>
        ))}
      </ul>
    </>
  );
}
