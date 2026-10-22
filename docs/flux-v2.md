# Varianta 2 „Cifra vie”: specificația experienței (e-DRIVE și SME Eco-Tech)

*A doua formă a calculatoarelor, **alături de prima** (care rămâne neschimbată). Sursa de adevăr pentru ce vede omul în `/e-drive/v2` și `/sme-eco-tech/v2`. Identitatea (culori, fonturi, forme): `docs/design.md` §1, neschimbată. Mișcarea: `docs/design.md` §2, cu ce se schimbă în §2 de mai jos. Motoarele, contextele, textele rezultatului, drumul până la bani, glosarul și analiza: **aceleași ca în varianta 1** (refolosite, nu copiate). Versiunea 1, 22 oct 2026.*

---

## 0. Ce vrea utilizatorul, în cuvintele lui (de citit întâi)

> „Vreau ceva tot în stilul ăsta, e foarte bine. Vreau doar altceva. Mai natural, mai organic, mai viu, mai simplu, mai clar, să se simtă ca o extensie a omului, să aplice principii de la Apple, viziunea Steve Jobs. În mare e bun așa, dar doar vreau altceva, tot în stilul ăsta, dar diferit.”

A ales direcția **„Cifra vie”**: **suma de bani e eroul**, mare, mereu sus, și **se mișcă la fiecare răspuns**. Plus trei decizii (toate „da”):
1. **e-DRIVE: prețul o dată pe categorie** (autoturisme / microbuze) **și UE o dată pentru toate mașinile**, nu mașină cu mașină.
2. **SME: toate sumele pe un singur ecran, cu glisoare**, ca omul să vadă pe loc cum se schimbă partea verde.
3. **Rândul-rezumat din cardul cifrei**, cu tap ca să schimbi un răspuns; **Înapoi și Back rămân**.

**Principiile (Apple), de verificat la fiecare ecran:**
- **Un singur lucru important pe ecran.** Cifra sus, o întrebare jos. Nimic altceva care să ceară atenție.
- **Manipulare directă:** unde răspunsul e o cantitate (câte mașini, cât costă), omul **trage sau apasă +/−**, iar cifra răspunde **în timp ce** mișcă degetul. Nu alege dintr-o listă de sume.
- **Obiectele se transformă, nu se înlocuiesc:** câmpul CUI devine cardul firmei; cardul devine rezultatul. Același obiect, de la început până la sfârșit.
- **Mai puține cuvinte:** fiecare text care nu ajută decizia de acum dispare.
- **Răspunsul e în cifră:** omul simte că a fost înțeles pentru că cifra se schimbă, nu pentru că îi spunem asta.

## 1. Ce NU facem

1. **Nimic din varianta 1 nu se schimbă** (rutele `/e-drive`, `/sme-eco-tech`, ecranele, scenariile, testele, capturile). Varianta 2 e o interfață nouă, alături.
2. **Fără motor nou, fără reguli noi.** Toate cifrele, motivele, sfaturile, `verdeNou`, textele rezultatului vin din motoarele și contextele existente (`contextDin`, `contextSme`, `program.rezultat`).
3. **Fără progresul cu 4 etape** (nume de etape, puncte, bife). În locul lui: o linie fină (§2.3).
4. **Fără ecou** (linia aurie de deasupra întrebării). Reacția la răspuns = **cifra care se mișcă**.
5. **Fără caseta antrenorului** (bordura aurie). În locul ei: **șoapta** (§2.4), o singură linie.
6. **Fără liste de sume pe butoane** („~25.000 €”, „~300.000 lei”) și fără „Altă sumă” ca ecran sau ca transformare. Sumele se dau cu **glisorul**, iar valoarea exactă se poate scrie la tap pe cifra glisorului.
7. **Fără grila 1–4 / „Mai multe”** la numărul mașinilor: **+/−**.
8. **Fără întrebări repetate pe mașină** („Mașina 2 din 3”). Prețul pe categorie, UE o dată.
9. **Fără ecran de rezultat separat.** Rezultatul crește sub cardul cifrei (§2.6).
10. Fără chat, baloane, avatar, confetti, animații jucăușe (ca în varianta 1).

## 2. Forma comună (ambele calculatoare)

### 2.1 Pagina

```
┌─────────────────────────────────────┐
│ ANTET  Dezvoltare digitală           │  ca în varianta 1
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │ DEMO MICRO SRL                 │  │  CARDUL CIFREI (din ecranul 2 până la final)
│  │ microîntreprindere · Botoșani  │  │
│  │                                │  │
│  │   50.000 €                     │  │  CIFRA (Source Serif 4, 600, 56px telefon / 72px desktop)
│  │   finanțare · 100 de puncte    │  │  RÂNDUL DE SUB CIFRĂ
│  │                                │  │
│  │ ✦ +20 de puncte dacă sunt …    │  │  ȘOAPTA (opțional, o linie aurie)
│  │ ────────────────────────────── │  │
│  │ 2 autoturisme · ~25.000 € · UE │  │  REZUMATUL (fiecare bucată = tap)
│  └───────────────────────────────┘  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━──────────  │  LINIA DE PROGRES (2px)
│                                     │
│  Întrebarea, serif, 24–28px          │  SCENA (doar întrebarea curentă)
│                                     │
│        [ − ]    2    [ + ]           │  răspunsul (glisor / +− / 2–3 butoane)
│                                     │
│  [ Continuă ]                        │  doar unde nu e avans automat
│  ← Înapoi                            │
└─────────────────────────────────────┘
```

- Coloana: telefon toată lățimea (16px pe laterale); desktop **~560px**, centrată (mai îngustă decât v1: mai concentrat).
- Fundalul `tertiary`; **cardul cifrei** e alb, chenar 1px `quaternary`, colțuri 6px (cardul site-ului), padding 20px (telefon) / 28px (desktop). E **singurul card**.
- **Banda programului** (bleumarin) apare doar pe ecranul CUI, ca în v1, dar mai scundă: titlul pe 1–2 rânduri, rezumatul o propoziție.
- Pe telefon, tot ecranul de întrebare (card + întrebare + răspuns + Înapoi) **încape în 390×844 fără derulare**; pe 360×740 poate deriva doar „← Înapoi”. Cardul se **compactează** când pe ecran e o întrebare cu glisoare (SME): cifra 44px, șoapta și rezumatul rămân.

### 2.2 Cardul cifrei (eroul)

- **Apare prin transformarea câmpului CUI** (Framer Motion `layoutId`): după căutare, chenarul câmpului se lărgește și devine cardul, iar CUI-ul scris se estompează și în locul lui apare denumirea firmei. Nu dispare un lucru ca să apară altul.
- **Rânduri**, de sus în jos:
  1. **Denumirea** (Source Serif 4, 600, `primary`, 20px) și dedesubt **categoria · localitatea** (14px, `senary`); categoria e cuvântul din glosar (subliniat punctat).
  2. **Cifra** (vezi la fiecare calculator ce arată) — numără animat la fiecare schimbare (≈600ms, decelerat; în timpul tragerii de glisor, fără întârziere: urmează degetul, cu un resort scurt).
  3. **Rândul de sub cifră** (15px, `senary`): ce înseamnă cifra și a doua cifră (punctele / procentul).
  4. **Șoapta** (§2.4), opțional.
  5. **Rezumatul** (§2.5), după primul răspuns de după firmă; separat de restul printr-o linie 1px `quaternary`.
- Cardul își schimbă înălțimea **lin** (`layout`), niciodată brusc.
- La **oprire** (firma nu poate aplica), cifra și rândul ei pleacă (estompare), iar în card apar titlul opririi și motivele (§2.7).

### 2.3 Linia de progres

- 2px, sub card, pe toată lățimea cardului; umplerea `primary` pe fond `quaternary`, **pe un resort**, la fiecare răspuns. Umplerea = pașii răspunși / pașii estimați (nu scade vizibil niciodată, ca în v1). Fără etichete, fără etape.
- Pe ecranul CUI, linia stă sub câmp; la rezultat e plină și se estompează.

### 2.4 Șoapta (antrenorul, într-o linie)

- O singură linie (două pe telefon mic), 14–15px, `accent-dark`, cu semnul „✦” înainte; **în card, sub rândul cifrei**. Intră cu o estompare + 6px de jos.
- Spune **un singur lucru: cum câștigi mai mult sau ce lipsește**, cu cifra. Când se poate aplica direct, la capăt are **„Aplică”** (link subliniat, `primary`, 600): la tap, răspunsul se schimbă, cifra numără la noua valoare, șoapta pleacă.
- Dacă nu e nimic de spus, lipsește (cardul se strânge lin).

### 2.5 Rezumatul (ce ai spus, editabil)

- Un rând (se rupe pe 2 pe telefon) cu bucățile despărțite de „ · ”, 14px, `base`; fiecare bucată e un **buton text** (subliniere fină `quaternary` la hover / focus), cu `aria-label` „Schimbă: …”.
- **Tap pe o bucată → saltul la întrebarea ei** (animația de „Înapoi”); celelalte răspunsuri rămân (ca în v1, §5, dacă sunt încă valabile); după răspuns, omul e dus la **următoarea întrebare fără răspuns** (sau înapoi la rezultat, dacă totul e răspuns). Exemplu e-DRIVE: pe rezultat, „2 mașini” → 3 → [Continuă] → direct la rezultat (a treia mașină ia prețul categoriei și răspunsul UE deja date); „3 autoturisme” → Amândouă, 1 microbuz → glisorul microbuzului (singurul preț lipsă) → rezultat.
- Bucățile se adaugă **animat** (apar la capăt) pe măsură ce omul răspunde.

### 2.6 Rezultatul (fără ecran nou)

Când ultima întrebare primește răspuns:
1. Scena cu întrebarea pleacă (ca o tranziție normală); **cardul rămâne pe loc**, cifra numără la valoarea finală.
2. Linia de progres se umple și se estompează.
3. **Sub card**, în cascadă (~120ms), din `program.rezultat(c)` (aceleași date ca v1): propozițiile → bara banilor → „De știut” → drumul până la bani → nota orientativă. Componentele `Drum` și bara pot fi refolosite din v1 (aceleași culori).
4. Antrenorul rezultatului (ex. „Cu modele asamblate în UE ai avea 100”) e **șoapta din card**, cu „Aplică”.
5. **Butoanele:** pe telefon fixe jos (ca v1): **[Trimite-ne analiza]** (plin) și **[Sună-ne · +40 749 589 848]** (contur); pe desktop sub drum. Foaia „Trimite-ne analiza”: **aceeași ca în v1** (refolosită; simulată), cu bifa animată a pasului 2 din drum.
6. Omul poate schimba orice din **rezumat** (rezultatul se recalculează pe loc, fără să plece de pe pagină) sau cu ← Înapoi (ultima întrebare).
7. Pagina se poate derula pe rezultat; cardul **nu** e lipit sus (doar se derulează odată cu pagina).

### 2.7 Oprirea

- În card: titlul opririi (serif, `primary`, 22px), motivele motorului (rânduri `senary`, cu punct), apoi „Hai să vorbim: poate găsim împreună altă finanțare potrivită.” Fără roșu.
- Dedesubt, în scenă: **[Sună-ne]** (plin) și **[Încearcă alt CUI]** / **[Schimbă răspunsul]** (contur), ca în v1. Textele opririlor: cele din v1 (refolosite).

### 2.8 Controalele

- **+/− (pasul):** două butoane rotunde de 52px (contur `primary`; apăsat: plin), cifra între ele (Source Serif 4, 40px, numără). Min. și max. din pas. **Avans: buton [Continuă]** (plin, toată lățimea pe telefon). Cifra din card se actualizează **la fiecare apăsare**, nu doar la Continuă.
- **Comutatorul (segmentat):** 2–3 segmente într-o capsulă (chenar `quaternary`, colțuri 8px, 48px înălțime); segmentul ales are fond `primary` și text alb, care **alunecă** între segmente (`layoutId`). Când un segment deschide un control în plus (ex. „Amândouă” → câte microbuze), acesta apare animat dedesubt, în același ecran. Avans: [Continuă].
- **Glisorul:** pista 6px (`quaternary`, partea plină `primary`), mânerul 28px alb cu chenar `primary` și umbră foarte fină; zona de atingere ≥ 44px. Deasupra pistei, **valoarea** (Source Serif 4, 28px, `primary`), care e și buton: **tap → câmp numeric** în locul ei (tastatura numerică, Enter / „Gata”), apoi înapoi la glisor. Pași rotunzi (§3, §4). Repere pe pistă unde contează (ex. plafonul 30.000 €), cu o etichetă mică. Accesibil: `input type="range"` real (sau `role="slider"` cu `aria-valuenow`, `aria-valuetext` „25.000 €”), săgețile mută cu un pas, PageUp / PageDown cu 10 pași. Cifra din card se schimbă **în timp ce tragi**. Avans: [Continuă].
- **Butoanele de alegere** (Da / Nu etc.): ca în v1 (pe toată lățimea, avans automat după ~350ms, cel ales se umple cu bifă). Rămân pentru întrebările „da / nu”.
- **Comutatoarele multiple** (SME, „ce cumperi”): ca `AlegereMultipla` din v1 (poate fi refolosită), cu [Continuă].
- Răspuns tactil și focus: ca `docs/design.md` §2 (scale 0,97, `vibrate(8)` la Continuă și la alegeri, nu la fiecare pas de glisor; focusul pe primul control al ecranului nou).

### 2.9 Mișcarea (ce se schimbă față de `docs/design.md` §2)

- Tranziția întrebărilor: ca în v1, dar **doar în scenă**; cardul nu se mișcă la schimbarea întrebării (doar își animă conținutul).
- Fără inelul care respiră din progres (nu mai există progresul cu etape). „Viul” stă în cifră: numărătoarea, resortul la glisor, „+20” auriu care urcă lângă punctele din rândul cifrei.
- `prefers-reduced-motion`: ca în v1 (fără deplasări, blur, numărători; cifra se schimbă instant, transformarea CUI → card devine o estompare).

### 2.10 Navigarea și starea

- Ca în v1 (§5 din `docs/flux-edrive.md`): Înapoi la ultima întrebare afișată, răspunsul preselectat, Back-ul browserului = Înapoi, reîncărcarea pornește de la zero.
- Valorile de pornire ale controalelor (§3, §4) **nu contează ca răspuns** până la [Continuă].

## 3. e-DRIVE v2 (`/e-drive/v2`)

**Cheile de răspuns:** v2 scrie **aceleași chei ca v1** (`cui`, `firma`, `corectez`, `forma`, `angajati`, `cifra`, `nrMasini`, `tipMasini`, `nrMicrobuze`, `vechi`, `promisiune`, `pret_i`, `ue_i`), ca să refolosească `contextDin` neschimbat. Prețul pe categorie se scrie ca: prima mașină din categorie `pret_i` = suma exactă, celelalte din aceeași categorie `pret_j = 'aceeasi'`; UE: `ue_i` = același răspuns pentru toate mașinile.

**Cifra din card:**
| Când | Cifra | Rândul de sub ea |
|---|---|---|
| după firmă (încadrată) | **80** | „de puncte · microîntreprindere” |
| după numărul și felul mașinilor, **doar autoturisme** | **până la 60.000 €** (30.000 € × autoturisme, din `CONFIG.plafonM1`) | „finanțare · 80 de puncte” |
| idem, cu microbuze | cifra rămâne punctele (plafonul nu există la microbuz) | ca după firmă |
| din prima atingere a glisorului de preț | **finanțarea** = `rezultat.ajutor` cu prețurile de pe glisoare (în timp ce tragi) | „finanțare · 80 de puncte” |
| după UE | finanțarea; punctele din rând numără la 100, cu „+20” auriu | „finanțare · 100 de puncte” |

Trecerea de la puncte la euro: cifra se estompează și urcă puțin, euro intră de jos (o singură dată), iar punctele trec în rând.

**Ecranele:**

**E1 · CUI.** Banda programului (textele din v1). Întrebarea: „**Hai să vedem cât poate primi firma ta.**” Câmpul CUI (ca v1, aceleași reguli și erori) + **[Caută firma]**. Căutarea: în câmp, „Caut firma la ANAF…” cu linia de progres care curge (fără ecran separat).

**E2 · Firma.** Câmpul devine cardul (§2.2). Avertismentele ANAF ca rânduri `warn` scurte în card (ca v1). Întrebarea: „**E firma ta?**” **[Da]** **[Nu]**. **[Nu]** → „**Ce nu se potrivește?**” **[Am greșit CUI-ul]** **[Cifrele nu mai sunt la zi]** (ca v1, S3). Firma fără date / cifre neactualizate → întrebările F1–F3 din v1 (aceleași texte și valori), ca butoane, una pe ecran; cardul arată „estimat din ce ne-ai spus” sub categorie. Oprire → §2.7.

**E3 · Câte mașini.** „**Câte mașini schimbi cu unele electrice?**” Sub întrebare (15px, `senary`): „Fiecare mașină electrică nouă înlocuiește una veche, a firmei.” **+/−**, 1–10, pornește de la 1. [Continuă]. Rezumat: „2 mașini”.

**E4 · Ce fel.** „**Ce fel de {mașină e / mașini sunt}?**” Comutator: **Autoturism(e)** · **Microbuz(e)** · **Amândouă** (al treilea doar la 2+). Sub fiecare segment, nimic; sub comutator (14px, `senary`): „Autoturism: până la 8 locuri plus șoferul. Microbuz: peste 8. Cea nouă e din aceeași categorie.” La **Amândouă**: apare animat „Câte sunt microbuze?” cu +/− (1…n−1, pornește de la 1). [Continuă]. Rezumat: „2 autoturisme” / „1 autoturism și 1 microbuz”.

**E5 · Sunt ale firmei.** „**{Mașina e / Mașinile sunt} a firmei de cel puțin un an?**” **[Da]** **[Nu]**. **[Nu]** → „**Poți cumpăra una înainte de contract?**” cu explicația din v1 (M5, cu [[promisiune notarială]]) **[Da, pot]** **[Nu]**; **[Nu]** → oprirea X2 din v1. Rezumat: „ale firmei de 1 an” / „cu promisiune”.

**E6 · Prețul.** „**Cam cât {costă una nouă / costă cele noi}, fără [[TVA]]?**” Câte un **glisor pe categorie** prezentă (eticheta mică deasupra: „AUTOTURISM”, „MICROBUZ”; la o singură categorie, fără etichetă). Prețul e **pe bucată** (sub glisor, 13px: „pe autoturism”, „× 2” dacă sunt mai multe).
- Autoturism: 15.000–80.000 €, pas 500 €, pornește de la **30.000 €**; reper pe pistă la **30.000 €** cu eticheta „plafon”.
- Microbuz: 25.000–120.000 €, pas 1.000 €, pornește de la **45.000 €**.
- Șoapta, când un autoturism trece de plafon: „✦ Peste 30.000 € pe autoturism, diferența o plătește firma.”
- [Continuă]. Rezumat: „~25.000 €” (sau „autoturism ~25.000 € · microbuz ~45.000 €”).

**E7 · UE.** „**Sunt asamblate în Uniunea Europeană?**” (la o mașină: „E asamblată…”) **[Da]** **[Nu]** **[Nu știu]**. Șoapta: „✦ Dacă da, primești **20 de puncte** în plus.” Răspunsul se scrie la toate mașinile („Nu știu” = nu, ca în v1). Rezumat: „UE” / „fără UE” / „UE nesigur”.

**Rezultatul** (§2.6) din `EDRIVE.rezultat(c)`; șoapta din card = antrenorul v1 („Cu modele asamblate în UE ai avea **100**. Aplică”; Aplică → UE la toate).

## 4. SME Eco-Tech v2 (`/sme-eco-tech/v2`)

**Cheile de răspuns:** aceleași ca v1 (`cui`, `firma`, `corectez`, `forma`, `angajati`, `cifra`, `infiintata`, `ca24`, `cumperi`, `verde`, `alte`, `soft`), ca să refolosească `contextSme` neschimbat.

**Cifra din card: grantul în lei.**
| Când | Cifra | Rândul de sub ea |
|---|---|---|
| după firmă | **267.240 lei** (maximul, `CONFIG.grantMax`) | „grant de până la · 40% din proiect” |
| pe ecranul sumelor și după | **grantul** = `rezultat.grant` cu sumele de pe glisoare (în timp ce tragi); **gri** cât timp `status === 'proiect'` | „grant · proiect de {total} lei” |

**Indicatorul părții verzi** (doar din ecranul sumelor; în card, sub rândul cifrei): o bară de 8px, fond `quaternary`, umplută cu `rezultat.verdePct`; un reper vertical la **40%** (`CONFIG.verdeMin`) cu eticheta mică „minim 40%”; textul „**Verde: 46%**” la stânga. Umplerea e verde (`#1E7B4F`, culoarea insignei „Activ”) când e ≥ minimul, `senary` când e sub. Sub bară, doar când proiectul e sub minim: „Proiect: 650.000 lei · minim 668.100 lei” (14px).

**Ecranele:**

**E1 · CUI** și **E2 · Firma:** ca la e-DRIVE (textele benzii, căutarea „Caut firma și bilanțurile la ANAF…”, `istoric=1`, cardul cu „Înființată în 2015 · CA 2024: 1.200.000 lei” pe rândul categoriei, F1–F5 din v1).

**E3 · Ce cumperi.** „**Ce vrei să cumperi?**” „Poți alege mai multe.” Trei comutatoare (ca v1, cu detaliile din v1): **Echipamente verzi** · **Alte echipamente** · **Software**. [Continuă] activ cu cel puțin una. Șoapta (dacă verzile nu sunt alese): „✦ Cel puțin **40%** din proiect trebuie să fie echipamente verzi.” Rezumat: „verzi, alte echipamente”.

**E4 · Sumele (un singur ecran).** „**Cam cât costă, fără [[TVA]]?**” Câte un glisor pentru fiecare categorie aleasă, unul sub altul, cu eticheta mică deasupra:
- **ECHIPAMENTE VERZI:** 0–1.500.000 lei, pas 5.000, pornește de la **450.000 lei**;
- **ALTE ECHIPAMENTE:** 0–1.500.000 lei, pas 5.000, pornește de la **250.000 lei**;
- **SOFTWARE:** 0–60.000 lei, pas 1.000, pornește de la **10.000 lei**; reper la **15.000 lei** „decontat până aici”.

(Valorile de pornire sunt alese ca proiectul să se încadreze din prima: 700.000 lei, verde 64%.) Cardul se compactează (§2.1). **Șoapta**, după starea motorului, în ordinea:
1. `status === 'proiect'` și `verdeNou` → „✦ Cu echipamente verzi de **{verdeNou} lei**, proiectul se încadrează. **Aplică**” (Aplică → glisorul verde alunecă la `verdeNou`, cu animație);
2. software peste 15.000 → „✦ Software-ul se decontează până la 15.000 lei.”;
3. altfel nimic.

[Continuă] (activ cu totalul > 0). Rezumat: „verzi 450.000 · alte 250.000 lei”.

**Rezultatul** din `SME.rezultat(c)`: R-ok și R-proiect ca în v1, cu diferența că **la R-proiect** rămâi pe ecranul E4 (nu se poate trece la rezultat cu un proiect care nu se încadrează): [Continuă] rămâne activ, dar la apăsare nu avansează: cardul face o mică vibrație orizontală (±4px, 2 ori; fără la reduced-motion) și șoapta cu „Aplică” se evidențiază. *(Varianta 1 arăta R-proiect ca rezultat; aici problema se rezolvă pe loc, cu glisorul.)*

## 5. Pagina de start (`/`)

Comutator **„Varianta 1 · Varianta 2”** (segmentat, §2.8) deasupra cardurilor; cardurile duc la `/e-drive` sau `/e-drive/v2` după alegere (implicit **Varianta 2**; alegerea se ține în URL, `/?v=1`). Fără alte schimbări pe `/`.

## 6. Glosarul, textele, analiza

- Glosarul: același (v1), la hover / tap, ca în v1.
- Textele care nu sunt scrise aici: cele din v1 (scenariile `edrive.ts`, `sme.ts`), refolosite prin import unde se poate (opririle, F1–F5, rezultatul, drumul).
- Analiza trimisă: `program.analiza` din v1, cu răspunsurile v2 (aceleași chei), plus câmpul `varianta: 'v2'`.
