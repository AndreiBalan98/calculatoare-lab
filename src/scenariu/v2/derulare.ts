// Derularea variantei 2: din răspunsuri → drumul de ecrane. Partea de firmă (CUI, căutarea, firma,
// „Ce nu se potrivește?”, F1–F5, oprirea) vine din derularea v1 (aceleași reguli și texte); apoi
// pașii v2, fiecare cu răspunsul lui citit din cheile v1. Ca în v1: un răspuns rămâne cât timp e
// încă valabil, iar drumul se oprește la primul pas fără răspuns.

import { raspunde } from '../actiuni';
import { deruleaza, type Ecran } from '../derulare';
import { rezolva, rezolvaOpt, type CacheAnaf, type ContextBaza, type Raspunsuri } from '../tipuri';
import type { DerulareV2, EcranV2, PasV2, ProgramV2, Valori } from './tipuri';

/** Un ecran de alegere din v1 (F1–F5, „Ce nu se potrivește?”), ca pas v2 cu butoane. */
function alegereDinV1<C extends ContextBaza>(p: ProgramV2<C>, e: Extract<Ecran<C>, { tip: 'intrebare' }>): PasV2<C> {
  return {
    tip: 'intrebare',
    id: e.cheie,
    text: e.text,
    // v1 avea ecoul (linia aurie) deasupra întrebării; aici e șoapta din card
    explicatie: e.explicatie ?? e.nota ?? undefined,
    control: { tip: 'alegere', optiuni: () => e.optiuni },
    citeste: () => (e.raspuns === null ? null : { v: e.raspuns }),
    scrie: (r, v) => raspunde(p.v1.scenariu, r, e.cheie, v.v),
    soapta: () => (e.ecou ? { text: e.ecou } : null),
  };
}

/** E2 · „E firma ta?” (aceleași valori ca v1). */
function firma<C extends ContextBaza>(p: ProgramV2<C>, e: Extract<Ecran<C>, { tip: 'cardFirma' }>): PasV2<C> {
  return {
    tip: 'intrebare',
    id: e.cheie,
    text: p.firma.text,
    control: { tip: 'alegere', optiuni: () => p.firma.optiuni },
    citeste: () => (e.raspuns === null ? null : { v: e.raspuns }),
    scrie: (r, v) => raspunde(p.v1.scenariu, r, e.cheie, v.v),
  };
}

const intrebare = <C>(pas: PasV2<C>, ctx: C, raspuns: Valori | null, blocat = false, partial: Valori | null = null): EcranV2<C> => ({
  tip: 'intrebare', cheie: pas.id, ctx, pas, text: rezolva(pas.text, ctx), explicatie: rezolvaOpt(pas.explicatie, ctx), raspuns, partial, blocat,
});

export function deruleazaV2<C extends ContextBaza>(p: ProgramV2<C>, r: Raspunsuri, cache: CacheAnaf): DerulareV2<C> {
  const s1 = p.v1.scenariu;
  const d1 = deruleaza(s1, r, cache);
  const ecrane: EcranV2<C>[] = [];
  const rezumat: DerulareV2<C>['rezumat'] = [];
  let gata = d1.gata;

  // 1. Firma, din v1 (etapa „firma”): până la primul ecran din altă etapă.
  const firmaGata = d1.ecrane.some((e) => e.etapa !== 'firma');
  let acc: Raspunsuri = {};
  for (const e of d1.ecrane) {
    if (e.etapa !== 'firma') break;
    switch (e.tip) {
      case 'cui':
        ecrane.push({ tip: 'cui', cheie: e.cheie, ctx: e.ctx, pas: e.pas, text: p.cui.text, eroare: e.eroare, raspuns: e.raspuns });
        break;
      case 'cautare':
        ecrane.push({ tip: 'cautare', cheie: e.cheie, ctx: e.ctx, pas: (ecrane[0] as Extract<EcranV2<C>, { tip: 'cui' }>).pas, text: p.cui.cautare });
        break;
      case 'cardFirma':
        ecrane.push(intrebare(firma(p, e), e.ctx, e.raspuns === null ? null : { v: e.raspuns }));
        break;
      case 'intrebare':
        ecrane.push(intrebare(alegereDinV1(p, e), e.ctx, e.raspuns === null ? null : { v: e.raspuns }));
        break;
      case 'oprire':
        ecrane.push({ tip: 'oprire', cheie: e.cheie, ctx: e.ctx, pas: e.pas, titlu: e.titlu, motive: e.motive, text: e.text });
        break;
      case 'rezultat':
        break;
    }
    if (e.cheie in d1.acceptate) acc[e.cheie] = d1.acceptate[e.cheie];
  }

  let ctx = firmaGata ? s1.context(acc, cache) : d1.ctx;

  // 2. Pașii v2, după firmă.
  if (firmaGata) {
    gata = false;
    for (const pas of p.pasi) {
      if (pas.tip === 'rezultat') {
        ecrane.push({ tip: 'rezultat', cheie: pas.id, ctx });
        gata = true;
        break;
      }
      if (pas.cand && !pas.cand(ctx)) continue;
      if (pas.tip === 'oprire') {
        ecrane.push({ tip: 'oprire', cheie: pas.id, ctx, pas, titlu: rezolva(pas.titlu, ctx), motive: pas.motive(ctx), text: rezolva(pas.text, ctx) });
        gata = true;
        break;
      }
      const v = pas.citeste(r, ctx);
      if (!v) {
        ecrane.push(intrebare(pas, ctx, null, false, pas.partial?.(r, ctx) ?? null));
        break;
      }
      const acc2 = pas.scrie(acc, v, ctx);
      const ctx2 = s1.context(acc2, cache);
      if (pas.blocheaza?.(ctx2)) {
        ecrane.push(intrebare(pas, ctx, v, true));
        break;
      }
      ecrane.push(intrebare(pas, ctx, v));
      acc = acc2;
      ctx = ctx2;
      for (const text of pas.rezumat?.(v, ctx) ?? []) rezumat.push({ pas: pas.id, text });
    }
  }

  // Linia de progres: întrebările cu răspuns din câte estimăm.
  const intrebari = ecrane.filter((e) => e.tip === 'cui' || e.tip === 'intrebare');
  const raspunse = intrebari.filter((e) => (e.tip === 'cui' ? e.raspuns !== null : e.raspuns !== null && !e.blocat)).length;
  const ultimul = ecrane[ecrane.length - 1];
  const umplere = ultimul?.tip === 'rezultat' ? 1 : raspunse / Math.max(intrebari.length, p.estimare(ctx), 1);

  return { ecrane, ctx, acceptate: acc, cauta: d1.cauta, gata, umplere, rezumat: p.rezumat ? p.rezumat(rezumat, ctx) : rezumat };
}

/** Ecranul de după `cheie` în drum (sau ultimul). */
export function urmatorulV2<C extends ContextBaza>(d: DerulareV2<C>, cheie: string): EcranV2<C> {
  const i = d.ecrane.findIndex((e) => e.cheie === cheie);
  return d.ecrane[i >= 0 && i + 1 < d.ecrane.length ? i + 1 : d.ecrane.length - 1];
}

/** Ecranul de dinainte în drum (fără starea de căutare), sau null pe primul ecran. */
export function anteriorulV2<C extends ContextBaza>(d: DerulareV2<C>, cheie: string): EcranV2<C> | null {
  const i = d.ecrane.findIndex((e) => e.cheie === cheie);
  for (let k = (i < 0 ? d.ecrane.length - 1 : i) - 1; k >= 0; k--) {
    if (d.ecrane[k].tip !== 'cautare') return d.ecrane[k];
  }
  return null;
}

/** Ecranul afișat: cel cerut, dacă e încă în drum; altfel ultimul din drum. */
export function ecranulV2<C extends ContextBaza>(d: DerulareV2<C>, cheie: string | null): EcranV2<C> {
  return (cheie && d.ecrane.find((e) => e.cheie === cheie)) || d.ecrane[d.ecrane.length - 1];
}

/**
 * Contextul cu valorile de pe controale (în timp ce omul trage / apasă), fără să le accepte:
 * răspunsurile acceptate + valorile ecranului, prin contextul v1. Motorul dă cifrele.
 */
export function contextProvizoriu<C extends ContextBaza>(
  p: ProgramV2<C>, d: DerulareV2<C>, e: EcranV2<C>, v: Valori, cache: CacheAnaf,
): C {
  if (e.tip !== 'intrebare') return d.ctx;
  return p.v1.scenariu.context(e.pas.scrie(d.acceptate, v, e.ctx), cache);
}

/** Valorile de pe controale la intrarea pe ecran: răspunsul dat, ce se știe deja, apoi valorile de pornire. */
export function implicite<C>(e: Extract<EcranV2<C>, { tip: 'intrebare' }>): Valori {
  const c = e.pas.control;
  const v: Valori = { ...e.partial, ...e.raspuns };
  if (c.tip === 'numar') return { n: v.n ?? String(c.start) };
  if (c.tip === 'glisoare') return Object.fromEntries(c.glisoare(e.ctx).map((g) => [g.cheie, v[g.cheie] ?? String(g.start)]));
  return v;
}

/** Răspunsul dat pe un ecran de întrebare, scris în răspunsuri (cheile v1). */
export function scrieV2<C extends ContextBaza>(d: DerulareV2<C>, r: Raspunsuri, cheie: string, v: Valori): Raspunsuri {
  const e = d.ecrane.find((x) => x.cheie === cheie);
  return e?.tip === 'intrebare' ? e.pas.scrie(r, v, e.ctx) : r;
}
