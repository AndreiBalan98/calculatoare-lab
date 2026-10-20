'use client';

// O foaie care urcă de jos pe telefon și apare în centru pe desktop (glosarul, trimiterea analizei).

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { RAPID, RESORT, useMiscare } from './miscare';

export function Foaie({
  deschisa, laInchidere, titlu, children, eticheta,
}: { deschisa: boolean; laInchidere: () => void; titlu: string; children: ReactNode; eticheta?: string }) {
  const id = useId();
  const { redus } = useMiscare();
  const panou = useRef<HTMLDivElement>(null);
  const inainte = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!deschisa) return;
    inainte.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const primul = panou.current?.querySelector<HTMLElement>('input, button, a[href], [tabindex]:not([tabindex="-1"])');
      primul?.focus({ preventScroll: true });
    }, 50);
    const tasta = (e: KeyboardEvent) => {
      if (e.key === 'Escape') laInchidere();
      if (e.key === 'Tab' && panou.current) {
        const f = [...panou.current.querySelectorAll<HTMLElement>('input, button, a[href], textarea')].filter((x) => !x.hasAttribute('disabled'));
        if (!f.length) return;
        const [prim, ultim] = [f[0], f[f.length - 1]];
        if (e.shiftKey && document.activeElement === prim) { e.preventDefault(); ultim.focus(); }
        else if (!e.shiftKey && document.activeElement === ultim) { e.preventDefault(); prim.focus(); }
      }
    };
    document.addEventListener('keydown', tasta);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', tasta);
      document.body.style.overflow = overflow;
      inainte.current?.focus({ preventScroll: true });
    };
  }, [deschisa, laInchidere]);

  return (
    <AnimatePresence>
      {deschisa && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-secondary/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: RAPID }}
            onClick={laInchidere}
          />
          <motion.div
            ref={panou}
            role="dialog"
            aria-modal="true"
            aria-labelledby={id}
            className="relative max-h-[88dvh] w-full overflow-y-auto rounded-t-[12px] bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgb(10_18_38/0.18)] sm:max-w-[520px] sm:rounded-card sm:p-7"
            initial={redus ? { opacity: 0 } : { y: '100%', opacity: 0.6 }}
            animate={redus ? { opacity: 1 } : { y: 0, opacity: 1, transition: RESORT }}
            exit={redus ? { opacity: 0 } : { y: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-quaternary sm:hidden" aria-hidden />
            {eticheta && <p className="eticheta-mica">{eticheta}</p>}
            <h2 id={id} className="text-mediu">{titlu}</h2>
            <div className="mt-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
