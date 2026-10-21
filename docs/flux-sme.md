# SME Eco-Tech: specificația experienței (v1)

*Al doilea calculator din laborator. Sursa de adevăr pentru **ce vede omul, ecran cu ecran**. Forma e **aceeași ca la e-DRIVE** (`docs/flux-edrive.md` v2.1, aprobată de utilizator): un ecran = o întrebare, progresul mereu vizibil, ecoul, antrenorul, glosarul la hover, drumul până la bani. Aici scrie doar **ce e diferit** sau specific programului; tot ce nu e scris aici se face **exact ca la e-DRIVE**. Aspectul și mișcarea: `docs/design.md`. Regulile: `docs/referinta/sme-motor-wp.js`. Versiunea 1, 21 oct 2026.*

---

## 0. Ce vrea utilizatorul (de citit întâi)

> „Perfect, această variantă arată foarte bine, îmi place mult. Vreau acum să mai adăugăm calculatoare pentru alte programe, **în același fel**.”

Deci: **nu se reinventează nimic la formă.** Același antet, aceeași bandă, același progres, aceleași butoane, aceleași tranziții, același ecran de rezultat, aceeași foaie „Trimite-ne analiza”. Se schimbă doar întrebările, textele și cifrele.

## 1. Ce NU facem

1. Nimic din `docs/flux-edrive.md` §1 (fără chat, fără baloane, fără mesaje separate, pagina nu crește, banda doar pe start).
2. **Fără formular cu toate sumele pe un ecran** (ca pe site): câte o sumă pe ecran.
3. **Fără punctaj.** Programul nu are punctaj („primul venit, primul servit”). Nu apar „puncte” nicăieri; cifra vedetă e **grantul în lei**.
4. **Fără euro la sume.** Programul e în **lei** (pragurile IMM se calculează intern în €, dar omul vede lei).
5. **Fără bife de condiții** („nu am datorii la buget” etc.): ce nu se poate verifica stă doar la „De știut” pe rezultat.
6. Nicio schimbare vizibilă la e-DRIVE.

## 2. Programul, pe scurt (pentru texte; cifrele exacte vin din motor)

- Grant **40%** din investiția eligibilă, **cel mult 267.240 lei**; **restul e un credit** la o bancă parteneră (Banca Transilvania, BRD, CEC Bank, UniCredit Bank, ProCredit Bank).
- Investiția eligibilă: **cel puțin 668.100 lei**, fără TVA; **cel puțin 40%** din ea pe **echipamente verzi**.
- Software-ul se decontează **până la 15.000 lei**; TVA-ul (21%) îl plătește firma.
- Firma: **societate** (nu PFA, II, IF, cooperativă), **IMM** (și micro), **înființată până pe 31.12.2021**, cu **cifră de afaceri în 2024**, CAEN-ul principal nu e exclus, starea bună la ANAF.
- Înscrierea: online, **până pe 30 decembrie 2026, ora 20:00**, **primul venit, primul servit**. Insigna: **Activ**.

## 3. Progresul

- **4 etape:** **Firma · Ce cumperi · Sumele · Rezultatul.**
- **Rândul cu rezultatul pe parcurs** (în locul „80 de puncte · până la 50.000 €”):
  - după firmă: „Grant de 40%, până la **267.240 lei**”;
  - după prima sumă: „Grant: **120.000 lei**” (cifra numără animat la fiecare sumă nouă, ca scorul la e-DRIVE);
  - fără „+20”; în locul lui, la o creștere a grantului, cifra doar numără.

## 4. Ecranele, în ordine

Notație ca la e-DRIVE: **[Buton]**; *(condiție)*; [[cuvânt]] = subliniat, cu explicație din glosar.

### S0 · Start + CUI
- **Banda programului:** „Fonduri nerambursabile ›”, insigna **„Activ”** (verde; vezi §7), titlul „**Finanțare pentru IMM-uri: SME Eco-Tech, grant și credit**”, rezumatul „Grant de 40% din investiție, până la 267.240 lei, plus un credit bancar pentru rest. Pentru echipamente verzi și alte echipamente noi.”
- Progresul sub bandă (ca la e-DRIVE v2.1), întrebarea „**Hai să vedem cât poate primi firma ta.**”, explicația „Scrie CUI-ul firmei. Luăm restul datelor de la ANAF.”, câmpul și **[Caută firma]**.

### S1 · Căutarea
- Ca la e-DRIVE. Căutarea cere **și bilanțurile pe 3 ani** (`istoric=1`), deci poate dura puțin mai mult: textul „Caut firma și bilanțurile la ANAF…”.

### S2 · Firma găsită
- Ecoul „Am găsit-o.”, cardul firmei ca la e-DRIVE (denumirea, localitatea, categoria, angajații) **plus un rând „Înființată în 2015”** și **„Cifra de afaceri 2024: 1.200.000 lei”** (dacă se știe). Avertismentul „inactivă fiscal”, dacă e cazul, ca rând `warn` în card.
- „**Asta e firma ta?**” **[Da, e firma mea]** **[Nu]**.
- **[Da]** → dacă motorul dă motive de oprire doar din datele firmei → **X1**; dacă lipsesc date → F1–F5, doar cele necesare; altfel → **C1**.

### S3 · Ce nu se potrivește
- Ca la e-DRIVE (**[Am greșit CUI-ul]** → S0; **[Cifrele nu mai sunt la zi]** → F2).

### F1–F5 · Firma fără date (doar ce lipsește)
- **F1, F2, F3:** ca la e-DRIVE (forma, angajații, cifra de afaceri de anul trecut; aceleași butoane și aceleași valori date motorului). La F1, **[Altă formă]** are detaliul „asociație, cooperativă etc.”.
- **F4** *(data înființării lipsește)*: „**Când a fost înființată firma?**” **[Până în 2021 inclusiv]** **[În 2022 sau mai târziu]** (în motor: `data` = `2015-01-01` / `2023-01-01`).
- **F5** *(cifra de afaceri 2024 lipsește)*: „**A avut firma vânzări în 2024?**” Explicația: „Programul cere o cifră de afaceri mai mare decât zero în 2024.” **[Da]** **[Nu]** (în motor: `ca24` = `1` / `0`).
- Apoi ca după S2 **[Da]**. Rezultatul final poartă mențiunea „estimat din ce ne-ai spus”, ca la e-DRIVE.

### C1 · Ce cumperi (singurul ecran cu alegere multiplă)
- Ecoul (după firmă): „Firma ta se încadrează: e **[[microîntreprindere]]**, înființată în **2015**.” (categoria și anul din motor / ANAF; la F4: fără an).
- Eticheta „CE CUMPERI”. Întrebarea: „**Ce vrei să cumperi?**” Explicația: „Poți alege mai multe.”
- **Trei butoane-comutator** (se bifează / debifează; bifa se vede ca la alegerea unui buton, dar ecranul **nu** pleacă singur):
  - **[Echipamente verzi]** detaliu „panouri fotovoltaice, pompe de căldură, reciclare, eficiență energetică”;
  - **[Alte echipamente]** detaliu „utilaje, calculatoare, imprimante, site, magazin online”;
  - **[Software]** detaliu „programe și licențe”.
- Dedesubt **[Continuă]** (buton plin), activ doar cu cel puțin o alegere.
- **Antrenorul:** „Cel puțin **40%** din bani trebuie să meargă pe [[echipamente verzi]]. Fără ele, proiectul nu se încadrează.”
- **Nota:** „Proiectul trebuie să aibă cel puțin **668.100 lei**, fără [[TVA]]. Grantul e 40% din el; restul e un [[credit bancar]].”
- La Înapoi: alegerile anterioare apar bifate.

### P1 · Echipamentele verzi *(dacă au fost alese)*
- Eticheta „ECHIPAMENTE VERZI”. Întrebarea: „**Cam cât costă, fără [[TVA]]?**”
- Butoane (grilă de 2 coloane): **[~150.000 lei]** **[~300.000 lei]** **[~450.000 lei]** **[~700.000 lei]** **[Altă sumă]** (transformarea în loc, ca la e-DRIVE).
- Nota: „Prețurile din ofertele furnizorilor. Echipamentele trebuie să fie noi.”

### P2 · Alte echipamente *(dacă au fost alese)*
- Ecoul *(după P1)*: „Grantul ajunge deja la **120.000 lei**.”
- Eticheta „ALTE ECHIPAMENTE”. Întrebarea: „**Cam cât costă, fără [[TVA]]?**”
- Butoane: **[~100.000 lei]** **[~250.000 lei]** **[~400.000 lei]** **[~600.000 lei]** **[Altă sumă]**.
- **Antrenorul** *(doar dacă echipamentele verzi > 0)*: „Ca partea verde să rămână de cel puțin 40%, aici poți pune până la **450.000 lei**.” (cifra = cât pot fi alte echipamente fără ca partea verde să scadă sub minimul din motor, cu software-ul neștiut încă = 0; rotunjită în jos la leu).

### P3 · Software *(dacă a fost ales)*
- Ecoul *(după P2, din motor)*: partea verde ≥ 40% → „Partea verde e **46%**. E în regulă.”; sub 40% → „Partea verde e **21%**. Minimul e 40%.”; *(după P1, fără P2)*: ca ecoul de pe P2.
- Eticheta „SOFTWARE”. Întrebarea: „**Cam cât costă, fără [[TVA]]?**”
- Butoane: **[~5.000 lei]** **[~10.000 lei]** **[~15.000 lei]** **[~30.000 lei]** **[Altă sumă]**.
- Nota: „Se [[decontează]] cel mult **15.000 lei**. Peste, diferența o plătești tu.”

### R · Rezultatul
Structura ecranului R de la e-DRIVE (cifra mare care numără, cascada, butoanele fixe jos pe telefon, „← Schimbă răspunsurile” → C1). Trei variante, după starea motorului:

**R-ok** *(status `ok`)*:
1. Cifra mare: „**267.240** lei grant”. *(Exemplele de cifre din R-ok: verzi 450.000 + alte 250.000 lei.)*
2. **Trei propoziții:** „Poți aplica.” · „Primești un [[grant]] de **267.240 lei**.” · „Restul, **432.760 lei**, e un [[credit bancar]].” · „Tu plătești [[TVA]]-ul, cam **147.000 lei**.” (+ „și software-ul peste 15.000 lei, **5.000 lei**” când e cazul).
3. **Bara banilor:** Grantul / Creditul / Plătești tu (TVA + software nedecontat), segmente care cresc pe rând, cu legendă.
4. Un rând: „Partea verde: **64,2%** din investiție (minimum 40%).”
5. **De știut** (casete mici, pe rând): sfaturile-text ale motorului (grantul la maximum; „înscrie-te cât mai devreme: [[primul venit, primul servit]]”; software-ul peste plafon), avertismentele (inactivă fiscal) și mesajul „Mai verifică” de pe site (în referință, `MAI_VERIFICA`).
6. **Drumul până la bani** (§5).
7. Nota orientativă: „Estimare orientativă, după procedura SME Eco-Tech. Nu garantează obținerea finanțării. Eligibilitatea o stabilește Ministerul Economiei, iar creditul îl aprobă banca.”

**R-proiect** *(status `proiect`: firma e bună, proiectul nu se încadrează încă; exemplul: verzi 300.000 + alte 350.000 + software 20.000 lei)*:
1. Cifra mare gri, cu textul „**Firma se încadrează. Proiectul, încă nu.**”
2. Problemele, ca rânduri `warn` (textele motorului: minimul de 668.100 lei, partea verde sub 40%).
3. **Antrenorul cu [Aplică]** (sfatul `verdeNou` al motorului): „Cu echipamente verzi de **303.100 lei** (cu 3.100 lei mai mult), proiectul se încadrează.” **[Aplică]** → echipamentele verzi devin alese și suma lor = `verdeNou`; motorul recalculează, cifra numără în sus și ecranul trece lin în **R-ok** (fără schimbare de ecran).
4. „← Schimbă sumele” → C1. Butoanele de jos: **[Sună-ne]** (contur) rămâne; „Trimite-ne analiza” apare doar în R-ok. Fără drumul până la bani.

**Fără sume** *(totalul e 0, de ex. „Altă sumă” 0 peste tot)*: nu se ajunge la R; „Altă sumă” nu acceptă 0 (eroarea câmpului, ca la e-DRIVE).

### T · Trimite-ne analiza
- Exact ca la e-DRIVE (**simulată**; trimiterea reală e parcată, decizia utilizatorului din 21 oct). Analiza conține firma, răspunsurile și rezultatul acestui calculator (grantul, creditul, partea verde).

### X1 · Oprirea
- Ca la e-DRIVE, cu titlul „**Din păcate, firma nu poate aplica la SME Eco-Tech.**”, motivele motorului (formă, stare, înființată după 2021, fără cifră de afaceri în 2024, CAEN exclus, nu e IMM) și „Hai să vorbim: poate găsim împreună altă finanțare potrivită.” **[Sună-ne]** **[Încearcă alt CUI]**.

## 5. Drumul până la bani (pe R-ok)

1. ✓ **Verificarea preliminară** — „Gata. Știi cât poți primi.”
2. **Ne trimiți analiza** — „Un click, fără obligații.” ← *următorul pas, pulsează discret*
3. **Te sunăm** — „Verificăm împreună firma și lista de cumpărături.”
4. **Pregătim dosarul** — „Ofertele de preț, planul de cheltuieli, actele. Ne ocupăm noi.”
5. **Te înscriem online** — „[[Primul venit, primul servit]]. Termenul: 30 decembrie 2026, ora 20:00.”
6. **Acordul și creditul** — „Banca parteneră decide creditul în cel mult 30 de zile lucrătoare.”
7. **Echipamentele și banii** — „Cumperi în 12 luni. Plățile vin din grant și din credit.”

## 6. Glosarul (în plus față de e-DRIVE)

- **echipamente verzi** — „Echipamente pentru energie regenerabilă, reciclare sau eficiență energetică: panouri fotovoltaice, pompe de căldură, echipamente de reciclare, centrale și sisteme eficiente.”
- **grant** — „Bani nerambursabili: nu îi dai înapoi.”
- **credit bancar** — „Restul investiției, împrumutat de la o bancă parteneră: Banca Transilvania, BRD, CEC Bank, UniCredit Bank sau ProCredit Bank.”
- **se decontează** — „Ți se plătește din grant și din credit.”
- **primul venit, primul servit** — „Nu există punctaj: cererile complete se aprobă în ordinea înscrierii, până se termină bugetul.”
- Refolosite: **microîntreprindere / întreprindere mică / mijlocie**, **TVA**.

## 7. Detalii

- **Insigna „Activ”:** verde (design.md §1). Dacă nu există încă un token verde, folosește `#1E7B4F` (culoarea „ok” din calculatoarele de pe site) cu text alb; „Anunțat” rămâne auriu.
- **Sumele în lei:** `266.000 lei`, cu spațiu nedespărțit înainte de „lei”.
- **Starea motorului:** toate cifrele, motivele, problemele, sfaturile și `verdeNou` vin din `calc()`; scenariul doar le pune în ecrane.
