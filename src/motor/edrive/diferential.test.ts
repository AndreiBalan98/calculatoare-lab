// Testarea diferențială: motorul de pe site (docs/referinta/edrive-motor-wp.js, nemodificat,
// încărcat cu node:vm) și portarea în TypeScript trebuie să dea exact aceleași rezultate.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { dinAnaf, type FirmaAnaf } from './anaf';
import { calc, eur, fmt, norm, parseNum, verifica, type DateEdrive, type Vehicul } from './calc';
import { CONFIG } from './config';

interface MotorReferinta {
  CONFIG: unknown;
  calc: (d: unknown) => unknown;
  parseNum: (s: unknown, bani?: boolean, neg?: boolean) => number | null;
  verifica: (v: unknown, poateZero?: boolean, poateNeg?: boolean) => string;
  fmt: (n: number) => string;
  eur: (n: number) => string;
  norm: (s: unknown) => string;
  dinAnaf: (j: unknown) => Record<string, unknown>;
}

function incarcaReferinta(): MotorReferinta {
  const cale = resolve(process.cwd(), 'docs/referinta/edrive-motor-wp.js');
  const ctx = vm.createContext({});
  vm.runInContext(readFileSync(cale, 'utf8'), ctx, { filename: cale });
  return ctx as unknown as MotorReferinta;
}

const ref = incarcaReferinta();

// Obiectele din contextul vm au alte prototipuri; structuredClone le aduce în contextul testului.
const clona = <T>(x: T): T => structuredClone(x);

// Generator determinist (mulberry32).
function generator(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const alege = <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)];
  const sansa = (p: number) => next() < p;
  return { next, int, alege, sansa };
}

type Gen = ReturnType<typeof generator>;

const CURSURI = [CONFIG.curs[2024], CONFIG.curs[2025]];

/** Sume în lei în jurul pragurilor de mărime, pentru ambele cursuri. */
function sumaLaPrag(g: Gen, praguri: number[]): number {
  const prag = g.alege(praguri);
  const curs = g.alege(CURSURI);
  const delta = g.alege([-1, 0, 1, -1000, 1000, 0.5, -0.5]);
  return prag * curs + delta;
}

function sumaFirma(g: Gen, praguri: number[]): number | null {
  const tip = g.int(0, 9);
  if (tip === 0) return null;
  if (tip === 1) return NaN;
  if (tip === 2) return -g.int(1, 1_000_000);
  if (tip === 3) return 0;
  if (tip <= 6) return sumaLaPrag(g, praguri);
  return g.int(0, 400_000_000) + (g.sansa(0.3) ? 0.37 : 0);
}

function angajati(g: Gen): number | null {
  const tip = g.int(0, 9);
  if (tip === 0) return null;
  if (tip === 1) return g.alege([NaN, -1, -50, 3.5, 9.99]);
  if (tip <= 6) return g.alege([0, 9, 10, 49, 50, 249, 250, 251]);
  return g.int(0, 2000);
}

function stareAnaf(g: Gen): DateEdrive['anaf'] {
  if (g.sansa(0.3)) return null;
  const stare = g.alege([
    'INREGISTRAT din data 01.01.2015',
    'TRANSFER(SOSIRE) din data 02.03.2019',
    'INSOLVENTA din data 10.05.2023',
    'FALIMENT',
    'DIZOLVARE',
    'SUSPENDARE ACTIVITATE',
    'RADIERE',
    '',
  ]);
  return {
    radiat: g.sansa(0.15),
    inactiv: g.sansa(0.2),
    stare,
    stareRea: /INSOLV|FALIMENT|LICHID|DIZOLV|SUSPEND|RADIER/.test(stare),
  };
}

function pret(g: Gen): number | null {
  const tip = g.int(0, 11);
  if (tip === 0) return null;
  if (tip === 1) return NaN;
  if (tip === 2) return 0;
  if (tip === 3) return -g.int(1, 50_000);
  if (tip <= 6) return g.alege([29_999, 30_000, 30_001, 30_000.5, 28_000, 45_000]);
  return g.int(5_000, 120_000) + (g.sansa(0.2) ? 0.49 : 0);
}

function vehicule(g: Gen): Vehicul[] {
  const n = g.int(0, CONFIG.maxVehicule);
  const ueMod = g.int(0, 2); // 0 toate UE, 1 niciunul, 2 amestecat
  return Array.from({ length: n }, () => ({
    cat: g.alege(['M1', 'M2'] as const),
    pret: pret(g),
    ue: ueMod === 0 ? true : ueMod === 1 ? false : g.sansa(0.5),
  }));
}

function caen(g: Gen): string {
  return g.alege(['', '0111', '0311', '03', '0', '6201', '4520', '01.11', 'CAEN 0312', '4941', '1', '7711']);
}

/** O firmă fără greșeli de completare, ca să ajungem des și pe ramura „ok”. */
function dateCurate(g: Gen): DateEdrive {
  return {
    forma: 'soc',
    caen: g.alege(['6201', '4520', '4941', '0111']),
    ang: g.alege([0, 3, 9, 10, 30, 49, 50, 200, 249, 250]),
    ca: sumaLaPrag(g, CONFIG.marimi.map((m) => m.ca)),
    act: g.sansa(0.3) ? null : sumaLaPrag(g, CONFIG.marimi.map((m) => m.act)),
    dat: g.int(0, 3_000_000),
    cap: g.int(-200_000, 2_000_000),
    vechi: g.alege(['da', 'promisiune'] as const),
    veh: Array.from({ length: g.int(1, CONFIG.maxVehicule) }, () => ({
      cat: g.alege(['M1', 'M2'] as const),
      pret: g.alege([28_000, 30_000, 30_001, 45_000, g.int(10_000, 90_000)]),
      ue: g.sansa(0.8),
    })),
    an: g.alege([2024, 2025, null]),
    anaf: g.sansa(0.5) ? null : { radiat: false, inactiv: g.sansa(0.2), stare: 'INREGISTRAT', stareRea: false },
  };
}

function dateAleatoare(g: Gen): DateEdrive {
  if (g.sansa(0.35)) return dateCurate(g);
  const ca = sumaFirma(g, CONFIG.marimi.map((m) => m.ca));
  const act = sumaFirma(g, CONFIG.marimi.map((m) => m.act));
  return {
    forma: g.alege(['', 'soc', 'soc', 'soc', 'pfa', 'alta'] as const),
    caen: caen(g),
    ang: angajati(g),
    ca,
    act,
    dat: g.alege([null, NaN, -5, 0, g.int(0, 10_000_000), 750_000, 7_500_000]),
    cap: g.alege([null, NaN, -100_000, 0, 1, 100_000, g.int(1, 5_000_000)]),
    vechi: g.alege(['', 'da', 'promisiune'] as const),
    veh: vehicule(g),
    an: g.alege([2024, 2025, null, 2023, 2026]),
    anaf: stareAnaf(g),
  };
}

describe('testarea diferențială cu motorul de pe site', () => {
  it('CONFIG e identic', () => {
    expect(CONFIG).toStrictEqual(clona(ref.CONFIG));
  });

  it('calc() dă același rezultat pe 3.000 de intrări generate (seed fix)', () => {
    const g = generator(20261020);
    const statusuri = { ok: 0, incomplet: 0, neeligibil: 0 };
    const marimi = new Set<string>();
    for (let i = 0; i < 3000; i++) {
      const d = dateAleatoare(g);
      const asteptat = clona(ref.calc(clona(d)));
      const obtinut = calc(clona(d));
      expect(obtinut, `intrarea #${i}: ${JSON.stringify(d)}`).toStrictEqual(asteptat);
      statusuri[obtinut.status]++;
      marimi.add(obtinut.marime?.nume ?? '—');
    }
    // generatorul chiar acoperă toate ramurile mari
    expect(statusuri.ok).toBeGreaterThan(50);
    expect(statusuri.incomplet).toBeGreaterThan(50);
    expect(statusuri.neeligibil).toBeGreaterThan(50);
    expect(marimi.size).toBe(4);
  });

  it('calc() dă același rezultat la toate pragurile de mărime (angajați × CA × active × an)', () => {
    let n = 0;
    const angs = [0, 9, 10, 49, 50, 249, 250];
    const ani = [2024, 2025, null];
    for (const an of ani) {
      const curs = an === 2024 ? CONFIG.curs[2024] : CONFIG.curs[2025];
      const sume: (number | null)[] = [null];
      for (const m of CONFIG.marimi) {
        for (const prag of [m.ca, m.act]) {
          for (const delta of [-1, 0, 1]) sume.push(prag * curs + delta);
        }
      }
      for (const ang of angs) {
        for (const ca of sume) {
          for (const act of [null, ...sume.filter((_, i) => i % 3 === 2)]) {
            const d: DateEdrive = {
              forma: 'soc', caen: '6201', ang, ca, act, dat: 1000, cap: 1000,
              vechi: 'da', veh: [{ cat: 'M1', pret: 28_000, ue: true }], an, anaf: null,
            };
            expect(calc(clona(d)), JSON.stringify(d)).toStrictEqual(clona(ref.calc(clona(d))));
            n++;
          }
        }
      }
    }
    expect(n).toBeGreaterThan(200);
  });

  it('parseNum() și verifica() se comportă la fel', () => {
    const g = generator(7);
    const fixe = ['', ' ', '25.000', '25000', '12,5', '1.234.567', '1.234,56', '1,234.56', '1.2.3', '1,2,3',
      '-5', '-5.000', '--5', 'abc', '25 000', '0', '0,0', '.5', ',5', '5.', '1.23', '12.345', '12.3456', '-', '+5', '1e5'];
    const caractere = '0123456789.,- a';
    const intrari = [...fixe];
    for (let i = 0; i < 500; i++) {
      intrari.push(Array.from({ length: g.int(0, 9) }, () => g.alege(caractere.split(''))).join(''));
    }
    for (const s of intrari) {
      for (const bani of [false, true]) {
        for (const neg of [false, true]) {
          const v = parseNum(s, bani, neg);
          expect(v, JSON.stringify([s, bani, neg])).toStrictEqual(ref.parseNum(s, bani, neg));
          for (const pz of [false, true]) {
            for (const pn of [false, true]) {
              expect(verifica(v, pz, pn)).toBe(ref.verifica(v, pz, pn));
            }
          }
        }
      }
    }
  });

  it('fmt(), eur() și norm() se comportă la fel', () => {
    const g = generator(11);
    for (let i = 0; i < 300; i++) {
      const n = (g.next() - 0.3) * 10 ** g.int(0, 9);
      expect(fmt(n)).toBe(ref.fmt(n));
      expect(eur(n)).toBe(ref.eur(n));
    }
    for (const s of ['Întreprindere', 'ȘȚĂÎÂ șțăîâ', 'şţ', null, undefined, 0, 'insolvență']) {
      expect(norm(s)).toBe(ref.norm(s));
    }
  });

  it('dinAnaf() dă aceleași date (și același calc) pe 500 de răspunsuri ANAF generate', () => {
    const g = generator(42);
    const formeJ = ['SOCIETATE COMERCIALĂ CU RĂSPUNDERE LIMITATĂ', 'SOCIETATE PE ACȚIUNI', 'PERSOANĂ FIZICĂ AUTORIZATĂ',
      'ÎNTREPRINDERE INDIVIDUALĂ', 'ÎNTREPRINDERE FAMILIALĂ', 'ASOCIAȚIE', 'COOPERATIVĂ', '', null];
    const formeO = ['PERSOANA JURIDICA', 'PERSOANA FIZICA', '', null];
    const stari = ['INREGISTRAT din data 01.01.2015', 'INSOLVENȚĂ din data 10.05.2023', 'în lichidare', 'DIZOLVARE',
      'RADIERE', 'Suspendare activitate', '', null];
    const optional = <T>(v: T): T | null | undefined => g.alege([v, v, v, v, null, undefined]);
    for (let i = 0; i < 500; i++) {
      const j: Record<string, unknown> = {
        ok: true,
        cui: String(g.int(1, 99_999_999)),
        forma_juridica: g.alege(formeJ),
        forma_organizare: g.alege(formeO),
        caen: g.alege(['0111', '0311', '6201', 4520, '', null, undefined]),
        stare: g.alege(stari),
        inactiv: g.alege([true, false, null, undefined]),
        radiat: g.alege([true, false, false, null]),
      };
      if (g.sansa(0.8)) {
        j.bilant = g.sansa(0.15)
          ? null
          : {
              an: g.alege([2024, 2025, 2023, null]),
              angajati: optional(g.alege([0, 4, 9.4, 9.5, 10, 49, 50, 250, g.int(0, 900)])),
              cifra_afaceri: optional(sumaLaPrag(g, CONFIG.marimi.map((m) => m.ca))),
              active: optional(g.int(0, 300_000_000)),
              datorii: optional(g.int(0, 10_000_000)),
              capitaluri: optional(g.int(-1_000_000, 5_000_000)),
            };
      }
      const r = clona(ref.dinAnaf(clona(j)));
      const t = dinAnaf(clona(j) as unknown as FirmaAnaf);
      // Singura diferență de formă: un câmp absent e undefined în referință și NaN în TypeScript.
      const fara = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v === undefined ? (k === 'an' ? null : NaN) : v]));
      expect(t, JSON.stringify(j)).toStrictEqual(fara);
      const rest = { vechi: 'da', veh: [{ cat: 'M2', pret: 45_000, ue: false }] };
      expect(calc({ ...t, ...rest } as DateEdrive)).toStrictEqual(clona(ref.calc({ ...r, ...rest })));
    }
  });
});
