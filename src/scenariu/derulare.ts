// Derularea: din scenariu + răspunsuri → drumul de ecrane (cele deja răspunse și primul fără răspuns).
// Fiecare ecran vede doar răspunsurile de dinaintea lui. Un răspuns dat rămâne cât timp e încă
// valabil (pasul mai apare și valoarea e încă printre opțiuni). Interfața arată un singur ecran
// din drum odată; „Înapoi” = ecranul de dinainte din drum.

import type { FirmaAnaf } from '@/motor/edrive/anaf';
import { curataCui } from '@/motor/edrive/cui';
import { contextDin, numarMasini, pretDin, type CacheAnaf, type Context, type Raspunsuri } from './context';
import {
  rezolva, rezolvaOpt,
  type Etapa, type Optiune, type Pas, type PasAlegere, type PasCardFirma, type PasCui, type PasOprire,
  type PasSuma, type Scenariu,
} from './tipuri';

/** Textele comune unui ecran de întrebare, deja rezolvate. */
export interface Texte {
  ecou: string | null;
  eticheta: string | null;
  text: string;
  explicatie: string | null;
  antrenor: string | null;
  nota: string | null;
}

interface Comun {
  /** id-ul pasului (cheia ecranului) */
  cheie: string;
  etapa: Etapa;
  /** contextul de dinaintea răspunsului */
  ctx: Context;
}

export type Ecran =
  | (Comun & Texte & { tip: 'cui'; pas: PasCui; raspuns: string | null; eroare: string | null })
  | (Comun & { tip: 'cautare'; text: string })
  | (Comun & Texte & { tip: 'cardFirma'; pas: PasCardFirma; firma: FirmaAnaf; optiuni: Optiune[]; raspuns: string | null })
  | (Comun & Texte & {
      tip: 'intrebare'; pas: PasAlegere | PasSuma; optiuni: Optiune[];
      /** răspunsul dat (valoarea) și cum se citește */
      raspuns: string | null; raspunsText: string | null;
    })
  | (Comun & { tip: 'oprire'; pas: PasOprire; titlu: string; motive: string[]; text: string })
  | (Comun & { tip: 'rezultat' });

export interface Derulare {
  /** drumul: ecranele în ordine; ultimul e cel care așteaptă (sau capătul) */
  ecrane: Ecran[];
  /** contextul cu toate răspunsurile acceptate */
  ctx: Context;
  /** se caută firma la ANAF pentru acest CUI */
  cauta: string | null;
  /** s-a ajuns la un capăt (rezultat sau oprire) */
  gata: boolean;
  /** răspunsurile acceptate (cele încă valabile) */
  acceptate: Raspunsuri;
}

function texte(p: PasCui | PasCardFirma | PasAlegere | PasSuma, c: Context): Texte {
  return {
    ecou: rezolvaOpt(p.ecou, c),
    eticheta: rezolvaOpt(p.eticheta, c),
    text: rezolva(p.text, c),
    explicatie: rezolvaOpt(p.explicatie, c),
    antrenor: rezolvaOpt(p.antrenor, c),
    nota: rezolvaOpt(p.nota, c),
  };
}

export function deruleaza(scenariu: Scenariu, r: Raspunsuri, cache: CacheAnaf): Derulare {
  const ecrane: Ecran[] = [];
  const acc: Raspunsuri = {};
  let ctx = contextDin(acc, cache);
  let cauta: string | null = null;
  let gata = false;

  const accepta = (id: string, v: string) => {
    acc[id] = v;
    ctx = contextDin(acc, cache);
  };

  /** true = mergem mai departe; false = aici se oprește drumul */
  const proceseaza = (p: Pas): boolean => {
    if (p.cand && !p.cand(ctx)) return true;
    const comun = { cheie: p.id, etapa: p.etapa, ctx };
    switch (p.tip) {
      case 'cui': {
        const v = r[p.id];
        const cui = curataCui(v);
        const raspunsAnaf = cui ? cache[cui] : undefined;
        const invalid = v !== undefined && (!cui || (!!raspunsAnaf && !raspunsAnaf.ok && raspunsAnaf.cod === 'cui_invalid'));
        if (!cui || invalid) {
          ecrane.push({ ...comun, ...texte(p, ctx), tip: 'cui', pas: p, raspuns: null, eroare: invalid ? p.eroare : null });
          return false;
        }
        ecrane.push({ ...comun, ...texte(p, ctx), tip: 'cui', pas: p, raspuns: cui, eroare: null });
        accepta(p.id, cui);
        if (raspunsAnaf === undefined) {
          ecrane.push({ cheie: `${p.id}:cautare`, etapa: p.etapa, ctx, tip: 'cautare', text: p.cautare });
          cauta = cui;
          return false;
        }
        return true;
      }
      case 'cardFirma': {
        if (!ctx.firma) return true;
        const v = r[p.id];
        const ales = p.optiuni.find((o) => o.valoare === v && !o.actiune) ?? null;
        ecrane.push({ ...comun, ...texte(p, ctx), tip: 'cardFirma', pas: p, firma: ctx.firma, optiuni: p.optiuni, raspuns: ales?.valoare ?? null });
        if (!ales) return false;
        accepta(p.id, ales.valoare);
        return true;
      }
      case 'alegere':
      case 'suma': {
        const optiuni = typeof p.optiuni === 'function' ? p.optiuni(ctx) : p.optiuni;
        const v = r[p.id];
        let raspunsText: string | null = null;
        if (v !== undefined) {
          if (p.tip === 'alegere') {
            const o = optiuni.find((x) => x.valoare === v && !x.actiune);
            if (o) raspunsText = o.raspuns ?? o.eticheta;
          } else if (v === 'aceeasi' ? optiuni.some((o) => o.valoare === 'aceeasi') : pretDin(v) !== null) {
            raspunsText = p.raspuns(v, ctx);
          }
        }
        const raspuns = raspunsText === null ? null : v;
        ecrane.push({ ...comun, ...texte(p, ctx), tip: 'intrebare', pas: p, optiuni, raspuns, raspunsText });
        if (raspuns === null) return false;
        accepta(p.id, raspuns);
        return true;
      }
      case 'oprire': {
        ecrane.push({ ...comun, tip: 'oprire', pas: p, titlu: rezolva(p.titlu, ctx), motive: p.motive(ctx), text: rezolva(p.text, ctx) });
        gata = true;
        return false;
      }
      case 'rezultat': {
        ecrane.push({ ...comun, tip: 'rezultat' });
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

  return { ecrane, ctx, cauta, gata, acceptate: acc };
}

/** Ecranul de după `cheie` în drum (sau ultimul, dacă `cheie` nu mai e în drum). */
export function urmatorul(d: Derulare, cheie: string): Ecran {
  const i = d.ecrane.findIndex((e) => e.cheie === cheie);
  return d.ecrane[i >= 0 && i + 1 < d.ecrane.length ? i + 1 : d.ecrane.length - 1];
}

/** Ecranul de dinainte în drum (fără starea de căutare), sau null pe primul ecran. */
export function anteriorul(d: Derulare, cheie: string): Ecran | null {
  const i = d.ecrane.findIndex((e) => e.cheie === cheie);
  for (let k = (i < 0 ? d.ecrane.length - 1 : i) - 1; k >= 0; k--) {
    if (d.ecrane[k].tip !== 'cautare') return d.ecrane[k];
  }
  return null;
}

/** Ecranul afișat: cel cerut, dacă e încă în drum; altfel ultimul din drum. */
export function ecranul(d: Derulare, cheie: string | null): Ecran {
  return (cheie && d.ecrane.find((e) => e.cheie === cheie)) || d.ecrane[d.ecrane.length - 1];
}

/** Câte întrebări are fiecare etapă în drum și câte au răspuns (pentru progres). */
export function progresEtape(d: Derulare): Record<Etapa, { total: number; raspunse: number }> {
  const p: Record<Etapa, { total: number; raspunse: number }> = {
    firma: { total: 0, raspunse: 0 }, masini: { total: 0, raspunse: 0 }, pret: { total: 0, raspunse: 0 }, rezultat: { total: 0, raspunse: 0 },
  };
  for (const e of d.ecrane) {
    if (e.tip === 'cui' || e.tip === 'cardFirma' || e.tip === 'intrebare') {
      p[e.etapa].total++;
      if (e.raspuns !== null) p[e.etapa].raspunse++;
    }
  }
  // Estimările pentru ce n-am văzut încă: firma = CUI + confirmarea; mașinile = câte, ce fel,
  // de cât timp; prețul = 2 întrebări pe mașină (1 mașină cât nu știm câte).
  p.firma.total = Math.max(p.firma.total, 2);
  p.masini.total = Math.max(p.masini.total, 3);
  p.pret.total = Math.max(p.pret.total, 2 * Math.max(1, d.ctx.masini.length || numarMasini(d.acceptate)));
  return p;
}
