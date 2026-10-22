// Varianta 2 „Cifra vie” (docs/flux-v2.md): pașii ca date, în același spirit ca v1, dar cu
// controale noi (+/−, comutatorul, glisoarele). Un pas citește și scrie **aceleași chei ca v1**
// (`nrMasini`, `pret_0`, `verde`…), ca să meargă contextele v1 neschimbate (contextDin, contextSme).
// Doar date și funcții pure: fără React.

import type { BucataRand, Program } from '../program';
import type { CacheAnaf, ContextBaza, Optiune, PasCui, PasOprire, Raspunsuri, Text, TextOpt } from '../tipuri';

/** Valorile de pe controalele unui ecran, ca text: { n: '2' }, { M1: '25000', M2: '45000' }. */
export type Valori = Record<string, string>;

/** Șoapta din card: o singură linie; cu „Aplică” când se poate aplica direct. */
export interface Soapta {
  text: string;
  aplica?: boolean;
}

/** Un glisor (o sumă). */
export interface Glisor {
  /** câmpul din Valori */
  cheie: string;
  /** eticheta mică de deasupra (null = fără, la un singur glisor) */
  eticheta: string | null;
  min: number;
  max: number;
  pas: number;
  /** valoarea de pornire (nu contează ca răspuns până la „Continuă”) */
  start: number;
  /** repere pe pistă, cu o etichetă mică */
  repere?: { valoare: number; eticheta: string }[];
  format: (n: number) => string;
  /** unitatea din câmpul numeric („€”, „lei”) */
  unitate: string;
  /** rândul mic de sub pistă */
  sub?: string | null;
}

export interface Segment {
  valoare: string;
  eticheta: string;
}

/** Ce poate face un control (fiecare scrie câmpurile lui în Valori). */
export type Control<C> =
  /** butoane, avans automat; câmpul `v` */
  | { tip: 'alegere'; optiuni: (c: C) => Optiune[] }
  /** comutatoare multiple + „Continuă”; câmpul `v` = valorile cu virgulă */
  | { tip: 'multipla'; optiuni: Optiune[]; continua: string }
  /** +/−; câmpul `n` */
  | { tip: 'numar'; min: number; max: (c: C) => number; start: number }
  /** comutatorul segmentat; câmpul `fel`; opțional, un +/− dedesubt (câmpul `n`) pentru unele segmente */
  | {
      tip: 'comutator';
      segmente: (c: C) => Segment[];
      nota?: string;
      numar?: { cand: (fel: string) => boolean; text: string; min: number; max: (c: C) => number; start: number };
    }
  /** glisoarele (sumele), unul sub altul */
  | { tip: 'glisoare'; glisoare: (c: C) => Glisor[] };

/** Un pas (o întrebare) al variantei 2. */
export interface PasV2<C> {
  tip: 'intrebare';
  id: string;
  /** pasul apare doar dacă e îndeplinită condiția (cu răspunsurile de până la el) */
  cand?: (c: C) => boolean;
  text: Text<C>;
  explicatie?: TextOpt<C>;
  control: Control<C>;
  /** răspunsul dat (din toate răspunsurile), dacă e încă valabil; null = fără răspuns */
  citeste: (r: Raspunsuri, c: C) => Valori | null;
  /** ce se știe deja, chiar dacă răspunsul nu e întreg (ex. prețul autoturismelor, fără al microbuzului) */
  partial?: (r: Raspunsuri, c: C) => Valori;
  /** scrie valorile în răspunsuri, cu cheile v1 */
  scrie: (r: Raspunsuri, v: Valori, c: C) => Raspunsuri;
  /** bucățile din rezumat, după răspuns (contextul de după) */
  rezumat?: (v: Valori, c: C) => string[];
  /** șoapta pe ecran (cu contextul care include valorile de pe controale) */
  soapta?: (c: C, v: Valori | null) => Soapta | null;
  /** „Aplică” din șoaptă: noile răspunsuri și noile valori de pe controale */
  aplica?: (r: Raspunsuri, v: Valori, c: C) => { r: Raspunsuri; v: Valori };
  /** cu aceste răspunsuri nu se poate trece mai departe (rămâi pe ecran; R-proiect la SME) */
  blocheaza?: (c: C) => boolean;
  /** valorile de pornire contează pentru cifră de la intrarea pe ecran (nu doar de la prima atingere) */
  cifraDinStart?: boolean;
  /** cardul se compactează pe acest ecran (multe glisoare) */
  compact?: (c: C) => boolean;
}

/** Un pas din varianta 2: întrebare, oprire (refolosită din v1) sau rezultatul. */
export type PasulV2<C> = PasV2<C> | PasOprire<C> | { tip: 'rezultat'; id: string };

/** Ce arată cardul cifrei (eroul). */
export interface Cifra {
  /** felul cifrei: la o cheie nouă, cifra veche pleacă și cea nouă intră (ex. puncte → euro) */
  cheie: string;
  valoare: number;
  /** doar cifrele („50.000”); unitatea e separată, mai mică */
  format: (n: number) => string;
  unitate?: string;
  /** după cifră, mai mic și stins, în locul unității („/100”) */
  din?: string;
  /** textul citit de cititorul de ecran (implicit: prefixul, cifra și unitatea) */
  eticheta?: string;
  /** câteva cuvinte deasupra cifrei, pe rândul lor („Primești până la”) */
  prefix?: string | null;
  /** rândul de sub cifră; o bucată cu `castig` primește „+N” auriu la creștere */
  rand: BucataRand[];
  /** în locul rândului: de ce e cifra așa („Pornești cu **80 de puncte**, pentru că…”), mai mare */
  deCe?: string | null;
  /** cifra gri (proiectul nu se încadrează încă) */
  gri?: boolean;
  /** indicatorul părții verzi (SME) */
  indicator?: Indicator | null;
}

export interface Indicator {
  /** 0…1 */
  parte: number;
  /** reperul (0…1) */
  minim: number;
  eticheta: string;
  reper: string;
  ok: boolean;
  /** rândul de sub bară (doar când proiectul e sub minim) */
  sub: string | null;
}

/** Antetul cardului: denumirea, categoria · localitatea, rânduri mici și avertismentele. */
export interface AntetCard {
  titlu: string;
  randuri: string[];
  avert: string[];
}

/** O bucată din rezumat: textul și pasul la care duce. */
export interface BucataRezumat {
  pas: string;
  text: string;
  /** pașii de după `pas` pe care îi spune și bucata asta (comasate): după `pas`, omul trece și prin ei */
  si?: string[];
}

/** Calculatorul în varianta 2: programul v1 (motorul, contextul, rezultatul, drumul…) + pașii noi. */
export interface ProgramV2<C extends ContextBaza> {
  v1: Program<C>;
  /** textele ecranului CUI (câmpul, butonul și erorile vin din pasul v1) */
  cui: { text: string; cautare: string };
  /** E2 · Firma: întrebarea și butoanele (valorile v1: 'da' / 'corectez') */
  firma: { text: string; optiuni: Optiune[] };
  /** pașii de după firmă */
  pasi: PasulV2<C>[];
  /** câte întrebări estimăm în total (umplerea liniei de progres) */
  estimare: (c: C) => number;
  antet: (c: C) => AntetCard;
  /** cifra din card pe ecranul dat (null = încă nu) */
  cifra: (c: C, d: DerulareV2<C>, e: EcranV2<C>) => Cifra | null;
  /** rezumatul, după ce l-au scris pașii (ex. comasează bucățile care spun același lucru) */
  rezumat?: (b: BucataRezumat[], c: C) => BucataRezumat[];
  /** rezumatul ca „pastile”, cu eticheta „Răspunsurile tale” și zborul răspunsului (altfel: un rând simplu) */
  pastile?: boolean;
}

/** Răspunsurile ANAF + cele date → contextul (al programului v1). */
export type ContextDin<C> = (r: Raspunsuri, cache: CacheAnaf) => C;

interface ComunEcran<C> {
  cheie: string;
  /** contextul de dinaintea răspunsului */
  ctx: C;
}

export type EcranV2<C> =
  | ComunEcran<C> & { tip: 'cui'; pas: PasCui<C>; text: string; eroare: string | null; raspuns: string | null }
  | ComunEcran<C> & { tip: 'cautare'; pas: PasCui<C>; text: string }
  | ComunEcran<C> & {
      tip: 'intrebare';
      pas: PasV2<C>;
      text: string;
      explicatie: string | null;
      /** răspunsul dat (preselectat) */
      raspuns: Valori | null;
      /** ce se știe deja din răspuns, când nu e întreg */
      partial: Valori | null;
      /** răspunsul e dat, dar nu se poate trece mai departe cu el */
      blocat: boolean;
    }
  | ComunEcran<C> & { tip: 'oprire'; pas: PasOprire<C>; titlu: string; motive: string[]; text: string }
  | ComunEcran<C> & { tip: 'rezultat' };

export interface DerulareV2<C extends ContextBaza> {
  /** drumul: ecranele în ordine; ultimul e cel care așteaptă (sau capătul) */
  ecrane: EcranV2<C>[];
  /** contextul cu toate răspunsurile acceptate */
  ctx: C;
  acceptate: Raspunsuri;
  /** se caută firma la ANAF pentru acest CUI */
  cauta: string | null;
  gata: boolean;
  /** cât din linia de progres e plin (0…1) */
  umplere: number;
  /** bucățile rezumatului, cu pasul la care duce fiecare */
  rezumat: BucataRezumat[];
}
