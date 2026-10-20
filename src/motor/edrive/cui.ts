// Curățarea CUI-ului, folosită și de ruta /api/firma, și de conversație.

/** Scoate „RO” din față și spațiile; întoarce null dacă rămâne altceva decât cifre. */
export function curataCui(brut: string | null | undefined): string | null {
  const s = String(brut ?? '').replace(/\s/g, '').replace(/^RO/i, '');
  return /^\d{1,10}$/.test(s) ? s : null;
}
