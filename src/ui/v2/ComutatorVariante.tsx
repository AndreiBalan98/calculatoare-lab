'use client';

// Pagina de start: comutatorul „Varianta 1 · Varianta 2” (docs/flux-v2.md §5) și cardurile, care
// duc la varianta aleasă. Alegerea se ține în URL (`/?v=1`); implicit varianta 2.

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { DateProgram } from '@/scenariu/program';
import { Insigna } from '../Rama';
import { useMiscare } from '../miscare';

export interface CardCalculator {
  href: string;
  program: DateProgram;
  nume: string;
  despre: string;
}

function Comutator({ varianta }: { varianta: 1 | 2 }) {
  const { layout } = useMiscare();
  const segmente = [
    { v: 1, eticheta: 'Varianta 1', href: '/?v=1' },
    { v: 2, eticheta: 'Varianta 2', href: '/' },
  ] as const;
  return (
    <nav aria-label="Varianta calculatoarelor" className="flex h-12 rounded-camp border border-quaternary bg-white p-1" data-comutator-variante>
      {segmente.map((s) => {
        const activ = s.v === varianta;
        return (
          <Link
            key={s.v}
            href={s.href}
            replace
            scroll={false}
            aria-current={activ ? 'page' : undefined}
            className={`relative flex flex-1 items-center justify-center rounded-[5px] text-[15px] font-semibold transition-colors duration-200 ${activ ? 'text-white' : 'text-primary hover:bg-tertiary'}`}
          >
            {activ && <motion.span layoutId="varianta" transition={layout} className="absolute inset-0 rounded-[5px] bg-primary" aria-hidden />}
            <span className="relative">{s.eticheta}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Comutatorul și cardurile, pentru varianta dată. */
export function Calculatoare({ calculatoare, varianta }: { calculatoare: CardCalculator[]; varianta: 1 | 2 }) {
  return (
    <>
      <Comutator varianta={varianta} />
      <ul className="mt-4 grid gap-4">
        {calculatoare.map((c) => (
          <li key={c.href}>
            <Link href={varianta === 2 ? `${c.href}/v2` : c.href} className="card group block p-5 transition-colors hover:border-primary sm:p-6">
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
    </>
  );
}

/** Varianta din URL (`?v=1`); implicit 2. */
export function CalculatoareDinUrl({ calculatoare }: { calculatoare: CardCalculator[] }) {
  const v = useSearchParams().get('v');
  return <Calculatoare calculatoare={calculatoare} varianta={v === '1' ? 1 : 2} />;
}
