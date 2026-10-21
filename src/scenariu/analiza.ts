// Analiza e-DRIVE care pleacă la contact@dezvoltaredigitala.ro (trimiterea reală: task separat).
// `raspunsuriDin` e comun tuturor calculatoarelor.

import type { Context } from './context';
import type { Derulare, Ecran } from './derulare';
import { localitate } from './format';
import type { Contact } from './program';
import { faraMarcaje } from './text';

export type { Contact };

export interface Analiza {
  program: 'e-DRIVE';
  creata: string;
  firma: {
    cui: string | null;
    denumire: string | null;
    localitate: string | null;
    caen: string | null;
    categorie: string | null;
    /** de unde vin cifrele de mărime */
    sursa: 'ANAF' | 'răspunsurile omului';
  };
  raspunsuri: { intrebare: string; raspuns: string }[];
  masini: { categorie: 'M1' | 'M2'; pretFaraTva: number | null; asamblataUE: boolean }[];
  rezultat: {
    status: 'ok' | 'incomplet' | 'neeligibil';
    punctaj: number;
    puncteMarime: number;
    bonusUE: number;
    finantare: number;
    pretFaraTva: number;
    tva: number;
    partePestePlafon: number;
    platestiFirma: number;
    motive: string[];
    deStiut: string[];
    sfaturi: string[];
  };
  contact: Contact;
}

export interface StareConversatie {
  derulare: Derulare<Context>;
  contact: Contact;
  acum?: Date;
}

/** Întrebările din drum și răspunsurile date, ca text. */
export function raspunsuriDin<C>(ecrane: Ecran<C>[]): { intrebare: string; raspuns: string }[] {
  const raspunsuri: { intrebare: string; raspuns: string }[] = [];
  for (const e of ecrane) {
    if (e.tip === 'cui' && e.raspuns) raspunsuri.push({ intrebare: faraMarcaje(e.text), raspuns: e.raspuns });
    if (e.tip === 'cardFirma' && e.raspuns) {
      const o = e.optiuni.find((x) => x.valoare === e.raspuns);
      raspunsuri.push({ intrebare: faraMarcaje(e.text), raspuns: o?.raspuns ?? o?.eticheta ?? e.raspuns });
    }
    if (e.tip === 'intrebare' && e.raspunsText) {
      const intrebare = [e.eticheta, faraMarcaje(e.text)].filter(Boolean).join(': ');
      raspunsuri.push({ intrebare, raspuns: e.raspunsText });
    }
  }
  return raspunsuri;
}

export function construiesteAnaliza({ derulare, contact, acum = new Date() }: StareConversatie): Analiza {
  const { ctx, ecrane } = derulare;
  const r = ctx.rezultat;
  const raspunsuri = raspunsuriDin(ecrane);
  return {
    program: 'e-DRIVE',
    creata: acum.toISOString(),
    firma: {
      cui: ctx.cui,
      denumire: ctx.firma?.denumire ?? null,
      localitate: ctx.firma ? localitate(ctx.firma.adresa, ctx.firma.judet) || null : null,
      caen: ctx.date.caen || null,
      categorie: r.marime?.nume ?? null,
      sursa: ctx.estimat ? 'răspunsurile omului' : 'ANAF',
    },
    raspunsuri,
    masini: ctx.masini.map((m, i) => ({
      categorie: m.cat,
      pretFaraTva: ctx.preturi[i],
      asamblataUE: ctx.r[`ue_${i}`] === 'da',
    })),
    rezultat: {
      status: r.status,
      punctaj: r.total,
      puncteMarime: r.p1,
      bonusUE: r.p2,
      finantare: r.ajutor,
      pretFaraTva: r.fara,
      tva: r.tvaSuma,
      partePestePlafon: r.fara - r.ajutor,
      platestiFirma: r.platesti,
      motive: r.motive,
      deStiut: r.avert,
      sfaturi: r.tips.map((t) => t.text),
    },
    contact: { nume: contact.nume.trim(), telefon: contact.telefon.trim(), email: contact.email.trim() },
  };
}

