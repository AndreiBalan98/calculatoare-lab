// Scenariul e-DRIVE: un ecran = o întrebare (docs/flux-edrive.md v2). Pașii, textele, butoanele.
//
// CUM MODIFICI
// - Un text: schimbă-l aici. **așa** = îngroșat; [[cuvânt]] sau [[cuvânt afișat|cheie]] = cuvânt
//   subliniat cu explicație (explicațiile sunt în glosar.ts).
// - Pe un ecran de întrebare: `ecou` (linia aurie care reacționează la răspunsul de dinainte),
//   `eticheta`, `text` (întrebarea), `explicatie`, `optiuni`, `antrenor`, `nota`; `etapa` = unde
//   stă în progresul de sus (firma / masini / pret / rezultat).
// - Ordinea: mută pasul în lista SCENARIU. Fiecare pas vede doar răspunsurile de dinaintea lui.
// - O opțiune: `valoare` e ce intră în calcul (la angajați și cifra de afaceri, chiar numărul
//   dat motorului), `eticheta` e textul de pe buton, `detaliu` un rând mic sub el.
// - Când apare un pas: `cand`. Cifrele vin mereu din motor, prin `c` (contextul): c.evaluare,
//   c.rezultat, c.scor (vezi context.ts). Nu scrie reguli de finanțare aici.
// - Restul calculatorului (rândul din progres, rezultatul, drumul, glosarul): obiectul EDRIVE, la final.

import { CONFIG } from '@/motor/edrive/config';
import { toateUE } from './actiuni';
import { construiesteAnaliza } from './analiza';
import { CONTACT, TEXTE as TEXTE_COMUNE, TRIMITERE } from './comun';
import { contextDin, numarMasini, pestePlafon, rezultatToateUE, scorInainteDeUE, type Context, type Masina } from './context';
import { euro, localitate, puncte } from './format';
import { GLOSAR } from './glosar';
import type { DateProgram, Program, VedereRezultat } from './program';
import type { Optiune, Pas, Scenariu } from './tipuri';

export { CONTACT, TRIMITERE };

/** Banda programului (doar pe primul ecran). */
export const PROGRAM: DateProgram = {
  categorie: 'Fonduri nerambursabile',
  stare: 'Anunțat',
  titlu: 'Finanțare pentru mașini electrice: e-DRIVE pentru IMM-uri',
  rezumat: `Până la ${euro(CONFIG.plafonM1)} pentru fiecare mașină electrică nouă care înlocuiește o mașină pe benzină sau motorină a firmei.`,
};

const BONUS = CONFIG.bonusUE;

const SUNA: Optiune = { valoare: 'suna', eticheta: 'Sună-ne', actiune: { tip: 'suna' } };
const ALT_CUI: Optiune = { valoare: 'altCui', eticheta: 'Încearcă alt CUI', actiune: { tip: 'altCui' } };

/** „…, pentru că ești microîntreprindere.” — după numele categoriei din motor. */
const DE_CE: Record<string, string> = {
  'Microîntreprindere': 'pentru că ești [[microîntreprindere|microintreprindere]]',
  'Întreprindere mică': 'pentru că firma ta e [[întreprindere mică|intreprindere mica]]',
  'Întreprindere mijlocie': 'pentru că firma ta e [[întreprindere mijlocie|intreprindere mijlocie]]',
};

/** „Pornești cu **80 de puncte**, pentru că ești microîntreprindere.” (null = firma nu e IMM). */
export function deCePornesti(c: Context): string | null {
  const i = c.evaluare.incadrare;
  if (i.status !== 'imm') return null;
  return `Pornești cu **${puncte(i.puncte)}**, ${DE_CE[i.marime.nume] ?? `ca ${i.marime.nume.toLowerCase()}`}.`;
}

/** 2 → „două” (mașini). */
const NUMERALE = ['', 'o', 'două', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece'];
const masiniText = (n: number) => (n === 1 ? 'o mașină' : `${NUMERALE[n] ?? n} mașini`);
const autoturismeText = (n: number) => (n === 1 ? 'un autoturism' : `${NUMERALE[n] ?? n} autoturisme`);
const microbuzeText = (n: number) => (n === 1 ? 'un microbuz' : `${NUMERALE[n] ?? n} microbuze`);

const PRETURI: Record<Masina['cat'], number[]> = {
  M1: [20_000, 25_000, 30_000, 35_000, 45_000],
  M2: [35_000, 45_000, 60_000],
};

const cifre = (de: number, pana: number): Optiune[] => {
  const o: Optiune[] = [];
  for (let n = de; n <= pana; n++) o.push({ valoare: String(n), eticheta: String(n) });
  return o;
};

const etichetaMasina = (m: Masina) => {
  const cat = m.cat === 'M1' ? 'autoturism' : 'microbuz';
  return m.total === 1 ? `Mașina electrică · ${cat}` : `Mașina electrică ${m.index + 1} din ${m.total} · ${cat}`;
};

function pasiMasina(m: Masina): Pas<Context>[] {
  const i = m.index;
  return [
    // P1 · prețul
    {
      id: `pret_${i}`,
      tip: 'suma',
      etapa: 'pret',
      ecou: (c) => {
        if (i === 0) return 'Acum, mașinile electrice noi.';
        const v = c.r[`ue_${i - 1}`];
        if (v === 'da') return c.scor > scorInainteDeUE(c, i - 1) ? `Bun! Asta înseamnă **${BONUS} de puncte** în plus.` : 'Bun, și asta e asamblată în UE.';
        if (v === 'nustiu') return 'Nicio grijă, verificăm împreună modelul.';
        return 'Am notat.';
      },
      eticheta: etichetaMasina(m),
      text: 'Cam cât costă, fără [[TVA|tva]]?',
      optiuni: (c) => {
        const o: Optiune[] = [];
        const prima = c.masini.find((x) => x.cat === m.cat);
        if (prima && prima.index !== i && c.preturi[prima.index] !== null) {
          o.push({ valoare: 'aceeasi', eticheta: `La fel ca mașina ${prima.index + 1} · ${euro(c.preturi[prima.index] ?? 0)}` });
        }
        for (const p of PRETURI[m.cat]) o.push({ valoare: `~${p}`, eticheta: `~${euro(p)}` });
        return o;
      },
      nota: m.cat === 'M1'
        ? `Finanțarea e de cel mult ${euro(CONFIG.plafonM1)} pe autoturism. Peste, diferența o plătește firma.`
        : 'La microbuz nu există plafon pe vehicul.',
      altaSuma: { eticheta: 'Altă sumă', placeholder: 'ex. 28.500', buton: 'Gata', eroare: 'Scrie suma în euro, fără TVA.' },
      raspuns: (v, c) => {
        if (v === 'aceeasi') {
          const prima = c.masini.find((x) => x.cat === m.cat);
          return `la fel ca mașina ${(prima?.index ?? 0) + 1} (${euro((prima && c.preturi[prima.index]) ?? 0)})`;
        }
        const n = Number(v.replace(/^~/, ''));
        return v.startsWith('~') ? `cam ${euro(n)}` : euro(n);
      },
    },
    // P2 · UE
    {
      id: `ue_${i}`,
      tip: 'alegere',
      etapa: 'pret',
      ecou: (c) => {
        const peste = pestePlafon(c, i);
        return peste > 0 ? `Peste [[plafon]], diferența de **${euro(peste)}** o plătește firma.` : null;
      },
      eticheta: etichetaMasina(m),
      text: 'E [[asamblată în Uniunea Europeană|ue]]?',
      optiuni: [
        { valoare: 'da', eticheta: 'Da' },
        { valoare: 'nu', eticheta: 'Nu' },
        { valoare: 'nustiu', eticheta: 'Nu știu' },
      ],
      antrenor: (c) => `Dacă alegi un model asamblat în UE, primești **${BONUS} de puncte în plus**.${c.masini.length > 1 ? ' Contează să fie toate asamblate în UE.' : ''}`,
    },
  ];
}

const OPRIRE_FIRMA = {
  tip: 'oprire' as const,
  etapa: 'firma' as const,
  titlu: 'Din păcate, firma nu poate aplica la e-DRIVE.',
  motive: (c: Context) => c.evaluare.motive,
  text: 'Hai să vorbim: poate găsim împreună altă finanțare potrivită.',
  butoane: [SUNA, ALT_CUI],
};

/** Progresul de sus. */
export const PROGRES = {
  etape: [
    { cheie: 'firma', nume: 'Firma' },
    { cheie: 'masini', nume: 'Mașinile' },
    { cheie: 'pret', nume: 'Prețul' },
    { cheie: 'rezultat', nume: 'Rezultatul' },
  ] as const,
  /** „80 de puncte · până la 25.000 €” */
  puncte: (n: number) => (n === 1 ? 'punct' : n % 100 === 0 || n % 100 >= 20 ? 'de puncte' : 'puncte'),
  panaLa: 'până la',
  etapaTrecuta: TEXTE_COMUNE.etapaTrecuta,
};

const PASI: Scenariu<Context>['pasi'] = [
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
    cautare: 'Caut firma la ANAF…',
    eroare: 'CUI-ul nu pare corect. Verifică cifrele.',
    reseteaza: ['firma', 'corectez', 'forma', 'angajati', 'cifra'],
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
      return [
        { eticheta: 'Localitatea', valoare: localitate(c.firma?.adresa, c.firma?.judet) || '—' },
        { eticheta: 'Categoria', valoare: categoria, accent: true },
        ...(angajati != null ? [{ eticheta: 'Angajați', valoare: String(angajati) }] : []),
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

  // F1–F3 · Firma fără date (doar când e nevoie)
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
      { valoare: 'alta', eticheta: 'Altă formă' },
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
    nota: (c) => (c.dinAnaf?.ang != null && !Number.isNaN(c.dinAnaf.ang) && c.dinAnaf.an !== null
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
    nota: (c) => (c.dinAnaf?.ca != null && !Number.isNaN(c.dinAnaf.ca) && c.dinAnaf.an !== null
      ? `La ANAF, pe ${c.dinAnaf.an}: ${(c.dinAnaf.ca / 1_000_000).toLocaleString('ro-RO', { maximumFractionDigits: 1 })} mil. lei.` : null),
  },
  // X1 · oprire după răspunsurile omului
  { id: 'oprireDate', ...OPRIRE_FIRMA, cand: (c) => c.evaluare.motive.length > 0 },

  // M1 · Câte mașini
  {
    id: 'nrMasini',
    tip: 'alegere',
    etapa: 'masini',
    ecou: (c) => deCePornesti(c),
    eticheta: 'Mașinile',
    text: 'Câte mașini pe benzină sau motorină vrei să schimbi cu mașini electrice?',
    optiuni: cifre(1, CONFIG.maxVehicule),
    grila: true,
    maiMulte: { eticheta: 'Mai multe', de: 5 },
    nota: 'Fiecare mașină electrică nouă înlocuiește una veche, a firmei.',
  },
  // M2 · Ce fel de mașini
  {
    id: 'tipMasini',
    tip: 'alegere',
    etapa: 'masini',
    ecou: (c) => `Bun, ${masiniText(numarMasini(c.r))}.`,
    text: (c) => (numarMasini(c.r) === 1 ? 'Ce fel de mașină e?' : 'Ce fel de mașini sunt?'),
    explicatie: 'Mașina electrică nouă va fi din aceeași categorie: [[autoturism]] în locul unui autoturism, [[microbuz]] în locul unui microbuz.',
    optiuni: (c) => (numarMasini(c.r) === 1
      ? [
          { valoare: 'M1', eticheta: 'Autoturism', detaliu: 'până la 8 locuri plus șoferul' },
          { valoare: 'M2', eticheta: 'Microbuz', detaliu: 'peste 8 locuri plus șoferul' },
        ]
      : [
          { valoare: 'toateM1', eticheta: 'Toate sunt autoturisme' },
          { valoare: 'toateM2', eticheta: 'Toate sunt microbuze' },
          { valoare: 'mixt', eticheta: 'Și autoturisme, și microbuze' },
        ]),
  },
  // M3 · Câte microbuze (doar la „și, și”)
  {
    id: 'nrMicrobuze',
    tip: 'alegere',
    etapa: 'masini',
    cand: (c) => c.r.tipMasini === 'mixt',
    text: (c) => `Câte dintre cele ${numarMasini(c.r)} sunt microbuze?`,
    explicatie: 'Restul sunt autoturisme.',
    optiuni: (c) => cifre(1, numarMasini(c.r) - 1),
    grila: true,
  },
  // M4 · De cât timp sunt ale firmei
  {
    id: 'vechi',
    tip: 'alegere',
    etapa: 'masini',
    ecou: (c) => {
      if (c.r.tipMasini !== 'mixt') return null;
      const n2 = c.masini.filter((m) => m.cat === 'M2').length;
      return `Deci ${autoturismeText(c.masini.length - n2)} și ${microbuzeText(n2)}.`;
    },
    text: (c) => (c.masini.length === 1 ? 'Mașina e a firmei de cel puțin un an?' : 'Mașinile sunt ale firmei de cel puțin un an?'),
    optiuni: [
      { valoare: 'da', eticheta: 'Da' },
      { valoare: 'nu', eticheta: 'Nu' },
    ],
  },
  // M5 · Promisiunea
  {
    id: 'promisiune',
    tip: 'alegere',
    etapa: 'masini',
    cand: (c) => c.r.vechi === 'nu',
    text: 'Poți cumpăra una înainte de contract?',
    explicatie: 'Se poate cu o [[promisiune notarială|promisiune]]: cumperi o mașină pe benzină sau motorină cu RCA și ITP valabile și anul trecut și o treci pe firmă înainte de contractul de finanțare. Costul ei nu se decontează.',
    optiuni: [
      { valoare: 'da', eticheta: 'Da, pot' },
      { valoare: 'nu', eticheta: 'Nu' },
    ],
  },
  // X2 · fără mașină de înlocuit
  {
    id: 'oprireVechi',
    tip: 'oprire',
    etapa: 'masini',
    cand: (c) => c.r.promisiune === 'nu',
    titlu: 'Fără o mașină de înlocuit nu se poate aplica.',
    motive: () => [],
    text: 'Fiecare mașină electrică nouă trebuie să înlocuiască o mașină pe benzină sau motorină a firmei. Hai să vorbim: poate găsim împreună o soluție.',
    butoane: [SUNA, { valoare: 'inapoi', eticheta: 'Schimbă răspunsul', actiune: { tip: 'inapoi', pas: 'vechi' } }],
  },

  // P1, P2 · pentru fiecare mașină
  { tip: 'grup', id: 'masina', pasi: (c) => c.masini.flatMap(pasiMasina) },

  // R · Rezultatul
  { id: 'rezultat', tip: 'rezultat', etapa: 'rezultat' },
];

export const SCENARIU: Scenariu<Context> = {
  etape: PROGRES.etape,
  context: contextDin,
  pasi: PASI,
  // Pentru ce n-am văzut încă: firma = CUI + confirmarea; mașinile = câte, ce fel, de cât timp;
  // prețul = 2 întrebări pe mașină (1 mașină cât nu știm câte).
  estimari: (c, acceptate) => ({ firma: 2, masini: 3, pret: 2 * Math.max(1, c.masini.length || numarMasini(acceptate)) }),
};

/** Textele rezultatului. */
export const REZULTAT = {
  eticheta: 'Punctajul estimat',
  din: 'din 100',
  estimat: 'estimat din ce ne-ai spus',
  propozitii: (c: Context): string[] => {
    const r = c.rezultat;
    const peste = r.fara - r.ajutor;
    return [
      'Poți aplica.',
      `Primești până la **${euro(r.ajutor)}**.`,
      `Tu plătești [[TVA-ul|tva]], cam **${euro(r.tvaSuma)}**${peste > 0 ? `, și diferența peste [[plafon]], **${euro(peste)}**` : ''}.`,
    ];
  },
  bara: {
    titlu: 'Banii, pe scurt',
    finantare: 'Finanțarea',
    partea: 'Partea ta',
    tva: `TVA-ul (${Math.round(CONFIG.tva * 100)}%)`,
  },
  /** Antrenorul la rezultat, dacă lipsesc puncte (null = nu lipsesc). */
  antrenor: (c: Context): string | null => {
    if (c.rezultat.p2 > 0) return null;
    const cu = rezultatToateUE(c).total;
    if (cu <= c.rezultat.total) return null;
    return c.masini.length === 1
      ? `Cu un model asamblat în UE ai avea **${cu}**.`
      : `Cu modele asamblate în UE ai avea **${cu}**.`;
  },
  antrenorEticheta: TEXTE_COMUNE.antrenor,
  aplica: TEXTE_COMUNE.aplica,
  deStiut: TEXTE_COMUNE.deStiut,
  nota: 'Estimare orientativă după regulile e-DRIVE Măsura 1. Eligibilitatea și punctajul final le stabilește Ministerul Transporturilor și Infrastructurii.',
  trimite: TEXTE_COMUNE.trimite,
  trimisa: TEXTE_COMUNE.trimisa,
  primita: TEXTE_COMUNE.primita,
  suna: TEXTE_COMUNE.suna,
  schimba: '← Schimbă răspunsurile',
  /** unde duce „Schimbă răspunsurile” */
  schimbaPas: 'nrMasini',
};

/** Drumul până la bani. */
export const DRUM = {
  titlu: 'Drumul până la bani',
  urmatorul: 'Următorul pas',
  pasi: [
    { titlu: 'Verificarea preliminară', text: 'Gata. Știi cât poți primi.' },
    { titlu: 'Ne trimiți analiza', text: 'Un click, fără obligații.' },
    { titlu: 'Te sunăm', text: 'Verificăm împreună detaliile.' },
    { titlu: 'Pregătim dosarul', text: 'Ofertele, actele, cererea. Ne ocupăm noi.' },
    { titlu: 'Depunem la deschiderea apelului', text: 'Data nu e anunțată încă. Cu dosarul gata, depunem primii.' },
    { titlu: 'Contractul de finanțare', text: '' },
    { titlu: 'Mașina și banii', text: 'Cumperi mașina, primești finanțarea.' },
  ],
};

/** Textele mărunte ale interfeței. */
export const TEXTE = TEXTE_COMUNE;

/** Ecranul de rezultat, din motor. */
function rezultat(c: Context): VedereRezultat {
  const r = c.rezultat;
  const peste = r.fara - r.ajutor;
  const antrenor = REZULTAT.antrenor(c);
  const sfatUE = r.tips.find((t) => t.apply === 'ue');
  return {
    varianta: 'ok',
    eticheta: REZULTAT.eticheta,
    cifra: r.total,
    din: REZULTAT.din,
    estimat: c.estimat ? REZULTAT.estimat : null,
    titlu: null,
    propozitii: REZULTAT.propozitii(c),
    probleme: [],
    bara: {
      titlu: REZULTAT.bara.titlu,
      segmente: [
        { cheie: 'finantare', eticheta: REZULTAT.bara.finantare, valoare: r.ajutor, culoare: 'bg-primary' },
        { cheie: 'partea', eticheta: REZULTAT.bara.partea, valoare: peste, culoare: 'bg-accent' },
        { cheie: 'tva', eticheta: REZULTAT.bara.tva, valoare: r.tvaSuma, culoare: 'bg-quinary' },
      ].filter((x) => x.valoare > 0),
      total: r.fara + r.tvaSuma || 1,
      format: euro,
    },
    rand: null,
    antrenor: antrenor ? { text: antrenor, detaliu: sfatUE?.text ?? null, aplica: !!sfatUE } : null,
    deStiut: r.avert.map((text) => ({ text, ton: 'avertisment' as const })),
    drum: true,
    trimite: true,
    nota: REZULTAT.nota,
    schimba: REZULTAT.schimba,
  };
}

/** Calculatorul e-DRIVE: scenariul și ce e specific în jurul ecranelor comune. */
export const EDRIVE: Program<Context> = {
  scenariu: SCENARIU,
  banda: PROGRAM,
  rand: (d, e) => {
    const c = d.ctx;
    const incadrat = c.evaluare.incadrare.status === 'imm' && (d.acceptate.firma === 'da' || c.estimat);
    if (!incadrat || e.tip === 'oprire') return null;
    const scor = e.tip === 'rezultat' ? c.rezultat.total : c.scor;
    const bani = c.rezultat.ajutor;
    return [
      { numar: scor, castig: true },
      ` ${PROGRES.puncte(scor)}`,
      ...(bani > 0 ? [` · ${PROGRES.panaLa} `, { numar: bani, format: euro }] : []),
    ];
  },
  rezultat,
  aplica: (r) => toateUE(r),
  schimbaPas: REZULTAT.schimbaPas,
  drum: DRUM,
  glosar: GLOSAR,
  analiza: (derulare, contact) => construiesteAnaliza({ derulare, contact }),
};
