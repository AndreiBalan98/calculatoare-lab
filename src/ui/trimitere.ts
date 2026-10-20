// Trimiterea analizei. Deocamdată simulată (~800 ms); în T03 devine un apel la /api/analiza.

import type { Analiza } from '@/scenariu/analiza';

export async function trimiteAnaliza(analiza: Analiza): Promise<void> {
  void analiza;
  await new Promise((r) => setTimeout(r, 800));
}
