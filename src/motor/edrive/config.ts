// Regulile programului e-DRIVE (Măsura 1), portate identic din docs/referinta/edrive-motor-wp.js.

export interface Marime {
  nume: string;
  /** angajați: strict sub */
  ang: number;
  /** cifra de afaceri, cel mult (€) */
  ca: number;
  /** active, cel mult (€) */
  act: number;
  puncte: number;
}

export interface ConfigEdrive {
  /** € fără TVA, maximum pe autoturism (M1); microbuzele (M2) nu au plafon pe vehicul */
  plafonM1: number;
  /** TVA-ul îl suportă firma */
  tva: number;
  /** lei / € (BNR, 31 decembrie), pentru încadrarea ca IMM */
  curs: Record<number, number>;
  /** anul folosit când cifrele sunt introduse manual */
  anCurs: number;
  marimi: Marime[];
  puncteMarime: number;
  bonusUE: number;
  /** datorii / capitaluri proprii; peste: scrisoare de bonitate (neeliminatoriu) */
  raportMax: number;
  /** agricultură primară, pescuit și acvacultură */
  caenExclus: string[];
  maxVehicule: number;
  api: string;
}

export const CONFIG: ConfigEdrive = {
  plafonM1: 30000,
  tva: 0.21,
  curs: { 2024: 4.9741, 2025: 5.0985 },
  anCurs: 2025,
  marimi: [
    { nume: 'Microîntreprindere', ang: 10, ca: 2000000, act: 2000000, puncte: 80 },
    { nume: 'Întreprindere mică', ang: 50, ca: 10000000, act: 10000000, puncte: 70 },
    { nume: 'Întreprindere mijlocie', ang: 250, ca: 50000000, act: 43000000, puncte: 65 },
  ],
  puncteMarime: 80,
  bonusUE: 20,
  raportMax: 7.5,
  caenExclus: ['01', '03'],
  maxVehicule: 10,
  api: '/wp-json/dd/v1/firma?cui=',
};
