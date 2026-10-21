// Logica rutei GET /api/firma: CUI curățat → fixture demo sau proxy-ul ANAF al site-ului
// (cu `istoric=1`, și bilanțurile pe 3 ani).

import type { EroareAnaf, RaspunsAnaf } from '@/motor/anaf';
import { curataCui } from '@/motor/cui';
import { FIRME_DEMO } from '@/motor/edrive/fixtures';
import { FIRME_DEMO_SME } from '@/motor/sme/fixtures';

export { curataCui };

export const ANAF_API_URL_IMPLICIT = 'https://dezvoltaredigitala.ro/wp-json/dd/v1/firma';
const TIMEOUT_MS = 25_000;
const INTARZIERE_DEMO_MS = 600;

export interface RaspunsRuta {
  status: number;
  corp: RaspunsAnaf;
}

const eroare = (status: number, cod: string, mesaj: string): RaspunsRuta => ({
  status,
  corp: { ok: false, cod, mesaj } satisfies EroareAnaf,
});

/** Firmele demo ale tuturor calculatoarelor (1–12 e-DRIVE, 21–28 SME Eco-Tech). */
const DEMO = { ...FIRME_DEMO, ...FIRME_DEMO_SME };

const asteapta = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function cautaFirma(
  cuiBrut: string | null,
  env: Record<string, string | undefined> = process.env,
  /** bilanțurile pe 3 ani (`istoric=1`, pentru SME Eco-Tech) */
  istoric = false,
): Promise<RaspunsRuta> {
  const cui = curataCui(cuiBrut);
  if (!cui) return eroare(400, 'cui_invalid', 'CUI-ul trebuie să conțină doar cifre (poți pune „RO” în față).');

  const demo = DEMO[cui];
  if (demo || env.ANAF_MOCK === '1') {
    await asteapta(INTARZIERE_DEMO_MS);
    if (demo) return { status: 200, corp: demo.raspuns };
    return eroare(404, 'negasit', 'Nu am găsit nicio firmă cu acest CUI.');
  }

  const baza = env.ANAF_API_URL || ANAF_API_URL_IMPLICIT;
  try {
    const res = await fetch(`${baza}?cui=${cui}${istoric ? '&istoric=1' : ''}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const corp = (await res.json()) as RaspunsAnaf;
    if (!corp || typeof corp !== 'object' || typeof corp.ok !== 'boolean') throw new Error('răspuns neașteptat');
    return { status: res.status, corp };
  } catch {
    return eroare(503, 'anaf_indisponibil', 'Nu am putut lua datele de la ANAF acum. Încearcă din nou în câteva minute.');
  }
}
