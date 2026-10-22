// e-DRIVE, varianta 2 „Cifra vie” (docs/flux-v2.md §3): pașii după firmă, cifra din card,
// rezumatul. Motorul, contextul (contextDin), rezultatul, drumul și glosarul sunt cele din v1.
//
// CUM MODIFICI
// - Un text: schimbă-l aici (sau în scenariul v1, pentru textele refolosite: `dinV1(...)`).
//   **așa** = îngroșat; [[cuvânt|cheie]] = cuvânt cu explicație din glosarul v1.
// - Un pas: `text`, `explicatie`, `control` (alegere / numar / comutator / glisoare), `rezumat`
//   (bucățile din card), `soapta`. Ordinea: lista PASI.
// - Răspunsurile se scriu cu cheile v1 (`nrMasini`, `tipMasini`, `pret_0`, `ue_0`…): prețul o dată
//   pe categorie (prima mașină din categorie = suma, celelalte = „aceeasi”), UE o dată pentru toate.

import { CONFIG } from '@/motor/edrive/config';
import { EDRIVE, PROGRES, SCENARIU } from '../edrive';
import { masiniDin, numarMasini, pretMasina, type Context, type Masina } from '../context';
import { euro, localitate } from '../format';
import type { BucataRand } from '../program';
import type { Optiune, Pas, PasAlegere, PasOprire, Raspunsuri } from '../tipuri';
import type { Cifra, Glisor, PasulV2, ProgramV2, Valori } from './tipuri';

type Categorie = Masina['cat'];

/** Un pas din scenariul v1, după id (textele lui se refolosesc). */
function dinV1<P extends Pas<Context>>(id: string): P {
  const p = SCENARIU.pasi.find((x) => x.tip !== 'grup' && x.id === id);
  if (!p) throw new Error(`Pasul v1 „${id}” lipsește.`);
  return p as P;
}

const NR_MASINI = dinV1<PasAlegere<Context>>('nrMasini');
const TIP_MASINI = dinV1<PasAlegere<Context>>('tipMasini');
const VECHI = dinV1<PasAlegere<Context>>('vechi');
const PROMISIUNE = dinV1<PasAlegere<Context>>('promisiune');
const OPRIRE_VECHI = dinV1<PasOprire<Context>>('oprireVechi');

const optiuniDin = (p: PasAlegere<Context>) => (c: Context): Optiune[] => (typeof p.optiuni === 'function' ? p.optiuni(c) : p.optiuni);

// ——— Mașinile: răspunsurile v1 rescrise la fiecare schimbare ———

/** Felul mașinilor, fără numărul lor: 'M1' / 'M2' / 'mixt' (din valorile v1). */
export function felDin(tip: string | undefined): 'M1' | 'M2' | 'mixt' | null {
  if (tip === 'M1' || tip === 'toateM1') return 'M1';
  if (tip === 'M2' || tip === 'toateM2') return 'M2';
  if (tip === 'mixt') return 'mixt';
  return null;
}

/** Valoarea v1 pentru fel, după câte mașini sunt (la o mașină: 'M1' / 'M2'; „Amândouă” cere 2+). */
function tipV1(fel: 'M1' | 'M2' | 'mixt', n: number): string | null {
  if (n === 1) return fel === 'mixt' ? null : fel;
  return fel === 'mixt' ? 'mixt' : fel === 'M1' ? 'toateM1' : 'toateM2';
}

/** Prețul pe categorie (al primei mașini din categorie), din răspunsurile v1. */
export function pretCategorie(r: Raspunsuri, cat: Categorie): number | null {
  const masini = masiniDin(r);
  const prima = masini.find((m) => m.cat === cat);
  return prima ? pretMasina(r, masini, prima.index) : null;
}

/** Răspunsul UE comun tuturor mașinilor (null = nu e dat la toate la fel). */
export function ueComun(r: Raspunsuri): string | null {
  const masini = masiniDin(r);
  const v = r.ue_0;
  if (!masini.length || !v || !['da', 'nu', 'nustiu'].includes(v)) return null;
  return masini.every((m) => r[`ue_${m.index}`] === v) ? v : null;
}

/**
 * Scrie o schimbare despre mașini și rescrie cheile pe mașină după lista nouă: prețul fiecărei
 * categorii (pret_i la prima mașină din categorie, „aceeasi” la celelalte) și răspunsul UE (la toate).
 * Așa, a treia mașină adăugată din rezumat ia prețul categoriei și răspunsul UE deja date.
 */
export function cuMasini(
  r: Raspunsuri,
  schimbare: Raspunsuri,
  o: { preturi?: Partial<Record<Categorie, number>>; ue?: string } = {},
): Raspunsuri {
  const preturi: Partial<Record<Categorie, number | null>> = { M1: pretCategorie(r, 'M1'), M2: pretCategorie(r, 'M2'), ...o.preturi };
  const ue = o.ue ?? ueComun(r);
  const nou: Raspunsuri = { ...r, ...schimbare };

  const n = numarMasini(nou);
  const fel = felDin(nou.tipMasini);
  const tip = fel && n ? tipV1(fel, n) : null;
  if (tip) nou.tipMasini = tip;
  else delete nou.tipMasini;
  const k = Number(nou.nrMicrobuze || 0);
  if (nou.tipMasini !== 'mixt' || !(k >= 1 && k < n)) delete nou.nrMicrobuze;

  for (const cheie of Object.keys(nou)) if (/^(pret|ue)_\d+$/.test(cheie)) delete nou[cheie];
  const masini = masiniDin(nou);
  for (const cat of ['M1', 'M2'] as const) {
    const p = preturi[cat];
    if (p == null) continue;
    masini.filter((m) => m.cat === cat).forEach((m, j) => {
      nou[`pret_${m.index}`] = j === 0 ? String(p) : 'aceeasi';
    });
  }
  if (ue) for (const m of masini) nou[`ue_${m.index}`] = ue;
  return nou;
}

// ——— Textele mărunte ———

const nrText = (n: number, unul: string, mai: string) => `${n} ${n === 1 ? unul : mai}`;
const masini = (n: number) => nrText(n, 'mașină', 'mașini');
const autoturisme = (n: number) => nrText(n, 'autoturism', 'autoturisme');
const microbuze = (n: number) => nrText(n, 'microbuz', 'microbuze');
const despre = (n: number) => `~${euro(n)}`;
const cifre = (n: number) => Math.round(n).toLocaleString('ro-RO');

/** „microîntreprindere” cu explicația din glosar. */
const CATEGORIE: Record<string, string> = {
  'Microîntreprindere': '[[microîntreprindere|microintreprindere]]',
  'Întreprindere mică': '[[întreprindere mică|intreprindere mica]]',
  'Întreprindere mijlocie': '[[întreprindere mijlocie|intreprindere mijlocie]]',
};

const UE: Optiune[] = [
  { valoare: 'da', eticheta: 'Da' },
  { valoare: 'nu', eticheta: 'Nu' },
  { valoare: 'nustiu', eticheta: 'Nu știu' },
];
const UE_REZUMAT: Record<string, string> = { da: 'UE', nu: 'fără UE', nustiu: 'UE nesigur' };

/** Glisoarele de preț: valorile de pornire și pașii din docs/flux-v2.md §3. */
const GLISOR: Record<Categorie, Omit<Glisor, 'eticheta' | 'sub'>> = {
  M1: {
    cheie: 'M1', min: 15_000, max: 80_000, pas: 500, start: 30_000, format: euro, unitate: '€',
    repere: [{ valoare: CONFIG.plafonM1, eticheta: 'plafon' }],
  },
  M2: { cheie: 'M2', min: 25_000, max: 120_000, pas: 1_000, start: 45_000, format: euro, unitate: '€' },
};

const categorii = (c: Context): Categorie[] => (['M1', 'M2'] as const).filter((cat) => c.masini.some((m) => m.cat === cat));

// ——— Pașii ———

const pasi: PasulV2<Context>[] = [
  // E3 · Câte mașini
  {
    tip: 'intrebare',
    id: 'nrMasini',
    text: 'Câte mașini schimbi cu unele electrice?',
    explicatie: NR_MASINI.nota,
    control: { tip: 'numar', min: 1, max: () => CONFIG.maxVehicule, start: 1 },
    citeste: (r) => (numarMasini(r) ? { n: String(numarMasini(r)) } : null),
    scrie: (r, v) => cuMasini(r, { nrMasini: v.n }),
    rezumat: (v) => [masini(Number(v.n))],
  },
  // E4 · Ce fel
  {
    tip: 'intrebare',
    id: 'tipMasini',
    text: TIP_MASINI.text,
    control: {
      tip: 'comutator',
      segmente: (c) => (numarMasini(c.r) === 1
        ? [{ valoare: 'M1', eticheta: 'Autoturism' }, { valoare: 'M2', eticheta: 'Microbuz' }]
        : [{ valoare: 'M1', eticheta: 'Autoturisme' }, { valoare: 'M2', eticheta: 'Microbuze' }, { valoare: 'mixt', eticheta: 'Amândouă' }]),
      nota: 'Autoturism: până la 8 locuri plus șoferul. Microbuz: peste 8. Cea nouă e din aceeași categorie.',
      numar: { cand: (fel) => fel === 'mixt', text: 'Câte sunt microbuze?', min: 1, max: (c) => numarMasini(c.r) - 1, start: 1 },
    },
    citeste: (r) => {
      const fel = felDin(r.tipMasini);
      if (!fel || !masiniDin(r).length || tipV1(fel, numarMasini(r)) !== r.tipMasini) return null;
      const v: Valori = { fel };
      if (fel === 'mixt') v.n = r.nrMicrobuze;
      return v;
    },
    scrie: (r, v, c) => {
      const fel = v.fel as 'M1' | 'M2' | 'mixt';
      return cuMasini(r, { tipMasini: tipV1(fel, numarMasini(c.r)) ?? '', nrMicrobuze: fel === 'mixt' ? v.n : '' });
    },
    rezumat: (_, c) => {
      const n2 = c.masini.filter((m) => m.cat === 'M2').length;
      const n1 = c.masini.length - n2;
      return [n1 && n2 ? `${autoturisme(n1)} și ${microbuze(n2)}` : n1 ? autoturisme(n1) : microbuze(n2)];
    },
  },
  // E5 · Sunt ale firmei
  {
    tip: 'intrebare',
    id: 'vechi',
    text: VECHI.text,
    control: { tip: 'alegere', optiuni: optiuniDin(VECHI) },
    citeste: (r) => (r.vechi === 'da' || r.vechi === 'nu' ? { v: r.vechi } : null),
    scrie: (r, v) => ({ ...r, vechi: v.v }),
    rezumat: (v) => (v.v === 'da' ? ['ale firmei de 1 an'] : []),
  },
  {
    tip: 'intrebare',
    id: 'promisiune',
    cand: PROMISIUNE.cand,
    text: PROMISIUNE.text,
    explicatie: PROMISIUNE.explicatie,
    control: { tip: 'alegere', optiuni: optiuniDin(PROMISIUNE) },
    citeste: (r) => (r.promisiune === 'da' || r.promisiune === 'nu' ? { v: r.promisiune } : null),
    scrie: (r, v) => ({ ...r, promisiune: v.v }),
    rezumat: (v) => (v.v === 'da' ? ['cu promisiune'] : []),
  },
  // X2 · fără mașină de înlocuit (din v1)
  OPRIRE_VECHI,
  // E6 · Prețul, o dată pe categorie
  {
    tip: 'intrebare',
    id: 'pret',
    text: (c) => `Cam cât ${c.masini.length === 1 ? 'costă una nouă' : 'costă cele noi'}, fără [[TVA|tva]]?`,
    control: {
      tip: 'glisoare',
      glisoare: (c) => {
        const cats = categorii(c);
        return cats.map((cat) => {
          const n = c.masini.filter((m) => m.cat === cat).length;
          const pe = cat === 'M1' ? 'pe autoturism' : 'pe microbuz';
          return {
            ...GLISOR[cat],
            eticheta: cats.length > 1 ? (cat === 'M1' ? 'Autoturism' : 'Microbuz') : null,
            sub: n > 1 ? `${pe} · × ${n}` : pe,
          };
        });
      },
    },
    citeste: (r, c) => {
      const v: Valori = {};
      for (const cat of categorii(c)) {
        const p = pretCategorie(r, cat);
        if (p === null) return null;
        v[cat] = String(p);
      }
      return Object.keys(v).length ? v : null;
    },
    partial: (r, c) => {
      const v: Valori = {};
      for (const cat of categorii(c)) {
        const p = pretCategorie(r, cat);
        if (p !== null) v[cat] = String(p);
      }
      return v;
    },
    scrie: (r, v) => cuMasini(r, {}, { preturi: { ...(v.M1 ? { M1: Number(v.M1) } : {}), ...(v.M2 ? { M2: Number(v.M2) } : {}) } }),
    rezumat: (v) => (v.M1 && v.M2 ? [`autoturism ${despre(Number(v.M1))}`, `microbuz ${despre(Number(v.M2))}`] : [despre(Number(v.M1 ?? v.M2))]),
    soapta: (_, v) => (v?.M1 && Number(v.M1) > CONFIG.plafonM1
      ? { text: `Peste ${euro(CONFIG.plafonM1)} pe autoturism, diferența o plătește firma.` }
      : null),
    compact: (c) => categorii(c).length > 1,
  },
  // E7 · UE, o dată pentru toate
  {
    tip: 'intrebare',
    id: 'ue',
    text: (c) => (c.masini.length === 1 ? 'E [[asamblată în Uniunea Europeană|ue]]?' : 'Sunt [[asamblate în Uniunea Europeană|ue]]?'),
    control: { tip: 'alegere', optiuni: () => UE },
    citeste: (r) => {
      const v = ueComun(r);
      return v ? { v } : null;
    },
    scrie: (r, v) => cuMasini(r, {}, { ue: v.v }),
    rezumat: (v) => [UE_REZUMAT[v.v]],
    soapta: () => ({ text: `Dacă da, primești **${CONFIG.bonusUE} de puncte** în plus.` }),
  },
  // Rezultatul
  { tip: 'rezultat', id: 'rezultat' },
];

/** Rândul de sub cifră cu punctele (care numără, cu „+20” auriu la creștere). */
const randPuncte = (scor: number): BucataRand[] => ['finanțare · ', { numar: scor, castig: true }, ` ${PROGRES.puncte(scor)}`];

function cifra(c: Context, d: { acceptate: Raspunsuri }): Cifra | null {
  const inc = c.evaluare.incadrare;
  if (inc.status !== 'imm' || !(d.acceptate.firma === 'da' || c.estimat)) return null;
  const scor = c.scor;
  // toate prețurile știute (acceptate sau de pe glisoare): finanțarea din motor
  if (c.masini.length && c.date.veh.length === c.masini.length) {
    return { cheie: 'euro', valoare: c.rezultat.ajutor, format: cifre, unitate: '€', rand: randPuncte(scor) };
  }
  const n1 = c.masini.filter((m) => m.cat === 'M1').length;
  if (c.masini.length && n1 === c.masini.length) {
    return { cheie: 'euro', prefix: PROGRES.panaLa, valoare: CONFIG.plafonM1 * n1, format: cifre, unitate: '€', rand: randPuncte(scor) };
  }
  return { cheie: 'puncte', valoare: scor, format: cifre, rand: [`${PROGRES.puncte(scor)} · ${inc.marime.nume.toLowerCase()}`] };
}

export const EDRIVE_V2: ProgramV2<Context> = {
  v1: EDRIVE,
  cui: { text: 'Hai să vedem cât poate primi firma ta.', cautare: 'Caut firma la ANAF…' },
  firma: {
    text: 'E firma ta?',
    optiuni: [
      { valoare: 'da', eticheta: 'Da' },
      { valoare: 'corectez', eticheta: 'Nu' },
    ],
  },
  pasi,
  // CUI + firma + E3–E7
  estimare: () => 7,
  antet: (c) => {
    const inc = c.evaluare.incadrare;
    const cat = inc.status === 'imm' ? CATEGORIE[inc.marime.nume] ?? inc.marime.nume.toLowerCase() : inc.status === 'neimm' ? 'peste pragurile IMM' : null;
    const loc = c.firma ? localitate(c.firma.adresa, c.firma.judet) || null : null;
    return {
      titlu: c.firma?.denumire || (c.cui ? `CUI ${c.cui}` : ''),
      randuri: [[cat, loc].filter(Boolean).join(' · '), c.estimat ? 'estimat din ce ne-ai spus' : ''].filter(Boolean),
      avert: c.evaluare.avert,
    };
  },
  cifra: (c, d) => cifra(c, d),
};
