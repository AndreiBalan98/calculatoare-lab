// CUI-urile demo (evident nereale): servite mereu din aceste fixture-uri, fără apel la site.
// Lista e și în README.md.

import type { FirmaAnaf } from '../anaf';
import f1 from './1.json';
import f2 from './2.json';
import f3 from './3.json';
import f4 from './4.json';
import f5 from './5.json';
import f6 from './6.json';
import f7 from './7.json';
import f8 from './8.json';
import f9 from './9.json';
import f10 from './10.json';
import f11 from './11.json';
import f12 from './12.json';

export interface FirmaDemo {
  descriere: string;
  raspuns: FirmaAnaf;
}

export const FIRME_DEMO: Record<string, FirmaDemo> = {
  '1': { descriere: 'micro, totul în regulă (80 de puncte)', raspuns: f1 as FirmaAnaf },
  '2': { descriere: 'întreprindere mică (70 de puncte)', raspuns: f2 as FirmaAnaf },
  '3': { descriere: 'întreprindere mijlocie (65 de puncte)', raspuns: f3 as FirmaAnaf },
  '4': { descriere: 'peste IMM (300 de angajați): oprire', raspuns: f4 as FirmaAnaf },
  '5': { descriere: 'PFA: oprire', raspuns: f5 as FirmaAnaf },
  '6': { descriere: 'radiată: oprire', raspuns: f6 as FirmaAnaf },
  '7': { descriere: 'în insolvență: oprire', raspuns: f7 as FirmaAnaf },
  '8': { descriere: 'CAEN 0111 (agricultură primară): oprire', raspuns: f8 as FirmaAnaf },
  '9': { descriere: 'bilanț nepublicat (bilant: null): cere datele', raspuns: f9 as FirmaAnaf },
  '10': { descriere: 'inactivă fiscal: avertisment', raspuns: f10 as FirmaAnaf },
  '11': { descriere: 'capitaluri proprii negative: avertisment (scrisoare de bonitate)', raspuns: f11 as FirmaAnaf },
  '12': { descriere: 'datorii / capitaluri ≥ 7,5: avertisment (scrisoare de bonitate)', raspuns: f12 as FirmaAnaf },
};
