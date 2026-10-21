import { afterEach, describe, expect, it, vi } from 'vitest';
import { dinAnaf } from '@/motor/edrive/anaf';
import { evalueazaFirma } from '@/motor/edrive/incadrare';
import { FIRME_DEMO } from '@/motor/edrive/fixtures';
import { FIRME_DEMO_SME } from '@/motor/sme/fixtures';
import { cautaFirma, curataCui } from './firma';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('curataCui()', () => {
  it('scoate RO și spațiile', () => {
    expect(curataCui('RO 123 456')).toBe('123456');
    expect(curataCui('ro12345678')).toBe('12345678');
    expect(curataCui(' 1 ')).toBe('1');
  });
  it('respinge orice altceva', () => {
    expect(curataCui('')).toBeNull();
    expect(curataCui(null)).toBeNull();
    expect(curataCui('12a4')).toBeNull();
    expect(curataCui('-5')).toBeNull();
  });
});

describe('cautaFirma()', () => {
  const rapid = async (p: Promise<unknown>) => {
    await vi.runAllTimersAsync();
    return p;
  };

  it('CUI demo → fixture, fără apel la site', async () => {
    vi.useFakeTimers();
    const f = vi.spyOn(globalThis, 'fetch');
    const r = await rapid(cautaFirma('RO 1', {}));
    expect(r).toEqual({ status: 200, corp: FIRME_DEMO['1'].raspuns });
    expect(f).not.toHaveBeenCalled();
  });

  it('ANAF_MOCK=1 → CUI necunoscut dă negasit', async () => {
    vi.useFakeTimers();
    const f = vi.spyOn(globalThis, 'fetch');
    const r = await rapid(cautaFirma('12345678', { ANAF_MOCK: '1' }));
    expect(r).toMatchObject({ status: 404, corp: { ok: false, cod: 'negasit' } });
    expect(f).not.toHaveBeenCalled();
  });

  it('CUI invalid → 400', async () => {
    expect(await cautaFirma('abc', {})).toMatchObject({ status: 400, corp: { ok: false, cod: 'cui_invalid' } });
  });

  it('CUI real → proxy-ul site-ului, cu același status și același JSON', async () => {
    const corp = { ok: false, cod: 'prea_multe', mesaj: 'Prea multe căutări.' };
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(corp, { status: 429 }));
    const r = await cautaFirma('RO12345678', { ANAF_API_URL: 'https://exemplu.test/firma' });
    expect(f.mock.calls[0][0]).toBe('https://exemplu.test/firma?cui=12345678');
    expect(r).toEqual({ status: 429, corp });
  });

  it('istoric=1 → trimis mai departe proxy-ului (?cui=…&istoric=1)', async () => {
    const corp = { ok: false, cod: 'negasit', mesaj: 'Nu am găsit.' };
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(corp, { status: 404 }));
    const r = await cautaFirma('12345678', { ANAF_API_URL: 'https://exemplu.test/firma' }, true);
    expect(f.mock.calls[0][0]).toBe('https://exemplu.test/firma?cui=12345678&istoric=1');
    expect(r).toEqual({ status: 404, corp });
  });

  it('CUI demo SME → fixture cu bilanțurile pe 3 ani', async () => {
    vi.useFakeTimers();
    const r = await rapid(cautaFirma('26', {}, true));
    expect(r).toEqual({ status: 200, corp: FIRME_DEMO_SME['26'].raspuns });
  });

  it('eroare de rețea → anaf_indisponibil, 503', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    expect(await cautaFirma('12345678', {})).toMatchObject({ status: 503, corp: { ok: false, cod: 'anaf_indisponibil' } });
  });
});

describe('firmele demo dau situațiile promise', () => {
  const ev = (cui: string) => evalueazaFirma(dinAnaf(FIRME_DEMO[cui].raspuns));
  it.each([
    ['1', 80], ['2', 70], ['3', 65], ['10', 80], ['11', 80], ['12', 80],
  ])('CUI %s → %i puncte, fără opriri', (cui, puncte) => {
    expect(ev(cui).incadrare).toMatchObject({ status: 'imm', puncte });
    expect(ev(cui).motive).toEqual([]);
  });
  it.each([
    ['4', /^Firma nu e IMM/], ['5', /^PFA-urile/], ['6', /radiată/], ['7', /INSOLVENȚĂ/], ['8', /CAEN 0111/],
  ])('CUI %s → oprire', (cui, motiv) => {
    expect(ev(cui).motive[0]).toMatch(motiv);
  });
  it('CUI 9 → fără bilanț, încadrarea cere datele', () => {
    expect(ev('9').incadrare.status).toBe('incomplet');
    expect(ev('9').motive).toEqual([]);
  });
  it('CUI 10, 11, 12 → avertismente', () => {
    expect(ev('10').avert[0]).toMatch(/inactivă fiscal/);
    expect(ev('11').avert[0]).toMatch(/negative sau zero/);
    expect(ev('12').avert[0]).toMatch(/Raportul datorii \/ capitaluri proprii e 8/);
  });
});
