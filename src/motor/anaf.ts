// Răspunsul API-ului firmei (proxy-ul ANAF de pe site, docs/referinta/anaf-api.md), comun
// tuturor calculatoarelor. Maparea pe datele fiecărui motor stă în motor/<program>/anaf.ts.

export interface BilantAnaf {
  an?: number | null;
  angajati?: number | null;
  cifra_afaceri?: number | null;
  active?: number | null;
  datorii?: number | null;
  capitaluri?: number | null;
  capital_social?: number | null;
  profit_brut?: number | null;
  profit_net?: number | null;
}

/** Răspuns reușit (200). Câmpurile pot lipsi sau fi null. */
export interface FirmaAnaf {
  ok: true;
  cui: string;
  denumire?: string | null;
  adresa?: string | null;
  forma_juridica?: string | null;
  forma_organizare?: string | null;
  caen?: string | number | null;
  stare?: string | null;
  inactiv?: boolean | null;
  radiat?: boolean | null;
  data_inregistrare?: string | null;
  judet?: string | null;
  judet_cod?: string | null;
  /** cel mai recent bilanț */
  bilant?: BilantAnaf | null;
  /** cu `istoric=1`: bilanțurile pe 3 ani; `lipsa: true` = nepublicat în acel an */
  bilanturi?: (BilantAnaf & { lipsa?: boolean })[];
}

export type CodEroareAnaf = 'cui_invalid' | 'negasit' | 'prea_multe' | 'ocupat' | 'anaf_indisponibil';

export interface EroareAnaf {
  ok: false;
  cod: CodEroareAnaf | (string & {});
  mesaj: string;
}

export type RaspunsAnaf = FirmaAnaf | EroareAnaf;
