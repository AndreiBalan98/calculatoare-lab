import { describe, expect, it } from 'vitest';
import { calc } from '@/motor/edrive/calc';
import { FIRME_DEMO } from '@/motor/edrive/fixtures';
import { FIRME_DEMO_SME } from '@/motor/sme/fixtures';
import { raspunde } from '../actiuni';
import { deruleaza } from '../derulare';
import { EDRIVE, SCENARIU as SCENARIU_EDRIVE } from '../edrive';
import { SCENARIU as SCENARIU_SME } from '../sme';
import type { CacheAnaf, ContextBaza, Raspunsuri } from '../tipuri';
import { contextProvizoriu, deruleazaV2, ecranulV2, scrieV2 } from './derulare';
import { cuMasini, EDRIVE_V2 } from './edrive';
import { SME_V2 } from './sme';
import type { EcranV2, ProgramV2, Valori } from './tipuri';

const cache: CacheAnaf = Object.fromEntries(
  Object.entries({ ...FIRME_DEMO, ...FIRME_DEMO_SME }).map(([k, v]) => [k, v.raspuns]),
);

/** Un om care răspunde pe rând: fiecare răspuns pe ecranul care așteaptă. */
function parcurge<C extends ContextBaza>(p: ProgramV2<C>, cui: string, pasi: [string, Valori][]): Raspunsuri {
  let r = raspunde(p.v1.scenariu, {}, 'cui', cui);
  for (const [cheie, v] of pasi) {
    const d = deruleazaV2(p, r, cache);
    expect(d.ecrane.at(-1)?.cheie, `ecranul care așteaptă înainte de „${cheie}”`).toBe(cheie);
    r = scrieV2(d, r, cheie, v);
  }
  return r;
}

const ultim = <C extends ContextBaza>(p: ProgramV2<C>, r: Raspunsuri) => deruleazaV2(p, r, cache).ecrane.at(-1) as EcranV2<C>;

const PRINCIPAL: [string, Valori][] = [
  ['firma', { v: 'da' }], ['nrMasini', { n: '2' }], ['tipMasini', { fel: 'M1' }], ['vechi', { v: 'da' }],
  ['pret', { M1: '25000' }], ['ue', { v: 'da' }],
];

describe('e-DRIVE v2: cheile v1', () => {
  it('parcursul principal scrie aceleași chei ca v1 (prețul pe categorie, UE la toate)', () => {
    const r = parcurge(EDRIVE_V2, '1', PRINCIPAL);
    expect(r).toEqual({
      cui: '1', firma: 'da', nrMasini: '2', tipMasini: 'toateM1', vechi: 'da',
      pret_0: '25000', pret_1: 'aceeasi', ue_0: 'da', ue_1: 'da',
    });
    const d = deruleazaV2(EDRIVE_V2, r, cache);
    expect(d.ecrane.at(-1)?.tip).toBe('rezultat');
    expect(d.ctx.rezultat.ajutor).toBe(50_000);
    expect(d.ctx.rezultat.total).toBe(100);
    expect(d.umplere).toBe(1);
    expect(d.rezumat.map((b) => b.text)).toEqual(['2 mașini', '2 autoturisme', 'ale firmei de 1 an', '~25.000\u00a0€', 'UE']);
    // derularea v1 merge cu răspunsurile v2 (analiza trimisă din v1)
    const d1 = deruleaza(SCENARIU_EDRIVE, r, cache);
    expect(d1.gata).toBe(true);
    expect(d1.ecrane.at(-1)?.tip).toBe('rezultat');
  });

  it('o singură mașină: valorile v1 „M1” / „M2”', () => {
    const r = parcurge(EDRIVE_V2, '1', [['firma', { v: 'da' }], ['nrMasini', { n: '1' }], ['tipMasini', { fel: 'M2' }]]);
    expect(r.tipMasini).toBe('M2');
    expect(ultim(EDRIVE_V2, r)).toMatchObject({ cheie: 'vechi' });
  });

  it('mixt: prețul la prima mașină din fiecare categorie, „aceeasi” la celelalte', () => {
    const r = parcurge(EDRIVE_V2, '2', [
      ['firma', { v: 'da' }], ['nrMasini', { n: '3' }], ['tipMasini', { fel: 'mixt', n: '1' }], ['vechi', { v: 'da' }],
      ['pret', { M1: '30000', M2: '45000' }], ['ue', { v: 'nu' }],
    ]);
    expect(r).toMatchObject({ tipMasini: 'mixt', nrMicrobuze: '1', pret_0: '30000', pret_1: 'aceeasi', pret_2: '45000', ue_0: 'nu', ue_1: 'nu', ue_2: 'nu' });
    const c = deruleazaV2(EDRIVE_V2, r, cache).ctx;
    const motor = calc({ ...c.date, veh: [{ cat: 'M1', pret: 30000, ue: false }, { cat: 'M1', pret: 30000, ue: false }, { cat: 'M2', pret: 45000, ue: false }] });
    expect(c.rezultat.ajutor).toBe(motor.ajutor);
    expect(c.rezultat.total).toBe(70);
    // „Aplică” (antrenorul v1): toate în UE → +20
    const dupa = deruleazaV2(EDRIVE_V2, EDRIVE.aplica(r, c), cache).ctx;
    expect(dupa.rezultat.total).toBe(90);
  });

  it('rezumatul: 2 → 3 mașini; a treia ia prețul categoriei și UE, direct la rezultat (75.000 €)', () => {
    const r = parcurge(EDRIVE_V2, '1', PRINCIPAL);
    const d = deruleazaV2(EDRIVE_V2, r, cache);
    const r3 = scrieV2(d, r, 'nrMasini', { n: '3' });
    expect(r3).toMatchObject({ nrMasini: '3', tipMasini: 'toateM1', pret_0: '25000', pret_1: 'aceeasi', pret_2: 'aceeasi', ue_2: 'da' });
    const d3 = deruleazaV2(EDRIVE_V2, r3, cache);
    expect(d3.ecrane.at(-1)?.tip).toBe('rezultat');
    expect(d3.ctx.rezultat.ajutor).toBe(75_000);

    // „3 autoturisme” → Amândouă, 1 microbuz → lipsește doar prețul microbuzului
    const rm = scrieV2(d3, r3, 'tipMasini', { fel: 'mixt', n: '1' });
    expect(rm).toMatchObject({ tipMasini: 'mixt', nrMicrobuze: '1', pret_0: '25000', pret_1: 'aceeasi', ue_2: 'da' });
    expect(rm.pret_2).toBeUndefined();
    const dm = deruleazaV2(EDRIVE_V2, rm, cache);
    const pret = dm.ecrane.at(-1) as Extract<EcranV2<unknown>, { tip: 'intrebare' }>;
    expect(pret).toMatchObject({ cheie: 'pret', raspuns: null });
    const rf = scrieV2(dm, rm, 'pret', { M1: '25000', M2: '45000' });
    const df = deruleazaV2(EDRIVE_V2, rf, cache);
    expect(df.ecrane.at(-1)?.tip).toBe('rezultat');
    expect(df.ctx.rezultat.ajutor).toBe(25_000 * 2 + 45_000);
  });

  it('cuMasini: mai puține mașini decât microbuzele → felul se cere din nou', () => {
    const r = { nrMasini: '3', tipMasini: 'mixt', nrMicrobuze: '2', pret_0: '20000', pret_1: '50000', pret_2: 'aceeasi' };
    const nou = cuMasini(r, { nrMasini: '2' });
    expect(nou.nrMicrobuze).toBeUndefined();
    const unu = cuMasini({ nrMasini: '2', tipMasini: 'mixt', nrMicrobuze: '1' }, { nrMasini: '1' });
    expect(unu.tipMasini).toBeUndefined();
    expect(cuMasini({ nrMasini: '2', tipMasini: 'toateM2' }, { nrMasini: '1' }).tipMasini).toBe('M2');
  });

  it('contextul provizoriu: glisorul la 40.000 € → 30.000 € pe autoturism, fără să accepte', () => {
    const r = parcurge(EDRIVE_V2, '1', PRINCIPAL.slice(0, 4));
    const d = deruleazaV2(EDRIVE_V2, r, cache);
    const e = ecranulV2(d, 'pret');
    const c = contextProvizoriu(EDRIVE_V2, d, e, { M1: '40000' }, cache);
    expect(c.rezultat.ajutor).toBe(60_000);
    expect(d.acceptate.pret_0).toBeUndefined();
    expect(e.tip === 'intrebare' && e.pas.soapta?.(c, { M1: '40000' })?.text).toBe('Peste 30.000\u00a0€ pe autoturism, diferența o plătește firma.');
    // cifra din card: „până la 60.000 €” înainte de preț, finanțarea cu prețurile de pe glisor
    expect(EDRIVE_V2.cifra(d.ctx, d, e)).toMatchObject({ prefix: 'până la', valoare: 60_000 });
    expect(EDRIVE_V2.cifra(contextProvizoriu(EDRIVE_V2, d, e, { M1: '25000' }, cache), d, e)).toMatchObject({ valoare: 50_000 });
  });

  it('cifra după firmă: 80 de puncte · microîntreprindere', () => {
    const d = deruleazaV2(EDRIVE_V2, parcurge(EDRIVE_V2, '1', [['firma', { v: 'da' }]]), cache);
    const cif = EDRIVE_V2.cifra(d.ctx, d, d.ecrane.at(-1)!);
    expect(cif).toMatchObject({ cheie: 'puncte', valoare: 80, rand: ['de puncte · microîntreprindere'] });
  });

  it('opririle: PFA după firmă; fără mașină de înlocuit → X2', () => {
    expect(ultim(EDRIVE_V2, parcurge(EDRIVE_V2, '5', [['firma', { v: 'da' }]]))).toMatchObject({ tip: 'oprire', cheie: 'oprireFirma' });
    const r = parcurge(EDRIVE_V2, '1', [
      ['firma', { v: 'da' }], ['nrMasini', { n: '1' }], ['tipMasini', { fel: 'M1' }], ['vechi', { v: 'nu' }], ['promisiune', { v: 'nu' }],
    ]);
    expect(ultim(EDRIVE_V2, r)).toMatchObject({ tip: 'oprire', cheie: 'oprireVechi' });
  });

  it('firma: „Nu” → „Ce nu se potrivește?” (din v1)', () => {
    const e = ultim(EDRIVE_V2, parcurge(EDRIVE_V2, '1', [['firma', { v: 'corectez' }]]));
    expect(e).toMatchObject({ tip: 'intrebare', cheie: 'corectez', text: 'Ce nu se potrivește?' });
  });
});

describe('SME Eco-Tech v2', () => {
  it('parcursul principal: verzi + alte, glisoarele la pornire → R-ok (267.240 lei, verde 64%)', () => {
    const r = parcurge(SME_V2, '21', [['firma', { v: 'da' }], ['cumperi', { v: 'verde,alte' }], ['sume', { verde: '450000', alte: '250000' }]]);
    expect(r).toMatchObject({ cumperi: 'verde,alte', verde: '450000', alte: '250000' });
    const d = deruleazaV2(SME_V2, r, cache);
    expect(d.ecrane.at(-1)?.tip).toBe('rezultat');
    expect(d.ctx.rezultat.status).toBe('ok');
    expect(d.ctx.rezultat.credit).toBe(432_760);
    const cif = SME_V2.cifra(d.ctx, d, d.ecrane.at(-1)!);
    expect(cif).toMatchObject({ valoare: 267_240, gri: false, indicator: { eticheta: 'Verde: 64%', ok: true, sub: null } });
    expect(d.rezumat.map((b) => b.text)).toEqual(['verzi, alte echipamente', 'verzi 450.000', 'alte 250.000 lei']);
    expect(deruleaza(SCENARIU_SME, r, cache).gata).toBe(true);
  });

  it('R-proiect: rămâi pe ecranul sumelor; „Aplică” → verzi 303.100 → R-ok', () => {
    const r = parcurge(SME_V2, '21', [
      ['firma', { v: 'da' }], ['cumperi', { v: 'verde,alte,soft' }], ['sume', { verde: '300000', alte: '350000', soft: '20000' }],
    ]);
    const d = deruleazaV2(SME_V2, r, cache);
    const e = d.ecrane.at(-1)!;
    expect(e).toMatchObject({ cheie: 'sume', blocat: true });
    expect(d.acceptate.verde).toBeUndefined();
    const v = { verde: '300000', alte: '350000', soft: '20000' };
    const c = contextProvizoriu(SME_V2, d, e, v, cache);
    expect(c.rezultat.status).toBe('proiect');
    expect(SME_V2.cifra(c, d, e)).toMatchObject({ gri: true, indicator: { sub: 'Proiect: 665.000\u00a0lei · minim 668.100\u00a0lei' } });
    if (e.tip !== 'intrebare') throw new Error('sume');
    expect(e.pas.soapta?.(c, v)).toEqual({ text: 'Cu echipamente verzi de **303.100\u00a0lei**, proiectul se încadrează.', aplica: true });
    const a = e.pas.aplica!(r, v, c);
    expect(a.v.verde).toBe('303100');
    const r2 = scrieV2(d, a.r, 'sume', a.v);
    expect(deruleazaV2(SME_V2, r2, cache).ecrane.at(-1)?.tip).toBe('rezultat');
  });

  it('„Aplică” fără verzi alese: verzile devin alese', () => {
    const r = parcurge(SME_V2, '21', [['firma', { v: 'da' }], ['cumperi', { v: 'alte' }]]);
    const d = deruleazaV2(SME_V2, r, cache);
    const e = d.ecrane.at(-1)!;
    if (e.tip !== 'intrebare') throw new Error('sume');
    const v = { alte: '700000' };
    const a = e.pas.aplica!(r, v, contextProvizoriu(SME_V2, d, e, v, cache));
    expect(a.r.cumperi).toBe('verde,alte');
    expect(Number(a.v.verde)).toBeGreaterThan(0);
  });

  it('opririle și F5', () => {
    expect(ultim(SME_V2, parcurge(SME_V2, '23', [['firma', { v: 'da' }]]))).toMatchObject({ tip: 'oprire' });
    expect(ultim(SME_V2, parcurge(SME_V2, '26', [['firma', { v: 'da' }]]))).toMatchObject({ tip: 'intrebare', cheie: 'ca24' });
  });
});
