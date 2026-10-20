# Fluxul e-DRIVE (specificația experienței)

*Sursa de adevăr pentru ce spune și ce face calculatorul e-DRIVE în playground. Aspectul și mișcarea: `docs/design.md`. Se modifică doar prin task-uri sau de planificare. Versiunea: 20 oct 2026, 13:00 (valorile implicite pentru T02: prețurile, „Nu știu”, firma fără date, drumul până la bani).*

## Ideea

Calculatorul **stă de vorbă cu omul**: îi cere CUI-ul și, printr-o interfață dinamică, plăcută, aproape organică, îl duce prin toți pașii până la scor și la „trimite-ne analiza”. Omul trebuie să simtă că **e înțeles** și că **se apropie deja de bani**.

Publicul: patroni de IMM-uri, adesea fără răbdare și fără cunoștințe despre fonduri; **telefonul contează cel mai mult**.

## Principiile (deciziile utilizatorului)

1. **Fără AI.** Conversația e **scrisă de noi** (scenariu). Senzația că „te înțelege” vine din: răspunsuri cu datele lui („Am găsit-o: **Exemplu SRL**, din Botoșani”), reacții la fiecare răspuns, ritm (puncte de „scrie…”, apariții line, cifre care cresc animat).
2. **Primul pas e CUI-ul.**
3. **Nu arată ca un formular de contabilitate.** O întrebare pe rând, răspunsuri prin **butoane** (frecare minimă), câmp liber doar unde chiar trebuie (CUI, prețul exact).
4. **Rezultatul apare pe parcurs**, nu doar la final: banda de scor vizibilă tot timpul, după pasul firmei.
5. **Limbaj omenesc.** Rezultatul răspunde la întrebările omului: *Pot? Cât primesc? Cât plătesc eu?*
6. **Antrenorul live:** spune omenește ce câștigi printr-o alegere.
7. **Cuvintele grele** (IMM, microîntreprindere, M1 / M2, asamblată în UE, promisiune notarială, TVA, minimis) sunt **subliniate** și au o explicație scurtă la atingere.
8. **Final cu legătură spre noi:** „Trimite-ne analiza” (ajunge la `contact@dezvoltaredigitala.ro`) + „Sună-ne”.
9. **Drumul până la bani**, cu accent: scurt, clar, omul vede că e deja pe drum.

## Pașii

### 0 · Salutul și CUI-ul
> „Salut! Hai să vedem cât poate primi firma ta pentru mașini electrice. Îmi spui CUI-ul?”

Un singur câmp mare, `inputmode="numeric"`, acceptă și „RO” în față (se ignoră). Buton „Caută”.

### 1 · Firma
- „Caut firma la ANAF…” (indicator viu).
- Apare **cardul firmei**: denumirea, localitatea, categoria (micro / mică / mijlocie), numărul de angajați. Cifrele din bilanț (CA, active, datorii, capitaluri) **nu se arată ca formular**; sunt ascunse în spatele unui „corectează” discret.
- „Asta e firma ta?” **[Da]** **[Nu, corectez]**
- După „Da” apare **banda de scor**: „Pornești cu **80 de puncte**, pentru că ești microîntreprindere.” (70 mică, 65 mijlocie.)
- **Opriri blânde** (cu explicație omenească și „Hai să vorbim” / „Sună-ne”): PFA / întreprindere individuală sau familială; altă formă decât societate; radiată; insolvență, faliment, lichidare, dizolvare, suspendare; CAEN principal 01 sau 03; firma nu e IMM.
- **Avertismente** (conversația continuă): inactivă fiscal; capitaluri proprii ≤ 0 sau datorii / capitaluri ≥ 7,5 (scrisoare de bonitate, neeliminatoriu).
- **[Nu, corectez]** → două opțiuni: **[Am greșit CUI-ul]** (înapoi la CUI) · **[Cifrele nu mai sunt la zi]** (întrebările minime de mai jos, cu valorile ANAF ca punct de plecare).
- **ANAF nu răspunde / bilanț lipsă / forma necunoscută / CUI negăsit:** mesaj prietenos („Nu găsesc datele firmei acum. Îmi spui tu câteva lucruri și mergem mai departe.”) + **întrebările minime prin butoane**, ca să putem încadra firma:
  - *Forma* (doar dacă nu e cunoscută): **[SRL sau SA]** **[PFA, II sau IF]** **[Altă formă]**.
  - *Câți angajați are firma?* **[0–9]** **[10–49]** **[50–249]** **[250 sau mai mulți]** → în motor: 5 / 30 / 150 / 300.
  - *Cifra de afaceri de anul trecut?* **[sub 10 mil. lei]** **[10–50 mil. lei]** **[50–250 mil. lei]** **[peste 250 mil. lei]** → în motor: 2.000.000 / 30.000.000 / 150.000.000 / 400.000.000 lei, cu cursul implicit.
  - Rezultatul se marchează discret ca „estimat din ce ne-ai spus”.

### 2 · Mașinile vechi
- „Câte mașini pe benzină sau motorină vrei să înlocuiești?” — separat **autoturisme** și **microbuze** (butoane 0 / 1 / 2 / 3 / mai multe; total cel puțin 1, maximum 10).
- „Sunt ale firmei de cel puțin un an?” **[Da]** **[Nu]**
  - La **Nu**: explicația, omenește: poți cumpăra una cu promisiune la notar (cu RCA și ITP valabile și anul trecut), înainte de contractul de finanțare; costul ei nu se decontează. **[Pot face asta]** **[Nu]** (Nu → oprire blândă + „Hai să vorbim”).

### 3 · Mașinile noi (pe rând, câte una pentru fiecare mașină înlocuită)
- **Categoria e aceeași cu a mașinii înlocuite**, spus clar: „Autoturismul se înlocuiește tot cu un autoturism, iar microbuzul cu un microbuz.”
- „Cam cât costă mașina electrică, fără TVA?” — **butoane cu valori rotunde** (valoarea apăsată intră în calcul; se afișează „cam …”) **și** **[Altă sumă]** (câmp numeric):
  - autoturism: **[~20.000 €]** **[~25.000 €]** **[~30.000 €]** **[~35.000 €]** **[~45.000 €]** **[Altă sumă]**; sub butoane, mic: „Finanțarea e de cel mult 30.000 € pe autoturism. Peste, diferența o plătește firma.”
  - microbuz: **[~35.000 €]** **[~45.000 €]** **[~60.000 €]** **[Altă sumă]**; „La microbuz nu există plafon pe vehicul.”
  - La a doua mașină din aceeași categorie: **[La fel ca prima]** apare primul.
- „E asamblată în UE?” **[Da]** **[Nu]** **[Nu știu]**, cu **antrenorul**: „Dacă alegi un model asamblat în UE, primești 20 de puncte în plus.” Bonusul se dă doar dacă **toate** mașinile sunt asamblate în UE (spus omenește când contează: „Ca să primești cele 20 de puncte, toate mașinile trebuie să fie asamblate în UE.”).
  - **[Nu știu]** → „Nicio grijă, verificăm împreună modelul. Deocamdată nu socotesc cele 20 de puncte.” (în motor: `ue: false`); antrenorul rămâne vizibil la rezultat: „Cu un model asamblat în UE ai avea 100.”
- Banda de scor se actualizează după fiecare răspuns.

### 4 · Rezultatul
- **Scorul** mare, animat (din 100).
- **Trei propoziții:** „Poți aplica. Primești până la **X €**. Tu plătești TVA-ul, cam **Y €**.” (+ diferența peste plafon, dacă există.)
- **Bara banilor:** finanțarea / partea ta / TVA-ul.
- **Drumul până la bani** (vezi mai jos).
- **[Trimite-ne analiza]**: cere doar numele și telefonul (emailul opțional); restul (firma, răspunsurile, rezultatul) pleacă automat la `contact@dezvoltaredigitala.ro`. Lângă: **[Sună-ne]** (`tel:+40749589848`).
- Nota mică: „Estimare orientativă după regulile e-DRIVE Măsura 1. Eligibilitatea și punctajul final le stabilește Ministerul Transporturilor și Infrastructurii.”

### Drumul până la bani
O linie scurtă, vizibilă, cu pasul curent luminat; omul trebuie să simtă că e **deja pe drum**:

1. ✓ **Verificarea preliminară** — „Gata. Știi cât poți primi.”
2. **Ne trimiți analiza** — „Un click, fără obligații.” (se aprinde după trimitere)
3. **Te sunăm** — „Verificăm împreună detaliile.”
4. **Pregătim dosarul** — „Ofertele, actele, cererea. Ne ocupăm noi.”
5. **Depunem la deschiderea apelului** — „Data nu e anunțată încă. Cu dosarul gata, depunem primii.”
6. **Contractul de finanțare**
7. **Mașina și banii** — „Cumperi mașina, primești finanțarea.”

Fără durate (nu le putem promite). Linia e **verticală pe telefon**, cu pasul curent evidențiat și restul estompați; pașii deja făcuți au bifa aurie.

## Peste tot
- **Pastilele răspunsurilor** date (sus): la atingere poți schimba un răspuns fără să o iei de la capăt.
- **Ritmul:** puncte de „scrie…” scurte (~400–700 ms), apariții line; respectă `prefers-reduced-motion`.
- **Accesibil:** butoane reale, focus vizibil, `aria-live` pentru mesajele noi, contrast bun.

## Regulile programului (motorul)
Sunt în `docs/referinta/edrive-motor-wp.js` (motorul de pe site) și se portează **identic** în TypeScript. Pe scurt: punctaj = mărimea firmei (micro 80 / mică 70 / mijlocie 65) + 20 dacă toate mașinile sunt asamblate în UE; finanțarea = suma prețurilor fără TVA, cu plafon de 30.000 € pe autoturism (M1), fără plafon la microbuz (M2); TVA 21% o plătește firma; încadrarea IMM în € cu cursul BNR din 31.12 al anului bilanțului (2024: 4,9741; 2025: 5,0985). Nu există prag: cererile se finanțează în ordinea punctajului, la egalitate decide ora depunerii.
