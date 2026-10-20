// REFERINȚĂ (nu se importă): motorul calculatorului e-DRIVE de pe site, așa cum rulează azi
// în articolul https://dezvoltaredigitala.ro/e-drive/ (bloc HTML WordPress, JS ES5, 15–16 oct 2026).
// Sursa completă (CSS + interfață) e în proiectul mare: claude/cod/program-edrive.html.
// Aici sunt doar: CONFIG, funcțiile ajutătoare, calc() (între LOGIC START / LOGIC END)
// și maparea răspunsului ANAF pe câmpuri (aplicaAnaf). Portarea în TypeScript trebuie să dea
// ACELEAȘI rezultate pentru aceleași intrări (vezi tasks/T01).

var CONFIG = {
  plafonM1: 30000,        // € fără TVA, maximum pe autoturism (M1); microbuzele (M2) nu au plafon pe vehicul
  tva: 0.21,              // TVA-ul îl suportă firma
  curs: { 2024: 4.9741, 2025: 5.0985 }, // lei / € (BNR, 31 decembrie), pentru încadrarea ca IMM
  anCurs: 2025,           // anul folosit când cifrele sunt introduse manual
  marimi: [               // angajați: strict sub; cifră de afaceri SAU active: cel mult (€)
    { nume: 'Microîntreprindere', ang: 10, ca: 2000000, act: 2000000, puncte: 80 },
    { nume: 'Întreprindere mică', ang: 50, ca: 10000000, act: 10000000, puncte: 70 },
    { nume: 'Întreprindere mijlocie', ang: 250, ca: 50000000, act: 43000000, puncte: 65 }
  ],
  puncteMarime: 80,
  bonusUE: 20,
  raportMax: 7.5,         // datorii / capitaluri proprii; peste: scrisoare de bonitate (neeliminatoriu)
  caenExclus: ['01', '03'], // agricultură primară, pescuit și acvacultură
  maxVehicule: 10,
  api: '/wp-json/dd/v1/firma?cui='
};

// LOGIC START
function clamp(v, max) { return Math.max(0, Math.min(max, v)); }
function fmt(n) { return (Math.round(n * 10) / 10).toLocaleString('ro-RO'); }
function eur(n) { return Math.round(n).toLocaleString('ro-RO') + ' €'; }
function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
// Citește numere scrise românește: 25.000 / 25000 / 12,5; cu neg, acceptă și minus
function parseNum(str, bani, neg) {
  var s = String(str).replace(/\s/g, '');
  if (s === '') return null;
  var minus = false;
  if (neg) { if (s.charAt(0) === '-') { minus = true; s = s.slice(1); } }
  if (!/^[0-9.,]+$/.test(s)) return NaN;
  if (s.indexOf(',') !== -1) { s = s.replace(/\./g, '').replace(',', '.'); }
  else if (bani) { if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); }
  if ((s.match(/[.,]/g) || []).length > 1) return NaN;
  var v = parseFloat(s);
  if (isNaN(v)) return NaN;
  return minus ? -v : v;
}
// '' = ok, 'req' = gol, altfel mesajul de eroare
function verifica(v, poateZero, poateNeg) {
  if (v === null) return 'req';
  if (isNaN(v)) return 'Scrie doar cifre, de exemplu 25.000.';
  if (poateNeg) return '';
  if (v < 0) return 'Valoarea nu poate fi negativă.';
  if (!poateZero) { if (v === 0) return 'Valoarea trebuie să fie mai mare decât 0.'; }
  return '';
}
// d = { forma: ''|'soc'|'pfa'|'alta', caen, ang, ca, act, dat, cap (lei, null = gol),
//       vechi: ''|'da'|'promisiune', veh: [{ cat: 'M1'|'M2', pret (€ fără TVA), ue: bool }],
//       an: anul bilanțului sau null, anaf: { radiat, inactiv, stare, stareRea } sau null }
function calc(d) {
  var r = { status: 'ok', err: {}, motive: [], lipsa: [], avert: [], tips: [], marime: null,
    p1: 0, p2: 0, total: 0, ajutor: 0, fara: 0, tvaSuma: 0, platesti: 0,
    curs: CONFIG.curs[d.an] || CONFIG.curs[CONFIG.anCurs], anCurs: CONFIG.curs[d.an] ? d.an : CONFIG.anCurs };
  // Forma juridică
  if (!d.forma) r.lipsa.push('forma juridică');
  else if (d.forma === 'pfa') r.motive.push('PFA-urile și întreprinderile individuale sau familiale nu pot aplica; programul e doar pentru societăți comerciale.');
  else if (d.forma === 'alta') r.motive.push('Pot aplica doar societățile comerciale (SRL, SA etc.).');
  // Starea de la ANAF
  if (d.anaf) {
    if (d.anaf.radiat) r.motive.push('Firma apare radiată la ANAF.');
    else if (d.anaf.stareRea) r.motive.push('La ANAF, starea firmei este „' + d.anaf.stare + '”. Firmele în insolvență, faliment, lichidare sau cu activitatea suspendată nu pot aplica.');
    if (d.anaf.inactiv) r.avert.push('ANAF declară firma inactivă fiscal. Clarifică situația înainte de depunere.');
  }
  // CAEN
  var caen = String(d.caen || '').replace(/\D/g, '');
  if (caen.length >= 2) { if (CONFIG.caenExclus.indexOf(caen.slice(0, 2)) !== -1) r.motive.push('Codul CAEN ' + caen + ' ține de un domeniu exclus (agricultură primară, pescuit sau acvacultură).'); }
  // Mărimea firmei
  r.err.ang = verifica(d.ang, true);
  if (!r.err.ang) { if (d.ang % 1 !== 0) r.err.ang = 'Scrie un număr întreg.'; }
  r.err.ca = verifica(d.ca, true);
  r.err.act = verifica(d.act, true);
  if (r.err.ca === 'req') { if (r.err.act === '') r.err.ca = ''; }
  if (r.err.act === 'req') { if (r.err.ca === '') r.err.act = ''; }
  r.err.dat = verifica(d.dat, true);
  r.err.cap = verifica(d.cap, true, true);
  if (r.err.dat === 'req') r.err.dat = '';
  if (r.err.cap === 'req') r.err.cap = '';
  if (r.err.ang === 'req') r.lipsa.push('numărul de angajați');
  if (r.err.ca === 'req') r.lipsa.push('cifra de afaceri sau activele');
  if (!r.err.ang) { if (!(r.err.ca || r.err.act)) {
    var caE = d.ca === null ? Infinity : d.ca / r.curs;
    var actE = d.act === null ? Infinity : d.act / r.curs;
    for (var i = 0; i < CONFIG.marimi.length; i++) {
      var m = CONFIG.marimi[i];
      if (d.ang < m.ang) { if (caE <= m.ca || actE <= m.act) { r.marime = m; break; } }
    }
    if (!r.marime) r.motive.push('Firma nu e IMM: are 250 de angajați sau mai mult ori depășește 50 mil. € cifră de afaceri și 43 mil. € active.');
  } }
  // Raportul datorii / capitaluri proprii (nu e eliminatoriu)
  if (!r.err.dat) { if (!r.err.cap) { if (d.dat !== null) { if (d.cap !== null) {
    if (d.cap <= 0) r.avert.push('Capitalurile proprii sunt negative sau zero: ai nevoie de o scrisoare de bonitate de la bancă (condiția nu e eliminatorie).');
    else if (d.dat / d.cap >= CONFIG.raportMax) r.avert.push('Raportul datorii / capitaluri proprii e ' + fmt(d.dat / d.cap) + ', peste ' + fmt(CONFIG.raportMax) + ': ai nevoie de o scrisoare de bonitate de la bancă (condiția nu e eliminatorie).');
  } } } }
  // Mașinile înlocuite
  if (!d.vechi) r.lipsa.push('situația mașinilor înlocuite');
  else if (d.vechi === 'promisiune') r.avert.push('Cu promisiunea notarială, cumperi mașina veche de la același vânzător și o înmatriculezi pe firmă înainte de contractul de finanțare. Costul ei nu se decontează; dacă vânzătorul se răzgândește, proiectul cade.');
  // Mașinile electrice
  var areVeh = false, lipsaPret = false, toateUE = true, eligibil = 0;
  d.veh.forEach(function (v, i) {
    var e = verifica(v.pret, false);
    r.err['v' + i] = e;
    if (e === 'req') lipsaPret = true;
    if (e) return;
    areVeh = true;
    r.fara += v.pret;
    eligibil += v.cat === 'M1' ? Math.min(v.pret, CONFIG.plafonM1) : v.pret;
    if (!v.ue) toateUE = false;
    if (v.cat === 'M1') { if (v.pret > CONFIG.plafonM1) r.tips.push({ text: 'Mașina ' + (i + 1) + ' trece de ' + eur(CONFIG.plafonM1) + ' fără TVA: diferența de ' + eur(v.pret - CONFIG.plafonM1) + ' o plătești tu.' }); }
  });
  if (lipsaPret) r.lipsa.push('prețul fiecărei mașini electrice');
  r.ajutor = eligibil;
  r.tvaSuma = r.fara * CONFIG.tva;
  r.platesti = r.fara - r.ajutor + r.tvaSuma;
  // Punctajul
  if (r.marime) r.p1 = r.marime.puncte;
  r.p2 = areVeh ? (toateUE ? CONFIG.bonusUE : 0) : 0;
  r.total = r.p1 + r.p2;
  if (areVeh) { if (!toateUE) r.tips.unshift({ text: 'Alege modele asamblate în UE: +' + CONFIG.bonusUE + ' puncte.', apply: 'ue' }); }
  r.tips.push({ text: 'Pregătește dosarul din timp: la punctaj egal decide ora depunerii.' });
  // Starea
  var areErr = Object.keys(r.err).some(function (k) { return r.err[k] !== ''; });
  if (r.motive.length) r.status = 'neeligibil';
  else if (r.lipsa.length || areErr || !areVeh) r.status = 'incomplet';
  return r;
}
// LOGIC END

// Maparea răspunsului ANAF (endpointul /wp-json/dd/v1/firma) pe datele calculatorului.
// j = răspunsul JSON (vezi docs/referinta/anaf-api.md).
function dinAnaf(j) {
  var d = {};
  d.anaf = { radiat: !!j.radiat, inactiv: !!j.inactiv, stare: j.stare || '',
    stareRea: /INSOLV|FALIMENT|LICHID|DIZOLV|SUSPEND|RADIER/.test(norm(j.stare)) };
  var fj = norm((j.forma_juridica || '') + ' ' + (j.forma_organizare || ''));
  if (/PERSOANA FIZICA|INTREPRINDERE INDIVIDUALA|INTREPRINDERE FAMILIALA/.test(fj)) d.forma = 'pfa';
  else if (/SOCIETATE|RASPUNDERE LIMITATA|PE ACTIUNI/.test(fj)) d.forma = 'soc';
  else d.forma = '';
  d.caen = j.caen ? String(j.caen) : '';
  var b = j.bilant;
  d.an = b ? b.an : null;
  d.ang = b ? (b.angajati !== null ? Math.round(b.angajati) : null) : null;
  d.ca = b ? b.cifra_afaceri : null;
  d.act = b ? b.active : null;
  d.dat = b ? b.datorii : null;
  d.cap = b ? b.capitaluri : null;
  return d;
}
