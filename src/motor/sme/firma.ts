// Firma singură (după ANAF sau după răspunsurile omului, înainte de sume) și antrenorul de
// pe „alte echipamente”. Fără reguli proprii: totul vine din calc().

import { calc, verdeSuficient, type DateSme } from './calc';
import { CONFIG, type MarimeSme } from './config';

export type DateFirmaSme = Omit<DateSme, 'verde' | 'alte' | 'soft'>;

export type IncadrareSme =
  | { status: 'imm'; marime: MarimeSme }
  | { status: 'neimm'; motiv: string }
  | { status: 'incomplet' };

export interface EvaluareFirmaSme {
  /** mărimea, doar din angajați, cifra de afaceri și active */
  incadrare: IncadrareSme;
  /** motivele de oprire care țin de firmă (forma, ANAF, vechimea, CAEN, mărimea, cifra de afaceri 2024) */
  motive: string[];
  /** avertismentele care țin de firmă (inactivă fiscal) */
  avert: string[];
  /** ce lipsește din datele firmei */
  lipsa: string[];
  /** datele firmei sunt complete și fără opriri */
  gata: boolean;
}

// O investiție simbolică, ca partea de sume să nu adauge nimic la „lipsa” firmei.
const SUME = { verde: 1, alte: null, soft: null };

// O firmă altfel neutră: doar mărimea poate da o oprire.
const NEUTRA: DateFirmaSme = {
  forma: 'soc', anaf: null, data: CONFIG.infiintataPana, caen: '', ang: null, ca: null, act: null, an: null, ca24: 1,
};

export function incadrareSme(d: Pick<DateFirmaSme, 'ang' | 'ca' | 'act' | 'an'>): IncadrareSme {
  const r = calc({ ...NEUTRA, ...SUME, ang: d.ang, ca: d.ca, act: d.act, an: d.an });
  if (r.marime) return { status: 'imm', marime: r.marime };
  if (r.motive.length) return { status: 'neimm', motiv: r.motive[0] };
  return { status: 'incomplet' };
}

export function evalueazaFirmaSme(d: DateFirmaSme): EvaluareFirmaSme {
  const r = calc({ ...d, ...SUME });
  return {
    incadrare: incadrareSme(d),
    motive: r.motive,
    avert: r.avert,
    lipsa: r.lipsa,
    gata: r.status === 'ok' || r.status === 'proiect',
  };
}

/**
 * Antrenorul de pe „alte echipamente”: cât pot fi alte echipamente (lei, rotunjit în jos)
 * fără ca partea verde să scadă sub minimul din calc(), cu software-ul dat (implicit 0).
 */
export function alteMaxim(verde: number, soft = 0): number {
  const softElig = Math.min(soft, CONFIG.softwareMax);
  const ok = (alte: number) => verdeSuficient(calc({ ...NEUTRA, verde, alte, soft }));
  let x = Math.max(0, Math.floor(verde * (1 - CONFIG.verdeMin) / CONFIG.verdeMin - softElig));
  while (x > 0 && !ok(x)) x--;
  while (ok(x + 1)) x++;
  return x;
}
