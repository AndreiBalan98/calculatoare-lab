// REFERINȚĂ (nu se importă): motorul calculatorului SME Eco-Tech de pe site, așa cum rulează azi
// în articolul https://dezvoltaredigitala.ro/finantare-imm-investitii-verzi/ (bloc HTML WordPress,
// JS ES5, 16 oct 2026). Sursa completă (CSS + interfață) e în proiectul mare:
// claude/cod/program-sme-eco-tech.html.
// Aici sunt: CONFIG, funcțiile ajutătoare și calc() (copiate identic dintre LOGIC START / LOGIC END)
// și dinAnaf(j), adaptarea lui aplicaAnaf() de pe site (care scrie în câmpurile formularului) la
// datele pentru calc(). Portarea în TypeScript trebuie să dea ACELEAȘI rezultate pentru aceleași
// intrări (vezi tasks/T06).
//
// Singura diferență de scriere față de site: în norm(), intervalul de diacritice e scris
// [̀-ͯ] (pe site, cu caracterele propriu-zise). Același efect.

var CONFIG = {
  grantProcent: 0.40,      // grantul: cel mult 40% din cheltuielile eligibile
  grantMax: 267240,        // lei (50.000 CHF)
  proiectMin: 668100,      // lei, cheltuieli eligibile fără TVA (grant + credit)
  verdeMin: 0.40,          // energie regenerabilă + deșeuri + eficiență: cel puțin 40% din total
  softwareMax: 15000,      // lei
  tva: 0.21,               // TVA-ul îl plătește firma
  infiintataPana: '2021-12-31',
  anCA: 2024,              // cifra de afaceri trebuie să fie pozitivă în acest an
  curs: { 2023: 4.9746, 2024: 4.9741, 2025: 5.0985 }, // lei / € (BNR, 31 decembrie), pentru încadrarea ca IMM
  anCurs: 2025,            // anul folosit când cifrele sunt introduse manual
  marimi: [                // angajați: strict sub; cifră de afaceri SAU active: cel mult (€)
    { nume: 'Microîntreprindere', ang: 10, ca: 2000000, act: 2000000 },
    { nume: 'Întreprindere mică', ang: 50, ca: 10000000, act: 10000000 },
    { nume: 'Întreprindere mijlocie', ang: 250, ca: 50000000, act: 43000000 }
  ],
  microEligibile: true,    // Ord. 1065/2026 și 1241/2026 (fără pragul de 2 mil. lei); de confirmat în MO 671/2026
  caenExclus: [            // primele cifre ale codului CAEN principal; de verificat cu lista din procedură
    ['01', 'agricultura primară'], ['03', 'pescuitul și acvacultura'], ['12', 'tutunul'], ['19', 'produsele energetice'],
    ['1101', 'băuturile alcoolice'], ['1102', 'băuturile alcoolice'], ['1103', 'băuturile alcoolice'], ['1104', 'băuturile alcoolice'], ['1105', 'băuturile alcoolice'],
    ['2540', 'armamentul'], ['3040', 'armamentul'], ['6491', 'leasingul']
  ],
  termen: '30 decembrie 2026, ora 20:00',
  api: '/wp-json/dd/v1/firma?istoric=1' + String.fromCharCode(38) + 'cui='
};
// LOGIC START
function fmt(n) { return (Math.round(n * 10) / 10).toLocaleString('ro-RO'); }
function lei(n) { return Math.round(n).toLocaleString('ro-RO') + ' lei'; }
function eur(n) { return Math.round(n).toLocaleString('ro-RO') + ' €'; }
function pct(x) { return Math.floor(x * 1000 + 1e-6) / 10; }
function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
// Citește numere scrise românește: 25.000 / 25000 / 12,5
function parseNum(str, bani) {
  var s = String(str === undefined || str === null ? '' : str).replace(/\s/g, '');
  if (s === '') return null;
  if (!/^[0-9.,]+$/.test(s)) return NaN;
  if (s.indexOf(',') !== -1) { s = s.replace(/\./g, '').replace(',', '.'); }
  else if (bani) { if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); }
  if ((s.match(/[.,]/g) || []).length > 1) return NaN;
  var v = parseFloat(s);
  return isNaN(v) ? NaN : v;
}
// '' = ok, 'req' = gol, altfel mesajul de eroare
function verifica(v) {
  if (v === null) return 'req';
  if (isNaN(v)) return 'Scrie doar cifre, de exemplu 25.000.';
  if (v < 0) return 'Valoarea nu poate fi negativă.';
  return '';
}
function calc(d) {
  var r = { status: 'ok', err: {}, motive: [], lipsa: [], avert: [], tips: [], probleme: [], marime: null,
    total: 0, verdePct: 0, grant: 0, credit: 0, tvaSuma: 0, nedecontat: 0, proprii: 0, verdeNou: null,
    curs: CONFIG.curs[d.an] || CONFIG.curs[CONFIG.anCurs], anCurs: CONFIG.curs[d.an] ? d.an : CONFIG.anCurs };
  // Forma juridică
  if (!d.forma) r.lipsa.push('forma juridică');
  else if (d.forma === 'pfa') r.motive.push('PFA-urile și întreprinderile individuale sau familiale nu pot aplica; programul e doar pentru societăți.');
  else if (d.forma === 'alta') r.motive.push('Pot aplica doar societățile (SRL, SA etc.), cu capital integral privat.');
  // Starea de la ANAF
  if (d.anaf) {
    if (d.anaf.radiat) r.motive.push('Firma apare radiată la ANAF.');
    else if (d.anaf.stareRea) r.motive.push('La ANAF, starea firmei este „' + d.anaf.stare + '”. Firmele în insolvență, lichidare sau cu activitatea suspendată nu pot aplica.');
    if (d.anaf.inactiv) r.avert.push('ANAF declară firma inactivă fiscal. Clarifică situația înainte de înscriere.');
  }
  // Vechimea
  if (!d.data) r.lipsa.push('data înființării');
  else if (d.data > CONFIG.infiintataPana) r.motive.push('Firma trebuie să fie înființată cel târziu pe 31 decembrie 2021.');
  // CAEN
  var caen = String(d.caen || '').replace(/\D/g, '');
  if (caen.length >= 2) {
    for (var c = 0; c < CONFIG.caenExclus.length; c++) {
      if (caen.indexOf(CONFIG.caenExclus[c][0]) === 0) { r.motive.push('Codul CAEN ' + caen + ' ține de un domeniu exclus din program (' + CONFIG.caenExclus[c][1] + ').'); break; }
    }
  }
  // Mărimea firmei
  r.err.ang = verifica(d.ang);
  if (!r.err.ang) { if (d.ang % 1 !== 0) r.err.ang = 'Scrie un număr întreg.'; }
  r.err.ca = verifica(d.ca);
  r.err.act = verifica(d.act);
  if (r.err.ca === 'req') { if (r.err.act === '') r.err.ca = ''; }
  if (r.err.act === 'req') { if (r.err.ca === '') r.err.act = ''; }
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
    else if (i === 0) { if (!CONFIG.microEligibile) r.motive.push('Microîntreprinderile nu pot aplica.'); }
  } }
  // Cifra de afaceri 2024
  r.err.ca24 = verifica(d.ca24);
  if (r.err.ca24 === 'req') r.lipsa.push('cifra de afaceri ' + CONFIG.anCA);
  else if (!r.err.ca24) { if (d.ca24 <= 0) r.motive.push('Firma trebuie să fi avut cifră de afaceri în ' + CONFIG.anCA + '.'); }
  // Investiția
  ['verde', 'alte', 'soft'].forEach(function (k) { r.err[k] = verifica(d[k]); if (r.err[k] === 'req') r.err[k] = ''; });
  var v = d.verde || 0, a = d.alte || 0, s = d.soft || 0;
  if (r.err.verde) v = 0;
  if (r.err.alte) a = 0;
  if (r.err.soft) s = 0;
  var softElig = Math.min(s, CONFIG.softwareMax);
  r.nedecontat = s - softElig;
  r.total = v + a + softElig;
  if (r.total <= 0) { if (!(r.err.verde || r.err.alte || r.err.soft)) r.lipsa.push('ce vrei să cumperi'); }
  if (r.total > 0) {
    r.verdePct = v / r.total;
    r.grant = Math.min(r.total * CONFIG.grantProcent, CONFIG.grantMax);
    r.credit = r.total - r.grant;
    r.tvaSuma = (v + a + s) * CONFIG.tva;
    r.proprii = r.tvaSuma + r.nedecontat;
    if (r.total < CONFIG.proiectMin) r.probleme.push('Investiția eligibilă e de ' + lei(r.total) + '. Minimul programului e ' + lei(CONFIG.proiectMin) + '.');
    if (r.verdePct < CONFIG.verdeMin - 1e-9) r.probleme.push('Echipamentele verzi sunt ' + pct(r.verdePct).toLocaleString('ro-RO') + '% din investiție. Minimul e 40%.');
    // Cât trebuie să ajungă echipamentele verzi ca să se îndeplinească ambele condiții
    var rest = a + softElig;
    var nou = Math.max(v, CONFIG.proiectMin - rest, Math.ceil(rest * CONFIG.verdeMin / (1 - CONFIG.verdeMin) - 1e-6));
    if (nou > v) {
      r.verdeNou = nou;
      r.tips.push({ text: 'Echipamente verzi de ' + lei(nou) + ' (cu ' + lei(nou - v) + ' mai mult): proiectul se încadrează.', apply: 'verde' });
    }
    if (r.nedecontat > 0) r.tips.push({ text: 'Software-ul se decontează până la ' + lei(CONFIG.softwareMax) + ': diferența de ' + lei(r.nedecontat) + ' o plătești tu.' });
    if (!r.probleme.length) {
      if (r.total > CONFIG.proiectMin) r.tips.push({ text: 'Grantul e la maximum de la ' + lei(CONFIG.proiectMin) + ' în sus. Ce investești peste vine din credit.' });
      r.tips.push({ text: 'Înscrie-te cât mai devreme: primul venit, primul servit. Termenul: ' + CONFIG.termen + '.' });
    }
  }
  // Starea
  var areErr = Object.keys(r.err).some(function (k) { return r.err[k] !== '' ? r.err[k] !== 'req' : false; });
  if (r.motive.length) r.status = 'neeligibil';
  else if (r.lipsa.length || areErr) r.status = 'incomplet';
  else if (r.probleme.length) r.status = 'proiect';
  return r;
}
// LOGIC END

// Pe site, mesajul afișat sub rezultat când statusul e 'ok' (fix, nu vine din calc):
var MAI_VERIFICA = 'Mai verifică: firma nu are datorii la buget (nici eșalonate), capitalul e integral privat, iar codul CAEN al investiției e principal din 1 ianuarie 2022. După finanțare angajezi cel puțin o persoană nouă.';

// Maparea răspunsului ANAF (endpointul /wp-json/dd/v1/firma?istoric=1) pe datele lui calc().
// Adaptarea lui aplicaAnaf() de pe site: acolo valorile trec prin câmpurile formularului
// (sumele se scriu rotunjite la leu, apoi se citesc înapoi), de aceea aici sunt rotunjite.
// Forma pe care ANAF nu o recunoaște rămâne '' (pe site: câmpul „Alege”, completat de om).
// j = răspunsul JSON (vezi docs/referinta/anaf-api.md).
function dinAnaf(j) {
  var d = {};
  d.anaf = { radiat: !!j.radiat, inactiv: !!j.inactiv, stare: j.stare || '',
    stareRea: /INSOLV|FALIMENT|LICHID|DIZOLV|SUSPEND|RADIER/.test(norm(j.stare)) };
  var fj = norm((j.forma_juridica || '') + ' ' + (j.forma_organizare || ''));
  if (/PERSOANA FIZICA|INTREPRINDERE INDIVIDUALA|INTREPRINDERE FAMILIALA/.test(fj)) d.forma = 'pfa';
  else if (/COOPERATIV/.test(fj)) d.forma = 'alta';
  else if (/SOCIETATE|RASPUNDERE LIMITATA|PE ACTIUNI/.test(fj)) d.forma = 'soc';
  else d.forma = '';
  d.data = j.data_inregistrare ? String(j.data_inregistrare).slice(0, 10) : '';
  d.caen = j.caen ? String(j.caen) : '';
  var ani = {};
  (j.bilanturi || (j.bilant ? [j.bilant] : [])).forEach(function (b) { if (b) { if (!b.lipsa) ani[b.an] = b; } });
  var b = j.bilant;
  d.an = b ? b.an : null;
  d.ang = null; d.ca = null; d.act = null; d.ca24 = null;
  if (b) {
    if (b.angajati !== null) { if (b.angajati !== undefined) d.ang = Math.round(b.angajati); }
    if (b.cifra_afaceri !== null) { if (b.cifra_afaceri !== undefined) d.ca = Math.round(b.cifra_afaceri); }
    if (b.active !== null) { if (b.active !== undefined) d.act = Math.round(b.active); }
  }
  var b24 = ani[CONFIG.anCA];
  if (b24) { if (b24.cifra_afaceri !== null) { if (b24.cifra_afaceri !== undefined) d.ca24 = Math.round(b24.cifra_afaceri); } }
  return d;
}
