# e-DRIVE: specificația experienței (v2, „o întrebare pe rând”)

*Sursa de adevăr pentru **ce vede omul, ecran cu ecran**. Aspectul (culori, fonturi, forme) și mișcarea: `docs/design.md`. Versiunea 2, 20 oct 2026, 14:10 — înlocuiește complet v1 („conversația în fir de chat”), respinsă de utilizator după T02.*

---

## 0. Ce vrea utilizatorul, în cuvintele lui (de citit întâi)

> „Nu vreau sub formă de chat. Vreau să apară o întrebare și apoi să dispară și apare următoarea; între timp se completează un progres sus care rămâne mereu vizibil.”
>
> „Nu vreau să mă întrebe câte mașini și apoi câte microbuze. Mă întreabă doar câte mașini și după mă întreabă categoria lor.”
>
> Mai devreme: „să se simtă viu, să se conecteze cu tine, să simți că te înțelege”, „UI dinamic, plăcut, organic”, „să apară și să dispară opțiunile”, „cât mai puțină frecare”, „rezultatul să apară pe parcurs, nu doar la final”.

**Modelul mental:** un **ecran = o întrebare**, ca un Typeform sau ca un configurator de mașini bine făcut. **Nu** un chat, **nu** un formular lung, **nu** un fir care crește în jos.

## 1. Ce NU facem (greșelile din T02, de evitat explicit)

1. **Fără fir de conversație.** Nu rămân pe ecran întrebările trecute, răspunsurile ca „pastile”, istoricul. Pe ecran e **doar întrebarea curentă**.
2. **Fără baloane de chat și fără avatar** („DD”), fără indicatorul „scrie…”.
3. **Fără mesaje separate ale calculatorului** (ecrane sau baloane care doar spun ceva: „Acum, mașinile pe care le schimbi.”). Orice text al calculatorului stă **în ecranul unei întrebări** (vezi §3, „ecoul” și „antrenorul”) sau pe ecranul de rezultat / oprire.
4. **Pagina nu crește și nu se derulează** de la o întrebare la alta. Scena are o înălțime stabilă; la schimbarea întrebării se schimbă conținutul scenei, nu lungimea paginii.
5. **Fără întrebări separate pentru autoturisme și microbuze.** Întâi „câte mașini”, apoi „ce fel de mașini” (§4, ecranele M1–M3).
6. **Banda mare a programului** (titlul e-DRIVE pe bleumarin) **apare doar pe ecranul de start**, nu pe fiecare întrebare.

## 2. Structura paginii (telefonul întâi)

```
┌─────────────────────────────────────┐
│ ANTET  Dezvoltare digitală           │  bleumarin, compact (48–56px)
├─────────────────────────────────────┤
│ PROGRESUL  (fix, mereu vizibil)       │  vezi §2.1
│ ●━━━━━━━━●━━━━━━━○──────○──────○     │
│ Firma    Mașinile  Prețul   Rezultatul│
│ 80 de puncte · până la 50.000 €       │  „rezultatul pe parcurs”
├─────────────────────────────────────┤
│                                     │
│  ECOUL (opțional, o linie aurie)      │  vezi §3
│                                     │
│  ETICHETA MICĂ (opțional)             │  ex. MAȘINA 1 DIN 2 · AUTOTURISM
│  Întrebarea, mare, serif              │
│  Explicația, 1–2 rânduri (opțional)   │
│                                     │
│  ┌───────────────────────────────┐   │
│  │ Opțiunea 1                     │   │  butoane mari, pe toată lățimea
│  └───────────────────────────────┘   │  (sau grilă 2 coloane la cifre)
│  ┌───────────────────────────────┐   │
│  │ Opțiunea 2                     │   │
│  └───────────────────────────────┘   │
│                                     │
│  ANTRENORUL (opțional, casetă aurie)  │
│  Nota mică (opțional)                 │
│                                     │
│  ← Înapoi                             │  stânga jos, discret
└─────────────────────────────────────┘
```

- **Scena** (zona întrebării): pe telefon toată lățimea cu 16–20px pe laterale; pe desktop o coloană centrală de **~640px**, verticală centrată ușor sus (nu lipită de progres, nu în mijlocul perfect al ecranului).
- Fundalul paginii `tertiary` (`#F6F7F9`); întrebarea **nu** stă într-un card cu chenar (stă direct pe fundal, aerisit); opțiunile sunt butoane albe cu chenar.
- Subsolul site-ului (scurt) apare doar pe ecranul de rezultat, sub conținut.

### 2.1 Progresul (mereu vizibil, fix sus sub antet)

- **4 etape**, cu numele scurte: **Firma · Mașinile · Prețul · Rezultatul**. Linie continuă care **se umple lin** (resort) cu fiecare răspuns, nu doar la schimbarea etapei: umplerea = întrebări răspunse / întrebări estimate (estimarea crește când aflăm numărul mașinilor; umplerea nu scade niciodată vizibil, doar se încetinește).
- Etapa curentă: punct plin bleumarin cu un inel care respiră discret; etapele trecute: bifă aurie; viitoarele: cerc gol `quaternary`.
- **Rândul cu rezultatul pe parcurs**, sub linie, apare **după ce firma e încadrată** și se actualizează animat:
  - după firmă: „**80** de puncte” (cifra numără de la 0);
  - după primul preț: „80 de puncte · până la **25.000 €**”;
  - când scorul crește (UE): cifra numără la noua valoare și un „**+20**” auriu urcă 12px și se estompează lângă ea.
- Pe telefon totul încape în **≤ 64px** înălțime. Pe desktop poate fi mai aerisit.
- Atingerea unei etape trecute → saltul la prima ei întrebare (răspunsurile rămân, vezi §5).

## 3. Anatomia unui ecran de întrebare

În ordine, de sus în jos (toate opționale, în afară de întrebare și răspunsuri):

1. **Ecoul** — o linie scurtă, în `accent-dark`, care **reacționează la răspunsul de dinainte**, ca omul să simtă că a fost înțeles. Exemple: „Pornești cu **80 de puncte**, pentru că ești microîntreprindere.” · „Bun, două mașini.” · „Nicio grijă, verificăm împreună modelul.” · „Bun! Asta înseamnă **20 de puncte** în plus.” Intră cu 150ms înaintea întrebării. Cel mult **o** linie (două pe telefon mic).
2. **Eticheta mică** — majuscule, 13px, `accent-dark` (ex. „MAȘINA ELECTRICĂ 1 DIN 2 · AUTOTURISM”).
3. **Întrebarea** — Source Serif 4, 600, `primary`, 26–28px pe telefon, 32–36px pe desktop.
4. **Explicația** — 15–16px, `senary`, cel mult 2 rânduri.
5. **Răspunsurile** — vezi §3.1.
6. **Antrenorul** — casetă cu bordura stângă aurie (`accent`), fond alb, text `base`; un singur mesaj omenesc despre cum câștigi mai mult.
7. **Nota** — 13–14px, `senary`.
8. **← Înapoi** — link text, stânga jos (lipsește pe primul ecran).

### 3.1 Răspunsurile
- **Butoane mari** (înălțime ≥ 52px, text 17px, aliniat la stânga, cu o săgeată fină `→` sau un cerc la dreapta), câte unul pe rând; la **cifre** (1, 2, 3…) o grilă de 3–5 pătrate mari.
- **La apăsare:** butonul ales se umple `primary` (text alb, bifă) în ~150ms, celelalte se estompează la 40%; după **~350ms** întregul ecran pleacă și vine următorul (**avans automat**, fără „Continuă”).
- **Câmpurile de text** (CUI, „Altă sumă”) au butonul lor de confirmare și Enter. „Altă sumă” **nu** deschide alt ecran: butoanele se strâng animat și locul lor îl ia câmpul (cu tastatura numerică), în același ecran.
- **„Mai multe”** (la numărul mașinilor) la fel: grila 1–4 se transformă animat în grila 5–10, în același ecran.

## 4. Ecranele, în ordine

Notație: **[Buton]**; *(condiție)*; → ce urmează. Textele sunt cele de pus în scenariu (pot fi retușate, dar sensul rămâne).

### S0 · Start + CUI
- **Banda programului** (singurul ecran cu ea): „Fonduri nerambursabile ›”, insigna „Anunțat”, titlul „Finanțare pentru mașini electrice: e-DRIVE pentru IMM-uri”, rezumatul.
- Întrebarea: „**Hai să vedem cât poate primi firma ta.**” Explicația: „Scrie CUI-ul firmei. Luăm restul datelor de la ANAF.”
- Câmp mare, `inputmode="numeric"`, acceptă „RO” și spații; buton **[Caută firma]**.
- Progresul: etapa Firma activă, linia goală.

### S1 · Căutarea (stare, nu întrebare)
- În scenă: „Caut firma la ANAF…” cu un indicator viu (trei puncte sau o linie care curge), ~0,6–3 s. Fără alt conținut.
- Eroare CUI (`cui_invalid`) → înapoi la S0, câmpul marcat, mesaj sub el: „CUI-ul nu pare corect. Verifică cifrele.”
- Negăsit / ANAF indisponibil → **F1** cu ecoul „Nu găsesc datele firmei acum. Îmi spui tu câteva lucruri.”

### S2 · Firma găsită
- Ecoul: „Am găsit-o.”
- **Cardul firmei** (singurul card din flux): denumirea (serif), localitatea, categoria („Microîntreprindere”), angajații. Avertismentele de la ANAF (inactivă, capitaluri, datorii) ca rânduri `warn` scurte în card.
- Întrebarea: „**Asta e firma ta?**” **[Da, e firma mea]** **[Nu]**
- **[Nu]** → S3.
- **[Da]** → dacă motorul dă motive de oprire → **X1**; dacă încadrarea e incompletă (bilanț lipsă) → F2; altfel → **M1** cu ecoul „Pornești cu **80 de puncte**, pentru că ești microîntreprindere.” și progresul arată „80 de puncte”.

### S3 · Ce nu se potrivește
- „**Ce nu se potrivește?**” **[Am greșit CUI-ul]** (→ S0, câmp gol) **[Cifrele nu mai sunt la zi]** (→ F2, cu valorile ANAF ca notă).

### F1–F3 · Firma fără date (doar când e nevoie)
- **F1** *(forma necunoscută)*: „**Ce formă juridică are firma?**” **[SRL sau SA]** **[PFA, II sau IF]** **[Altă formă]**
- **F2**: „**Câți angajați are firma?**” **[0–9]** **[10–49]** **[50–249]** **[250 sau mai mulți]** (în motor: 5 / 30 / 150 / 300). Nota *(dacă știm de la ANAF)*: „La ANAF, în bilanțul pe 2025: 4 angajați.”
- **F3**: „**Cifra de afaceri de anul trecut?**” **[sub 10 mil. lei]** **[10–50 mil. lei]** **[50–250 mil. lei]** **[peste 250 mil. lei]** (în motor: 2 / 30 / 150 / 400 mil. lei, cursul implicit).
- Apoi ca după S2 [Da]: oprire (X1) sau M1. Rezultatul final poartă mențiunea „estimat din ce ne-ai spus”.

### M1 · Câte mașini
- Eticheta: „MAȘINILE”. Întrebarea: „**Câte mașini pe benzină sau motorină vrei să schimbi cu mașini electrice?**”
- Grilă: **[1]** **[2]** **[3]** **[4]** **[Mai multe]** → la „Mai multe”, în același ecran: **[5]** … **[10]**.
- Nota: „Fiecare mașină electrică nouă înlocuiește una veche, a firmei.”

### M2 · Ce fel de mașini
- *(1 mașină)* „**Ce fel de mașină e?**” **[Autoturism]** (sub-text mic: „până la 8 locuri plus șoferul”) **[Microbuz]** („peste 8 locuri plus șoferul”).
- *(2+ mașini)* „**Ce fel de mașini sunt?**” **[Toate sunt autoturisme]** **[Toate sunt microbuze]** **[Și autoturisme, și microbuze]**.
- Explicația (ambele cazuri): „Mașina electrică nouă va fi din aceeași categorie: autoturism în locul unui autoturism, microbuz în locul unui microbuz.”
- Ecoul pe M2: „Bun, {n} mașini.” (sau „Bun, o mașină.”)

### M3 · Câte microbuze *(doar la „Și autoturisme, și microbuze”)*
- „**Câte dintre cele {n} sunt microbuze?**” grilă **[1]** … **[n−1]**. Restul sunt autoturisme.

### M4 · De cât timp sunt ale firmei
- „**{Mașina e / Mașinile sunt} a firmei de cel puțin un an?**” **[Da]** **[Nu]**
- **[Nu]** → M5.

### M5 · Promisiunea *(doar la M4 = Nu)*
- Întrebarea: „**Poți cumpăra una înainte de contract?**” Explicația (2 rânduri, cu „promisiune notarială” subliniat): „Se poate cu o [[promisiune notarială]]: cumperi o mașină pe benzină sau motorină cu RCA și ITP valabile și anul trecut și o treci pe firmă înainte de contractul de finanțare. Costul ei nu se decontează.”
- **[Da, pot]** → P1 · **[Nu]** → X2.

### P1 · Prețul fiecărei mașini noi (se repetă pentru i = 1…n; întâi autoturismele, apoi microbuzele)
- Eticheta: „MAȘINA ELECTRICĂ {i} DIN {n} · {AUTOTURISM / MICROBUZ}” (la n = 1: doar „MAȘINA ELECTRICĂ · AUTOTURISM”).
- Întrebarea: „**Cam cât costă, fără [[TVA]]?**”
- Butoane: *(de la a doua mașină din aceeași categorie, primul)* **[La fel ca mașina {j} · 25.000 €]**; autoturism **[~20.000 €]** **[~25.000 €]** **[~30.000 €]** **[~35.000 €]** **[~45.000 €]** **[Altă sumă]**; microbuz **[~35.000 €]** **[~45.000 €]** **[~60.000 €]** **[Altă sumă]**. Butoanele de sume pot sta pe o grilă de 2 coloane.
- Nota: autoturism „Finanțarea e de cel mult 30.000 € pe autoturism. Peste, diferența o plătește firma.”; microbuz „La microbuz nu există plafon pe vehicul.”
- Ecoul pe P1 (prima mașină): „Acum, mașinile electrice noi.”; pe următoarele: reacția la UE de la mașina anterioară (vezi P2).

### P2 · UE (după fiecare P1, pentru aceeași mașină)
- Eticheta ca la P1. Întrebarea: „**E asamblată în Uniunea Europeană?**” **[Da]** **[Nu]** **[Nu știu]**
- **Antrenorul:** „Dacă alegi un model asamblat în UE, primești **20 de puncte în plus**.” La n ≥ 2 se adaugă: „Contează să fie toate asamblate în UE.”
- Ecoul pe ecranul următor: Da → „Bun! Asta înseamnă **20 de puncte** în plus.” *(doar dacă scorul chiar crește)*; Nu → „Am notat.”; Nu știu → „Nicio grijă, verificăm împreună modelul.” (în motor: `ue: false`).

### R · Rezultatul (ecranul final, se poate derula)
- Progresul: toate etapele bifate, linia plină.
- **Scorul mare** care numără („**100** din 100”), apoi, pe rând (cascadă ~120ms):
  1. **Trei propoziții**: „Poți aplica.” · „Primești până la **50.000 €**.” · „Tu plătești TVA-ul, cam **10.500 €**.” (+ „și diferența peste plafon, **X €**” când e cazul).
  2. **Bara banilor**: Finanțarea / Partea ta / TVA-ul, segmente care cresc pe rând, cu legendă.
  3. **Antrenorul** *(dacă lipsesc puncte)*: „Cu modele asamblate în UE ai avea **100**.” **[Aplică]** (pune UE la toate; scorul numără în sus, „+20”).
  4. **De știut**: avertismentele motorului (casete `warn`), dacă există.
  5. **Drumul până la bani** (vezi mai jos).
  6. Nota orientativă (mică).
- **Butoanele de acțiune**, pe telefon **fixe jos** (bara albă cu umbră fină): **[Trimite-ne analiza]** (plin, pe toată lățimea) și dedesubt **[Sună-ne · +40 749 589 848]** (contur). Pe desktop, sub drum.
- **← Schimbă răspunsurile** (link discret) → înapoi la M1.

### Drumul până la bani (pe ecranul R)
Vertical, cu pasul curent evidențiat, ceilalți estompați; pașii apar în cascadă:
1. ✓ **Verificarea preliminară** — „Gata. Știi cât poți primi.”
2. **Ne trimiți analiza** — „Un click, fără obligații.” ← *următorul pas, pulsează discret*
3. **Te sunăm** — „Verificăm împreună detaliile.”
4. **Pregătim dosarul** — „Ofertele, actele, cererea. Ne ocupăm noi.”
5. **Depunem la deschiderea apelului** — „Data nu e anunțată încă. Cu dosarul gata, depunem primii.”
6. **Contractul de finanțare**
7. **Mașina și banii** — „Cumperi mașina, primești finanțarea.”

### T · Trimite-ne analiza (foaie de jos pe telefon / dialog pe desktop)
- Titlul „**Trimite-ne analiza**”; „Ce primim: firma, răspunsurile tale și rezultatul. Te sunăm noi, fără obligații.”
- **Numele** · **Telefonul** · Emailul (opțional) · **[Trimite]**.
- După trimitere: foaia se închide, pe R pasul 2 se **bifează animat**, pasul 3 devine curent, iar sub scor apare „**Am primit analiza ta. Te sunăm noi.**”. Butonul „Trimite-ne analiza” devine „Analiza a fost trimisă ✓” (inactiv).
- (Trimiterea reală: task separat; până atunci simulată.)

### X · Opririle (ecran calm, fără roșu agresiv)
- **X1** *(motivele firmei din motor: PFA, altă formă, radiată, insolvență, CAEN exclus, peste IMM)*: titlul „**Din păcate, firma nu poate aplica la e-DRIVE.**”, motivul (textul motorului), „Hai să vorbim: poate găsim împreună altă finanțare potrivită.” **[Sună-ne]** (plin) **[Încearcă alt CUI]** (contur).
- **X2** *(fără mașină de înlocuit)*: „**Fără o mașină de înlocuit nu se poate aplica.**” + explicația; **[Sună-ne]** (plin) **[Schimbă răspunsul]** (contur → M4).
- Progresul rămâne la etapa în care s-a oprit, fără rândul de rezultat.

## 5. Navigarea și starea

- **Înainte:** automat după un buton; cu „Caută” / „Continuă” la câmpuri.
- **← Înapoi:** la întrebarea anterioară **efectiv afișată** (nu la pașii săriți), cu animația inversată (vine de sus / din stânga). Răspunsul dat acolo apare **preselectat** (butonul marcat), ca omul să poată merge mai departe cu un tap.
- **Răspunsurile se păstrează** când te întorci și schimbi ceva, dacă sunt încă valabile (ex. schimbi „2 mașini” în „3”: prețurile primelor două rămân; apare doar a treia). Motorul recalculează tot la fiecare schimbare.
- Butonul **Back** al telefonului / browserului face același lucru ca „← Înapoi” (istoria browserului: o intrare pe ecran, sau `popstate` tratat).
- Reîncărcarea paginii: poate porni de la zero (păstrarea stării e opțională, ulterior).

## 6. Textele subliniate (glosarul)

Cuvintele: **microîntreprindere / întreprindere mică / mijlocie (IMM)**, **autoturism**, **microbuz**, **asamblată în UE**, **promisiune notarială**, **TVA**, **plafon**. Subliniere punctată; la atingere, o foaie mică (telefon) / un balon (desktop) cu 1–2 propoziții. Definițiile rămân în `src/scenariu/glosar.ts`.

## 7. Regulile programului (motorul, neschimbat)

În `docs/referinta/edrive-motor-wp.js`, portat în `src/motor/edrive/`. Pe scurt: punctaj = mărimea firmei (micro 80 / mică 70 / mijlocie 65) + 20 dacă **toate** mașinile sunt asamblate în UE; finanțarea = suma prețurilor fără TVA, cu plafon de 30.000 € pe autoturism (M1), fără plafon la microbuz (M2); TVA 21% o plătește firma; încadrarea IMM în € cu cursul BNR din 31.12 al anului bilanțului. Fără prag: cererile se finanțează în ordinea punctajului; la egalitate, ora depunerii.
