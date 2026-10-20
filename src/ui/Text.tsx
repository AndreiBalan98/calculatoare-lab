'use client';

// Textele din scenariu, cu **îngroșat** și [[cuvinte grele]] (la atingere: explicația din glosar).

import { createContext, useContext, useState, type ReactNode } from 'react';
import { GLOSAR } from '@/scenariu/glosar';
import { TEXTE } from '@/scenariu/edrive';
import { bucati } from '@/scenariu/text';
import { Foaie } from './Foaie';

const GlosarCtx = createContext<(cheie: string) => void>(() => {});

export function GlosarProvider({ children }: { children: ReactNode }) {
  const [cheie, setCheie] = useState<string | null>(null);
  const termen = cheie ? GLOSAR[cheie] : null;
  return (
    <GlosarCtx.Provider value={setCheie}>
      {children}
      <Foaie deschisa={!!termen} laInchidere={() => setCheie(null)} titlu={termen?.titlu ?? ''} eticheta="Pe scurt">
        <p>{termen?.text}</p>
        <button type="button" className="btn-plin mt-5 w-full sm:w-auto" onClick={() => setCheie(null)}>
          {TEXTE.glosarInchide}
        </button>
      </Foaie>
    </GlosarCtx.Provider>
  );
}

export function Text({ text, className }: { text: string; className?: string }) {
  const deschide = useContext(GlosarCtx);
  return (
    <span className={className}>
      {bucati(text).map((b, i) => {
        if (b.tip === 'gros') return <strong key={i} className="font-semibold text-primary">{b.text}</strong>;
        if (b.tip === 'termen' && GLOSAR[b.cheie]) {
          // span cu rol de buton: se rupe pe rânduri ca textul din jur (un <button> nu poate)
          return (
            <span
              key={i}
              role="button"
              tabIndex={0}
              className="termen"
              aria-haspopup="dialog"
              onClick={() => deschide(b.cheie)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  deschide(b.cheie);
                }
              }}
            >
              {b.text}
            </span>
          );
        }
        return <span key={i}>{b.text}</span>;
      })}
    </span>
  );
}
