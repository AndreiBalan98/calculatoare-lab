import type { Metadata } from 'next';
import { CalculatorSmeV2 } from '@/ui/v2/programe';

export const metadata: Metadata = {
  title: 'SME Eco-Tech · varianta 2 · Laboratorul de calculatoare',
};

export default function SmeV2Page() {
  return <CalculatorSmeV2 />;
}
