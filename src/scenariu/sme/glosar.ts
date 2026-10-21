// Cuvintele grele din SME Eco-Tech (docs/flux-sme.md §6): în texte se scriu [[cuvânt]] sau
// [[cuvânt afișat|cheie]]. Explicațiile folosesc doar regulile din motor (CONFIG) și specificația.

import { CONFIG } from '@/motor/sme/config';
import { lei } from '../format';
import type { Termen } from '../program';

const [micro, mica, mijlocie] = CONFIG.marimi;
const mil = (n: number) => `${(n / 1_000_000).toLocaleString('ro-RO')} mil. €`;
const procent = (x: number) => `${Math.round(x * 100)}%`;

export const GLOSAR_SME: Record<string, Termen> = {
  imm: {
    titlu: 'IMM',
    text: `Întreprindere mică sau mijlocie: sub ${mijlocie.ang} de angajați și cifră de afaceri de cel mult ${mil(mijlocie.ca)} sau active de cel mult ${mil(mijlocie.act)}. Doar IMM-urile pot aplica la SME Eco-Tech.`,
  },
  microintreprindere: {
    titlu: 'Microîntreprindere',
    text: `Firmă cu sub ${micro.ang} angajați și cifră de afaceri sau active de cel mult ${mil(micro.ca)}. Poate aplica la SME Eco-Tech.`,
  },
  'intreprindere mica': {
    titlu: 'Întreprindere mică',
    text: `Firmă cu sub ${mica.ang} de angajați și cifră de afaceri sau active de cel mult ${mil(mica.ca)}.`,
  },
  'intreprindere mijlocie': {
    titlu: 'Întreprindere mijlocie',
    text: `Firmă cu sub ${mijlocie.ang} de angajați și cifră de afaceri de cel mult ${mil(mijlocie.ca)} sau active de cel mult ${mil(mijlocie.act)}.`,
  },
  'echipamente verzi': {
    titlu: 'Echipamente verzi',
    text: 'Echipamente pentru energie regenerabilă, reciclare sau eficiență energetică: panouri fotovoltaice, pompe de căldură, echipamente de reciclare, centrale și sisteme eficiente.',
  },
  grant: {
    titlu: 'Grant',
    text: 'Bani nerambursabili: nu îi dai înapoi.',
  },
  'credit bancar': {
    titlu: 'Credit bancar',
    text: 'Restul investiției, împrumutat de la o bancă parteneră: Banca Transilvania, BRD, CEC Bank, UniCredit Bank sau ProCredit Bank.',
  },
  deconteaza: {
    titlu: 'Se decontează',
    text: 'Ți se plătește din grant și din credit.',
  },
  'primul venit': {
    titlu: 'Primul venit, primul servit',
    text: 'Nu există punctaj: cererile complete se aprobă în ordinea înscrierii, până se termină bugetul.',
  },
  tva: {
    titlu: 'TVA',
    text: `Taxa pe valoarea adăugată, ${procent(CONFIG.tva)}. Grantul și creditul acoperă prețul fără TVA; TVA-ul îl plătește firma. Software-ul se decontează până la ${lei(CONFIG.softwareMax)}.`,
  },
};
