// Rama paginii, ca pe dezvoltaredigitala.ro: antetul, banda programului, subsolul.

import Link from 'next/link';

import { CONTACT } from '@/scenariu/edrive';

export function Antet() {
  return (
    <header className="bg-primary text-white">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-4 sm:h-16">
        <Link href="/" className="font-serif text-[19px] font-semibold tracking-tight text-white sm:text-[22px]">
          Dezvoltare digitală
        </Link>
        <a href="https://dezvoltaredigitala.ro" className="text-sm text-quinary hover:text-white hover:underline">
          dezvoltaredigitala.ro ↗
        </a>
      </div>
    </header>
  );
}

export interface DateProgram {
  categorie: string;
  stare: string;
  titlu: string;
  rezumat: string;
}

/** Ca `.dd-program-banda` de pe site. */
export function BandaProgram({ program }: { program: DateProgram }) {
  return (
    <section className="border-t border-white/10 bg-primary text-white">
      <div className="mx-auto max-w-[1120px] px-4 pb-8 pt-5 sm:pb-12 sm:pt-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-sm text-quinary">{program.categorie} ›</span>
          <span className="rounded-[4px] bg-accent px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            {program.stare}
          </span>
        </div>
        <h1 className="mt-3 max-w-[820px] text-[30px] text-white sm:text-[40px]">
          {/* cuvintele cu cratimă („e-DRIVE”) nu se rup pe două rânduri */}
          {program.titlu.split(/(\S*-\S*)/).map((b, i) => (b.includes('-') ? <span key={i} className="whitespace-nowrap">{b}</span> : b))}
        </h1>
        <p className="mt-3 max-w-[720px] text-quinary">{program.rezumat}</p>
      </div>
    </section>
  );
}

export function Subsol() {
  return (
    <footer className="mt-auto bg-primary text-quinary">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
          <a href={CONTACT.tel} className="text-white hover:underline">{CONTACT.telefon}</a>
          <a href={`mailto:${CONTACT.email}`} className="text-white hover:underline">{CONTACT.email}</a>
        </div>
        <p>© 2026 C&amp;A Connect S.R.L.</p>
      </div>
    </footer>
  );
}
