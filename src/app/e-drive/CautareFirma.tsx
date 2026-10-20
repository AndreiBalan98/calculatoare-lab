'use client';

// Provizoriu (T01): câmp CUI + rezultatul încadrării. Se înlocuiește cu conversația în T02.

import { useState, type FormEvent } from 'react';
import { dinAnaf, type FirmaAnaf, type RaspunsAnaf } from '@/motor/edrive/anaf';
import { evalueazaFirma, type EvaluareFirma } from '@/motor/edrive/incadrare';

type Stare =
  | { tip: 'gol' }
  | { tip: 'caut' }
  | { tip: 'eroare'; mesaj: string }
  | { tip: 'gasit'; firma: FirmaAnaf; evaluare: EvaluareFirma };

function localitate(f: FirmaAnaf): string {
  const loc = (f.adresa || '').split(',')[0].trim();
  return [loc, f.judet ? `jud. ${f.judet}` : ''].filter(Boolean).join(', ') || '—';
}

export default function CautareFirma() {
  const [cui, setCui] = useState('');
  const [stare, setStare] = useState<Stare>({ tip: 'gol' });

  async function cauta(e: FormEvent) {
    e.preventDefault();
    if (!cui.trim()) return;
    setStare({ tip: 'caut' });
    try {
      const res = await fetch(`/api/firma?cui=${encodeURIComponent(cui)}`);
      const j = (await res.json()) as RaspunsAnaf;
      if (!j.ok) setStare({ tip: 'eroare', mesaj: j.mesaj });
      else setStare({ tip: 'gasit', firma: j, evaluare: evalueazaFirma(dinAnaf(j)) });
    } catch {
      setStare({ tip: 'eroare', mesaj: 'Nu am putut face căutarea. Verifică internetul și încearcă din nou.' });
    }
  }

  return (
    <>
      <form onSubmit={cauta} className="mt-6 flex gap-2">
        <label htmlFor="cui" className="sr-only">CUI-ul firmei</label>
        <input
          id="cui"
          name="cui"
          inputMode="numeric"
          autoComplete="off"
          placeholder="ex. RO12345678"
          value={cui}
          onChange={(e) => setCui(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-linie bg-white px-4 py-3 text-lg text-text placeholder:text-text-slab/60 focus:border-bleumarin focus:outline-none"
        />
        <button
          type="submit"
          disabled={stare.tip === 'caut'}
          className="rounded-xl bg-bleumarin px-5 py-3 text-lg font-medium text-white hover:bg-bleumarin-deschis disabled:opacity-60"
        >
          Caută
        </button>
      </form>

      <div aria-live="polite" className="mt-6">
        {stare.tip === 'caut' && <p className="text-text-slab">Caut firma la ANAF…</p>}
        {stare.tip === 'eroare' && (
          <p className="rounded-xl border border-rosu/30 bg-rosu-deschis p-4 text-rosu">{stare.mesaj}</p>
        )}
        {stare.tip === 'gasit' && <Rezultat firma={stare.firma} evaluare={stare.evaluare} />}
      </div>

      <p className="mt-10 text-sm text-text-slab">
        Pentru demo: CUI-urile 1–12 sunt firme inventate (vezi README).
      </p>
    </>
  );
}

function Rezultat({ firma, evaluare }: { firma: FirmaAnaf; evaluare: EvaluareFirma }) {
  const { incadrare, motive, avert, lipsa } = evaluare;
  return (
    <section className="rounded-2xl border border-linie bg-white p-5 shadow-sm" data-testid="firma">
      <h2 className="font-serif text-2xl font-semibold text-bleumarin">{firma.denumire || `CUI ${firma.cui}`}</h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-text-slab">Localitatea</dt>
        <dd>{localitate(firma)}</dd>
        <dt className="text-text-slab">Starea</dt>
        <dd>{firma.stare || '—'}</dd>
        {firma.bilant?.angajati != null && (
          <>
            <dt className="text-text-slab">Angajați</dt>
            <dd>{firma.bilant.angajati} (bilanț {firma.bilant.an})</dd>
          </>
        )}
      </dl>

      {incadrare.status === 'imm' && (
        <p className="mt-4 rounded-xl bg-auriu-deschis p-4 text-bleumarin">
          <span className="font-medium">{incadrare.marime.nume}</span>: pornești cu{' '}
          <strong className="font-serif text-3xl" data-testid="puncte">{incadrare.puncte}</strong> de puncte.
        </p>
      )}
      {incadrare.status === 'incomplet' && motive.length === 0 && (
        <p className="mt-4 rounded-xl bg-hartie p-4">
          Nu avem destule date ca să încadrăm firma. Lipsesc: {[...lipsa].join(', ') || 'câteva cifre din bilanț'}.
        </p>
      )}

      {motive.length > 0 && (
        <div className="mt-4 rounded-xl border border-rosu/30 bg-rosu-deschis p-4 text-rosu" data-testid="oprire">
          <p className="font-medium">Firma nu poate aplica la e-DRIVE:</p>
          <ul className="mt-1 list-disc pl-5">
            {motive.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      )}

      {avert.length > 0 && (
        <ul className="mt-4 list-disc rounded-xl bg-galben-deschis p-4 pl-9 text-sm">
          {avert.map((a) => <li key={a}>{a}</li>)}
        </ul>
      )}
    </section>
  );
}
