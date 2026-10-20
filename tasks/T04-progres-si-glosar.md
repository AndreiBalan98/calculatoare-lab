# T04 · Două finisaje: progresul sub banda programului, glosarul la hover
Stare: PR #4
Depinde de: T03 (pe `main`)

## Scopul

Utilizatorul e mulțumit de T03 („în sfârșit, cam asta voiam”) și cere **doar două schimbări**, în cuvintele lui:

> „Nu-mi place că la început apare sus acolo progresul, acele checkpoints; le vreau chiar deasupra inputului, sub acea secțiune albastră.”
>
> „Vreau ca cuvintele complicate să aibă explicația la hover, nu la click.”

Specificația e actualizată: **`docs/flux-edrive.md` v2.1, §2.1 (poziția progresului) și §6 (cum se arată explicația)**. Citește-le. **Nu schimba nimic altceva.**

## Ce faci

### 1. Progresul pe S0
- Pe **S0**, ordinea de sus în jos devine: **antetul → banda albastră a programului → progresul → întrebarea „Hai să vedem…” și câmpul CUI**. Acum progresul e între antet și bandă; mută-l sub bandă.
- Pe celelalte ecrane rămâne cum e (imediat sub antet, lipit sus la derulare). Tranziția de la S0 la S1 / S2 (când banda dispare) trebuie să fie lină: progresul alunecă în sus pe locul lui (`layout`), nu sare.
- Pe desktop: progresul are lățimea scenei (~640px, centrat), pe fundalul paginii (`tertiary`), nu o bandă albă pe toată lățimea; o linie fină dedesubt doar când e lipit sus (la derulare).

### 2. Glosarul la hover
- Pe dispozitivele cu mouse: explicația apare **la hover** (după ~120ms), ca **balon** (tooltip) deasupra cuvântului, cu stilul din §6; rămâne cât mouse-ul e pe cuvânt sau pe balon; dispare la ~150ms după ieșire. **Click-ul nu mai deschide nimic** în plus.
- Tastatura: balonul la focus, închis cu Esc. Accesibil: `aria-describedby` spre textul balonului, rolul potrivit.
- Ecranele tactile (fără hover): balonul la tap, închis la tap în altă parte.
- Balonul nu iese din ecran (întoarce-l sub cuvânt sau mută-l lateral când nu încape) și nu acoperă butoanele de răspuns în mod deranjant.
- Scoate foaia de jos / dialogul folosit acum pentru glosar (doar pentru glosar; foaia „Trimite-ne analiza” rămâne).

### 3. Verificarea
- Testele existente trec (`npm test`, `npm run lint`, `npm run build`, Playwright), inclusiv testele de formă din T03.
- Teste noi Playwright:
  - **S0 (telefon și desktop):** progresul (`[data-progres]`) e **sub** banda programului și **deasupra** câmpului CUI (compară coordonatele `y`), iar pe S2 e imediat sub antet.
  - **Desktop:** `hover` pe un cuvânt din glosar → balonul e vizibil cu definiția; mouse-ul pleacă → balonul dispare; `click` nu deschide nicio foaie sau dialog.
  - **Telefon** (context cu `hasTouch: true`): tap → balonul apare; tap în altă parte → dispare.
- Capturi în `docs/capturi/T04/`: S0 telefon și desktop; balonul pe desktop (hover) și pe telefon (tap).

## Nu faci
- Nicio altă schimbare de formă, text, mișcare sau logică. Motorul și scenariul rămân neatinse (în afara a ce cere glosarul în UI).
- Nu modifica `docs/`.

## Gata când
- PR deschis cu raportul standard și capturile; previzualizarea Vercel funcțională.
- La final, `Stare:` din acest fișier → `PR #N`.
