'use client';

// Calculatoarele variantei 2, gata de pus în pagină: programul (cu funcții) rămâne pe partea de client.

import { EDRIVE_V2 } from '@/scenariu/v2/edrive';
import { SME_V2 } from '@/scenariu/v2/sme';
import { CalculatorV2 } from './CalculatorV2';

export function CalculatorEdriveV2() {
  return <CalculatorV2 program={EDRIVE_V2} />;
}

export function CalculatorSmeV2() {
  return <CalculatorV2 program={SME_V2} />;
}
