import Link from 'next/link';
import { PROGRAM as EDRIVE } from '@/scenariu/edrive';
import type { DateProgram } from '@/scenariu/program';
import { PROGRAM as SME } from '@/scenariu/sme';
import { Antet, BandaProgram, Insigna, Subsol } from '@/ui/Rama';

const LABORATOR: DateProgram = {
  categorie: 'Laborator',
  stare: 'În lucru',
  titlu: 'Laboratorul de calculatoare',
  rezumat: 'Aici încercăm calculatoarele de fonduri nerambursabile într-o formă nouă: ca o discuție.',
};

const CALCULATOARE: { href: string; program: DateProgram; nume: string; despre: string }[] = [
  { href: '/e-drive', program: EDRIVE, nume: 'e-DRIVE', despre: 'mașini electrice pentru IMM-uri' },
  { href: '/sme-eco-tech', program: SME, nume: 'SME Eco-Tech', despre: 'grant și credit pentru echipamente verzi' },
];

export default function Acasa() {
  return (
    <>
      <Antet />
      <BandaProgram program={LABORATOR} />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8 sm:py-12">
        <ul className="grid gap-4">
          {CALCULATOARE.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="card group block p-5 transition-colors hover:border-primary sm:p-6">
                <span className="flex items-center gap-2">
                  <span className="eticheta-mica">{c.program.categorie}</span>
                  <Insigna program={c.program} className="px-1.5 py-px text-[11px]" />
                </span>
                <span className="mt-1 block font-serif text-mare font-semibold leading-tight text-primary">{c.nume}</span>
                <span className="mt-1 block text-senary">{c.despre}</span>
                <span className="mt-4 inline-flex items-center gap-1 font-semibold text-primary group-hover:underline">
                  Deschide calculatorul →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Subsol />
    </>
  );
}
