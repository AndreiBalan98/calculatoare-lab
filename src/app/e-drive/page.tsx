import type { Metadata } from 'next';
import { Calculator } from '@/ui/ecrane/Calculator';

export const metadata: Metadata = {
  title: 'e-DRIVE · mașini electrice pentru IMM-uri · Laboratorul de calculatoare',
};

export default function EdrivePage() {
  return <Calculator />;
}
