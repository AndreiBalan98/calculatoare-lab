'use client';

// Rezultatul: scorul mare care numără, cele trei propoziții, bara banilor, antrenorul, sfaturile,
// drumul până la bani și legătura cu noi.

import { AnimatePresence, motion } from 'framer-motion';
import type { Context } from '@/scenariu/context';
import { CONTACT, REZULTAT } from '@/scenariu/edrive';
import { euro } from '@/scenariu/format';
import { Text } from '../Text';
import { NumarAnimat } from '../NumarAnimat';
import { RESORT, atinge, useMiscare } from '../miscare';
import { Drum } from './Drum';

export function Rezultat({
  ctx, trimisa, laTrimite, laAplicaUE,
}: { ctx: Context; trimisa: boolean; laTrimite: () => void; laAplicaUE: () => void }) {
  const { cascada, intrare, apasare, redus } = useMiscare();
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
  const sfaturi = r.tips.filter((t) => !t.apply);

  return (
    <motion.div className="flex flex-col gap-4" variants={cascada} initial="ascuns" animate="vizibil" data-testid="rezultat">
      <motion.section variants={intrare} className="card p-5 sm:p-7">
        <p className="eticheta-mica">{REZULTAT.eticheta}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <NumarAnimat valoare={r.total} className="font-serif text-[64px] font-semibold leading-none text-primary sm:text-[80px]" />
          <span className="text-senary">{REZULTAT.din}</span>
        </div>
        {ctx.estimat && <p className="mt-1 text-sm text-senary">{REZULTAT.estimat}</p>}

        <div className="mt-4 flex flex-col gap-1 text-[19px] leading-snug sm:text-mediu">
          {REZULTAT.propozitii(ctx).map((p) => <p key={p}><Text text={p} /></p>)}
        </div>

        <div className="mt-6">
          <p className="eticheta-mica">{REZULTAT.bara.titlu}</p>
          <div className="mt-2 flex h-4 w-full overflow-hidden rounded-[4px] bg-tertiary" aria-hidden>
            {segmente.map((s, i) => (
              <motion.div
                key={s.cheie}
                className={`${s.culoare} h-full`}
                initial={{ width: 0 }}
                animate={{ width: `${(s.valoare / totalBani) * 100}%` }}
                transition={redus ? { duration: 0 } : { ...RESORT, delay: 0.15 + i * 0.12 }}
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
        </div>

        <AnimatePresence initial={false}>
          {antrenor && (
            <motion.div
              key="antrenor"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={RESORT}
              className="overflow-hidden"
            >
              <div className="mt-6 rounded-card border border-accent/60 border-l-[3px] border-l-accent p-4" data-testid="antrenor-rezultat">
                <p className="eticheta-mica">Antrenorul</p>
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {r.avert.length > 0 && (
          <div className="mt-6">
            <p className="eticheta-mica">{REZULTAT.deStiut}</p>
            <ul className="mt-2 flex flex-col gap-2">
              {r.avert.map((a) => <li key={a} className="rounded-card bg-avertisment-fond px-3.5 py-2.5 text-[15px] text-avertisment">{a}</li>)}
            </ul>
          </div>
        )}

        {sfaturi.length > 0 && (
          <div className="mt-6">
            <p className="eticheta-mica">{REZULTAT.sfaturi}</p>
            <ul className="mt-2 flex flex-col gap-2">
              {sfaturi.map((t) => <li key={t.text} className="rounded-card bg-sfat-fond px-3.5 py-2.5 text-[15px] text-primary"><Text text={t.text} /></li>)}
            </ul>
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-senary">{REZULTAT.nota}</p>
      </motion.section>

      <motion.div variants={intrare}>
        <Drum facuti={trimisa ? 2 : 1} />
      </motion.div>

      <motion.div variants={intrare} className="flex flex-col gap-2 sm:flex-row">
        {!trimisa && (
          <motion.button type="button" whileTap={apasare} onClick={laTrimite} className="btn-plin flex-1 sm:flex-none">
            {REZULTAT.trimite}
          </motion.button>
        )}
        <motion.a whileTap={apasare} href={CONTACT.tel} className="btn-contur flex-1 sm:flex-none">
          {REZULTAT.suna} · {CONTACT.telefon}
        </motion.a>
      </motion.div>
    </motion.div>
  );
}
