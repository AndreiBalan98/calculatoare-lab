// Contextul conversației e-DRIVE: din răspunsuri (și răspunsul ANAF) → datele motorului.
// Toate cifrele și eligibilitatea vin din motor (calc, evalueazaFirma, incadrare); aici doar
// se pun răspunsurile în forma pe care o cere motorul.

import { dinAnaf, type DateDinAnaf, type FirmaAnaf, type RaspunsAnaf } from '@/motor/edrive/anaf';
import { calc, type CategorieVehicul, type DateEdrive, type FormaJuridica, type RezultatEdrive, type Vehicul } from '@/motor/edrive/calc';
import { evalueazaFirma, incadrare, type EvaluareFirma, type Incadrare } from '@/motor/edrive/incadrare';
import type { CacheAnaf, ContextBaza, Raspunsuri } from './tipuri';

export type { CacheAnaf, Raspunsuri };

export interface Masina {
  /** 0, 1, 2… în ordinea întrebărilor */
  index: number;
  cat: CategorieVehicul;
  /** al câtelea din categoria lui (1, 2…) */
  nrInCat: number;
  totalInCat: number;
  total: number;
}

export interface Context extends ContextBaza {
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
  /** calc() pe tot ce știm până aici (mașinile cu preț; UE neștiut = nu) */
  rezultat: RezultatEdrive;
  /** punctajul de până acum: doar mașinile la care știm și prețul, și răspunsul UE */
  scor: number;
}

/** „~25000” (valoare rotundă), „25000” (exactă). */
export function pretDin(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v.replace(/^~/, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Câte mașini schimbă omul (0 = încă nu știm). */
export function numarMasini(r: Raspunsuri): number {
  const n = Number(r.nrMasini || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

/**
 * Lista mașinilor, din „câte mașini” și „ce fel”: întâi autoturismele, apoi microbuzele.
 * Goală cât timp nu știm încă felul lor.
 */
export function masiniDin(r: Raspunsuri): Masina[] {
  const n = numarMasini(r);
  const tip = r.tipMasini;
  let n2: number | null = null;
  if (tip === 'M1' || tip === 'toateM1') n2 = 0;
  else if (tip === 'M2' || tip === 'toateM2') n2 = n;
  else if (tip === 'mixt') {
    const k = Number(r.nrMicrobuze || 0);
    if (k >= 1 && k < n) n2 = k;
  }
  if (!n || n2 === null) return [];
  const n1 = n - n2;
  const lista: Masina[] = [];
  for (let i = 0; i < n1; i++) lista.push({ index: lista.length, cat: 'M1', nrInCat: i + 1, totalInCat: n1, total: n });
  for (let i = 0; i < n2; i++) lista.push({ index: lista.length, cat: 'M2', nrInCat: i + 1, totalInCat: n2, total: n });
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
    scor: scorCuPrimele(date, r, veh.length),
  };
}

/** Punctajul cu primele k mașini, dar doar cele la care s-a răspuns și la UE. */
function scorCuPrimele(date: DateEdrive, r: Raspunsuri, k: number): number {
  let n = 0;
  while (n < k && r[`ue_${n}`] !== undefined) n++;
  return calc({ ...date, veh: date.veh.slice(0, n) }).total;
}

/** Punctajul înainte de răspunsul UE la mașina i (pentru ecoul „+20”). */
export function scorInainteDeUE(c: Context, i: number): number {
  return calc({ ...c.date, veh: c.date.veh.slice(0, i) }).total;
}

/** Diferența peste plafon pentru o singură mașină (din motor). */
export function pestePlafon(c: Context, i: number): number {
  const v = c.date.veh[i];
  if (!v) return 0;
  const r = calc({ ...c.date, veh: [v] });
  return r.fara - r.ajutor;
}

/** Rezultatul dacă toate mașinile ar fi asamblate în UE (pentru antrenor). */
export function rezultatToateUE(c: Context): RezultatEdrive {
  return calc({ ...c.date, veh: c.date.veh.map((v) => ({ ...v, ue: true })) });
}

