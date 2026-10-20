// Derularea: din scenariu + răspunsuri → firul conversației (ce s-a spus până acum și întrebarea activă).
// Pașii se parcurg în ordine; fiecare pas vede doar răspunsurile de dinaintea lui. Un răspuns dat
// rămâne cât timp e încă valabil (pasul mai apare și valoarea e încă printre opțiuni).

import type { FirmaAnaf } from '@/motor/edrive/anaf';
import { curataCui } from '@/motor/edrive/cui';
import { contextDin, pretDin, type CacheAnaf, type Context, type Raspunsuri } from './context';
import {
  rezolva, rezolvaOpt,
  type FelMesaj, type Optiune, type Pas, type PasAlegere, type PasCardFirma, type PasCui, type PasOprire,
  type PasSuma, type Scenariu,
} from './tipuri';

export type Element =
  | { tip: 'mesaj'; cheie: string; text: string; fel: FelMesaj }
  | { tip: 'cui'; cheie: string; pas: PasCui; text: string; scurt: string; raspuns: string | null; eroare: string | null }
  | { tip: 'cautare'; cheie: string; text: string }
  | {
      tip: 'cardFirma'; cheie: string; pas: PasCardFirma; firma: FirmaAnaf; intrebare: string; scurt: string;
      optiuni: Optiune[]; raspuns: Optiune | null; ctx: Context;
    }
  | {
      tip: 'intrebare'; cheie: string; pas: PasAlegere | PasSuma; eticheta: string | null; text: string;
      scurt: string; nota: string | null; optiuni: Optiune[]; raspuns: { valoare: string; eticheta: string } | null;
    }
  | { tip: 'oprire'; cheie: string; pas: PasOprire; titlu: string; motive: string[]; text: string }
  | { tip: 'rezultat'; cheie: string };

export interface Derulare {
  elemente: Element[];
  /** contextul cu toate răspunsurile acceptate */
  ctx: Context;
  /** id-ul pasului care așteaptă răspuns (null dacă nu așteaptă nimic de la om) */
  activ: string | null;
  /** se caută firma la ANAF pentru acest CUI */
  cauta: string | null;
  /** s-a ajuns la un capăt (rezultat sau oprire) */
  gata: boolean;
  /** răspunsurile acceptate (cele încă valabile) */
  acceptate: Raspunsuri;
}

function optiuniDin(p: PasAlegere | PasSuma, c: Context): Optiune[] {
  return typeof p.optiuni === 'function' ? p.optiuni(c) : p.optiuni;
}

export function deruleaza(scenariu: Scenariu, r: Raspunsuri, cache: CacheAnaf): Derulare {
  const elemente: Element[] = [];
  const acc: Raspunsuri = {};
  let ctx = contextDin(acc, cache);
  let activ: string | null = null;
  let cauta: string | null = null;
  let gata = false;

  const accepta = (id: string, v: string) => {
    acc[id] = v;
    ctx = contextDin(acc, cache);
  };

  /** true = mergem mai departe; false = ne oprim aici */
  const proceseaza = (p: Pas): boolean => {
    if (p.cand && !p.cand(ctx)) return true;
    switch (p.tip) {
      case 'mesaj': {
        const text = rezolvaOpt(p.text, ctx);
        if (text) elemente.push({ tip: 'mesaj', cheie: p.id, text, fel: p.fel ?? 'normal' });
        return true;
      }
      case 'mesaje': {
        p.texte(ctx).forEach((text, k) => elemente.push({ tip: 'mesaj', cheie: `${p.id}:${k}`, text, fel: p.fel ?? 'normal' }));
        return true;
      }
      case 'cui': {
        const v = r[p.id];
        const cui = curataCui(v);
        const raspunsAnaf = cui ? cache[cui] : undefined;
        const invalid = v !== undefined && (!cui || (raspunsAnaf && !raspunsAnaf.ok && raspunsAnaf.cod === 'cui_invalid'));
        if (!cui || invalid) {
          elemente.push({ tip: 'cui', cheie: p.id, pas: p, text: rezolva(p.text, ctx), scurt: rezolva(p.scurt, ctx), raspuns: null, eroare: invalid ? p.eroare : null });
          activ = p.id;
          return false;
        }
        accepta(p.id, cui);
        elemente.push({ tip: 'cui', cheie: p.id, pas: p, text: rezolva(p.text, ctx), scurt: rezolva(p.scurt, ctx), raspuns: cui, eroare: null });
        if (raspunsAnaf === undefined) {
          elemente.push({ tip: 'cautare', cheie: `${p.id}:cautare`, text: p.cautare });
          cauta = cui;
          return false;
        }
        return true;
      }
      case 'cardFirma': {
        if (!ctx.firma) return true;
        elemente.push({ tip: 'mesaj', cheie: `${p.id}:intro`, text: rezolva(p.text, ctx), fel: 'normal' });
        const v = r[p.id];
        const ales = p.optiuni.find((o) => o.valoare === v && !o.actiune) ?? null;
        elemente.push({
          tip: 'cardFirma', cheie: p.id, pas: p, firma: ctx.firma, intrebare: rezolva(p.intrebare, ctx),
          scurt: rezolva(p.scurt, ctx), optiuni: p.optiuni, raspuns: ales, ctx,
        });
        if (!ales) {
          activ = p.id;
          return false;
        }
        accepta(p.id, ales.valoare);
        return true;
      }
      case 'alegere':
      case 'suma': {
        const optiuni = optiuniDin(p, ctx);
        const v = r[p.id];
        let raspuns: { valoare: string; eticheta: string } | null = null;
        if (v !== undefined) {
          if (p.tip === 'alegere') {
            const o = optiuni.find((x) => x.valoare === v && !x.actiune);
            if (o) raspuns = { valoare: v, eticheta: o.raspuns ?? o.eticheta };
          } else if (v === 'aceeasi' ? optiuni.some((o) => o.valoare === 'aceeasi') : pretDin(v) !== null) {
            raspuns = { valoare: v, eticheta: p.raspuns(v, ctx) };
          }
        }
        const antrenor = rezolvaOpt(p.tip === 'alegere' ? p.antrenor : undefined, ctx);
        if (antrenor) elemente.push({ tip: 'mesaj', cheie: `${p.id}:antrenor`, text: antrenor, fel: 'antrenor' });
        elemente.push({
          tip: 'intrebare', cheie: p.id, pas: p, eticheta: rezolvaOpt(p.eticheta, ctx), text: rezolva(p.text, ctx),
          scurt: rezolva(p.scurt, ctx), nota: rezolvaOpt(p.nota, ctx), optiuni, raspuns,
        });
        if (!raspuns) {
          activ = p.id;
          return false;
        }
        accepta(p.id, raspuns.valoare);
        const reactie = p.reactie?.(raspuns.valoare, ctx);
        if (reactie) elemente.push({ tip: 'mesaj', cheie: `${p.id}:reactie`, text: reactie, fel: 'normal' });
        return true;
      }
      case 'oprire': {
        elemente.push({ tip: 'oprire', cheie: p.id, pas: p, titlu: rezolva(p.titlu, ctx), motive: p.motive(ctx), text: rezolva(p.text, ctx) });
        gata = true;
        return false;
      }
      case 'rezultat': {
        elemente.push({ tip: 'rezultat', cheie: p.id });
        gata = true;
        return false;
      }
    }
  };

  parcurge: for (const p of scenariu) {
    if (p.tip === 'pentruFiecareMasina') {
      for (const m of ctx.masini) {
        for (const pm of p.pasi(m)) if (!proceseaza(pm)) break parcurge;
      }
      continue;
    }
    if (!proceseaza(p)) break;
  }

  return { elemente, ctx, activ, cauta, gata, acceptate: acc };
}
