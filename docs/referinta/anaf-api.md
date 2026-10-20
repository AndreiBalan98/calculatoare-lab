# API-ul firmei (proxy-ul ANAF de pe site)

Site-ul are deja un proxy către ANAF (mu-plugin WordPress `dd-anaf.php` v1.1). Playground-ul **îl refolosește**, nu cheamă ANAF direct.

**Endpoint:** `GET https://dezvoltaredigitala.ro/wp-json/dd/v1/firma?cui=<CUI>`
(opțional `&istoric=1` = 3 ani de bilanț; **e-DRIVE nu are nevoie**, e mai lent cu ~1 s / an)

## Răspuns reușit (`200`, JSON)

```json
{
  "ok": true,
  "cui": "12345678",
  "denumire": "EXEMPLU SRL",
  "adresa": "MUN. BOTOȘANI, STR. ...",
  "forma_juridica": "SOCIETATE COMERCIALĂ CU RĂSPUNDERE LIMITATĂ",
  "forma_organizare": "PERSOANA JURIDICA",
  "caen": "6201",
  "stare": "INREGISTRAT din data 01.01.2015",
  "inactiv": false,
  "radiat": false,
  "data_inregistrare": "2015-01-01",
  "judet": "BOTOȘANI",
  "judet_cod": "BT",
  "bilant": {
    "an": 2025,
    "angajati": 4,
    "cifra_afaceri": 1500000,
    "active": 900000,
    "datorii": 300000,
    "capitaluri": 200000,
    "capital_social": 200,
    "profit_brut": 120000,
    "profit_net": 100000
  }
}
```

- Sumele sunt în **lei**; profitul e negativ la pierdere.
- `bilant` poate fi `null` (bilanț nepublicat) → datele se cer omului.
- Câmpurile pot lipsi sau fi `null`; codul trebuie să reziste.
- **ANAF nu publică profitul din exploatare**, doar brut și net.

## Erori

`{ "ok": false, "cod": "...", "mesaj": "text în română, afișabil" }`

| `cod` | HTTP | Când |
|---|---|---|
| `cui_invalid` | 400 | Cifra de control a CUI-ului e greșită |
| `negasit` | 404 | Firma nu există |
| `prea_multe` | 429 | Peste 30 de căutări noi / oră / IP |
| `ocupat` | 503 | Coada către ANAF e plină |
| `anaf_indisponibil` | 502 / 503 | ANAF nu răspunde |

## De știut

- Cache 24 h pe CUI (o căutare repetată e instantanee și nu consumă din limită).
- Limita de 30 / oră / IP se aplică **IP-ului serverului care cheamă** (Vercel). Pentru dezvoltare și demo-uri: **modul simulat** (fixture-uri locale), vezi `tasks/T01`.
- Starea „rea” (neeligibil): textul `stare` conține INSOLV, FALIMENT, LICHID, DIZOLV, SUSPEND sau RADIER (după eliminarea diacriticelor). `inactiv: true` = doar avertisment.
