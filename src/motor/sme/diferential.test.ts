// Testarea diferențială: motorul de pe site (docs/referinta/sme-motor-wp.js, nemodificat,
// încărcat cu node:vm) și portarea în TypeScript trebuie să dea exact aceleași rezultate.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { FIRME_DEMO } from '../edrive/fixtures';
import type { FirmaAnaf } from '../anaf';
import { dinAnaf } from './anaf';
import { calc, eur, fmt, lei, norm, parseNum, pct, verifica, type DateSme } from './calc';
import { CONFIG, MAI_VERIFICA } from './config';
import { FIRME_DEMO_SME } from './fixtures';

interface MotorReferinta {
  CONFIG: unknown;
  MAI_VERIFICA: string;
  calc: (d: unknown) => unknown;
  parseNum: (s: unknown, bani?: boolean) => number | null;
  verifica: (v: unknown) => string;
  fmt: (n: number) => string;
  lei: (n: number) => string;
  eur: (n: number) => string;
  pct: (x: number) => number;
  norm: (s: unknown) => string;
  dinAnaf: (j: unknown) => Record<string, unknown>;
}

function incarcaReferinta(): MotorReferinta {
  const cale = resolve(process.cwd(), 'docs/referinta/sme-motor-wp.js');
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

const ANI = [2023, 2024, 2025, null, 2026] as const;
const FORME = ['soc', 'pfa', 'alta', ''] as const;
const DATE = ['', '2015-03-12', '2008-09-02', '2021-12-30', '2021-12-31', '2022-01-01', '2023-03-10', '2026-01-15', '2021-12-31T00:00'];
const CAEN_EXCLUSE = ['01', '0111', '0311', '03', '1200', '12', '1910', '19', '1101', '1102', '1103', '1104', '1105', '2540', '3040', '6491', 'CAEN 1102', '11.02'];
const CAEN_NORMALE = ['', '1', '6201', '2562', '1106', '1107', '1100', '11', '2541', '3041', '6492', '6499', '4520', '3312', '0211'];

/** Sume în lei în jurul pragurilor de mărime, pentru toate cursurile. */
function sumaLaPrag(g: Gen, praguri: number[], an: number | null): number {
  const prag = g.alege(praguri);
  const curs = (an !== null && CONFIG.curs[an]) || g.alege(Object.values(CONFIG.curs));
  const delta = g.alege([-1, 0, 1, -1000, 1000, 0.5, -0.5]);
  return prag * curs + delta;
}

function sumaFirma(g: Gen, praguri: number[], an: number | null): number | null {
  const tip = g.int(0, 9);
  if (tip === 0) return null;
  if (tip === 1) return NaN;
  if (tip === 2) return -g.int(1, 1_000_000);
  if (tip === 3) return 0;
  if (tip <= 7) return sumaLaPrag(g, praguri, an);
  return g.int(0, 400_000_000);
}

function angajati(g: Gen): number | null {
  const tip = g.int(0, 9);
  if (tip === 0) return null;
  if (tip === 1) return g.alege([NaN, -1, 3.5, 9.99]);
  if (tip <= 7) return g.alege([0, 9, 10, 49, 50, 249, 250, 251]);
  return g.int(0, 2000);
}

function ca24(g: Gen): number | null {
  return g.alege([null, 0, -5, -1_000, NaN, 1, 0.5, 1_200_000, g.int(1, 50_000_000)]);
}

function stareAnaf(g: Gen): DateSme['anaf'] {
  if (g.sansa(0.35)) return null;
  const stare = g.alege([
    'INREGISTRAT din data 01.01.2015', 'TRANSFER(SOSIRE) din data 02.03.2019', 'INSOLVENTA din data 10.05.2023',
    'FALIMENT', 'DIZOLVARE', 'LICHIDARE', 'SUSPENDARE ACTIVITATE', 'RADIERE', '',
  ]);
  return {
    radiat: g.sansa(0.15),
    inactiv: g.sansa(0.25),
    stare,
    stareRea: /INSOLV|FALIMENT|LICHID|DIZOLV|SUSPEND|RADIER/.test(stare),
  };
}

/** O sumă de investiție: lipsă / 0 / invalidă / negativă / în jurul pragurilor. */
function suma(g: Gen, repere: number[]): number | null {
  const tip = g.int(0, 11);
  if (tip === 0) return null;
  if (tip === 1) return 0;
  if (tip === 2) return NaN;
  if (tip === 3) return -g.int(1, 100_000);
  if (tip <= 7) return g.alege(repere) + g.alege([-1, 0, 1, 0.5, -0.5]);
  return g.int(1, 1_500_000);
}

const REPERE_VERDE = [150_000, 267_240, 300_000, 303_100, 450_000, 700_000, 668_100];
const REPERE_ALTE = [100_000, 250_000, 350_000, 400_000, 600_000, 675_000, 450_000];
const REPERE_SOFT = [5_000, 10_000, 14_999, 15_000, 15_001, 20_000, 30_000];

/** Firma bună și sume valide, cu totalul și partea verde în jurul pragurilor (ok / proiect). */
function dateCurate(g: Gen): DateSme {
  const an = g.alege(ANI);
  const total = g.alege([CONFIG.proiectMin - 1, CONFIG.proiectMin, CONFIG.proiectMin + 1, 500_000, 700_000, 1_200_000, 2_000_000]);
  const partVerde = g.alege([0, 0.2, 0.399, 0.4, 0.401, 0.5, 0.642, 1]);
  const soft = g.alege([null, 0, 5_000, 15_000, 15_001, 20_000]);
  const softElig = soft === null ? 0 : Math.min(soft, CONFIG.softwareMax);
  const verde = Math.round(total * partVerde);
  const alte = Math.max(0, total - verde - softElig);
  return {
    forma: 'soc',
    anaf: g.sansa(0.5) ? null : { radiat: false, inactiv: g.sansa(0.3), stare: 'INREGISTRAT', stareRea: false },
    data: g.alege(['2015-03-12', '2021-12-31', '2008-09-02']),
    caen: g.alege(CAEN_NORMALE),
    ang: g.alege([0, 3, 9, 10, 49, 50, 249]),
    ca: sumaLaPrag(g, CONFIG.marimi.map((m) => m.ca), an),
    act: g.sansa(0.3) ? null : sumaLaPrag(g, CONFIG.marimi.map((m) => m.act), an),
    an,
    ca24: g.alege([1, 1_200_000, g.int(1, 9_000_000)]),
    verde: g.sansa(0.1) ? null : verde,
    alte: g.sansa(0.1) ? null : alte,
    soft,
  };
}

function dateAleatoare(g: Gen): DateSme {
  if (g.sansa(0.4)) return dateCurate(g);
  const an = g.alege(ANI);
  return {
    forma: g.alege(g.sansa(0.5) ? ['soc'] : FORME),
    anaf: stareAnaf(g),
    data: g.alege(DATE),
    caen: g.sansa(0.3) ? g.alege(CAEN_EXCLUSE) : g.alege(CAEN_NORMALE),
    ang: angajati(g),
    ca: sumaFirma(g, CONFIG.marimi.map((m) => m.ca), an),
    act: sumaFirma(g, CONFIG.marimi.map((m) => m.act), an),
    an,
    ca24: ca24(g),
    verde: suma(g, REPERE_VERDE),
    alte: suma(g, REPERE_ALTE),
    soft: suma(g, REPERE_SOFT),
  };
}

describe('testarea diferențială cu motorul SME de pe site', () => {
  it('CONFIG și MAI_VERIFICA sunt identice', () => {
    expect(CONFIG).toStrictEqual(clona(ref.CONFIG));
    expect(MAI_VERIFICA).toBe(ref.MAI_VERIFICA);
  });

  it('calc() dă același rezultat pe 4.000 de intrări generate (seed fix)', () => {
    const g = generator(20261021);
    const statusuri = { ok: 0, incomplet: 0, neeligibil: 0, proiect: 0 };
    const marimi = new Set<string>();
    let cuVerdeNou = 0;
    let cuNedecontat = 0;
    for (let i = 0; i < 4000; i++) {
      const d = dateAleatoare(g);
      const asteptat = clona(ref.calc(clona(d)));
      const obtinut = calc(clona(d));
      expect(obtinut, `intrarea #${i}: ${JSON.stringify(d)}`).toStrictEqual(asteptat);
      statusuri[obtinut.status]++;
      marimi.add(obtinut.marime?.nume ?? '—');
      if (obtinut.verdeNou !== null) cuVerdeNou++;
      if (obtinut.nedecontat > 0) cuNedecontat++;
    }
    // generatorul chiar acoperă toate ramurile mari
    for (const s of Object.values(statusuri)) expect(s).toBeGreaterThan(100);
    expect(marimi.size).toBe(4);
    expect(cuVerdeNou).toBeGreaterThan(100);
    expect(cuNedecontat).toBeGreaterThan(100);
  });

  it('calc() la toate pragurile de mărime (angajați × CA × active × an)', () => {
    let n = 0;
    for (const an of ANI) {
      const curs = (an !== null && CONFIG.curs[an]) || CONFIG.curs[CONFIG.anCurs];
      const sume: (number | null)[] = [null];
      for (const m of CONFIG.marimi) {
        for (const prag of [m.ca, m.act]) for (const delta of [-1, 0, 1]) sume.push(prag * curs + delta);
      }
      for (const ang of [0, 9, 10, 49, 50, 249, 250]) {
        for (const ca of sume) {
          for (const act of [null, ...sume.filter((_, i) => i % 3 === 2)]) {
            const d: DateSme = {
              forma: 'soc', anaf: null, data: '2015-01-01', caen: '6201', ang, ca, act, an, ca24: 1,
              verde: 450_000, alte: 250_000, soft: null,
            };
            expect(calc(clona(d)), JSON.stringify(d)).toStrictEqual(clona(ref.calc(clona(d))));
            n++;
          }
        }
      }
    }
    expect(n).toBeGreaterThan(300);
  });

  it('calc() la fiecare formă × dată × CAEN × cifra de afaceri 2024', () => {
    let n = 0;
    for (const forma of FORME) {
      for (const data of DATE) {
        for (const caen of [...CAEN_EXCLUSE, ...CAEN_NORMALE]) {
          for (const ca24 of [null, 0, -1, NaN, 1]) {
            const d: DateSme = {
              forma, anaf: null, data, caen, ang: 5, ca: 1_000_000, act: null, an: 2024, ca24,
              verde: 300_000, alte: 350_000, soft: 20_000,
            };
            expect(calc(clona(d)), JSON.stringify(d)).toStrictEqual(clona(ref.calc(clona(d))));
            n++;
          }
        }
      }
    }
    expect(n).toBeGreaterThan(300);
  });

  it('calc() la sumele investiției: lipsă / 0 / invalide / negative, software și totaluri la praguri', () => {
    const verzi = [null, 0, NaN, -1, 1, 150_000, 267_240, 300_000, 303_100, 450_000, 668_100];
    const alte = [null, 0, NaN, -5, 250_000, 350_000, 400_000, 445_400, 445_401, 668_099];
    const soft = [null, 0, NaN, -1, 14_999, 15_000, 15_001, 20_000];
    let n = 0;
    for (const verde of verzi) {
      for (const a of alte) {
        for (const s of soft) {
          const d: DateSme = {
            forma: 'soc', anaf: null, data: '2015-01-01', caen: '6201', ang: 5, ca: 1_000_000, act: null, an: 2024, ca24: 1,
            verde, alte: a, soft: s,
          };
          expect(calc(clona(d)), JSON.stringify(d)).toStrictEqual(clona(ref.calc(clona(d))));
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(300);
  });

  it('parseNum(), verifica(), fmt(), lei(), eur(), pct(), norm() se comportă la fel', () => {
    const g = generator(7);
    const fixe = ['', ' ', '25.000', '25000', '12,5', '1.234.567', '1.234,56', '1,234.56', '1.2.3', '1,2,3',
      '-5', 'abc', '25 000', '0', '0,0', '.5', ',5', '5.', '1.23', '12.345', '12.3456', '-', '+5', '1e5', null, undefined];
    const caractere = '0123456789.,- a';
    const intrari: unknown[] = [...fixe];
    for (let i = 0; i < 500; i++) intrari.push(Array.from({ length: g.int(0, 9) }, () => g.alege(caractere.split(''))).join(''));
    for (const s of intrari) {
      for (const bani of [false, true]) {
        const v = parseNum(s, bani);
        expect(v, JSON.stringify([s, bani])).toStrictEqual(ref.parseNum(s, bani));
        expect(verifica(v)).toBe(ref.verifica(v));
      }
    }
    expect(verifica(undefined)).toBe(ref.verifica(undefined));
    for (let i = 0; i < 300; i++) {
      const n = (g.next() - 0.3) * 10 ** g.int(0, 9);
      expect(fmt(n)).toBe(ref.fmt(n));
      expect(lei(n)).toBe(ref.lei(n));
      expect(eur(n)).toBe(ref.eur(n));
      const x = g.next();
      expect(pct(x)).toBe(ref.pct(x));
    }
    for (let i = 0; i <= 1000; i++) expect(pct(i / 1000)).toBe(ref.pct(i / 1000));
    for (const s of ['Întreprindere', 'ȘȚĂÎÂ șțăîâ', 'şţ', null, undefined, 0, 'insolvență', 'COOPERATIVĂ']) {
      expect(norm(s)).toBe(ref.norm(s));
    }
  });

  it('dinAnaf() pe toate firmele demo (vechi și noi): aceleași date, același calc', () => {
    const toate = { ...FIRME_DEMO, ...FIRME_DEMO_SME };
    expect(Object.keys(toate)).toHaveLength(20);
    for (const [cui, f] of Object.entries(toate)) {
      const r = clona(ref.dinAnaf(clona(f.raspuns)));
      const t = dinAnaf(clona(f.raspuns));
      expect(t, cui).toStrictEqual(r);
      const sume = { verde: 450_000, alte: 250_000, soft: 20_000 };
      expect(calc({ ...t, ...sume }), cui).toStrictEqual(clona(ref.calc({ ...r, ...sume })));
    }
  });

  it('dinAnaf() pe 500 de răspunsuri ANAF generate (cu și fără istoric)', () => {
    const g = generator(42);
    const formeJ = ['SOCIETATE COMERCIALĂ CU RĂSPUNDERE LIMITATĂ', 'SOCIETATE PE ACȚIUNI', 'SOCIETATE COOPERATIVĂ', 'COOPERATIVĂ AGRICOLĂ',
      'PERSOANĂ FIZICĂ AUTORIZATĂ', 'ÎNTREPRINDERE INDIVIDUALĂ', 'ÎNTREPRINDERE FAMILIALĂ', 'ASOCIAȚIE', '', null];
    const formeO = ['PERSOANA JURIDICA', 'PERSOANA FIZICA', '', null];
    const stari = ['INREGISTRAT din data 01.01.2015', 'INSOLVENȚĂ din data 10.05.2023', 'în lichidare', 'DIZOLVARE',
      'RADIERE', 'Suspendare activitate', '', null];
    const optional = <T>(v: T): T | null | undefined => g.alege([v, v, v, v, null, undefined]);
    const bilant = (an: unknown) => ({
      an,
      angajati: optional(g.alege([0, 4, 9.4, 9.5, 10, 49, 50, 250, g.int(0, 900)])),
      cifra_afaceri: optional(g.alege([0, -100, 0.4, 0.5, 1_200_000.5, g.int(0, 300_000_000)])),
      active: optional(g.int(0, 300_000_000) + 0.5),
    });
    let cuCa24 = 0;
    for (let i = 0; i < 500; i++) {
      const j: Record<string, unknown> = {
        ok: true,
        cui: String(g.int(1, 99_999_999)),
        forma_juridica: g.alege(formeJ),
        forma_organizare: g.alege(formeO),
        caen: g.alege(['0111', '1102', '6201', 4520, '', null, undefined]),
        stare: g.alege(stari),
        inactiv: g.alege([true, false, null, undefined]),
        radiat: g.alege([true, false, false, null]),
        data_inregistrare: g.alege(['2015-03-12', '2023-03-10T00:00:00', '2021-12-31', '', null, undefined]),
      };
      if (g.sansa(0.85)) j.bilant = g.sansa(0.15) ? null : bilant(g.alege([2025, 2024, 2023, null, undefined]));
      if (g.sansa(0.6)) {
        j.bilanturi = [2025, 2024, 2023].map((an) => (g.sansa(0.2) ? { an, lipsa: true } : g.sansa(0.05) ? null : bilant(an)));
      }
      const r = clona(ref.dinAnaf(clona(j)));
      const t = dinAnaf(clona(j) as unknown as FirmaAnaf);
      // Singura diferență de formă: un `an` absent e undefined în referință și null în TypeScript.
      expect(t, JSON.stringify(j)).toStrictEqual({ ...r, an: r.an === undefined ? null : r.an });
      if (t.ca24 !== null) cuCa24++;
      const sume = { verde: g.alege([300_000, 450_000]), alte: 250_000, soft: null };
      expect(calc({ ...t, ...sume })).toStrictEqual(clona(ref.calc({ ...r, ...sume })));
    }
    expect(cuCa24).toBeGreaterThan(100);
  });
});
