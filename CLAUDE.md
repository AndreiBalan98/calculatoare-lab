# calculatoare-lab

Playground pentru **calculatoarele de fonduri nerambursabile** ale site-ului https://dezvoltaredigitala.ro (firma C&A Connect S.R.L., Botoșani). Aici refacem calculatoarele într-o formă **conversațională**, le arătăm colegilor pe telefon, iterăm, iar forma câștigătoare se mută apoi pe site (WordPress). **Nimic de aici nu atinge site-ul.**

Primul calculator: **e-DRIVE** (finanțare pentru mașini electrice, IMM-uri).

## Cum se lucrează (important)

- **Planificarea se face în altă parte** (un chat de planificare). Tu, Claude Code, **execuți task-uri** din `tasks/` (format și reguli: `tasks/README.md`).
- Un task = **o ramură** `tNN-nume-scurt` din `main` → commit-uri → **Pull Request** spre `main` cu **raportul** cerut în `tasks/README.md`. **Nu faci merge** singur.
- Dacă ceva din task e neclar sau contrazice documentele: alegi varianta cea mai rezonabilă, o scrii la „Presupuneri” în raport și mergi mai departe. Nu inventa reguli de finanțare.
- Nu modifica `docs/flux-edrive.md` și `docs/referinta/` decât dacă task-ul o cere explicit.

## Documentele

| Fișier | Ce e |
|---|---|
| `docs/flux-edrive.md` | **Specificația experienței** e-DRIVE (pașii, textele, principiile). Sursa de adevăr pentru UX |
| `docs/referinta/edrive-motor-wp.js` | Motorul de pe site (JS ES5), de portat **identic** |
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
  motor/          # TypeScript pur, FĂRĂ React / Next / DOM. Regulile programului + calc().
    edrive/       #   config.ts (regulile), calc.ts, anaf.ts (răspuns ANAF → date), *.test.ts
  scenariu/       # conversația ca DATE: pașii, textele, butoanele, ramificațiile (edrive.ts)
  ui/             # componentele conversației (mesaj, butoane, card firmă, banda de scor, drumul până la bani...)
  app/            # paginile Next + rutele API (app/api/firma, app/api/analiza)
```

- **Motorul** decide toate cifrele și eligibilitatea; interfața doar afișează. Motorul trebuie să poată fi întors ușor în JS simplu pentru WordPress.
- **Scenariul** e editabil fără să atingi interfața (texte, ordine, butoane): asta face din proiect un sandbox.
- **Secretele** (SMTP etc.) doar în variabile de mediu (Vercel); niciodată în cod. `.env.example` cu numele lor.

## Convenții

- **Textele din interfață: română, cu diacritice corecte** (ș, ț cu virgulă, nu cu sedilă). Ton cald, simplu, la persoana a II-a („tu”), propoziții scurte.
- Numere în format românesc: `25.000 €`, `12,5`; spațiu nedespărțit între număr și `€`.
- Identitatea vizuală a site-ului: bleumarin `#14213D`, accent auriu, fonturi **Source Serif 4** (titluri) + **IBM Plex Sans** (text). Mobile-first; telefonul contează cel mai mult.
- Accesibilitate: butoane reale, focus vizibil, `aria-live` pentru mesajele noi, `prefers-reduced-motion`.
- Date de contact: telefon `+40 749 589 848`, email `contact@dezvoltaredigitala.ro`.
