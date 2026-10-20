import { describe, expect, it } from 'vitest';
import { dinAnaf, type FirmaAnaf } from './anaf';
import { evalueazaFirma, incadrare } from './incadrare';

describe('incadrare()', () => {
  it('micro → 80 de puncte', () => {
    const i = incadrare({ ang: 4, ca: 1_500_000, act: 900_000, an: 2025 });
    expect(i).toMatchObject({ status: 'imm', puncte: 80, anCurs: 2025 });
  });

  it('mică → 70, mijlocie → 65', () => {
    expect(incadrare({ ang: 10, ca: 1_000_000, act: null, an: 2024 })).toMatchObject({ status: 'imm', puncte: 70 });
    expect(incadrare({ ang: 50, ca: 1_000_000, act: null, an: 2024 })).toMatchObject({ status: 'imm', puncte: 65 });
  });

  it('pragul de cifră de afaceri depinde de cursul anului bilanțului', () => {
    // 10.196.000 lei ≈ 1.999.804 € la cursul din 2025 (micro), dar ≈ 2.049.818 € la cel din 2024 (mică)
    expect(incadrare({ ang: 3, ca: 10_196_000, act: 50_000_000, an: 2025 })).toMatchObject({ puncte: 80 });
    expect(incadrare({ ang: 3, ca: 10_196_000, act: 50_000_000, an: 2024 })).toMatchObject({ puncte: 70 });
    // an necunoscut → cursul din 2025
    expect(incadrare({ ang: 3, ca: 10_196_000, act: 50_000_000, an: null })).toMatchObject({ puncte: 80, anCurs: 2025 });
  });

  it('exact la prag, ca în referință: 10.197.000 / 5,0985 dă 2.000.000,0000000002 € → mică, nu micro', () => {
    // Comportamentul referinței (virgulă mobilă), păstrat identic; vezi „Întrebări deschise” în PR.
    expect(incadrare({ ang: 3, ca: 10_197_000, act: 50_000_000, an: 2025 })).toMatchObject({ puncte: 70 });
    // cu cursul din 2024 împărțirea iese exact: 9.948.200 / 4,9741 = 2.000.000 € → micro
    expect(incadrare({ ang: 3, ca: 9_948_200, act: 50_000_000, an: 2024 })).toMatchObject({ puncte: 80 });
  });

  it('250 de angajați → nu e IMM', () => {
    const i = incadrare({ ang: 250, ca: 1_000, act: 1_000, an: 2025 });
    expect(i.status).toBe('neimm');
    if (i.status === 'neimm') expect(i.motiv).toMatch(/^Firma nu e IMM/);
  });

  it('date lipsă sau greșite → incomplet', () => {
    expect(incadrare({ ang: null, ca: null, act: null, an: null })).toEqual({
      status: 'incomplet', lipsa: ['numărul de angajați', 'cifra de afaceri sau activele'], erori: {},
    });
    expect(incadrare({ ang: 3.5, ca: 1, act: null, an: null })).toEqual({
      status: 'incomplet', lipsa: [], erori: { ang: 'Scrie un număr întreg.' },
    });
  });
});

describe('dinAnaf()', () => {
  const firma: FirmaAnaf = {
    ok: true, cui: '12345678', denumire: 'EXEMPLU SRL',
    forma_juridica: 'SOCIETATE COMERCIALĂ CU RĂSPUNDERE LIMITATĂ', forma_organizare: 'PERSOANA JURIDICA',
    caen: '6201', stare: 'INREGISTRAT din data 01.01.2015', inactiv: false, radiat: false,
    bilant: { an: 2025, angajati: 4, cifra_afaceri: 1_500_000, active: 900_000, datorii: 300_000, capitaluri: 200_000 },
  };

  it('mapează o firmă obișnuită', () => {
    expect(dinAnaf(firma)).toEqual({
      anaf: { radiat: false, inactiv: false, stare: 'INREGISTRAT din data 01.01.2015', stareRea: false },
      forma: 'soc', caen: '6201', an: 2025, ang: 4, ca: 1_500_000, act: 900_000, dat: 300_000, cap: 200_000,
    });
  });

  it('recunoaște PFA-ul și starea „rea” (fără diacritice)', () => {
    const d = dinAnaf({ ...firma, forma_juridica: 'PERSOANĂ FIZICĂ AUTORIZATĂ', stare: 'INSOLVENȚĂ din data 01.02.2024' });
    expect(d.forma).toBe('pfa');
    expect(d.anaf.stareRea).toBe(true);
  });

  it('bilanț lipsă → cifrele rămân necompletate', () => {
    const d = dinAnaf({ ...firma, bilant: null });
    expect([d.an, d.ang, d.ca, d.act, d.dat, d.cap]).toEqual([null, null, null, null, null, null]);
  });

  it('evalueazaFirma(): micro → 80 de puncte, fără opriri', () => {
    const e = evalueazaFirma(dinAnaf(firma));
    expect(e.incadrare).toMatchObject({ status: 'imm', puncte: 80 });
    expect(e.motive).toEqual([]);
  });

  it('evalueazaFirma(): radiată → oprire', () => {
    const e = evalueazaFirma(dinAnaf({ ...firma, radiat: true }));
    expect(e.motive).toEqual(['Firma apare radiată la ANAF.']);
  });
});
