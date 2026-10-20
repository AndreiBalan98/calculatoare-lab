// Schimbările stării conversației (funcții pure): răspunsurile vechi rămân cât timp sunt valabile.

import type { Raspunsuri } from './context';
import type { Scenariu } from './tipuri';

/** Unde ținem răspunsul de dinainte al unei întrebări redeschise (pentru precompletare). */
export const anterior = (pas: string) => `anterior:${pas}`;

function pasCui(s: Scenariu) {
  for (const p of s) if (p.tip === 'cui') return p;
  return null;
}

/** Răspunde la un pas. La un CUI nou se uită răspunsurile care țin de firma veche. */
export function raspunde(s: Scenariu, r: Raspunsuri, pas: string, valoare: string): Raspunsuri {
  const vechi = r[pas] ?? r[anterior(pas)];
  const nou = { ...r, [pas]: valoare };
  delete nou[anterior(pas)];
  const cui = pasCui(s);
  if (cui && pas === cui.id && vechi !== valoare) for (const k of cui.reseteaza) delete nou[k];
  return nou;
}

/** Redeschide o întrebare; răspunsurile de după ea rămân și se refolosesc dacă sunt încă valabile. */
export function redeschide(r: Raspunsuri, pas: string): Raspunsuri {
  const nou = { ...r };
  if (r[pas] !== undefined) nou[anterior(pas)] = r[pas];
  delete nou[pas];
  return nou;
}

/** Înapoi la CUI, cu firma uitată. */
export function altCui(s: Scenariu, r: Raspunsuri): Raspunsuri {
  const cui = pasCui(s);
  if (!cui) return r;
  const nou = { ...r };
  delete nou[cui.id];
  delete nou[anterior(cui.id)];
  for (const k of cui.reseteaza) delete nou[k];
  return nou;
}

/** „Aplică” la sfatul UE: toate mașinile asamblate în UE. */
export function toateUE(r: Raspunsuri): Raspunsuri {
  const nou = { ...r };
  for (const k of Object.keys(nou)) if (/^ue_\d+$/.test(k)) nou[k] = 'da';
  return nou;
}
