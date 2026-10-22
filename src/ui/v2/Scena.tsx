'use client';

// Scena variantei 2: doar întrebarea curentă (docs/flux-v2.md §2.1), sub card. Întrebarea, un rând
// de explicație, controlul (butoane / +− / comutator / glisoare / comutatoare multiple) și
// „Continuă” unde nu e avans automat. Plus butoanele opririi.

import { AnimatePresence, motion } from 'framer-motion';
import { CONTACT } from '@/scenariu/comun';
import type { EcranV2, Valori } from '@/scenariu/v2/tipuri';
import type { Optiune } from '@/scenariu/tipuri';
import { Text } from '../Text';
import { AlegereMultipla } from '../ecrane/AlegereMultipla';
import { Raspunsuri } from '../ecrane/Raspunsuri';
import { Inapoi } from '../ecrane/parti';
import { MOMENT, RAPID, atinge, useMiscare } from '../miscare';
import { Comutator, Glisor, PlusMinus, RandContinua } from './Controale';

type EcranIntrebare<C> = Extract<EcranV2<C>, { tip: 'intrebare' }>;

export function Intrebare({ text, explicatie }: { text: string; explicatie?: string | null }) {
  const { intra } = useMiscare();
  return (
    <motion.div {...intra(MOMENT.ecou)}>
      <h2 className="text-[24px] leading-[1.2] sm:text-[28px]" data-intrebare>
        <Text text={text} />
      </h2>
      {explicatie && <p className="mt-1.5 text-[15px] leading-snug text-senary"><Text text={explicatie} /></p>}
    </motion.div>
  );
}

export function EcranIntrebareV2<C>({
  ecran, valori, laValori, laTragere, laRaspuns, laActiune, laInapoi,
}: {
  ecran: EcranIntrebare<C>;
  /** valorile de pe controale (provizorii) */
  valori: Valori;
  laValori: (v: Valori) => void;
  laTragere: (activ: boolean) => void;
  laRaspuns: (v: Valori) => void;
  laActiune: (o: Optiune) => void;
  laInapoi?: () => void;
}) {
  const { intra, layout, redus } = useMiscare();
  const c = ecran.pas.control;
  const ctx = ecran.ctx;

  const control = () => {
    switch (c.tip) {
      case 'alegere':
        return (
          <>
            <Raspunsuri
              optiuni={c.optiuni(ctx)}
              raspuns={ecran.raspuns?.v ?? null}
              laAlegere={(o) => (o.actiune ? laActiune(o) : laRaspuns({ v: o.valoare }))}
            />
            <Inapoi laInapoi={laInapoi} />
          </>
        );
      case 'multipla':
        return (
          <AlegereMultipla
            optiuni={c.optiuni}
            raspuns={ecran.raspuns?.v ?? null}
            continua={c.continua}
            laSchimbare={(v) => laValori({ v })}
            laRaspuns={(v) => laRaspuns({ v })}
            laInapoi={laInapoi}
          />
        );
      case 'numar': {
        const max = c.max(ctx);
        const n = Math.min(max, Math.max(c.min, Number(valori.n)));
        return (
          <>
            <motion.div {...intra(MOMENT.optiuni)} className="py-2">
              <PlusMinus valoare={n} min={c.min} max={max} eticheta={ecran.text} laSchimbare={(x) => laValori({ n: String(x) })} />
            </motion.div>
            <RandContinua laInapoi={laInapoi} laContinua={() => laRaspuns({ n: String(n) })} />
          </>
        );
      }
      case 'comutator': {
        const fel = valori.fel ?? null;
        const cuNumar = !!fel && !!c.numar?.cand(fel);
        const max = c.numar ? c.numar.max(ctx) : 1;
        const n = Math.min(max, Math.max(c.numar?.min ?? 1, Number(valori.n ?? c.numar?.start ?? 1)));
        const scrie = (f: string, x = n) => laValori(c.numar?.cand(f) ? { fel: f, n: String(x) } : { fel: f });
        return (
          <>
            <motion.div {...intra(MOMENT.optiuni)}>
              <Comutator segmente={c.segmente(ctx)} valoare={fel} laSchimbare={(f) => scrie(f)} eticheta={ecran.text} />
              {c.nota && <p className="mt-2 text-[14px] leading-snug text-senary">{c.nota}</p>}
            </motion.div>
            <AnimatePresence initial={false}>
              {cuNumar && c.numar && (
                <motion.div
                  key="numar"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1, transition: redus ? { duration: 0 } : layout }}
                  exit={{ height: 0, opacity: 0, transition: RAPID }}
                  className="overflow-hidden"
                >
                  <p className="mt-4 text-center font-semibold text-primary">{c.numar.text}</p>
                  <div className="mt-2">
                    <PlusMinus valoare={n} min={c.numar.min} max={max} eticheta={c.numar.text} laSchimbare={(x) => scrie(fel as string, x)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <RandContinua laInapoi={laInapoi} activ={!!fel} laContinua={() => fel && laRaspuns(c.numar?.cand(fel) ? { fel, n: String(n) } : { fel })} />
          </>
        );
      }
      case 'glisoare': {
        const glisoare = c.glisoare(ctx);
        const v: Valori = Object.fromEntries(glisoare.map((g) => [g.cheie, valori[g.cheie] ?? String(g.start)]));
        return (
          <>
            <motion.div {...intra(MOMENT.optiuni)} className="flex flex-col gap-1">
              {glisoare.map((g) => (
                <Glisor
                  key={g.cheie}
                  g={g}
                  valoare={Number(v[g.cheie])}
                  laTragere={laTragere}
                  laSchimbare={(x) => laValori({ ...v, [g.cheie]: String(x) })}
                />
              ))}
            </motion.div>
            <RandContinua laInapoi={laInapoi} activ={Object.values(v).some((x) => Number(x) > 0)} laContinua={() => laRaspuns(v)} />
          </>
        );
      }
    }
  };

  return (
    <div className="pb-6 pt-4">
      <Intrebare text={ecran.text} explicatie={ecran.explicatie} />
      <div className="mt-4">{control()}</div>
    </div>
  );
}

/** Butoanele opririi (titlul și motivele sunt în card). */
export function ButoaneOprire({ butoane, laActiune, laInapoi }: { butoane: Optiune[]; laActiune: (o: Optiune) => void; laInapoi?: () => void }) {
  const { intra, apasare } = useMiscare();
  return (
    <div className="pb-6 pt-5">
      <motion.div {...intra(MOMENT.optiuni)} className="flex flex-col gap-2.5">
        {butoane.map((b, i) =>
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
    </div>
  );
}
