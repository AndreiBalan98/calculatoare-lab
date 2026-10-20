// Încadrarea firmei (micro / mică / mijlocie) doar din datele firmei, pentru banda de scor
// („Pornești cu 80 de puncte”) imediat după pasul firmei. Nu are reguli proprii:
// totul vine din calc(), chemat cu o firmă altfel neutră.

import { calc, type DateEdrive, type RezultatEdrive } from './calc';
import type { Marime } from './config';

export interface DateMarime {
  ang: number | null;
  /** lei */
  ca: number | null;
  /** lei */
  act: number | null;
  /** anul bilanțului sau null (= cursul anului implicit) */
  an: number | null;
}

export type Incadrare =
  | { status: 'imm'; marime: Marime; puncte: number; curs: number; anCurs: number }
  | { status: 'neimm'; motiv: string }
  | { status: 'incomplet'; lipsa: string[]; erori: { ang?: string; ca?: string; act?: string } };

const FIRMA_NEUTRA: DateEdrive = {
  forma: 'soc', caen: '', ang: null, ca: null, act: null, dat: null, cap: null,
  vechi: 'da', veh: [], an: null, anaf: null,
};

function dinRezultat(r: RezultatEdrive): Incadrare {
  if (r.marime) {
    return { status: 'imm', marime: r.marime, puncte: r.p1, curs: r.curs, anCurs: r.anCurs };
  }
  // Cu o firmă neutră, singurul motiv posibil e cel de mărime.
  if (r.motive.length) return { status: 'neimm', motiv: r.motive[0] };
  const erori: { ang?: string; ca?: string; act?: string } = {};
  for (const k of ['ang', 'ca', 'act'] as const) {
    if (r.err[k] && r.err[k] !== 'req') erori[k] = r.err[k];
  }
  return { status: 'incomplet', lipsa: r.lipsa, erori };
}

export function incadrare(d: DateMarime): Incadrare {
  return dinRezultat(calc({ ...FIRMA_NEUTRA, ang: d.ang, ca: d.ca, act: d.act, an: d.an }));
}

export interface EvaluareFirma {
  incadrare: Incadrare;
  /** motivele de oprire care țin doar de firmă (forma, ANAF, CAEN, mărimea) */
  motive: string[];
  /** avertismentele care țin doar de firmă (inactivă, datorii / capitaluri) */
  avert: string[];
  /** ce lipsește din datele firmei (forma juridică, angajați, cifra de afaceri) */
  lipsa: string[];
}

/**
 * Evaluarea firmei după pasul ANAF, înainte de întrebările despre mașini:
 * calc() pe datele firmei, cu partea de mașini lăsată deoparte.
 */
export function evalueazaFirma(
  d: Pick<DateEdrive, 'forma' | 'caen' | 'ang' | 'ca' | 'act' | 'dat' | 'cap' | 'an' | 'anaf'>,
): EvaluareFirma {
  const r = calc({ ...d, vechi: 'da', veh: [] });
  return { incadrare: incadrare(d), motive: r.motive, avert: r.avert, lipsa: r.lipsa };
}
