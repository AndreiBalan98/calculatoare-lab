import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FIRME_DEMO } from '@/motor/edrive/fixtures';
import { altCui, raspunde, toateUE } from './actiuni';
import { construiesteAnaliza } from './analiza';
import { masiniDin, type CacheAnaf, type Raspunsuri } from './context';
import { anteriorul, deruleaza, ecranul, progresEtape, urmatorul, type Ecran } from './derulare';
import { REZULTAT, SCENARIU } from './edrive';
import { GLOSAR } from './glosar';
import { localitate, puncte } from './format';
import { bucati, faraMarcaje } from './text';

const cache: CacheAnaf = Object.fromEntries(Object.entries(FIRME_DEMO).map(([k, v]) => [k, v.raspuns]));
cache['99'] = { ok: false, cod: 'negasit', mesaj: 'Nu am găsit nicio firmă cu acest CUI.' };
cache['98'] = { ok: false, cod: 'cui_invalid', mesaj: 'CUI invalid' };

const d = (r: Raspunsuri) => deruleaza(SCENARIU, r, cache);
const ultim = (r: Raspunsuri) => d(r).ecrane.at(-1) as Ecran;
const ecou = (e: Ecran) => ('ecou' in e && e.ecou ? faraMarcaje(e.ecou) : null);
const optiuni = (e: Ecran) => (e.tip === 'intrebare' ? e.optiuni.map((o) => o.valoare) : []);

const micro2: Raspunsuri = {
  cui: '1', firma: 'da', nrMasini: '2', tipMasini: 'toateM1', vechi: 'da',
  pret_0: '~25000', ue_0: 'da', pret_1: 'aceeasi', ue_1: 'nustiu',
};

describe('drumul de ecrane', () => {
  it('începe cu CUI-ul (S0)', () => {
    expect(d({}).ecrane.map((e) => e.cheie)).toEqual(['cui']);
  });

  it('CUI fără răspuns ANAF → căutarea (S1)', () => {
    const x = d({ cui: 'RO 12345' });
    expect(x.cauta).toBe('12345');
    expect(x.ecrane.at(-1)?.tip).toBe('cautare');
  });

  it('CUI invalid → înapoi la S0, cu eroare', () => {
    expect(ultim({ cui: '98' })).toMatchObject({ tip: 'cui', eroare: 'CUI-ul nu pare corect. Verifică cifrele.' });
  });

  it('S2 „Am găsit-o.” → M1 cu ecoul „Pornești cu 80 de puncte…”', () => {
    expect(ultim({ cui: '1' })).toMatchObject({ tip: 'cardFirma', ecou: 'Am găsit-o.' });
    const m1 = ultim({ cui: '1', firma: 'da' });
    expect(m1.cheie).toBe('nrMasini');
    expect(ecou(m1)).toBe('Pornești cu 80 de puncte, pentru că ești microîntreprindere.');
    expect(optiuni(m1)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });

  it('M2 depinde de numărul mașinilor', () => {
    const una = ultim({ cui: '1', firma: 'da', nrMasini: '1' });
    expect(una).toMatchObject({ text: 'Ce fel de mașină e?' });
    expect(ecou(una)).toBe('Bun, o mașină.');
    expect(optiuni(una)).toEqual(['M1', 'M2']);
    const doua = ultim({ cui: '1', firma: 'da', nrMasini: '2' });
    expect(ecou(doua)).toBe('Bun, două mașini.');
    expect(optiuni(doua)).toEqual(['toateM1', 'toateM2', 'mixt']);
  });

  it('CUI 1: 2 autoturisme (UE + „Nu știu”) → R cu 80; ecourile reacționează; „Aplică” → 100', () => {
    const x = d(micro2);
    expect(x.gata).toBe(true);
    expect(x.ecrane.at(-1)?.tip).toBe('rezultat');
    expect(x.ctx.rezultat).toMatchObject({ status: 'ok', total: 80, ajutor: 50_000 });
    const pret1 = x.ecrane.find((e) => e.cheie === 'pret_1') as Ecran;
    expect(ecou(pret1)).toBe('Bun! Asta înseamnă 20 de puncte în plus.');
    expect(pret1).toMatchObject({ eticheta: 'Mașina electrică 2 din 2 · autoturism' });
    expect(pret1.tip === 'intrebare' && pret1.optiuni[0]).toMatchObject({ valoare: 'aceeasi', eticheta: 'La fel ca mașina 1 · 25.000 €' });
    expect(faraMarcaje(REZULTAT.antrenor(x.ctx) ?? '')).toBe('Cu modele asamblate în UE ai avea 100.');
    expect(d(toateUE(micro2)).ctx.rezultat.total).toBe(100);
  });

  it('ecoul „Nicio grijă” / „Am notat.” pe prețul mașinii următoare', () => {
    const r = { cui: '1', firma: 'da', nrMasini: '3', tipMasini: 'toateM1', vechi: 'da', pret_0: '~25000', ue_0: 'nustiu', pret_1: '~25000', ue_1: 'nu' };
    expect(ecou(d(r).ecrane.find((e) => e.cheie === 'pret_1') as Ecran)).toBe('Nicio grijă, verificăm împreună modelul.');
    expect(ecou(d(r).ecrane.find((e) => e.cheie === 'pret_2') as Ecran)).toBe('Am notat.');
  });

  it('peste plafon → ecoul pe ecranul UE vine din motor', () => {
    const e = ultim({ cui: '1', firma: 'da', nrMasini: '1', tipMasini: 'M1', vechi: 'da', pret_0: '~35000' });
    expect(e.cheie).toBe('ue_0');
    expect(ecou(e)).toBe('Peste plafon, diferența de 5.000 € o plătește firma.');
  });

  it('progresul de scor nu coboară cât timp nu știm UE la mașina nouă', () => {
    const x = d({ cui: '1', firma: 'da', nrMasini: '2', tipMasini: 'toateM1', vechi: 'da', pret_0: '~25000', ue_0: 'da', pret_1: '~25000' });
    expect(x.ctx.scor).toBe(100);
    expect(x.ctx.rezultat.ajutor).toBe(50_000);
  });

  it('CUI 3: 3 mașini „și, și” → 1 microbuz → întâi autoturismele, apoi microbuzul', () => {
    const r = { cui: '3', firma: 'da', nrMasini: '3', tipMasini: 'mixt' };
    expect(optiuni(ultim(r))).toEqual(['1', '2']);
    expect(masiniDin({ ...r, nrMicrobuze: '1' }).map((m) => m.cat)).toEqual(['M1', 'M1', 'M2']);
    expect(ecou(ultim({ ...r, nrMicrobuze: '1' }))).toBe('Deci două autoturisme și un microbuz.');
    const x = d({ ...r, nrMicrobuze: '1', vechi: 'da', pret_0: '~20000', ue_0: 'nu', pret_1: 'aceeasi', ue_1: 'nu', pret_2: '52000', ue_2: 'nu' });
    expect(x.ctx.rezultat).toMatchObject({ status: 'ok', total: 65, ajutor: 92_000 });
    expect(x.ecrane.find((e) => e.cheie === 'pret_2')).toMatchObject({ eticheta: 'Mașina electrică 3 din 3 · microbuz' });
  });

  it('răspunsurile valabile rămân: 2 → 3 mașini păstrează prețurile; 2 → 1 cere iar felul', () => {
    const trei = d({ ...micro2, nrMasini: '3' });
    expect(trei.ecrane.at(-1)?.cheie).toBe('pret_2');
    expect(trei.acceptate.pret_1).toBe('aceeasi');
    const una = d({ ...micro2, nrMasini: '1' });
    expect(una.ecrane.at(-1)?.cheie).toBe('tipMasini');
  });

  it('PFA → X1 cu motivul din motor; „Încearcă alt CUI” uită firma', () => {
    const r = { cui: '5', firma: 'da' };
    const x = ultim(r);
    expect(x.tip === 'oprire' && x.motive[0]).toMatch(/^PFA-urile/);
    expect(altCui(SCENARIU, r)).toEqual({});
  });

  it('CUI 9 (fără bilanț) → F2, F3 → M1, estimat', () => {
    const f2 = ultim({ cui: '9', firma: 'da' });
    expect(f2.cheie).toBe('angajati');
    expect(ecou(f2)).toBe('Nu găsesc bilanțul firmei la ANAF. Îmi spui tu câteva lucruri.');
    const x = d({ cui: '9', firma: 'da', angajati: '5', cifra: '2000000' });
    expect(x.ecrane.at(-1)?.cheie).toBe('nrMasini');
    expect(x.ctx.estimat).toBe(true);
    expect(x.ctx.evaluare.incadrare).toMatchObject({ status: 'imm', puncte: 80 });
  });

  it('CUI negăsit → F1 cu ecoul, fără card', () => {
    const f1 = ultim({ cui: '99' });
    expect(f1.cheie).toBe('forma');
    expect(ecou(f1)).toBe('Nu găsesc datele firmei acum. Îmi spui tu câteva lucruri.');
    expect(ultim({ cui: '99', forma: 'soc', angajati: '300', cifra: '2000000' }).tip).toBe('oprire');
  });

  it('S3 „Cifrele nu mai sunt la zi” → F2 cu valorile ANAF ca notă', () => {
    const f2 = ultim({ cui: '4', firma: 'corectez', corectez: 'cifre' });
    expect(f2).toMatchObject({ cheie: 'angajati', nota: 'La ANAF, în bilanțul pe 2025: 300 angajați.' });
    expect(ecou(f2)).toBe('Bine. Spune-mi cum arată firma acum.');
    expect(d({ cui: '4', firma: 'corectez', corectez: 'cifre', angajati: '150', cifra: '150000000' }).ctx.evaluare.incadrare).toMatchObject({ puncte: 65 });
  });

  it('M4 = Nu → M5 = Nu → X2; M5 = Da → avertismentul motorului', () => {
    const r = { cui: '1', firma: 'da', nrMasini: '1', tipMasini: 'M1', vechi: 'nu' };
    expect(ultim(r).cheie).toBe('promisiune');
    expect(ultim({ ...r, promisiune: 'nu' })).toMatchObject({ tip: 'oprire', cheie: 'oprireVechi' });
    expect(d({ ...micro2, vechi: 'nu', promisiune: 'da' }).ctx.rezultat.avert[0]).toMatch(/promisiunea notarială/);
  });

  it('CUI nou → se uită confirmarea firmei vechi; același CUI o păstrează', () => {
    expect(raspunde(SCENARIU, micro2, 'cui', '3').firma).toBeUndefined();
    expect(raspunde(SCENARIU, micro2, 'cui', '1').firma).toBe('da');
  });
});

describe('navigarea în drum', () => {
  it('înainte / înapoi / ecranul afișat', () => {
    const x = d(micro2);
    expect(urmatorul(x, 'nrMasini').cheie).toBe('tipMasini');
    expect(anteriorul(x, 'ue_1')?.cheie).toBe('pret_1');
    expect(anteriorul(x, 'cui')).toBeNull();
    expect(ecranul(x, 'nu-exista').tip).toBe('rezultat');
    // înapoi sare peste starea de căutare
    const y = d({ cui: '5' });
    expect(anteriorul(y, 'firma')?.cheie).toBe('cui');
  });

  it('progresul pe etape', () => {
    const p = progresEtape(d({ cui: '1', firma: 'da', nrMasini: '2' }));
    expect(p.firma).toEqual({ total: 2, raspunse: 2 });
    expect(p.masini).toEqual({ total: 3, raspunse: 1 });
    expect(p.pret).toEqual({ total: 4, raspunse: 0 });
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
    expect(a.raspunsuri[0]).toEqual({ intrebare: 'Hai să vedem cât poate primi firma ta.', raspuns: '1' });
    expect(a.raspunsuri).toContainEqual({ intrebare: 'Ce fel de mașini sunt?', raspuns: 'Toate sunt autoturisme' });
    expect(a.raspunsuri).toContainEqual({ intrebare: 'Mașina electrică 2 din 2 · autoturism: Cam cât costă, fără TVA?', raspuns: 'la fel ca mașina 1 (25.000 €)' });
    expect(a.contact.nume).toBe('Ion');
  });
});

describe('ajutoare și glosar', () => {
  it('puncte(), localitate(), bucati()', () => {
    expect([puncte(80), puncte(5), puncte(1), puncte(0), puncte(100)]).toEqual(['80 de puncte', '5 puncte', '1 punct', '0 puncte', '100 de puncte']);
    expect(localitate('JUD. CLUJ, MUN. CLUJ-NAPOCA, STR. Y')).toBe('Cluj-Napoca');
    expect(bucati('Ai **80** și [[TVA-ul|tva]].')).toEqual([
      { tip: 'text', text: 'Ai ' }, { tip: 'gros', text: '80' }, { tip: 'text', text: ' și ' },
      { tip: 'termen', text: 'TVA-ul', cheie: 'tva' }, { tip: 'text', text: '.' },
    ]);
  });

  it('fiecare [[cuvânt]] din scenariu are explicație', () => {
    const sursa = readFileSync('src/scenariu/edrive.ts', 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    const chei = [...sursa.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)].map((m) => m[2] ?? m[1]);
    expect(chei.length).toBeGreaterThan(5);
    for (const k of chei) expect(GLOSAR[k], k).toBeDefined();
  });
});
