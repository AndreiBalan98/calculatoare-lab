// Motorul e-DRIVE: portare identică a calc() din docs/referinta/edrive-motor-wp.js
// (între LOGIC START / LOGIC END). Aceleași reguli, aceleași texte, aceleași cifre.
// TypeScript pur: fără React / Next / DOM, ca să poată fi dus înapoi în WordPress.

import { CONFIG, type Marime } from './config';

export type FormaJuridica = '' | 'soc' | 'pfa' | 'alta';
export type SituatieVechi = '' | 'da' | 'promisiune';
export type CategorieVehicul = 'M1' | 'M2';

export interface Vehicul {
  cat: CategorieVehicul;
  /** € fără TVA; null = necompletat, NaN = scris greșit */
  pret: number | null;
  /** asamblat în UE */
  ue: boolean;
}

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
export interface DateEdrive {
  forma: FormaJuridica;
  caen: string;
  ang: number | null;
  ca: number | null;
  act: number | null;
  dat: number | null;
  cap: number | null;
  vechi: SituatieVechi;
  veh: Vehicul[];
  /** anul bilanțului sau null */
  an: number | null;
  anaf: StareAnaf | null;
}

export interface Sfat {
  text: string;
  apply?: 'ue';
}

export interface RezultatEdrive {
  status: 'ok' | 'incomplet' | 'neeligibil';
  /** '' = ok, 'req' = gol, altfel mesajul de eroare; chei: ang, ca, act, dat, cap, v0, v1... */
  err: Record<string, string>;
  motive: string[];
  lipsa: string[];
  avert: string[];
  tips: Sfat[];
  marime: Marime | null;
  p1: number;
  p2: number;
  total: number;
  ajutor: number;
  fara: number;
  tvaSuma: number;
  platesti: number;
  curs: number;
  anCurs: number;
}

function cursPentru(an: number | null): number | undefined {
  return an === null ? undefined : CONFIG.curs[an];
}

export function fmt(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('ro-RO');
}

export function eur(n: number): string {
  return Math.round(n).toLocaleString('ro-RO') + ' €';
}

export function norm(s: unknown): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

/** Citește numere scrise românește: 25.000 / 25000 / 12,5; cu neg, acceptă și minus. */
export function parseNum(str: unknown, bani?: boolean, neg?: boolean): number | null {
  let s = String(str).replace(/\s/g, '');
  if (s === '') return null;
  let minus = false;
  if (neg) {
    if (s.charAt(0) === '-') {
      minus = true;
      s = s.slice(1);
    }
  }
  if (!/^[0-9.,]+$/.test(s)) return NaN;
  if (s.indexOf(',') !== -1) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (bani) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  }
  if ((s.match(/[.,]/g) || []).length > 1) return NaN;
  const v = parseFloat(s);
  if (isNaN(v)) return NaN;
  return minus ? -v : v;
}

/** '' = ok, 'req' = gol, altfel mesajul de eroare. */
export function verifica(v: number | null, poateZero?: boolean, poateNeg?: boolean): string {
  if (v === null) return 'req';
  if (isNaN(v)) return 'Scrie doar cifre, de exemplu 25.000.';
  if (poateNeg) return '';
  if (v < 0) return 'Valoarea nu poate fi negativă.';
  if (!poateZero) {
    if (v === 0) return 'Valoarea trebuie să fie mai mare decât 0.';
  }
  return '';
}

export function calc(d: DateEdrive): RezultatEdrive {
  const cursAn = cursPentru(d.an);
  const r: RezultatEdrive = {
    status: 'ok', err: {}, motive: [], lipsa: [], avert: [], tips: [], marime: null,
    p1: 0, p2: 0, total: 0, ajutor: 0, fara: 0, tvaSuma: 0, platesti: 0,
    curs: cursAn || CONFIG.curs[CONFIG.anCurs],
    anCurs: cursAn ? (d.an as number) : CONFIG.anCurs,
  };

  // Forma juridică
  if (!d.forma) r.lipsa.push('forma juridică');
  else if (d.forma === 'pfa') r.motive.push('PFA-urile și întreprinderile individuale sau familiale nu pot aplica; programul e doar pentru societăți comerciale.');
  else if (d.forma === 'alta') r.motive.push('Pot aplica doar societățile comerciale (SRL, SA etc.).');

  // Starea de la ANAF
  if (d.anaf) {
    if (d.anaf.radiat) r.motive.push('Firma apare radiată la ANAF.');
    else if (d.anaf.stareRea) r.motive.push('La ANAF, starea firmei este „' + d.anaf.stare + '”. Firmele în insolvență, faliment, lichidare sau cu activitatea suspendată nu pot aplica.');
    if (d.anaf.inactiv) r.avert.push('ANAF declară firma inactivă fiscal. Clarifică situația înainte de depunere.');
  }

  // CAEN
  const caen = String(d.caen || '').replace(/\D/g, '');
  if (caen.length >= 2) {
    if (CONFIG.caenExclus.indexOf(caen.slice(0, 2)) !== -1) r.motive.push('Codul CAEN ' + caen + ' ține de un domeniu exclus (agricultură primară, pescuit sau acvacultură).');
  }

  // Mărimea firmei
  r.err.ang = verifica(d.ang, true);
  if (!r.err.ang) {
    if ((d.ang as number) % 1 !== 0) r.err.ang = 'Scrie un număr întreg.';
  }
  r.err.ca = verifica(d.ca, true);
  r.err.act = verifica(d.act, true);
  if (r.err.ca === 'req') {
    if (r.err.act === '') r.err.ca = '';
  }
  if (r.err.act === 'req') {
    if (r.err.ca === '') r.err.act = '';
  }
  r.err.dat = verifica(d.dat, true);
  r.err.cap = verifica(d.cap, true, true);
  if (r.err.dat === 'req') r.err.dat = '';
  if (r.err.cap === 'req') r.err.cap = '';
  if (r.err.ang === 'req') r.lipsa.push('numărul de angajați');
  if (r.err.ca === 'req') r.lipsa.push('cifra de afaceri sau activele');
  if (!r.err.ang) {
    if (!(r.err.ca || r.err.act)) {
      const ang = d.ang as number;
      const caE = d.ca === null ? Infinity : d.ca / r.curs;
      const actE = d.act === null ? Infinity : d.act / r.curs;
      for (let i = 0; i < CONFIG.marimi.length; i++) {
        const m = CONFIG.marimi[i];
        if (ang < m.ang) {
          if (caE <= m.ca || actE <= m.act) {
            r.marime = m;
            break;
          }
        }
      }
      if (!r.marime) r.motive.push('Firma nu e IMM: are 250 de angajați sau mai mult ori depășește 50 mil. € cifră de afaceri și 43 mil. € active.');
    }
  }

  // Raportul datorii / capitaluri proprii (nu e eliminatoriu)
  if (!r.err.dat) {
    if (!r.err.cap) {
      if (d.dat !== null) {
        if (d.cap !== null) {
          if (d.cap <= 0) r.avert.push('Capitalurile proprii sunt negative sau zero: ai nevoie de o scrisoare de bonitate de la bancă (condiția nu e eliminatorie).');
          else if (d.dat / d.cap >= CONFIG.raportMax) r.avert.push('Raportul datorii / capitaluri proprii e ' + fmt(d.dat / d.cap) + ', peste ' + fmt(CONFIG.raportMax) + ': ai nevoie de o scrisoare de bonitate de la bancă (condiția nu e eliminatorie).');
        }
      }
    }
  }

  // Mașinile înlocuite
  if (!d.vechi) r.lipsa.push('situația mașinilor înlocuite');
  else if (d.vechi === 'promisiune') r.avert.push('Cu promisiunea notarială, cumperi mașina veche de la același vânzător și o înmatriculezi pe firmă înainte de contractul de finanțare. Costul ei nu se decontează; dacă vânzătorul se răzgândește, proiectul cade.');

  // Mașinile electrice
  let areVeh = false;
  let lipsaPret = false;
  let toateUE = true;
  let eligibil = 0;
  d.veh.forEach((v, i) => {
    const e = verifica(v.pret, false);
    r.err['v' + i] = e;
    if (e === 'req') lipsaPret = true;
    if (e) return;
    const pret = v.pret as number;
    areVeh = true;
    r.fara += pret;
    eligibil += v.cat === 'M1' ? Math.min(pret, CONFIG.plafonM1) : pret;
    if (!v.ue) toateUE = false;
    if (v.cat === 'M1') {
      if (pret > CONFIG.plafonM1) r.tips.push({ text: 'Mașina ' + (i + 1) + ' trece de ' + eur(CONFIG.plafonM1) + ' fără TVA: diferența de ' + eur(pret - CONFIG.plafonM1) + ' o plătești tu.' });
    }
  });
  if (lipsaPret) r.lipsa.push('prețul fiecărei mașini electrice');
  r.ajutor = eligibil;
  r.tvaSuma = r.fara * CONFIG.tva;
  r.platesti = r.fara - r.ajutor + r.tvaSuma;

  // Punctajul
  if (r.marime) r.p1 = r.marime.puncte;
  r.p2 = areVeh ? (toateUE ? CONFIG.bonusUE : 0) : 0;
  r.total = r.p1 + r.p2;
  if (areVeh) {
    if (!toateUE) r.tips.unshift({ text: 'Alege modele asamblate în UE: +' + CONFIG.bonusUE + ' puncte.', apply: 'ue' });
  }
  r.tips.push({ text: 'Pregătește dosarul din timp: la punctaj egal decide ora depunerii.' });

  // Starea
  const areErr = Object.keys(r.err).some((k) => r.err[k] !== '');
  if (r.motive.length) r.status = 'neeligibil';
  else if (r.lipsa.length || areErr || !areVeh) r.status = 'incomplet';
  return r;
}
