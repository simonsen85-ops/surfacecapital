# Surface Capital website: working notes for Claude Code

Static, multipage website for **Surface Capital A/S** (CVR 45991296), a Danish self-managing AIF.
Owner: Rasmus Wisti Simonsen. Live at **www.surfacecapital.dk**.

## How the site works
- Plain HTML/CSS/JS. **No build step, no dependencies.** Edit the files directly.
- Hosted on **GitHub Pages** from `main` (repo `simonsen85-ops/surfacecapital`). A push to `main` goes
  live within a few minutes. `CNAME` = `www.surfacecapital.dk`. Do not delete it.
- All pages share `css/style.css`, `js/main.js`, the nav, the footer and the professional-investor gate
  (sessionStorage key `sc-investor-ack`). The gate means the site needs JavaScript.
- Preview locally with `python -m http.server` and accept the gate before checking a page.

| File | Content |
|---|---|
| `index.html` | Home: hero, Munger quote, "Om fonden", "Et partnerskab", track record teaser (static figures) |
| `partnerskab.html` | Principles of the partnership (6 rules) |
| `tilgang.html` | Investment approach (6 principles) |
| `performance.html` + `js/performance.js` | Interactive chart, 2016–2025 track record + the fund's own quarters from 2026 |
| `trackrecord.html` + `js/trackrecord.js` + `js/trackrecord-data.js` | Private portfolio TWR track record with per-position deep dives |
| `forvalter.html`, `vilkaar.html`, `materialer.html`, `kontakt.html` | Manager bio, terms, documents, contact |
| `tools/build_trackrecord_data.py` | Generates `js/trackrecord-data.js` from the Portfolio Performance XML export (not in the repo) |

## Data: where every figure comes from
**Rule: Rasmus is the source.** Never invent, estimate or carry over figures from older files. If a primary
source is missing, stop and ask him for it.

- **Performance data lives in one place:** the top of `js/performance.js` (`SERIES`, `SURFACE`).
  The static figures in `index.html` and `performance.html` (teaser / no-JS fallback) must match it.
- 2016–2025 portfolio (before/after fees): the IRR workbook
  `Historisk_performance_-_Surface_Capital_-_IRR_beregninger opdateret 15-10-2026.xlsx` (Google Drive,
  `Firma/investeringer/Surface Capital/`). After fees: 18,84 % p.a., index 562,08. Before fees: 22,01 %, 2025 = 24,8 %.
  The performance fee is 20 % of the excess return over MSCI ACWI **after** the 1 % management fee, measured
  in percent of opening NAV, and only charged in years with a positive return. The older 17,90 % / 519
  calculation is withdrawn. Never use it.
- **MSCI ACWI** = Net Total Return, **USD**, index 892400 (MSCI factsheet). 2016–2025:
  7.9, 24.0, −9.4, 26.6, 16.3, 18.5, −18.4, 22.2, 17.5, 22.34. **The same series must be used on the
  performance page, the track record page, the deck and Bilag 1.**
- **S&P 500 (EUR-hedged)** = BlackRock benchmark row for iShares S&P 500 EUR Hedged UCITS ETF (IE00B3ZW0K18):
  9.6, 18.7, −7.8, 26.8, 15.1, 27.0, −21.0, 22.2, 22.5, 15.1 (corrected Nov 2026; the old 12,8 for 2025 was wrong).
- **S&P 500 Acc (USD)** = S&P 500 Net TR, USD.
- Fund quarters 2026 (`SURFACE.quarters`, `sinceStart`): from the NAV workbook / the investor letter.
  The benchmark is currently MSCI ACWI USD (Rasmus's 892400 exports in `Løbende performance/`).
- Track record headline (`OFFICIAL` in `tools/build_trackrecord_data.py`): from Rasmus's Portfolio
  Performance dashboard (631,73 % cum., 22,01 % p.a., IRR 19,81 %, max DD 29,65 %). If you change `OFFICIAL`,
  either regenerate with the XML or patch `js/trackrecord-data.js` the same way.
- "akkumuleret" on the site means **cumulative gain** (index − 100), e.g. index 562 = "462 % akkumuleret".

## Design system (strict). Full spec: `docs/design-system.md`
- Navy `#19303D` background. Text `#E6E6E6` (never pure white). Labels and kickers `#C0C0C0` in UPPERCASE with letter-spacing.
- Gold `#FFBA00` **only** for thin separator lines and the main data curve. **Never** for text, numbers or labels.
- Panels `#20404D` with border `#7A6422`. Font: **Crimson Text only** (self-hosted in `assets/fonts/`).
- Hierarchy comes from size, weight and caps, not colour. Rules are ~1px. Restrained, editorial, institutional tone.
- Prose width is set by one variable: `--measure` in `css/style.css`.

## Copy rules (Danish)
- All site content is in Danish. Danish number format: `18,84 %`, `5,0 mio. kr.`, the abbreviation `p.t.` (not `pt.`).
- **No em dashes** in copy. Use commas, colons or full stops. The only exception is the "— Charlie Munger" attribution.
  En dashes in ranges (2016–2025, 5–10) are correct.
- Poker is described as "professionel pokerspiller".
- The 2016–2025 figures are **the manager's personal track record from before the fund**. Always label them as
  such. Never present them as the fund's own results. The fund's own figures start in 2026.
- Don't name-drop Buffett/Berkshire on the site.
- Don't use the email or amounts from old files. Contact: kontakt@surfacecapital.dk. The manager's own capital: p.t. 5,0 mio. kr.

## Workflow
- Small commits with clear messages. Always show the diff and get Rasmus's OK **before pushing to `main`**
  (a push publishes immediately).
- Check pages in a browser (desktop and mobile width) before committing.

## Open items (as of 16 Nov 2026)
1. Replace `assets/deck/Surface_Capital_Investorpraesentation.pdf` with a PDF export of the Google Slides deck
   "Surface Capital 10 år – v2" (the master for the deck). Keep the file name.
2. Remove unused files (nothing references them): `assets/deck/Surface_Capital_Praesentation.pdf`
   (old version with an outlook email and 3,0 mio, still publicly downloadable), `assets/img/hero.jpg`, `wordmark.png`,
   `wordmark_reflection.png`. Update `README.md`, which is out of date (it describes 7 pages and old files).
3. **Restate ALL benchmarks in DKK, including 2016–2025** (decided 16 Nov 2026).
   **Run it step by step following `docs/RUNBOOK-dkk-benchmark.md`.** Tools: `tools/bilag1.py` (fee waterfall +
   Bilag 1, with a regression test) and `data/track_record_2016_2025.csv` (all series with sources). Summary: The portfolio returns
   are measured in DKK (Portfolio Performance), so the benchmark must be in DKK too. Today's USD figures are
   a currency mismatch. Danish funds use "MSCI ACWI Net, DKK" (e.g. BankInvest), but msci.com only offers
   EUR for free. Method: Rasmus exports MSCI ACWI Net in **EUR** (index levels, year-end 2015–2025 and
   quarter-end 2026) → convert the levels with the **ECB's EUR/DKK reference rates** on the same dates (primary,
   free) → DKK returns. The DKK peg (EUR/DKK ≈ 7,43–7,47) means the difference from EUR is only a few tenths of a percentage point a year,
   so the method is close to exact. Cross-check a few years against a Danish fund's published DKK benchmark.
   Then: recalculate the after-fee series
   in the IRR workbook (the fee depends on the hurdle) → update `js/performance.js`, the static figures in
   `index.html`/`performance.html`, `OFFICIAL.acwi` (track record), Bilag 1 and the deck in one pass. S&P 500 Acc
   must also be in DKK (or dropped). The EUR-hedged series is already hedged to EUR ≈ DKK. Label the currency everywhere.
4. In the deck (Google Slides, done by Rasmus): slide 7 should say "S&P 500 Acc (USD)" (not "MSCI S&P …") and "631 %" (not 630).
