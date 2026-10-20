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

**Principiile:**
1. **Totul intră și iese animat.** Intrare: opacitate 0 → 1, deplasare 8–12px de jos, ușoară estompare (blur 4px → 0). Ieșire: invers, mai rapid. Fără apariții bruște.
2. **Resorturi, nu curbe liniare** (ex. `stiffness ~260–320, damping ~26–30`); durate scurte (150–350 ms). Nimic lent sau teatral.
3. **Opțiunile apar în cascadă** (decalaj 40–60 ms între ele).
4. **Alegerea se transformă, nu dispare:** butonul apăsat devine „răspunsul” (prin `layoutId`, se mută și se micșorează în locul lui), celelalte opțiuni se strâng și se estompează. Întrebarea trecută se comprimă într-un rând scurt.
5. **Spațiul se reașază lin** (`layout`): când ceva apare sau dispare, restul alunecă, nu sare.
6. **Ritm de conversație:** înainte de mesajul următor, un indicator „scrie…” (trei puncte care pulsează), **400–700 ms**, proporțional cu lungimea mesajului. Nu la fiecare micro-pas: doar când „vorbește” calculatorul.
7. **Cifrele numără:** scorul și sumele cresc animat (≈600 ms, decelerat) de la valoarea veche la cea nouă. La un câștig de puncte, un mic „+20” auriu urcă și se estompează lângă scor.
8. **Răspuns tactil:** butoanele se micșorează puțin la apăsare (scale 0,97); pe telefon, o vibrație foarte scurtă (`navigator.vibrate(8)`, unde există).
9. **Derularea urmărește conversația:** după fiecare pas, derulare lină astfel încât întrebarea nouă să fie vizibilă, cu focusul pe primul ei element interactiv (fără salturi bruște ale tastaturii pe telefon).
10. **`prefers-reduced-motion`:** fără deplasări, blur și numărători; doar estompări scurte și schimbări instant.

**Ce evităm:** confetti, sărituri exagerate, rotiri, animații care întârzie omul. Organic înseamnă **fluid și calm**, nu jucăuș.
