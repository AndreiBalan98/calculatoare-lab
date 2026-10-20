import { describe, expect, it } from 'vitest';
import { FIRME_DEMO } from '@/motor/edrive/fixtures';
import { altCui, raspunde, redeschide, toateUE } from './actiuni';
import { construiesteAnaliza } from './analiza';
import type { CacheAnaf, Raspunsuri } from './context';
import { deruleaza, type Element } from './derulare';
import { REZULTAT, SCENARIU } from './edrive';
import { localitate, puncte } from './format';
import { bucati, faraMarcaje } from './text';

const cache: CacheAnaf = Object.fromEntries(Object.entries(FIRME_DEMO).map(([k, v]) => [k, v.raspuns]));
cache['99'] = { ok: false, cod: 'negasit', mesaj: 'Nu am găsit nicio firmă cu acest CUI.' };
cache['98'] = { ok: false, cod: 'cui_invalid', mesaj: 'CUI invalid' };

const d = (r: Raspunsuri) => deruleaza(SCENARIU, r, cache);
const texte = (e: Element[]) => e.filter((x) => x.tip === 'mesaj').map((x) => (x.tip === 'mesaj' ? faraMarcaje(x.text) : ''));

const micro2: Raspunsuri = {
  cui: '1', firma: 'da', nrM1: '2', nrM2: '0', vechi: 'da',
  pret_0: '~25000', ue_0: 'da', pret_1: 'aceeasi', ue_1: 'nustiu',
};

describe('derularea scenariului e-DRIVE', () => {
  it('începe cu CUI-ul', () => {
    const x = d({});
    expect(x.activ).toBe('cui');
    expect(x.elemente).toHaveLength(1);
  });

  it('CUI fără răspuns ANAF → se caută', () => {
    const x = d({ cui: 'RO 12345' });
    expect(x.cauta).toBe('12345');
    expect(x.elemente.at(-1)?.tip).toBe('cautare');
  });

  it('CUI invalid → rămâne la CUI, cu eroare', () => {
    const x = d({ cui: '98' });
    expect(x.activ).toBe('cui');
    expect(x.elemente[0]).toMatchObject({ tip: 'cui', eroare: expect.stringMatching(/nu pare corect/) });
  });

  it('micro: cardul firmei, apoi „Pornești cu 80 de puncte”', () => {
    expect(d({ cui: '1' }).activ).toBe('firma');
    const x = d({ cui: '1', firma: 'da' });
    expect(texte(x.elemente)).toContain('Pornești cu 80 de puncte, pentru că ești microîntreprindere.');
    expect(x.activ).toBe('nrM1');
  });

  it('micro, 2 autoturisme (UE + „Nu știu”) → 80, antrenorul promite 100, „Aplică” → 100', () => {
    const x = d(micro2);
    expect(x.gata).toBe(true);
    expect(x.elemente.at(-1)?.tip).toBe('rezultat');
    expect(x.ctx.rezultat).toMatchObject({ status: 'ok', total: 80, ajutor: 50_000 });
    expect(texte(x.elemente)).toContain('Nicio grijă, verificăm împreună modelul. Deocamdată nu socotesc cele 20 de puncte.');
    expect(faraMarcaje(REZULTAT.antrenor(x.ctx) ?? '')).toBe('Cu modele asamblate în UE ai avea 100.');
    const y = d(toateUE(micro2));
    expect(y.ctx.rezultat.total).toBe(100);
    expect(REZULTAT.antrenor(y.ctx)).toBeNull();
  });

  it('pastila: redeschizi o întrebare, iar răspunsurile de după rămân', () => {
    const x = d(redeschide(micro2, 'nrM1'));
    expect(x.activ).toBe('nrM1');
    // cu un singur autoturism, mașina 2 dispare, mașina 1 își păstrează răspunsurile
    const y = d(raspunde(SCENARIU, redeschide(micro2, 'nrM1'), 'nrM1', '1'));
    expect(y.gata).toBe(true);
    expect(y.ctx.rezultat).toMatchObject({ total: 100, ajutor: 25_000 });
  });

  it('autoturism de 35.000 € → reacția cu sfatul motorului despre plafon', () => {
    const x = d({ cui: '1', firma: 'da', nrM1: '1', nrM2: '0', vechi: 'da', pret_0: '~35000' });
    expect(texte(x.elemente)).toContain('Mașina 1 trece de 30.000 € fără TVA: diferența de 5.000 € o plătești tu.');
  });

  it('mijlocie, un microbuz cu altă sumă → 65 de puncte, fără plafon', () => {
    const x = d({ cui: '3', firma: 'da', nrM1: '0', nrM2: '1', vechi: 'da', pret_0: '52000', ue_0: 'nu' });
    expect(x.ctx.rezultat).toMatchObject({ status: 'ok', total: 65, ajutor: 52_000 });
  });

  it('fără autoturisme nu poți alege 0 microbuze; maximum 10 în total', () => {
    const x = d({ cui: '1', firma: 'da', nrM1: '0' });
    const q = x.elemente.at(-1);
    expect(q?.tip === 'intrebare' && q.optiuni.map((o) => o.valoare)).toEqual(['1', '2', '3', 'mai']);
    const y = d({ cui: '1', firma: 'da', nrM1: 'mai', nrM1Multe: '8' });
    const q2 = y.elemente.at(-1);
    expect(q2?.tip === 'intrebare' && q2.optiuni.map((o) => o.valoare)).toEqual(['0', '1', '2']);
  });

  it('PFA → oprire blândă cu motivul din motor; „Încearcă alt CUI” uită firma', () => {
    const r = { cui: '5', firma: 'da' };
    const x = d(r);
    expect(x.gata).toBe(true);
    const o = x.elemente.at(-1);
    expect(o?.tip === 'oprire' && o.motive[0]).toMatch(/^PFA-urile/);
    expect(altCui(SCENARIU, r)).toEqual({});
  });

  it('fără bilanț → întrebările minime → 80 de puncte, estimat', () => {
    const x = d({ cui: '9', firma: 'da' });
    expect(texte(x.elemente).at(-1)).toMatch(/Nu găsesc bilanțul/);
    expect(x.activ).toBe('angajati');
    const y = d({ cui: '9', firma: 'da', angajati: '5', cifra: '2000000' });
    expect(y.ctx.estimat).toBe(true);
    expect(y.ctx.evaluare.incadrare).toMatchObject({ status: 'imm', puncte: 80 });
    expect(y.activ).toBe('nrM1');
  });

  it('CUI negăsit → fără card, întrebăm și forma', () => {
    const x = d({ cui: '99' });
    expect(x.elemente.some((e) => e.tip === 'cardFirma')).toBe(false);
    expect(x.activ).toBe('forma');
    const y = d({ cui: '99', forma: 'soc', angajati: '300', cifra: '2000000' });
    expect(y.elemente.at(-1)?.tip).toBe('oprire');
  });

  it('„Cifrele nu mai sunt la zi” → întrebările minime, cu valorile ANAF ca reper', () => {
    const x = d({ cui: '4', firma: 'corectez', corectez: 'cifre' });
    expect(x.activ).toBe('angajati');
    const q = x.elemente.at(-1);
    expect(q?.tip === 'intrebare' && q.nota).toBe('La ANAF, în bilanțul pe 2025: 300 angajați.');
    const y = d({ cui: '4', firma: 'corectez', corectez: 'cifre', angajati: '150', cifra: '150000000' });
    expect(y.ctx.evaluare.incadrare).toMatchObject({ status: 'imm', puncte: 65 });
  });

  it('CUI nou → se uită confirmarea firmei vechi', () => {
    const r = raspunde(SCENARIU, micro2, 'cui', '3');
    expect(r.firma).toBeUndefined();
    expect(r.nrM1).toBe('2');
    expect(d(r).activ).toBe('firma');
  });

  it('mașina veche lipsă și fără promisiune → oprire', () => {
    const x = d({ cui: '1', firma: 'da', nrM1: '1', nrM2: '0', vechi: 'nu', promisiune: 'nu' });
    expect(x.elemente.at(-1)?.tip).toBe('oprire');
    const y = d({ ...micro2, vechi: 'nu', promisiune: 'da' });
    expect(y.ctx.rezultat.avert[0]).toMatch(/promisiunea notarială/);
  });
});

describe('analiza de trimis', () => {
  it('conține firma, răspunsurile, rezultatul și contactul', () => {
    const a = construiesteAnaliza({
      derulare: d(micro2),
      contact: { nume: ' Ion ', telefon: '0722 123 456', email: '' },
      acum: new Date('2026-10-20T10:00:00Z'),
    });
    expect(a.firma).toMatchObject({ cui: '1', denumire: 'DEMO MICRO SRL', localitate: 'Botoșani', categorie: 'Microîntreprindere', sursa: 'ANAF' });
    expect(a.rezultat).toMatchObject({ punctaj: 80, finantare: 50_000 });
    expect(a.masini).toEqual([
      { categorie: 'M1', pretFaraTva: 25_000, asamblataUE: true },
      { categorie: 'M1', pretFaraTva: 25_000, asamblataUE: false },
    ]);
    expect(a.raspunsuri[0]).toEqual({ intrebare: 'Salut! Hai să vedem cât poate primi firma ta pentru mașini electrice. Îmi spui CUI-ul?', raspuns: '1' });
    expect(a.raspunsuri.some((x) => x.raspuns === 'la fel ca prima (25.000 €)')).toBe(true);
    expect(a.contact.nume).toBe('Ion');
  });
});

describe('ajutoare de text', () => {
  it('puncte()', () => {
    expect([puncte(80), puncte(5), puncte(1), puncte(0), puncte(100)]).toEqual(['80 de puncte', '5 puncte', '1 punct', '0 puncte', '100 de puncte']);
  });
  it('localitate()', () => {
    expect(localitate('MUN. BOTOȘANI, STR. X')).toBe('Botoșani');
    expect(localitate('JUD. CLUJ, MUN. CLUJ-NAPOCA, STR. Y')).toBe('Cluj-Napoca');
    expect(localitate('', 'IAȘI')).toBe('Iași');
  });
  it('bucati()', () => {
    expect(bucati('Ai **80** de [[puncte]] și [[TVA-ul|tva]].')).toEqual([
      { tip: 'text', text: 'Ai ' }, { tip: 'gros', text: '80' }, { tip: 'text', text: ' de ' },
      { tip: 'termen', text: 'puncte', cheie: 'puncte' }, { tip: 'text', text: ' și ' },
      { tip: 'termen', text: 'TVA-ul', cheie: 'tva' }, { tip: 'text', text: '.' },
    ]);
  });
});

describe('redeschiderea CUI-ului', () => {
  it('același CUI → firma rămâne confirmată; alt CUI → se cere confirmarea', () => {
    const deschis = redeschide(micro2, 'cui');
    expect(deschis['anterior:cui']).toBe('1');
    expect(d(raspunde(SCENARIU, deschis, 'cui', '1')).gata).toBe(true);
    expect(d(raspunde(SCENARIU, deschis, 'cui', '3')).activ).toBe('firma');
  });
});

describe('glosarul', () => {
  it('fiecare [[cuvânt|cheie]] din scenariu are explicație', async () => {
    const { readFileSync } = await import('node:fs');
    const { GLOSAR } = await import('./glosar');
    const sursa = readFileSync('src/scenariu/edrive.ts', 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    const chei = [...sursa.matchAll(/\[\[[^\]|]+\|([^\]]+)\]\]/g)].map((m) => m[1]);
    expect(chei.length).toBeGreaterThan(5);
    for (const k of chei) expect(GLOSAR[k], k).toBeDefined();
  });
});
