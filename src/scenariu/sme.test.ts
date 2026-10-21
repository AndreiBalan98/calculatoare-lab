import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FIRME_DEMO } from '@/motor/edrive/fixtures';
import { FIRME_DEMO_SME } from '@/motor/sme/fixtures';
import { raspunde } from './actiuni';
import { deruleaza, progresEtape, type Derulare, type Ecran } from './derulare';
import { DRUM, SCENARIU, SME } from './sme';
import { construiesteAnalizaSme } from './sme/analiza';
import type { ContextSme } from './sme/context';
import { GLOSAR_SME } from './sme/glosar';
import { faraMarcaje as fm } from './text';
import type { CacheAnaf, Raspunsuri } from './tipuri';

const cache: CacheAnaf = Object.fromEntries(Object.entries({ ...FIRME_DEMO, ...FIRME_DEMO_SME }).map(([k, v]) => [k, v.raspuns]));
cache['99'] = { ok: false, cod: 'negasit', mesaj: 'Nu am găsit nicio firmă cu acest CUI.' };

/** textul fără marcaje, cu spațiile nedespărțite ca spații obișnuite */
const faraMarcaje = (s: string) => fm(s).replace(/\u00a0/g, ' ');
const sp = <T>(x: T): T => JSON.parse(JSON.stringify(x).replace(/\u00a0/g, ' '));

const d = (r: Raspunsuri) => deruleaza(SCENARIU, r, cache);
const ultim = (r: Raspunsuri) => d(r).ecrane.at(-1) as Ecran<ContextSme>;
const ecou = (e: Ecran<ContextSme>) => ('ecou' in e && e.ecou ? faraMarcaje(e.ecou) : null);
const antrenor = (e: Ecran<ContextSme>) => ('antrenor' in e && e.antrenor ? faraMarcaje(e.antrenor) : null);
const rand = (x: Derulare<ContextSme>) => {
  const b = SME.rand(x, x.ecrane.at(-1) as Ecran<ContextSme>);
  return b && faraMarcaje(b.map((p) => (typeof p === 'string' ? p : (p.format ?? String)(p.numar))).join(''));
};

const ok21: Raspunsuri = { cui: '21', firma: 'da', cumperi: 'verde,alte', verde: '~450000', alte: '~250000' };
const proiect21: Raspunsuri = { cui: '21', firma: 'da', cumperi: 'verde,alte,soft', verde: '~300000', alte: '350000', soft: '20000' };

describe('drumul de ecrane SME', () => {
  it('S0 → S1 (cu bilanțurile) → S2 cu rândurile în plus', () => {
    expect(d({}).ecrane.map((e) => e.cheie)).toEqual(['cui']);
    expect(ultim({ cui: '12345' })).toMatchObject({ tip: 'cautare', text: 'Caut firma și bilanțurile la ANAF…' });
    const s2 = ultim({ cui: '21' });
    expect(s2.tip).toBe('cardFirma');
    if (s2.tip !== 'cardFirma') return;
    expect(sp(s2.pas.randuri(s2.ctx))).toEqual([
      { eticheta: 'Localitatea', valoare: 'Botoșani' },
      { eticheta: 'Categoria', valoare: 'Microîntreprindere', accent: true },
      { eticheta: 'Angajați', valoare: '6' },
      { eticheta: 'Înființată', valoare: 'în 2015' },
      { eticheta: 'Cifra de afaceri 2024', valoare: '1.200.000 lei' },
    ]);
    expect(s2.pas.avert(s2.ctx)).toEqual([]);
  });

  it('CUI 21: S2 Da → C1 cu ecoul; rândul din progres arată grantul maxim', () => {
    const c1 = ultim({ cui: '21', firma: 'da' });
    expect(c1).toMatchObject({ cheie: 'cumperi', text: 'Ce vrei să cumperi?', explicatie: 'Poți alege mai multe.' });
    expect(ecou(c1)).toBe('Firma ta se încadrează: e microîntreprindere, înființată în 2015.');
    expect(antrenor(c1)).toBe('Cel puțin 40% din bani trebuie să meargă pe echipamente verzi. Fără ele, proiectul nu se încadrează.');
    expect(rand(d({ cui: '21', firma: 'da' }))).toBe('Grant de 40%, până la 267.240 lei');
    expect(rand(d({ cui: '21' }))).toBeNull();
  });

  it('CUI 21: verzi ~450.000 → P2 cu ecoul și antrenorul „până la 675.000 lei” → R-ok 267.240', () => {
    const p2 = ultim({ cui: '21', firma: 'da', cumperi: 'verde,alte', verde: '~450000' });
    expect(p2).toMatchObject({ cheie: 'alte', eticheta: 'Alte echipamente' });
    expect(ecou(p2)).toBe('Grantul ajunge deja la 180.000 lei.');
    expect(antrenor(p2)).toBe('Ca partea verde să rămână de cel puțin 40%, aici poți pune până la 675.000 lei.');
    expect(rand(d({ cui: '21', firma: 'da', cumperi: 'verde,alte', verde: '~450000' }))).toBe('Grant: 180.000 lei');

    const x = d(ok21);
    expect(x.ecrane.at(-1)?.tip).toBe('rezultat');
    expect(x.ctx.rezultat).toMatchObject({ status: 'ok', grant: 267_240, credit: 432_760, tvaSuma: 147_000 });
    const v = SME.rezultat(x.ctx);
    expect(v).toMatchObject({ varianta: 'ok', cifra: 267_240, din: 'lei grant', trimite: true, drum: true });
    expect(v.propozitii.map(faraMarcaje)).toEqual([
      'Poți aplica.', 'Primești un grant de 267.240 lei.', 'Restul, 432.760 lei, e un credit bancar.', 'Tu plătești TVA-ul, cam 147.000 lei.',
    ]);
    expect(faraMarcaje(v.rand ?? '')).toBe('Partea verde: 64,2% din investiție (minimum 40%).');
    expect(v.deStiut.map((x) => x.ton)).toEqual(['sfat', 'sfat', 'info']);
    expect(faraMarcaje(v.deStiut[1].text)).toBe('Înscrie-te cât mai devreme: primul venit, primul servit. Termenul: 30 decembrie 2026, ora 20:00.');
    expect(v.bara?.segmente.map((s) => [s.eticheta, s.valoare])).toEqual([['Grantul', 267_240], ['Creditul', 432_760], ['Plătești tu', 147_000]]);
  });

  it('P3: ecoul cu partea verde vine din motor', () => {
    const p3 = ultim({ cui: '21', firma: 'da', cumperi: 'verde,alte,soft', verde: '~300000', alte: '350000' });
    expect(p3.cheie).toBe('soft');
    expect(ecou(p3)).toBe('Partea verde e 46,1%. E în regulă.');
    expect(ecou(ultim({ cui: '21', firma: 'da', cumperi: 'verde,alte,soft', verde: '~150000', alte: '~600000' }))).toBe('Partea verde e 20%. Minimul e 40%.');
    expect(ecou(ultim({ cui: '21', firma: 'da', cumperi: 'verde,soft', verde: '~300000' }))).toBe('Grantul ajunge deja la 120.000 lei.');
  });

  it('proiectul mic → R-proiect cu sfatul 303.100; „Aplică” → R-ok 267.240, același ecran', () => {
    const x = d(proiect21);
    expect(x.ctx.rezultat).toMatchObject({ status: 'proiect', verdeNou: 303_100, grant: 266_000 });
    const v = SME.rezultat(x.ctx);
    expect(v).toMatchObject({ varianta: 'proiect', gri: true, titlu: 'Firma se încadrează. Proiectul, încă nu.', trimite: false, drum: false, schimba: '← Schimbă sumele' });
    expect(v.probleme).toEqual(['Investiția eligibilă e de 665.000 lei. Minimul programului e 668.100 lei.']);
    expect(faraMarcaje(v.antrenor?.text ?? '')).toBe('Cu echipamente verzi de 303.100 lei (cu 3.100 lei mai mult), proiectul se încadrează.');

    const r2 = SME.aplica(proiect21, x.ctx);
    expect(r2).toMatchObject({ cumperi: 'verde,alte,soft', verde: '303100' });
    const y = d(r2);
    expect(y.ecrane.at(-1)?.cheie).toBe('rezultat');
    expect(y.ctx.rezultat).toMatchObject({ status: 'ok', grant: 267_240 });
    const v2 = SME.rezultat(y.ctx);
    expect(v2.propozitii.map(faraMarcaje)).toContain('Tu plătești TVA-ul, cam 141.351 lei, și software-ul peste 15.000 lei, 5.000 lei.');
  });

  it('fără echipamente verzi (doar alte) → R-proiect → „Aplică” le alege → R-ok', () => {
    const r = { cui: '21', firma: 'da', cumperi: 'alte', alte: '~400000' };
    const p2 = ultim({ cui: '21', firma: 'da', cumperi: 'alte' });
    expect(p2.cheie).toBe('alte');
    expect(antrenor(p2)).toBeNull();
    const x = d(r);
    expect(x.ctx.rezultat).toMatchObject({ status: 'proiect', verdeNou: 268_100 });
    expect(faraMarcaje(SME.rezultat(x.ctx).antrenor?.text ?? '')).toBe('Cu echipamente verzi de 268.100 lei, proiectul se încadrează.');
    const y = d(SME.aplica(r, x.ctx));
    expect(y.acceptate.cumperi).toBe('verde,alte');
    expect(y.ctx.rezultat.status).toBe('ok');
  });

  it.each([
    ['23', 'Firma trebuie să fie înființată cel târziu pe 31 decembrie 2021.'],
    ['24', 'Firma trebuie să fi avut cifră de afaceri în 2024.'],
    ['28', 'Pot aplica doar societățile (SRL, SA etc.), cu capital integral privat.'],
  ])('CUI %s → X1 cu motivul motorului', (cui, motiv) => {
    const x = ultim({ cui, firma: 'da' });
    expect(x).toMatchObject({ tip: 'oprire', cheie: 'oprireFirma', titlu: 'Din păcate, firma nu poate aplica la SME Eco-Tech.', motive: [motiv] });
    expect(rand(d({ cui, firma: 'da' }))).toBeNull();
  });

  it('CUI 25 (vinuri) → X1 cu domeniul exclus', () => {
    const x = ultim({ cui: '25', firma: 'da' });
    expect(x.tip === 'oprire' && x.motive[0]).toBe('Codul CAEN 1102 ține de un domeniu exclus din program (băuturile alcoolice).');
  });

  it('CUI 26 (bilanțul 2024 lipsă) → F5 → Da → C1, estimat; Nu → X1', () => {
    const f5 = ultim({ cui: '26', firma: 'da' });
    expect(f5).toMatchObject({ cheie: 'ca24', text: 'A avut firma vânzări în 2024?', explicatie: 'Programul cere o cifră de afaceri mai mare decât zero în 2024.' });
    expect(ecou(f5)).toBe('Nu găsesc bilanțul pe 2024 la ANAF. Îmi spui tu?');
    const c1 = d({ cui: '26', firma: 'da', ca24: '1' });
    expect(c1.ecrane.at(-1)?.cheie).toBe('cumperi');
    expect(c1.ctx.estimat).toBe(true);
    expect(ultim({ cui: '26', firma: 'da', ca24: '0' })).toMatchObject({ tip: 'oprire', cheie: 'oprireDate' });
  });

  it('CUI 27 (inactivă) → avertismentul în card și la „De știut”', () => {
    const s2 = ultim({ cui: '27' });
    expect(s2.tip === 'cardFirma' && s2.pas.avert(s2.ctx)).toEqual(['ANAF declară firma inactivă fiscal. Clarifică situația înainte de înscriere.']);
    const v = SME.rezultat(d({ ...ok21, cui: '27' }).ctx);
    expect(v.deStiut).toContainEqual({ text: 'ANAF declară firma inactivă fiscal. Clarifică situația înainte de înscriere.', ton: 'avertisment' });
  });

  it('firmele e-DRIVE (fără bilanțuri pe 3 ani) duc la F5', () => {
    expect(ultim({ cui: '1', firma: 'da' }).cheie).toBe('ca24');
  });

  it('CUI negăsit → F1, F2, F3, F4, F5 → C1 fără anul înființării', () => {
    const r: Raspunsuri = { cui: '99' };
    expect(ultim(r).cheie).toBe('forma');
    expect(ecou(ultim(r))).toBe('Nu găsesc datele firmei acum. Îmi spui tu câteva lucruri.');
    const pasi = ['forma', 'angajati', 'cifra', 'infiintata', 'ca24'];
    const valori = ['soc', '5', '2000000', '2015-01-01', '1'];
    pasi.forEach((p, i) => {
      expect(ultim(r).cheie).toBe(p);
      r[p] = valori[i];
    });
    const c1 = ultim(r);
    expect(c1.cheie).toBe('cumperi');
    expect(ecou(c1)).toBe('Firma ta se încadrează: e microîntreprindere.');
    expect(ultim({ ...r, infiintata: '2023-01-01' })).toMatchObject({ tip: 'oprire', motive: ['Firma trebuie să fie înființată cel târziu pe 31 decembrie 2021.'] });
  });

  it('C1: alegerile rămân; o alegere scoasă își uită ecranul de sumă', () => {
    const x = d({ ...ok21, cumperi: 'alte' });
    expect(x.acceptate.verde).toBeUndefined();
    expect(x.ecrane.map((e) => e.cheie)).not.toContain('verde');
    // alegeri necunoscute → C1 fără răspuns
    expect(ultim({ cui: '21', firma: 'da', cumperi: 'verde,altceva' }).cheie).toBe('cumperi');
    expect(ultim({ cui: '21', firma: 'da', cumperi: '' }).cheie).toBe('cumperi');
  });

  it('CUI nou → se uită firma și răspunsurile F', () => {
    expect(raspunde(SCENARIU, { cui: '26', firma: 'da', ca24: '1' }, 'cui', '21')).toEqual({ cui: '21' });
  });

  it('progresul pe etape', () => {
    const p = progresEtape(d({ cui: '21', firma: 'da', cumperi: 'verde,alte,soft', verde: '~300000' }));
    expect(p).toEqual({
      firma: { total: 2, raspunse: 2 }, cumperi: { total: 1, raspunse: 1 }, sume: { total: 3, raspunse: 1 }, rezultat: { total: 0, raspunse: 0 },
    });
  });
});

describe('analiza SME de trimis', () => {
  it('conține firma, ce cumperi, sumele, grantul, creditul și partea verde', () => {
    const a = construiesteAnalizaSme({
      derulare: d(ok21),
      contact: { nume: ' Ion ', telefon: '0722 123 456', email: '' },
      acum: new Date('2026-10-21T10:00:00Z'),
    });
    expect(a.program).toBe('SME Eco-Tech');
    expect(a.firma).toMatchObject({ cui: '21', denumire: 'DEMO VERDE MICRO SRL', categorie: 'Microîntreprindere', infiintata: '2015-04-14', cifraAfaceri2024: 1_200_000, sursa: 'ANAF' });
    expect(a.cumperi).toEqual({ echipamenteVerzi: 450_000, alteEchipamente: 250_000, software: null });
    expect(a.rezultat).toMatchObject({ status: 'ok', grant: 267_240, credit: 432_760, tva: 147_000, parteaVerde: 64.2 });
    expect(sp(a.raspunsuri)).toContainEqual({ intrebare: 'Ce cumperi: Ce vrei să cumperi?', raspuns: 'Echipamente verzi, Alte echipamente' });
    expect(sp(a.raspunsuri)).toContainEqual({ intrebare: 'Echipamente verzi: Cam cât costă, fără TVA?', raspuns: 'cam 450.000 lei' });
    expect(a.contact.nume).toBe('Ion');
  });
});

describe('glosarul SME', () => {
  it('fiecare [[cuvânt]] din scenariu are explicație', () => {
    const sursa = readFileSync('src/scenariu/sme.ts', 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    const chei = [...sursa.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)].map((m) => m[2] ?? m[1]);
    expect(chei.length).toBeGreaterThan(8);
    for (const k of chei) expect(GLOSAR_SME[k], k).toBeDefined();
    expect(DRUM.pasi).toHaveLength(7);
  });
});
