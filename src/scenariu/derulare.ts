// Derularea: din scenariu + răspunsuri → drumul de ecrane (cele deja răspunse și primul fără răspuns).
// Fiecare ecran vede doar răspunsurile de dinaintea lui. Un răspuns dat rămâne cât timp e încă
// valabil (pasul mai apare și valoarea e încă printre opțiuni). Interfața arată un singur ecran
// din drum odată; „Înapoi” = ecranul de dinainte din drum. Comun tuturor calculatoarelor.

import type { FirmaAnaf } from '@/motor/anaf';
import { curataCui } from '@/motor/cui';
import {
  rezolva, rezolvaOpt,
  type CacheAnaf, type ContextBaza, type Etapa, type Optiune, type Pas, type PasAlegere, type PasCardFirma,
  type PasCui, type PasMultipla, type PasOprire, type PasSuma, type ProgresEtape, type Raspunsuri, type Scenariu,
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

interface Comun<C> {
  /** id-ul pasului (cheia ecranului) */
  cheie: string;
  etapa: Etapa;
  /** contextul de dinaintea răspunsului */
  ctx: C;
}

export type EcranCuiT<C> = Comun<C> & Texte & { tip: 'cui'; pas: PasCui<C>; raspuns: string | null; eroare: string | null };
export type EcranCautareT<C> = Comun<C> & { tip: 'cautare'; text: string };
export type EcranFirmaT<C> = Comun<C> & Texte & {
  tip: 'cardFirma'; pas: PasCardFirma<C>; firma: FirmaAnaf; optiuni: Optiune[]; raspuns: string | null;
};
export type EcranIntrebareT<C> = Comun<C> & Texte & {
  tip: 'intrebare'; pas: PasAlegere<C> | PasSuma<C> | PasMultipla<C>; optiuni: Optiune[];
  /** răspunsul dat (valoarea) și cum se citește */
  raspuns: string | null; raspunsText: string | null;
};
export type EcranOprireT<C> = Comun<C> & { tip: 'oprire'; pas: PasOprire<C>; titlu: string; motive: string[]; text: string };
export type EcranRezultatT<C> = Comun<C> & { tip: 'rezultat' };

export type Ecran<C = ContextBaza> =
  | EcranCuiT<C> | EcranCautareT<C> | EcranFirmaT<C> | EcranIntrebareT<C> | EcranOprireT<C> | EcranRezultatT<C>;

export interface Derulare<C extends ContextBaza = ContextBaza> {
  /** drumul: ecranele în ordine; ultimul e cel care așteaptă (sau capătul) */
  ecrane: Ecran<C>[];
  /** contextul cu toate răspunsurile acceptate */
  ctx: C;
  /** se caută firma la ANAF pentru acest CUI */
  cauta: string | null;
  /** s-a ajuns la un capăt (rezultat sau oprire) */
  gata: boolean;
  /** răspunsurile acceptate (cele încă valabile) */
  acceptate: Raspunsuri;
  scenariu: Scenariu<C>;
}

function texte<C>(p: PasCui<C> | PasCardFirma<C> | PasAlegere<C> | PasSuma<C> | PasMultipla<C>, c: C): Texte {
  return {
    ecou: rezolvaOpt(p.ecou, c),
    eticheta: rezolvaOpt(p.eticheta, c),
    text: rezolva(p.text, c),
    explicatie: rezolvaOpt(p.explicatie, c),
    antrenor: rezolvaOpt(p.antrenor, c),
    nota: rezolvaOpt(p.nota, c),
  };
}

/** „~25000” (valoare rotundă), „25000” (exactă). */
export function sumaDin(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v.replace(/^~/, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Valorile alese la o alegere multiplă („verde,alte” → ['verde', 'alte']). */
export function alese(v: string | undefined): string[] {
  return v ? v.split(',').filter(Boolean) : [];
}

export function deruleaza<C extends ContextBaza>(scenariu: Scenariu<C>, r: Raspunsuri, cache: CacheAnaf): Derulare<C> {
  const ecrane: Ecran<C>[] = [];
  const acc: Raspunsuri = {};
  let ctx = scenariu.context(acc, cache);
  let cauta: string | null = null;
  let gata = false;

  const accepta = (id: string, v: string) => {
    acc[id] = v;
    ctx = scenariu.context(acc, cache);
  };

  /** true = mergem mai departe; false = aici se oprește drumul */
  const proceseaza = (p: Pas<C>): boolean => {
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
      case 'multipla':
      case 'suma': {
        const optiuni = typeof p.optiuni === 'function' ? p.optiuni(ctx) : p.optiuni;
        const v = r[p.id];
        let raspunsText: string | null = null;
        if (v !== undefined) {
          if (p.tip === 'alegere') {
            const o = optiuni.find((x) => x.valoare === v && !x.actiune);
            if (o) raspunsText = o.raspuns ?? o.eticheta;
          } else if (p.tip === 'multipla') {
            const lista = alese(v).map((a) => optiuni.find((x) => x.valoare === a));
            if (lista.length && lista.every((o) => o)) raspunsText = lista.map((o) => o?.raspuns ?? o?.eticheta).join(', ');
          } else if (v === 'aceeasi' ? optiuni.some((o) => o.valoare === 'aceeasi') : sumaDin(v) !== null) {
            raspunsText = p.raspuns(v, ctx);
          }
        }
        const raspuns = raspunsText === null ? null : (v as string);
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

  parcurge: for (const p of scenariu.pasi) {
    if (p.tip === 'grup') {
      for (const pg of p.pasi(ctx)) if (!proceseaza(pg)) break parcurge;
      continue;
    }
    if (!proceseaza(p)) break;
  }

  return { ecrane, ctx, cauta, gata, acceptate: acc, scenariu };
}

/** Ecranul de după `cheie` în drum (sau ultimul, dacă `cheie` nu mai e în drum). */
export function urmatorul<C extends ContextBaza>(d: Derulare<C>, cheie: string): Ecran<C> {
  const i = d.ecrane.findIndex((e) => e.cheie === cheie);
  return d.ecrane[i >= 0 && i + 1 < d.ecrane.length ? i + 1 : d.ecrane.length - 1];
}

/** Ecranul de dinainte în drum (fără starea de căutare), sau null pe primul ecran. */
export function anteriorul<C extends ContextBaza>(d: Derulare<C>, cheie: string): Ecran<C> | null {
  const i = d.ecrane.findIndex((e) => e.cheie === cheie);
  for (let k = (i < 0 ? d.ecrane.length - 1 : i) - 1; k >= 0; k--) {
    if (d.ecrane[k].tip !== 'cautare') return d.ecrane[k];
  }
  return null;
}

/** Ecranul afișat: cel cerut, dacă e încă în drum; altfel ultimul din drum. */
export function ecranul<C extends ContextBaza>(d: Derulare<C>, cheie: string | null): Ecran<C> {
  return (cheie && d.ecrane.find((e) => e.cheie === cheie)) || d.ecrane[d.ecrane.length - 1];
}

/** Câte întrebări are fiecare etapă în drum și câte au răspuns (pentru progres). */
export function progresEtape<C extends ContextBaza>(d: Derulare<C>): ProgresEtape {
  const p: ProgresEtape = {};
  for (const e of d.scenariu.etape) p[e.cheie] = { total: 0, raspunse: 0 };
  for (const e of d.ecrane) {
    if (e.tip === 'cui' || e.tip === 'cardFirma' || e.tip === 'intrebare') {
      p[e.etapa].total++;
      if (e.raspuns !== null) p[e.etapa].raspunse++;
    }
  }
  // Estimările pentru ce n-am văzut încă (din scenariu).
  for (const [k, n] of Object.entries(d.scenariu.estimari(d.ctx, d.acceptate))) {
    if (p[k] && n !== undefined) p[k].total = Math.max(p[k].total, n);
  }
  return p;
}

/** Cât din linia progresului e plină: fiecare etapă de întrebări are o parte egală. */
export function umplere<C extends ContextBaza>(d: Derulare<C>, e: Ecran<C>): number {
  if (e.tip === 'rezultat') return 1;
  const p = progresEtape(d);
  const etape = d.scenariu.etape.slice(0, -1);
  const parte = (k: Etapa) => (p[k].total ? p[k].raspunse / p[k].total : 0);
  return etape.reduce((s, x) => s + parte(x.cheie), 0) / etape.length;
}
