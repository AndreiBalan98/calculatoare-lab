// Scenariul conversației e-DRIVE: pașii, textele, butoanele, ramificațiile.
//
// CUM MODIFICI
// - Un text: schimbă-l aici. **așa** = îngroșat; [[cuvânt]] sau [[cuvânt afișat|cheie]] = cuvânt
//   subliniat cu explicație (explicațiile sunt în glosar.ts).
// - Ordinea: mută pasul în lista SCENARIU. Fiecare pas vede doar răspunsurile de dinaintea lui.
// - O opțiune: adaugă / scoate din `optiuni`. `valoare` e ce intră în calcul (la angajați și
//   cifra de afaceri, chiar numărul dat motorului), `eticheta` e textul de pe buton.
// - Când apare un pas: `cand`. Cifrele vin mereu din motor, prin `c` (contextul): c.evaluare,
//   c.rezultat, c.date (vezi context.ts). Nu scrie reguli de finanțare aici.

import { CONFIG } from '@/motor/edrive/config';
import { rezultatToateUE, type Context, type Masina } from './context';
import { euro, lei, localitate, puncte } from './format';
import type { Optiune, Pas, Scenariu } from './tipuri';

export const CONTACT = {
  telefon: '+40 749 589 848',
  tel: 'tel:+40749589848',
  email: 'contact@dezvoltaredigitala.ro',
};

/** Banda programului (sus, ca pe site). */
export const PROGRAM = {
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

const PRETURI: Record<Masina['cat'], number[]> = {
  M1: [20_000, 25_000, 30_000, 35_000, 45_000],
  M2: [35_000, 45_000, 60_000],
};

const numarMasini = (c: Context, id: 'nrM1' | 'nrM2') =>
  c.r[id] === 'mai' ? Number(c.r[id + 'Multe'] || 0) : Number(c.r[id] || 0);

function optiuniNumar(min: number, max: number, cuMaiMulte: boolean): Optiune[] {
  const o: Optiune[] = [];
  for (let n = min; n <= Math.min(3, max); n++) o.push({ valoare: String(n), eticheta: String(n) });
  if (cuMaiMulte && max >= 4) o.push({ valoare: 'mai', eticheta: 'mai multe' });
  return o;
}

function optiuniMulte(max: number): Optiune[] {
  const o: Optiune[] = [];
  for (let n = 4; n <= max; n++) o.push({ valoare: String(n), eticheta: String(n) });
  return o;
}

const numeMasina = (m: Masina) =>
  (m.cat === 'M1' ? 'Autoturismul' : 'Microbuzul') + (m.totalInCat > 1 ? ` ${m.nrInCat} din ${m.totalInCat}` : '');

function pasiMasina(m: Masina): Pas[] {
  const i = m.index;
  const eticheta = (c: Context) => (c.masini.length > 1 ? numeMasina(m) : null);
  return [
    {
      id: `pret_${i}`,
      tip: 'suma',
      eticheta,
      text: 'Cam cât costă mașina electrică, fără [[TVA|tva]]?',
      scurt: (c) => (c.masini.length > 1 ? `${numeMasina(m)}: prețul` : 'Prețul fără TVA'),
      optiuni: () => {
        const o: Optiune[] = [];
        if (m.nrInCat > 1) o.push({ valoare: 'aceeasi', eticheta: 'La fel ca prima' });
        for (const p of PRETURI[m.cat]) o.push({ valoare: `~${p}`, eticheta: `~${euro(p)}` });
        return o;
      },
      nota: m.cat === 'M1'
        ? `Finanțarea e de cel mult ${euro(CONFIG.plafonM1)} pe autoturism. Peste, diferența o plătește firma.`
        : 'La microbuz nu există plafon pe vehicul.',
      altaSuma: { eticheta: 'Altă sumă', placeholder: 'ex. 28.500', buton: 'Gata' },
      raspuns: (v, c) => {
        if (v === 'aceeasi') {
          const prima = c.masini.find((x) => x.cat === m.cat);
          return `la fel ca prima (${euro((prima && c.preturi[prima.index]) ?? 0)})`;
        }
        const n = Number(v.replace(/^~/, ''));
        return v.startsWith('~') ? `cam ${euro(n)}` : euro(n);
      },
      // Peste plafon: sfatul motorului pentru această mașină („Mașina 1 trece de 30.000 €…”).
      reactie: (_, c) => c.rezultat.tips.find((t) => t.text.startsWith(`Mașina ${i + 1} `))?.text ?? null,
    },
    {
      id: `ue_${i}`,
      tip: 'alegere',
      eticheta,
      text: 'E [[asamblată în UE|ue]]?',
      scurt: (c) => (c.masini.length > 1 ? `${numeMasina(m)}: asamblat în UE` : 'Asamblată în UE'),
      optiuni: [
        { valoare: 'da', eticheta: 'Da' },
        { valoare: 'nu', eticheta: 'Nu' },
        { valoare: 'nustiu', eticheta: 'Nu știu' },
      ],
      antrenor: (c) => {
        if (i === 0) return `Dacă alegi un model [[asamblat în UE|ue]], primești **${BONUS} de puncte** în plus.`;
        const toateDa = c.masini.slice(0, i).every((x) => c.r[`ue_${x.index}`] === 'da');
        return toateDa ? `Ca să primești cele ${BONUS} de puncte, toate mașinile trebuie să fie asamblate în UE.` : null;
      },
      reactie: (v, c) => {
        if (v === 'nustiu') return `Nicio grijă, verificăm împreună modelul. Deocamdată nu socotesc cele ${BONUS} de puncte.`;
        const inainte = c.masini.slice(0, i).every((x) => c.r[`ue_${x.index}`] === 'da');
        if (v === 'nu' && i > 0 && inainte) return `Atunci cele ${BONUS} de puncte nu se mai socotesc: se dau doar dacă toate mașinile sunt asamblate în UE.`;
        if (v === 'da' && c.rezultat.p2 > 0 && inainte) return i === 0 ? `Bun! Asta înseamnă **${BONUS} de puncte** în plus.` : null;
        return null;
      },
    },
  ];
}

export const SCENARIU: Scenariu = [
  // 0 · Salutul și CUI-ul
  {
    id: 'cui',
    tip: 'cui',
    text: 'Salut! Hai să vedem cât poate primi firma ta pentru mașini electrice. Îmi spui CUI-ul?',
    scurt: 'CUI-ul firmei',
    eticheta: 'CUI-ul firmei',
    placeholder: 'ex. RO12345678',
    buton: 'Caută',
    cautare: 'Caut firma la ANAF…',
    eroare: 'CUI-ul nu pare corect. Verifică cifrele și încearcă din nou.',
    reseteaza: ['firma', 'corectez', 'forma', 'angajati', 'cifra'],
  },

  // 1 · Firma
  {
    id: 'firma',
    tip: 'cardFirma',
    text: (c) => {
      const loc = localitate(c.firma?.adresa, c.firma?.judet);
      return `Am găsit-o: **${c.firma?.denumire || `CUI ${c.cui}`}**${loc ? `, din ${loc}` : ''}.`;
    },
    intrebare: 'Asta e firma ta?',
    scurt: 'E firma ta?',
    optiuni: [
      { valoare: 'da', eticheta: 'Da' },
      { valoare: 'corectez', eticheta: 'Nu, corectez' },
    ],
    etichete: {
      localitatea: 'Localitatea',
      categoria: 'Categoria',
      angajatii: 'Angajați',
      necunoscut: 'nu știm încă',
      neImm: 'peste pragurile IMM',
      cifre: 'Cifrele din bilanț',
      cifreAscunde: 'Ascunde cifrele',
      cifreLista: (c) => {
        const d = c.dinAnaf;
        if (!d || d.an === null) return [];
        const rand = (eticheta: string, v: number | null) => ({ eticheta, valoare: v === null || Number.isNaN(v) ? '—' : lei(v) });
        return [
          rand(`Cifra de afaceri (${d.an})`, d.ca),
          rand('Active', d.act),
          rand('Datorii', d.dat),
          rand('Capitaluri proprii', d.cap),
        ];
      },
      corecteaza: 'Nu mai sunt la zi? Corectează',
    },
    corecteaza: { raspuns: 'corectez', urmatorul: { pas: 'corectez', valoare: 'cifre' } },
  },
  {
    id: 'corectez',
    tip: 'alegere',
    cand: (c) => c.r.firma === 'corectez',
    text: 'Ce nu se potrivește?',
    scurt: 'Ce nu se potrivește',
    optiuni: [
      { valoare: 'cui', eticheta: 'Am greșit CUI-ul', actiune: { tip: 'altCui' } },
      { valoare: 'cifre', eticheta: 'Cifrele nu mai sunt la zi' },
    ],
  },
  {
    id: 'oprireFirma',
    tip: 'oprire',
    cand: (c) => c.evaluare.motive.length > 0 && c.r.corectez !== 'cifre',
    titlu: 'Din păcate, firma nu poate aplica la e-DRIVE.',
    motive: (c) => c.evaluare.motive,
    text: 'Hai să vorbim: poate găsim împreună altă finanțare potrivită.',
    butoane: [SUNA, ALT_CUI],
  },

  // Fără date de la ANAF (sau cifre vechi): întrebările minime
  {
    id: 'faraDate',
    tip: 'mesaj',
    cand: (c) => c.faraForma || c.faraCifre,
    text: (c) => {
      if (c.r.corectez === 'cifre') return 'Bine. Spune-mi cum arată firma acum și refac socoteala.';
      if (c.firma && !c.faraForma) return 'Nu găsesc bilanțul firmei la ANAF. Îmi spui tu câteva lucruri și mergem mai departe.';
      return 'Nu găsesc datele firmei acum. Îmi spui tu câteva lucruri și mergem mai departe.';
    },
  },
  {
    id: 'forma',
    tip: 'alegere',
    cand: (c) => c.faraForma,
    text: 'Ce formă juridică are firma?',
    scurt: 'Forma juridică',
    optiuni: [
      { valoare: 'soc', eticheta: 'SRL sau SA' },
      { valoare: 'pfa', eticheta: 'PFA, II sau IF' },
      { valoare: 'alta', eticheta: 'Altă formă' },
    ],
  },
  {
    id: 'angajati',
    tip: 'alegere',
    cand: (c) => c.faraCifre,
    text: 'Câți angajați are firma?',
    scurt: 'Angajați',
    // valoarea = numărul pe care îl primește motorul
    optiuni: [
      { valoare: '5', eticheta: '0–9' },
      { valoare: '30', eticheta: '10–49' },
      { valoare: '150', eticheta: '50–249' },
      { valoare: '300', eticheta: '250 sau mai mulți', raspuns: '250 sau mai mulți' },
    ],
    nota: (c) => (c.r.corectez === 'cifre' && c.dinAnaf?.ang != null && c.dinAnaf.an !== null
      ? `La ANAF, în bilanțul pe ${c.dinAnaf.an}: ${c.dinAnaf.ang} angajați.` : null),
  },
  {
    id: 'cifra',
    tip: 'alegere',
    cand: (c) => c.faraCifre,
    text: 'Cifra de afaceri de anul trecut?',
    scurt: 'Cifra de afaceri',
    // valoarea = cifra de afaceri în lei pe care o primește motorul (cu cursul implicit)
    optiuni: [
      { valoare: '2000000', eticheta: 'sub 10 mil. lei' },
      { valoare: '30000000', eticheta: '10–50 mil. lei' },
      { valoare: '150000000', eticheta: '50–250 mil. lei' },
      { valoare: '400000000', eticheta: 'peste 250 mil. lei' },
    ],
    nota: (c) => (c.r.corectez === 'cifre' && c.dinAnaf?.ca != null && c.dinAnaf.an !== null
      ? `La ANAF, pe ${c.dinAnaf.an}: ${lei(c.dinAnaf.ca)}.` : null),
  },
  {
    id: 'oprireDate',
    tip: 'oprire',
    cand: (c) => c.evaluare.motive.length > 0,
    titlu: 'Din păcate, firma nu poate aplica la e-DRIVE.',
    motive: (c) => c.evaluare.motive,
    text: 'Hai să vorbim: poate găsim împreună altă finanțare potrivită.',
    butoane: [SUNA, ALT_CUI],
  },
  {
    id: 'pornire',
    tip: 'mesaj',
    cand: (c) => c.evaluare.incadrare.status === 'imm',
    text: (c) => {
      const i = c.evaluare.incadrare;
      if (i.status !== 'imm') return null;
      return `Pornești cu **${puncte(i.puncte)}**, ${DE_CE[i.marime.nume] ?? `ca ${i.marime.nume.toLowerCase()}`}.`;
    },
  },
  {
    id: 'avertismente',
    tip: 'mesaje',
    fel: 'avertisment',
    texte: (c) => c.evaluare.avert,
  },

  // 2 · Mașinile vechi
  {
    id: 'masiniVechi',
    tip: 'mesaj',
    text: 'Acum, mașinile pe care le schimbi.',
  },
  {
    id: 'nrM1',
    tip: 'alegere',
    text: 'Câte [[autoturisme|autoturism]] pe benzină sau motorină vrei să înlocuiești?',
    scurt: 'Autoturisme de înlocuit',
    optiuni: optiuniNumar(0, CONFIG.maxVehicule, true),
  },
  {
    id: 'nrM1Multe',
    tip: 'alegere',
    cand: (c) => c.r.nrM1 === 'mai',
    text: 'Câte anume?',
    scurt: 'Câte autoturisme',
    optiuni: optiuniMulte(CONFIG.maxVehicule),
  },
  {
    id: 'nrM2',
    tip: 'alegere',
    text: 'Și câte [[microbuze|microbuz]]?',
    scurt: 'Microbuze de înlocuit',
    // în total cel puțin una și cel mult CONFIG.maxVehicule
    optiuni: (c) => {
      const n1 = numarMasini(c, 'nrM1');
      return optiuniNumar(n1 === 0 ? 1 : 0, CONFIG.maxVehicule - n1, true);
    },
  },
  {
    id: 'nrM2Multe',
    tip: 'alegere',
    cand: (c) => c.r.nrM2 === 'mai',
    text: 'Câte anume?',
    scurt: 'Câte microbuze',
    optiuni: (c) => optiuniMulte(CONFIG.maxVehicule - numarMasini(c, 'nrM1')),
  },
  {
    id: 'vechi',
    tip: 'alegere',
    text: (c) => (c.masini.length === 1
      ? 'Mașina pe care o înlocuiești e a firmei de cel puțin un an?'
      : 'Mașinile pe care le înlocuiești sunt ale firmei de cel puțin un an?'),
    scurt: 'Ale firmei de cel puțin un an',
    optiuni: [
      { valoare: 'da', eticheta: 'Da' },
      { valoare: 'nu', eticheta: 'Nu' },
    ],
  },
  {
    id: 'promisiuneExplicatie',
    tip: 'mesaj',
    cand: (c) => c.r.vechi === 'nu',
    text: 'Se poate și așa: cumperi o mașină pe benzină sau motorină cu [[promisiune notarială|promisiune]] (cu RCA și ITP valabile și anul trecut) și o treci pe firmă înainte de contractul de finanțare. Costul ei nu se decontează.',
  },
  {
    id: 'promisiune',
    tip: 'alegere',
    cand: (c) => c.r.vechi === 'nu',
    text: 'Poți face asta?',
    scurt: 'Cu promisiune notarială',
    optiuni: [
      { valoare: 'da', eticheta: 'Pot face asta' },
      { valoare: 'nu', eticheta: 'Nu' },
    ],
  },
  {
    id: 'oprireVechi',
    tip: 'oprire',
    cand: (c) => c.r.promisiune === 'nu',
    titlu: 'Fără o mașină de înlocuit nu se poate aplica.',
    motive: () => [],
    text: 'Fiecare mașină electrică nouă trebuie să înlocuiască o mașină pe benzină sau motorină a firmei. Hai să vorbim: poate găsim împreună o soluție.',
    butoane: [SUNA, { valoare: 'inapoi', eticheta: 'Schimbă răspunsul', actiune: { tip: 'inapoi', pas: 'promisiune' } }],
  },

  // 3 · Mașinile noi, pe rând
  {
    id: 'masiniNoi',
    tip: 'mesaj',
    text: (c) => {
      const m1 = c.masini.some((m) => m.cat === 'M1');
      const m2 = c.masini.some((m) => m.cat === 'M2');
      const regula = m1 && m2
        ? 'Autoturismul se înlocuiește tot cu un autoturism, iar microbuzul cu un microbuz.'
        : m1 ? 'Autoturismul se înlocuiește tot cu un autoturism.' : 'Microbuzul se înlocuiește tot cu un microbuz.';
      return `Acum, mașinile electrice noi. ${regula}`;
    },
  },
  { tip: 'pentruFiecareMasina', id: 'masina', pasi: pasiMasina },

  // 4 · Rezultatul
  { id: 'rezultat', tip: 'rezultat' },
];

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
      `Tu plătești [[TVA-ul|tva]], cam **${euro(r.tvaSuma)}**.`,
      ...(peste > 0 ? [`Plus diferența peste plafon, **${euro(peste)}**.`] : []),
    ];
  },
  bara: {
    titlu: 'Banii, pe scurt',
    finantare: 'Finanțarea',
    partea: 'Partea ta peste plafon',
    tva: `TVA-ul (${Math.round(CONFIG.tva * 100)}%)`,
    total: 'Prețul cu TVA',
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
  aplica: 'Aplică',
  aplicat: 'Am socotit toate mașinile asamblate în UE.',
  sfaturi: 'Sfaturi',
  deStiut: 'De știut',
  nota: 'Estimare orientativă după regulile e-DRIVE Măsura 1. Eligibilitatea și punctajul final le stabilește Ministerul Transporturilor și Infrastructurii.',
  trimite: 'Trimite-ne analiza',
  suna: 'Sună-ne',
  trimisa: 'Am primit analiza ta. Te sunăm noi.',
};

/** Banda de scor (fixă sus). */
export const BANDA = {
  /** banda apare după ce s-a spus acest pas */
  dupa: 'pornire',
  scor: 'Punctajul',
  din: '/100',
  eticheta: (c: Context): string | null => {
    const i = c.evaluare.incadrare;
    return i.status === 'imm' ? `${i.marime.nume} · ${puncte(i.puncte)}` : null;
  },
  bonus: (c: Context): string | null => (c.rezultat.p2 > 0 ? `+${c.rezultat.p2} pentru mașini asamblate în UE` : null),
  estimat: 'estimat',
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

/** Foaia „Trimite-ne analiza”. */
export const TRIMITERE = {
  titlu: 'Trimite-ne analiza',
  intro: 'Lasă-ne numele și telefonul. Restul pleacă automat, iar noi te sunăm.',
  nume: 'Numele tău',
  telefon: 'Telefonul',
  email: 'Emailul (opțional)',
  rezumat: 'Ce ne trimiți',
  buton: 'Trimite analiza',
  seTrimite: 'Se trimite…',
  inchide: 'Închide',
  eroareNume: 'Scrie-ți numele, ca să știm cu cine vorbim.',
  eroareTelefon: 'Scrie un număr de telefon, de exemplu 0722 123 456.',
  eroareEmail: 'Emailul nu pare corect.',
  succes: 'Am primit analiza ta. Te sunăm noi.',
};

/** Textele mărunte ale interfeței. */
export const TEXTE = {
  scrie: 'Calculatorul scrie',
  schimba: 'Schimbă răspunsul',
  reia: 'Reia de la început',
  altaSumaEroare: 'Scrie suma în euro, fără TVA.',
  glosarInchide: 'Am înțeles',
  monograma: 'DD',
  vorbitor: 'Dezvoltare digitală',
};
