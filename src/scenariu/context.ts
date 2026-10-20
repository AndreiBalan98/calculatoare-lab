// Contextul conversației e-DRIVE: din răspunsuri (și răspunsul ANAF) → datele motorului.
// Toate cifrele și eligibilitatea vin din motor (calc, evalueazaFirma, incadrare); aici doar
// se pun răspunsurile în forma pe care o cere motorul.

import { dinAnaf, type DateDinAnaf, type FirmaAnaf, type RaspunsAnaf } from '@/motor/edrive/anaf';
import { calc, type CategorieVehicul, type DateEdrive, type FormaJuridica, type RezultatEdrive, type Vehicul } from '@/motor/edrive/calc';
import { evalueazaFirma, incadrare, type EvaluareFirma, type Incadrare } from '@/motor/edrive/incadrare';

/** Răspunsurile date: id-ul pasului → valoarea aleasă. */
export type Raspunsuri = Record<string, string>;

/** Răspunsurile ANAF deja aduse, după CUI. */
export type CacheAnaf = Record<string, RaspunsAnaf>;

export interface Masina {
  /** 0, 1, 2… în ordinea întrebărilor */
  index: number;
  cat: CategorieVehicul;
  /** al câtelea din categoria lui (1, 2…) */
  nrInCat: number;
  totalInCat: number;
  total: number;
}

export interface Context {
  r: Raspunsuri;
  cui: string | null;
  /** undefined = încă nu știm (se caută) */
  anaf: RaspunsAnaf | undefined;
  firma: FirmaAnaf | null;
  dinAnaf: DateDinAnaf | null;
  /** încadrarea doar din cifrele ANAF */
  incadrareAnaf: Incadrare | null;
  /** ANAF nu ne spune forma juridică */
  faraForma: boolean;
  /** ANAF nu ne dă cifrele (sau omul zice că nu mai sunt la zi) */
  faraCifre: boolean;
  /** mărimea vine din răspunsurile omului („estimat din ce ne-ai spus”) */
  estimat: boolean;
  date: DateEdrive;
  evaluare: EvaluareFirma;
  masini: Masina[];
  /** prețul fiecărei mașini (null = încă nu știm) */
  preturi: (number | null)[];
  /** calc() pe tot ce știm până aici (doar mașinile cu preț) */
  rezultat: RezultatEdrive;
}

/** „~25000” (valoare rotundă), „25000” (exactă). */
export function pretDin(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v.replace(/^~/, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function numar(r: Raspunsuri, id: string): number {
  const v = r[id];
  if (v === 'mai') return Number(r[id + 'Multe'] || 0);
  return Number(v || 0);
}

export function masiniDin(r: Raspunsuri): Masina[] {
  const n1 = numar(r, 'nrM1');
  const n2 = r.nrM2 === undefined ? 0 : numar(r, 'nrM2');
  const total = n1 + n2;
  const lista: Masina[] = [];
  for (let i = 0; i < n1; i++) lista.push({ index: lista.length, cat: 'M1', nrInCat: i + 1, totalInCat: n1, total });
  for (let i = 0; i < n2; i++) lista.push({ index: lista.length, cat: 'M2', nrInCat: i + 1, totalInCat: n2, total });
  return lista;
}

/** Prețul unei mașini; „aceeasi” = ca prima mașină din aceeași categorie. */
export function pretMasina(r: Raspunsuri, masini: Masina[], i: number): number | null {
  const v = r[`pret_${i}`];
  if (v === 'aceeasi') {
    const prima = masini.find((m) => m.cat === masini[i]?.cat);
    return prima && prima.index !== i ? pretMasina(r, masini, prima.index) : null;
  }
  return pretDin(v);
}

export function contextDin(r: Raspunsuri, cache: CacheAnaf): Context {
  const cui = r.cui ?? null;
  const anaf = cui ? cache[cui] : undefined;
  const firma = anaf && anaf.ok ? anaf : null;
  const d0 = firma ? dinAnaf(firma) : null;
  const incadrareAnaf = d0 ? incadrare(d0) : null;

  const faraForma = !d0 || d0.forma === '';
  const faraCifre = !incadrareAnaf || incadrareAnaf.status === 'incomplet' || r.corectez === 'cifre';

  const forma: FormaJuridica = (r.forma as FormaJuridica | undefined) ?? d0?.forma ?? '';
  const estimat = r.angajati !== undefined || r.cifra !== undefined;

  const masini = masiniDin(r);
  const preturi = masini.map((_, i) => pretMasina(r, masini, i));
  const veh: Vehicul[] = [];
  for (let i = 0; i < masini.length && preturi[i] !== null; i++) {
    veh.push({ cat: masini[i].cat, pret: preturi[i], ue: r[`ue_${i}`] === 'da' });
  }

  const date: DateEdrive = {
    forma,
    caen: d0?.caen ?? '',
    // Cu întrebările minime: angajații și cifra de afaceri din răspunsuri, cu cursul implicit;
    // fără active, datorii și capitaluri (nu le cerem).
    ang: estimat ? (r.angajati ? Number(r.angajati) : null) : (d0?.ang ?? null),
    ca: estimat ? (r.cifra ? Number(r.cifra) : null) : (d0?.ca ?? null),
    act: estimat ? null : (d0?.act ?? null),
    dat: estimat ? null : (d0?.dat ?? null),
    cap: estimat ? null : (d0?.cap ?? null),
    an: estimat ? null : (d0?.an ?? null),
    anaf: d0?.anaf ?? null,
    vechi: r.vechi === 'da' ? 'da' : r.promisiune === 'da' ? 'promisiune' : '',
    veh,
  };

  return {
    r, cui, anaf, firma, dinAnaf: d0, incadrareAnaf, faraForma, faraCifre, estimat,
    date,
    evaluare: evalueazaFirma(date),
    masini,
    preturi,
    rezultat: calc(date),
  };
}

/** Rezultatul dacă toate mașinile ar fi asamblate în UE (pentru antrenor). */
export function rezultatToateUE(c: Context): RezultatEdrive {
  return calc({ ...c.date, veh: c.date.veh.map((v) => ({ ...v, ue: true })) });
}

