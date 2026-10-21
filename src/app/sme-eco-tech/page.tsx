import type { Metadata } from 'next';
import { CalculatorSme } from '@/ui/programe/sme';

export const metadata: Metadata = {
  title: 'SME Eco-Tech · grant și credit pentru echipamente verzi · Laboratorul de calculatoare',
};

export default function SmePage() {
  return <CalculatorSme />;
}
