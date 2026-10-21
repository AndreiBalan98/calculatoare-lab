'use client';

// Calculatorul gata de pus în pagină: programul (cu funcții) rămâne pe partea de client.

import { EDRIVE } from '@/scenariu/edrive';
import { Calculator } from '../ecrane/Calculator';

export function CalculatorEdrive() {
  return <Calculator program={EDRIVE} />;
}
