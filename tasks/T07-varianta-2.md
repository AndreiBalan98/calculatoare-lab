# T07 · Varianta 2 „Cifra vie” pentru e-DRIVE și SME Eco-Tech
Stare: de făcut
Depinde de: T06 (pe `main`)

## Scopul

Utilizatorul e mulțumit de varianta 1, dar vrea **o a doua formă, alături**, „tot în stilul ăsta, dar diferit: mai natural, mai organic, mai viu, mai simplu, mai clar, să se simtă ca o extensie a omului, principii Apple”. Direcția aleasă: **„Cifra vie”** — suma de bani e eroul, mare, mereu sus, și se mișcă la fiecare răspuns; manipulare directă (glisoare, +/−) în loc de liste de sume.

Citește întâi, în ordine: **`docs/flux-v2.md`** (toată; mai ales §0, §1 și §2), apoi `docs/design.md` și, pentru textele refolosite, `docs/flux-edrive.md` și `docs/flux-sme.md`.

## Ce faci

### 1. Întâi planul (în raport, nu întreba înainte)
Un tabel: fiecare ecran din `docs/flux-v2.md` §3 și §4 (E1–E7 la e-DRIVE, E1–E4 la SME, rezultatul, oprirea) → ce cheie de răspuns scrie → componenta (nouă sau refolosită din v1).

### 2. Arhitectura (v1 neatinsă)
- **Varianta 1 nu se schimbă deloc:** nici rutele, nici scenariile, nici ecranele, nici textele. Toate testele existente (Vitest și Playwright) trec **nemodificate**. Capturile v1 (S0, S2, R pe telefon, ambele calculatoare) refăcute la final arată la fel ca în `docs/capturi/T06/` (în raport, perechile).
- **Se refolosesc, nu se copiază:** motoarele (`src/motor/`), contextele (`contextDin`, `contextSme`), `program.rezultat`, `program.drum`, `program.glosar`, `program.analiza`, rama (`Rama.tsx`), `NumarAnimat`, `Text` (glosarul), `Drum`, `FoaieTrimitere`, `AlegereMultipla`, textele opririlor și ale întrebărilor F1–F5. Dacă refolosirea cere o schimbare mică într-un fișier comun (ex. un export, un parametru opțional), e voie, cu condiția ca v1 să rămână identică.
- **Răspunsurile v2 = aceleași chei ca v1** (`docs/flux-v2.md` §3 și §4), ca să meargă contextele neschimbate: prețul pe categorie → `pret_i` exact la prima mașină din categorie și `'aceeasi'` la celelalte; UE → același `ue_i` la toate.
- Codul nou: `src/scenariu/v2/` (pașii v2 ca date, ca în v1: textele editabile fără să atingi interfața; câte un fișier pe program) și `src/ui/v2/` (cardul cifrei, șoapta, rezumatul, linia de progres, controalele: +/−, comutatorul, glisorul; ecranul și orchestrarea). Rutele `src/app/e-drive/v2/page.tsx` și `src/app/sme-eco-tech/v2/page.tsx`. Fără framework nou: cât trebuie pentru cele două calculatoare.
- Cifra „în timp ce tragi”: contextul se calculează cu răspunsurile acceptate **plus** valorile provizorii de pe controale (fără să le accepte); motorul rămâne singurul care dă cifrele.

### 3. Interfața
Exact `docs/flux-v2.md`: cardul cifrei care se naște din câmpul CUI (`layoutId`), cifra care numără și urmează glisorul, rândul de sub cifră, șoapta cu „Aplică”, rezumatul editabil (tap → întrebarea; după răspuns, la următoarea fără răspuns sau înapoi la rezultat), linia de progres de 2px, rezultatul care crește sub card (fără ecran nou), oprirea în card, controalele din §2.8 (accesibile: `input type="range"` sau `role="slider"` cu `aria-valuetext`, tastatura; tap pe valoarea glisorului → câmp numeric), SME: indicatorul părții verzi și regula R-proiect (§4: rămâi pe E4, Aplică mută glisorul).

### 4. Pagina de start
Comutatorul „Varianta 1 · Varianta 2” pe `/` (§5 din specificație), implicit Varianta 2, `/?v=1` pentru prima. Cardurile duc la ruta variantei alese.

### 5. Verificarea (obligatorie, automată)
Playwright pe **390×844**, **360×740** și **1280×800**, pe `/e-drive/v2` și `/sme-eco-tech/v2`:
- **e-DRIVE, parcursul principal (CUI `1`):** Da → 2 mașini → Autoturisme → Da (un an) → glisorul la 25.000 € → UE Da. La final: cifra **50.000 €**, rândul „100 de puncte”, rezumatul cu 4 bucăți, butonul „Trimite-ne analiza”. Pe parcurs: după firmă cifra 80; după felul mașinilor „până la 60.000 €”; în timp ce glisorul se mută (cu tastatura: săgeți), cifra din card se schimbă **înainte** de [Continuă].
- **e-DRIVE, mixt:** CUI `2`, 3 mașini, Amândouă, 1 microbuz, prețurile 30.000 / 45.000, UE Nu → finanțarea = `calc()` pe aceleași date (comparat în test cu motorul, nu cu o cifră scrisă de mână), șoapta „Cu modele asamblate în UE…” → **Aplică** → punctele cresc cu 20.
- **e-DRIVE, plafonul:** glisorul autoturismului la 40.000 € → șoapta despre plafon; finanțarea = 30.000 € pe autoturism.
- **e-DRIVE, opriri:** CUI `5` (PFA) → oprirea în card; M4 Nu + promisiune Nu → X2.
- **Rezumatul:** pe rezultat, tap pe „2 mașini” → ecranul E3 cu 2 preselectat → + → [Continuă] → **direct înapoi la rezultat** (a treia mașină primește prețul categoriei și răspunsul UE deja date, `docs/flux-v2.md` §3), cu finanțarea recalculată: **75.000 €**. Apoi tap pe „3 autoturisme” → Amândouă → 1 microbuz → [Continuă] → glisorul microbuzului (singura întrebare fără răspuns) → [Continuă] → rezultat.
- **SME, parcursul principal (CUI `21`):** Da → Verzi + Alte → glisoarele la valorile de pornire → [Continuă] → cifra **267.240** lei, „Verde: 64%”, rezultatul R-ok (grantul, creditul 432.760, TVA-ul).
- **SME, proiect sub minim:** verzi 300.000, alte 350.000, software 20.000 → cifra gri, șoapta cu `verdeNou` **303.100** → **Aplică** → glisorul verde la 303.100, cifra numără, [Continuă] → R-ok. Înainte de Aplică, [Continuă] nu avansează.
- **SME, oprire:** CUI `23` → oprirea în card. CUI `26` → întrebarea F5.
- **Forma:** pe 390×844, pe fiecare ecran de întrebare, cardul, întrebarea, controlul și [Continuă] sunt în ecran fără derulare; pe nicio lățime nu există derulare orizontală; pe ecranele de întrebare **nu** există elemente cu textele de etape ale v1 („Firma”, „Mașinile”, „Prețul”) și nici ecou / casetă de antrenor.
- **`prefers-reduced-motion`:** un parcurs complet trece (cifrele apar direct).
- **Navigarea:** Înapoi și Back-ul browserului duc la întrebarea anterioară, cu răspunsul preselectat.
- Teste Vitest pentru partea pură din `src/scenariu/v2/` (cheile scrise, prețul pe categorie → `pret_i`, UE la toate, contextul provizoriu).
- `npm run build`, `npm test`, `npx playwright test` (toate, inclusiv v1) trec.

### 6. Capturi
În `docs/capturi/T07/`, telefon 390×844: fiecare ecran v2 al ambelor calculatoare (inclusiv rezultatul întreg, derulat, și R-proiect pe E4) + desktop 1280×800 pentru E2, glisoarele și rezultatul. Plus un **video scurt** (Playwright, ca în `e2e/video.spec.ts`) cu parcursul principal e-DRIVE pe telefon.

## Nu faci

- Nu schimbi nimic vizibil sau de comportament în varianta 1 și nici în motoare.
- Nu inventezi reguli de finanțare, cifre sau texte de program: cifrele vin din motor, textele lipsă din v1.
- Nu atingi `docs/flux-edrive.md`, `docs/flux-sme.md`, `docs/design.md`, `docs/referinta/`, `docs/flux-v2.md`.
- Fără trimitere reală a analizei (rămâne simulată), fără AI, fără bază de date.
- Fără al treilea calculator.

## Gata când

- `/e-drive/v2` și `/sme-eco-tech/v2` funcționează ca în `docs/flux-v2.md`, pe telefon și pe desktop.
- `/` are comutatorul de variante.
- Toate testele (vechi și noi) trec; v1 identică (capturile înainte / după).
- PR deschis spre `main`, cu raportul standard + tabelul din pasul 1 + capturile + video + linkul de previzualizare Vercel.

## Raportul

În plus față de standard: **ce ai simplificat sau ai lăsat deoparte** din specificație și de ce; valorile pe care le-ai ales acolo unde specificația lasă loc (ex. comportamentul rezumatului după schimbarea numărului de mașini); orice loc în care varianta 2 ți s-a părut **mai complicată** decât v1 pentru om (o propoziție pe fiecare).
