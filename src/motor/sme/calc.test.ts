import { describe, expect, it } from 'vitest';
import { dinAnaf } from './anaf';
import { calc, type DateSme } from './calc';
import { CONFIG } from './config';
import { alteMaxim, evalueazaFirmaSme, incadrareSme } from './firma';
import { FIRME_DEMO_SME } from './fixtures';

const firma: DateSme = {
  forma: 'soc', anaf: null, data: '2015-04-14', caen: '2562', ang: 6, ca: 1_350_000, act: 980_000, an: 2025, ca24: 1_200_000,
  verde: null, alte: null, soft: null,
};

describe('poveștile din docs/flux-sme.md', () => {
  it('verzi 450.000 + alte 250.000 → ok: grant 267.240, credit 432.760, TVA 147.000, verde 64,2%', () => {
    const r = calc({ ...firma, verde: 450_000, alte: 250_000 });
    expect(r.status).toBe('ok');
    expect(r.grant).toBe(267_240);
    expect(r.credit).toBe(432_760);
    expect(r.tvaSuma).toBe(147_000);
    expect(Math.floor(r.verdePct * 1000) / 10).toBe(64.2);
    expect(r.marime?.nume).toBe('Microîntreprindere');
  });

  it('verzi 300.000 + alte 350.000 + software 20.000 → proiect, verdeNou 303.100', () => {
    const r = calc({ ...firma, verde: 300_000, alte: 350_000, soft: 20_000 });
    expect(r.status).toBe('proiect');
    expect(r.verdeNou).toBe(303_100);
    expect(r.nedecontat).toBe(5_000);
    expect(r.grant).toBe(266_000);
    expect(r.probleme).toEqual(['Investiția eligibilă e de 665.000 lei. Minimul programului e 668.100 lei.']);
    // cu sfatul aplicat, proiectul se încadrează
    expect(calc({ ...firma, verde: 303_100, alte: 350_000, soft: 20_000 }).status).toBe('ok');
  });

  it('înființată în 2023 → neeligibil', () => {
    const r = calc({ ...firma, data: '2023-03-10', verde: 450_000, alte: 250_000 });
    expect(r.status).toBe('neeligibil');
    expect(r.motive).toEqual(['Firma trebuie să fie înființată cel târziu pe 31 decembrie 2021.']);
  });
});

describe('antrenorul de pe „alte echipamente”', () => {
  it.each([450_000, 300_000, 150_000, 700_000, 1, 123_457, 99_999])('verzi %i: la X partea verde ajunge, la X + 1 leu nu', (verde) => {
    const x = alteMaxim(verde);
    const la = calc({ ...firma, verde, alte: x, soft: null });
    const peste = calc({ ...firma, verde, alte: x + 1, soft: null });
    expect(la.verdePct).toBeGreaterThanOrEqual(CONFIG.verdeMin);
    expect(la.probleme.some((p) => p.startsWith('Echipamentele verzi'))).toBe(false);
    expect(peste.verdePct).toBeLessThan(CONFIG.verdeMin);
    expect(peste.probleme.some((p) => p.startsWith('Echipamentele verzi'))).toBe(true);
    expect(Number.isInteger(x)).toBe(true);
  });

  it('cifrele din specificație: 450.000 → 675.000; 300.000 → 450.000', () => {
    expect(alteMaxim(450_000)).toBe(675_000);
    expect(alteMaxim(300_000)).toBe(450_000);
  });

  it('cu software (până la plafon) rămâne mai puțin loc', () => {
    expect(alteMaxim(300_000, 10_000)).toBe(440_000);
    expect(alteMaxim(300_000, 40_000)).toBe(435_000);
  });
});

describe('firma singură', () => {
  const ev = (cui: string) => evalueazaFirmaSme(dinAnaf(FIRME_DEMO_SME[cui].raspuns));

  it('CUI 21: micro, gata, fără lipsuri', () => {
    expect(ev('21')).toEqual({ incadrare: { status: 'imm', marime: CONFIG.marimi[0] }, motive: [], avert: [], lipsa: [], gata: true });
    expect(dinAnaf(FIRME_DEMO_SME['21'].raspuns).ca24).toBe(1_200_000);
  });
  it('CUI 22: întreprindere mijlocie', () => {
    expect(ev('22').incadrare).toEqual({ status: 'imm', marime: CONFIG.marimi[2] });
    expect(ev('22').gata).toBe(true);
  });
  it.each([
    ['23', /^Firma trebuie să fie înființată/],
    ['24', /^Firma trebuie să fi avut cifră de afaceri în 2024/],
    ['25', /^Codul CAEN 1102 .* \(băuturile alcoolice\)/],
    ['28', /^Pot aplica doar societățile/],
  ])('CUI %s → oprire', (cui, motiv) => {
    expect(ev(cui).motive).toHaveLength(1);
    expect(ev(cui).motive[0]).toMatch(motiv);
    expect(ev(cui).gata).toBe(false);
  });
  it('CUI 26: lipsește doar cifra de afaceri 2024', () => {
    expect(ev('26').lipsa).toEqual(['cifra de afaceri 2024']);
    expect(ev('26').motive).toEqual([]);
  });
  it('CUI 27: avertismentul de inactivitate', () => {
    expect(ev('27').avert).toEqual(['ANAF declară firma inactivă fiscal. Clarifică situația înainte de înscriere.']);
    expect(ev('27').gata).toBe(true);
  });
  it('încadrarea doar din mărime', () => {
    expect(incadrareSme({ ang: 300, ca: 1, act: 1, an: null })).toMatchObject({ status: 'neimm' });
    expect(incadrareSme({ ang: null, ca: 1, act: null, an: null })).toEqual({ status: 'incomplet' });
    expect(incadrareSme({ ang: 5, ca: 2_000_000, act: null, an: null })).toEqual({ status: 'imm', marime: CONFIG.marimi[0] });
  });
});
