# T03 · e-DRIVE pe ecrane: o întrebare pe rând, progresul mereu sus
Stare: de făcut
Depinde de: T02 (pe `main`)

## De ce există acest task

Utilizatorul a încercat T02 pe telefon și l-a **respins ca formă**: nu vrea un fir de chat. Vrea **un ecran = o întrebare**: întrebarea apare, omul răspunde, ea dispare și vine următoarea, iar **sus un progres mereu vizibil** se umple și arată rezultatul pe parcurs. Și nu vrea „câte autoturisme” + „câte microbuze”, ci „câte mașini” și apoi „ce fel de mașini”.

**Specificația a fost rescrisă complet: `docs/flux-edrive.md` v2.** Citește-o **toată, cu atenție, înainte de orice cod**, mai ales **§0 (cuvintele utilizatorului)** și **§1 (ce NU facem)**. Apoi `docs/design.md` §2 (mișcarea, rescrisă pentru ecrane). Calitatea vizuală și tehnică din T02 a fost bună; **forma** trebuie schimbată.

## Ce faci

### 1. Întâi planul (în raport, nu întreba înainte)
Înainte de cod, scrie-ți un tabel: fiecare ecran din specificație (**S0, S1, S2, S3, F1–F3, M1–M5, P1, P2, R, T, X1, X2**) → ce pas din scenariu îl produce → ce componentă îl desenează. Tabelul intră în raportul PR-ului, cu captura fiecărui ecran.

### 2. Scenariul (`src/scenariu/`)
- **Păstrează:** motorul (neatins), `context.ts` (adaptat), `glosar.ts`, `analiza.ts`, `actiuni.ts` (adaptat), formatul pe date.
- **Scoate pașii de tip mesaj** (`mesaj`, `mesaje`: „Acum, mașinile pe care le schimbi.”, „pornire”, „faraDate” etc.). Textele lor devin **`ecou`** (linia care reacționează la răspunsul anterior), **`explicatie`** sau **`antrenor`** pe ecranele de întrebare, exact cum spune specificația. Avertismentele firmei intră în cardul firmei (S2) și în „De știut” pe R.
- **Mașinile, noul model:** `nrMasini` (1–10, cu „Mai multe”) → `tipMasini` (`M1` / `M2` la o mașină; `toateM1` / `toateM2` / `mixt` la mai multe) → `nrMicrobuze` (doar la `mixt`, 1…n−1). Lista mașinilor: întâi autoturismele, apoi microbuzele. Scoate `nrM1`, `nrM1Multe`, `nrM2`, `nrM2Multe`. Adaptează `context.ts` (`masiniDin`) și testele.
- Fiecare pas de întrebare declară și **etapa** din progres căreia îi aparține (`firma` / `masini` / `pret` / `rezultat`), pentru progres.
- Ecoul e calculat din răspunsul anterior și din motor (ex. „+20” doar dacă scorul chiar a crescut).

### 3. Interfața (`src/ui/`)
- **Scoate** firul de conversație, baloanele, avatarul „DD”, indicatorul „scrie…”, pastilele de răspuns și derularea automată (`Baloane.tsx`, părțile de fir din `Conversatie.tsx` etc.).
- **Componente noi / adaptate** (numele orientative):
  - `Progres` — fix sus, sub antet, mereu vizibil (§2.1): 4 etape, linia care se umple pe resort la fiecare răspuns, inelul care respiră pe etapa curentă, rândul „80 de puncte · până la 50.000 €” care apare după firmă și numără animat, „+20” auriu la câștig. ≤ 64px pe telefon. Etapele trecute se pot atinge (salt la prima lor întrebare).
  - `Scena` — afișează **un singur ecran** odată, cu `AnimatePresence mode="wait"` (sau `popLayout`) și tranzițiile din `docs/design.md` §2 (1, 3, 4), cu direcția inversată la Înapoi.
  - `EcranIntrebare` — anatomia din §3 (ecou, etichetă, întrebare, explicație, răspunsuri, antrenor, notă, „← Înapoi”), cu **avans automat** după alegere (~350ms, după ce butonul ales s-a umplut).
  - `Raspunsuri` — butoane mari pe toată lățimea (și grilă pentru cifre și sume), **transformarea în loc** pentru „Mai multe” și „Altă sumă” (§3.1), **răspunsul anterior preselectat** când omul se întoarce.
  - `EcranFirma` (S2, cu cardul), `EcranCautare` (S1), `EcranRezultat` (R; se poate derula; butoanele fixe jos pe telefon), `FoaieTrimitere` (T; refolosește-o pe cea din T02), `EcranOprire` (X1, X2).
- **Banda programului** doar pe S0. Antetul compact pe toate. Subsolul doar pe R.
- **Navigarea** (§5): „← Înapoi” la ecranul anterior efectiv afișat; butonul Back al browserului / telefonului face același lucru (`history.pushState` pe ecran + `popstate`); răspunsurile valabile se păstrează.

### 4. Verificarea (obligatorie, automată)
Teste Playwright pe **telefon 390×844**, **telefon mic 360×740** și **desktop 1280×800**, cu CUI-urile demo:
- **Parcurs CUI `1`:** 2 mașini → „Toate sunt autoturisme” → Da (un an) → mașina 1 `~25.000 €` + UE Da → mașina 2 „La fel ca mașina 1” + „Nu știu” → R cu 80 și antrenorul → **[Aplică]** → 100 → **Trimite-ne analiza** (simulat) → pasul 2 bifat.
- **Parcurs CUI `3`:** 3 mașini → „Și autoturisme, și microbuze” → 1 microbuz → prețuri (una cu „Altă sumă” 52.000) → R.
- **CUI `5`** → S2 → Da → X1 → „Încearcă alt CUI” → S0 gol. **CUI `9`** → F2, F3 → M1… → R „estimat”. **M4 = Nu → M5 = Nu** → X2 → „Schimbă răspunsul” → M4.
- **Înapoi:** din P2 al mașinii 2, Înapoi de 3 ori, schimbi răspunsul, mergi înainte: răspunsurile valabile sunt preselectate; **Back-ul browserului** face același lucru.
- **Aserțiuni de formă (de pus în teste, la fiecare ecran de întrebare din parcursuri):**
  - în scenă e vizibil **exact un** ecran (`[data-ecran]`), cu **o singură** întrebare;
  - **niciun** text al unei întrebări anterioare nu mai e în DOM-ul vizibil;
  - progresul (`[data-progres]`) e **în viewport** (fără derulare);
  - pe telefon, ecranele de întrebare (S0–P2) **încap fără derulare** (`document.documentElement.scrollHeight <= innerHeight + 4`), inclusiv la 360×740; dacă un ecran nu încape, îl compactezi (nu lași derularea);
  - nu există elemente de chat (avatar, „scrie…”, pastile).
- `npm run lint`, `npm run build`, `npm test` trec (testele motorului din T01 neatinse; testele scenariului adaptate).
- **Capturi** în `docs/capturi/T03/`: câte una pentru **fiecare ecran** din tabelul de la pasul 1 (telefon; plus desktop pentru S0, S2, P1, R) și **video-ul** parcursului CUI `1` pe telefon (`.webm`). Șterge `docs/capturi/T02/` (nu mai corespunde).

### 5. Auto-verificarea înainte de PR
Recitește `docs/flux-edrive.md` §1 și bifează în raport fiecare dintre cele 6 puncte („✓ fără fir de conversație: …”, cu dovada: testul sau captura). Apoi compară fiecare ecran cu §4 (textele, butoanele, ordinea) și notează orice abatere la „Presupuneri”.

## Nu faci

- Nicio schimbare în motor (`src/motor/`); nicio regulă de finanțare nouă.
- Trimiterea reală a emailului (task separat).
- Nu modifica `docs/flux-edrive.md`, `docs/design.md`, `docs/referinta/`.

## Gata când

- PR deschis, previzualizarea Vercel funcțională, raportul standard + **tabelul ecranelor cu capturile** + **bifele de la pasul 5**.
- Pe telefon, de la S0 la R: o întrebare pe ecran, progresul mereu vizibil sus și viu, nicio derulare între întrebări, întâi „câte mașini” apoi „ce fel de mașini”.
- La final, `Stare:` din acest fișier → `PR #N`.
