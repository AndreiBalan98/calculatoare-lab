import Link from 'next/link';

export default function Acasa() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-wider text-auriu-text">Dezvoltare Digitală</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-bleumarin sm:text-5xl">Laboratorul de calculatoare</h1>
      <p className="mt-4 text-lg text-text-slab">
        Aici încercăm calculatoarele de fonduri nerambursabile într-o formă nouă, ca o discuție.
      </p>

      <ul className="mt-10 grid gap-4">
        <li>
          <Link
            href="/e-drive"
            className="group block rounded-2xl border border-linie bg-white p-6 shadow-sm transition hover:border-auriu hover:shadow-md"
          >
            <span className="font-serif text-2xl font-semibold text-bleumarin">e-DRIVE</span>
            <span className="mt-1 block text-text-slab">mașini electrice pentru IMM-uri</span>
            <span className="mt-4 inline-block font-medium text-bleumarin group-hover:underline">Deschide →</span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
