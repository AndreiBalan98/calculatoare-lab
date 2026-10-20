'use client';

// Întrebările: opțiunile apar în cascadă; cea aleasă devine răspunsul (layoutId), restul se strâng.

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { parseNum, verifica } from '@/motor/edrive/calc';
import { curataCui } from '@/motor/edrive/cui';
import type { Element } from '@/scenariu/derulare';
import { TEXTE } from '@/scenariu/edrive';
import type { Optiune } from '@/scenariu/tipuri';
import { Text } from '../Text';
import { atinge, useMiscare } from '../miscare';
import { Balon, Pastila, RandCalculator, RandComprimat } from './Baloane';

export const idOptiune = (pas: string, valoare: string) => `opt:${pas}:${valoare}`;

export function Optiuni({
  pas, optiuni, laAlegere, focus, extra,
}: {
  pas: string;
  optiuni: Optiune[];
  laAlegere: (o: Optiune) => void;
  focus?: boolean;
  extra?: React.ReactNode;
}) {
  const { cascada, optiune, apasare, layout } = useMiscare();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) ref.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  }, [focus]);
  return (
    <motion.div ref={ref} className="flex flex-wrap gap-2" variants={cascada} initial="ascuns" animate="vizibil" exit="iesire">
      {optiuni.map((o) => (
        <motion.button
          key={o.valoare}
          type="button"
          layoutId={o.actiune ? undefined : idOptiune(pas, o.valoare)}
          variants={optiune}
          transition={layout}
          whileTap={apasare}
          onClick={() => {
            atinge();
            laAlegere(o);
          }}
          className="inline-flex min-h-11 items-center rounded-buton border border-primary bg-white px-4 py-2 font-semibold leading-tight text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {o.eticheta}
        </motion.button>
      ))}
      {extra}
    </motion.div>
  );
}

type ElIntrebare = Extract<Element, { tip: 'intrebare' }>;

export function Intrebare({
  el, avatar, focus, laRaspuns, laActiune, laSchimbare, anterior,
}: {
  el: ElIntrebare;
  avatar: boolean;
  focus: boolean;
  laRaspuns: (pas: string, valoare: string) => void;
  laActiune: (o: Optiune) => void;
  laSchimbare: (pas: string) => void;
  anterior?: string;
}) {
  const { intrare } = useMiscare();
  if (el.raspuns) {
    const preset = el.pas.tip === 'alegere' || el.optiuni.some((o) => o.valoare === el.raspuns!.valoare);
    return (
      <RandComprimat scurt={el.scurt}>
        <Pastila
          id={idOptiune(el.cheie, preset ? el.raspuns.valoare : 'alta')}
          text={el.raspuns.eticheta}
          laSchimbare={() => laSchimbare(el.cheie)}
        />
      </RandComprimat>
    );
  }
  const alege = (o: Optiune) => (o.actiune ? laActiune(o) : laRaspuns(el.cheie, o.valoare));
  return (
    <RandCalculator avatar={avatar}>
      <Balon text={el.text} eticheta={el.eticheta} />
      <motion.div className="mt-3" variants={intrare} initial="ascuns" animate="vizibil">
        <AnimatePresence mode="popLayout">
          {el.pas.tip === 'suma' ? (
            <OptiuniSuma key="suma" el={el} focus={focus} laAlegere={alege} laSuma={(v) => laRaspuns(el.cheie, v)} anterior={anterior} />
          ) : (
            <Optiuni key="optiuni" pas={el.cheie} optiuni={el.optiuni} laAlegere={alege} focus={focus} />
          )}
        </AnimatePresence>
        {el.nota && <p className="mt-2.5 text-sm text-senary"><Text text={el.nota} /></p>}
      </motion.div>
    </RandCalculator>
  );
}

function OptiuniSuma({
  el, focus, laAlegere, laSuma, anterior,
}: {
  el: ElIntrebare;
  focus: boolean;
  laAlegere: (o: Optiune) => void;
  laSuma: (v: string) => void;
  anterior?: string;
}) {
  const exact = anterior && !anterior.startsWith('~') && anterior !== 'aceeasi' ? anterior : '';
  const [scrie, setScrie] = useState(!!exact);
  const [text, setText] = useState(exact ? Number(exact).toLocaleString('ro-RO') : '');
  const [eroare, setEroare] = useState<string | null>(null);
  const { apasare, layout, optiune } = useMiscare();
  const camp = useRef<HTMLInputElement>(null);
  const pas = el.pas.tip === 'suma' ? el.pas : null;
  useEffect(() => {
    if (scrie) camp.current?.focus();
  }, [scrie]);
  if (!pas) return null;

  const trimite = (e: FormEvent) => {
    e.preventDefault();
    const v = parseNum(text, true);
    const err = verifica(v, false);
    if (err) {
      setEroare(err === 'req' ? TEXTE.altaSumaEroare : err);
      return;
    }
    atinge();
    laSuma(String(v));
  };

  const alta = (
    <AnimatePresence mode="popLayout" initial={false}>
      {scrie ? (
        <motion.form
          key="camp"
          layoutId={idOptiune(el.cheie, 'alta')}
          transition={layout}
          onSubmit={trimite}
          className="flex w-full flex-wrap items-start gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <label htmlFor={`suma-${el.cheie}`} className="sr-only">{pas.altaSuma.eticheta}</label>
          <div className="relative min-w-0 flex-1 basis-40">
            <input
              ref={camp}
              id={`suma-${el.cheie}`}
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              placeholder={pas.altaSuma.placeholder}
              value={text}
              aria-invalid={!!eroare}
              aria-describedby={eroare ? `suma-${el.cheie}-eroare` : undefined}
              onChange={(e) => {
                setText(e.target.value);
                setEroare(null);
              }}
              className="camp pr-10"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-senary">€</span>
          </div>
          <motion.button type="submit" whileTap={apasare} className="btn-plin min-h-[46px] py-2">{pas.altaSuma.buton}</motion.button>
          {eroare && <p id={`suma-${el.cheie}-eroare`} className="w-full text-sm text-eroare">{eroare}</p>}
        </motion.form>
      ) : (
        <motion.button
          key="buton"
          type="button"
          layoutId={idOptiune(el.cheie, 'alta')}
          variants={optiune}
          transition={layout}
          whileTap={apasare}
          onClick={() => setScrie(true)}
          className="inline-flex min-h-11 items-center rounded-buton border border-dashed border-primary bg-white px-4 py-2 font-semibold leading-tight text-primary hover:bg-tertiary"
        >
          {pas.altaSuma.eticheta}
        </motion.button>
      )}
    </AnimatePresence>
  );

  return <Optiuni pas={el.cheie} optiuni={el.optiuni} laAlegere={laAlegere} focus={focus && !scrie} extra={alta} />;
}

type ElCui = Extract<Element, { tip: 'cui' }>;

export function IntrebareCui({
  el, focus, laRaspuns, laSchimbare, anterior,
}: {
  el: ElCui;
  focus: boolean;
  laRaspuns: (v: string) => void;
  laSchimbare: () => void;
  anterior?: string;
}) {
  const [text, setText] = useState(anterior ?? '');
  const [eroare, setEroare] = useState<string | null>(null);
  const [modificat, setModificat] = useState(false);
  const { apasare, layout, intrare } = useMiscare();
  const camp = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focus) camp.current?.focus({ preventScroll: true });
  }, [focus]);

  if (el.raspuns) {
    return (
      <RandComprimat scurt={el.scurt}>
        <Pastila id={idOptiune(el.cheie, 'camp')} text={el.raspuns} laSchimbare={laSchimbare} />
      </RandComprimat>
    );
  }
  const err = eroare ?? (modificat ? null : el.eroare);
  return (
    <RandCalculator>
      <Balon text={el.text} />
      <motion.form
        layoutId={idOptiune(el.cheie, 'camp')}
        transition={layout}
        variants={intrare}
        initial="ascuns"
        animate="vizibil"
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!curataCui(text)) {
            setEroare(el.pas.eroare);
            return;
          }
          atinge();
          setModificat(false);
          laRaspuns(text);
        }}
      >
        <label htmlFor="cui" className="sr-only">{el.pas.eticheta}</label>
        <input
          ref={camp}
          id="cui"
          name="cui"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={el.pas.placeholder}
          value={text}
          aria-invalid={!!err}
          aria-describedby={err ? 'cui-eroare' : undefined}
          onChange={(e) => {
            setText(e.target.value);
            setEroare(null);
            setModificat(true);
          }}
          className="camp h-[52px] min-w-0 flex-1 text-[19px] tracking-wide"
        />
        <motion.button type="submit" whileTap={apasare} className="btn-plin h-[52px] shrink-0">
          {el.pas.buton}
        </motion.button>
      </motion.form>
      {err && <p id="cui-eroare" className="mt-2 text-sm text-eroare">{err}</p>}
    </RandCalculator>
  );
}
