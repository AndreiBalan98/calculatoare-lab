'use client';

// „Trimite-ne analiza”: numele și telefonul (emailul opțional) + ce pleacă. Trimiterea e simulată (T03).

import { useState, type FormEvent } from 'react';
import { construiesteAnaliza, type Analiza } from '@/scenariu/analiza';
import type { Derulare } from '@/scenariu/derulare';
import { TRIMITERE } from '@/scenariu/edrive';
import { euro, puncte } from '@/scenariu/format';
import { Foaie } from '../Foaie';
import { trimiteAnaliza } from '../trimitere';

export function FoaieTrimitere({
  deschisa, laInchidere, derulare, laTrimisa,
}: { deschisa: boolean; laInchidere: () => void; derulare: Derulare; laTrimisa: (a: Analiza) => void }) {
  const [nume, setNume] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [erori, setErori] = useState<{ nume?: string; telefon?: string; email?: string }>({});
  const [seTrimite, setSeTrimite] = useState(false);
  const { ctx } = derulare;
  const r = ctx.rezultat;

  const trimite = async (e: FormEvent) => {
    e.preventDefault();
    const err: typeof erori = {};
    if (!nume.trim()) err.nume = TRIMITERE.eroareNume;
    if (telefon.replace(/\D/g, '').length < 10) err.telefon = TRIMITERE.eroareTelefon;
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) err.email = TRIMITERE.eroareEmail;
    setErori(err);
    if (Object.keys(err).length) return;
    setSeTrimite(true);
    const analiza = construiesteAnaliza({ derulare, contact: { nume, telefon, email } });
    await trimiteAnaliza(analiza);
    setSeTrimite(false);
    laTrimisa(analiza);
  };

  const camp = (id: 'nume' | 'telefon' | 'email', eticheta: string, valoare: string, set: (v: string) => void, extra: object) => (
    <div>
      <label htmlFor={`trimite-${id}`} className="mb-1 block text-[15px] font-semibold text-primary">{eticheta}</label>
      <input
        id={`trimite-${id}`}
        value={valoare}
        onChange={(e) => {
          set(e.target.value);
          setErori((x) => ({ ...x, [id]: undefined }));
        }}
        aria-invalid={!!erori[id]}
        aria-describedby={erori[id] ? `trimite-${id}-eroare` : undefined}
        className="camp"
        {...extra}
      />
      {erori[id] && <p id={`trimite-${id}-eroare`} className="mt-1 text-sm text-eroare">{erori[id]}</p>}
    </div>
  );

  return (
    <Foaie deschisa={deschisa} laInchidere={laInchidere} titlu={TRIMITERE.titlu}>
      <p className="text-senary">{TRIMITERE.intro}</p>
      <form onSubmit={trimite} className="mt-4 flex flex-col gap-3" noValidate>
        {camp('nume', TRIMITERE.nume, nume, setNume, { autoComplete: 'name', enterKeyHint: 'next' })}
        {camp('telefon', TRIMITERE.telefon, telefon, setTelefon, { type: 'tel', inputMode: 'tel', autoComplete: 'tel', enterKeyHint: 'next' })}
        {camp('email', TRIMITERE.email, email, setEmail, { type: 'email', inputMode: 'email', autoComplete: 'email', enterKeyHint: 'send' })}

        <div className="mt-1 rounded-card bg-tertiary p-3.5 text-[15px]">
          <p className="eticheta-mica">{TRIMITERE.rezumat}</p>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            <li>{ctx.firma?.denumire ?? `CUI ${ctx.cui ?? '—'}`}{r.marime ? ` · ${r.marime.nume}` : ''}</li>
            <li>{puncte(r.total)} · finanțare până la {euro(r.ajutor)}</li>
            <li>{ctx.masini.length} {ctx.masini.length === 1 ? 'mașină' : 'mașini'} · răspunsurile tale și rezultatul</li>
          </ul>
        </div>

        <button type="submit" disabled={seTrimite} className="btn-plin mt-1 w-full">
          {seTrimite ? TRIMITERE.seTrimite : TRIMITERE.buton}
        </button>
      </form>
    </Foaie>
  );
}
