# Task-urile

**Fluxul de lucru:**

1. **Planificarea** (chatul de planificare cu utilizatorul) scrie un task nou aici: `tasks/TNN-nume-scurt.md`, pe `main`.
2. **Utilizatorul** deschide o sesiune **Claude Code** pe acest repo și scrie: `Execută tasks/TNN-nume-scurt.md`.
3. **Claude Code** face o ramură `tNN-nume-scurt`, implementează, verifică, deschide un **Pull Request** spre `main` cu raportul de mai jos. **Nu face merge.**
4. **Utilizatorul** se uită pe linkul de previzualizare Vercel al PR-ului (pe telefon) și aduce impresiile în chatul de planificare.
5. **Planificarea** citește PR-ul, face review; utilizatorul face merge (sau se scrie un task de corecturi).

## Formatul unui task

```
# TNN · Titlu
Stare: de făcut | în lucru | PR #N | gata
Depinde de: TMM (sau —)

## Scopul        (1–3 rânduri: ce și de ce)
## Ce faci       (pașii / cerințele concrete)
## Nu faci       (limitele, ca să nu se întindă)
## Gata când     (criteriile de acceptare, verificabile)
## Raportul      (ce trebuie să conțină PR-ul, dacă e ceva în plus față de standard)
```

## Raportul standard (descrierea PR-ului)

- **Ce s-a făcut** (pe scurt, pe puncte).
- **Cum s-a verificat:** comenzile rulate și rezultatul (`npm run build`, `npm test`, Playwright), plus **capturi** telefon / desktop atașate sau puse în `docs/capturi/TNN/`.
- **Presupuneri** făcute acolo unde task-ul era neclar.
- **Întrebări deschise** pentru planificare.
- **Ce rămâne** / idei pentru task-ul următor.
- Ce trebuie să facă utilizatorul (ex. variabile de mediu în Vercel), dacă e cazul.
