// Formatul scenariului: un ecran = o întrebare. Pașii sunt date; interfața doar îi desenează.

import type { Context, Masina } from './context';

/** Un text fix sau calculat din context (din motor). */
export type Text = string | ((c: Context) => string);
/** La fel, dar poate lipsi (null = nu se arată). */
export type TextOpt = string | ((c: Context) => string | null);

/** Etapele din progresul de sus. */
export type Etapa = 'firma' | 'masini' | 'pret' | 'rezultat';

/** Ce face un buton în afară de a răspunde. */
export type Actiune =
  | { tip: 'altCui' } // înapoi la CUI, cu câmpul gol
  | { tip: 'suna' } // link tel:
  | { tip: 'inapoi'; pas: string }; // la o întrebare anume

export interface Optiune {
  valoare: string;
  /** textul de pe buton */
  eticheta: string;
  /** rândul mic de sub eticheta butonului */
  detaliu?: string;
  /** cum apare răspunsul în analiza trimisă (implicit: eticheta) */
  raspuns?: string;
  actiune?: Actiune;
}

interface Baza {
  id: string;
  /** pasul apare doar dacă e îndeplinită condiția (cu răspunsurile de până la el) */
  cand?: (c: Context) => boolean;
}

/** Ce au în comun ecranele de întrebare (docs/flux-edrive.md §3). */
interface Intrebare extends Baza {
  etapa: Etapa;
  /** linia aurie care reacționează la răspunsul de dinainte */
  ecou?: TextOpt;
  /** eticheta mică de deasupra întrebării */
  eticheta?: TextOpt;
  text: Text;
  explicatie?: TextOpt;
  antrenor?: TextOpt;
  nota?: TextOpt;
}

export interface PasCui extends Intrebare {
  tip: 'cui';
  campEticheta: string;
  placeholder: string;
  buton: string;
  cautare: string;
  /** CUI-ul scris nu e bun (nu e format doar din cifre sau ANAF zice că e greșit) */
  eroare: string;
  /** răspunsurile care țin de firmă și se uită când se schimbă CUI-ul */
  reseteaza: string[];
}

export interface PasCardFirma extends Intrebare {
  tip: 'cardFirma';
  optiuni: Optiune[];
  etichete: {
    localitatea: string;
    categoria: string;
    angajatii: string;
    necunoscut: string;
    neImm: string;
  };
}

export interface PasAlegere extends Intrebare {
  tip: 'alegere';
  optiuni: Optiune[] | ((c: Context) => Optiune[]);
  /** butoane mici în grilă (cifre), nu pe toată lățimea */
  grila?: boolean;
  /** „Mai multe”: se arată doar opțiunile până la `de`; restul apar în locul lor, în același ecran */
  maiMulte?: { eticheta: string; de: number };
}

export interface PasSuma extends Intrebare {
  tip: 'suma';
  /** butoanele cu valori rotunde; valoarea e „~25000”, „aceeasi” sau o sumă exactă */
  optiuni: (c: Context) => Optiune[];
  altaSuma: { eticheta: string; placeholder: string; buton: string; eroare: string };
  /** cum apare un răspuns (pe butonul preselectat și în analiză) */
  raspuns: (valoare: string, c: Context) => string;
}

export interface PasOprire extends Baza {
  tip: 'oprire';
  etapa: Etapa;
  titlu: Text;
  motive: (c: Context) => string[];
  text: Text;
  butoane: Optiune[];
}

export interface PasRezultat extends Baza {
  tip: 'rezultat';
  etapa: Etapa;
}

/** Pașii de mai jos se repetă pentru fiecare mașină (întâi autoturismele, apoi microbuzele). */
export interface GrupMasina {
  tip: 'pentruFiecareMasina';
  id: string;
  pasi: (m: Masina) => Pas[];
}

export type PasIntrebare = PasAlegere | PasSuma;
export type Pas = PasCui | PasCardFirma | PasAlegere | PasSuma | PasOprire | PasRezultat;
export type Scenariu = (Pas | GrupMasina)[];

export const rezolva = (t: Text, c: Context): string => (typeof t === 'function' ? t(c) : t);
export const rezolvaOpt = (t: TextOpt | undefined, c: Context): string | null =>
  t === undefined ? null : typeof t === 'function' ? t(c) : t;
