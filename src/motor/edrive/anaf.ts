// Răspunsul API-ului firmei (proxy-ul ANAF de pe site, docs/referinta/anaf-api.md)
// și maparea lui pe datele motorului: portare identică a dinAnaf() din referință.

import type { FirmaAnaf } from '../anaf';
import { norm, type FormaJuridica, type StareAnaf } from './calc';

export type { BilantAnaf, CodEroareAnaf, EroareAnaf, FirmaAnaf, RaspunsAnaf } from '../anaf';

/** Partea din DateEdrive care vine de la ANAF. */
export interface DateDinAnaf {
  anaf: StareAnaf;
  forma: FormaJuridica;
  caen: string;
  an: number | null;
  ang: number | null;
  ca: number | null;
  act: number | null;
  dat: number | null;
  cap: number | null;
}

// În referință, un câmp absent (undefined) ajunge în calc() și e tratat ca scris greșit.
// Aici îl transformăm în NaN, care dă exact același rezultat în calc().
function numar(x: number | null | undefined): number | null {
  return x === undefined ? NaN : x;
}

export function dinAnaf(j: FirmaAnaf): DateDinAnaf {
  const anaf: StareAnaf = {
    radiat: !!j.radiat,
    inactiv: !!j.inactiv,
    stare: j.stare || '',
    stareRea: /INSOLV|FALIMENT|LICHID|DIZOLV|SUSPEND|RADIER/.test(norm(j.stare)),
  };
  const fj = norm((j.forma_juridica || '') + ' ' + (j.forma_organizare || ''));
  let forma: FormaJuridica;
  if (/PERSOANA FIZICA|INTREPRINDERE INDIVIDUALA|INTREPRINDERE FAMILIALA/.test(fj)) forma = 'pfa';
  else if (/SOCIETATE|RASPUNDERE LIMITATA|PE ACTIUNI/.test(fj)) forma = 'soc';
  else forma = '';
  const b = j.bilant;
  return {
    anaf,
    forma,
    caen: j.caen ? String(j.caen) : '',
    an: b ? (b.an ?? null) : null,
    ang: b ? (b.angajati !== null ? Math.round(numar(b.angajati) as number) : null) : null,
    ca: b ? numar(b.cifra_afaceri) : null,
    act: b ? numar(b.active) : null,
    dat: b ? numar(b.datorii) : null,
    cap: b ? numar(b.capitaluri) : null,
  };
}
