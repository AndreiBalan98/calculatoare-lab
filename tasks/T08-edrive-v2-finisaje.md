# T08 · e-DRIVE v2: scorul /100, „de ce” la pornire, „Primești până la”, UE sub „Da”, rezumatul vizibil
Stare: gata (PR #7, merge 23 oct)
Depinde de: T07 (pe `main`)

## Scopul

Utilizatorul a folosit `/e-drive/v2` și vrea 5 schimbări, mai ales de UX, puțin de UI. **Doar e-DRIVE v2.** Varianta 1 (ambele calculatoare) și SME v2 rămân neschimbate.

Cuvintele utilizatorului (22 oct):
> - „/100 puncte (vreau să apară punctajul pe tot parcursul procesului sub forma x/100)”
> - „pornești de la x pct pt că ... (când îți dă punctajul inițial îți spune de ce, clar și vizibil)”
> - „«Primești până la x euro» (30.000 per mașină), scorul rămâne și el (apar banii dar rămâne și scorul sub ei)”
> - „«✦ Dacă da, primești 20 de puncte în plus» sub opțiunea Da, să fie clar, nu sus și mic cum e acum”
> - „«2 mașini · 2 autoturisme · cu promisiune · ~30.000 € · UE» nu e clar că ăsta e parcursul întrebărilor, trebuie să fie puțin mai mare și să aibă un efect atunci când completezi, să te ducă cu privirea la el”

Citește întâi: `docs/flux-v2.md` §2.2, §2.4, §2.5 și §3; apoi `src/scenariu/v2/edrive.ts`, `src/ui/v2/CardCifra.tsx`.

## Ce faci

### 1. Scorul ca „x/100”, de la firmă până la rezultat

Punctajul maxim e 100 (80 mărimea + 20 UE). Oriunde apare scorul **în cardul cifrei** (e-DRIVE v2), forma e **„80/100”**, cu cuvântul „puncte” după (ex. „80/100 puncte”).

- Când scorul e **eroul** (cifra mare): `80` mare (ca acum), iar **`/100`** în locul unității (mărimea unității: 28px telefon / 36px desktop, `senary`). `aria-label`: „80 din 100 de puncte”.
- Când banii sunt eroul (§3 de mai jos), scorul stă **în rândul de sub cifră**: „**80/100** puncte” (numărul îngroșat, `primary`, numără; „+20” auriu urcă la UE, ca acum).
- Pe rezultat, cardul păstrează „x/100 puncte” sub bani.
- Textele rezultatului de sub card (`EDRIVE.rezultat`, din v1) **nu se schimbă** (ar schimba v1).

### 2. „Pornești cu 80 de puncte, pentru că…” — clar și vizibil

Când scorul apare prima oară (după firmă, pe E3 · Câte mașini), sub cifra mare, în locul rândului actual „de puncte · microîntreprindere”:

```
│   80 /100                         │  cifra (scorul)
│   Pornești cu 80 de puncte,       │  16px, `base` (nu `senary`), „80 de puncte” îngroșat
│   pentru că ești microîntreprindere. │  cuvântul categoriei cu explicația din glosar
```

- Textul = cel din v1 (pasul `nrMasini`, `ecou`: „Pornești cu **80 de puncte**, pentru că ești [[microîntreprindere]].”, cu `DE_CE`). **Refolosit prin export / funcție comună**, nu copiat; v1 rămâne identică.
- Rămâne vizibil **cât timp scorul e eroul** (E3, E4, și mai departe la mașinile cu microbuze, până la preț). Când trec banii în față, rândul devine „80/100 puncte” (§3) și „de ce”-ul pleacă (estompare).
- Firma estimată (F1–F3): același text (categoria estimată).

### 3. „Primești până la 60.000 €”, cu scorul sub bani

| Când | Cifra mare | Rândul de sub ea |
|---|---|---|
| după firmă, cât nu știm felul mașinilor | `80` `/100` | „Pornești cu 80 de puncte, pentru că …” (§2) |
| **doar autoturisme**, înainte de preț | „**Primești până la**” + **60.000 €** (30.000 € × autoturisme, `CONFIG.plafonM1`) | „**80/100** puncte” |
| cu **microbuze** (sau amândouă), înainte de preț | rămâne scorul (microbuzul nu are plafon, nu putem spune „până la”) | „Pornești cu …” (§2) |
| din prima atingere a glisorului de preț și după | „**Primești**” + finanțarea din motor (`rezultat.ajutor`) | „**80/100** puncte” |
| după UE (da) | idem | „**100/100** puncte”, cu „+20” auriu |

- Prefixul („Primești până la” / „Primești”) stă **deasupra** cifrei, pe rândul lui (17px, `senary`), nu în stânga ei: la 360px, „Primești până la 300.000 €” nu încape pe un rând la 56px. Cifra rămâne pe un singur rând (`whitespace-nowrap`; dacă tot nu încape la 10 autoturisme, cifra scade la 48px pe telefon).
- Dispare „finanțare · ” din rând.
- Trecerea scor → bani: ca acum (cifra veche urcă și pleacă, banii intră de jos), iar scorul „apare” în rând.

### 4. UE: „✦ Primești 20 de puncte în plus” sub butonul „Da”

Pe E7 (`ue`):
- **Fără șoapta din card** pe acest ecran.
- Butonul **[Da]** are, sub etichetă, rândul: **„✦ Primești 20 de puncte în plus”** (din `CONFIG.bonusUE`), **15px, `accent-dark`, „20 de puncte” îngroșat**. Restul butoanelor (Nu, Nu știu) fără rând.
- Rândul se vede pe toate stările butonului (normal, preselectat, ales — pe fond plin, auriul trece pe `accent` sau alb, lizibil).
- Cum: câmpul existent `Optiune.detaliu` + un semn că e „câștig” (ex. `detaliuCastig?: boolean` în `Optiune`, opțional, sau o variantă de stil în `Raspunsuri`/`Buton`). v1 nu folosește semnul → identică.
- Antrenorul de pe rezultat („Cu modele asamblate în UE ai avea 100. Aplică”) rămâne în card, ca acum.

### 5. Rezumatul = „drumul tău”, mai mare și cu efect la fiecare răspuns

Acum e un rând de 14px care nu se vede ca parcurs. Devine:

```
│ ──────────────────────────────── │
│ RĂSPUNSURILE TALE                 │  eticheta: 12px, majuscule, spațiere 0,08em, `senary`
│ [2 mașini] [2 autoturisme]        │  bucățile = „pastile”: 15px, `primary`, 600,
│ [cu promisiune] [~30.000 €] [UE]  │  fond `tertiary`, chenar 1px `quaternary`, colțuri 999px,
│                                   │  padding 4px 10px, distanță 6px; fără „ · ”
```

- **Indiciu că se apasă** (cerut și în raportul T07): la fiecare pastilă, un creion mic (12px, `senary`) după text, sau chenarul care devine `primary` la hover / focus / apăsare. Ținta de atingere ≥ 36px înălțime (zona, nu desenul).
- **Efectul la completare** (cheia cererii: „să te ducă cu privirea la el”): la fiecare răspuns,
  1. **răspunsul zboară spre rezumat**: textul ales (eticheta butonului / valoarea) se ridică din scenă și **ajunge în pastila nouă** (Framer Motion `layoutId` comun între răspuns și pastilă, sau o „fantomă” poziționată absolut care se mută din poziția răspunsului în poziția pastilei, ~450ms, decelerat);
  2. pastila nouă **se aprinde auriu** (fond `#FFF6E0`, chenar `accent`) ~1,2s, cu o mărire scurtă 1 → 1,06 → 1, apoi revine la stilul normal;
  3. dacă rezumatul nu se vede (pagina derulată), fără derulare automată; efectul se face doar dacă e pe ecran.
  - `prefers-reduced-motion`: fără zbor și fără mărire; doar aprinderea aurie, ca estompare.
- **Comasarea** (propunerea din raportul T07): când numărul și felul spun același lucru („2 mașini” + „2 autoturisme”), o singură pastilă: „**2 autoturisme**” (apasă → E3). La amestec: „2 mașini” + „1 autoturism și 1 microbuz” rămân două. Ecran pe E3: după răspunsul la E4 pastila „2 mașini” se transformă în „2 autoturisme” (aceeași pastilă, textul se schimbă, fără zbor).
- Restul comportamentului rămâne (§2.5 din spec: tap → întrebarea ei, apoi următoarea fără răspuns sau rezultatul).

### 6. Spec și teste

- Actualizează **`docs/flux-v2.md`** (§2.2, §2.5, §3, la e-DRIVE) cu cele de mai sus → versiunea 1.1, 22 oct 2026. Notează la §2.5 că pastilele și efectul sunt deocamdată **doar la e-DRIVE** (SME, mai târziu, dacă place).
- Actualizează testele v2 e-DRIVE care verifică textele vechi (`e2e/v2.spec.ts`: „de puncte · microîntreprindere”, „finanțare · 80 de puncte”, șoapta UE, „100 de puncte”; `src/scenariu/v2/v2.test.ts`). **Testele v1 și SME v2 trec nemodificate.**
- Teste noi (Playwright, 390×844 și 360×740):
  - după firmă (CUI `1`): cifra `80`, „/100”, rândul „Pornești cu 80 de puncte, pentru că ești microîntreprindere.”;
  - 2 autoturisme: „Primești până la” + „60.000 €”, rândul „80/100 puncte”;
  - 1 autoturism și 1 microbuz: cifra rămâne scorul până la preț;
  - E7: sub „Da” textul „Primești 20 de puncte în plus”; fără `[data-soapta]` pe ecran; după „Da”: „100/100 puncte”;
  - rezumatul: eticheta „Răspunsurile tale”, pastila nouă primește starea aprinsă (ex. `data-nou`) după răspuns și o pierde după ~1,5s; comasarea „2 autoturisme”;
  - la 360×740 nimic nu iese din card pe orizontală (10 autoturisme × 30.000 = 300.000 €).
- `npm run build`, `npm test`, Playwright: toate verzi.

## Nu faci

- Nimic în v1 (`/e-drive`, `/sme-eco-tech`): nici texte, nici ecrane, nici capturi. Textele refolosite se exportă, nu se modifică.
- Nimic în SME v2 (nici pastilele, nici /100 — SME nu are punctaj).
- Fără motor nou, fără reguli noi: cifrele vin din motor și `CONFIG`.
- Fără derulare automată, fără sunet, fără confetti.
- Nu schimbi textele rezultatului de sub card.

## Gata când

- Cele 5 cerințe se văd pe telefon (390×844) pe un parcurs complet CUI `1` → 2 autoturisme → ale firmei → preț → UE da → rezultat.
- Ecranele E3–E7 încap încă în 390×844 fără derulare (cardul e mai înalt: verificat; dacă nu încape, eticheta „Răspunsurile tale” și pastilele trec pe 14px pe ecrane < 760px înălțime).
- Testele v1 și SME v2 nemodificate și verzi; build verde.

## Raportul

Standard (`tasks/README.md`), plus **capturi telefon 390×844** în `docs/capturi/T08/`: E3 (scorul + „de ce”), E4 după „2 autoturisme” (Primești până la), E6 (glisor), E7 (Da cu rândul auriu), rezultatul; și **un video scurt sau o succesiune de 3 cadre** cu zborul răspunsului spre rezumat.
