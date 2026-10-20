// Răspunsul API-ului firmei (proxy-ul ANAF de pe site, docs/referinta/anaf-api.md)
// și maparea lui pe datele motorului: portare identică a dinAnaf() din referință.

import { norm, type FormaJuridica, type StareAnaf } from './calc';

export interface BilantAnaf {
  an?: number | null;
  angajati?: number | null;
  cifra_afaceri?: number | null;
  active?: number | null;
  datorii?: number | null;
  capitaluri?: number | null;
  capital_social?: number | null;
  profit_brut?: number | null;
  profit_net?: number | null;
}

/** Răspuns reușit (200). Câmpurile pot lipsi sau fi null. */
export interface FirmaAnaf {
  ok: true;
  cui: string;
  denumire?: string | null;
  adresa?: string | null;
  forma_juridica?: string | null;
  forma_organizare?: string | null;
  caen?: string | number | null;
  stare?: string | null;
  inactiv?: boolean | null;
  radiat?: boolean | null;
  data_inregistrare?: string | null;
  judet?: string | null;
  judet_cod?: string | null;
  bilant?: BilantAnaf | null;
}

export type CodEroareAnaf = 'cui_invalid' | 'negasit' | 'prea_multe' | 'ocupat' | 'anaf_indisponibil';

export interface EroareAnaf {
  ok: false;
  cod: CodEroareAnaf | (string & {});
  mesaj: string;
}

export type RaspunsAnaf = FirmaAnaf | EroareAnaf;

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
