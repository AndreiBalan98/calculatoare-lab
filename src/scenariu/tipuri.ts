// Formatul scenariului: o conversație = o listă de pași. Pașii sunt date; interfața doar îi desenează.

import type { Context, Masina } from './context';

/** Un text fix sau calculat din context (din motor). */
export type Text = string | ((c: Context) => string);
/** La fel, dar poate lipsi (null = nu se arată). */
export type TextOpt = string | ((c: Context) => string | null);

/** Ce face un buton în afară de a răspunde. */
export type Actiune =
  | { tip: 'altCui' } // înapoi la CUI, de la zero cu firma
  | { tip: 'reia' } // totul de la început
  | { tip: 'suna' } // link tel:
  | { tip: 'inapoi'; pas: string }; // redeschide o întrebare

export interface Optiune {
  valoare: string;
  /** textul de pe buton */
  eticheta: string;
  /** cum apare răspunsul în fir (implicit: eticheta) */
  raspuns?: string;
  actiune?: Actiune;
}

/** Felul unui mesaj al calculatorului: normal, antrenor (auriu), avertisment, informație. */
export type FelMesaj = 'normal' | 'antrenor' | 'avertisment' | 'info';

interface Baza {
  id: string;
  /** pasul apare doar dacă e îndeplinită condiția (cu răspunsurile de până la el) */
  cand?: (c: Context) => boolean;
}

export interface PasMesaj extends Baza {
  tip: 'mesaj';
  text: TextOpt;
  fel?: FelMesaj;
}

/** Mai multe mesaje la rând (ex. avertismentele motorului). */
export interface PasMesaje extends Baza {
  tip: 'mesaje';
  texte: (c: Context) => string[];
  fel?: FelMesaj;
}

/** Întrebările au și un `scurt`: rândul la care se comprimă după răspuns. */
export interface PasCui extends Baza {
  tip: 'cui';
  text: Text;
  scurt: Text;
  eticheta: string;
  placeholder: string;
  buton: string;
  cautare: string;
  /** CUI-ul scris nu e bun (nu e format doar din cifre sau ANAF zice că e greșit) */
  eroare: string;
  /** răspunsurile care țin de firmă și se uită când se schimbă CUI-ul */
  reseteaza: string[];
}

export interface PasCardFirma extends Baza {
  tip: 'cardFirma';
  /** mesajul de dinaintea cardului („Am găsit-o: …”) */
  text: Text;
  intrebare: Text;
  scurt: Text;
  optiuni: Optiune[];
  etichete: {
    localitatea: string;
    categoria: string;
    angajatii: string;
    necunoscut: string;
    neImm: string;
    cifre: string;
    cifreAscunde: string;
    cifreLista: (c: Context) => { eticheta: string; valoare: string }[];
    corecteaza: string;
  };
  /** răspunsul ales de linkul „corectează” din card */
  corecteaza: { raspuns: string; urmatorul: { pas: string; valoare: string } };
}

export interface PasAlegere extends Baza {
  tip: 'alegere';
  /** eticheta mică de deasupra întrebării (ex. „Autoturismul 2 din 3”) */
  eticheta?: TextOpt;
  text: Text;
  scurt: Text;
  optiuni: Optiune[] | ((c: Context) => Optiune[]);
  /** rândul mic de sub butoane */
  nota?: TextOpt;
  /** mesajul antrenorului, înainte de întrebare */
  antrenor?: TextOpt;
  /** mesajul calculatorului după răspuns */
  reactie?: (valoare: string, c: Context) => string | null;
}

export interface PasSuma extends Baza {
  tip: 'suma';
  eticheta?: TextOpt;
  text: Text;
  scurt: Text;
  /** butoanele cu valori rotunde; valoarea e „~25000”, „aceeasi” sau o sumă exactă */
  optiuni: (c: Context) => Optiune[];
  nota?: TextOpt;
  altaSuma: { eticheta: string; placeholder: string; buton: string };
  /** cum apare un răspuns în fir */
  raspuns: (valoare: string, c: Context) => string;
  reactie?: (valoare: string, c: Context) => string | null;
}

export interface PasOprire extends Baza {
  tip: 'oprire';
  titlu: Text;
  motive: (c: Context) => string[];
  text: Text;
  butoane: Optiune[];
}

export interface PasRezultat extends Baza {
  tip: 'rezultat';
}

/** Pașii de mai jos se repetă pentru fiecare mașină înlocuită. */
export interface GrupMasina {
  tip: 'pentruFiecareMasina';
  id: string;
  pasi: (m: Masina) => Pas[];
}

export type PasIntrebare = PasAlegere | PasSuma;
export type Pas = PasMesaj | PasMesaje | PasCui | PasCardFirma | PasAlegere | PasSuma | PasOprire | PasRezultat;
export type Scenariu = (Pas | GrupMasina)[];

export const rezolva = (t: Text, c: Context): string => (typeof t === 'function' ? t(c) : t);
export const rezolvaOpt = (t: TextOpt | undefined, c: Context): string | null =>
  t === undefined ? null : typeof t === 'function' ? t(c) : t;
