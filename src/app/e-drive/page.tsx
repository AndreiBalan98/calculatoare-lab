import type { Metadata } from 'next';
import { PROGRAM } from '@/scenariu/edrive';
import { Antet, BandaProgram, Subsol } from '@/ui/Rama';
import { Conversatie } from '@/ui/conversatie/Conversatie';

export const metadata: Metadata = {
  title: 'e-DRIVE · mașini electrice pentru IMM-uri · Laboratorul de calculatoare',
};

export default function EdrivePage() {
  return (
    <>
      <Antet />
      <BandaProgram program={PROGRAM} />
      <main className="flex-1">
        <Conversatie />
      </main>
      <Subsol />
    </>
  );
}
