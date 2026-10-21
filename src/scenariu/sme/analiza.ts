// Analiza SME Eco-Tech care pleacă la contact@dezvoltaredigitala.ro (trimiterea reală: task separat).

import { pct } from '@/motor/sme/calc';
import { raspunsuriDin } from '../analiza';
import type { Derulare } from '../derulare';
import { localitate } from '../format';
import type { Contact } from '../program';
import type { ContextSme } from './context';

export interface AnalizaSme {
  program: 'SME Eco-Tech';
  creata: string;
  firma: {
    cui: string | null;
    denumire: string | null;
    localitate: string | null;
    caen: string | null;
    categorie: string | null;
    infiintata: string | null;
    cifraAfaceri2024: number | null;
    /** de unde vin datele firmei */
    sursa: 'ANAF' | 'răspunsurile omului';
  };
  raspunsuri: { intrebare: string; raspuns: string }[];
  /** ce cumpără, în lei fără TVA (null = nu cumpără) */
  cumperi: { echipamenteVerzi: number | null; alteEchipamente: number | null; software: number | null };
  rezultat: {
    status: 'ok' | 'incomplet' | 'neeligibil' | 'proiect';
    investitieEligibila: number;
    grant: number;
    credit: number;
    tva: number;
    softwareNedecontat: number;
    platestiTu: number;
    /** procente, o zecimală */
    parteaVerde: number;
    echipamenteVerziRecomandate: number | null;
    motive: string[];
    probleme: string[];
    deStiut: string[];
    sfaturi: string[];
  };
  contact: Contact;
}

export function construiesteAnalizaSme(
  { derulare, contact, acum = new Date() }: { derulare: Derulare<ContextSme>; contact: Contact; acum?: Date },
): AnalizaSme {
  const { ctx } = derulare;
  const r = ctx.rezultat;
  const d = ctx.date;
  return {
    program: 'SME Eco-Tech',
    creata: acum.toISOString(),
    firma: {
      cui: ctx.cui,
      denumire: ctx.firma?.denumire ?? null,
      localitate: ctx.firma ? localitate(ctx.firma.adresa, ctx.firma.judet) || null : null,
      caen: d.caen || null,
      categorie: r.marime?.nume ?? null,
      infiintata: d.data || null,
      cifraAfaceri2024: d.ca24,
      sursa: ctx.estimat ? 'răspunsurile omului' : 'ANAF',
    },
    raspunsuri: raspunsuriDin(derulare.ecrane),
    cumperi: { echipamenteVerzi: d.verde, alteEchipamente: d.alte, software: d.soft },
    rezultat: {
      status: r.status,
      investitieEligibila: r.total,
      grant: r.grant,
      credit: r.credit,
      tva: r.tvaSuma,
      softwareNedecontat: r.nedecontat,
      platestiTu: r.proprii,
      parteaVerde: pct(r.verdePct),
      echipamenteVerziRecomandate: r.verdeNou,
      motive: r.motive,
      probleme: r.probleme,
      deStiut: r.avert,
      sfaturi: r.tips.map((t) => t.text),
    },
    contact: { nume: contact.nume.trim(), telefon: contact.telefon.trim(), email: contact.email.trim() },
  };
}
