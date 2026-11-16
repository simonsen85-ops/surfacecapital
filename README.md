# Surface Capital: website

Statisk multipage-site for Surface Capital A/S, live på **www.surfacecapital.dk**.
Ren HTML/CSS/JS, ingen build og ingen afhængigheder. Hostes på GitHub Pages fra `main`.
Arbejdsnoter, datakilder og regler (tal, design, sprog): **`CLAUDE.md`**. Designsystem: `docs/design-system.md`.

## Sider
```
index.html        Forside: hero, citat, om fonden, partnerskab, track record-teaser
partnerskab.html  Principperne for partnerskabet
tilgang.html      Tilgang til investering
performance.html  Interaktiv graf: forvalterens track record 2016–2025 + fondens kvartaler fra 2026
trackrecord.html  Handlerne bag afkastet: positioner og bidrag 2016–2025
forvalter.html    Forvalteren
vilkaar.html      Vilkår: fees, ind- og udtræden
materialer.html   Investorpræsentation og investorbreve
kontakt.html      Kontakt
```
Delt på tværs af alle sider: `css/style.css`, `js/main.js`, nav, footer og investor-gaten.

## Mapper
```
assets/deck/          Surface_Capital_Investorpraesentation.pdf (eksport af Google Slides "Surface Capital 10 år – v2")
assets/investorbreve/ Kvartalsvise investorbreve (PDF)
assets/img, fonts/    Billeder og Crimson Text (self-hosted)
js/                   performance.js (alle performance-tal), trackrecord.js + trackrecord-data.js (genereret)
data/                 Afkastserier med kilder (CSV), fee-vandfald, indeksserier til decket
tools/                benchmarks_dkk.py (benchmarks i DKK), bilag1.py (fees + Bilag 1), build_trackrecord_data.py
docs/                 Designsystem, runbook og deck-noter
```
`CLAUDE.md`, `README.md`, `docs/`, `data/` og `tools/` ligger i repoet, men publiceres ikke på hjemmesiden (`_config.yml`).

## Arbejdsgang
- Se lokalt: `python -m http.server` i repo-mappen, åbn http://localhost:8000 og bekræft investor-gaten.
- Publicér: commit og push til `main`. Siden er live efter ca. et minut.
- Arbejdskopien ligger uden for Google Drive. GitHub er backup og historik.

## Vedligehold
- **Nyt kvartal:** fondens tal i `SURFACE.quarters` i `js/performance.js`; benchmark (MSCI ACWI DKK og USD) via
  `python tools/benchmarks_dkk.py --write` efter ny MSCI-data. Se `CLAUDE.md`.
- **Nyt investorbrev:** læg PDF'en i `assets/investorbreve/` og tilføj en `<a class="doc">`-linje i `materialer.html`.
- **Ny investorpræsentation:** eksportér Google Slides-decket som PDF og overskriv
  `assets/deck/Surface_Capital_Investorpraesentation.pdf` (behold navnet).

## Domæne og DNS (simply.com)
Settings → Pages: Deploy from a branch, `main` / `/ (root)`, custom domain `www.surfacecapital.dk` (filen `CNAME`), Enforce HTTPS.
Apex `surfacecapital.dk`: fire A-records på `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
`www`: CNAME → `simonsen85-ops.github.io.`

*Compliance: siden har en professionel-investor-bekræftelse og disclaimere. Få rådgiver/Finanstilsynet til at bekræfte, hvad der må ligge offentligt for en registreret AIF.*
