// Regulile programului SME Eco-Tech, portate identic din docs/referinta/sme-motor-wp.js.

export interface MarimeSme {
  nume: string;
  /** angajați: strict sub */
  ang: number;
  /** cifra de afaceri, cel mult (€) */
  ca: number;
  /** active, cel mult (€) */
  act: number;
}

export interface ConfigSme {
  /** grantul: cel mult această parte din cheltuielile eligibile */
  grantProcent: number;
  /** lei (50.000 CHF) */
  grantMax: number;
  /** lei, cheltuieli eligibile fără TVA (grant + credit) */
  proiectMin: number;
  /** energie regenerabilă + deșeuri + eficiență: cel puțin această parte din total */
  verdeMin: number;
  /** lei */
  softwareMax: number;
  /** TVA-ul îl plătește firma */
  tva: number;
  infiintataPana: string;
  /** cifra de afaceri trebuie să fie pozitivă în acest an */
  anCA: number;
  /** lei / € (BNR, 31 decembrie), pentru încadrarea ca IMM */
  curs: Record<number, number>;
  /** anul folosit când cifrele sunt introduse manual */
  anCurs: number;
  marimi: MarimeSme[];
  microEligibile: boolean;
  /** primele cifre ale codului CAEN principal și domeniul */
  caenExclus: [string, string][];
  termen: string;
  api: string;
}

export const CONFIG: ConfigSme = {
  grantProcent: 0.40,
  grantMax: 267240,
  proiectMin: 668100,
  verdeMin: 0.40,
  softwareMax: 15000,
  tva: 0.21,
  infiintataPana: '2021-12-31',
  anCA: 2024,
  curs: { 2023: 4.9746, 2024: 4.9741, 2025: 5.0985 },
  anCurs: 2025,
  marimi: [
    { nume: 'Microîntreprindere', ang: 10, ca: 2000000, act: 2000000 },
    { nume: 'Întreprindere mică', ang: 50, ca: 10000000, act: 10000000 },
    { nume: 'Întreprindere mijlocie', ang: 250, ca: 50000000, act: 43000000 },
  ],
  microEligibile: true,
  caenExclus: [
    ['01', 'agricultura primară'], ['03', 'pescuitul și acvacultura'], ['12', 'tutunul'], ['19', 'produsele energetice'],
    ['1101', 'băuturile alcoolice'], ['1102', 'băuturile alcoolice'], ['1103', 'băuturile alcoolice'], ['1104', 'băuturile alcoolice'], ['1105', 'băuturile alcoolice'],
    ['2540', 'armamentul'], ['3040', 'armamentul'], ['6491', 'leasingul'],
  ],
  termen: '30 decembrie 2026, ora 20:00',
  api: '/wp-json/dd/v1/firma?istoric=1&cui=',
};

/** Pe site, mesajul afișat sub rezultat când statusul e 'ok' (fix, nu vine din calc). */
export const MAI_VERIFICA = 'Mai verifică: firma nu are datorii la buget (nici eșalonate), capitalul e integral privat, iar codul CAEN al investiției e principal din 1 ianuarie 2022. După finanțare angajezi cel puțin o persoană nouă.';
