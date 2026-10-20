# T02 · Conversația e-DRIVE: vie, organică, în stilul site-ului
Stare: PR #2
Depinde de: T01 (pe `main`)

## Scopul

Înlocuiește pagina provizorie `/e-drive` cu **calculatorul conversațional complet**, de la CUI până la rezultat, drumul până la bani și „Trimite-ne analiza” (trimiterea reală vine în T03; aici e simulată). Feedback-ul utilizatorului după T01: **nu seamănă cu site-ul** și **nu e viu și organic**; vrea o experiență **fluidă, în care opțiunile apar și dispar**, nu o pagină statică. Asta e miza task-ului: **aspectul exact al site-ului + mișcarea**.

Citește întâi: **`docs/design.md`** (tokenii exacți ai site-ului și principiile mișcării), **`docs/flux-edrive.md`** (pașii, textele, valorile implicite), `CLAUDE.md`.

## Ce faci

### 1. Identitatea site-ului (corectura față de T01)
- **Înlocuiește paleta inventată din T01** (`hartie`, `auriu #c9a227` etc.) cu **tokenii exacți** din `docs/design.md` §1 (aceleași nume ca pe site: `primary`, `secondary`, `base`, `senary`, `tertiary`, `quaternary`, `quinary`, `accent`, `accent-dark` + culorile mesajelor). Fundalul paginii `#F6F7F9`, cardurile albe cu chenar `#DDE2EA` și colțuri 6px, butoanele bleumarin cu colțuri 4px, textul 17px / 1,6.
- **Rama paginii ca pe site** (`docs/design.md` §1 „Rama paginii”): antetul bleumarin, **banda programului** (Fonduri nerambursabile ›, insigna „Anunțat”, titlul „Finanțare pentru mașini electrice: e-DRIVE pentru IMM-uri”, rezumatul „Până la 30.000 € pentru fiecare mașină electrică nouă care înlocuiește o mașină pe benzină sau motorină a firmei.”), apoi calculatorul, apoi subsolul scurt. Aplică aceeași ramă și pe `/`.

### 2. Scenariul ca date (`src/scenariu/edrive.ts`)
- Toți pașii din `docs/flux-edrive.md` (0 CUI · 1 Firma, cu „Nu, corectez” și întrebările minime · 2 Mașinile vechi, cu ramura promisiunii · 3 Mașinile noi, pe rând, cu prețurile și UE · 4 Rezultatul), **cu toate textele în acest fișier**, nu în componente.
- Un format simplu și tipizat (ex. pași cu `id`, tip — `mesaj`, `cui`, `alegere`, `suma`, `cardFirma`, `rezultat` —, texte, opțiuni, condiții de afișare și următorul pas în funcție de răspuns și de rezultatul motorului). Starea conversației = răspunsurile date; **toate cifrele și eligibilitatea vin din motor** (`calc`, `evalueazaFirma`, `incadrare`), recalculate la fiecare răspuns.
- Scopul: utilizatorul (sau planificarea) să poată schimba un text, ordinea sau o opțiune **doar în acest fișier**. Pune un comentariu scurt în capul fișierului cu „cum modifici”.

### 3. Interfața conversației (`src/ui/`)
Componente generice care desenează pașii din scenariu, după **principiile mișcării din `docs/design.md` §2** (toate cele 10). În special:
- **Vocea calculatorului:** mesaje scurte, cu un mic avatar / monogramă „DD” (bleumarin cu auriu), precedate de indicatorul „scrie…” când calculatorul „vorbește”.
- **Opțiunile ca butoane** care **apar în cascadă** și, la alegere, **se transformă în răspuns** (`layoutId`), restul se strâng și dispar. Întrebarea trecută se comprimă într-un rând.
- **Pastilele răspunsurilor** (sus sau în firul conversației, alegi tu ce e mai clar pe telefon): la atingere, te întorci la acea întrebare; răspunsurile de după rămân dacă sunt încă valabile, motorul recalculează.
- **Cardul firmei** (denumirea, localitatea, categoria, angajații), intră animat după „Caut firma la ANAF…”; cifrele din bilanț nu se arată ca formular.
- **Banda de scor**, fixă sus (sub antet) din momentul în care firma e încadrată: scorul din 100 care **numără animat**, o bară subțire, eticheta („Microîntreprindere · 80 de puncte”), „+20” auriu care urcă la câștig. Pe telefon, compactă.
- **Antrenorul:** un mesaj distinct (accent auriu discret), omenesc, la întrebarea UE și la rezultat, dacă lipsesc puncte.
- **Glosarul:** cuvintele grele din texte (IMM, microîntreprindere, autoturism / microbuz (M1 / M2), asamblată în UE, promisiune notarială, TVA, minimis) **subliniate punctat**; la atingere, o explicație scurtă într-un balon / foaie de jos (pe telefon). Definițiile în scenariu (sau un `glosar.ts` alături).
- **Rezultatul:** scorul mare care numără, **cele 3 propoziții** din specificație, **bara banilor** (finanțarea / partea ta / TVA, segmente care cresc animat, cu legendă), sfaturile motorului (cu „Aplică” acolo unde motorul îl dă, ex. UE), nota orientativă.
- **Drumul până la bani** (textele din specificație): vertical pe telefon, pasul 1 bifat auriu, pasul 2 pulsând discret ca „următorul”; pașii apar în cascadă când se ajunge la rezultat.
- **„Trimite-ne analiza”** (buton plin) + **„Sună-ne”** (contur, `tel:+40749589848`). „Trimite-ne analiza” deschide o foaie cu **numele** și **telefonul** (emailul opțional) și un rezumat a ce pleacă; la trimitere: **simulare** (~800 ms, apoi „Am primit analiza ta. Te sunăm noi.”), iar **pasul 2 din drum se bifează animat** și pasul 3 devine „următorul”. Pregătește o funcție `construiesteAnaliza(stare)` care produce obiectul cu tot ce trebuie trimis (firma, răspunsurile, rezultatul, contactul) — T03 o va folosi pentru email.
- **Opririle blânde** (PFA, radiată, CAEN 01 / 03, peste IMM etc.): mesaj omenesc cu motivul din motor, fără roșu agresiv, + „Sună-ne” și **[Încearcă alt CUI]**.
- **Telefonul întâi:** totul arată și se simte bine la 390×844 și 360×740; tastatura numerică la CUI și sume; nimic ascuns sub tastatură; zonele de atingere ≥ 44px.

### 4. Pagina
- `/e-drive` = conversația (pagina provizorie din T01 se șterge). `/` = rama + cardul e-DRIVE (în stilul site-ului).
- Un **link discret „Reia de la început”** în conversație.

### 5. Verificarea
- `npm run lint`, `npm run build`, `npm test` trec (motorul nu se schimbă; testele T01 rămân verzi).
- **Playwright, parcursuri complete** (telefon 390×844 și desktop 1280×800), cu CUI-urile demo: `1` (micro, 2 autoturisme, una UE, una „Nu știu” → rezultat + „Aplică” UE → 100), `3` (mijlocie, un microbuz, „Altă sumă”), `5` (PFA → oprire blândă → „Încearcă alt CUI”), `9` (fără bilanț → întrebările minime → rezultat), plus „Trimite-ne analiza” simulat (pasul 2 bifat) și întoarcerea la o întrebare prin pastilă.
- **Capturi** în `docs/capturi/T02/`: pentru fiecare pas important, pe telefon și desktop. **Plus o înregistrare video Playwright pe telefon** (`.webm`) a parcursului cu CUI `1`, ca să se vadă mișcarea.
- În raport: ce ai făcut pentru „viu și organic” (pe scurt, concret) și ce n-ai reușit.

## Nu faci

- **Nicio schimbare în motor** (`src/motor/`) în afara unor funcții ajutătoare noi, pure, dacă scenariul are nevoie (fără reguli noi de finanțare). Eroarea de virgulă mobilă de la prag rămâne cum e (decizie în așteptare).
- Trimiterea reală a emailului (T03), AI, bază de date.
- Nu modifica `docs/` (în afara capturilor).

## Gata când

- PR deschis, cu raportul standard și cu previzualizarea Vercel funcțională.
- Pe telefon, parcursul cu CUI `1` merge cap-coadă fără niciun câmp de tip formular în afară de CUI și (opțional) „Altă sumă”; culorile, fonturile, butoanele și rama arată ca pe dezvoltaredigitala.ro.
- Textele vin toate din `src/scenariu/`.
- La final, `Stare:` din acest fișier → `PR #N`.
