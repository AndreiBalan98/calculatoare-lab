'use client';

// Răspunsurile unui ecran (docs/flux-edrive.md §3.1): butoane mari pe toată lățimea, grilă la
// cifre și sume. La apăsare butonul se umple (bifă), celelalte se estompează, iar după ~350ms
// ecranul pleacă. „Mai multe” și „Altă sumă” se transformă în loc, în același ecran.
// Răspunsul dat mai devreme apare preselectat.

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { parseNum, verifica } from '@/motor/edrive/calc';
import { TEXTE } from '@/scenariu/comun';
import { euro } from '@/scenariu/format';
import type { AltaSuma, Optiune } from '@/scenariu/tipuri';
import { AVANS_MS, MOMENT, RAPID, atinge, useMiscare } from '../miscare';

export function Bifa({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`${className} shrink-0`} aria-hidden>
      <path d="M5 10.5l3.2 3.2L15 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Sageata() {
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0 text-quinary transition-colors group-hover:text-primary" aria-hidden>
      <path d="M4 10h11m-4-4.5L15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export /** Comutatorul nebifat: un cerc gol (nu duce nicăieri, deci fără săgeată). */
function Cerc() {
  return <span aria-hidden className="size-5 shrink-0 rounded-full border-[1.5px] border-quinary transition-colors group-hover:border-primary" />;
}

type Stare = 'normal' | 'ales' | 'preselectat' | 'estompat';

export function Buton({
  stare, patrat, onClick, children, detaliu, focus, index, className = '', eticheta, comutator,
}: {
  stare: Stare;
  patrat?: boolean;
  onClick: () => void;
  children: ReactNode;
  detaliu?: string;
  focus?: boolean;
  index: number;
  className?: string;
  eticheta?: string;
  /** buton-comutator (alegerea multiplă): aria-pressed mereu, intră în cascadă și când e ales */
  comutator?: boolean;
}) {
  const { redus, apasare } = useMiscare();
  const inCascada = comutator || stare === 'normal' || stare === 'preselectat';
  const stil = {
    normal: 'border-quaternary bg-white text-primary hover:border-primary',
    ales: 'border-primary bg-primary text-white',
    preselectat: 'border-primary bg-sfat-fond text-primary ring-1 ring-primary',
    estompat: 'border-quaternary bg-white text-primary opacity-40',
  }[stare];
  return (
    <motion.button
      type="button"
      initial={redus ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: stare === 'estompat' ? 0.4 : 1, y: 0, transition: { ...RAPID, duration: 0.2, delay: inCascada ? MOMENT.optiuni + index * MOMENT.cascada : 0 } }}
      exit={{ opacity: 0, scale: redus ? 1 : 0.96, transition: RAPID }}
      whileTap={apasare}
      onClick={onClick}
      data-focus={focus || undefined}
      aria-pressed={comutator ? stare === 'ales' : stare === 'preselectat' || stare === 'ales' ? true : undefined}
      aria-label={eticheta}
      className={`group flex w-full items-center gap-3 rounded-buton border text-left font-semibold leading-tight transition-[background-color,border-color,color] duration-150 ${stil} ${
        patrat ? 'h-14 justify-center text-[20px]' : `min-h-[52px] justify-between px-4 ${comutator ? 'py-2' : 'py-2.5'} text-[17px]`
      } ${className}`}
    >
      <span className={patrat ? '' : 'min-w-0'}>
        {children}
        {detaliu && <span className={`block text-[13px] font-normal ${stare === 'ales' ? 'text-quinary' : 'text-senary'}`}>{detaliu}</span>}
      </span>
      {!patrat && (stare === 'ales' || stare === 'preselectat' ? <Bifa /> : comutator ? <Cerc /> : <Sageata />)}
    </motion.button>
  );
}

export type SumaConfig = AltaSuma;

export function Raspunsuri({
  optiuni, raspuns, grila, sume, maiMulte, altaSuma, laAlegere, laSuma,
}: {
  optiuni: Optiune[];
  /** răspunsul dat mai devreme (preselectat) */
  raspuns: string | null;
  /** cifre: pătrate mari în grilă */
  grila?: boolean;
  /** sume: grilă pe 2 coloane */
  sume?: boolean;
  maiMulte?: { eticheta: string; de: number };
  altaSuma?: SumaConfig;
  laAlegere: (o: Optiune) => void;
  laSuma?: (valoare: string) => void;
}) {
  const { layout, intra } = useMiscare();
  const [ales, setAles] = useState<string | null>(null);
  const exact = altaSuma && raspuns && !raspuns.startsWith('~') && raspuns !== 'aceeasi' ? raspuns : null;
  const [extins, setExtins] = useState(!!maiMulte && raspuns !== null && Number(raspuns) >= maiMulte.de);
  const [alta, setAlta] = useState(false);
  const temporizator = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (temporizator.current) clearTimeout(temporizator.current);
  }, []);

  const alege = (o: Optiune) => {
    if (ales) return;
    atinge();
    setAles(o.valoare);
    temporizator.current = setTimeout(() => laAlegere(o), AVANS_MS);
  };

  const stare = (v: string): Stare => (ales ? (ales === v ? 'ales' : 'estompat') : raspuns === v ? 'preselectat' : 'normal');
  const preselectatVizibil = (lista: Optiune[]) => lista.some((o) => o.valoare === raspuns);

  let vizibile = optiuni;
  if (maiMulte) vizibile = optiuni.filter((o) => (extins ? Number(o.valoare) >= maiMulte.de : Number(o.valoare) < maiMulte.de));
  const focusPe = preselectatVizibil(vizibile) ? raspuns : vizibile[0]?.valoare;

  const coloane = grila ? (extins ? 'grid-cols-3' : 'grid-cols-4') : sume ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <motion.div layout transition={layout} className="relative">
      <AnimatePresence mode="popLayout" initial={false}>
        {alta && altaSuma && laSuma ? (
          <FormularSuma key="alta" config={altaSuma} initial={exact} laSuma={laSuma} laRenunta={() => setAlta(false)} />
        ) : (
          <motion.div key={extins ? 'mari' : 'mici'} className={`grid gap-2.5 ${coloane}`} exit={{ opacity: 0, transition: RAPID }}>
            {vizibile.map((o, i) => (
              <Buton
                key={o.valoare}
                index={i}
                stare={stare(o.valoare)}
                patrat={grila}
                detaliu={o.detaliu}
                focus={o.valoare === focusPe}
                onClick={() => alege(o)}
                className={sume && o.valoare === 'aceeasi' ? 'col-span-2' : ''}
              >
                {o.eticheta}
              </Buton>
            ))}
            {maiMulte && !extins && (
              <Buton index={vizibile.length} stare={ales ? 'estompat' : 'normal'} onClick={() => !ales && setExtins(true)} className="col-span-4">
                {maiMulte.eticheta}
              </Buton>
            )}
            {altaSuma && laSuma && (
              <Buton
                index={vizibile.length}
                stare={ales ? 'estompat' : exact ? 'preselectat' : 'normal'}
                focus={!!exact && !preselectatVizibil(vizibile)}
                onClick={() => !ales && setAlta(true)}
              >
                {altaSuma.eticheta}
                {exact && <span className="block text-[13px] font-normal text-senary">{(altaSuma.format ?? euro)(Number(exact))}</span>}
              </Buton>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {maiMulte && extins && !ales && (
        <motion.button {...intra(0.3)} type="button" onClick={() => setExtins(false)} className="mt-2 min-h-11 text-[15px] text-senary hover:text-primary hover:underline">
          {TEXTE.maiPutine}
        </motion.button>
      )}
    </motion.div>
  );
}

function FormularSuma({
  config, initial, laSuma, laRenunta,
}: { config: SumaConfig; initial: string | null; laSuma: (v: string) => void; laRenunta: () => void }) {
  const [text, setText] = useState(initial ? Number(initial).toLocaleString('ro-RO') : '');
  const [eroare, setEroare] = useState<string | null>(null);
  const [trimis, setTrimis] = useState(false);
  const camp = useRef<HTMLInputElement>(null);
  const { apasare, redus } = useMiscare();
  useEffect(() => {
    camp.current?.focus({ preventScroll: true });
  }, []);

  const trimite = (e: FormEvent) => {
    e.preventDefault();
    if (trimis) return;
    const v = parseNum(text, true);
    const err = verifica(v, false);
    if (err) {
      setEroare(err === 'req' ? config.eroare : err);
      return;
    }
    atinge();
    setTrimis(true);
    setTimeout(() => laSuma(String(v)), 150);
  };

  return (
    <motion.form
      onSubmit={trimite}
      initial={redus ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { ...RAPID, duration: 0.2 } }}
      exit={{ opacity: 0, transition: RAPID }}
      className="flex flex-col gap-2"
    >
      <label htmlFor="alta-suma" className="text-[15px] font-semibold text-primary">{config.eticheta}</label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            ref={camp}
            id="alta-suma"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            placeholder={config.placeholder}
            value={text}
            data-focus
            aria-invalid={!!eroare}
            aria-describedby={eroare ? 'alta-suma-eroare' : undefined}
            onChange={(e) => {
              setText(e.target.value);
              setEroare(null);
            }}
            className={`camp h-[52px] ${(config.unitate ?? '€').length > 1 ? 'pr-12' : 'pr-10'} text-[19px]`}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-senary">{config.unitate ?? '€'}</span>
        </div>
        <motion.button type="submit" whileTap={apasare} className={`btn-plin h-[52px] shrink-0 ${trimis ? 'bg-secondary' : ''}`}>
          {trimis ? <Bifa /> : config.buton}
        </motion.button>
      </div>
      {eroare && <p id="alta-suma-eroare" className="text-sm text-eroare">{eroare}</p>}
      <button type="button" onClick={laRenunta} className="self-start min-h-11 text-[15px] text-senary hover:text-primary hover:underline">
        {TEXTE.inapoiLaSume}
      </button>
    </motion.form>
  );
}
