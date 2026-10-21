// Un calculator = un „program”: scenariul (pașii și contextul lui) plus ce e specific în jurul
// ecranelor comune: banda, rândul de rezultat din progres, ecranul de rezultat, drumul până la
// bani, glosarul și analiza trimisă. Interfața (src/ui/ecrane) e aceeași pentru toate.
// Doar date și funcții pure: fără React.

import type { Derulare, Ecran } from './derulare';
import type { ContextBaza, Raspunsuri, Scenariu } from './tipuri';

/** Banda programului (doar pe primul ecran), ca `.dd-program-banda` de pe site. */
export interface DateProgram {
  categorie: string;
  stare: string;
  /** culoarea insignei: verde „Activ” sau auriu „Anunțat” (implicit) */
  stareTon?: 'activ' | 'anuntat';
  titlu: string;
  rezumat: string;
}

/** O explicație din glosar. */
export interface Termen {
  titlu: string;
  text: string;
}

export interface Contact {
  nume: string;
  telefon: string;
  email: string;
}

/** O bucată din rândul cu rezultatul pe parcurs: text sau o cifră care numără. */
export type BucataRand = string | {
  numar: number;
  format?: (n: number) => string;
  /** la creștere apare „+N” auriu lângă ea (punctele e-DRIVE) */
  castig?: boolean;
  /** o cheie nouă = altă cifră, care numără de la 0 (nu de la valoarea veche) */
  cheie?: string;
};

export interface DateDrum {
  titlu: string;
  urmatorul: string;
  pasi: { titlu: string; text: string }[];
}

/** Un segment din bara banilor; `culoare` = clasa Tailwind de fond. */
export interface Segment {
  cheie: string;
  eticheta: string;
  valoare: number;
  culoare: string;
}

export interface CasetaDeStiut {
  text: string;
  /** culorile mesajelor de stare de pe site (docs/design.md §1) */
  ton: 'avertisment' | 'sfat' | 'info';
}

/** Ce arată ecranul de rezultat; toate cifrele vin din motor. */
export interface VedereRezultat {
  /** varianta (ex. „ok” / „proiect”): la schimbare, conținutul se schimbă animat, în același ecran */
  varianta: string;
  eticheta: string;
  /** cifra mare care numără */
  cifra: number;
  format?: (n: number) => string;
  /** textul de lângă cifră („din 100”, „lei grant”) */
  din: string;
  /** cifra gri (proiectul nu se încadrează încă) */
  gri?: boolean;
  /** cifră mai mică (sume lungi pe telefon) */
  cifraMica?: boolean;
  /** „estimat din ce ne-ai spus” */
  estimat: string | null;
  /** un titlu în locul propozițiilor */
  titlu: string | null;
  propozitii: string[];
  /** rânduri `warn` (de ce proiectul nu se încadrează) */
  probleme: string[];
  bara: { titlu: string; segmente: Segment[]; total: number; format: (n: number) => string } | null;
  /** un rând sub bară */
  rand: string | null;
  antrenor: { text: string; detaliu: string | null; aplica: boolean } | null;
  deStiut: CasetaDeStiut[];
  drum: boolean;
  /** butonul „Trimite-ne analiza” */
  trimite: boolean;
  nota: string;
  schimba: string;
}

export interface Program<C extends ContextBaza> {
  scenariu: Scenariu<C>;
  banda: DateProgram;
  /** căutarea cere și bilanțurile pe 3 ani (`istoric=1`) */
  istoric?: boolean;
  /** rândul cu rezultatul pe parcurs, sub linia progresului (null = nu se arată) */
  rand: (d: Derulare<C>, e: Ecran<C>) => BucataRand[] | null;
  rezultat: (c: C) => VedereRezultat;
  /** „Aplică” la antrenorul de pe rezultat */
  aplica: (r: Raspunsuri, c: C) => Raspunsuri;
  /** unde duce „Schimbă răspunsurile” de pe rezultat */
  schimbaPas: string;
  drum: DateDrum;
  glosar: Record<string, Termen>;
  /** analiza trimisă din foaia „Trimite-ne analiza” */
  analiza: (d: Derulare<C>, contact: Contact) => unknown;
}
