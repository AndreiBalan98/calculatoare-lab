// Formatarea românească pentru textele conversației.

const NBSP = ' ';

/** 25000 → „25.000 €” (spațiu nedespărțit). */
export function euro(n: number): string {
  return Math.round(n).toLocaleString('ro-RO') + NBSP + '€';
}

/** 2000000 → „2.000.000 lei”. */
export function lei(n: number): string {
  return Math.round(n).toLocaleString('ro-RO') + NBSP + 'lei';
}

/** 80 → „80 de puncte”, 5 → „5 puncte”, 1 → „1 punct”. */
export function puncte(n: number): string {
  if (n === 1) return '1 punct';
  const r = n % 100;
  return n !== 0 && (r === 0 || r >= 20) ? `${n} de puncte` : `${n} puncte`;
}

/** „MUN. BOTOȘANI, STR. …” → „Botoșani” (cu județul ca rezervă). */
export function localitate(adresa: string | null | undefined, judet?: string | null): string {
  const parti = String(adresa || '').split(',').map((s) => s.trim()).filter(Boolean);
  const loc = parti.find((s) => !/^(JUD(\.|EȚUL|ETUL)|JUDEȚ)/i.test(s)) ?? '';
  const fara = loc.replace(/^(MUN(\.|ICIPIUL)|OR[AȘŞ](\.|UL)|ORȘ\.|COM(\.|UNA)|SAT(UL)?|SECTOR(UL)?)\s*/i, '');
  const sursa = fara || judet || '';
  return sursa
    .toLocaleLowerCase('ro-RO')
    .replace(/(^|[\s-])(\p{L})/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase('ro-RO'));
}

/** Pune spațiu nedespărțit între număr și € în textele venite din motor („25.000 €”). */
export function cuSpatiiNedespartite(text: string): string {
  return text.replace(/(\d) (€|lei)/g, `$1${NBSP}$2`);
}
