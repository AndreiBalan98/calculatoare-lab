// Contextul conversației SME Eco-Tech: din răspunsuri (și răspunsul ANAF) → datele motorului.
// Toate cifrele și eligibilitatea vin din motor (calc, evalueazaFirmaSme, incadrareSme); aici
// doar se pun răspunsurile în forma pe care o cere motorul.

import { dinAnaf, type DateDinAnafSme } from '@/motor/sme/anaf';
import { calc, type DateSme, type FormaJuridica, type RezultatSme } from '@/motor/sme/calc';
import { evalueazaFirmaSme, incadrareSme, type EvaluareFirmaSme, type IncadrareSme } from '@/motor/sme/firma';
import { alese, sumaDin } from '../derulare';
import type { CacheAnaf, ContextBaza, Raspunsuri } from '../tipuri';

/** Ce poate cumpăra omul (C1), în ordinea ecranelor de sume. */
export const CUMPARATURI = ['verde', 'alte', 'soft'] as const;
export type Cumparatura = (typeof CUMPARATURI)[number];

export interface ContextSme extends ContextBaza {
  dinAnaf: DateDinAnafSme | null;
  /** mărimea doar din cifrele ANAF */
  incadrareAnaf: IncadrareSme | null;
  /** ANAF nu ne spune forma juridică */
  faraForma: boolean;
  /** ANAF nu ne dă cifrele de mărime (sau omul zice că nu mai sunt la zi) */
  faraCifre: boolean;
  /** ANAF nu ne dă data înființării */
  faraData: boolean;
  /** ANAF nu ne dă cifra de afaceri pe 2024 */
  faraCa24: boolean;
  /** datele firmei vin (și) din răspunsurile omului („estimat din ce ne-ai spus”) */
  estimat: boolean;
  date: DateSme;
  evaluare: EvaluareFirmaSme;
  /** ce a ales omul pe C1 */
  cumperi: Cumparatura[];
  /** calc() pe tot ce știm până aici (sumele încă neștiute = goale) */
  rezultat: RezultatSme;
}

export function contextSme(r: Raspunsuri, cache: CacheAnaf): ContextSme {
  const cui = r.cui ?? null;
  const anaf = cui ? cache[cui] : undefined;
  const firma = anaf && anaf.ok ? anaf : null;
  const d0 = firma ? dinAnaf(firma) : null;
  const incadrareAnaf = d0 ? incadrareSme(d0) : null;

  const faraForma = !d0 || d0.forma === '';
  const faraCifre = !incadrareAnaf || incadrareAnaf.status === 'incomplet' || r.corectez === 'cifre';
  const faraData = !d0 || !d0.data;
  const faraCa24 = !d0 || d0.ca24 === null;

  // Cu întrebările minime: angajații și cifra de afaceri din răspunsuri, cu cursul implicit; fără active.
  const marimeEstimata = r.angajati !== undefined || r.cifra !== undefined;
  const estimat = marimeEstimata || r.infiintata !== undefined || r.ca24 !== undefined;
  const cumperi = CUMPARATURI.filter((k) => alese(r.cumperi).includes(k));
  const suma = (k: Cumparatura) => (cumperi.includes(k) ? sumaDin(r[k]) : null);

  const date: DateSme = {
    forma: (r.forma as FormaJuridica | undefined) ?? d0?.forma ?? '',
    anaf: d0?.anaf ?? null,
    data: r.infiintata ?? d0?.data ?? '',
    caen: d0?.caen ?? '',
    ang: marimeEstimata ? (r.angajati ? Number(r.angajati) : null) : (d0?.ang ?? null),
    ca: marimeEstimata ? (r.cifra ? Number(r.cifra) : null) : (d0?.ca ?? null),
    act: marimeEstimata ? null : (d0?.act ?? null),
    an: marimeEstimata ? null : (d0?.an ?? null),
    ca24: r.ca24 !== undefined ? Number(r.ca24) : (d0?.ca24 ?? null),
    verde: suma('verde'),
    alte: suma('alte'),
    soft: suma('soft'),
  };

  return {
    r, cui, anaf, firma, dinAnaf: d0, incadrareAnaf, faraForma, faraCifre, faraData, faraCa24, estimat,
    date,
    evaluare: evalueazaFirmaSme(date),
    cumperi,
    rezultat: calc(date),
  };
}
