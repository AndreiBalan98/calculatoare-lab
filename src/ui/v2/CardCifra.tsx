'use client';

// Cardul cifrei (docs/flux-v2.md §2.2): singurul card din pagină, de la firmă până la rezultat.
// Se naște din câmpul CUI (layoutId „card”) și își schimbă înălțimea lin. De sus în jos: denumirea,
// categoria · localitatea, avertismentele; cifra care numără (sau oprirea); rândul de sub cifră (sau
// „de ce”-ul ei); indicatorul părții verzi (SME); șoapta; rezumatul (fiecare bucată = tap): un rând
// simplu sau „pastile”, în care zboară răspunsul dat (e-DRIVE).

import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TEXTE } from '@/scenariu/comun';
import type { BucataRand } from '@/scenariu/program';
import type { AntetCard, BucataRezumat, Cifra, Indicator, Soapta } from '@/scenariu/v2/tipuri';
import { useNumarAnimat } from '../NumarAnimat';
import { Text } from '../Text';
import { RAPID, RESORT, useMiscare } from '../miscare';

export interface Oprire {
  titlu: string;
  motive: string[];
  text: string;
}

/** Înălțimea care se schimbă lin (fără să deformeze conținutul). */
function InaltimeVie({ children }: { children: ReactNode }) {
  const { redus } = useMiscare();
  const interior = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | 'auto'>('auto');
  useLayoutEffect(() => {
    const el = interior.current;
    if (!el) return;
    const o = new ResizeObserver(() => setH(el.offsetHeight));
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    // marginile de 8px: focusul și umbrele nu se taie la margine
    <motion.div initial={false} animate={{ height: h }} transition={redus ? { duration: 0 } : RESORT} className="-mx-2 -my-1 overflow-hidden">
      <div ref={interior} className="px-2 py-1">{children}</div>
    </motion.div>
  );
}

/** Cifra mare, care numără la fiecare schimbare (și urmează degetul când omul trage). */
function NumarViu({ valoare, format, rapid, className }: { valoare: number; format: (n: number) => string; rapid: boolean; className: string }) {
  const v = useNumarAnimat(valoare, 0, rapid ? 0.18 : 0.6);
  return <span className={className}>{format(v)}</span>;
}

/** Rândul de sub cifră; la creșterea punctelor, „+N” auriu urcă și se estompează. */
function Rand({ bucati }: { bucati: BucataRand[] }) {
  const { redus } = useMiscare();
  const scor = bucati.find((b) => typeof b !== 'string' && b.castig);
  const valoare = scor && typeof scor !== 'string' ? scor.numar : null;
  const inainte = useRef(valoare);
  const [castig, setCastig] = useState<{ id: number; n: number } | null>(null);
  useEffect(() => {
    const vechi = inainte.current;
    inainte.current = valoare;
    if (valoare === null || vechi === null || valoare <= vechi || redus) return;
    const t0 = setTimeout(() => setCastig({ id: Date.now(), n: valoare - vechi }), 0);
    const t = setTimeout(() => setCastig(null), 1400);
    return () => {
      clearTimeout(t0);
      clearTimeout(t);
    };
  }, [valoare, redus]);

  return (
    <p className="relative mt-1 text-[15px] leading-snug text-senary" data-rand-cifra>
      {bucati.map((b, i) => (typeof b === 'string'
        ? <span key={i}>{b}</span>
        : <NumarCastig key={i} valoare={b.numar} format={b.format} />))}
      <AnimatePresence>
        {castig && (
          <motion.span
            key={castig.id}
            className="ml-1.5 inline-block font-semibold text-accent-dark"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [6, 0, -6, -14] }}
            transition={{ duration: 1.3, times: [0, 0.15, 0.6, 1] }}
            aria-hidden
          >
            +{castig.n}
          </motion.span>
        )}
      </AnimatePresence>
    </p>
  );
}

function NumarCastig({ valoare, format = (n) => String(Math.round(n)) }: { valoare: number; format?: (n: number) => string }) {
  const v = useNumarAnimat(valoare, valoare);
  return <span className="font-semibold text-primary tabular-nums">{format(v)}</span>;
}

/** Indicatorul părții verzi (SME): bara, reperul minimului, textul. */
function IndicatorVerde({ i }: { i: Indicator }) {
  const { redus } = useMiscare();
  return (
    <div className="mt-3" data-indicator data-ok={i.ok || undefined}>
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[14px] font-semibold text-base tabular-nums" data-verde>{i.eticheta}</span>
        <div className="relative h-2 flex-1 rounded-full bg-quaternary" aria-hidden>
          <motion.div
            className={`h-full rounded-full transition-colors duration-300 ${i.ok ? 'bg-activ' : 'bg-senary'}`}
            initial={false}
            animate={{ width: `${Math.min(1, i.parte) * 100}%` }}
            transition={redus ? { duration: 0 } : RESORT}
          />
          <span className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-primary" style={{ left: `${i.minim * 100}%` }} />
          <span className="absolute top-3 -translate-x-1/2 whitespace-nowrap text-[12px] leading-none text-senary" style={{ left: `${i.minim * 100}%` }}>
            {i.reper}
          </span>
        </div>
      </div>
      <div className="h-3" />
      {i.sub && <p className="mt-1 text-[14px] leading-snug text-base" data-indicator-sub>{i.sub}</p>}
    </div>
  );
}

/** De unde pleacă răspunsul dat (în scenă) spre pastila lui: poziția și textul de acolo. */
export interface Zbor {
  id: number;
  rect: { left: number; top: number; width: number; height: number };
  text: string;
}

const ZBOR_MS = 450;
const APRINS_MS = 1200;
const decelerat = (t: number) => 1 - (1 - t) ** 3;

/** Cheia stabilă a unei pastile: pasul și a câta bucată a lui e (textul se poate schimba). */
const cheiePastila = (b: BucataRezumat[], i: number) => `${b[i].pas}:${b.slice(0, i).filter((x) => x.pas === b[i].pas).length}`;

function Creion() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 text-senary" aria-hidden>
      <path d="M8.2 1.6l2.2 2.2-6.3 6.3-2.7.5.5-2.7 6.3-6.3z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Rezumatul ca „drumul tău” (docs/flux-v2.md §2.5, e-DRIVE): eticheta și pastilele (tap = schimbă).
 * La fiecare răspuns, textul ales zboară din scenă în pastila nouă, care se aprinde auriu (~1,2s);
 * o pastilă al cărei text se schimbă (ex. „2 mașini” → „2 autoturisme”) doar se aprinde. Fără zbor
 * când pastila nu e pe ecran sau la prefers-reduced-motion.
 */
function Pastile({ bucati, laRezumat, zbor }: { bucati: BucataRezumat[]; laRezumat: (b: BucataRezumat) => void; zbor: Zbor | null }) {
  const { redus } = useMiscare();
  const chei = bucati.map((_, i) => cheiePastila(bucati, i));
  const semnatura = chei.map((k, i) => `${k}=${bucati[i].text}`).join('|');
  const inainte = useRef<Map<string, string> | null>(null);
  const folosit = useRef<number | null>(zbor?.id ?? null);
  const noduri = useRef(new Map<string, HTMLElement>());
  const [aprinse, setAprinse] = useState<Record<string, number>>({});
  /** pastila în care zboară răspunsul: ascunsă până aterizează fantoma, apoi apare pe loc */
  const [ascunsa, setAscunsa] = useState<string | null>(null);
  const [aterizata, setAterizata] = useState<string | null>(null);
  const [fantoma, setFantoma] = useState<{ id: number; de: string; spre: string } | null>(null);
  const fantomaEl = useRef<HTMLDivElement>(null);
  const temporizatoare = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cadru = useRef<number | null>(null);

  useEffect(() => () => {
    temporizatoare.current.forEach(clearTimeout);
    if (cadru.current !== null) cancelAnimationFrame(cadru.current);
  }, []);

  useLayoutEffect(() => {
    const acum = new Map(chei.map((k, i) => [k, bucati[i].text]));
    const vechi = inainte.current;
    inainte.current = acum;
    const z = zbor && zbor.id !== folosit.current ? zbor : null;
    if (z) folosit.current = z.id;
    if (!vechi) return;
    const adaugate = chei.filter((k) => !vechi.has(k));
    const schimbate = chei.filter((k) => vechi.has(k) && vechi.get(k) !== acum.get(k));
    if (!adaugate.length && !schimbate.length) return;

    const aprinde = (ks: string[]) => {
      if (!ks.length) return;
      const t = Date.now();
      setAprinse((a) => ({ ...a, ...Object.fromEntries(ks.map((k) => [k, t])) }));
      temporizatoare.current.push(setTimeout(() => setAprinse((a) => {
        const b = { ...a };
        for (const k of ks) if (b[k] === t) delete b[k];
        return b;
      }), APRINS_MS));
    };

    const tinta = adaugate.length ? noduri.current.get(adaugate[adaugate.length - 1]) : null;
    const r = tinta?.getBoundingClientRect();
    const peEcran = !!r && r.top >= 0 && r.bottom <= window.innerHeight;
    if (!z || !tinta || !peEcran || redus) {
      aprinde([...adaugate, ...schimbate]);
      return;
    }

    // zborul: o „fantomă” (fixă, deasupra paginii) din poziția răspunsului spre pastila nouă, care
    // e urmărită la fiecare cadru (cardul își schimbă înălțimea în același timp)
    const cheie = adaugate[adaugate.length - 1];
    aprinde(schimbate);
    setAscunsa(cheie);
    setFantoma({ id: z.id, de: z.text, spre: acum.get(cheie) ?? '' });
    const start = performance.now();
    const pas = (t: number) => {
      const p = Math.min(1, (t - start) / ZBOR_MS);
      const e = decelerat(p);
      const el = fantomaEl.current;
      const spre = noduri.current.get(cheie)?.getBoundingClientRect();
      if (el && spre) {
        const x = z.rect.left + (spre.left - z.rect.left) * e;
        const y = z.rect.top + (spre.top - z.rect.top) * e;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.width = `${z.rect.width + (spre.width - z.rect.width) * e}px`;
        el.style.height = `${z.rect.height + (spre.height - z.rect.height) * e}px`;
        el.style.setProperty('--p', String(e));
      }
      if (p < 1) {
        cadru.current = requestAnimationFrame(pas);
        return;
      }
      cadru.current = null;
      setFantoma(null);
      setAscunsa(null);
      setAterizata(cheie);
      aprinde([...adaugate]);
    };
    cadru.current = requestAnimationFrame(pas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semnatura]);

  return (
    <>
    {bucati.length > 0 && (
    <div className="mt-3 border-t border-quaternary pt-2.5" data-rezumat data-pastile>
      <p className="text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-senary">Răspunsurile tale</p>
      <ul className="mt-1 flex flex-wrap gap-x-1.5">
        <AnimatePresence initial={false}>
          {bucati.map((b, i) => {
            const k = chei[i];
            const aprinsa = k in aprinse;
            return (
              <motion.li
                key={k}
                layout={redus ? false : 'position'}
                initial={redus ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: ascunsa === k ? 0 : 1, scale: 1, transition: ascunsa === k || aterizata === k ? { duration: 0 } : redus ? { duration: 0.12 } : RESORT }}
                exit={{ opacity: 0, transition: RAPID }}
                className="flex"
              >
                <button
                  type="button"
                  onClick={() => laRezumat(b)}
                  aria-label={`Schimbă: ${b.text}`}
                  className="group flex min-h-9 items-center rounded-full outline-offset-0"
                  data-nou={aprinsa || undefined}
                >
                  <motion.span
                    ref={(el: HTMLSpanElement | null) => {
                      if (el) noduri.current.set(k, el);
                      else noduri.current.delete(k);
                    }}
                    initial={false}
                    animate={aprinsa && !redus ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[15px] font-semibold leading-tight text-primary transition-colors [@media(max-height:759px)]:text-[14px] group-hover:border-primary group-focus-visible:border-primary group-active:border-primary ${
                      aprinsa ? 'border-accent bg-avertisment-fond duration-200' : 'border-quaternary bg-tertiary duration-700'
                    }`}
                  >
                    {b.text}
                    <Creion />
                  </motion.span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
    )}
      {fantoma && typeof document !== 'undefined' && createPortal(
        <div
          ref={fantomaEl}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-50 flex items-center rounded-full border border-accent bg-avertisment-fond px-2.5 text-[15px] font-semibold leading-tight text-primary shadow-[0_4px_14px_rgb(20_33_61/0.16)]"
          style={{ transform: `translate(${zbor?.rect.left ?? 0}px, ${zbor?.rect.top ?? 0}px)`, width: zbor?.rect.width, height: zbor?.rect.height }}
          data-fantoma
        >
          <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap" style={{ opacity: 'calc(1 - var(--p, 0) * 2)' }}>{fantoma.de}</span>
          <span className="whitespace-nowrap" style={{ opacity: 'calc(var(--p, 0) * 2 - 0.6)' }}>{fantoma.spre}</span>
        </div>,
        document.body,
      )}
    </>
  );
}

export function CardCifra({
  antet, cifra, oprire, soapta, laAplica, rezumat, laRezumat, pastile, zbor, compact, viu, tremura, evidentiaza,
}: {
  antet: AntetCard;
  cifra: Cifra | null;
  oprire: Oprire | null;
  soapta: Soapta | null;
  laAplica?: () => void;
  rezumat: BucataRezumat[];
  laRezumat: (b: BucataRezumat) => void;
  /** rezumatul ca pastile, cu zborul răspunsului (e-DRIVE) */
  pastile?: boolean;
  /** de unde pleacă ultimul răspuns dat (pentru zbor) */
  zbor?: Zbor | null;
  /** cifra mai mică (ecrane cu multe glisoare) */
  compact: boolean;
  /** omul trage de un glisor: cifra îl urmează fără întârziere */
  viu: boolean;
  /** un contor: la fiecare creștere, cardul tremură scurt (R-proiect) */
  tremura: number;
  /** un contor: la fiecare creștere, șoapta se evidențiază */
  evidentiaza: number;
}) {
  const { redus, intra } = useMiscare();
  const scutura = useAnimationControls();
  const lumina = useAnimationControls();
  useEffect(() => {
    if (tremura && !redus) void scutura.start({ x: [0, -4, 4, -4, 4, 0], transition: { duration: 0.36 } });
  }, [tremura, redus, scutura]);
  useEffect(() => {
    if (evidentiaza && !redus) {
      void lumina.start({
        backgroundColor: ['rgba(255,246,224,0)', '#FFF6E0', '#FFF6E0', 'rgba(255,246,224,0)'],
        transition: { duration: 1.4, times: [0, 0.15, 0.7, 1] },
      });
    }
  }, [evidentiaza, redus, lumina]);

  return (
    <motion.section
      layoutId="card"
      transition={redus ? { duration: 0.12 } : RESORT}
      className="card relative px-5 py-4 sm:px-7 sm:py-6"
      style={{ borderRadius: 6 }}
      aria-label={antet.titlu || undefined}
      data-card
    >
      <motion.div animate={scutura}>
        <InaltimeVie>
          <motion.div {...intra(0.05)}>
            <p className="font-serif text-[20px] font-semibold leading-snug text-primary" data-firma>{antet.titlu}</p>
            {/* compact: doar categoria · localitatea */}
            {(compact ? antet.randuri.slice(0, 1) : antet.randuri).map((r) => (
              <p key={r} className="text-[14px] leading-snug text-senary"><Text text={r} /></p>
            ))}
          </motion.div>
          {antet.avert.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {antet.avert.map((a) => (
                <li key={a} className="rounded-[4px] bg-avertisment-fond px-3 py-1.5 text-[13px] leading-snug text-avertisment"><Text text={a} /></li>
              ))}
            </ul>
          )}

          <AnimatePresence mode="popLayout" initial={false}>
            {oprire ? (
              <motion.div key="oprire" {...intra(0.1)} exit={{ opacity: 0, transition: RAPID }} className="mt-4" data-oprire-card>
                <h2 className="text-[22px] leading-snug" data-oprire>{oprire.titlu}</h2>
                {oprire.motive.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {oprire.motive.map((m) => (
                      <li key={m} className="flex gap-2 text-[15px] leading-snug text-senary">
                        <span aria-hidden>•</span>
                        <Text text={m} />
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-[15px] leading-snug text-senary"><Text text={oprire.text} /></p>
              </motion.div>
            ) : cifra ? (
              <motion.div key="cifra" initial={redus ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: RESORT }} exit={{ opacity: 0, transition: RAPID }} className={compact ? 'mt-2' : 'mt-4'}>
                <div
                  className="relative overflow-hidden"
                  data-cifra={cifra.cheie}
                  data-valoare={cifra.valoare}
                  data-gri={cifra.gri || undefined}
                  aria-label={cifra.eticheta ?? `${cifra.prefix ? `${cifra.prefix} ` : ''}${cifra.format(cifra.valoare)}${cifra.unitate ? ` ${cifra.unitate}` : ''}`}
                  role="img"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={cifra.cheie}
                      initial={redus ? { opacity: 0 } : { opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0, transition: redus ? { duration: 0.12 } : RESORT }}
                      exit={redus ? { opacity: 0 } : { opacity: 0, y: -14, transition: { duration: 0.2 } }}
                      aria-hidden
                    >
                      {/* prefixul pe rândul lui, deasupra: „Primești până la 300.000 €” nu încape pe un rând */}
                      {cifra.prefix && (
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.p
                            key={cifra.prefix}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { duration: 0.25 } }}
                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                            className="mb-1.5 text-[17px] leading-tight text-senary"
                            data-prefix
                          >
                            {cifra.prefix}
                          </motion.p>
                        </AnimatePresence>
                      )}
                      <p className={`flex items-baseline gap-2 whitespace-nowrap font-serif font-semibold leading-none transition-colors duration-500 ${cifra.gri ? 'text-senary' : 'text-primary'}`}>
                        <NumarViu
                          valoare={cifra.valoare}
                          format={cifra.format}
                          rapid={viu}
                          className={`tabular-nums ${compact ? 'text-[44px]' : cifra.format(cifra.valoare).length > 7 ? 'text-[48px] min-[380px]:text-[56px] sm:text-[72px]' : 'text-[56px] sm:text-[72px]'}`}
                        />
                        {cifra.unitate && <span className={compact ? 'text-[24px]' : 'text-[28px] sm:text-[36px]'}>{cifra.unitate}</span>}
                        {cifra.din && <span className="text-[28px] text-senary sm:text-[36px]" data-din>{cifra.din}</span>}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="popLayout" initial={false}>
                  {cifra.deCe ? (
                    <motion.p
                      key="deCe"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: 0.3 } }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      className="mt-2 text-[16px] leading-snug text-base"
                      data-de-ce
                    >
                      <Text text={cifra.deCe} />
                    </motion.p>
                  ) : (
                    <motion.div key="rand" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.15 } }} exit={{ opacity: 0 }}>
                      <Rand bucati={cifra.rand} />
                    </motion.div>
                  )}
                </AnimatePresence>
                {cifra.indicator && <IndicatorVerde i={cifra.indicator} />}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div aria-live="polite">
            <AnimatePresence initial={false}>
              {soapta && (
                <motion.p
                  key="soapta"
                  initial={redus ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: redus ? { duration: 0.12 } : RESORT }}
                  exit={{ opacity: 0, transition: RAPID }}
                  className="mt-3 text-[15px] leading-snug text-accent-dark"
                  data-soapta
                >
                  <motion.span animate={lumina} className="-mx-1.5 rounded-[4px] px-1.5 py-0.5" data-evidentiat={evidentiaza || undefined}>
                    <span aria-hidden>✦ </span>
                    <Text text={soapta.text} />
                    {soapta.aplica && laAplica && (
                      <>
                        {' '}
                        <button type="button" onClick={laAplica} className="font-semibold text-primary underline underline-offset-2 hover:text-secondary" data-aplica>
                          {TEXTE.aplica}
                        </button>
                      </>
                    )}
                  </motion.span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {pastile && <Pastile bucati={rezumat} laRezumat={laRezumat} zbor={zbor ?? null} />}
          {rezumat.length > 0 && !pastile && (
            <div className="mt-3 border-t border-quaternary pt-2.5" data-rezumat>
              <ul className="flex flex-wrap items-baseline text-[14px] leading-relaxed text-base">
                <AnimatePresence initial={false}>
                  {rezumat.map((b, i) => (
                    <motion.li
                      key={`${b.pas}:${b.text}`}
                      initial={redus ? { opacity: 0 } : { opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0, transition: redus ? { duration: 0.12 } : { ...RESORT, delay: 0.1 } }}
                      className="flex items-baseline"
                    >
                      <button
                        type="button"
                        onClick={() => laRezumat(b)}
                        aria-label={`Schimbă: ${b.text}`}
                        className="rounded-[2px] underline decoration-transparent decoration-1 underline-offset-4 transition-colors hover:decoration-quaternary focus-visible:decoration-quaternary"
                      >
                        {b.text}
                      </button>
                      {/* separatorul rămâne lângă bucata de dinainte, nu la început de rând */}
                      {i < rezumat.length - 1 && <span aria-hidden className="px-1.5 text-quinary">·</span>}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </InaltimeVie>
      </motion.div>
    </motion.section>
  );
}
