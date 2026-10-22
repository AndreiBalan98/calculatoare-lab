'use client';

// Controalele variantei 2 (docs/flux-v2.md §2.8): +/− (pasul), comutatorul segmentat, glisorul și
// rândul „← Înapoi · Continuă”. Manipulare directă: valoarea se schimbă în timp ce omul apasă sau
// trage, iar cifra din card o urmează; răspunsul se dă abia la „Continuă”.

import { motion } from 'framer-motion';
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { parseNum } from '@/motor/edrive/calc';
import { TEXTE } from '@/scenariu/comun';
import type { Glisor as DateGlisor, Segment } from '@/scenariu/v2/tipuri';
import { useNumarAnimat } from '../NumarAnimat';
import { RESORT, atinge, useMiscare } from '../miscare';

const limita = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** +/−: două butoane rotunde, cifra între ele (numără). */
export function PlusMinus({
  valoare, min, max, laSchimbare, eticheta,
}: { valoare: number; min: number; max: number; laSchimbare: (n: number) => void; eticheta: string }) {
  const { apasare } = useMiscare();
  const afisat = useNumarAnimat(valoare, valoare, 0.35);
  const buton = (semn: '−' | '+', nou: number, nume: string, activ: boolean) => (
    <motion.button
      type="button"
      whileTap={activ ? apasare : undefined}
      disabled={!activ}
      onClick={() => laSchimbare(nou)}
      aria-label={nume}
      className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-primary bg-white text-[26px] leading-none text-primary transition-colors hover:bg-sfat-fond active:bg-primary active:text-white disabled:border-quaternary disabled:text-quinary disabled:hover:bg-white"
      data-focus={semn === '+' || undefined}
    >
      <span aria-hidden>{semn}</span>
    </motion.button>
  );
  return (
    <div role="group" aria-label={eticheta} className="flex items-center justify-center gap-8" data-plus-minus>
      {buton('−', valoare - 1, 'Mai puține', valoare > min)}
      <output aria-live="polite" className="min-w-[2ch] text-center font-serif text-[40px] font-semibold leading-none text-primary tabular-nums" data-valoare={valoare}>
        {Math.round(afisat)}
      </output>
      {buton('+', valoare + 1, 'Mai multe', valoare < max)}
    </div>
  );
}

/** Comutatorul segmentat: segmentul ales are fond `primary` și alunecă între segmente. */
export function Comutator({
  segmente, valoare, laSchimbare, eticheta,
}: { segmente: Segment[]; valoare: string | null; laSchimbare: (v: string) => void; eticheta: string }) {
  const id = useId();
  const { layout } = useMiscare();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const ales = segmente.findIndex((s) => s.valoare === valoare);
  const tasta = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + segmente.length) % segmente.length;
    refs.current[j]?.focus();
    laSchimbare(segmente[j].valoare);
  };
  return (
    <div role="radiogroup" aria-label={eticheta} className="flex h-12 rounded-camp border border-quaternary bg-white p-1" data-comutator>
      {segmente.map((s, i) => {
        const activ = s.valoare === valoare;
        return (
          <button
            key={s.valoare}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={activ}
            tabIndex={activ || (ales < 0 && i === 0) ? 0 : -1}
            onClick={() => {
              atinge();
              laSchimbare(s.valoare);
            }}
            onKeyDown={(e) => tasta(e, i)}
            data-focus={(ales < 0 ? i === 0 : activ) || undefined}
            className={`relative flex-1 rounded-[5px] px-1 text-[15px] font-semibold transition-colors duration-200 sm:text-[16px] ${activ ? 'text-white' : 'text-primary hover:bg-tertiary'}`}
          >
            {activ && <motion.span layoutId={`segment-${id}`} transition={layout} className="absolute inset-0 rounded-[5px] bg-primary" aria-hidden />}
            <span className="relative">{s.eticheta}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Glisorul: valoarea (buton: tap → câmp numeric), pista cu mânerul, reperele. Accesibil ca
 * `role="slider"`: săgețile mută cu un pas, PageUp / PageDown cu 10, Home / End la capete.
 * Ține și valori exacte (scrise sau venite din „Aplică”), nu doar pe grila pașilor.
 */
export function Glisor({
  g, valoare, laSchimbare, laTragere,
}: { g: DateGlisor; valoare: number; laSchimbare: (n: number) => void; laTragere?: (activ: boolean) => void }) {
  const { redus } = useMiscare();
  const id = useId();
  const pista = useRef<HTMLDivElement>(null);
  const [trage, setTrage] = useState(false);
  const [scrie, setScrie] = useState(false);
  const v = limita(valoare, g.min, g.max);
  const parte = (v - g.min) / (g.max - g.min);
  const nume = g.eticheta ?? 'Prețul';

  const dinX = (x: number) => {
    const c = pista.current?.getBoundingClientRect();
    if (!c) return v;
    const p = limita((x - c.left) / c.width, 0, 1);
    return limita(Math.round((p * (g.max - g.min)) / g.pas) * g.pas + g.min, g.min, g.max);
  };
  const porneste = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setTrage(true);
    laTragere?.(true);
    laSchimbare(dinX(e.clientX));
    (e.currentTarget.querySelector('[role="slider"]') as HTMLElement | null)?.focus({ preventScroll: true });
  };
  const opreste = () => {
    if (!trage) return;
    setTrage(false);
    laTragere?.(false);
  };

  const tasta = (e: KeyboardEvent) => {
    const jos = Math.ceil((v - g.min) / g.pas - 1e-9) * g.pas + g.min;
    const sus = Math.floor((v - g.min) / g.pas + 1e-9) * g.pas + g.min;
    const k: Record<string, number> = {
      ArrowRight: sus + g.pas, ArrowUp: sus + g.pas, ArrowLeft: jos - g.pas, ArrowDown: jos - g.pas,
      PageUp: sus + 10 * g.pas, PageDown: jos - 10 * g.pas, Home: g.min, End: g.max,
    };
    if (!(e.key in k)) return;
    e.preventDefault();
    laSchimbare(limita(k[e.key], g.min, g.max));
  };

  const miscare = trage || redus ? { duration: 0 } : RESORT;

  return (
    <div data-glisor={g.cheie}>
      <div className="flex items-baseline justify-between gap-3">
        {g.eticheta ? <span className="eticheta-mica" id={`${id}-eticheta`}>{g.eticheta}</span> : <span />}
        {scrie ? (
          <CampSuma g={g} initial={v} laGata={(n) => {
            setScrie(false);
            if (n !== null) laSchimbare(limita(n, g.min, g.max));
          }} />
        ) : (
          <button
            type="button"
            onClick={() => setScrie(true)}
            className="-mr-1 rounded-buton px-1 font-serif text-[28px] font-semibold leading-tight text-primary tabular-nums underline decoration-quaternary decoration-1 underline-offset-[6px] hover:decoration-primary"
            aria-label={`${nume}: ${g.format(v)}. Scrie suma exactă`}
            data-valoare-glisor
          >
            {g.format(v)}
          </button>
        )}
      </div>
      <div
        ref={pista}
        className="relative mt-1 h-11 cursor-pointer touch-pan-y select-none"
        onPointerDown={porneste}
        onPointerMove={(e) => trage && laSchimbare(dinX(e.clientX))}
        onPointerUp={opreste}
        onPointerCancel={opreste}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-quaternary" aria-hidden>
          <motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: `${parte * 100}%` }} transition={miscare} />
        </div>
        {g.repere?.map((r) => (
          <span
            key={r.valoare}
            aria-hidden
            className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-dark"
            style={{ left: `${((r.valoare - g.min) / (g.max - g.min)) * 100}%` }}
          />
        ))}
        <motion.div
          role="slider"
          tabIndex={0}
          aria-valuemin={g.min}
          aria-valuemax={g.max}
          aria-valuenow={v}
          aria-valuetext={g.format(v)}
          aria-label={nume}
          onKeyDown={tasta}
          data-focus
          className="absolute top-1/2 size-7 rounded-full border-2 border-primary bg-white shadow-[0_1px_4px_rgb(20_33_61/0.18)]"
          style={{ x: '-50%', y: '-50%' }}
          initial={false}
          animate={{ left: `${parte * 100}%`, scale: trage && !redus ? 1.12 : 1 }}
          transition={miscare}
        />
      </div>
      {(g.repere?.length || g.sub) && (
        <div className="relative flex h-4 items-start justify-end text-[13px] leading-none text-senary">
          {g.repere?.map((r) => (
            <span
              key={r.valoare}
              className="absolute -translate-x-1/2 whitespace-nowrap text-accent-dark"
              style={{ left: `${((r.valoare - g.min) / (g.max - g.min)) * 100}%` }}
            >
              {r.eticheta}
            </span>
          ))}
          {g.sub && <span>{g.sub}</span>}
        </div>
      )}
    </div>
  );
}

/** Tap pe valoarea glisorului → câmpul numeric (tastatura numerică); Enter / „Gata” îl închide. */
function CampSuma({ g, initial, laGata }: { g: DateGlisor; initial: number; laGata: (n: number | null) => void }) {
  const [text, setText] = useState(Math.round(initial).toLocaleString('ro-RO'));
  const camp = useRef<HTMLInputElement>(null);
  const gata = useRef(false);
  useEffect(() => {
    camp.current?.focus({ preventScroll: true });
    camp.current?.select();
  }, []);
  const termina = (e?: FormEvent) => {
    e?.preventDefault();
    if (gata.current) return;
    gata.current = true;
    const n = parseNum(text, true);
    laGata(n === null || Number.isNaN(n) || n < 0 ? null : n);
  };
  return (
    <form onSubmit={termina} className="relative w-[11.5rem]">
      <label htmlFor={`suma-${g.cheie}`} className="sr-only">{`${g.eticheta ?? 'Prețul'}, ${g.unitate}`}</label>
      <input
        ref={camp}
        id={`suma-${g.cheie}`}
        inputMode="numeric"
        enterKeyHint="done"
        autoComplete="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => termina()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            gata.current = true;
            laGata(null);
          }
        }}
        className="camp h-11 pr-12 text-right font-serif text-[22px] font-semibold text-primary"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-senary">{g.unitate}</span>
    </form>
  );
}

/** „← Înapoi” și „Continuă” pe același rând (ca ecranul să încapă fără derulare). */
export function RandContinua({
  laContinua, laInapoi, activ = true, text = 'Continuă',
}: { laContinua: () => void; laInapoi?: () => void; activ?: boolean; text?: string }) {
  const { apasare } = useMiscare();
  return (
    <div className="mt-5 flex items-center gap-3">
      {laInapoi && (
        <button type="button" onClick={laInapoi} className="-ml-2 min-h-11 shrink-0 px-2 text-[15px] text-senary hover:text-primary hover:underline">
          {TEXTE.inapoi}
        </button>
      )}
      <motion.button
        type="button"
        whileTap={activ ? apasare : undefined}
        disabled={!activ}
        onClick={() => {
          atinge();
          laContinua();
        }}
        className="btn-plin flex-1"
        data-continua
      >
        {text}
      </motion.button>
    </div>
  );
}
