# calculatoare-lab

Playground pentru **calculatoarele de fonduri nerambursabile** ale site-ului https://dezvoltaredigitala.ro (firma C&A Connect S.R.L., Botoșani). Aici refacem calculatoarele într-o formă **conversațională**, le arătăm colegilor pe telefon, iterăm, iar forma câștigătoare se mută apoi pe site (WordPress). **Nimic de aici nu atinge site-ul.**

Calculatoarele din laborator (toate în aceeași formă, pe aceleași ecrane):
- **e-DRIVE** (`/e-drive`): finanțare pentru mașini electrice, IMM-uri.
- **SME Eco-Tech** (`/sme-eco-tech`): grant 40% și credit bancar pentru echipamente verzi, IMM-uri.

## Cum se lucrează (important)

- **Planificarea se face în altă parte** (un chat de planificare). Tu, Claude Code, **execuți task-uri** din `tasks/` (format și reguli: `tasks/README.md`).
- Un task = **o ramură** din `main` (`tNN-nume-scurt` sau ramura atribuită de sesiune) → commit-uri → **Pull Request** spre `main` cu **raportul** cerut în `tasks/README.md`. **Nu faci merge** singur.
- Dacă ceva din task e neclar sau contrazice documentele: alegi varianta cea mai rezonabilă, o scrii la „Presupuneri” în raport și mergi mai departe. Nu inventa reguli de finanțare.
- Nu modifica `docs/flux-edrive.md`, `docs/flux-sme.md`, `docs/design.md` și `docs/referinta/` decât dacă task-ul o cere explicit.

## Documentele

| Fișier | Ce e |
|---|---|
| `docs/flux-edrive.md` | **Specificația experienței** e-DRIVE (pașii, textele, principiile). Sursa de adevăr pentru UX și forma tuturor calculatoarelor |
| `docs/flux-sme.md` | **Specificația experienței** SME Eco-Tech: doar ce diferă de e-DRIVE (ecranele, textele, glosarul) |
| `docs/design.md` | **Identitatea exactă a site-ului** (culori, fonturi, forme, rama paginii) și **principiile mișcării** („viu și organic”). Valabil pentru toate calculatoarele |
| `docs/referinta/edrive-motor-wp.js` | Motorul e-DRIVE de pe site (JS ES5), de portat **identic** |
| `docs/referinta/sme-motor-wp.js` | Motorul SME Eco-Tech de pe site (JS ES5), de portat **identic** |
| `docs/referinta/anaf-api.md` | Contractul API-ului firmei (proxy-ul ANAF de pe site) |
| `tasks/README.md` | Procesul și formatul task-urilor și al raportului |
| `tasks/TNN-*.md` | Task-urile, în ordine |

## Stack-ul

- **Next.js** (App Router, ultima versiune stabilă) + **TypeScript** (strict) + **Tailwind CSS** + **Framer Motion**.
- **npm**. **Vitest** pentru motor; **Playwright** pentru verificarea interfeței (Chromium; capturi pe telefon 390×844 și desktop 1280×800).
- Găzduire: **Vercel**, legat de repo (deploy automat; fiecare PR primește link de previzualizare).
- Fără AI deocamdată (decizie). Fără bază de date.

## Arhitectura (de respectat)

```
src/
  motor/          # TypeScript pur, FĂRĂ React / Next / DOM. Regulile programelor + calc().
    anaf.ts, cui.ts   # comune: răspunsul API-ului firmei, curățarea CUI-ului
    <program>/    #   config.ts (regulile), calc.ts, anaf.ts (răspuns ANAF → date), fixtures/, *.test.ts
                  #   (edrive/, sme/)
  scenariu/       # calculatoarele ca DATE: pașii, textele, butoanele, ramificațiile
    <program>.ts  #   scenariul + obiectul „program” (edrive.ts, sme.ts); contextul lui (context.ts, sme/)
    tipuri.ts, derulare.ts, actiuni.ts, program.ts, comun.ts   # comune tuturor calculatoarelor
  ui/             # ecranele comune (ui/ecrane: Calculator, progresul, rezultatul, drumul, foaia...) și rama
    programe/     #   câte un fișier pe calculator, care leagă programul de ecrane
  app/            # paginile Next (/e-drive, /sme-eco-tech) + rutele API (app/api/firma)
```

- **Un calculator nou** = un motor în `src/motor/<program>/`, un scenariu + obiectul „program” în `src/scenariu/<program>.ts`, un fișier în `src/ui/programe/` și o pagină. Ecranele nu se schimbă.

- **Motorul** decide toate cifrele și eligibilitatea; interfața doar afișează. Motorul trebuie să poată fi întors ușor în JS simplu pentru WordPress.
- **Scenariul** e editabil fără să atingi interfața (texte, ordine, butoane): asta face din proiect un sandbox.
- **Secretele** (SMTP etc.) doar în variabile de mediu (Vercel); niciodată în cod. `.env.example` cu numele lor.

## Convenții

- **Textele din interfață: română, cu diacritice corecte** (ș, ț cu virgulă, nu cu sedilă). Ton cald, simplu, la persoana a II-a („tu”), propoziții scurte.
- Numere în format românesc: `25.000 €`, `12,5`; spațiu nedespărțit între număr și `€`.
- Identitatea vizuală: **exact tokenii din `docs/design.md`** (nu se inventează culori). Mobile-first; telefonul contează cel mai mult.
- Accesibilitate: butoane reale, focus vizibil, `aria-live` pentru mesajele noi, `prefers-reduced-motion`.
- Date de contact: telefon `+40 749 589 848`, email `contact@dezvoltaredigitala.ro`.
