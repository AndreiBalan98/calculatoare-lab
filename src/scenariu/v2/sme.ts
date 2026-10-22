// SME Eco-Tech, varianta 2 „Cifra vie” (docs/flux-v2.md §4): ce cumperi, apoi toate sumele pe un
// singur ecran, cu glisoare. Motorul, contextul (contextSme), rezultatul, drumul și glosarul sunt
// cele din v1. Răspunsurile se scriu cu cheile v1 (`cumperi`, `verde`, `alte`, `soft`).
//
// CUM MODIFICI: ca în ./edrive.ts (textele, glisoarele, rezumatul, șoapta).

import { pct, verdeSuficient } from '@/motor/sme/calc';
import { CONFIG } from '@/motor/sme/config';
import { alese } from '../derulare';
import { lei, localitate } from '../format';
import { SCENARIU, SME } from '../sme';
import { CUMPARATURI, type ContextSme, type Cumparatura } from '../sme/context';
import type { PasMultipla, Raspunsuri } from '../tipuri';
import type { Cifra, Glisor, PasulV2, ProgramV2, Valori } from './tipuri';

const CUMPERI = SCENARIU.pasi.find((p) => p.tip === 'multipla' && p.id === 'cumperi') as PasMultipla<ContextSme>;

const PROCENT_GRANT = `${Math.round(CONFIG.grantProcent * 100)}%`;
const PROCENT_VERDE = `${Math.round(CONFIG.verdeMin * 100)}%`;
const cifre = (n: number) => Math.round(n).toLocaleString('ro-RO');

/** „microîntreprindere” cu explicația din glosar. */
const CATEGORIE: Record<string, string> = {
  'Microîntreprindere': '[[microîntreprindere|microintreprindere]]',
  'Întreprindere mică': '[[întreprindere mică|intreprindere mica]]',
  'Întreprindere mijlocie': '[[întreprindere mijlocie|intreprindere mijlocie]]',
};

/** Cum apare fiecare alegere în rezumat. */
const NUME: Record<Cumparatura, string> = { verde: 'verzi', alte: 'alte echipamente', soft: 'software' };
const NUME_SUMA: Record<Cumparatura, string> = { verde: 'verzi', alte: 'alte', soft: 'software' };

/** Glisoarele sumelor (docs/flux-v2.md §4): pornesc cu un proiect care se încadrează (700.000 lei, 64% verde). */
const GLISOARE: Record<Cumparatura, Glisor> = {
  verde: { cheie: 'verde', eticheta: 'Echipamente verzi', min: 0, max: 1_500_000, pas: 5_000, start: 450_000, format: lei, unitate: 'lei' },
  alte: { cheie: 'alte', eticheta: 'Alte echipamente', min: 0, max: 1_500_000, pas: 5_000, start: 250_000, format: lei, unitate: 'lei' },
  soft: {
    cheie: 'soft', eticheta: 'Software', min: 0, max: 60_000, pas: 1_000, start: 10_000, format: lei, unitate: 'lei',
    repere: [{ valoare: CONFIG.softwareMax, eticheta: 'decontat până aici' }],
  },
};

/** Suma scrisă (0 e voie: „nimic pe asta”). */
function suma(v: string | undefined): number | null {
  if (v === undefined || v === '') return null;
  const n = Number(v.replace(/^~/, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const alegeri = (v: string | undefined): Cumparatura[] => CUMPARATURI.filter((k) => alese(v).includes(k));

const pasi: PasulV2<ContextSme>[] = [
  // E3 · Ce cumperi
  {
    tip: 'intrebare',
    id: 'cumperi',
    text: CUMPERI.text,
    explicatie: CUMPERI.explicatie,
    control: { tip: 'multipla', optiuni: CUMPERI.optiuni, continua: CUMPERI.continua },
    citeste: (r) => {
      const a = alegeri(r.cumperi);
      return a.length && a.length === alese(r.cumperi).length ? { v: a.join(',') } : null;
    },
    scrie: (r, v) => ({ ...r, cumperi: v.v }),
    rezumat: (v) => [alegeri(v.v).map((k) => NUME[k]).join(', ')],
    soapta: (c, v) => (alegeri(v?.v ?? c.r.cumperi).includes('verde')
      ? null
      : { text: `Cel puțin **${PROCENT_VERDE}** din proiect trebuie să fie echipamente verzi.` }),
  },
  // E4 · Sumele, pe un singur ecran
  {
    tip: 'intrebare',
    id: 'sume',
    text: 'Cam cât costă, fără [[TVA|tva]]?',
    control: { tip: 'glisoare', glisoare: (c) => c.cumperi.map((k) => GLISOARE[k]) },
    citeste: (r, c) => {
      const v: Valori = {};
      for (const k of c.cumperi) {
        const n = suma(r[k]);
        if (n === null) return null;
        v[k] = String(n);
      }
      return Object.values(v).some((x) => Number(x) > 0) ? v : null;
    },
    partial: (r, c) => {
      const v: Valori = {};
      for (const k of c.cumperi) {
        const n = suma(r[k]);
        if (n !== null) v[k] = String(n);
      }
      return v;
    },
    scrie: (r, v) => {
      const nou = { ...r };
      for (const k of CUMPARATURI) if (v[k] !== undefined) nou[k] = v[k];
      return nou;
    },
    rezumat: (v, c) => {
      const lista = c.cumperi.filter((k) => v[k] !== undefined);
      return lista.map((k, i) => `${NUME_SUMA[k]} ${cifre(Number(v[k]))}${i === lista.length - 1 ? ' lei' : ''}`);
    },
    // R-proiect: rămâi pe ecran până se încadrează (docs/flux-v2.md §4)
    blocheaza: (c) => c.rezultat.status === 'proiect',
    soapta: (c) => {
      const r = c.rezultat;
      if (r.status === 'proiect' && r.verdeNou !== null) {
        return { text: `Cu echipamente verzi de **${lei(r.verdeNou)}**, proiectul se încadrează.`, aplica: true };
      }
      if ((c.date.soft ?? 0) > CONFIG.softwareMax) return { text: `Software-ul se decontează până la ${lei(CONFIG.softwareMax)}.` };
      return null;
    },
    // „Aplică”: glisorul verde alunecă la suma sfătuită de motor (și verzile devin alese)
    aplica: (r, v, c) => {
      const nou = c.rezultat.verdeNou;
      if (nou === null) return { r, v };
      const cumperi = CUMPARATURI.filter((k) => k === 'verde' || c.cumperi.includes(k)).join(',');
      return { r: cumperi === r.cumperi ? r : { ...r, cumperi }, v: { ...v, verde: String(nou) } };
    },
    cifraDinStart: true,
    compact: () => true,
  },
  { tip: 'rezultat', id: 'rezultat' },
];

function cifra(c: ContextSme, d: { acceptate: Raspunsuri; ecrane: { cheie: string }[] }): Cifra | null {
  if (!c.evaluare.gata) return null;
  if (c.firma && d.acceptate.firma !== 'da' && !c.estimat) return null;
  const r = c.rezultat;
  if (d.ecrane.some((e) => e.cheie === 'sume') && r.total > 0) {
    return {
      cheie: 'grant',
      valoare: r.grant,
      format: cifre,
      unitate: 'lei',
      rand: [`grant · proiect de ${lei(r.total)}`],
      gri: r.status === 'proiect',
      indicator: {
        parte: r.verdePct,
        minim: CONFIG.verdeMin,
        eticheta: `Verde: ${Math.floor(pct(r.verdePct))}%`,
        reper: `minim ${PROCENT_VERDE}`,
        ok: verdeSuficient(r),
        sub: r.total < CONFIG.proiectMin ? `Proiect: ${lei(r.total)} · minim ${lei(CONFIG.proiectMin)}` : null,
      },
    };
  }
  return { cheie: 'max', valoare: CONFIG.grantMax, format: cifre, unitate: 'lei', rand: [`grant de până la · ${PROCENT_GRANT} din proiect`] };
}

export const SME_V2: ProgramV2<ContextSme> = {
  v1: SME,
  cui: { text: 'Hai să vedem cât poate primi firma ta.', cautare: 'Caut firma și bilanțurile la ANAF…' },
  firma: {
    text: 'E firma ta?',
    optiuni: [
      { valoare: 'da', eticheta: 'Da' },
      { valoare: 'corectez', eticheta: 'Nu' },
    ],
  },
  pasi,
  // CUI + firma + ce cumperi + sumele
  estimare: () => 4,
  antet: (c) => {
    const inc = c.evaluare.incadrare;
    const cat = inc.status === 'imm' ? CATEGORIE[inc.marime.nume] ?? inc.marime.nume.toLowerCase() : inc.status === 'neimm' ? 'peste pragurile IMM' : null;
    const loc = c.firma ? localitate(c.firma.adresa, c.firma.judet) || null : null;
    const d0 = c.dinAnaf;
    const istoric = [
      d0?.data ? `Înființată în ${d0.data.slice(0, 4)}` : null,
      d0?.ca24 != null ? `CA ${CONFIG.anCA}: ${lei(d0.ca24)}` : null,
    ].filter(Boolean).join(' · ');
    return {
      titlu: c.firma?.denumire || (c.cui ? `CUI ${c.cui}` : ''),
      randuri: [[cat, loc].filter(Boolean).join(' · '), istoric, c.estimat ? 'estimat din ce ne-ai spus' : ''].filter(Boolean),
      avert: c.evaluare.avert,
    };
  },
  cifra: (c, d) => cifra(c, d),
};
