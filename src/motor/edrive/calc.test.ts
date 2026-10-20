// Teste „de poveste”: situații reale, citite ușor.

import { describe, expect, it } from 'vitest';
import { calc, type DateEdrive } from './calc';

const firma: DateEdrive = {
  forma: 'soc', caen: '6201', ang: 4, ca: 1_500_000, act: 900_000, dat: 300_000, cap: 200_000,
  vechi: 'da', veh: [], an: 2025, anaf: null,
};

describe('calc(): povești', () => {
  it('micro cu 2 autoturisme asamblate în UE, de 28.000 € → 100 de puncte, 56.000 €', () => {
    const r = calc({ ...firma, veh: [{ cat: 'M1', pret: 28_000, ue: true }, { cat: 'M1', pret: 28_000, ue: true }] });
    expect(r.status).toBe('ok');
    expect(r.marime?.nume).toBe('Microîntreprindere');
    expect(r.total).toBe(100);
    expect(r.ajutor).toBe(56_000);
    expect(r.tvaSuma).toBeCloseTo(11_760);
    expect(r.platesti).toBeCloseTo(11_760);
  });

  it('mijlocie cu un microbuz de 45.000 €, neasamblat în UE → 65 de puncte, fără plafon', () => {
    const r = calc({ ...firma, ang: 120, ca: 100_000_000, act: 80_000_000, veh: [{ cat: 'M2', pret: 45_000, ue: false }] });
    expect(r.status).toBe('ok');
    expect(r.marime?.nume).toBe('Întreprindere mijlocie');
    expect(r.total).toBe(65);
    expect(r.ajutor).toBe(45_000);
    expect(r.tips[0]).toEqual({ text: 'Alege modele asamblate în UE: +20 puncte.', apply: 'ue' });
  });

  it('autoturism de 35.000 € → finanțare plafonată la 30.000 €, diferența o plătește firma', () => {
    const r = calc({ ...firma, veh: [{ cat: 'M1', pret: 35_000, ue: true }] });
    expect(r.ajutor).toBe(30_000);
    expect(r.platesti).toBeCloseTo(5_000 + 35_000 * 0.21);
    expect(r.tips[0].text).toBe('Mașina 1 trece de 30.000 € fără TVA: diferența de 5.000 € o plătești tu.');
  });

  it('PFA → neeligibil', () => {
    const r = calc({ ...firma, forma: 'pfa', veh: [{ cat: 'M1', pret: 20_000, ue: true }] });
    expect(r.status).toBe('neeligibil');
    expect(r.motive[0]).toMatch(/PFA-urile/);
  });

  it('CAEN 0111 (agricultură) → neeligibil', () => {
    const r = calc({ ...firma, caen: '0111', veh: [{ cat: 'M1', pret: 20_000, ue: true }] });
    expect(r.status).toBe('neeligibil');
    expect(r.motive).toEqual(['Codul CAEN 0111 ține de un domeniu exclus (agricultură primară, pescuit sau acvacultură).']);
  });

  it('fără mașini → incomplet, dar mărimea e deja cunoscută', () => {
    const r = calc(firma);
    expect(r.status).toBe('incomplet');
    expect(r.p1).toBe(80);
  });

  it('datorii / capitaluri ≥ 7,5 → avertisment, nu oprire', () => {
    const r = calc({ ...firma, dat: 1_600_000, cap: 200_000, veh: [{ cat: 'M1', pret: 20_000, ue: true }] });
    expect(r.status).toBe('ok');
    expect(r.avert).toEqual(['Raportul datorii / capitaluri proprii e 8, peste 7,5: ai nevoie de o scrisoare de bonitate de la bancă (condiția nu e eliminatorie).']);
  });
});
