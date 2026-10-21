# T06 · Al doilea calculator: SME Eco-Tech, în același fel ca e-DRIVE
Stare: de făcut
Depinde de: T04 (pe `main`)

## Scopul

Utilizatorul e foarte mulțumit de forma e-DRIVE („pe telefon arată bestial”, „îmi place mult”) și vrea **încă un calculator în laborator, în același fel**: **SME Eco-Tech** (grant 40% + credit bancar pentru echipamente verzi; firme IMM). Cuvintele lui:

> „Vreau acum să mai adăugăm calculatoare pentru alte programe, în același fel.”

Deci **forma nu se schimbă**: refolosești ecranele, progresul, mișcarea, rama și foaia de trimitere din e-DRIVE. Se schimbă doar motorul, întrebările și textele. Și **e-DRIVE trebuie să rămână exact cum e.**

Citește întâi, în ordine: **`docs/flux-sme.md`** (toată; specificația ecran cu ecran, mai ales §0, §1 și §4), `docs/referinta/sme-motor-wp.js` (motorul de pe site, de portat identic), apoi recitește `docs/flux-edrive.md` v2.1 (forma de urmat) și `docs/design.md`.

## Ce faci

### 1. Întâi planul (în raport, nu întreba înainte)
Un tabel: fiecare ecran din `docs/flux-sme.md` §4 (**S0, S1, S2, S3, F1–F5, C1, P1, P2, P3, R-ok, R-proiect, T, X1**) → pasul din scenariu → componenta (refolosită din e-DRIVE sau nouă). Ținta: **o singură componentă nouă** (alegerea multiplă de pe C1); restul refolosite.

### 2. Generalizarea, minimă (ca e-DRIVE să rămână identic)
Acum codul e scris pentru e-DRIVE (`Etapa`, `Context`, `Calculator.tsx`, `derulare.ts`, `actiuni.ts`, `analiza.ts`, progresul cu puncte). Fă-l să servească **două calculatoare**, fără să construiești un „framework”:
- Ce e comun (ecranele, progresul, scena, Înapoi / Back, foaia de trimitere, glosarul, rama) devine generic, parametrizat de un obiect **„program”** (banda, etapele progresului, scenariul, contextul din răspunsuri, rândul de rezultat pe parcurs, ecranul de rezultat, drumul până la bani, glosarul).
- Ce e specific stă în `src/motor/<program>/` și `src/scenariu/<program>.ts` (plus contextul lui).
- **e-DRIVE nu se schimbă vizibil și nici ca date:** testele existente (motorul, testarea diferențială, scenariul, Playwright T03 și T04) trec **fără să le slăbești** (poți actualiza doar căile de import / numele). Capturile e-DRIVE (S0, S2, R pe telefon) refăcute după schimbare trebuie să arate la fel ca în `docs/capturi/T04/` (compară-le; în raport, perechile înainte / după).

### 3. Motorul `src/motor/sme/` (TypeScript pur)
- `config.ts`, `calc.ts` (cu `parseNum`, `verifica`, `fmt`, `lei`, `eur`, `pct`, `norm`), `anaf.ts` (`dinAnaf`) — **portare identică** din `docs/referinta/sme-motor-wp.js`, cu tipuri (`DateSme`, `RezultatSme`; `status: 'ok' | 'incomplet' | 'neeligibil' | 'proiect'`).
- O funcție pentru **firma singură** (din datele ANAF / răspunsurile F1–F5, fără sume): categoria IMM, motivele de oprire, ce lipsește — **folosind `calc` însuși** (ex. `calc` cu sumele goale), fără să rescrii regulile.
- O funcție pentru antrenorul de pe P2 („alte echipamente: până la X lei”): derivată din `CONFIG.verdeMin` și `CONFIG.softwareMax`, cu test care arată că la valoarea dată partea verde iese exact ≥ minimul din `calc`, iar la X + 1 leu sub el.
- **Testare diferențială** cu referința (încărcată cu `node:vm`, nemodificată), ca la T01: **cel puțin 300 de intrări** generate determinist: toate formele (`soc` / `pfa` / `alta` / `''`), datele de înființare în jurul lui 31.12.2021, CAEN-uri excluse (prefixe de 2 și de 4 cifre) și normale, mărimi la praguri (9 / 10, 49 / 50, 249 / 250 angajați; CA și active la praguri, cu `an` 2023 / 2024 / 2025 / necunoscut), `ca24` lipsă / 0 / negativ / pozitiv, ANAF radiat / insolvență / inactiv, sume lipsă / 0 / invalide / negative, software sub / peste 15.000, totaluri sub / peste 668.100, partea verde sub / peste 40%. **Ieșirea identică** (status, motive, lipsa, avert, tips, probleme, cifrele, `verdeNou`, categoria). Plus testarea diferențială a lui `dinAnaf` pe toate fixture-urile (vechi și noi).
- Câteva teste „de poveste”: verzi 450.000 + alte 250.000 → `ok`, grant 267.240, credit 432.760, TVA 147.000, partea verde 64,2%; verzi 300.000 + alte 350.000 + software 20.000 → `proiect`, `verdeNou` 303.100; înființată în 2023 → `neeligibil`.

### 4. Ruta `/api/firma` și firmele demo
- Ruta acceptă `istoric=1` și îl trimite mai departe proxy-ului site-ului (`?cui=…&istoric=1`). Fără el, comportamentul de acum (e-DRIVE).
- Tipul răspunsului ANAF primește `bilanturi?: (BilantAnaf & { lipsa?: boolean })[]` (`docs/referinta/anaf-api.md` descrie câmpul; nu modifica documentul).
- **Firme demo noi** (fixture-uri, cu `bilanturi` pe 2025 / 2024 / 2023), în README și în raport:

| CUI | Ce arată |
|---|---|
| `21` | micro, din 2015, CA 2024 = 1.200.000 lei: totul în regulă (parcursul principal) |
| `22` | întreprindere mijlocie, din 2008: totul în regulă |
| `23` | înființată în 2023: oprire |
| `24` | cifra de afaceri 2024 = 0: oprire |
| `25` | CAEN 1102 (vinuri): oprire |
| `26` | bilanțul 2024 lipsă (`lipsa: true`): întreabă F5 |
| `27` | inactivă fiscal: avertisment (în card și la „De știut”) |
| `28` | cooperativă (forma „SOCIETATE COOPERATIVĂ”): oprire |

  Firmele demo `1`–`12` rămân cum sunt (pentru SME, cele fără `bilanturi` duc la F5; e în regulă).

### 5. Scenariul și interfața SME
- `src/scenariu/sme.ts` (cu instrucțiunile „CUM MODIFICI” în cap, ca `edrive.ts`): ecranele din `docs/flux-sme.md` §4, **cu textele de acolo**; glosarul din §6.
- **Componenta nouă: alegerea multiplă** (C1): butoane-comutator în stilul butoanelor de răspuns (bifa ca la alegere, dar fără avans automat), **[Continuă]** activ doar cu o alegere, preselectate la Înapoi; accesibil (`aria-pressed`).
- **R-proiect → R-ok** la **[Aplică]**: fără schimbare de ecran; cifrele numără, conținutul se schimbă animat.
- Progresul: etapele „Firma · Ce cumperi · Sumele · Rezultatul” și rândul „Grant: … lei” (§3 din specificație); fără puncte și fără „+20”.
- Pagina **`/sme-eco-tech`**. Pe **`/`**, al doilea card, în același stil cu cel e-DRIVE: „SME Eco-Tech” · „grant și credit pentru echipamente verzi”, insigna „Activ”.
- Analiza trimisă (simulată) conține datele SME (firma, ce cumperi, sumele, grantul, creditul, partea verde).

### 6. Verificarea (obligatorie, automată)
Playwright pe **390×844**, **360×740** și **1280×800**:
- **CUI `21`:** S2 Da → C1: Echipamente verzi + Alte echipamente → Continuă → P1 `~450.000` → P2 (antrenorul arată „până la 675.000 lei”) `~250.000` → R-ok cu 267.240 → **Trimite-ne analiza** (simulat) → pasul 2 bifat.
- **CUI `21`, proiectul mic:** C1 toate trei → P1 `~300.000` → P2 „Altă sumă” 350.000 → P3 „Altă sumă” 20.000 → **R-proiect** (sfatul: verzi 303.100 lei) → **[Aplică]** → R-ok cu grantul 267.240, fără ecran nou.
- **C1 fără echipamente verzi** (doar Alte echipamente) → P2 → R-proiect cu sfatul → Aplică → R-ok.
- **CUI `23`** → X1 cu motivul motorului → „Încearcă alt CUI” → S0 gol. **CUI `26`** → F5 → Da → C1. **CUI `28`** → X1.
- **Înapoi și Back-ul browserului** de pe P2 până la C1: alegerile și sumele preselectate.
- **Aserțiunile de formă din T03** (un singur ecran, fără întrebările anterioare în DOM, progresul în viewport, ecranele de întrebare încap fără derulare pe 360×740, fără elemente de chat) pe ecranele SME.
- **e-DRIVE:** toate testele Playwright existente trec neschimbate.
- `npm run lint`, `npm run build`, `npm test` trec.
- **Capturi** în `docs/capturi/T06/`: fiecare ecran SME din tabelul de la pasul 1 (telefon; plus desktop pentru S0, C1, R-ok), pagina `/` (telefon) și perechile e-DRIVE înainte / după (S0, S2, R, telefon).

### 7. Documentele
- `CLAUDE.md`: în „Documentele”, rândurile pentru `docs/flux-sme.md` și `docs/referinta/sme-motor-wp.js`; „Primul calculator” → lista calculatoarelor; structura `src/motor/<program>`. `README.md`: CUI-urile demo noi și cum adaugi un calculator nou (pe scurt, după ce ai făcut generalizarea).

## Nu faci

- Nicio schimbare vizibilă la e-DRIVE; nicio schimbare de reguli în vreun motor („portare identică”; ce pare greșit în referință trece la „Întrebări deschise”).
- Nu modifica `docs/flux-edrive.md`, `docs/flux-sme.md`, `docs/design.md`, `docs/referinta/`.
- Trimiterea reală a emailului (parcată de utilizator).
- Punctaj, euro la sume, bife de condiții (vezi `docs/flux-sme.md` §1).
- Alte programe în afară de SME Eco-Tech.

## Gata când

- PR deschis, previzualizarea Vercel funcțională, raportul standard + **tabelul ecranelor cu capturile** + perechile e-DRIVE înainte / după.
- Pe telefon, `/sme-eco-tech`: de la CUI la rezultat, o întrebare pe ecran, progresul mereu vizibil, aceeași senzație ca e-DRIVE; `/e-drive` neschimbat.
- În raport: auto-verificarea pe `docs/flux-sme.md` §1 (fiecare punct bifat, cu dovada) și abaterile de la §4 la „Presupuneri”.
- La final, `Stare:` din acest fișier → `PR #N`.
