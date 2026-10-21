// Motorul SME Eco-Tech: portare identică a calc() din docs/referinta/sme-motor-wp.js
// (între LOGIC START / LOGIC END). Aceleași reguli, aceleași texte, aceleași cifre.
// TypeScript pur: fără React / Next / DOM, ca să poată fi dus înapoi în WordPress.

import { CONFIG, type MarimeSme } from './config';

export type FormaJuridica = '' | 'soc' | 'pfa' | 'alta';

export interface StareAnaf {
  radiat: boolean;
  inactiv: boolean;
  stare: string;
  stareRea: boolean;
}

/**
 * Datele de intrare. Sumele sunt în lei; null = necompletat, NaN = scris greșit
 * (așa cum le dă parseNum).
 */
export interface DateSme {
  forma: FormaJuridica;
  anaf: StareAnaf | null;
  /** data înființării, „AAAA-LL-ZZ”; '' = nu știm */
  data: string;
  caen: string;
  ang: number | null;
  ca: number | null;
  act: number | null;
  /** anul bilanțului (pentru curs) sau null */
  an: number | null;
  /** cifra de afaceri din CONFIG.anCA (2024) */
  ca24: number | null;
  /** echipamentele verzi, alte echipamente, software (lei, fără TVA) */
  verde: number | null;
  alte: number | null;
  soft: number | null;
}

export interface SfatSme {
  text: string;
  apply?: 'verde';
}

export interface RezultatSme {
  status: 'ok' | 'incomplet' | 'neeligibil' | 'proiect';
  /** '' = ok, 'req' = gol, altfel mesajul de eroare; chei: ang, ca, act, ca24, verde, alte, soft */
  err: Record<string, string>;
  motive: string[];
  lipsa: string[];
  avert: string[];
  tips: SfatSme[];
  /** de ce proiectul nu se încadrează încă (minimul, partea verde) */
  probleme: string[];
  marime: MarimeSme | null;
  /** investiția eligibilă (verzi + alte + software până la plafon) */
  total: number;
  /** 0…1 */
  verdePct: number;
  grant: number;
  credit: number;
  tvaSuma: number;
  /** software-ul peste plafon */
  nedecontat: number;
  /** TVA + software nedecontat */
  proprii: number;
  /** cât ar trebui să fie echipamentele verzi ca proiectul să se încadreze */
  verdeNou: number | null;
  curs: number;
  anCurs: number;
}

export function fmt(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('ro-RO');
}

export function lei(n: number): string {
  return Math.round(n).toLocaleString('ro-RO') + ' lei';
}

export function eur(n: number): string {
  return Math.round(n).toLocaleString('ro-RO') + ' €';
}

/** 0,6428… → 64,2 (procente, o zecimală, rotunjit în jos). */
export function pct(x: number): number {
  return Math.floor(x * 1000 + 1e-6) / 10;
}

export function norm(s: unknown): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

/** Citește numere scrise românește: 25.000 / 25000 / 12,5. */
export function parseNum(str: unknown, bani?: boolean): number | null {
  let s = String(str === undefined || str === null ? '' : str).replace(/\s/g, '');
  if (s === '') return null;
  if (!/^[0-9.,]+$/.test(s)) return NaN;
  if (s.indexOf(',') !== -1) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (bani) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  }
  if ((s.match(/[.,]/g) || []).length > 1) return NaN;
  const v = parseFloat(s);
  return isNaN(v) ? NaN : v;
}

/** '' = ok, 'req' = gol, altfel mesajul de eroare. */
export function verifica(v: number | null | undefined): string {
  if (v === null) return 'req';
  if (v === undefined || isNaN(v)) return 'Scrie doar cifre, de exemplu 25.000.';
  if (v < 0) return 'Valoarea nu poate fi negativă.';
  return '';
}

function cursPentru(an: number | null): number | undefined {
  return an === null || an === undefined ? undefined : CONFIG.curs[an];
}

export function calc(d: DateSme): RezultatSme {
  const cursAn = cursPentru(d.an);
  const r: RezultatSme = {
    status: 'ok', err: {}, motive: [], lipsa: [], avert: [], tips: [], probleme: [], marime: null,
    total: 0, verdePct: 0, grant: 0, credit: 0, tvaSuma: 0, nedecontat: 0, proprii: 0, verdeNou: null,
    curs: cursAn || CONFIG.curs[CONFIG.anCurs],
    anCurs: cursAn ? (d.an as number) : CONFIG.anCurs,
  };

  // Forma juridică
  if (!d.forma) r.lipsa.push('forma juridică');
  else if (d.forma === 'pfa') r.motive.push('PFA-urile și întreprinderile individuale sau familiale nu pot aplica; programul e doar pentru societăți.');
  else if (d.forma === 'alta') r.motive.push('Pot aplica doar societățile (SRL, SA etc.), cu capital integral privat.');

  // Starea de la ANAF
  if (d.anaf) {
    if (d.anaf.radiat) r.motive.push('Firma apare radiată la ANAF.');
    else if (d.anaf.stareRea) r.motive.push('La ANAF, starea firmei este „' + d.anaf.stare + '”. Firmele în insolvență, lichidare sau cu activitatea suspendată nu pot aplica.');
    if (d.anaf.inactiv) r.avert.push('ANAF declară firma inactivă fiscal. Clarifică situația înainte de înscriere.');
  }

  // Vechimea
  if (!d.data) r.lipsa.push('data înființării');
  else if (d.data > CONFIG.infiintataPana) r.motive.push('Firma trebuie să fie înființată cel târziu pe 31 decembrie 2021.');

  // CAEN
  const caen = String(d.caen || '').replace(/\D/g, '');
  if (caen.length >= 2) {
    for (let c = 0; c < CONFIG.caenExclus.length; c++) {
      if (caen.indexOf(CONFIG.caenExclus[c][0]) === 0) {
        r.motive.push('Codul CAEN ' + caen + ' ține de un domeniu exclus din program (' + CONFIG.caenExclus[c][1] + ').');
        break;
      }
    }
  }

  // Mărimea firmei
  r.err.ang = verifica(d.ang);
  if (!r.err.ang) {
    if ((d.ang as number) % 1 !== 0) r.err.ang = 'Scrie un număr întreg.';
  }
  r.err.ca = verifica(d.ca);
  r.err.act = verifica(d.act);
  if (r.err.ca === 'req') {
    if (r.err.act === '') r.err.ca = '';
  }
  if (r.err.act === 'req') {
    if (r.err.ca === '') r.err.act = '';
  }
  if (r.err.ang === 'req') r.lipsa.push('numărul de angajați');
  if (r.err.ca === 'req') r.lipsa.push('cifra de afaceri sau activele');
  if (!r.err.ang) {
    if (!(r.err.ca || r.err.act)) {
      const ang = d.ang as number;
      const caE = d.ca === null ? Infinity : d.ca / r.curs;
      const actE = d.act === null ? Infinity : d.act / r.curs;
      let i = 0;
      for (; i < CONFIG.marimi.length; i++) {
        const m = CONFIG.marimi[i];
        if (ang < m.ang) {
          if (caE <= m.ca || actE <= m.act) {
            r.marime = m;
            break;
          }
        }
      }
      if (!r.marime) r.motive.push('Firma nu e IMM: are 250 de angajați sau mai mult ori depășește 50 mil. € cifră de afaceri și 43 mil. € active.');
      else if (i === 0) {
        if (!CONFIG.microEligibile) r.motive.push('Microîntreprinderile nu pot aplica.');
      }
    }
  }

  // Cifra de afaceri 2024
  r.err.ca24 = verifica(d.ca24);
  if (r.err.ca24 === 'req') r.lipsa.push('cifra de afaceri ' + CONFIG.anCA);
  else if (!r.err.ca24) {
    if ((d.ca24 as number) <= 0) r.motive.push('Firma trebuie să fi avut cifră de afaceri în ' + CONFIG.anCA + '.');
  }

  // Investiția
  for (const k of ['verde', 'alte', 'soft'] as const) {
    r.err[k] = verifica(d[k]);
    if (r.err[k] === 'req') r.err[k] = '';
  }
  let v = d.verde || 0;
  let a = d.alte || 0;
  let s = d.soft || 0;
  if (r.err.verde) v = 0;
  if (r.err.alte) a = 0;
  if (r.err.soft) s = 0;
  const softElig = Math.min(s, CONFIG.softwareMax);
  r.nedecontat = s - softElig;
  r.total = v + a + softElig;
  if (r.total <= 0) {
    if (!(r.err.verde || r.err.alte || r.err.soft)) r.lipsa.push('ce vrei să cumperi');
  }
  if (r.total > 0) {
    r.verdePct = v / r.total;
    r.grant = Math.min(r.total * CONFIG.grantProcent, CONFIG.grantMax);
    r.credit = r.total - r.grant;
    r.tvaSuma = (v + a + s) * CONFIG.tva;
    r.proprii = r.tvaSuma + r.nedecontat;
    if (r.total < CONFIG.proiectMin) r.probleme.push('Investiția eligibilă e de ' + lei(r.total) + '. Minimul programului e ' + lei(CONFIG.proiectMin) + '.');
    if (r.verdePct < CONFIG.verdeMin - 1e-9) r.probleme.push('Echipamentele verzi sunt ' + pct(r.verdePct).toLocaleString('ro-RO') + '% din investiție. Minimul e 40%.');
    // Cât trebuie să ajungă echipamentele verzi ca să se îndeplinească ambele condiții
    const rest = a + softElig;
    const nou = Math.max(v, CONFIG.proiectMin - rest, Math.ceil(rest * CONFIG.verdeMin / (1 - CONFIG.verdeMin) - 1e-6));
    if (nou > v) {
      r.verdeNou = nou;
      r.tips.push({ text: 'Echipamente verzi de ' + lei(nou) + ' (cu ' + lei(nou - v) + ' mai mult): proiectul se încadrează.', apply: 'verde' });
    }
    if (r.nedecontat > 0) r.tips.push({ text: 'Software-ul se decontează până la ' + lei(CONFIG.softwareMax) + ': diferența de ' + lei(r.nedecontat) + ' o plătești tu.' });
    if (!r.probleme.length) {
      if (r.total > CONFIG.proiectMin) r.tips.push({ text: 'Grantul e la maximum de la ' + lei(CONFIG.proiectMin) + ' în sus. Ce investești peste vine din credit.' });
      r.tips.push({ text: 'Înscrie-te cât mai devreme: primul venit, primul servit. Termenul: ' + CONFIG.termen + '.' });
    }
  }

  // Starea
  const areErr = Object.keys(r.err).some((k) => (r.err[k] !== '' ? r.err[k] !== 'req' : false));
  if (r.motive.length) r.status = 'neeligibil';
  else if (r.lipsa.length || areErr) r.status = 'incomplet';
  else if (r.probleme.length) r.status = 'proiect';
  return r;
}

/** Partea verde e de cel puțin minimul programului (aceeași condiție ca în calc()). */
export function verdeSuficient(r: Pick<RezultatSme, 'verdePct'>): boolean {
  return !(r.verdePct < CONFIG.verdeMin - 1e-9);
}
