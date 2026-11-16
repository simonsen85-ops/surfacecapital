# Runbook: switch every benchmark to DKK (one run)

Decided by Rasmus, 16 Nov 2026. The portfolio returns are in DKK (Portfolio Performance), so every benchmark on
the site, in Bilag 1 and in the deck must be in DKK as well, including 2016–2025. Follow the steps in order.
**Stop and ask Rasmus** when a check fails or a step says STOP.

## 0. Ask Rasmus before you start (one round of questions)
1. S&P 500 (EUR-hedged): **drop it** (recommended: the portfolio carries currency risk, so the unhedged
   S&P in DKK is the fair comparison) or keep it as a secondary series?
2. Does the IRR workbook (`Historisk_performance_-_Surface_Capital_-_IRR_beregninger opdateret 15-10-2026.xlsx`)
   get a **new copy** with the DKK figures? Recommendation: yes, saved as a new file. Never overwrite the original.

## 1. Fetch the primary data (save everything raw under `data/raw/`)
**A. MSCI ACWI Net in EUR** (or DKK if the currency list offers DKK, which is even better):
- Tool: https://www-cdn.msci.com/web/msci/index-tools/end-of-day-index-data-search
  Index: **MSCI ACWI** (code **892400**), variant **Net**, currency **EUR** (or DKK).
- Fetch **index levels** (not returns) for these dates: 2015-12-31, 2016-12-31 … 2025-12-31, 2026-03-31,
  2026-06-30, 2026-09-30. If a date isn't a trading day, use the last level on or before it, and log which date you used.
- The tool is a JavaScript page. Use a browser, or the JSON/Excel export behind it. If neither works:
  STOP and ask Rasmus to export the file manually (as he did with the 892400 files in `Løbende performance/`)
  and save it in `data/raw/`.

**B. Exchange rates from the ECB** (primary source, free):
- EUR/DKK and EUR/USD reference rates, daily, from 2015-12-01 onwards, e.g.
  `https://data-api.ecb.europa.eu/service/data/EXR/D.DKK.EUR.SP00.A?startPeriod=2015-12-01&format=csvdata`
  and the same for `D.USD.EUR.SP00.A`. Use the last fixing on or before each date from step A.
  Alternative source: Danmarks Nationalbank.

## 2. Calculate DKK returns (script it, e.g. `tools/benchmarks_dkk.py`, and keep the script in the repo)
- **ACWI DKK, route 1 (main):** level_DKK = level_EUR × EURDKK(date) → yearly and quarterly returns.
- **ACWI DKK, route 2 (check):** (1 + acwi_usd) × (USDDKK_end / USDDKK_start) − 1, where USDDKK = EURDKK / EURUSD,
  using `acwi_usd` from `data/track_record_2016_2025.csv`. **The two routes must agree within 0,15 percentage points
  every year.** If they don't: STOP and show Rasmus the table.
- **S&P 500 DKK (unhedged):** (1 + sp500_usd) × (USDDKK_end / USDDKK_start) − 1.
  Check 2019–2025 against YCharts S&P 500 Net TR EUR (^SPXNTREUR: 2019 33,10 · 2020 8,03 · 2021 37,89 ·
  2022 −13,17 · 2023 21,41 · 2024 32,82 · 2025 3,54) converted to DKK. They should agree within ~0,3 percentage points.
- Sanity check: Danish funds report "MSCI All Countries World, netto DKK" (e.g. BankInvest Globale Aktier).
  If you find official DKK figures for one or two years, compare with them.
- Write the results into the `acwi_dkk` and `sp500_dkk` columns of `data/track_record_2016_2025.csv` (two decimals)
  and update the comment lines with the source and the date. Also store the 2026 quarters (ACWI DKK per quarter).

## 3. Recalculate the after-fee series
- `python tools/bilag1.py --bench acwi_usd --check` must print REGRESSION OK (proves the model matches the workbook).
- `python tools/bilag1.py --bench acwi_dkk --png` → new after-fee series, final NAV, IRR and Bilag 1 as a PNG in
  `tools/out/`. (PNG requires `pip install playwright` + `playwright install chromium`.)
- Show Rasmus the year-by-year table (before fees, ACWI DKK, performance fee, after fees) next to the USD version.

## 4. Update the website
- `js/performance.js`: the `efter` series (the `ra` column from step 3), `msci` = acwi_dkk with name "MSCI ACWI (DKK)",
  `spacc` = sp500_dkk with name "S&P 500 (DKK)", `speh` according to decision 0.1. `SURFACE.quarters[].bench` and
  `sinceStart.bench` in DKK. **Do not change** `port`/`gross` (the fund's own figures). Update the source comment at the top.
- Static figures in `index.html` (teaser) and `performance.html` (fallback), which must match the JS exactly.
  "akkumuleret" = index − 100. Before fees (22,01 % / 631 %) is unchanged. Grep for the old numbers (11,73 · 203 ·
  14,26 · 279 · 18,84 · 462 · 13,03) so nothing is missed.
- Track record: `OFFICIAL["acwi"]` in `tools/build_trackrecord_data.py` **and** the same array in
  `js/trackrecord-data.js`. Change the text in `trackrecord.html` to "Benchmark: MSCI ACWI Net Total Return (DKK)."
- State the currency (DKK) wherever a benchmark is named.

## 5. Workbook copy (if decision 0.2 = yes)
- Copy the IRR workbook to `…IRR_beregninger DKK <date>.xlsx` (same folder). Put the DKK figures in the benchmark
  columns (ACWI, S&P), fix the EUR-hedged column (or remove it), update the headers with the currency. Keep the
  formulas and set the workbook to recalculate on open. Ask Rasmus to open it in Excel and confirm that
  "IRR efter fees" matches step 3.

## 6. Deck (Google Slides "Surface Capital 10 år – v2": Rasmus does this himself)
Write `docs/deck-updates.md` with the exact new texts for slide 7 (after fees % and akkumuleret, ACWI DKK,
S&P 500 DKK, benchmark note), the "*MSCI ACWI Index" footnote → "(DKK)", the location of the new Bilag 1 PNG,
and a CSV for the Excel graph (`data/index_series_dkk.csv`: yearly index levels, 2015 = 100, all series).

## 7. Check, show, push
- Preview with `python -m http.server`: index, performance (toggle all series, period selector), trackrecord.
  Check desktop and mobile widths and the console for errors.
- Show Rasmus the full diff and the key figures (old vs new). **Push to `main` only after his OK.**
- Then: tell Rasmus that the Build folders on Drive can be deleted, and that the NAV workbook / investor letters
  are untouched (no fees have been charged, and investors are told about the DKK benchmark separately).
