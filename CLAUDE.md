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
- The working copy is kept outside Google Drive (a synced `.git` folder can get corrupted); GitHub is the backup and
  history. The old `Build N` folders on Drive were removed 16 Nov 2026. Deck images (Bilag) live on Drive in `Præsentationer/Bilag/`.

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
- **All series and their sources: `data/track_record_2016_2025.csv`.** Benchmarks are recalculated with
  `tools/benchmarks_dkk.py` (raw MSCI/ECB data in `data/raw/`, kept locally, not in git), fees with `tools/bilag1.py`.
- **Benchmark = MSCI ACWI Net Total Return in DKK** (index 892400, DKK series directly from MSCI; decided by
  Rasmus 16 Nov 2026), the same currency as the portfolio. It is also the performance-fee hurdle. USD is shown
  alongside for comparison only (homepage tiles, toggles on the performance page). **The same series must be
  used on the performance page, the track record page, the deck and Bilag 1.**
  ACWI DKK 2016–2025: 10.69, 9.04, −4.63, 29.10, 6.24, 27.44, −13.03, 18.35, 25.38, 8.03 (10,86 % p.a.).
  ACWI USD: 7.9, 24.0, −9.4, 26.6, 16.3, 18.5, −18.4, 22.2, 17.5, 22.34 (11,73 % p.a.).
- 2016–2025 portfolio: before fees 22,01 % (2025 = 24,8 %), Portfolio Performance. After fees (DKK hurdle):
  18,60 % p.a., NAV 550,54, from `tools/bilag1.py --bench acwi_dkk`; DKK workbook copy
  `Historisk_performance_-_Surface_Capital_-_IRR_beregninger DKK 2026-11-16.xlsx` (Google Drive,
  `Firma/investeringer/Surface Capital/`). The 18,84 % / 562,08 figures (USD hurdle, original workbook
  `… opdateret 15-10-2026.xlsx`) are superseded, and `bilag1.py --bench acwi_usd --check` still reproduces them as a regression test.
  The performance fee is 20 % of the excess return over the benchmark **after** the 1 % management fee, measured
  in percent of opening NAV, and only charged in years with a positive return. The older 17,90 % / 519
  calculation is withdrawn. Never use it.
- **S&P 500** = Net TR, USD; the DKK version is converted with EUR/USD at 4 pm London (backed out from MSCI's
  USD/EUR levels) × ECB EUR/DKK, matching YCharts within 0,15 pp. Not the ECB EUR/USD fix (14:15 CET), which
  is off by up to 1 pp. S&P 500 EUR-hedged is dropped (decision 16 Nov 2026).
- Fund quarters 2026 (`SURFACE.quarters`, `sinceStart`): fund figures from the NAV workbook / the investor letter.
  `bench` = MSCI ACWI DKK, `benchUsd` = MSCI ACWI USD, from `data/acwi_quarters_2026.csv`. Each new quarter:
  re-download the MSCI data and rerun `tools/benchmarks_dkk.py --write` (add the quarter end to `Q_ENDS`).
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
1. `assets/deck/Surface_Capital_Investorpraesentation.pdf` = PDF export of the Google Slides deck "Surface Capital 10 år – v2"
   (the master). Re-export via the Drive connector (export as application/pdf) after each deck change. Keep the file name.
2. Remove unused files (nothing references them): `assets/deck/Surface_Capital_Praesentation.pdf`
   (old version with an outlook email and 3,0 mio, still publicly downloadable), `assets/img/hero.jpg`, `wordmark.png`,
   `wordmark_reflection.png`. Update `README.md`, which is out of date (it describes 7 pages and old files).
3. ~~Restate ALL benchmarks in DKK~~ **Done on the site 16 Nov 2026** (see Data above). Remaining: Rasmus checks the
   DKK workbook in Excel and updates the deck per `docs/deck-updates.md`. Original plan, for reference:
   `docs/RUNBOOK-dkk-benchmark.md`. Tools: `tools/bilag1.py` (fee waterfall +
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
