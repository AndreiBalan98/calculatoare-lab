import Link from 'next/link';
import { PROGRAM } from '@/scenariu/edrive';
import { Antet, BandaProgram, Subsol } from '@/ui/Rama';

const LABORATOR = {
  categorie: 'Laborator',
  stare: 'În lucru',
  titlu: 'Laboratorul de calculatoare',
  rezumat: 'Aici încercăm calculatoarele de fonduri nerambursabile într-o formă nouă: ca o discuție.',
};

export default function Acasa() {
  return (
    <>
      <Antet />
      <BandaProgram program={LABORATOR} />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8 sm:py-12">
        <ul className="grid gap-4">
          <li>
            <Link href="/e-drive" className="card group block p-5 transition-colors hover:border-primary sm:p-6">
              <span className="flex items-center gap-2">
                <span className="eticheta-mica">{PROGRAM.categorie}</span>
                <span className="rounded-[4px] bg-accent px-1.5 py-px text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{PROGRAM.stare}</span>
              </span>
              <span className="mt-1 block font-serif text-mare font-semibold leading-tight text-primary">e-DRIVE</span>
              <span className="mt-1 block text-senary">mașini electrice pentru IMM-uri</span>
              <span className="mt-4 inline-flex items-center gap-1 font-semibold text-primary group-hover:underline">
                Deschide calculatorul →
              </span>
            </Link>
          </li>
        </ul>
      </main>
      <Subsol />
    </>
  );
}
