// Trimiterea analizei (a oricărui calculator). Deocamdată simulată (~800 ms); trimiterea reală
// (un apel la /api/analiza) e un task separat.

export async function trimiteAnaliza(analiza: unknown): Promise<void> {
  void analiza;
  await new Promise((r) => setTimeout(r, 800));
}
