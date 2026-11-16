# Deck updates: DKK benchmark (Google Slides "Surface Capital 10 år – v2")

Rasmus does these edits by hand. Figures come from `data/track_record_2016_2025.csv` and
`tools/bilag1.py --bench acwi_dkk` (16 Nov 2026). The website shows the same numbers.

Benchmark decision: **MSCI ACWI Net Total Return in DKK** is the benchmark and the performance-fee hurdle,
in the same currency as the portfolio. USD figures are shown for comparison only. S&P 500 EUR-hedged is dropped.

## Slide 7: track record 2016–2025 (p.a. and cumulative)

| Series | p.a. | Cumulative ("akkumuleret") | Before (USD hurdle) |
|---|---|---|---|
| Porteføljen efter fees | **18,60 %** | **451 %** | 18,84 % / 462 % |
| Porteføljen før fees | 22,01 % | 631 % (not 630) | unchanged |
| MSCI ACWI (DKK) | **10,86 %** | **181 %** | new |
| MSCI ACWI (USD) | 11,73 % | 203 % | was the main benchmark |
| S&P 500 (DKK) | **13,38 %** | **251 %** | new |
| S&P 500 (USD) | 14,26 % | 279 % | label: "S&P 500 Acc (USD)", not "MSCI S&P …" |

Merafkast p.a. after fees vs. MSCI ACWI (DKK): **+7,73 %-point** (was +7,11 vs. USD).

Benchmark note on the slide (Danish copy, no em dashes):

> Benchmark: MSCI ACWI Net Total Return i DKK, samme valuta som porteføljen. USD vises til sammenligning.

## Footnote

`*MSCI ACWI Index` → `*MSCI ACWI Net Total Return Index (DKK)`

## Bilag 1 (fee waterfall)

New PNG: `tools/out/Surface_Capital_Bilag1_Performance_og_fees_acwi_dkk.png`
(regenerate: `python tools/bilag1.py --bench acwi_dkk --png`). The table ends at NAV 550,54, IRR after fees 18,60 %.
Column header now reads "MSCI ACWI (DKK) årligt afkast", note line "Benchmark: MSCI ACWI Net Total Return (DKK)."

## Excel graph

`data/index_series_dkk.csv`: yearly index levels, end-2015 = 100, columns: after fees, before fees,
MSCI ACWI DKK, MSCI ACWI USD, S&P 500 DKK, S&P 500 USD. End-2025 levels: 550,54 / 730,90 / 280,50 / 303,16 / 350,96 / 379,15.

## Fund quarters 2026 (if the deck shows them)

MSCI ACWI (DKK): Q1 −1,29 %, Q2 +15,86 %, Q3 +2,28 %, since start +16,98 %.
(USD, as before: −3,21 / +14,93 / +1,60 / +13,03.) Fund figures themselves are unchanged.

## Workbook

DKK copy: `Historisk_performance_-_Surface_Capital_-_IRR_beregninger DKK 2026-11-16.xlsx` (same Drive folder),
sheet "10 års performance". Open it in Excel and confirm that "IRR efter fees" shows 18,60 % and NAV 550,54.
The original workbook is untouched. The "6 års" and "5 års" sheets were not changed.
