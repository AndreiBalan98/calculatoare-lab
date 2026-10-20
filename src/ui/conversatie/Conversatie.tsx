'use client';

// Conversația: desenează firul din scenariu (deruleaza), cu ritm („scrie…”), apariții line,
// derulare care urmărește întrebarea nouă și focus pe primul ei buton.

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RaspunsAnaf } from '@/motor/edrive/anaf';
import { altCui, anterior, raspunde, redeschide, toateUE } from '@/scenariu/actiuni';
import type { CacheAnaf, Raspunsuri } from '@/scenariu/context';
import { deruleaza, type Element } from '@/scenariu/derulare';
import { BANDA, REZULTAT, SCENARIU, TEXTE } from '@/scenariu/edrive';
import type { Optiune } from '@/scenariu/tipuri';
import { GlosarProvider } from '../Text';
import { useMiscare } from '../miscare';
import { BandaScor } from './BandaScor';
import { Balon, RandCalculator, Scrie } from './Baloane';
import { CardFirma } from './CardFirma';
import { FoaieTrimitere } from './FoaieTrimitere';
import { Intrebare, IntrebareCui } from './Intrebari';
import { Oprire } from './Oprire';
import { Rezultat } from './Rezultat';

const ANAF_INDISPONIBIL: RaspunsAnaf = { ok: false, cod: 'anaf_indisponibil', mesaj: 'ANAF nu răspunde.' };

/** Calculatorul „vorbește” (cu „scrie…” înainte) la tot ce nu e un indicator. */
const vorbeste = (e: Element) => e.tip !== 'cautare';

/** Cât „scrie” calculatorul: 400–700 ms, după lungimea mesajului. */
function pauza(e: Element, primul: boolean, redus: boolean): number {
  if (!primul) return redus ? 120 : 320;
  const lungime = e.tip === 'mesaj' || e.tip === 'intrebare' || e.tip === 'cui' ? e.text.length : 60;
  const ms = Math.min(700, Math.max(400, 380 + lungime * 3));
  return redus ? Math.round(ms / 2) : ms;
}

/** Elementul de dinainte a fost un răspuns al omului (deci acum calculatorul răspunde). */
const dupaOm = (e: Element | undefined) =>
  !e || ((e.tip === 'intrebare' || e.tip === 'cui' || e.tip === 'cardFirma') && !!e.raspuns) || e.tip === 'cautare';

export function Conversatie() {
  const [r, setR] = useState<Raspunsuri>({});
  const [cache, setCache] = useState<CacheAnaf>({});
  const [vazute, setVazute] = useState<Set<string>>(() => new Set());
  const [trimisa, setTrimisa] = useState(false);
  const [foaie, setFoaie] = useState(false);
  const [interactiune, setInteractiune] = useState(false);
  const { intrare, layout, redus } = useMiscare();
  const capat = useRef<HTMLDivElement>(null);
  const activRef = useRef<HTMLDivElement>(null);

  const der = useMemo(() => deruleaza(SCENARIU, r, cache), [r, cache]);

  // Ce se vede: elementele deja „spuse”, în ordine, până la primul nou.
  let k = 0;
  while (k < der.elemente.length && vazute.has(der.elemente[k].cheie)) k++;
  const vizibile = der.elemente.slice(0, k);
  const urmator = der.elemente[k];
  const scrie = !!urmator && vorbeste(urmator);

  // Ritmul: următorul element apare după „scrie…”.
  useEffect(() => {
    if (!urmator) return;
    const ms = vorbeste(urmator) ? pauza(urmator, dupaOm(der.elemente[k - 1]), redus) : 0;
    const t = setTimeout(() => setVazute((v) => new Set(v).add(urmator.cheie)), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urmator?.cheie]);

  // Căutarea la ANAF, prin ruta noastră.
  useEffect(() => {
    const cui = der.cauta;
    if (!cui) return;
    let activ = true;
    fetch(`/api/firma?cui=${encodeURIComponent(cui)}`)
      .then((res) => res.json() as Promise<RaspunsAnaf>)
      .catch(() => ANAF_INDISPONIBIL)
      .then((j) => {
        if (activ) setCache((c) => ({ ...c, [cui]: j && typeof j.ok === 'boolean' ? j : ANAF_INDISPONIBIL }));
      });
    return () => {
      activ = false;
    };
  }, [der.cauta]);

  // Derularea urmărește conversația (doar după ce omul a început).
  useEffect(() => {
    if (!interactiune) return;
    const t = setTimeout(() => {
      const el = activRef.current ?? capat.current;
      if (!el) return;
      const mare = el.getBoundingClientRect().height > window.innerHeight * 0.7;
      el.scrollIntoView({ behavior: redus ? 'auto' : 'smooth', block: mare ? 'start' : 'end' });
    }, 80);
    return () => clearTimeout(t);
  }, [k, scrie, interactiune, redus]);

  const actioneaza = useCallback((fn: (r: Raspunsuri) => Raspunsuri) => {
    setInteractiune(true);
    setR(fn);
  }, []);

  const laRaspuns = useCallback((pas: string, valoare: string) => actioneaza((x) => raspunde(SCENARIU, x, pas, valoare)), [actioneaza]);
  const laSchimbare = useCallback((pas: string) => actioneaza((x) => redeschide(x, pas)), [actioneaza]);
  const reia = useCallback(() => {
    setInteractiune(true);
    setTrimisa(false);
    setVazute(new Set());
    setR({});
  }, []);
  const laActiune = useCallback((o: Optiune) => {
    const a = o.actiune;
    if (!a) return;
    if (a.tip === 'altCui') actioneaza((x) => altCui(SCENARIU, x));
    else if (a.tip === 'reia') reia();
    else if (a.tip === 'inapoi') actioneaza((x) => redeschide(x, a.pas));
  }, [actioneaza, reia]);

  const arataBanda = vizibile.some((e) => e.cheie === BANDA.dupa) && der.ctx.evaluare.incadrare.status === 'imm';
  const activ = vizibile.length === der.elemente.length && !scrie ? der.activ : null;

  const deseneaza = (e: Element, i: number) => {
    const focus = interactiune && e.cheie === activ;
    const avatar = i === 0 || vizibile[i - 1].tip !== 'mesaj';
    switch (e.tip) {
      case 'mesaj':
        return (
          <RandCalculator avatar={avatar}>
            <Balon text={e.text} fel={e.fel} />
          </RandCalculator>
        );
      case 'cautare':
        return (
          <RandCalculator>
            <Scrie text={e.text} />
          </RandCalculator>
        );
      case 'cui':
        return (
          <IntrebareCui
            key={e.raspuns ? 'raspuns' : 'intrebare'}
            el={e}
            focus={focus || (!interactiune && !e.raspuns && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches)}
            anterior={r[anterior('cui')]}
            laRaspuns={(v) => laRaspuns('cui', v)}
            laSchimbare={() => laSchimbare('cui')}
          />
        );
      case 'cardFirma':
        return (
          <CardFirma
            el={e}
            focus={focus}
            laRaspuns={laRaspuns}
            laActiune={laActiune}
            laSchimbare={laSchimbare}
            laCorecteaza={() => actioneaza((x) => raspunde(SCENARIU, raspunde(SCENARIU, x, 'firma', 'corectez'), 'corectez', 'cifre'))}
          />
        );
      case 'intrebare':
        return (
          <Intrebare
            el={e}
            avatar={avatar}
            focus={focus}
            anterior={r[anterior(e.cheie)]}
            laRaspuns={laRaspuns}
            laActiune={laActiune}
            laSchimbare={laSchimbare}
          />
        );
      case 'oprire':
        return <Oprire el={e} laActiune={laActiune} />;
      case 'rezultat':
        return (
          <Rezultat
            ctx={der.ctx}
            trimisa={trimisa}
            laTrimite={() => setFoaie(true)}
            laAplicaUE={() => actioneaza(toateUE)}
          />
        );
    }
  };

  return (
    <GlosarProvider>
      <AnimatePresence>{arataBanda && <BandaScor key="banda" ctx={der.ctx} />}</AnimatePresence>
      <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-6 sm:pt-10">
        <LayoutGroup>
          <div role="log" aria-live="polite" aria-relevant="additions" className="flex flex-col gap-3.5">
            <AnimatePresence initial={false} mode="popLayout">
              {vizibile.map((e, i) => (
                <motion.div
                  key={e.cheie}
                  ref={e.cheie === activ || (activ === null && i === vizibile.length - 1) ? activRef : undefined}
                  layout="position"
                  transition={layout}
                  variants={intrare}
                  initial="ascuns"
                  animate="vizibil"
                  exit="iesire"
                  className="scroll-mb-6 scroll-mt-24"
                  data-element={e.tip}
                  data-cheie={e.cheie}
                >
                  {deseneaza(e, i)}
                </motion.div>
              ))}
              {scrie && (
                <motion.div key="scrie" layout="position" variants={intrare} initial="ascuns" animate="vizibil" exit="iesire">
                  <RandCalculator>
                    <Scrie />
                  </RandCalculator>
                </motion.div>
              )}
              {trimisa && (
                <motion.div key="trimisa" layout="position" variants={intrare} initial="ascuns" animate="vizibil">
                  <RandCalculator>
                    <Balon text={REZULTAT.trimisa} />
                  </RandCalculator>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
        <div ref={capat} className="scroll-mb-6" />
        {Object.keys(r).length > 0 && (
          <div className="mt-8 text-center">
            <button type="button" onClick={reia} className="min-h-11 px-3 text-sm text-senary underline underline-offset-4 hover:text-primary">
              {TEXTE.reia}
            </button>
          </div>
        )}
      </div>
      <FoaieTrimitere
        deschisa={foaie}
        laInchidere={() => setFoaie(false)}
        derulare={der}
        laTrimisa={() => {
          setFoaie(false);
          setTrimisa(true);
        }}
      />
    </GlosarProvider>
  );
}
