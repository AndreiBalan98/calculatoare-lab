// Maparea răspunsului ANAF (cu `istoric=1`) pe datele motorului SME: portare identică a
// dinAnaf() din docs/referinta/sme-motor-wp.js (adaptarea lui aplicaAnaf() de pe site).

import type { BilantAnaf, FirmaAnaf } from '../anaf';
import { CONFIG } from './config';
import { norm, type DateSme } from './calc';

/** Partea din DateSme care vine de la ANAF (fără sume). */
export type DateDinAnafSme = Pick<DateSme, 'anaf' | 'forma' | 'data' | 'caen' | 'an' | 'ang' | 'ca' | 'act' | 'ca24'>;

const definit = (x: number | null | undefined): x is number => x !== null && x !== undefined;

export function dinAnaf(j: FirmaAnaf): DateDinAnafSme {
  const anaf = {
    radiat: !!j.radiat,
    inactiv: !!j.inactiv,
    stare: j.stare || '',
    stareRea: /INSOLV|FALIMENT|LICHID|DIZOLV|SUSPEND|RADIER/.test(norm(j.stare)),
  };
  const fj = norm((j.forma_juridica || '') + ' ' + (j.forma_organizare || ''));
  let forma: DateSme['forma'];
  if (/PERSOANA FIZICA|INTREPRINDERE INDIVIDUALA|INTREPRINDERE FAMILIALA/.test(fj)) forma = 'pfa';
  else if (/COOPERATIV/.test(fj)) forma = 'alta';
  else if (/SOCIETATE|RASPUNDERE LIMITATA|PE ACTIUNI/.test(fj)) forma = 'soc';
  else forma = '';
  const ani: Record<string, BilantAnaf> = {};
  for (const b of j.bilanturi || (j.bilant ? [j.bilant] : [])) {
    if (b) {
      if (!('lipsa' in b && b.lipsa)) ani[String(b.an)] = b;
    }
  }
  const b = j.bilant;
  // În referință, un bilanț fără `an` dă `an: undefined`; în calc() are același efect ca null.
  const an = b ? (b.an ?? null) : null;
  let ang: number | null = null;
  let ca: number | null = null;
  let act: number | null = null;
  let ca24: number | null = null;
  if (b) {
    if (definit(b.angajati)) ang = Math.round(b.angajati);
    if (definit(b.cifra_afaceri)) ca = Math.round(b.cifra_afaceri);
    if (definit(b.active)) act = Math.round(b.active);
  }
  const b24 = ani[String(CONFIG.anCA)];
  if (b24) {
    if (definit(b24.cifra_afaceri)) ca24 = Math.round(b24.cifra_afaceri);
  }
  return {
    anaf,
    forma,
    data: j.data_inregistrare ? String(j.data_inregistrare).slice(0, 10) : '',
    caen: j.caen ? String(j.caen) : '',
    an,
    ang,
    ca,
    act,
    ca24,
  };
}
