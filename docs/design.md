# Designul: identitatea site-ului și mișcarea

*Valabil pentru toate calculatoarele din laborator. Sursa tokenilor: variația „Instituțional” a temei WordPress de pe dezvoltaredigitala.ro (`styles/institutional.json`). **Valorile de mai jos sunt cele exacte de pe site; nu se inventează altele.***

## 1. Identitatea (exact ca pe site)

### Culorile

| Token (slug pe site) | Valoare | Folosire |
|---|---|---|
| `primary` | `#14213D` | bleumarin: antetul, banda programului, butoanele pline, titlurile, linkurile |
| `secondary` | `#0A1226` | bleumarin mai închis: hover pe butoane și linkuri |
| `base` | `#1B2433` | textul principal |
| `senary` | `#4A5568` | textul secundar (explicații, note) |
| `tertiary` | `#F6F7F9` | **fundalul paginii** |
| `background` | `#FFFFFF` | fundalul cardurilor și al secțiunilor albe |
| `quaternary` | `#DDE2EA` | chenarele (1px) |
| `quinary` | `#C9D1E0` | text deschis pe bleumarin, linii slabe |
| `accent` | `#E0A84A` | auriu **pe fond închis** (bleumarin) |
| `accent-dark` | `#8A5A12` | auriu **pe fond deschis** (etichete mici, cifre-cheie) |

Mesajele de stare (din calculatoarele de pe site): roșu `#A12622` pe `#FDECEC`; avertisment `#8A5A00` pe `#FFF6E0`; sfat `primary` pe `#E9EDF5`; informație `senary` pe `#F6F7F9`. Insignele de stare: verde pentru „Activ”, auriu pentru „Anunțat”.

### Tipografia
- **Text:** IBM Plex Sans, 400, **17px**, înălțimea liniei 1,6; culoarea `base`.
- **Titluri:** Source Serif 4, **600**, culoarea `primary`.
- **Mărimi:** 13 (x-small) · 14 (small) · 17 (base) · 22 (medium) · 28 (large, h3) · 40 (x-large, h2) · 56 (xx-large, h1); pe telefon fluide, mai mici.
- **Etichetele mici** (ex. „FINANȚARE” deasupra unei cifre-cheie): 13px, 600, majuscule, spațiere 0,08em, culoarea `accent-dark`.
- Cifrele mari: Source Serif 4, 600, `primary`.

### Formele
- **Cardurile:** fond alb, chenar 1px `quaternary`, colțuri **6px**, padding 24px (16–20px pe telefon). Fără umbre grele (cel mult una foarte fină).
- **Butoanele pline:** fond `primary`, text alb, colțuri **4px**, padding 14 / 26px, 600; hover `secondary`.
- **Butoanele contur:** chenar `primary`, text `primary`, fond alb; hover plin.
- **Câmpurile:** înălțime 46px, chenar `quaternary`, colțuri 8px; focus: chenar `primary` + inel `#E9EDF5` de 3px.
- **Focus vizibil** pe tot ce se apasă.

### Rama paginii (ca pe site)
- **Antetul:** bandă `primary` cu numele „Dezvoltare digitală” (Source Serif 4, alb; logo-ul real se adaugă mai târziu) și un link discret spre site. Pe telefon: compact.
- **Banda programului** (ca `.dd-program-banda` de pe site): fond `primary`, „Fonduri nerambursabile ›” mic în `quinary`, insigna de stare („Anunțat”, aurie), titlul serif alb, o propoziție de rezumat în `quinary`.
- **Conținutul:** pe `tertiary`, coloană centrală (calculatorul ~720px lățime maximă; pe telefon toată lățimea, cu 16px pe laterale).
- **Subsolul:** scurt, `primary`: telefonul, emailul, „© 2026 C&A Connect S.R.L.”.

## 2. Mișcarea: „viu și organic”

Scopul: interfața **respiră și reacționează**; nimic nu apare sau dispare brusc. Biblioteca: **Framer Motion** (`AnimatePresence`, `layout`, `layoutId`, resorturi).

**Principiile** (aplicate pe modelul „un ecran = o întrebare”, `docs/flux-edrive.md` v2):
1. **Ecranul se schimbă, pagina nu crește.** Întrebarea curentă pleacă (opacitate 1 → 0, urcă 16–24px, blur 0 → 4px, ~220ms) și vine următoarea (opacitate 0 → 1, de jos 16–24px, blur 4px → 0, resort). La **Înapoi**, direcția e inversă. Fără derulare între întrebări.
2. **Resorturi, nu curbe liniare** (ex. `stiffness ~260–320, damping ~26–30`); durate scurte (150–350ms). Nimic lent sau teatral.
3. **Ordinea intrării pe ecran:** ecoul (dacă e) → eticheta și întrebarea → opțiunile **în cascadă** (decalaj 40–60ms) → antrenorul și nota.
4. **Alegerea se vede, apoi ecranul pleacă:** butonul apăsat se umple `primary` cu bifă (~150ms), celelalte se estompează; după ~350ms, tranziția spre ecranul următor.
5. **Transformări în loc (în același ecran):** „Mai multe” și „Altă sumă” își transformă opțiunile animat (`layout`, `AnimatePresence`), fără ecran nou.
6. **Progresul e viu:** linia se umple pe un resort la fiecare răspuns; etapa curentă are un inel care respiră discret (scale 1 → 1,15, opacitate, ~2s, infinit, foarte subtil).
7. **Cifrele numără:** scorul și sumele din progres și din rezultat cresc animat (≈600ms, decelerat) de la valoarea veche la cea nouă. La un câștig de puncte, un „+20” auriu urcă și se estompează lângă scor.
8. **Răspuns tactil:** butoanele se micșorează puțin la apăsare (scale 0,97); pe telefon, o vibrație foarte scurtă (`navigator.vibrate(8)`, unde există).
9. **Focusul urmează ecranul:** după fiecare tranziție, focusul pe primul element interactiv al ecranului nou (`preventScroll`); câmpurile numerice deschid tastatura numerică fără să împingă scena.
10. **`prefers-reduced-motion`:** fără deplasări, blur, pulsații și numărători; doar estompări scurte (≤120ms) și schimbări instant.

**Ce evităm:** fire de chat, baloane, avatare, indicatoare „scrie…”, confetti, sărituri exagerate, rotiri, animații care întârzie omul. Organic înseamnă **fluid și calm**, nu jucăuș.
