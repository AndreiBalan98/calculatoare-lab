# T01 · Scheletul aplicației și motorul e-DRIVE
Stare: de făcut
Depinde de: —

## Scopul

Fundația pe care construim conversația: aplicația Next.js care rulează pe Vercel, **motorul e-DRIVE portat în TypeScript și dovedit identic** cu cel de pe site, și ruta care aduce datele firmei de la ANAF (prin proxy-ul site-ului), cu un mod simulat pentru demo-uri. Interfața conversațională vine în T02; aici doar o pagină minimă care dovedește că lanțul CUI → ANAF → motor funcționează.

Citește întâi: `CLAUDE.md`, `docs/flux-edrive.md`, `docs/referinta/edrive-motor-wp.js`, `docs/referinta/anaf-api.md`.

## Ce faci

1. **Proiectul:** Next.js (App Router, TypeScript strict, Tailwind, ESLint) cu npm, structura din `CLAUDE.md` (`src/motor`, `src/scenariu`, `src/ui`, `src/app`). Fonturile Source Serif 4 și IBM Plex Sans prin `next/font/google`; culorile site-ului ca variabile / temă Tailwind. Instalează și Framer Motion (folosit din T02). `engines.node >= 20`. Scripturi: `dev`, `build`, `start`, `lint`, `test` (Vitest), `test:e2e` (Playwright). `.gitignore`, `.env.example`, un `README.md` scurt (cum rulezi local, cum rulezi testele).

2. **Motorul `src/motor/edrive/`** (TypeScript pur, fără React / Next / DOM):
   - `config.ts`: `CONFIG` din referință, tipizat.
   - `calc.ts`: `calc(d)` + `parseNum`, `verifica`, `fmt`, `eur`, `norm` — **aceeași logică și aceleași texte** ca în referință, cu tipuri pentru intrare și ieșire (`DateEdrive`, `RezultatEdrive`; `status: 'ok' | 'incomplet' | 'neeligibil'`).
   - `anaf.ts`: `dinAnaf(j)` (răspunsul API → date parțiale pentru `calc`) + tipul răspunsului API.
   - `incadrare.ts` (nou, pentru conversație): o funcție care, doar din datele firmei (`ang`, `ca`, `act`, `an`), dă categoria IMM și punctele de mărime sau motivul pentru care firma nu e IMM — **refolosind aceeași logică din `calc`** (fără duplicarea regulilor), ca banda de scor să poată arăta „Pornești cu 80 de puncte” imediat după pasul firmei.
   - **Fără dependențe de browser** (motorul trebuie să poată fi dus înapoi în WordPress).

3. **Testele motorului (Vitest), inclusiv testare diferențială:**
   - Încarcă `docs/referinta/edrive-motor-wp.js` în test (ex. `node:vm`, fără să-l modifici) și compară `calc` din referință cu `calc` din TypeScript pe **cel puțin 200 de intrări** generate (deterministic, cu seed): toate formele, CAEN exclus / normal, firme la limitele de mărime (9 / 10, 49 / 50, 249 / 250 angajați; CA și active la praguri, cu ambele cursuri și cu `an` necunoscut), date lipsă / invalide / negative, ANAF radiat / insolvență / inactiv, 0–10 mașini M1 / M2, prețuri sub / peste plafon, UE da / nu amestecat, `vechi` gol / da / promisiune. **Ieșirea trebuie să fie identică** (status, motive, avertismente, sfaturi, cifre).
   - Plus câteva teste lizibile, „de poveste” (ex. micro cu 2 autoturisme UE de 28.000 € → 100 de puncte, 56.000 €; mijlocie cu un microbuz de 45.000 € non-UE → 65 de puncte; PFA → neeligibil).
   - Teste pentru `dinAnaf` și `incadrare`.

4. **Ruta `GET /api/firma?cui=`** (`src/app/api/firma/route.ts`, rulează pe server):
   - Curăță CUI-ul (scoate „RO”, spațiile; doar cifre).
   - Cheamă `https://dezvoltaredigitala.ro/wp-json/dd/v1/firma?cui=…` (URL-ul de bază din variabila `ANAF_API_URL`, cu acesta ca valoare implicită), cu timeout ~25 s, și întoarce răspunsul **cu același status și același JSON** (inclusiv erorile `{ ok:false, cod, mesaj }`). Erori de rețea / timeout → `{ ok:false, cod:'anaf_indisponibil', mesaj:'…' }` cu 503.
   - **Modul simulat:** fixture-uri JSON locale (`src/motor/edrive/fixtures/` sau similar) pentru **CUI-uri demo evident nereale** (ex. `1`–`12`), servite **întotdeauna** din fixture-uri, fără apel la site. Plus variabila `ANAF_MOCK=1` care forțează modul simulat pentru orice CUI (orice CUI necunoscut → `negasit`). Fixture-uri minime: micro ok; mică ok; mijlocie ok; peste IMM; PFA; radiată; insolvență; CAEN 0111; bilanț lipsă (`bilant: null`); inactivă fiscal; capitaluri negative; datorii / capitaluri ≥ 7,5. O întârziere artificială mică (~600 ms) în modul simulat, ca demo-ul să pară real.
   - Listează CUI-urile demo și ce reprezintă în `README.md`.

5. **Pagina minimă:**
   - `/`: titlul „Laboratorul de calculatoare” și un card „e-DRIVE · mașini electrice pentru IMM-uri” cu link spre `/e-drive`.
   - `/e-drive`: **provizoriu** (va fi înlocuit în T02) un câmp CUI + buton; afișează denumirea, localitatea, starea, categoria IMM și punctele de mărime (din `incadrare`) sau motivul de oprire. Stil îngrijit, dar simplu; fără efort de design aici.

6. **Verificare:** `npm run lint`, `npm run build`, `npm test` trec. Un test Playwright simplu: `/e-drive` cu CUI demo micro afișează „80”; cu CUI demo PFA afișează oprirea. Capturi 390×844 și 1280×800 în `docs/capturi/T01/`.

## Nu faci

- Interfața conversațională, animațiile, drumul până la bani, trimiterea analizei (T02, T03).
- Nicio schimbare în `docs/flux-edrive.md` sau în `docs/referinta/`.
- Nicio regulă de finanțare nouă sau „îmbunătățită” în motor: **portare identică**. (Dacă găsești ceva ce pare greșit în referință, îl treci la „Întrebări deschise”, nu îl corectezi.)
- Fără AI, fără bază de date, fără autentificare.

## Gata când

- PR deschis din ramura `t01-schelet-si-motor`, cu raportul standard (`tasks/README.md`).
- Testarea diferențială pe ≥ 200 de intrări trece; build-ul și lint-ul trec.
- Pe previzualizarea Vercel a PR-ului, `/e-drive` cu un CUI demo merge; cu un CUI real întoarce firma prin proxy-ul site-ului (scrie în raport dacă ai putut testa un CUI real sau nu).
- În raport: lista CUI-urilor demo și orice variabilă de mediu pe care utilizatorul trebuie s-o pună în Vercel (la T01, probabil niciuna).
- La final, actualizează linia `Stare:` din acest fișier la `PR #N`.
