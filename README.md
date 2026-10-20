# calculatoare-lab

Laboratorul pentru calculatoarele de fonduri nerambursabile ale [dezvoltaredigitala.ro](https://dezvoltaredigitala.ro), în formă conversațională. Primul: **e-DRIVE** (mașini electrice pentru IMM-uri). Cum lucrăm: [`CLAUDE.md`](CLAUDE.md) și [`tasks/README.md`](tasks/README.md).

## Rulezi local

Ai nevoie de Node.js 20 sau mai nou.

```bash
npm install
npm run dev          # http://localhost:3000
```

Variabile de mediu (opționale): vezi [`.env.example`](.env.example).

## Testele

```bash
npm test             # Vitest: motorul e-DRIVE, inclusiv testarea diferențială cu motorul de pe site
npm run lint
npm run build
npm run test:e2e     # Playwright (Chromium), pe telefon 390×844 și desktop 1280×800
CAPTURI=1 npm run test:e2e   # salvează și capturile (și video-ul pe telefon) în docs/capturi/T03/
```

`test:e2e` face singur build-ul și pornește serverul pe portul 3100, în modul simulat (`ANAF_MOCK=1`), pe telefon (390×844 și 360×740) și desktop (1280×800).

## Structura

```
src/
  motor/edrive/   regulile e-DRIVE în TypeScript pur (config, calc, anaf, incadrare) + testele
    fixtures/     firmele demo (răspunsuri ANAF simulate)
  scenariu/       calculatorul ca date: edrive.ts (ecranele și toate textele), glosar.ts,
                  context.ts (răspunsuri → datele motorului), derulare.ts (răspunsuri → drumul de ecrane)
  ui/             rama site-ului; ui/ecrane: un ecran = o întrebare, progresul de sus (Framer Motion)
  app/            paginile și ruta GET /api/firma
e2e/              testele Playwright
```

## Cum schimbi întrebările

Totul e în [`src/scenariu/edrive.ts`](src/scenariu/edrive.ts) (instrucțiunile sunt în capul fișierului): textele, ecoul, antrenorul, ordinea ecranelor, butoanele, condițiile. `**îngroșat**`, `[[cuvânt|cheie]]` = cuvânt subliniat cu explicație din [`glosar.ts`](src/scenariu/glosar.ts). Cifrele vin mereu din motor.

## Ruta `GET /api/firma?cui=`

Curăță CUI-ul (scoate „RO” și spațiile), apoi cheamă proxy-ul ANAF al site-ului (`ANAF_API_URL`, implicit `https://dezvoltaredigitala.ro/wp-json/dd/v1/firma`) și întoarce același status și același JSON. Dacă site-ul nu răspunde în 25 s: `503 { ok:false, cod:'anaf_indisponibil' }`. Contractul: [`docs/referinta/anaf-api.md`](docs/referinta/anaf-api.md).

## CUI-urile demo

Firme inventate, servite **întotdeauna** din `src/motor/edrive/fixtures/`, fără apel la site (cu o întârziere de ~600 ms, ca să pară real). Cu `ANAF_MOCK=1`, orice alt CUI dă „negasit”.

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
