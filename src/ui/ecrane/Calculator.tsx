'use client';

// Calculatorul e-DRIVE pe ecrane: un ecran = o întrebare (docs/flux-edrive.md v2).
// Starea = răspunsurile + ecranul afișat. „Înapoi” (și Back-ul browserului) = ecranul de dinainte
// din drum; înainte = automat după răspuns. Progresul de sus e mereu vizibil.

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RaspunsAnaf } from '@/motor/edrive/anaf';
import { altCui, raspunde, toateUE } from '@/scenariu/actiuni';
import type { CacheAnaf, Raspunsuri } from '@/scenariu/context';
import { anteriorul, deruleaza, ecranul, progresEtape, urmatorul, type Derulare, type Ecran } from '@/scenariu/derulare';
import { PROGRAM, REZULTAT, SCENARIU } from '@/scenariu/edrive';
import type { Etapa, Optiune } from '@/scenariu/tipuri';
import { Antet, BandaProgram, Subsol } from '../Rama';
import { useMiscare } from '../miscare';
import { EcranCautare } from './EcranCautare';
import { EcranCui } from './EcranCui';
import { EcranFirma } from './EcranFirma';
import { EcranIntrebare } from './EcranIntrebare';
import { EcranOprire } from './EcranOprire';
import { EcranRezultat } from './EcranRezultat';
import { FoaieTrimitere } from './FoaieTrimitere';
import { Progres } from './Progres';

const ANAF_INDISPONIBIL: RaspunsAnaf = { ok: false, cod: 'anaf_indisponibil', mesaj: 'ANAF nu răspunde.' };

/** Cât din linia progresului e plină: fiecare etapă (firma, mașinile, prețul) are o treime. */
function umplereDin(d: Derulare, e: Ecran): number {
  if (e.tip === 'rezultat') return 1;
  const p = progresEtape(d);
  const parte = (k: Etapa) => (p[k].total ? p[k].raspunse / p[k].total : 0);
  return (parte('firma') + parte('masini') + parte('pret')) / 3;
}

export function Calculator() {
  const [r, setR] = useState<Raspunsuri>({});
  const [cache, setCache] = useState<CacheAnaf>({});
  const [curent, setCurent] = useState<string | null>(null);
  const [dir, setDir] = useState(1);
  const [umplere, setUmplere] = useState(0);
  const [trimisa, setTrimisa] = useState(false);
  const [foaie, setFoaie] = useState(false);
  const { ecran: varianteEcran, redus } = useMiscare();
  const istoric = useRef(0);
  const prima = useRef(true);

  const der = useMemo(() => deruleaza(SCENARIU, r, cache), [r, cache]);
  const ecran = ecranul(der, curent);

  /** Merge la un ecran și lasă o urmă în istoria browserului (pentru Back). */
  const mergi = useCallback((cheie: string, directie: number) => {
    setDir(directie);
    setCurent(cheie);
    window.history.pushState({ ecran: cheie }, '');
    istoric.current++;
  }, []);

  const faInapoi = useCallback(() => {
    const a = anteriorul(der, ecran.cheie);
    if (!a) return;
    setDir(-1);
    setCurent(a.cheie);
  }, [der, ecran.cheie]);

  // Back-ul browserului / telefonului face același lucru ca „← Înapoi”.
  const faInapoiRef = useRef(faInapoi);
  useEffect(() => {
    faInapoiRef.current = faInapoi;
  }, [faInapoi]);
  useEffect(() => {
    const laPop = () => {
      istoric.current = Math.max(0, istoric.current - 1);
      faInapoiRef.current();
    };
    window.addEventListener('popstate', laPop);
    return () => window.removeEventListener('popstate', laPop);
  }, []);

  const inapoi = useCallback(() => {
    if (istoric.current > 0) window.history.back();
    else faInapoi();
  }, [faInapoi]);

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

  const laRaspuns = useCallback((pas: string, valoare: string) => {
    const nou = raspunde(SCENARIU, r, pas, valoare);
    const d2 = deruleaza(SCENARIU, nou, cache);
    const urm = urmatorul(d2, pas);
    setR(nou);
    // linia nu coboară vizibil: doar se încetinește când aflăm că sunt mai multe întrebări
    setUmplere((u) => Math.max(u, umplereDin(d2, urm)));
    mergi(urm.cheie, 1);
  }, [r, cache, mergi]);

  const laAltCui = useCallback(() => {
    setR((x) => altCui(SCENARIU, x));
    setUmplere(0);
    setTrimisa(false);
    mergi('cui', -1);
  }, [mergi]);

  const laActiune = useCallback((o: Optiune) => {
    const a = o.actiune;
    if (!a) return;
    if (a.tip === 'altCui') laAltCui();
    else if (a.tip === 'inapoi') mergi(a.pas, -1);
  }, [laAltCui, mergi]);

  const laEtapa = useCallback((e: Etapa) => {
    const prim = der.ecrane.find((x) => x.etapa === e && x.tip !== 'cautare');
    if (prim) mergi(prim.cheie, -1);
  }, [der, mergi]);

  // Focusul urmează ecranul: primul element interactiv, fără derulare (nu și la prima încărcare
  // pe telefon, ca să nu sară tastatura).
  const laIntrare = useCallback((nod: HTMLElement | null) => {
    if (!nod) return;
    if (prima.current) {
      prima.current = false;
      if (!window.matchMedia('(pointer: fine)').matches) return;
    }
    const tinta = nod.querySelector<HTMLElement>('[data-focus]') ?? nod.querySelector<HTMLElement>('button, input, a[href]');
    tinta?.focus({ preventScroll: true });
  }, []);

  const ctx = der.ctx;
  const incadrat = ctx.evaluare.incadrare.status === 'imm' && (der.acceptate.firma === 'da' || ctx.estimat);
  const pePrimul = !anteriorul(der, ecran.cheie);
  const laInapoi = pePrimul ? undefined : inapoi;

  const deseneaza = () => {
    switch (ecran.tip) {
      case 'cui':
        return <EcranCui key={ecran.raspuns ?? ''} ecran={ecran} initial={r.cui ?? ''} laRaspuns={(v) => laRaspuns('cui', v)} />;
      case 'cautare':
        return <EcranCautare text={ecran.text} />;
      case 'cardFirma':
        return <EcranFirma ecran={ecran} laRaspuns={laRaspuns} laInapoi={laInapoi} />;
      case 'intrebare':
        return <EcranIntrebare ecran={ecran} laRaspuns={laRaspuns} laActiune={laActiune} laInapoi={laInapoi} />;
      case 'oprire':
        return <EcranOprire ecran={ecran} laActiune={laActiune} laInapoi={laInapoi} />;
      case 'rezultat':
        return (
          <EcranRezultat
            ctx={ctx}
            trimisa={trimisa}
            laTrimite={() => setFoaie(true)}
            laAplicaUE={() => setR(toateUE)}
            laSchimba={() => mergi(REZULTAT.schimbaPas, -1)}
          />
        );
    }
  };

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <Antet />
        {/* banda programului doar pe S0, deasupra progresului; la plecare se strânge lin,
            iar progresul urcă pe locul lui */}
        <AnimatePresence initial={false}>
          {ecran.tip === 'cui' && (
            <motion.div
              key="banda"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={redus ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 32 }}
              className="overflow-hidden"
              data-banda-program
            >
              <BandaProgram program={PROGRAM} />
            </motion.div>
          )}
        </AnimatePresence>
        <Progres
          umplere={ecran.tip === 'rezultat' ? 1 : umplere}
          curenta={ecran.etapa}
          gata={ecran.tip === 'rezultat'}
          scor={incadrat && ecran.tip !== 'oprire' ? (ecran.tip === 'rezultat' ? ctx.rezultat.total : ctx.scor) : null}
          bani={ctx.rezultat.ajutor}
          laEtapa={laEtapa}
        />
        <main className="flex-1 overflow-x-clip">
          <AnimatePresence mode="wait" custom={dir} initial={false} onExitComplete={() => window.scrollTo({ top: 0 })}>
            <motion.div
              key={ecran.cheie}
              custom={dir}
              variants={varianteEcran}
              initial="intra"
              animate="centru"
              exit="iese"
              data-ecran={ecran.cheie}
              data-tip={ecran.tip}
              ref={laIntrare}
            >
              {deseneaza()}
            </motion.div>
          </AnimatePresence>
        </main>
        {ecran.tip === 'rezultat' && <Subsol />}
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
    </>
  );
}
