'use client';

// R · Rezultatul (singurul ecran care se derulează): scorul mare care numără, cele trei
// propoziții, bara banilor, antrenorul cu „Aplică”, „De știut”, drumul până la bani, nota.
// Butoanele de acțiune: fixe jos pe telefon, sub drum pe desktop.

import { AnimatePresence, motion } from 'framer-motion';
import type { Context } from '@/scenariu/context';
import { CONTACT, REZULTAT } from '@/scenariu/edrive';
import { euro } from '@/scenariu/format';
import { Text } from '../Text';
import { NumarAnimat } from '../NumarAnimat';
import { RESORT, atinge, useMiscare } from '../miscare';
import { Drum } from './Drum';
import { Coloana } from './parti';

const PAS = 0.12;

export function EcranRezultat({
  ctx, trimisa, laTrimite, laAplicaUE, laSchimba,
}: { ctx: Context; trimisa: boolean; laTrimite: () => void; laAplicaUE: () => void; laSchimba: () => void }) {
  const { intra, apasare, redus } = useMiscare();
  const r = ctx.rezultat;
  const peste = r.fara - r.ajutor;
  const totalBani = r.fara + r.tvaSuma || 1;
  const segmente = [
    { cheie: 'finantare', eticheta: REZULTAT.bara.finantare, valoare: r.ajutor, culoare: 'bg-primary' },
    { cheie: 'partea', eticheta: REZULTAT.bara.partea, valoare: peste, culoare: 'bg-accent' },
    { cheie: 'tva', eticheta: REZULTAT.bara.tva, valoare: r.tvaSuma, culoare: 'bg-quinary' },
  ].filter((s) => s.valoare > 0);
  const antrenor = REZULTAT.antrenor(ctx);
  const sfatUE = r.tips.find((t) => t.apply === 'ue');

  return (
    <div data-testid="rezultat">
      <Coloana className="pb-4 pt-6 sm:pt-10">
        <motion.div {...intra(0)}>
          <p className="eticheta-mica">{REZULTAT.eticheta}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <NumarAnimat valoare={r.total} className="font-serif text-[72px] font-semibold leading-none text-primary sm:text-[88px]" />
            <span className="text-senary">{REZULTAT.din}</span>
          </div>
          {ctx.estimat && <p className="mt-1 text-sm text-senary">{REZULTAT.estimat}</p>}
          <AnimatePresence initial={false}>
            {trimisa && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 font-semibold text-accent-dark"
                role="status"
              >
                {REZULTAT.primita}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-4 flex flex-col gap-1 text-[19px] leading-snug sm:text-mediu">
          {REZULTAT.propozitii(ctx).map((p, i) => (
            <motion.p key={p} {...intra(0.3 + i * PAS)}><Text text={p} /></motion.p>
          ))}
        </div>

        <motion.div {...intra(0.3 + 3 * PAS)} className="mt-6">
          <p className="eticheta-mica">{REZULTAT.bara.titlu}</p>
          <div className="mt-2 flex h-4 w-full overflow-hidden rounded-[4px] bg-quaternary/60" aria-hidden>
            {segmente.map((s, i) => (
              <motion.div
                key={s.cheie}
                className={`${s.culoare} h-full`}
                initial={{ width: 0 }}
                animate={{ width: `${(s.valoare / totalBani) * 100}%` }}
                transition={redus ? { duration: 0 } : { ...RESORT, delay: 0.7 + i * PAS }}
              />
            ))}
          </div>
          <ul className="mt-3 grid gap-1.5 text-[15px] sm:grid-cols-3 sm:gap-3">
            {segmente.map((s) => (
              <li key={s.cheie} className="flex items-baseline gap-2">
                <span aria-hidden className={`${s.culoare} inline-block size-2.5 shrink-0 translate-y-[1px] rounded-[2px]`} />
                <span className="text-senary">{s.eticheta}</span>
                <NumarAnimat valoare={s.valoare} format={euro} className="ml-auto font-semibold tabular-nums text-primary sm:ml-0" />
              </li>
            ))}
          </ul>
        </motion.div>

        <AnimatePresence initial={false}>
          {antrenor && (
            <motion.div
              key="antrenor"
              {...intra(0.3 + 4 * PAS)}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
              className="mt-6 rounded-r-card border-l-[3px] border-accent bg-white px-4 py-3"
              data-testid="antrenor-rezultat"
            >
              <p className="eticheta-mica">{REZULTAT.antrenorEticheta}</p>
              <p className="mt-0.5"><Text text={antrenor} /></p>
              {sfatUE && <p className="mt-1 text-[15px] text-senary">{sfatUE.text}</p>}
              {sfatUE && (
                <motion.button
                  type="button"
                  whileTap={apasare}
                  onClick={() => {
                    atinge();
                    laAplicaUE();
                  }}
                  className="btn-contur mt-3"
                >
                  {REZULTAT.aplica}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {r.avert.length > 0 && (
          <motion.div {...intra(0.3 + 5 * PAS)} className="mt-6">
            <p className="eticheta-mica">{REZULTAT.deStiut}</p>
            <ul className="mt-2 flex flex-col gap-2">
              {r.avert.map((a) => <li key={a} className="rounded-card bg-avertisment-fond px-3.5 py-2.5 text-[15px] text-avertisment">{a}</li>)}
            </ul>
          </motion.div>
        )}

        <div className="mt-6">
          <Drum facuti={trimisa ? 2 : 1} intarziere={0.3 + 6 * PAS} />
        </div>

        <motion.p {...intra(1.2)} className="mt-5 text-xs leading-relaxed text-senary">{REZULTAT.nota}</motion.p>
        <motion.div {...intra(1.2)}>
          <button type="button" onClick={laSchimba} className="-ml-2 mt-2 min-h-11 px-2 text-[15px] text-senary hover:text-primary hover:underline">
            {REZULTAT.schimba}
          </button>
        </motion.div>
      </Coloana>

      {/* Butoanele: fixe jos pe telefon, în pagină pe desktop */}
      <div className="sticky bottom-0 z-20 border-t border-quaternary bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgb(20_33_61/0.08)] sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:pb-10 sm:pt-0 sm:shadow-none">
        <div className="mx-auto flex max-w-[640px] flex-col gap-2 sm:flex-row sm:px-6">
          <motion.button
            type="button"
            whileTap={trimisa ? undefined : apasare}
            onClick={laTrimite}
            disabled={trimisa}
            className="btn-plin w-full sm:w-auto sm:flex-1"
            data-focus
          >
            {trimisa ? REZULTAT.trimisa : REZULTAT.trimite}
          </motion.button>
          <motion.a whileTap={apasare} href={CONTACT.tel} className="btn-contur w-full sm:w-auto sm:flex-1">
            {REZULTAT.suna}
          </motion.a>
        </div>
      </div>
    </div>
  );
}
