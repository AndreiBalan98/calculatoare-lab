// CUI-urile demo pentru SME Eco-Tech (evident nereale), cu bilanțurile pe 3 ani (`istoric=1`):
// servite mereu din aceste fixture-uri, fără apel la site. Lista e și în README.md.

import type { FirmaAnaf } from '../../anaf';
import f21 from './21.json';
import f22 from './22.json';
import f23 from './23.json';
import f24 from './24.json';
import f25 from './25.json';
import f26 from './26.json';
import f27 from './27.json';
import f28 from './28.json';

export interface FirmaDemo {
  descriere: string;
  raspuns: FirmaAnaf;
}

export const FIRME_DEMO_SME: Record<string, FirmaDemo> = {
  '21': { descriere: 'micro, din 2015, CA 2024 = 1.200.000 lei: totul în regulă', raspuns: f21 as FirmaAnaf },
  '22': { descriere: 'întreprindere mijlocie, din 2008: totul în regulă', raspuns: f22 as FirmaAnaf },
  '23': { descriere: 'înființată în 2023: oprire', raspuns: f23 as FirmaAnaf },
  '24': { descriere: 'cifra de afaceri 2024 = 0: oprire', raspuns: f24 as FirmaAnaf },
  '25': { descriere: 'CAEN 1102 (vinuri): oprire', raspuns: f25 as FirmaAnaf },
  '26': { descriere: 'bilanțul 2024 lipsă: întreabă F5', raspuns: f26 as FirmaAnaf },
  '27': { descriere: 'inactivă fiscal: avertisment', raspuns: f27 as FirmaAnaf },
  '28': { descriere: 'cooperativă: oprire', raspuns: f28 as FirmaAnaf },
};
