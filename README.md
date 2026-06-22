# Surface Capital — website (multipage)

Statisk multipage-site bygget efter `Surface_Capital_Design_System.md`.
Ren HTML/CSS/JS — ingen build, ingen afhængigheder. Hostes på GitHub Pages.

## Sider
```
index.html        Forside (hero + citat + om fonden + performance-teaser)
tilgang.html      Tilgang til investering (7 principper)
performance.html  Performance · sidste 10 år (tal + graf)
forvalter.html    Rasmus Wisti Simonsen
vilkaar.html      Vilkår (fee + ind/udtræden)
materialer.html   Investorpræsentation + investorbreve
kontakt.html      Kontakt
```
Delt på tværs af alle sider: `css/style.css`, `js/main.js`, nav, footer og investor-gate.

## Læg de manglende filer ind
- Investorbrev → `assets/investorbreve/Surface_Capital_Investorbrev_Q1_2026.pdf` (præcis det navn).
- Deck → tjek at `assets/deck/Surface_Capital_Praesentation.pdf` er den rene investor-version (overskriv ved behov, behold navnet).

## Publicér på GitHub Pages
1. Opret offentligt repo (fx `surfacecapital`), læg ALLE filer i repo-roden, push til `main`.
2. Settings → Pages: Source = Deploy from a branch, Branch = `main` / `/ (root)`.
3. Custom domain: `www.surfacecapital.dk` → Save. (CNAME-filen ligger her allerede.)
4. Kryds Enforce HTTPS af, når DNS er klar.

## DNS hos simply.com
Apex `surfacecapital.dk` — fire A-records på `@`:
`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
`www` — CNAME → `simonsen85-ops.github.io.` (brug dit eget GitHub-brugernavn hvis et andet).
DNS kan tage op til ~24 timer.

## Vedligehold
- Nyt investorbrev: læg PDF i `assets/investorbreve/` og tilføj en `<a class="doc">`-linje i `materialer.html`.
- Indhold står som ren tekst i de enkelte .html-filer; layout/farver i `css/style.css`.

*Compliance: siden har en professionel-investor-bekræftelse + disclaimere. Få rådgiver/Finanstilsynet til at bekræfte, hvad der må ligge offentligt for en registreret AIF, inden go-live.*
