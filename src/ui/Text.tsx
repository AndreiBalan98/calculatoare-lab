'use client';

// Textele din scenariu, cu **îngroșat** și [[cuvinte grele]]. Explicația unui cuvânt greu
// (docs/flux-edrive.md §6): balon la hover cu mouse-ul, la focus cu tastatura (Esc îl închide),
// la tap pe ecranele tactile (închis la tap în altă parte).

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GLOSAR } from '@/scenariu/glosar';
import type { Termen as DateTermen } from '@/scenariu/program';
import { bucati } from '@/scenariu/text';

/** Glosarul calculatorului afișat (implicit cel e-DRIVE). */
export const GlosarContext = createContext<Record<string, DateTermen>>(GLOSAR);

const INTRARE_MS = 120;
const IESIRE_MS = 150;
const MARGINE = 8;
const SAGEATA = 7;

interface Pozitie {
  left: number;
  top: number;
  /** săgeata, față de marginea stângă a balonului */
  sageata: number;
  /** balonul stă sub cuvânt (nu încape deasupra) */
  dedesubt: boolean;
}

function Termen({ cheie, text }: { cheie: string; text: string }) {
  const termen = useContext(GlosarContext)[cheie];
  const id = useId();
  const [deschis, setDeschis] = useState(false);
  const [poz, setPoz] = useState<Pozitie | null>(null);
  const cuvant = useRef<HTMLSpanElement>(null);
  const balon = useRef<HTMLDivElement>(null);
  const temporizator = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atingere = useRef(false);

  const anuleaza = () => {
    if (temporizator.current) clearTimeout(temporizator.current);
    temporizator.current = null;
  };
  const deschideDupa = (ms: number) => {
    anuleaza();
    temporizator.current = setTimeout(() => setDeschis(true), ms);
  };
  const inchideDupa = (ms: number) => {
    anuleaza();
    temporizator.current = setTimeout(() => setDeschis(false), ms);
  };
  useEffect(() => anuleaza, []);

  // Poziția: deasupra cuvântului, centrat; dedesubt dacă nu încape; niciodată în afara ecranului.
  const pozitioneaza = useCallback(() => {
    const c = cuvant.current?.getBoundingClientRect();
    const b = balon.current;
    if (!c || !b) return;
    const lat = b.offsetWidth;
    const inalt = b.offsetHeight;
    // la un cuvânt rupt pe două rânduri, ne ancorăm de primul rând
    const rand = cuvant.current?.getClientRects()[0] ?? c;
    const centru = rand.left + rand.width / 2;
    const left = Math.min(Math.max(MARGINE, centru - lat / 2), window.innerWidth - lat - MARGINE);
    const dedesubt = rand.top - inalt - SAGEATA - MARGINE < 0;
    const top = dedesubt ? rand.bottom + SAGEATA : rand.top - inalt - SAGEATA;
    setPoz({ left, top, sageata: Math.min(Math.max(12, centru - left), lat - 12), dedesubt });
  }, []);

  useLayoutEffect(() => {
    if (!deschis) return;
    pozitioneaza();
    window.addEventListener('scroll', pozitioneaza, true);
    window.addEventListener('resize', pozitioneaza);
    return () => {
      window.removeEventListener('scroll', pozitioneaza, true);
      window.removeEventListener('resize', pozitioneaza);
    };
  }, [deschis, pozitioneaza]);

  // Pe ecranele tactile: un tap în altă parte îl închide.
  useEffect(() => {
    if (!deschis) return;
    const laAtingere = (e: PointerEvent) => {
      const t = e.target as Node;
      if (cuvant.current?.contains(t) || balon.current?.contains(t)) return;
      setDeschis(false);
    };
    document.addEventListener('pointerdown', laAtingere);
    return () => document.removeEventListener('pointerdown', laAtingere);
  }, [deschis]);

  // Cu mouse-ul: balonul rămâne cât timp mouse-ul e pe cuvânt sau pe balon.
  const intra = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') deschideDupa(INTRARE_MS);
  };
  const iese = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') inchideDupa(IESIRE_MS);
  };

  return (
    <>
      <span
        ref={cuvant}
        tabIndex={0}
        className="termen"
        aria-describedby={deschis ? id : undefined}
        data-termen={cheie}
        onPointerEnter={intra}
        onPointerLeave={iese}
        onPointerDown={(e) => {
          atingere.current = e.pointerType !== 'mouse';
        }}
        onClick={() => {
          // click cu mouse-ul: nimic în plus; tap: deschide / închide
          if (!atingere.current) return;
          anuleaza();
          setDeschis((d) => !d);
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(':focus-visible')) {
            anuleaza();
            setDeschis(true);
          }
        }}
        onBlur={() => {
          if (!atingere.current) inchideDupa(IESIRE_MS);
        }}
        onKeyDown={(e) => {
          atingere.current = false;
          if (e.key === 'Escape' && deschis) {
            e.stopPropagation();
            anuleaza();
            setDeschis(false);
          }
        }}
      >
        {text}
      </span>
      {deschis &&
        createPortal(
          <div
            ref={balon}
            id={id}
            role="tooltip"
            onPointerEnter={(e) => e.pointerType === 'mouse' && anuleaza()}
            onPointerLeave={iese}
            className="balon-glosar fixed z-[60] w-max max-w-[min(280px,calc(100vw-16px))] rounded-card bg-primary px-3.5 py-2.5 text-left text-[14px] font-normal leading-snug text-white shadow-[0_6px_24px_rgb(10_18_38/0.25)]"
            style={{ left: poz?.left ?? -9999, top: poz?.top ?? -9999, visibility: poz ? 'visible' : 'hidden' }}
            data-glosar={cheie}
          >
            <strong className="mb-0.5 block font-semibold text-accent">{termen.titlu}</strong>
            {termen.text}
            {poz && (
              <span
                aria-hidden
                className="absolute size-3 rotate-45 bg-primary"
                style={{ left: poz.sageata - 6, ...(poz.dedesubt ? { top: -5 } : { bottom: -5 }) }}
              />
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

export function Text({ text, className }: { text: string; className?: string }) {
  const glosar = useContext(GlosarContext);
  return (
    <span className={className}>
      {bucati(text).map((b, i) => {
        if (b.tip === 'gros') return <strong key={i} className="font-semibold text-primary">{b.text}</strong>;
        if (b.tip === 'termen' && glosar[b.cheie]) return <Termen key={i} cheie={b.cheie} text={b.text} />;
        return <span key={i}>{b.text}</span>;
      })}
    </span>
  );
}
