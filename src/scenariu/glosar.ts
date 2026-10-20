// Cuvintele grele: în texte se scriu [[cuvânt]] sau [[cuvânt afișat|cheie]], iar la atingere
// apare explicația de aici. Explicațiile folosesc doar regulile din motor (CONFIG) și din specificație.

import { CONFIG } from '@/motor/edrive/config';
import { euro } from './format';

const [micro, mica, mijlocie] = CONFIG.marimi;
const mil = (n: number) => `${(n / 1_000_000).toLocaleString('ro-RO')} mil. €`;

export interface Termen {
  titlu: string;
  text: string;
}

export const GLOSAR: Record<string, Termen> = {
  imm: {
    titlu: 'IMM',
    text: `Întreprindere mică sau mijlocie: sub ${mijlocie.ang} de angajați și cifră de afaceri de cel mult ${mil(mijlocie.ca)} sau active de cel mult ${mil(mijlocie.act)}. Doar IMM-urile pot aplica la e-DRIVE.`,
  },
  microintreprindere: {
    titlu: 'Microîntreprindere',
    text: `Firmă cu sub ${micro.ang} angajați și cifră de afaceri sau active de cel mult ${mil(micro.ca)}. Pornește cu ${micro.puncte} de puncte.`,
  },
  'intreprindere mica': {
    titlu: 'Întreprindere mică',
    text: `Firmă cu sub ${mica.ang} de angajați și cifră de afaceri sau active de cel mult ${mil(mica.ca)}. Pornește cu ${mica.puncte} de puncte.`,
  },
  'intreprindere mijlocie': {
    titlu: 'Întreprindere mijlocie',
    text: `Firmă cu sub ${mijlocie.ang} de angajați și cifră de afaceri de cel mult ${mil(mijlocie.ca)} sau active de cel mult ${mil(mijlocie.act)}. Pornește cu ${mijlocie.puncte} de puncte.`,
  },
  autoturism: {
    titlu: 'Autoturism (M1)',
    text: `Mașină pentru persoane, cu cel mult 8 locuri pe lângă șofer. În talon, categoria M1. Finanțarea e de cel mult ${euro(CONFIG.plafonM1)} pe autoturism, fără TVA.`,
  },
  microbuz: {
    titlu: 'Microbuz (M2)',
    text: 'Vehicul pentru persoane, cu mai mult de 8 locuri pe lângă șofer și masa maximă de cel mult 5 tone. În talon, categoria M2. La microbuz nu există plafon pe vehicul.',
  },
  ue: {
    titlu: 'Asamblată în UE',
    text: `Modelul e asamblat într-o fabrică din Uniunea Europeană. Dacă toate mașinile tale sunt asamblate în UE, primești ${CONFIG.bonusUE} de puncte în plus. Verificăm împreună modelul ales.`,
  },
  promisiune: {
    titlu: 'Promisiune notarială',
    text: 'Un act semnat la notar prin care cumperi o mașină pe benzină sau motorină (cu RCA și ITP valabile și anul trecut), ca s-o înlocuiești. O înmatriculezi pe firmă înainte de contractul de finanțare. Costul ei nu se decontează.',
  },
  tva: {
    titlu: 'TVA',
    text: `Taxa pe valoarea adăugată, ${Math.round(CONFIG.tva * 100)}%. Programul finanțează prețul fără TVA; TVA-ul îl plătește firma.`,
  },
  minimis: {
    titlu: 'Minimis',
    text: 'Ajutor de stat de valoare mică: o firmă îl poate primi doar până la un plafon, socotit pe 3 ani.',
  },
};
