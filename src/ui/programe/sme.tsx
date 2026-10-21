'use client';

// Calculatorul gata de pus în pagină: programul (cu funcții) rămâne pe partea de client.

import { SME } from '@/scenariu/sme';
import { Calculator } from '../ecrane/Calculator';

export function CalculatorSme() {
  return <Calculator program={SME} />;
}
