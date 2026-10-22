import { Suspense } from 'react';
import { PROGRAM as EDRIVE } from '@/scenariu/edrive';
import type { DateProgram } from '@/scenariu/program';
import { PROGRAM as SME } from '@/scenariu/sme';
import { Antet, BandaProgram, Subsol } from '@/ui/Rama';
import { Calculatoare, CalculatoareDinUrl, type CardCalculator } from '@/ui/v2/ComutatorVariante';

const LABORATOR: DateProgram = {
  categorie: 'Laborator',
  stare: 'În lucru',
  titlu: 'Laboratorul de calculatoare',
  rezumat: 'Aici încercăm calculatoarele de fonduri nerambursabile într-o formă nouă: ca o discuție.',
};

const CALCULATOARE: CardCalculator[] = [
  { href: '/e-drive', program: EDRIVE, nume: 'e-DRIVE', despre: 'mașini electrice pentru IMM-uri' },
  { href: '/sme-eco-tech', program: SME, nume: 'SME Eco-Tech', despre: 'grant și credit pentru echipamente verzi' },
];

export default function Acasa() {
  return (
    <>
      <Antet />
      <BandaProgram program={LABORATOR} />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8 sm:py-12">
        {/* „Varianta 1 · Varianta 2” (docs/flux-v2.md §5): implicit 2, `/?v=1` pentru prima */}
        <Suspense fallback={<Calculatoare calculatoare={CALCULATOARE} varianta={2} />}>
          <CalculatoareDinUrl calculatoare={CALCULATOARE} />
        </Suspense>
      </main>
      <Subsol />
    </>
  );
}
