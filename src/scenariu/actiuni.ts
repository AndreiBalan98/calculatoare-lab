// Schimbările stării (funcții pure): răspunsurile date rămân cât timp sunt valabile.

import type { ContextBaza, Raspunsuri, Scenariu } from './tipuri';

function pasCui<C extends ContextBaza>(s: Scenariu<C>) {
  for (const p of s.pasi) if (p.tip === 'cui') return p;
  return null;
}

/** Răspunde la un pas. La un CUI nou se uită răspunsurile care țin de firma veche. */
export function raspunde<C extends ContextBaza>(s: Scenariu<C>, r: Raspunsuri, pas: string, valoare: string): Raspunsuri {
  const nou = { ...r, [pas]: valoare };
  const cui = pasCui(s);
  if (cui && pas === cui.id && r[pas] !== valoare) for (const k of cui.reseteaza) delete nou[k];
  return nou;
}

/** „Încearcă alt CUI” / „Am greșit CUI-ul”: înapoi la CUI, cu câmpul gol și firma uitată. */
export function altCui<C extends ContextBaza>(s: Scenariu<C>, r: Raspunsuri): Raspunsuri {
  const cui = pasCui(s);
  if (!cui) return r;
  const nou = { ...r };
  delete nou[cui.id];
  for (const k of cui.reseteaza) delete nou[k];
  return nou;
}

/** e-DRIVE, „Aplică” la sfatul UE: toate mașinile asamblate în UE. */
export function toateUE(r: Raspunsuri): Raspunsuri {
  const nou = { ...r };
  for (const k of Object.keys(nou)) if (/^ue_\d+$/.test(k)) nou[k] = 'da';
  return nou;
}
