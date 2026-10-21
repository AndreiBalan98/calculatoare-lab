// Scenariul SME Eco-Tech: un ecran = o întrebare (docs/flux-sme.md v1), în același fel ca e-DRIVE.
//
// CUM MODIFICI
// - Un text: schimbă-l aici. **așa** = îngroșat; [[cuvânt]] sau [[cuvânt afișat|cheie]] = cuvânt
//   subliniat cu explicație (explicațiile sunt în sme/glosar.ts).
// - Pe un ecran de întrebare: `ecou` (linia aurie care reacționează la răspunsul de dinainte),
//   `eticheta`, `text` (întrebarea), `explicatie`, `optiuni`, `antrenor`, `nota`; `etapa` = unde
//   stă în progresul de sus (firma / cumperi / sume / rezultat).
// - Ordinea: mută pasul în lista PASI. Fiecare pas vede doar răspunsurile de dinaintea lui.
// - O opțiune: `valoare` e ce intră în calcul (la angajați, cifra de afaceri, înființare și
//   vânzările din 2024, chiar valoarea dată motorului), `eticheta` e textul de pe buton,
//   `detaliu` un rând mic sub el. La sume: „~300000” = suma rotundă de pe buton.
// - Când apare un pas: `cand`. Cifrele vin mereu din motor, prin `c` (contextul): c.evaluare,
//   c.rezultat, c.date (vezi sme/context.ts). Nu scrie reguli de finanțare aici.
// - Restul calculatorului (rândul din progres, rezultatul, drumul, glosarul): obiectul SME, la final.

import { CONFIG, MAI_VERIFICA } from '@/motor/sme/config';
import { pct, verdeSuficient } from '@/motor/sme/calc';
import { alteMaxim } from '@/motor/sme/firma';
import { lei, localitate } from './format';
import type { DateDrum, DateProgram, Program, VedereRezultat } from './program';
import { construiesteAnalizaSme } from './sme/analiza';
import { CUMPARATURI, contextSme, type ContextSme, type Cumparatura } from './sme/context';
import { GLOSAR_SME } from './sme/glosar';
import type { Optiune, PasSuma, Scenariu } from './tipuri';

/** Banda programului (doar pe primul ecran). */
export const PROGRAM: DateProgram = {
  categorie: 'Fonduri nerambursabile',
  stare: 'Activ',
  stareTon: 'activ',
  titlu: 'Finanțare pentru IMM-uri: SME Eco-Tech, grant și credit',
  rezumat: `Grant de ${Math.round(CONFIG.grantProcent * 100)}% din investiție, până la ${lei(CONFIG.grantMax)}, plus un credit bancar pentru rest. Pentru echipamente verzi și alte echipamente noi.`,
};

const PROCENT_GRANT = `${Math.round(CONFIG.grantProcent * 100)}%`;
const PROCENT_VERDE = `${Math.round(CONFIG.verdeMin * 100)}%`;

const SUNA: Optiune = { valoare: 'suna', eticheta: 'Sună-ne', actiune: { tip: 'suna' } };
const ALT_CUI: Optiune = { valoare: 'altCui', eticheta: 'Încearcă alt CUI', actiune: { tip: 'altCui' } };

/** Categoria din motor, ca în glosar: „microîntreprindere” → [[microîntreprindere|microintreprindere]]. */
const CATEGORIE: Record<string, string> = {
  'Microîntreprindere': '[[microîntreprindere|microintreprindere]]',
  'Întreprindere mică': '[[întreprindere mică|intreprindere mica]]',
  'Întreprindere mijlocie': '[[întreprindere mijlocie|intreprindere mijlocie]]',
};

/** 46,1% (partea verde, din motor). */
const procentVerde = (x: number) => `${pct(x).toLocaleString('ro-RO')}%`;

/** Anul înființării, doar dacă vine de la ANAF (la F4 nu îl știm exact). */
const anInfiintare = (c: ContextSme) => (c.r.infiintata === undefined && c.date.data ? c.date.data.slice(0, 4) : null);

const ecouGrant = (c: ContextSme) => (c.rezultat.grant > 0 ? `Grantul ajunge deja la **${lei(c.rezultat.grant)}**.` : null);

const OPRIRE_FIRMA = {
  tip: 'oprire' as const,
  etapa: 'firma' as const,
  titlu: 'Din păcate, firma nu poate aplica la SME Eco-Tech.',
  motive: (c: ContextSme) => c.evaluare.motive,
  text: 'Hai să vorbim: poate găsim împreună altă finanțare potrivită.',
  butoane: [SUNA, ALT_CUI],
};

/** P1–P3: o sumă pe ecran, în lei. */
function pasSuma(id: Cumparatura, eticheta: string, sume: number[], extra: Partial<PasSuma<ContextSme>>): PasSuma<ContextSme> {
  return {
    id,
    tip: 'suma',
    etapa: 'sume',
    cand: (c) => c.cumperi.includes(id),
    eticheta,
    text: 'Cam cât costă, fără [[TVA|tva]]?',
    optiuni: () => sume.map((s) => ({ valoare: `~${s}`, eticheta: `~${lei(s)}` })),
    altaSuma: { eticheta: 'Altă sumă', placeholder: 'ex. 320.000', buton: 'Gata', eroare: 'Scrie suma în lei, fără TVA.', unitate: 'lei', format: lei },
    raspuns: (v) => {
      const n = Number(v.replace(/^~/, ''));
      return v.startsWith('~') ? `cam ${lei(n)}` : lei(n);
    },
    ...extra,
  };
}

const PASI: Scenariu<ContextSme>['pasi'] = [
  // S0 · Start + CUI (S1, căutarea, e starea de după)
  {
    id: 'cui',
    tip: 'cui',
    etapa: 'firma',
    text: 'Hai să vedem cât poate primi firma ta.',
    explicatie: 'Scrie CUI-ul firmei. Luăm restul datelor de la ANAF.',
    campEticheta: 'CUI-ul firmei',
    placeholder: 'ex. RO12345678',
    buton: 'Caută firma',
    cautare: 'Caut firma și bilanțurile la ANAF…',
    eroare: 'CUI-ul nu pare corect. Verifică cifrele.',
    reseteaza: ['firma', 'corectez', 'forma', 'angajati', 'cifra', 'infiintata', 'ca24'],
  },

  // S2 · Firma găsită
  {
    id: 'firma',
    tip: 'cardFirma',
    etapa: 'firma',
    ecou: 'Am găsit-o.',
    text: 'Asta e firma ta?',
    optiuni: [
      { valoare: 'da', eticheta: 'Da, e firma mea' },
      { valoare: 'corectez', eticheta: 'Nu' },
    ],
    randuri: (c) => {
      const inc = c.incadrareAnaf;
      const categoria = inc?.status === 'imm' ? inc.marime.nume : inc?.status === 'neimm' ? 'peste pragurile IMM' : 'nu știm încă';
      const angajati = c.firma?.bilant?.angajati;
      const d0 = c.dinAnaf;
      return [
        { eticheta: 'Localitatea', valoare: localitate(c.firma?.adresa, c.firma?.judet) || '—' },
        { eticheta: 'Categoria', valoare: categoria, accent: true },
        ...(angajati != null ? [{ eticheta: 'Angajați', valoare: String(angajati) }] : []),
        ...(d0?.data ? [{ eticheta: 'Înființată', valoare: `în ${d0.data.slice(0, 4)}` }] : []),
        ...(d0?.ca24 != null ? [{ eticheta: `Cifra de afaceri ${CONFIG.anCA}`, valoare: lei(d0.ca24) }] : []),
      ];
    },
    avert: (c) => c.evaluare.avert,
  },
  // S3 · Ce nu se potrivește
  {
    id: 'corectez',
    tip: 'alegere',
    etapa: 'firma',
    cand: (c) => c.r.firma === 'corectez',
    text: 'Ce nu se potrivește?',
    optiuni: [
      { valoare: 'cui', eticheta: 'Am greșit CUI-ul', actiune: { tip: 'altCui' } },
      { valoare: 'cifre', eticheta: 'Cifrele nu mai sunt la zi' },
    ],
  },
  // X1 · oprire după ANAF
  { id: 'oprireFirma', ...OPRIRE_FIRMA, cand: (c) => c.evaluare.motive.length > 0 && c.r.corectez !== 'cifre' },

  // F1–F5 · Firma fără date (doar ce lipsește)
  {
    id: 'forma',
    tip: 'alegere',
    etapa: 'firma',
    cand: (c) => c.faraForma,
    ecou: (c) => (c.firma ? 'Nu găsesc forma juridică a firmei. Îmi spui tu?' : 'Nu găsesc datele firmei acum. Îmi spui tu câteva lucruri.'),
    text: 'Ce formă juridică are firma?',
    optiuni: [
      { valoare: 'soc', eticheta: 'SRL sau SA' },
      { valoare: 'pfa', eticheta: 'PFA, II sau IF' },
      { valoare: 'alta', eticheta: 'Altă formă', detaliu: 'asociație, cooperativă etc.' },
    ],
  },
  {
    id: 'angajati',
    tip: 'alegere',
    etapa: 'firma',
    cand: (c) => c.faraCifre,
    ecou: (c) => {
      if (c.r.forma !== undefined) return null; // ecoul a fost pe ecranul formei
      if (c.r.corectez === 'cifre') return 'Bine. Spune-mi cum arată firma acum.';
      return 'Nu găsesc bilanțul firmei la ANAF. Îmi spui tu câteva lucruri.';
    },
    text: 'Câți angajați are firma?',
    // valoarea = numărul pe care îl primește motorul
    optiuni: [
      { valoare: '5', eticheta: '0–9' },
      { valoare: '30', eticheta: '10–49' },
      { valoare: '150', eticheta: '50–249' },
      { valoare: '300', eticheta: '250 sau mai mulți' },
    ],
    nota: (c) => (c.dinAnaf?.ang != null && c.dinAnaf.an !== null
      ? `La ANAF, în bilanțul pe ${c.dinAnaf.an}: ${c.dinAnaf.ang} angajați.` : null),
  },
  {
    id: 'cifra',
    tip: 'alegere',
    etapa: 'firma',
    cand: (c) => c.faraCifre,
    text: 'Cifra de afaceri de anul trecut?',
    // valoarea = cifra de afaceri în lei pe care o primește motorul (cu cursul implicit)
    optiuni: [
      { valoare: '2000000', eticheta: 'sub 10 mil. lei' },
      { valoare: '30000000', eticheta: '10–50 mil. lei' },
      { valoare: '150000000', eticheta: '50–250 mil. lei' },
      { valoare: '400000000', eticheta: 'peste 250 mil. lei' },
    ],
    nota: (c) => (c.dinAnaf?.ca != null && c.dinAnaf.an !== null
      ? `La ANAF, pe ${c.dinAnaf.an}: ${(c.dinAnaf.ca / 1_000_000).toLocaleString('ro-RO', { maximumFractionDigits: 1 })} mil. lei.` : null),
  },
  // F4 · data înființării lipsește
  {
    id: 'infiintata',
    tip: 'alegere',
    etapa: 'firma',
    cand: (c) => c.faraData,
    ecou: (c) => (c.r.forma === undefined && c.r.angajati === undefined ? 'Nu găsesc data înființării la ANAF. Îmi spui tu?' : null),
    text: 'Când a fost înființată firma?',
    // valoarea = data pe care o primește motorul
    optiuni: [
      { valoare: '2015-01-01', eticheta: 'Până în 2021 inclusiv' },
      { valoare: '2023-01-01', eticheta: 'În 2022 sau mai târziu' },
    ],
  },
  // F5 · cifra de afaceri 2024 lipsește
  {
    id: 'ca24',
    tip: 'alegere',
    etapa: 'firma',
    cand: (c) => c.faraCa24,
    ecou: (c) => (c.r.forma === undefined && c.r.angajati === undefined && c.r.infiintata === undefined
      ? `Nu găsesc bilanțul pe ${CONFIG.anCA} la ANAF. Îmi spui tu?` : null),
    text: `A avut firma vânzări în ${CONFIG.anCA}?`,
    explicatie: `Programul cere o cifră de afaceri mai mare decât zero în ${CONFIG.anCA}.`,
    // valoarea = cifra de afaceri 2024 pe care o primește motorul
    optiuni: [
      { valoare: '1', eticheta: 'Da' },
      { valoare: '0', eticheta: 'Nu' },
    ],
  },
  // X1 · oprire după răspunsurile omului
  { id: 'oprireDate', ...OPRIRE_FIRMA, cand: (c) => c.evaluare.motive.length > 0 },

  // C1 · Ce cumperi (singurul ecran cu alegere multiplă)
  {
    id: 'cumperi',
    tip: 'multipla',
    etapa: 'cumperi',
    ecou: (c) => {
      const i = c.evaluare.incadrare;
      if (i.status !== 'imm') return null;
      const an = anInfiintare(c);
      return `Firma ta se încadrează: e ${CATEGORIE[i.marime.nume] ?? i.marime.nume.toLowerCase()}${an ? `, înființată în **${an}**` : ''}.`;
    },
    eticheta: 'Ce cumperi',
    text: 'Ce vrei să cumperi?',
    explicatie: 'Poți alege mai multe.',
    optiuni: [
      { valoare: 'verde', eticheta: 'Echipamente verzi', detaliu: 'panouri fotovoltaice, pompe de căldură, reciclare, eficiență energetică' },
      { valoare: 'alte', eticheta: 'Alte echipamente', detaliu: 'utilaje, calculatoare, imprimante, site, magazin online' },
      { valoare: 'soft', eticheta: 'Software', detaliu: 'programe și licențe' },
    ],
    continua: 'Continuă',
    antrenor: `Cel puțin **${PROCENT_VERDE}** din bani trebuie să meargă pe [[echipamente verzi]]. Fără ele, proiectul nu se încadrează.`,
    nota: `Proiectul trebuie să aibă cel puțin **${lei(CONFIG.proiectMin)}**, fără [[TVA|tva]]. Grantul e ${PROCENT_GRANT} din el; restul e un [[credit bancar]].`,
  },

  // P1 · Echipamentele verzi
  pasSuma('verde', 'Echipamente verzi', [150_000, 300_000, 450_000, 700_000], {
    nota: 'Prețurile din ofertele furnizorilor. Echipamentele trebuie să fie noi.',
  }),
  // P2 · Alte echipamente
  pasSuma('alte', 'Alte echipamente', [100_000, 250_000, 400_000, 600_000], {
    ecou: ecouGrant,
    antrenor: (c) => (c.date.verde
      ? `Ca partea verde să rămână de cel puțin ${PROCENT_VERDE}, aici poți pune până la **${lei(alteMaxim(c.date.verde))}**.`
      : null),
  }),
  // P3 · Software
  pasSuma('soft', 'Software', [5_000, 10_000, 15_000, 30_000], {
    ecou: (c) => {
      if (c.date.alte === null) return ecouGrant(c);
      const p = procentVerde(c.rezultat.verdePct);
      return verdeSuficient(c.rezultat) ? `Partea verde e **${p}**. E în regulă.` : `Partea verde e **${p}**. Minimul e ${PROCENT_VERDE}.`;
    },
    nota: `Se [[decontează|deconteaza]] cel mult **${lei(CONFIG.softwareMax)}**. Peste, diferența o plătești tu.`,
  }),

  // R · Rezultatul (R-ok sau R-proiect, după starea motorului)
  { id: 'rezultat', tip: 'rezultat', etapa: 'rezultat' },
];

export const SCENARIU: Scenariu<ContextSme> = {
  etape: [
    { cheie: 'firma', nume: 'Firma' },
    { cheie: 'cumperi', nume: 'Ce cumperi' },
    { cheie: 'sume', nume: 'Sumele' },
    { cheie: 'rezultat', nume: 'Rezultatul' },
  ],
  context: contextSme,
  pasi: PASI,
  // Pentru ce n-am văzut încă: firma = CUI + confirmarea; ce cumperi = un ecran; sumele = câte una
  // pentru fiecare alegere (una cât nu știm).
  estimari: (c) => ({ firma: 2, cumperi: 1, sume: Math.max(1, c.cumperi.length) }),
};

/** Textele rezultatului. */
export const REZULTAT = {
  eticheta: 'Grantul estimat',
  din: 'lei grant',
  estimat: 'estimat din ce ne-ai spus',
  titluProiect: 'Firma se încadrează. Proiectul, încă nu.',
  propozitii: (c: ContextSme): string[] => {
    const r = c.rezultat;
    return [
      'Poți aplica.',
      `Primești un [[grant]] de **${lei(r.grant)}**.`,
      `Restul, **${lei(r.credit)}**, e un [[credit bancar]].`,
      `Tu plătești [[TVA-ul|tva]], cam **${lei(r.tvaSuma)}**${r.nedecontat > 0 ? `, și software-ul peste ${lei(CONFIG.softwareMax)}, **${lei(r.nedecontat)}**` : ''}.`,
    ];
  },
  bara: { titlu: 'Banii, pe scurt', grant: 'Grantul', credit: 'Creditul', tu: 'Plătești tu' },
  parteaVerde: (c: ContextSme) => `Partea verde: **${procentVerde(c.rezultat.verdePct)}** din investiție (minimum ${PROCENT_VERDE}).`,
  /** Antrenorul pe R-proiect, din sfatul motorului (null = fără sfat). */
  antrenor: (c: ContextSme): string | null => {
    const nou = c.rezultat.verdeNou;
    if (nou === null) return null;
    const v = c.date.verde ?? 0;
    return v > 0
      ? `Cu echipamente verzi de **${lei(nou)}** (cu ${lei(nou - v)} mai mult), proiectul se încadrează.`
      : `Cu echipamente verzi de **${lei(nou)}**, proiectul se încadrează.`;
  },
  nota: 'Estimare orientativă, după procedura SME Eco-Tech. Nu garantează obținerea finanțării. Eligibilitatea o stabilește Ministerul Economiei, iar creditul îl aprobă banca.',
  schimba: '← Schimbă răspunsurile',
  schimbaSumele: '← Schimbă sumele',
};

/** Drumul până la bani (docs/flux-sme.md §5). */
export const DRUM: DateDrum = {
  titlu: 'Drumul până la bani',
  urmatorul: 'Următorul pas',
  pasi: [
    { titlu: 'Verificarea preliminară', text: 'Gata. Știi cât poți primi.' },
    { titlu: 'Ne trimiți analiza', text: 'Un click, fără obligații.' },
    { titlu: 'Te sunăm', text: 'Verificăm împreună firma și lista de cumpărături.' },
    { titlu: 'Pregătim dosarul', text: 'Ofertele de preț, planul de cheltuieli, actele. Ne ocupăm noi.' },
    { titlu: 'Te înscriem online', text: `[[Primul venit, primul servit|primul venit]]. Termenul: ${CONFIG.termen}.` },
    { titlu: 'Acordul și creditul', text: 'Banca parteneră decide creditul în cel mult 30 de zile lucrătoare.' },
    { titlu: 'Echipamentele și banii', text: 'Cumperi în 12 luni. Plățile vin din grant și din credit.' },
  ],
};

/** Sfaturile motorului, cu „primul venit, primul servit” explicat din glosar. */
const cuGlosar = (text: string) => text.replace('primul venit, primul servit', '[[primul venit, primul servit|primul venit]]');

/** Ecranul de rezultat, din motor: R-ok sau R-proiect. */
function rezultat(c: ContextSme): VedereRezultat {
  const r = c.rezultat;
  const baza = {
    eticheta: REZULTAT.eticheta,
    cifra: r.grant,
    format: (n: number) => Math.round(n).toLocaleString('ro-RO'),
    din: REZULTAT.din,
    cifraMica: true,
    estimat: c.estimat ? REZULTAT.estimat : null,
    nota: REZULTAT.nota,
  };
  if (r.status !== 'ok') {
    const antrenor = REZULTAT.antrenor(c);
    return {
      ...baza,
      varianta: 'proiect',
      gri: true,
      titlu: REZULTAT.titluProiect,
      propozitii: [],
      probleme: r.probleme,
      bara: null,
      rand: null,
      antrenor: antrenor ? { text: antrenor, detaliu: null, aplica: true } : null,
      deStiut: [],
      drum: false,
      trimite: false,
      schimba: REZULTAT.schimbaSumele,
    };
  }
  return {
    ...baza,
    varianta: 'ok',
    titlu: null,
    propozitii: REZULTAT.propozitii(c),
    probleme: [],
    bara: {
      titlu: REZULTAT.bara.titlu,
      segmente: [
        { cheie: 'grant', eticheta: REZULTAT.bara.grant, valoare: r.grant, culoare: 'bg-primary' },
        { cheie: 'credit', eticheta: REZULTAT.bara.credit, valoare: r.credit, culoare: 'bg-accent' },
        { cheie: 'tu', eticheta: REZULTAT.bara.tu, valoare: r.proprii, culoare: 'bg-quinary' },
      ].filter((x) => x.valoare > 0),
      total: r.grant + r.credit + r.proprii || 1,
      format: lei,
    },
    rand: REZULTAT.parteaVerde(c),
    antrenor: null,
    deStiut: [
      ...r.tips.filter((t) => !t.apply).map((t) => ({ text: cuGlosar(t.text), ton: 'sfat' as const })),
      ...r.avert.map((text) => ({ text, ton: 'avertisment' as const })),
      { text: MAI_VERIFICA, ton: 'info' as const },
    ],
    drum: true,
    trimite: true,
    schimba: REZULTAT.schimba,
  };
}

/** Calculatorul SME Eco-Tech: scenariul și ce e specific în jurul ecranelor comune. */
export const SME: Program<ContextSme> = {
  scenariu: SCENARIU,
  banda: PROGRAM,
  istoric: true,
  rand: (d, e) => {
    const c = d.ctx;
    if (e.tip === 'oprire' || !c.evaluare.gata) return null;
    if (c.firma && d.acceptate.firma !== 'da' && !c.estimat) return null;
    if (c.rezultat.grant > 0) return ['Grant: ', { numar: c.rezultat.grant, format: lei, cheie: 'grant' }];
    return [`Grant de ${PROCENT_GRANT}, până la `, { numar: CONFIG.grantMax, format: lei, cheie: 'max' }];
  },
  rezultat,
  // „Aplică” pe R-proiect: echipamentele verzi devin alese, cu suma sfătuită de motor.
  aplica: (r, c) => {
    const nou = c.rezultat.verdeNou;
    if (nou === null) return r;
    const cumperi = CUMPARATURI.filter((k) => k === 'verde' || c.cumperi.includes(k)).join(',');
    return { ...r, cumperi, verde: String(nou) };
  },
  schimbaPas: 'cumperi',
  drum: DRUM,
  glosar: GLOSAR_SME,
  analiza: (derulare, contact) => construiesteAnalizaSme({ derulare, contact }),
};
