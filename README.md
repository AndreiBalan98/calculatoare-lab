# calculatoare-lab

Laboratorul pentru calculatoarele de fonduri nerambursabile ale [dezvoltaredigitala.ro](https://dezvoltaredigitala.ro), în formă conversațională: **e-DRIVE** (`/e-drive`, mașini electrice pentru IMM-uri) și **SME Eco-Tech** (`/sme-eco-tech`, grant și credit pentru echipamente verzi). Fiecare are și **varianta 2 „Cifra vie”** (`/e-drive/v2`, `/sme-eco-tech/v2`, [`docs/flux-v2.md`](docs/flux-v2.md)): aceleași motoare, altă interfață; pe `/`, comutatorul „Varianta 1 · Varianta 2” (implicit 2, `/?v=1` pentru prima). Cum lucrăm: [`CLAUDE.md`](CLAUDE.md) și [`tasks/README.md`](tasks/README.md).

## Rulezi local

Ai nevoie de Node.js 20 sau mai nou.

```bash
npm install
npm run dev          # http://localhost:3000
```

Variabile de mediu (opționale): vezi [`.env.example`](.env.example).

## Testele

```bash
npm test             # Vitest: motoarele (cu testarea diferențială față de motoarele de pe site) și scenariile
npm run lint
npm run build
npm run test:e2e     # Playwright (Chromium), pe telefon 390×844 și desktop 1280×800
CAPTURI=1 CAPTURI_DIR=T06 npm run test:e2e -- e2e/sme.spec.ts   # salvează și capturile în docs/capturi/T06/
CAPTURI=1 CAPTURI_DIR=T07 npm run test:e2e -- e2e/v2.spec.ts e2e/v2-video.spec.ts   # varianta 2 + video
```

`test:e2e` face singur build-ul și pornește serverul pe portul 3100, în modul simulat (`ANAF_MOCK=1`), pe telefon (390×844 și 360×740) și desktop (1280×800).

## Structura

```
src/
  motor/          regulile în TypeScript pur, câte un director pe program, + testele
    edrive/       e-DRIVE (config, calc, anaf, incadrare); fixtures/ = firmele demo 1–12
    sme/          SME Eco-Tech (config, calc, anaf, firma); fixtures/ = firmele demo 21–28
    anaf.ts       răspunsul API-ului firmei (comun)
  scenariu/       calculatoarele ca date
    edrive.ts     e-DRIVE: ecranele, toate textele și obiectul „program” (context.ts, glosar.ts, analiza.ts)
    sme.ts        SME Eco-Tech, la fel (sme/context.ts, sme/glosar.ts, sme/analiza.ts)
    tipuri.ts, derulare.ts, program.ts …   comune: formatul pașilor, răspunsuri → drumul de ecrane
    v2/           varianta 2: pașii noi (edrive.ts, sme.ts), cu aceleași chei de răspuns ca v1, și derularea lor
  ui/             rama site-ului; ui/ecrane: un ecran = o întrebare, progresul de sus (Framer Motion),
                  comune tuturor calculatoarelor; ui/programe: câte un fișier pe calculator;
                  ui/v2: varianta 2 (cardul cifrei, controalele, scena, rezultatul, orchestrarea)
  app/            paginile (/, /e-drive, /sme-eco-tech, …/v2) și ruta GET /api/firma
e2e/              testele Playwright
```

## Cum adaugi un calculator nou

Ecranele, progresul, rezultatul, drumul până la bani și foaia de trimitere sunt comune; un calculator nou aduce doar regulile, întrebările și textele:

1. **Motorul**, în `src/motor/<program>/`: `config.ts` și `calc.ts` portate identic din referința de pe site, `anaf.ts` (răspunsul ANAF → datele lui `calc`) și testarea diferențială (ca în `src/motor/sme/diferential.test.ts`).
2. **Contextul**: o funcție `(răspunsuri, răspunsurile ANAF) → context`, cu datele pentru motor și `calc()` pe ce știm până acolo (ca `src/scenariu/sme/context.ts`).
3. **Scenariul și obiectul „program”**, în `src/scenariu/<program>.ts`: etapele progresului, pașii (aceleași tipuri: `cui`, `cardFirma`, `alegere`, `multipla`, `suma`, `oprire`, `rezultat`), rândul din progres (`rand`), ecranul de rezultat (`rezultat`, o `VedereRezultat`), „Aplică” (`aplica`), drumul până la bani, glosarul și analiza trimisă. Tipul `Program` e în `src/scenariu/program.ts`.
4. **Pagina**: un fișier în `src/ui/programe/` (`<Calculator program={…} />`), o pagină în `src/app/<program>/` și un card pe `/` (`src/app/page.tsx`).

## Cum schimbi întrebările

Totul e în [`src/scenariu/edrive.ts`](src/scenariu/edrive.ts) și [`src/scenariu/sme.ts`](src/scenariu/sme.ts) (instrucțiunile sunt în capul fișierelor): textele, ecoul, antrenorul, ordinea ecranelor, butoanele, condițiile. `**îngroșat**`, `[[cuvânt|cheie]]` = cuvânt subliniat cu explicație din glosarul programului ([`glosar.ts`](src/scenariu/glosar.ts), [`sme/glosar.ts`](src/scenariu/sme/glosar.ts)). Cifrele vin mereu din motor.

## Ruta `GET /api/firma?cui=`

Curăță CUI-ul (scoate „RO” și spațiile), apoi cheamă proxy-ul ANAF al site-ului (`ANAF_API_URL`, implicit `https://dezvoltaredigitala.ro/wp-json/dd/v1/firma`) și întoarce același status și același JSON. Cu `&istoric=1` (SME Eco-Tech) îl trimite mai departe (`?cui=…&istoric=1`), ca site-ul să dea și bilanțurile pe 3 ani (`bilanturi`). Dacă site-ul nu răspunde în 25 s: `503 { ok:false, cod:'anaf_indisponibil' }`. Contractul: [`docs/referinta/anaf-api.md`](docs/referinta/anaf-api.md).

## CUI-urile demo

Firme inventate, servite **întotdeauna** din `src/motor/edrive/fixtures/` (1–12) și `src/motor/sme/fixtures/` (21–28), fără apel la site (cu o întârziere de ~600 ms, ca să pară real). Cu `ANAF_MOCK=1`, orice alt CUI dă „negasit”.

| CUI | Firma | Ce arată |
|---|---|---|
| `1` | DEMO MICRO SRL | micro, totul în regulă (80 de puncte) |
| `2` | DEMO MICĂ TRANSPORT SRL | întreprindere mică (70 de puncte) |
| `3` | DEMO MIJLOCIE DISTRIBUȚIE SA | întreprindere mijlocie (65 de puncte) |
| `4` | DEMO MARE INDUSTRIE SA | peste IMM (300 de angajați): oprire |
| `5` | POPESCU ION PERSOANĂ FIZICĂ AUTORIZATĂ | PFA: oprire |
| `6` | DEMO RADIATĂ SRL | radiată: oprire |
| `7` | DEMO INSOLVENȚĂ SRL | în insolvență: oprire |
| `8` | DEMO AGRO SRL | CAEN 0111 (agricultură primară): oprire |
| `9` | DEMO FĂRĂ BILANȚ SRL | bilanț nepublicat (`bilant: null`): cere datele |
| `10` | DEMO INACTIVĂ SRL | inactivă fiscal: avertisment |
| `11` | DEMO CAPITALURI NEGATIVE SRL | capitaluri proprii negative: avertisment (scrisoare de bonitate) |
| `12` | DEMO ÎNDATORATĂ SRL | datorii / capitaluri ≥ 7,5: avertisment (scrisoare de bonitate) |

Pentru **SME Eco-Tech** (cu bilanțurile pe 2025 / 2024 / 2023; firmele 1–12, fără ele, duc la întrebarea despre vânzările din 2024):

| CUI | Firma | Ce arată |
|---|---|---|
| `21` | DEMO VERDE MICRO SRL | micro, din 2015, CA 2024 = 1.200.000 lei: totul în regulă (parcursul principal) |
| `22` | DEMO ECO MIJLOCIE PRODUCȚIE SA | întreprindere mijlocie, din 2008: totul în regulă |
| `23` | DEMO NOUĂ SRL | înființată în 2023: oprire |
| `24` | DEMO FĂRĂ VÂNZĂRI SRL | cifra de afaceri 2024 = 0: oprire |
| `25` | DEMO PODGORIA SRL | CAEN 1102 (vinuri): oprire |
| `26` | DEMO BILANȚ LIPSĂ SRL | bilanțul 2024 lipsă (`lipsa: true`): întreabă F5 |
| `27` | DEMO INACTIVĂ VERDE SRL | inactivă fiscal: avertisment (în card și la „De știut”) |
| `28` | DEMO COOPERATIVA MEȘTEȘUGARILOR | cooperativă (forma „SOCIETATE COOPERATIVĂ”): oprire |
