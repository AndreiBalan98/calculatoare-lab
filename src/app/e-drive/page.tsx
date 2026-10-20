import type { Metadata } from 'next';
import Link from 'next/link';
import CautareFirma from './CautareFirma';

export const metadata: Metadata = {
  title: 'e-DRIVE · Laboratorul de calculatoare',
};

// Provizoriu (T01): dovedește lanțul CUI → ANAF → motor. Conversația vine în T02.
export default function EdrivePage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <Link href="/" className="text-sm text-text-slab hover:underline">← Laboratorul</Link>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-bleumarin">e-DRIVE</h1>
      <p className="mt-1 text-text-slab">Mașini electrice pentru IMM-uri. Scrie CUI-ul firmei.</p>
      <CautareFirma />
    </main>
  );
}
