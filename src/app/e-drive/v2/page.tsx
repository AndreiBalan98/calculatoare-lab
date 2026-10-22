import type { Metadata } from 'next';
import { CalculatorEdriveV2 } from '@/ui/v2/programe';

export const metadata: Metadata = {
  title: 'e-DRIVE · varianta 2 · Laboratorul de calculatoare',
};

export default function EdriveV2Page() {
  return <CalculatorEdriveV2 />;
}
