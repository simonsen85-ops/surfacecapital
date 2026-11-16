# Surface Capital — Designsystem

Uddraget og verificeret fra det officielle deck (`Copy of Surface Capital 10 år`, pptx-kilden) i samarbejde med Rasmus Wisti Simonsen. Dette er den autoritative reference til hjemmeside og fremtidige materialer. Indsæt/vedhæft hele filen i en ny chat (eller giv den til Claude Code), så følges reglerne præcist.

---

## 1. Farver

Kun de to første er aflæst direkte fra deckets vektorer; resten er afledte/sekundære toner valgt til at understøtte dem (markeret).

| Token | Hex | Rolle | Regel |
|---|---|---|---|
| Navy (baggrund) | `#19303D` | Primær baggrund | Verificeret fra kilden |
| Guld (accent) | `#FFBA00` | **Kun adskillere**: tynde streger, understregninger, evt. datakurve | Verificeret. Bruges **aldrig** til tekst/underoverskrifter |
| Tekst | `#E6E6E6` | Al brødtekst OG titler | Verificeret. **Ingen ren hvid** nogen steder |
| Sølvgrå (sekundær) | `#C0C0C0` | Labels, kickers, underoverskrifter, fin print, akse-tekst | Findes i decket (sparsomt); brugt mere her |
| Kort-fyld | `#20404D` | Fyld i bokse/paneler (en anelse lysere end navy) | *Afledt* — ikke i original-decket (decket bruger ingen bokse) |
| Kort-kant | `#7A6422` | Dæmpet guldkant på bokse | *Afledt* |

Note: deckets egen performance-graf bruger en **grøn** linje (i decket en hård neon ~`#19FF19`). Hvis en graf skal ekko den, så brug en afdæmpet grøn — ikke neonen.

### Den vigtigste regel — guld
Guld er **reserveret til adskiller-linjer** (og evt. selve datakurven i en graf). Det må **ikke** bruges til tekst, labels eller underoverskrifter. Hierarki skabes af **størrelse, vægt, versaler og spatiering — ikke af farve**. Det holder guld fra at blive påtrængende.

---

## 2. Typografi

Én serif-familie bærer alt (old-style/Garamond-agtig). Ingen sans nødvendig.

| Brug | Font | Vægt | Farve |
|---|---|---|---|
| Titler / overskrifter | Crimson Text | **Bold (700)** | `#E6E6E6` |
| Brødtekst | Crimson Text | Regular (400) | `#E6E6E6` |
| Kursiv (kreditlinjer, captions, citater) | Crimson Text | Italic (400) | `#E6E6E6` |
| Tal / nøgletal / procenter | Crimson Text | **SemiBold (600)** | `#E6E6E6` |
| Labels / kickers / sektions-overskrifter | Crimson Text | Regular, **VERSALER + spatiering** | `#C0C0C0` |

- Alle fire varianter (400, 400 italic, 600, 700) findes gratis på **Google Fonts → "Crimson Text"**.
- Decket indlejrer også "Play" (sans) ét enkelt sted — ubetydeligt, ignorér.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

---

## 3. Linjetykkelser

Aflæst fra kilden — tynde, elegante linjer:

- **Adskiller-/understregningslinjer:** ~`0,75 pt` (deck-målt 0,72 pt). På web: ca. `1px` (op til `1.5px` på hi-dpi).
- **Data-/grafkurver:** ~`1,5–1,7 pt`.

Undgå tykke streger — de bryder det rolige, redaktionelle udtryk.

---

## 4. Logo

- Wordmark: **SURFACE / CAPITAL** stablet, med en vandret streg imellem.
- Master findes sort (`Surface_Capital_logo_Black.png`). På navy baggrund: recolor til **`#E6E6E6`**.
- Hold beskeden størrelse; typisk placeret diskret (fx nederste hjørne) — ikke dominerende.

---

## 5. Billeder

Decket har **ingen levende billed-effekter** (ingen opacitet/gradient/duotone i filen) — al Photoshop-behandling er fladet ind i de eksporterede billeder, og PSD'erne findes ikke. På web betyder det:

- Mørkning/overlay til tekstlæsbarhed laves i **CSS** (fx et navy-lag oven på fotos ved behov), ikke forventet bagt ind i billederne.
- Foto-stil i decket: rolige, naturnære/bjerg-motiver i afdæmpede toner.

---

## 6. Overordnet udtryk

Tilbageholdt, redaktionelt og roligt: **navy flade, én serif i lysegrå (#E6E6E6), og guld kun som tynde adskillere.** Premium og afdæmpet — hierarki via typografi, ikke via mange farver. Tænk "value-investor / institutionel", ikke "tech-startup".

---

## 7. CSS-variabler (klar til brug)

```css
:root {
  /* farver */
  --sc-navy:        #19303D;  /* baggrund */
  --sc-gold:        #FFBA00;  /* KUN adskillere / datakurve */
  --sc-text:        #E6E6E6;  /* titler + brød (ingen ren hvid) */
  --sc-silver:      #C0C0C0;  /* labels, kickers, fin print */
  --sc-panel:       #20404D;  /* valgfrit kort-/panel-fyld */
  --sc-panel-edge:  #7A6422;  /* valgfri dæmpet guldkant */

  /* typografi */
  --sc-serif: "Crimson Text", Georgia, serif;
  --sc-w-regular: 400;
  --sc-w-semibold: 600;  /* tal */
  --sc-w-bold: 700;      /* titler */

  /* linjer */
  --sc-rule: 1px;        /* guld adskiller (~0,75pt) */
}

body { background: var(--sc-navy); color: var(--sc-text); font-family: var(--sc-serif); }
h1, h2, h3 { font-weight: var(--sc-w-bold); color: var(--sc-text); }
.kicker, .eyebrow, .label {           /* underoverskrifter/labels */
  color: var(--sc-silver);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: var(--sc-w-regular);
}
.figure, .stat-number { font-weight: var(--sc-w-semibold); }   /* tal */
.title-rule {                          /* guld understregning under titel */
  height: var(--sc-rule);
  background: var(--sc-gold);
  border: 0;
}
em, .credit, .caption { font-style: italic; }
```

---

*Sidst opdateret ud fra deck-kilden. Hvis brandet udvikler sig (fx en officiel grøn til grafer, eller faste fotos), tilføj dem her, så filen forbliver den ene sandhed.*
