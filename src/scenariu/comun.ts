// Textele comune tuturor calculatoarelor: contactul, foaia „Trimite-ne analiza”, textele mărunte.

export const CONTACT = {
  telefon: '+40 749 589 848',
  tel: 'tel:+40749589848',
  email: 'contact@dezvoltaredigitala.ro',
};

/** Foaia „Trimite-ne analiza”. */
export const TRIMITERE = {
  titlu: 'Trimite-ne analiza',
  intro: 'Ce primim: firma, răspunsurile tale și rezultatul. Te sunăm noi, fără obligații.',
  nume: 'Numele',
  telefon: 'Telefonul',
  email: 'Emailul (opțional)',
  buton: 'Trimite',
  seTrimite: 'Se trimite…',
  eroareNume: 'Scrie-ți numele, ca să știm cu cine vorbim.',
  eroareTelefon: 'Scrie un număr de telefon, de exemplu 0722 123 456.',
  eroareEmail: 'Emailul nu pare corect.',
};

/** Textele mărunte ale interfeței. */
export const TEXTE = {
  inapoi: '← Înapoi',
  maiPutine: '← 1–4',
  inapoiLaSume: '← înapoi la sumele rotunde',
  ales: 'ales',
  etapaTrecuta: (nume: string) => `Înapoi la etapa ${nume}`,
  trimite: 'Trimite-ne analiza',
  trimisa: 'Analiza a fost trimisă ✓',
  primita: 'Am primit analiza ta. Te sunăm noi.',
  suna: `Sună-ne · ${CONTACT.telefon}`,
  deStiut: 'De știut',
  antrenor: 'Antrenorul',
  aplica: 'Aplică',
};
