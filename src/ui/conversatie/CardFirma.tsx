'use client';

// Cardul firmei: denumirea, localitatea, categoria, angajații. Cifrele din bilanț stau ascunse
// în spatele unui „cifrele din bilanț” discret.

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { Element } from '@/scenariu/derulare';
import { localitate } from '@/scenariu/format';
import type { Optiune } from '@/scenariu/tipuri';
import { Text } from '../Text';
import { useMiscare } from '../miscare';
import { Pastila, RandCalculator, RandComprimat } from './Baloane';
import { Optiuni, idOptiune } from './Intrebari';

type ElCard = Extract<Element, { tip: 'cardFirma' }>;

export function CardFirma({
  el, focus, laRaspuns, laActiune, laSchimbare, laCorecteaza,
}: {
  el: ElCard;
  focus: boolean;
  laRaspuns: (pas: string, valoare: string) => void;
  laActiune: (o: Optiune) => void;
  laSchimbare: (pas: string) => void;
  laCorecteaza: () => void;
}) {
  const [cifre, setCifre] = useState(false);
  const { intrare, layout } = useMiscare();
  const { firma, pas, ctx } = el;
  const e = pas.etichete;
  const inc = ctx.incadrareAnaf;
  const categoria = inc?.status === 'imm' ? inc.marime.nume : inc?.status === 'neimm' ? e.neImm : e.necunoscut;
  const angajati = firma.bilant?.angajati;
  const lista = e.cifreLista(ctx);

  return (
    <div className="flex flex-col gap-3">
      <RandCalculator avatar={false}>
        <motion.section layout transition={layout} className="card max-w-[560px] p-4 sm:p-5" aria-label={firma.denumire ?? undefined}>
          <p className="eticheta-mica">CUI {firma.cui}</p>
          <h2 className="mt-0.5 text-mediu leading-snug">{firma.denumire}</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[15px]">
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
          {lista.length > 0 && (
            <div className="mt-3 border-t border-quaternary pt-2">
              <button
                type="button"
                aria-expanded={cifre}
                onClick={() => setCifre((x) => !x)}
                className="min-h-11 text-sm font-semibold text-primary underline decoration-quinary underline-offset-4 hover:decoration-primary"
              >
                {cifre ? e.cifreAscunde : e.cifre}
              </button>
              <AnimatePresence initial={false}>
                {cifre && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={layout}
                    className="overflow-hidden"
                  >
                    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 pb-1 text-sm">
                      {lista.map((x) => (
                        <div key={x.eticheta} className="contents">
                          <dt className="text-senary">{x.eticheta}</dt>
                          <dd className="text-right tabular-nums">{x.valoare}</dd>
                        </div>
                      ))}
                    </dl>
                    {!el.raspuns && (
                      <button type="button" onClick={laCorecteaza} className="min-h-11 text-sm font-semibold text-primary underline underline-offset-4">
                        {e.corecteaza}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.section>
      </RandCalculator>
      {el.raspuns ? (
        <RandComprimat scurt={el.scurt}>
          <Pastila id={idOptiune(el.cheie, el.raspuns.valoare)} text={el.raspuns.raspuns ?? el.raspuns.eticheta} laSchimbare={() => laSchimbare(el.cheie)} />
        </RandComprimat>
      ) : (
        <RandCalculator avatar={false}>
          <p className="font-semibold text-primary"><Text text={el.intrebare} /></p>
          <motion.div className="mt-2" variants={intrare} initial="ascuns" animate="vizibil">
            <Optiuni
              pas={el.cheie}
              optiuni={el.optiuni}
              focus={focus}
              laAlegere={(o) => (o.actiune ? laActiune(o) : laRaspuns(el.cheie, o.valoare))}
            />
          </motion.div>
        </RandCalculator>
      )}
    </div>
  );
}
