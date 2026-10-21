import type { Metadata } from 'next';
import { CalculatorEdrive } from '@/ui/programe/edrive';

export const metadata: Metadata = {
  title: 'e-DRIVE · mașini electrice pentru IMM-uri · Laboratorul de calculatoare',
};

export default function EdrivePage() {
  return <CalculatorEdrive />;
}
