'use client';

// Varianta 2 „Cifra vie” (docs/flux-v2.md), pentru orice program v2. Sus, cardul cifrei (eroul),
// care se naște din câmpul CUI; dedesubt, linia de progres și scena cu întrebarea curentă. Starea =
// răspunsurile + ecranul afișat + valorile de pe controale (provizorii, până la „Continuă”). Cifra se
// calculează cu răspunsurile acceptate plus valorile provizorii; motorul dă cifrele. „Înapoi” (și
// Back-ul browserului) = ecranul de dinainte din drum; din rezumat, după răspuns, mergi la prima
// întrebare fără răspuns (sau înapoi la rezultat).

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RaspunsAnaf } from '@/motor/anaf';
import { curataCui } from '@/motor/cui';
import { altCui, raspunde } from '@/scenariu/actiuni';
import { deruleaza } from '@/scenariu/derulare';
import type { CacheAnaf, ContextBaza, Optiune, Raspunsuri } from '@/scenariu/tipuri';
import {
  anteriorulV2, contextProvizoriu, deruleazaV2, ecranulV2, implicite, urmatorulV2,
} from '@/scenariu/v2/derulare';
import type { EcranV2, ProgramV2, Soapta, Valori } from '@/scenariu/v2/tipuri';
import { Antet, BandaProgram, Subsol } from '../Rama';
import { GlosarContext } from '../Text';
import { FoaieTrimitere } from '../ecrane/FoaieTrimitere';
import { RESORT, atinge, useMiscare } from '../miscare';
import { CardCifra } from './CardCifra';
import { RezultatV2 } from './Rezultat';
import { ButoaneOprire, EcranIntrebareV2, Intrebare } from './Scena';

const ANAF_INDISPONIBIL: RaspunsAnaf = { ok: false, cod: 'anaf_indisponibil', mesaj: 'ANAF nu răspunde.' };

/** Linia de progres (2px): se umple pe un resort; pe CUI stă sub câmp și curge cât se caută firma. */
function Linie({ umplere, gata, cauta }: { umplere: number; gata: boolean; cauta?: boolean }) {
  const { redus } = useMiscare();
  return (
    <motion.div
      layoutId="linie"
      className="relative mt-3 h-0.5 w-full overflow-hidden rounded-full bg-quaternary"
      initial={false}
      animate={{ opacity: gata ? 0 : 1, transition: { delay: gata ? 0.5 : 0, duration: 0.4 } }}
      aria-hidden
      data-linie
    >
      {cauta ? (
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full bg-accent"
          initial={{ x: '-100%' }}
          animate={redus ? { x: '100%' } : { x: ['-100%', '300%'] }}
          transition={redus ? { duration: 0 } : { duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
        />
      ) : (
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${Math.round(Math.min(1, Math.max(0, umplere)) * 1000) / 10}%` }}
          transition={redus ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 24 }}
        />
      )}
    </motion.div>
  );
}

/** E1 · CUI: întrebarea și câmpul, al cărui chenar devine cardul firmei. Căutarea are loc în câmp. */
function ZonaCui<C>({
  ecran, text, initial, laCui,
}: { ecran: Extract<EcranV2<C>, { tip: 'cui' | 'cautare' }>; text: string; initial: string; laCui: (v: string) => void }) {
  const [cui, setCui] = useState(initial);
  const [eroare, setEroare] = useState<string | null>(null);
  const [modificat, setModificat] = useState(false);
  const { apasare, redus } = useMiscare();
  const p = ecran.pas;
  const cauta = ecran.tip === 'cautare';
  const err = eroare ?? (modificat || ecran.tip !== 'cui' ? null : ecran.eroare);

  return (
    <div className="pb-6 pt-1">
      <Intrebare text={text} />
      <form
        className="mt-4 flex flex-col gap-2.5 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (cauta) return;
          if (!curataCui(cui)) {
            setEroare(p.eroare);
            return;
          }
          atinge();
          setModificat(false);
          laCui(cui);
        }}
      >
        <label htmlFor="cui" className="sr-only">{p.campEticheta}</label>
        <motion.div
          layoutId="card"
          transition={redus ? { duration: 0.12 } : RESORT}
          style={{ borderRadius: 8 }}
          className={`relative flex h-[54px] min-w-0 items-center border sm:flex-1 bg-white transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--color-sfat-fond)] ${err ? 'border-eroare' : 'border-quaternary'}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {cauta ? (
              <motion.p key="caut" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate px-4 text-senary" role="status">
                {ecran.text}
              </motion.p>
            ) : (
              <motion.input
                key="camp"
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                id="cui"
                name="cui"
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="search"
                placeholder={p.placeholder}
                value={cui}
                data-focus
                aria-invalid={!!err}
                aria-describedby={err ? 'cui-eroare' : undefined}
                onChange={(e) => {
                  setCui(e.target.value);
                  setEroare(null);
                  setModificat(true);
                }}
                className="h-full w-full min-w-0 rounded-camp bg-transparent px-4 text-[20px] tracking-wide text-base outline-none placeholder:text-senary/70"
              />
            )}
          </AnimatePresence>
        </motion.div>
        <motion.button type="submit" whileTap={cauta ? undefined : apasare} disabled={cauta} className="btn-plin h-[54px] shrink-0 sm:px-8">
          {p.buton}
        </motion.button>
      </form>
      <Linie umplere={0} gata={false} cauta={cauta} />
      {err && <p id="cui-eroare" role="alert" className="mt-2 text-[15px] text-eroare">{err}</p>}
    </div>
  );
}

export function CalculatorV2<C extends ContextBaza>({ program }: { program: ProgramV2<C> }) {
  const v1 = program.v1;
  const [r, setR] = useState<Raspunsuri>({});
  const [cache, setCache] = useState<CacheAnaf>({});
  const [curent, setCurent] = useState<string | null>(null);
  const [dir, setDir] = useState(1);
  const [umplere, setUmplere] = useState(0);
  const [trimisa, setTrimisa] = useState(false);
  const [foaie, setFoaie] = useState(false);
  /** valorile de pe controalele ecranului afișat (nu sunt încă răspuns) */
  const [prov, setProv] = useState<{ cheie: string; v: Valori } | null>(null);
  const [viu, setViu] = useState(false);
  const [tremura, setTremura] = useState(0);
  const [evidentiaza, setEvidentiaza] = useState(0);
  /** am sărit la o întrebare din rezumat: după răspuns, la prima fără răspuns */
  const dinRezumat = useRef(false);
  const { ecran: varianteEcran, redus } = useMiscare();
  const istoric = useRef(0);
  const prima = useRef(true);

  const d = useMemo(() => deruleazaV2(program, r, cache), [program, r, cache]);
  const ecran = ecranulV2(d, curent);
  const peCui = ecran.tip === 'cui' || ecran.tip === 'cautare';

  // Valorile de pe controale: cele atinse; altfel răspunsul dat / valorile de pornire.
  const atinse = ecran.tip === 'intrebare' && prov?.cheie === ecran.cheie ? prov.v : null;
  const control = ecran.tip === 'intrebare' ? atinse ?? implicite(ecran) : null;
  // Cifra le urmează de la prima atingere (sau de la intrare, unde pasul o cere).
  const pentruCifra = ecran.tip === 'intrebare' ? atinse ?? (ecran.pas.cifraDinStart ? control : null) : null;
  const ctx = pentruCifra ? contextProvizoriu(program, d, ecran, pentruCifra, cache) : d.ctx;

  /** Merge la un ecran și lasă o urmă în istoria browserului (pentru Back). */
  const mergi = useCallback((cheie: string, directie: number) => {
    setDir(directie);
    setCurent(cheie);
    setProv(null);
    window.history.pushState({ ecran: cheie }, '');
    istoric.current++;
  }, []);

  const faInapoi = useCallback(() => {
    const a = anteriorulV2(d, ecran.cheie);
    if (!a) return;
    dinRezumat.current = false;
    setDir(-1);
    setCurent(a.cheie);
    setProv(null);
  }, [d, ecran.cheie]);

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
    const cui = d.cauta;
    if (!cui) return;
    let activ = true;
    fetch(`/api/firma?cui=${encodeURIComponent(cui)}${v1.istoric ? '&istoric=1' : ''}`)
      .then((res) => res.json() as Promise<RaspunsAnaf>)
      .catch(() => ANAF_INDISPONIBIL)
      .then((j) => {
        if (activ) setCache((c) => ({ ...c, [cui]: j && typeof j.ok === 'boolean' ? j : ANAF_INDISPONIBIL }));
      });
    return () => {
      activ = false;
    };
  }, [d.cauta, v1.istoric]);

  /** Noile răspunsuri, apoi ecranul următor (sau prima întrebare fără răspuns, venind din rezumat). */
  const avanseaza = useCallback((r2: Raspunsuri, dupa: string) => {
    const d2 = deruleazaV2(program, r2, cache);
    const urm = dinRezumat.current ? d2.ecrane[d2.ecrane.length - 1] : urmatorulV2(d2, dupa);
    if (urm.tip === 'rezultat' || urm.tip === 'oprire') dinRezumat.current = false;
    setR(r2);
    // linia nu coboară vizibil: doar se încetinește când aflăm că sunt mai multe întrebări
    setUmplere((u) => Math.max(u, d2.umplere));
    mergi(urm.cheie, 1);
  }, [program, cache, mergi]);

  const laCui = useCallback((text: string) => avanseaza(raspunde(v1.scenariu, r, 'cui', text), 'cui'), [avanseaza, v1.scenariu, r]);

  const laRaspuns = useCallback((v: Valori) => {
    if (ecran.tip !== 'intrebare') return;
    // R-proiect: cu un proiect care nu se încadrează nu se trece mai departe
    if (ecran.pas.blocheaza?.(contextProvizoriu(program, d, ecran, v, cache))) {
      setTremura((x) => x + 1);
      setEvidentiaza((x) => x + 1);
      return;
    }
    avanseaza(ecran.pas.scrie(r, v, ecran.ctx), ecran.cheie);
  }, [ecran, program, d, cache, r, avanseaza]);

  const laAltCui = useCallback(() => {
    setR((x) => altCui(v1.scenariu, x));
    setUmplere(0);
    setTrimisa(false);
    dinRezumat.current = false;
    mergi('cui', -1);
  }, [v1.scenariu, mergi]);

  const laActiune = useCallback((o: Optiune) => {
    const a = o.actiune;
    if (!a) return;
    if (a.tip === 'altCui') laAltCui();
    else if (a.tip === 'inapoi') mergi(a.pas, -1);
  }, [laAltCui, mergi]);

  const laRezumat = useCallback((pas: string) => {
    atinge();
    dinRezumat.current = true;
    mergi(pas, -1);
  }, [mergi]);

  // Focusul urmează ecranul: primul element interactiv, fără derulare (nu și la prima încărcare
  // pe telefon, ca să nu sară tastatura).
  const laIntrare = useCallback((nod: HTMLElement | null) => {
    if (!nod) return;
    if (prima.current) {
      prima.current = false;
      if (!window.matchMedia('(pointer: fine)').matches) return;
    }
    const tinta = nod.querySelector<HTMLElement>('[data-focus]') ?? nod.querySelector<HTMLElement>('button, input, a[href], [tabindex="0"]');
    tinta?.focus({ preventScroll: true });
  }, []);

  const vedere = ecran.tip === 'rezultat' ? v1.rezultat(d.ctx) : null;

  let soapta: Soapta | null = null;
  let laAplica: (() => void) | undefined;
  if (vedere?.antrenor) {
    soapta = { text: vedere.antrenor.text, aplica: vedere.antrenor.aplica };
    laAplica = () => {
      atinge();
      setR((x) => v1.aplica(x, d.ctx));
    };
  } else if (ecran.tip === 'intrebare') {
    soapta = ecran.pas.soapta?.(ctx, control) ?? null;
    const aplica = ecran.pas.aplica;
    if (aplica && control) {
      laAplica = () => {
        atinge();
        const a = aplica(r, control, ctx);
        setR(a.r);
        setProv({ cheie: ecran.cheie, v: a.v });
      };
    }
  }

  const pePrimul = !anteriorulV2(d, ecran.cheie);
  const laInapoi = pePrimul ? undefined : inapoi;

  const deseneaza = () => {
    switch (ecran.tip) {
      case 'cui':
      case 'cautare':
        return <ZonaCui key={ecran.tip === 'cui' ? ecran.raspuns ?? '' : 'caut'} ecran={ecran} text={program.cui.text} initial={r.cui ?? ''} laCui={laCui} />;
      case 'intrebare':
        return (
          <EcranIntrebareV2
            ecran={ecran}
            valori={control ?? {}}
            laValori={(v) => setProv({ cheie: ecran.cheie, v })}
            laTragere={setViu}
            laRaspuns={laRaspuns}
            laActiune={laActiune}
            laInapoi={laInapoi}
          />
        );
      case 'oprire':
        return <ButoaneOprire butoane={ecran.pas.butoane} laActiune={laActiune} laInapoi={laInapoi} />;
      case 'rezultat':
        return (
          <RezultatV2
            vedere={vedere!}
            drum={v1.drum}
            trimisa={trimisa}
            laTrimite={() => setFoaie(true)}
            laInapoi={laInapoi}
          />
        );
    }
  };

  return (
    <GlosarContext.Provider value={v1.glosar}>
      <div className="flex min-h-dvh flex-col" data-varianta="2">
        <Antet />
        {/* banda programului doar pe E1; la plecare se strânge lin */}
        <AnimatePresence initial={false}>
          {peCui && (
            <motion.div
              key="banda"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={redus ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 32 }}
              className="overflow-hidden"
              data-banda-program
            >
              <BandaProgram program={v1.banda} />
            </motion.div>
          )}
        </AnimatePresence>
        <main className="flex-1 overflow-x-clip">
          <div className="mx-auto w-full max-w-[592px] px-4 pt-4 sm:pt-8">
            <LayoutGroup>
              {!peCui && (
                <>
                  <CardCifra
                    antet={program.antet(ctx)}
                    cifra={ecran.tip === 'oprire' ? null : program.cifra(ctx, d, ecran)}
                    oprire={ecran.tip === 'oprire' ? { titlu: ecran.titlu, motive: ecran.motive, text: ecran.text } : null}
                    soapta={soapta}
                    laAplica={laAplica}
                    rezumat={ecran.tip === 'oprire' ? [] : d.rezumat}
                    laRezumat={laRezumat}
                    compact={ecran.tip === 'intrebare' && !!ecran.pas.compact?.(ecran.ctx)}
                    viu={viu}
                    tremura={tremura}
                    evidentiaza={evidentiaza}
                  />
                  <Linie umplere={ecran.tip === 'rezultat' ? 1 : umplere} gata={ecran.tip === 'rezultat' || ecran.tip === 'oprire'} />
                </>
              )}
              <AnimatePresence mode="wait" custom={dir} initial={false} onExitComplete={() => window.scrollTo({ top: 0 })}>
                <motion.div
                  key={peCui ? 'cui' : ecran.cheie}
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
            </LayoutGroup>
          </div>
        </main>
        {ecran.tip === 'rezultat' && <Subsol />}
      </div>
      <FoaieTrimitere
        deschisa={foaie}
        laInchidere={() => setFoaie(false)}
        // analiza v1, cu răspunsurile v2 (aceleași chei) și varianta
        analiza={(contact) => ({ ...(v1.analiza({ ...deruleaza(v1.scenariu, r, cache), ctx: d.ctx }, contact) as object), varianta: 'v2' })}
        laTrimisa={() => {
          setFoaie(false);
          setTrimisa(true);
        }}
      />
    </GlosarContext.Provider>
  );
}
