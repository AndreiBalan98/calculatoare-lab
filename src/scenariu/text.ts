// Marcajele din textele scenariului: **îngroșat** și [[cuvânt]] / [[cuvânt afișat|cheie]] (glosar).

import { norm } from '@/motor/edrive/calc';
import { cuSpatiiNedespartite } from './format';

export type Bucata =
  | { tip: 'text'; text: string }
  | { tip: 'gros'; text: string }
  | { tip: 'termen'; text: string; cheie: string };

const MARCAJ = /\*\*(.+?)\*\*|\[\[(.+?)(?:\|(.+?))?\]\]/g;

export function bucati(text: string): Bucata[] {
  const s = cuSpatiiNedespartite(text);
  const rez: Bucata[] = [];
  let ultim = 0;
  for (const m of s.matchAll(MARCAJ)) {
    if (m.index > ultim) rez.push({ tip: 'text', text: s.slice(ultim, m.index) });
    if (m[1] !== undefined) rez.push({ tip: 'gros', text: m[1] });
    else rez.push({ tip: 'termen', text: m[2], cheie: m[3] ?? norm(m[2]).toLowerCase() });
    ultim = m.index + m[0].length;
  }
  if (ultim < s.length) rez.push({ tip: 'text', text: s.slice(ultim) });
  return rez;
}

/** Textul fără marcaje (pentru email, aria-label). */
export function faraMarcaje(text: string): string {
  return bucati(text).map((b) => b.text).join('');
}
