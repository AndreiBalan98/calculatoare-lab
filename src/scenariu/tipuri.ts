// Formatul scenariului: un ecran = o întrebare. Pașii sunt date; interfața doar îi desenează.
// Comun tuturor calculatoarelor: `C` e contextul fiecărui program (răspunsuri → datele motorului).

import type { FirmaAnaf, RaspunsAnaf } from '@/motor/anaf';

/** Răspunsurile date: id-ul pasului → valoarea aleasă. */
export type Raspunsuri = Record<string, string>;

/** Răspunsurile ANAF deja aduse, după CUI. */
export type CacheAnaf = Record<string, RaspunsAnaf>;

/** Ce are orice context: răspunsurile și firma de la ANAF. */
export interface ContextBaza {
  r: Raspunsuri;
  cui: string | null;
  /** undefined = încă nu știm (se caută) */
  anaf: RaspunsAnaf | undefined;
  firma: FirmaAnaf | null;
}

/** Un text fix sau calculat din context (din motor). */
export type Text<C> = string | ((c: C) => string);
/** La fel, dar poate lipsi (null = nu se arată). */
export type TextOpt<C> = string | ((c: C) => string | null);

/** Etapele din progresul de sus (cheile lor, din scenariu). */
export type Etapa = string;

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
  /** rândul de sub etichetă e un câștig („✦ Primești 20 de puncte în plus”): auriu, mai mare, cu **îngroșat** */
  detaliuCastig?: boolean;
  /** cum apare răspunsul în analiza trimisă (implicit: eticheta) */
  raspuns?: string;
  actiune?: Actiune;
}

interface Baza<C> {
  id: string;
  /** pasul apare doar dacă e îndeplinită condiția (cu răspunsurile de până la el) */
  cand?: (c: C) => boolean;
}

/** Ce au în comun ecranele de întrebare (docs/flux-edrive.md §3). */
interface Intrebare<C> extends Baza<C> {
  etapa: Etapa;
  /** linia aurie care reacționează la răspunsul de dinainte */
  ecou?: TextOpt<C>;
  /** eticheta mică de deasupra întrebării */
  eticheta?: TextOpt<C>;
  text: Text<C>;
  explicatie?: TextOpt<C>;
  antrenor?: TextOpt<C>;
  nota?: TextOpt<C>;
}

export interface PasCui<C> extends Intrebare<C> {
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

/** Un rând din cardul firmei. */
export interface RandCard {
  eticheta: string;
  valoare: string;
  /** cifra-cheie (categoria), îngroșată */
  accent?: boolean;
}

export interface PasCardFirma<C> extends Intrebare<C> {
  tip: 'cardFirma';
  optiuni: Optiune[];
  /** rândurile cardului (denumirea e mereu titlul) */
  randuri: (c: C) => RandCard[];
  /** avertismentele, ca rânduri `warn` în card */
  avert: (c: C) => string[];
}

export interface PasAlegere<C> extends Intrebare<C> {
  tip: 'alegere';
  optiuni: Optiune[] | ((c: C) => Optiune[]);
  /** butoane mici în grilă (cifre), nu pe toată lățimea */
  grila?: boolean;
  /** „Mai multe”: se arată doar opțiunile până la `de`; restul apar în locul lor, în același ecran */
  maiMulte?: { eticheta: string; de: number };
}

/** Alegerea multiplă: butoane-comutator și „Continuă”; răspunsul = valorile alese, cu virgulă. */
export interface PasMultipla<C> extends Intrebare<C> {
  tip: 'multipla';
  optiuni: Optiune[];
  continua: string;
}

export interface AltaSuma {
  eticheta: string;
  placeholder: string;
  buton: string;
  eroare: string;
  /** unitatea din câmp (implicit „€”) */
  unitate?: string;
  /** cum se scrie suma exactă pe butonul preselectat (implicit în euro) */
  format?: (n: number) => string;
}

export interface PasSuma<C> extends Intrebare<C> {
  tip: 'suma';
  /** butoanele cu valori rotunde; valoarea e „~25000”, „aceeasi” sau o sumă exactă */
  optiuni: (c: C) => Optiune[];
  altaSuma: AltaSuma;
  /** cum apare un răspuns (pe butonul preselectat și în analiză) */
  raspuns: (valoare: string, c: C) => string;
}

export interface PasOprire<C> extends Baza<C> {
  tip: 'oprire';
  etapa: Etapa;
  titlu: Text<C>;
  motive: (c: C) => string[];
  text: Text<C>;
  butoane: Optiune[];
}

export interface PasRezultat<C> extends Baza<C> {
  tip: 'rezultat';
  etapa: Etapa;
}

/** Pași care se repetă (ex. pentru fiecare mașină), după contextul de la începutul grupului. */
export interface Grup<C> {
  tip: 'grup';
  id: string;
  pasi: (c: C) => Pas<C>[];
}

export type PasIntrebare<C> = PasAlegere<C> | PasSuma<C> | PasMultipla<C>;
export type Pas<C> = PasCui<C> | PasCardFirma<C> | PasAlegere<C> | PasSuma<C> | PasMultipla<C> | PasOprire<C> | PasRezultat<C>;

/** Câte întrebări are fiecare etapă în drum și câte au răspuns. */
export type ProgresEtape = Record<Etapa, { total: number; raspunse: number }>;

export interface Scenariu<C extends ContextBaza> {
  /** etapele progresului de sus, în ordine; ultima e rezultatul */
  etape: readonly { cheie: Etapa; nume: string }[];
  /** răspunsurile acceptate (și răspunsurile ANAF) → contextul, cu datele motorului */
  context: (r: Raspunsuri, cache: CacheAnaf) => C;
  pasi: (Pas<C> | Grup<C>)[];
  /** câte întrebări estimăm pe etapă pentru ce n-am văzut încă (umplerea progresului) */
  estimari: (c: C, acceptate: Raspunsuri) => Partial<Record<Etapa, number>>;
}

export const rezolva = <C>(t: Text<C>, c: C): string => (typeof t === 'function' ? t(c) : t);
export const rezolvaOpt = <C>(t: TextOpt<C> | undefined, c: C): string | null =>
  t === undefined ? null : typeof t === 'function' ? t(c) : t;
